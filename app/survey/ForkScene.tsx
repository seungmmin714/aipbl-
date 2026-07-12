"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { getSceneAssets, getSceneTheme, type SceneTheme } from "@/lib/scenes";

/* ─── 전환 타이밍 상수 — page.tsx의 진행 로직(setTimeout)과 동기화되어야 한다 ─── */
/** 캐릭터가 선택한 길로 걸어가는 시간 (트렁크 직진 → 갈래길 곡선을 따라 진입) */
export const CHARACTER_WALK_MS = 1900;
/** 카메라 팬 이동(장면 전환) 시간 */
export const CAMERA_PAN_MS = 900;
/** prefers-reduced-motion: 걷기 생략, 빠른 크로스페이드 */
export const REDUCED_WALK_MS = 80;
export const REDUCED_PAN_MS = 300;

const PERSPECTIVE = 1200;
const PAN_EASE: [number, number, number, number] = [0.45, 0.05, 0.25, 1];

/* 레이어별 깊이(translateZ)와 카메라 팬 시 이동량.
   전경일수록 크게 움직여 패럴랙스 깊이감을 만든다. */
const LAYER_CONFIG = {
  background: { z: -420, panXPct: 7, panYPct: 2 },
  road: { z: -160, panXPct: 16, panYPct: 6 },
  foreground: { z: 40, panXPct: 22, panYPct: 9 },
} as const;

type LayerKind = keyof typeof LAYER_CONFIG;
export type RoadSide = "left" | "right";
export type TravelerPhase = "idle" | "walk" | "pan";

export interface SurveyQuestion {
  id: string;
  axis: string;
  text: string;
  options: { label: string; value: string }[];
}

interface ForkSceneProps {
  question: SurveyQuestion;
  index: number;
  total: number;
  /** 이전에 이 문항에 답했던 값 (이전 버튼으로 되돌아온 경우 하이라이트용) */
  selectedValue: string | null;
  /** 걷기 중 선택된 방향 (버튼 하이라이트용 — 걷기 끝나면 null) */
  walkSide: RoadSide | null;
  /** 카메라 팬 방향 (장면 exit/enter 슬라이드용 — 전환이 끝날 때까지 유지) */
  panSide: RoadSide | null;
  isTransitioning: boolean;
  onChoose: (value: string, side: RoadSide) => void;
}

/** 실제 일러스트 이미지 — 로드 성공 시 플레이스홀더 위를 덮고, 없으면(404) 숨겨진다 */
function LayerImage({ src }: { src: string }) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  if (failed) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      aria-hidden="true"
      draggable={false}
      onLoad={() => setLoaded(true)}
      onError={() => setFailed(true)}
      className={`absolute inset-0 h-full w-full object-cover select-none transition-opacity duration-300 ${
        loaded ? "opacity-100" : "opacity-0"
      }`}
    />
  );
}

/* ─── 플레이스홀더 아트 (단색 그라데이션 + 단순 SVG 도형, 화이트&블루 톤) ─── */

