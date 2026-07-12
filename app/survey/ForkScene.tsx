"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { getSceneAssets, getSceneTheme, type SceneTheme } from "@/lib/scenes";

/* ─── 전환 타이밍 상수 — page.tsx의 진행 로직(setTimeout)과 동기화되어야 한다 ─── */
/** 캐릭터가 선택한 길로 걸어가는 시간 */
export const CHARACTER_WALK_MS = 1100;
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
      {/* 해 */}
      <circle cx="430" cy="190" r="120" fill={theme.sun} opacity="0.35" />
      <circle cx="430" cy="190" r="66" fill={theme.sun} />
      {/* 구름 */}
      <g fill="#ffffff" opacity="0.8">
        <ellipse cx="160" cy="140" rx="90" ry="22" />
        <ellipse cx="215" cy="120" rx="55" ry="16" />
        <ellipse cx="640" cy="170" rx="75" ry="18" opacity="0.7" />
      </g>
      {/* 왼쪽: 산맥 (왼쪽 길의 목적지 느낌) */}
      <g>
        <polygon points="30,560 190,300 350,560" fill={theme.hillFar} />
        <polygon points="150,560 280,370 410,560" fill={theme.hillNear} />
        <polygon points="171,331 190,300 209,331 190,318" fill="#ffffff" opacity="0.9" />
      </g>
      {/* 오른쪽: 도시 실루엣 (오른쪽 길의 목적지 느낌) */}
      <g>
        <rect x="520" y="440" width="52" height="120" fill={theme.hillFar} />
        <rect x="580" y="400" width="58" height="160" fill={theme.hillNear} />
        <rect x="646" y="460" width="46" height="100" fill={theme.hillFar} />
        <rect x="698" y="420" width="56" height="140" fill={theme.hillNear} />
        <g fill="#ffffff" opacity="0.85">
          <rect x="532" y="456" width="10" height="12" />
          <rect x="550" y="456" width="10" height="12" />
          <rect x="532" y="482" width="10" height="12" />
          <rect x="594" y="416" width="10" height="12" />
          <rect x="614" y="416" width="10" height="12" />
          <rect x="594" y="444" width="10" height="12" />
          <rect x="658" y="476" width="9" height="11" />
          <rect x="712" y="436" width="10" height="12" />
          <rect x="730" y="436" width="10" height="12" />
          <rect x="712" y="464" width="10" height="12" />
        </g>
      </g>
      {/* 지평선 부근 원경 능선 */}
      <path
        d="M0 530 Q 130 490 260 522 Q 400 495 540 524 Q 680 500 800 520 L 800 620 L 0 620 Z"
        fill={theme.hillFar}
        opacity="0.6"
      />
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
      {/* 3인칭 Y자 갈림길: 하단 중앙의 길이 화면 69% 지점 분기점에서
          좌/우 화면 가장자리로 갈라진다 (캐릭터가 분기점 아래 서 있는 구도) */}
      <path
        d="M 356 1200
           C 362 1050, 372 920, 383 838
           C 300 812, 180 780, -30 726
           L -30 684
           C 190 736, 320 768, 400 806
           C 480 768, 610 736, 830 684
           L 830 726
           C 620 780, 500 812, 417 838
           C 428 920, 438 1050, 444 1200
           Z"
        fill={theme.road}
        stroke={theme.roadEdge}
        strokeWidth="6"
        strokeLinejoin="round"
      />
      {/* 중앙 차선 — 트렁크와 두 갈래를 따라 이어진다 */}
      <g stroke={theme.roadEdge} strokeLinecap="round" fill="none" opacity="0.6">
        <path d="M 400 1180 L 400 870" strokeWidth="8" strokeDasharray="26 24" />
        <path d="M 380 822 C 290 795, 180 765, 30 712" strokeWidth="6" strokeDasharray="20 18" />
        <path d="M 420 822 C 510 795, 620 765, 770 712" strokeWidth="6" strokeDasharray="20 18" />
      </g>
      {/* 들판 위 소품 — 왼쪽 침엽수, 오른쪽 둥근 수풀 (참고 구도) */}
      <g fill={theme.bushDark}>
        <polygon points="130,700 155,640 180,700" />
        <rect x="150" y="700" width="10" height="16" fill={theme.roadEdge} />
        <polygon points="215,660 235,612 255,660" />
        <rect x="231" y="660" width="8" height="13" fill={theme.roadEdge} />
      </g>
      <g fill={theme.bush}>
        <circle cx="668" cy="768" r="26" />
        <circle cx="706" cy="778" r="17" />
      </g>
      {/* 분기점 안쪽 수풀 */}
      <ellipse cx="400" cy="792" rx="11" ry="6" fill={theme.bushDark} />
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
          <stop offset="0%" stopColor="#1e3a8a" stopOpacity="0" />
          <stop offset="100%" stopColor="#1e3a8a" stopOpacity="0.14" />
        </linearGradient>
      </defs>
      {/* 좌우 근경 수풀 — 화면 하단 모서리를 감싸는 프레임 */}
      <g fill={theme.bushDark}>
        <ellipse cx="30" cy="1210" rx="230" ry="150" />
        <ellipse cx="770" cy="1215" rx="240" ry="160" />
      </g>
      <g fill={theme.bush}>
        <ellipse cx="-20" cy="1230" rx="200" ry="130" />
        <ellipse cx="820" cy="1235" rx="210" ry="140" />
      </g>
      {/* 잔돌 */}
      <ellipse cx="250" cy="1150" rx="24" ry="11" fill={theme.roadEdge} opacity="0.5" />
      <ellipse cx="580" cy="1130" rx="18" ry="9" fill={theme.roadEdge} opacity="0.45" />
      {/* 하단 비네트 */}
      <rect y="1060" width="800" height="140" fill={`url(#${vignetteId})`} />
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

/* 캐릭터 위치 — 대기: 분기점 바로 아래 트렁크 길 위 / 걷기: 좌·우 갈래길 중간 지점 */
const CHAR_BASE = { ...sceneToViewport(400, 856), scale: 1 };
const CHAR_TARGET: Record<RoadSide, { x: string; y: string; scale: number }> = {
  left: { ...sceneToViewport(240, 782), scale: 0.8 },
  right: { ...sceneToViewport(560, 782), scale: 0.8 },
};

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
  const target = walking && side ? CHAR_TARGET[side] : CHAR_BASE;

  return (
    <div className="pointer-events-none absolute inset-0 z-10" aria-hidden="true">
      <motion.div
        className="absolute left-0 top-0"
        initial={false}
        animate={{
          x: target.x,
          y: target.y,
          scale: target.scale,
          // 걸을 때 좌우로 갸우뚱거리는 걸음 wobble
          rotate: walking ? [0, -4, 4, -4, 4, 0] : 0,
        }}
        transition={
          walking
            ? {
                duration: CHARACTER_WALK_MS / 1000,
                ease: "easeInOut",
                rotate: {
                  duration: CHARACTER_WALK_MS / 1000,
                  times: [0, 0.2, 0.4, 0.6, 0.8, 1],
                },
              }
            : phase === "pan" && !reduced
              ? { duration: CAMERA_PAN_MS / 1000, ease: PAN_EASE }
              : { duration: reduced ? 0 : 0.3 }
        }
      >
        {/* 기준점(x/y)이 발끝이 되도록 위로 올려서 그린다 */}
        <div className="relative -translate-x-1/2 -translate-y-full">
          {/* 고민 말풍선 — 대기 상태에서만 표시 */}
          <motion.div
            className="absolute -right-10 -top-10 flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-base font-black text-[#004be6] shadow-md"
            initial={false}
            animate={{ opacity: phase === "idle" ? 1 : 0, y: phase === "idle" ? [0, -3, 0] : 0 }}
            transition={{
              opacity: { duration: 0.25 },
              y: reduced ? { duration: 0 } : { duration: 2.2, repeat: Infinity, ease: "easeInOut" },
            }}
          >
            ?
          </motion.div>
          {/* 미니멀 실루엣 캐릭터 (네이비, 화이트&블루 톤) */}
          <svg width="46" height="64" viewBox="0 0 46 64" className="drop-shadow-md">
            <circle cx="23" cy="10" r="9" fill="#2b3a67" />
            <path
              d="M 23 20 C 32 20, 36 27, 36 38 L 34 62 L 27 62 L 26 44 L 20 44 L 19 62 L 12 62 L 10 38 C 10 27, 14 20, 23 20 Z"
              fill="#2b3a67"
            />
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