function BackgroundArt({ theme, uid }: { theme: SceneTheme; uid: string }) {
  const skyId = `sky-${uid}`;
  return (
    <svg
      className="absolute inset-0 h-full w-full"
      viewBox="0 0 800 1200"
      // 화면 비율과 무관하게 구도 유지 (전 레이어 동일한 스트레치)
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={skyId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={theme.skyTop} />
          <stop offset="100%" stopColor={theme.skyBottom} />
        </linearGradient>
      </defs>
      <rect width="800" height="1200" fill={`url(#${skyId})`} />
      {/* 해 — 주황 해 + 옅은 광륜 (질문 텍스트와 겹치지 않게 왼쪽 상단) */}
      <circle cx="175" cy="170" r="110" fill={theme.sun} opacity="0.3" />
      <circle cx="175" cy="170" r="62" fill={theme.sun} />
      {/* 구름 — 크림빛 */}
      <g fill="#fdf6e3" opacity="0.95">
        <ellipse cx="360" cy="115" rx="85" ry="20" />
        <ellipse cx="625" cy="165" rx="80" ry="19" />
      </g>
      {/* 새 — 질문 텍스트 영역(상단 중앙)을 피해 좌우 가장자리에 배치 */}
      <g stroke="#5a6b8c" strokeWidth="4" strokeLinecap="round" fill="none" opacity="0.8">
        <path d="M 155 430 q 11 -10 22 0 q 11 -10 22 0" />
        <path d="M 625 438 q 9 -8 18 0 q 9 -8 18 0" />
      </g>
      {/* 왼쪽: 초록 산맥 (숲길 방향) */}
      <g>
        <polygon points="20,560 170,320 320,560" fill={theme.hillFar} />
        <polygon points="140,560 280,290 420,560" fill={theme.hillNear} />
        <polygon points="259,331 280,290 301,331 280,315" fill="#ffffff" opacity="0.92" />
        <polygon points="0,560 70,430 190,560" fill={theme.hillNear} opacity="0.85" />
      </g>
      {/* 오른쪽: 블루그레이 도시 실루엣 (도시 방향) */}
      <g>
        <rect x="520" y="450" width="50" height="110" fill={theme.city} />
        <rect x="578" y="405" width="56" height="155" fill={theme.city} opacity="0.88" />
        <rect x="642" y="465" width="46" height="95" fill={theme.city} />
        <rect x="694" y="420" width="56" height="140" fill={theme.city} opacity="0.9" />
        <rect x="756" y="470" width="44" height="90" fill={theme.city} />
        <g fill={theme.cityLight}>
          <rect x="531" y="466" width="10" height="12" />
          <rect x="549" y="466" width="10" height="12" />
          <rect x="531" y="492" width="10" height="12" />
          <rect x="592" y="421" width="10" height="12" />
          <rect x="612" y="421" width="10" height="12" />
          <rect x="592" y="449" width="10" height="12" />
          <rect x="654" y="481" width="9" height="11" />
          <rect x="708" y="436" width="10" height="12" />
          <rect x="726" y="436" width="10" height="12" />
          <rect x="708" y="464" width="10" height="12" />
          <rect x="768" y="486" width="9" height="11" />
        </g>
      </g>
    </svg>
  );
}

function RoadArt({ theme }: { theme: SceneTheme }) {
  return (
    <svg
      className="absolute inset-0 h-full w-full"
      viewBox="0 0 800 1200"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      {/* 들판 — 지평선 약 47% */}
      <rect y="560" width="800" height="640" fill={theme.ground} />
      {/* 3인칭 Y자 갈림길: 하단 중앙의 긴 길이 화면 약 58% 지점 분기점에서
          좌/우 화면 가장자리로 갈라진다 (캐릭터가 트렁크를 따라 걸어 올라가는 구도) */}
      <path
        d="M 352 1200
           C 358 1030, 370 850, 381 730
           C 300 706, 180 676, -30 636
           L -30 596
           C 180 648, 310 676, 400 690
           C 490 676, 620 648, 830 596
           L 830 636
           C 620 676, 500 706, 419 730
           C 430 850, 442 1030, 448 1200
           Z"
        fill={theme.road}
        stroke={theme.roadEdge}
        strokeWidth="4"
        strokeOpacity="0.7"
        strokeLinejoin="round"
      />
      {/* 길 위 자갈 점 */}
      <g fill={theme.roadEdge} opacity="0.55">
        <ellipse cx="394" cy="830" rx="7" ry="4" />
        <ellipse cx="409" cy="930" rx="5" ry="3" />
        <ellipse cx="391" cy="1030" rx="6" ry="3.5" />
        <ellipse cx="406" cy="1130" rx="5" ry="3" />
        <ellipse cx="295" cy="688" rx="5" ry="3" />
        <ellipse cx="505" cy="688" rx="5" ry="3" />
      </g>
      {/* 들판 위 소품 — 왼쪽 침엽수(갈래길 아래), 오른쪽 둥근 수풀 */}
      <g fill={theme.bushDark}>
        <polygon points="125,780 150,720 175,780" />
        <rect x="145" y="780" width="10" height="16" fill={theme.treeTrunk} />
        <polygon points="212,740 232,692 252,740" />
        <rect x="228" y="740" width="8" height="13" fill={theme.treeTrunk} />
        <polygon points="45,840 75,772 105,840" />
        <rect x="69" y="840" width="11" height="18" fill={theme.treeTrunk} />
      </g>
      <g fill={theme.bush}>
        <circle cx="668" cy="768" r="26" />
        <circle cx="706" cy="778" r="17" />
      </g>
    </svg>
  );
}

function ForegroundArt({ theme, uid }: { theme: SceneTheme; uid: string }) {
  const vignetteId = `vignette-${uid}`;
  return (
    <svg
      className="absolute inset-0 h-full w-full"
      viewBox="0 0 800 1200"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={vignetteId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#2e5c22" stopOpacity="0" />
          <stop offset="100%" stopColor="#2e5c22" stopOpacity="0.12" />
        </linearGradient>
      </defs>
      {/* 하단 근경 언덕 밴드 (밝은 초록) — 길이 지나가는 부분은 비워둔 곡선 */}
      <path
        d="M 0 1200 L 0 1105 Q 180 1058 348 1096 L 348 1200 Z"
        fill={theme.groundLight}
      />
      <path
        d="M 452 1200 L 452 1096 Q 620 1058 800 1105 L 800 1200 Z"
        fill={theme.groundLight}
      />
      {/* 하단 비네트 */}
      <rect y="1080" width="800" height="120" fill={`url(#${vignetteId})`} />
    </svg>
  );
}

/* ─── 3인칭 캐릭터 (page.tsx에서 장면 위에 렌더링, 장면 전환과 무관하게 유지) ─── */

/* 도로 레이어의 변환(-inset 12% 오버사이즈 + 원근 보정 scale)을 반영해
   장면(viewBox 800×1200) 좌표 → 뷰포트(vw/vh) 좌표로 변환한다.
   이 매핑이 있어야 캐릭터가 화면상 실제 도로 위에 정확히 선다. */
const ROAD_SCALE = (PERSPECTIVE - LAYER_CONFIG.road.z) / PERSPECTIVE;
function sceneToViewport(vx: number, vy: number): { x: string; y: string } {
  const map = (frac: number) => 50 + (-12 + frac * 124 - 50) * ROAD_SCALE;
  return {
    x: `${map(vx / 800).toFixed(2)}vw`,
    y: `${map(vy / 1200).toFixed(2)}vh`,
  };
}

/* 캐릭터 대기 위치 — 트렁크 길 아래쪽 */
const CHAR_BASE = { ...sceneToViewport(400, 940), scale: 1 };

/* 걷기 경로 — 도로 중심선을 따라가는 경유점들.
   트렁크 직진 → 분기점 진입 → 갈래길 곡선을 따라 이동 (viewBox 좌표 + scale) */
const CHAR_PATHS: Record<RoadSide, { x: string[]; y: string[]; scale: number[] }> = (() => {
  const build = (pts: [number, number, number][]) => ({
    x: pts.map((p) => sceneToViewport(p[0], p[1]).x),
    y: pts.map((p) => sceneToViewport(p[0], p[1]).y),
    scale: pts.map((p) => p[2]),
  });
  return {
    left: build([
      [400, 940, 1],
      [400, 810, 0.94],
      [399, 735, 0.88],
      [335, 700, 0.82],
      [240, 668, 0.74],
      [145, 646, 0.66],
    ]),
    right: build([
      [400, 940, 1],
      [400, 810, 0.94],
      [401, 735, 0.88],
      [465, 700, 0.82],
      [560, 668, 0.74],
      [655, 646, 0.66],
    ]),
  };
})();
/* 경유점 타이밍: 절반은 트렁크 직진, 나머지 절반 동안 갈래길 커브를 따라간다 */
const PATH_TIMES = [0, 0.32, 0.5, 0.64, 0.82, 1];
const PATH_EASES = ["easeIn", "linear", "linear", "linear", "easeOut"] as const;

export function TravelerCharacter({
  phase,
  side,
  reduced,
}: {
  phase: TravelerPhase;
  side: RoadSide | null;
  reduced: boolean;
}) {
  const walking = phase === "walk" && side !== null && !reduced;
  const walkS = CHARACTER_WALK_MS / 1000;
  const pathEases = [...PATH_EASES];

  return (
    <div className="pointer-events-none absolute inset-0 z-10" aria-hidden="true">
      <motion.div
        className="absolute left-0 top-0"
        initial={false}
        animate={
          walking && side
            ? {
                // 도로 중심선 경유점들을 순서대로 따라간다
                x: CHAR_PATHS[side].x,
                y: CHAR_PATHS[side].y,
                scale: CHAR_PATHS[side].scale,
                // 걸을 때 좌우로 갸우뚱거리는 걸음 wobble
                rotate: [0, -4, 4, -4, 4, -4, 4, 0],
              }
            : { x: CHAR_BASE.x, y: CHAR_BASE.y, scale: CHAR_BASE.scale, rotate: 0 }
        }
        transition={
          walking
            ? {
                duration: walkS,
                x: { duration: walkS, times: PATH_TIMES, ease: pathEases },
                y: { duration: walkS, times: PATH_TIMES, ease: pathEases },
                scale: { duration: walkS, times: PATH_TIMES, ease: pathEases },
                rotate: {
                  duration: walkS,
                  times: [0, 0.14, 0.29, 0.43, 0.57, 0.71, 0.86, 1],
                },
              }
            : phase === "pan" && !reduced
              ? { duration: CAMERA_PAN_MS / 1000, ease: PAN_EASE }
              : { duration: reduced ? 0 : 0.3 }
        }
      >
        {/* 기준점(x/y)이 발끝이 되도록 위로 올려서 그린다 */}
        <div className="relative -translate-x-1/2 -translate-y-full">
          {/* 고민 말풍선 — 대기 상태에서만 표시 (꼬리 점 포함) */}
          <motion.div
            className="absolute -right-12 -top-12"
            initial={false}
            animate={{ opacity: phase === "idle" ? 1 : 0, y: phase === "idle" ? [0, -3, 0] : 0 }}
            transition={{
              opacity: { duration: 0.25 },
              y: reduced ? { duration: 0 } : { duration: 2.2, repeat: Infinity, ease: "easeInOut" },
            }}
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-lg font-black text-slate-700 shadow-md">
              ?
            </div>
            <div className="absolute -bottom-1.5 -left-1 h-2.5 w-2.5 rounded-full border border-slate-200 bg-white shadow-sm" />
            <div className="absolute -bottom-3.5 -left-3 h-1.5 w-1.5 rounded-full border border-slate-200 bg-white" />
          </motion.div>
          {/* 미니멀 실루엣 캐릭터 — 걷는 동안 다리가 앞뒤로 교차 스윙 */}
          <svg
            width="46"
            height="64"
            viewBox="0 0 46 64"
            className="overflow-visible drop-shadow-md"
          >
            {/* 먼 쪽 다리 (약간 어둡게) */}
            <motion.g
              style={{ transformBox: "fill-box", transformOrigin: "50% 8%" }}
              initial={false}
              animate={{ rotate: walking ? [0, -24, 24, -24, 24, -24, 24, 0] : 0 }}
              transition={
                walking
                  ? { duration: walkS, ease: "linear" }
                  : { duration: 0.2 }
              }
            >
              <rect x="24.5" y="42" width="8" height="21" rx="4" fill="#22305a" />
            </motion.g>
            {/* 가까운 쪽 다리 */}
            <motion.g
              style={{ transformBox: "fill-box", transformOrigin: "50% 8%" }}
              initial={false}
              animate={{ rotate: walking ? [0, 24, -24, 24, -24, 24, -24, 0] : 0 }}
              transition={
                walking
                  ? { duration: walkS, ease: "linear" }
                  : { duration: 0.2 }
              }
            >
              <rect x="13.5" y="42" width="8" height="21" rx="4" fill="#2b3a67" />
            </motion.g>
            {/* 몸통 + 머리 (다리 관절을 덮는다) */}
            <path
              d="M 23 20 C 32 20, 36 27, 36 38 L 35 47 L 11 47 L 10 38 C 10 27, 14 20, 23 20 Z"
              fill="#2b3a67"
            />
            <circle cx="23" cy="10" r="9" fill="#2b3a67" />
          </svg>
        </div>
      </motion.div>
    </div>
  );
}

/* ─── 2.5D 레이어 — translateZ 깊이 + 카메라 팬 시 레이어별 차등 이동(패럴랙스) ─── */

function SceneLayer({
  kind,
  theme,
  uid,
  imageSrc,
  panSide,
  reduced,
}: {
  kind: LayerKind;
  theme: SceneTheme;
  uid: string;
  imageSrc: string;
  panSide: RoadSide | null;
  reduced: boolean;
}) {
  const cfg = LAYER_CONFIG[kind];
  // translateZ로 뒤로 밀린 만큼 확대해서 화면을 가득 채운다 (원근 보정)
  const baseScale = (PERSPECTIVE - cfg.z) / PERSPECTIVE;
  const panning = panSide !== null && !reduced;
  // 캐릭터가 왼쪽 길로 가면 카메라도 왼쪽으로 → 세계는 오른쪽(+x)·아래(+y)로 흐른다
  const dir = panSide === "left" ? 1 : -1;
  const panDur = (reduced ? REDUCED_PAN_MS : CAMERA_PAN_MS) / 1000;

  // 부모(장면 루트)의 variant 라벨을 상속받아 enter/center/exit를 재생한다
  const variants = {
    enter: panning
      ? { x: `${-dir * cfg.panXPct}%`, y: `${-cfg.panYPct}%`, scale: baseScale }
      : { x: "0%", y: "0%", scale: baseScale },
    center: {
      x: "0%",
      y: "0%",
      scale: baseScale,
      transition: { duration: panDur, ease: PAN_EASE },
    },
    exit: panning
      ? {
          x: `${dir * cfg.panXPct}%`,
          y: `${cfg.panYPct}%`,
          scale: baseScale,
          transition: { duration: panDur, ease: PAN_EASE },
        }
      : { x: "0%", y: "0%", scale: baseScale },
  };

  return (
    <motion.div className="absolute -inset-[12%]" style={{ z: cfg.z }} variants={variants}>
      {kind === "background" && <BackgroundArt theme={theme} uid={uid} />}
      {kind === "road" && <RoadArt theme={theme} />}
      {kind === "foreground" && <ForegroundArt theme={theme} uid={uid} />}
      <LayerImage src={imageSrc} />
    </motion.div>
  );
}

/* ─── 갈림길 장면 (문항 1개 = 풀스크린 장면 1개, AnimatePresence로 팬 전환) ─── */

export default function ForkScene({
  question,
  index,
  total,
  selectedValue,
  walkSide,
  panSide,
  isTransitioning,
  onChoose,
}: ForkSceneProps) {
  const reduced = !!useReducedMotion();
  const theme = getSceneTheme(question.axis);
  const assets = getSceneAssets(question.id);
  const walking = walkSide !== null;
  const panning = panSide !== null && !reduced;
  const panDur = (reduced ? REDUCED_PAN_MS : CAMERA_PAN_MS) / 1000;

  // 장면 루트: 팬 이동은 레이어가 담당하고, 루트는 크로스페이드만 담당
  const rootVariants = {
    enter: { opacity: panning ? 0.35 : 0 },
    center: { opacity: 1, transition: { duration: reduced ? 0.25 : 0.5, ease: "easeOut" as const } },
    exit: {
      opacity: 0,
      transition: panning
        ? { duration: panDur, ease: "easeIn" as const, delay: 0.1 }
        : { duration: 0.25 },
    },
  };

  return (
    <motion.div
      className="absolute inset-0 overflow-hidden"
      style={{ perspective: PERSPECTIVE }}
      variants={rootVariants}
      initial="enter"
      animate="center"
      exit="exit"
    >
      {/* 2.5D 카메라 공간 */}
      <div className="absolute inset-0" style={{ transformStyle: "preserve-3d" }}>
        <SceneLayer
          kind="background"
          theme={theme}
          uid={`${question.id}-bg`}
          imageSrc={assets.background}
          panSide={panSide}
          reduced={reduced}
        />
        <SceneLayer
          kind="road"
          theme={theme}
          uid={`${question.id}-road`}
          imageSrc={assets.road}
          panSide={panSide}
          reduced={reduced}
        />
        <SceneLayer
          kind="foreground"
          theme={theme}
          uid={`${question.id}-fg`}
          imageSrc={assets.foreground}
          panSide={panSide}
          reduced={reduced}
        />
      </div>

      {/* 질문 + 선택지 오버레이 */}
      <div className="absolute inset-0 z-20">
        {/* 질문 텍스트 — 하늘 영역 상단 중앙 */}
        <motion.div
          aria-live="polite"
          className="absolute inset-x-0 top-[8%] flex flex-col items-center gap-3 px-6 text-center"
          initial={{ opacity: 0, y: reduced ? 0 : 30 }}
          animate={{
            opacity: isTransitioning ? 0 : 1,
            y: isTransitioning ? (reduced ? 0 : 14) : 0,
          }}
          transition={
            isTransitioning
              ? { duration: reduced ? 0.15 : 0.35 }
              : { delay: reduced ? 0 : 0.15, duration: reduced ? 0.2 : 0.6, ease: "easeOut" }
          }
        >
          <span className="inline-block rounded-full bg-white/75 px-3 py-1 text-xs font-bold tracking-wide text-[#004be6] shadow-sm backdrop-blur-md">
            Question {String(index + 1).padStart(2, "0")}
          </span>
          <h2 className="max-w-md break-keep text-xl font-black leading-snug text-slate-800 drop-shadow-sm md:text-2xl">
            {question.text}
          </h2>
          <p className="max-w-sm break-keep text-xs font-semibold text-slate-600/90 md:text-sm">
            당신의 투자 성향에 더 가까운 길을 선택해 주세요.
            <br />
            길을 선택하면 자동으로 다음 문항으로 이동합니다.
          </p>
        </motion.div>

        {/* 선택지 버튼 — 좌/우로 갈라지는 길 위에 오버레이 */}
        <div
          className="absolute inset-x-0 top-[42%] flex justify-between gap-3 px-4 sm:px-8"
          role="radiogroup"
          aria-label={question.text}
        >
          {question.options.map((opt, i) => {
            const side: RoadSide = i === 0 ? "left" : "right";
            const isSelected = selectedValue === opt.value;
            const isChosen = walking && walkSide === side;
            return (
              <motion.button
                key={`${question.id}-${side}`}
                type="button"
                role="radio"
                aria-checked={isSelected}
                disabled={isTransitioning}
                onClick={() => onChoose(opt.value, side)}
                className={`w-[47%] max-w-[260px] rounded-2xl border-2 p-4 text-left shadow-lg backdrop-blur-md transition-colors ${
                  isSelected || isChosen
                    ? "border-[#004be6] bg-[#f0f4ff]/95"
                    : "border-white/70 bg-white/85 hover:border-slate-300"
                } ${isChosen ? "ring-4 ring-[#004be6]/25" : ""} ${
                  isTransitioning ? "pointer-events-none" : ""
                }`}
                initial={{ opacity: 0, y: reduced ? 0 : 34 }}
                animate={{
                  opacity: isTransitioning ? 0 : 1,
                  y: isTransitioning ? (reduced ? 0 : 14) : 0,
                  scale: isChosen && !reduced ? 1.07 : 1,
                }}
                transition={
                  isTransitioning
                    ? {
                        // 선택 하이라이트가 잠깐 보이도록 페이드는 살짝 늦게
                        duration: reduced ? 0.15 : 0.35,
                        delay: reduced ? 0 : 0.3,
                        scale: { delay: 0, duration: 0.18 },
                      }
                    : {
                        delay: reduced ? 0 : side === "left" ? 0.3 : 0.42,
                        duration: reduced ? 0.2 : 0.6,
                        ease: "easeOut",
                        scale: { delay: 0, duration: 0.18 },
                      }
                }
                whileTap={isTransitioning ? undefined : { scale: 0.97 }}
              >
                <span
                  className={`mb-1.5 inline-block rounded-full px-2 py-0.5 text-[11px] font-bold ${
                    isSelected || isChosen
                      ? "bg-[#004be6] text-white"
                      : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {side === "left" ? "← 왼쪽 길" : "오른쪽 길 →"}
                </span>
                <span
                  className={`block break-keep text-[13px] font-semibold leading-relaxed md:text-sm ${
                    isSelected || isChosen ? "text-[#004be6]" : "text-slate-700"
                  }`}
                >
                  {opt.label}
                </span>
              </motion.button>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}
