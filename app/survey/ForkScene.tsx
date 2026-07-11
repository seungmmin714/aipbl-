"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { getSceneAssets, getSceneTheme, type SceneTheme } from "@/lib/scenes";

/* ─── 전환 타이밍 상수 — page.tsx의 진행 로직(setTimeout)과 동기화되어야 한다 ─── */
/** 선택 → 다음 문항 전환까지: 버튼 하이라이트(0.2s) + 카메라 전진(1.15s) + 화이트아웃 */
export const WALK_ADVANCE_MS = 1500;
/** prefers-reduced-motion 사용자용 단축 전환 */
export const REDUCED_ADVANCE_MS = 420;

const PERSPECTIVE = 1200;

/* 레이어별 깊이(translateZ)와 걷기 애니메이션 배율.
   전경일수록 크게/빠르게 움직여 패럴랙스 깊이감을 만든다. */
const LAYER_CONFIG = {
  background: { z: -420, walkScale: 1.2, walkShiftPct: 4 },
  road: { z: -160, walkScale: 1.85, walkShiftPct: 10 },
  foreground: { z: 40, walkScale: 2.3, walkShiftPct: 20 },
} as const;

type LayerKind = keyof typeof LAYER_CONFIG;
export type RoadSide = "left" | "right";

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
  /** 걷기 애니메이션 진행 방향 (null이면 대기 상태) */
  walkSide: RoadSide | null;
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

/* ─── 플레이스홀더 아트 (단색 그라데이션 + 단순 SVG 도형) ─── */

function BackgroundArt({ theme, uid }: { theme: SceneTheme; uid: string }) {
  const skyId = `sky-${uid}`;
  return (
    <svg
      className="absolute inset-0 h-full w-full"
      viewBox="0 0 800 1200"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={skyId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={theme.skyTop} />
          <stop offset="100%" stopColor={theme.skyBottom} />
        </linearGradient>
      </defs>
      <rect width="800" height="1200" fill={`url(#${skyId})`} />
      {/* 해/달 */}
      <circle cx="565" cy="300" r="150" fill={theme.sun} opacity="0.35" />
      <circle cx="565" cy="300" r="86" fill={theme.sun} />
      {/* 구름 */}
      <g fill="#ffffff" opacity="0.75">
        <ellipse cx="200" cy="220" rx="95" ry="26" />
        <ellipse cx="255" cy="196" rx="60" ry="20" />
        <ellipse cx="620" cy="150" rx="70" ry="18" opacity="0.6" />
      </g>
      {/* 원경 능선 */}
      <path
        d="M0 560 Q 130 470 260 545 Q 340 505 430 550 Q 560 480 680 545 Q 740 520 800 540 L 800 720 L 0 720 Z"
        fill={theme.hillFar}
      />
      <path
        d="M0 610 Q 160 540 320 605 Q 470 550 620 608 Q 710 575 800 600 L 800 760 L 0 760 Z"
        fill={theme.hillNear}
      />
    </svg>
  );
}

function RoadArt({ theme }: { theme: SceneTheme }) {
  return (
    <svg
      className="absolute inset-0 h-full w-full"
      viewBox="0 0 800 1200"
      preserveAspectRatio="xMidYMax slice"
      aria-hidden="true"
    >
      {/* 들판 (배경 능선과 겹치도록 살짝 위에서 시작) */}
      <rect y="580" width="800" height="620" fill={theme.ground} />
      {/* 갈림길: 발 앞의 넓은 길이 좌/우 소실점으로 갈라진다 */}
      <g stroke={theme.roadEdge} strokeWidth="7" strokeLinejoin="round">
        <polygon points="270,1200 530,1200 432,742 368,742" fill={theme.road} />
        <polygon points="368,742 432,742 330,596 292,596" fill={theme.road} />
        <polygon points="368,742 432,742 508,596 470,596" fill={theme.road} />
      </g>
      {/* 중앙 차선 */}
      <line
        x1="400"
        y1="1180"
        x2="400"
        y2="775"
        stroke="#ffffff"
        strokeWidth="9"
        strokeDasharray="36 30"
        strokeLinecap="round"
        opacity="0.5"
      />
      {/* 갈림길 가운데 수풀 */}
      <ellipse cx="400" cy="672" rx="24" ry="14" fill={theme.bushDark} />
    </svg>
  );
}

function ForegroundArt({ theme, uid }: { theme: SceneTheme; uid: string }) {
  const vignetteId = `vignette-${uid}`;
  return (
    <svg
      className="absolute inset-0 h-full w-full"
      viewBox="0 0 800 1200"
      preserveAspectRatio="xMidYMax slice"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={vignetteId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#000000" stopOpacity="0" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0.16" />
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
        <ellipse cx="180" cy="1265" rx="120" ry="70" />
        <ellipse cx="640" cy="1268" rx="130" ry="75" />
      </g>
      {/* 잔돌 */}
      <ellipse cx="250" cy="1180" rx="26" ry="12" fill={theme.roadEdge} opacity="0.55" />
      <ellipse cx="565" cy="1170" rx="20" ry="10" fill={theme.roadEdge} opacity="0.5" />
      {/* 하단 비네트 */}
      <rect y="1050" width="800" height="150" fill={`url(#${vignetteId})`} />
    </svg>
  );
}

/* ─── 2.5D 레이어 — translateZ 깊이 + 걷기 시 레이어별 확대/이동 ─── */

function SceneLayer({
  kind,
  theme,
  uid,
  imageSrc,
  walkSide,
  reduced,
}: {
  kind: LayerKind;
  theme: SceneTheme;
  uid: string;
  imageSrc: string;
  walkSide: RoadSide | null;
  reduced: boolean;
}) {
  const cfg = LAYER_CONFIG[kind];
  // translateZ로 뒤로 밀린 만큼 확대해서 화면을 가득 채운다 (원근 보정)
  const baseScale = (PERSPECTIVE - cfg.z) / PERSPECTIVE;
  const walking = walkSide !== null && !reduced;
  // 왼쪽 길로 걸어가면 카메라가 왼쪽으로 이동 → 장면은 오른쪽(+x)으로 흐른다
  const dir = walkSide === "left" ? 1 : -1;

  return (
    <motion.div
      className="absolute -inset-[12%]"
      style={{ z: cfg.z }}
      initial={false}
      animate={
        walking
          ? { scale: baseScale * cfg.walkScale, x: `${dir * cfg.walkShiftPct}%` }
          : { scale: baseScale, x: "0%" }
      }
      transition={
        walking
          ? { delay: 0.18, duration: 1.15, ease: [0.5, 0, 0.3, 1] }
          : { duration: 0 }
      }
    >
      {kind === "background" && <BackgroundArt theme={theme} uid={uid} />}
      {kind === "road" && <RoadArt theme={theme} />}
      {kind === "foreground" && <ForegroundArt theme={theme} uid={uid} />}
      <LayerImage src={imageSrc} />
    </motion.div>
  );
}

/* ─── 갈림길 장면 (문항 1개 = 풀스크린 장면 1개) ─── */

export default function ForkScene({
  question,
  index,
  total,
  selectedValue,
  walkSide,
  isTransitioning,
  onChoose,
}: ForkSceneProps) {
  const reduced = !!useReducedMotion();
  const theme = getSceneTheme(question.axis);
  const assets = getSceneAssets(question.id);
  const walking = walkSide !== null;

  return (
    <div className="absolute inset-0 overflow-hidden" style={{ perspective: PERSPECTIVE }}>
      {/* 2.5D 카메라 공간 */}
      <div className="absolute inset-0" style={{ transformStyle: "preserve-3d" }}>
        <SceneLayer
          kind="background"
          theme={theme}
          uid={`${question.id}-bg`}
          imageSrc={assets.background}
          walkSide={walkSide}
          reduced={reduced}
        />
        <SceneLayer
          kind="road"
          theme={theme}
          uid={`${question.id}-road`}
          imageSrc={assets.road}
          walkSide={walkSide}
          reduced={reduced}
        />
        <SceneLayer
          kind="foreground"
          theme={theme}
          uid={`${question.id}-fg`}
          imageSrc={assets.foreground}
          walkSide={walkSide}
          reduced={reduced}
        />
      </div>

      {/* 질문 + 선택지 오버레이 */}
      <motion.div
        className="absolute inset-0 z-10"
        animate={{ opacity: isTransitioning ? 0 : 1 }}
        transition={{
          duration: reduced ? 0.15 : 0.4,
          delay: isTransitioning && walking && !reduced ? 0.25 : 0,
        }}
      >
        {/* 질문 텍스트 — 상단 중앙 */}
        <motion.div
          aria-live="polite"
          className="absolute inset-x-0 top-[13%] flex flex-col items-center gap-3 px-6 text-center"
          initial={{ opacity: 0, y: reduced ? 0 : 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: reduced ? 0 : 0.15, duration: reduced ? 0.2 : 0.6, ease: "easeOut" }}
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

        {/* 선택지 버튼 — 왼쪽 길 / 오른쪽 길 위에 오버레이 */}
        <div
          className="absolute inset-x-0 top-[40%] flex justify-between gap-3 px-4 sm:px-8"
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
                animate={{ opacity: 1, y: 0, scale: isChosen && !reduced ? 1.07 : 1 }}
                transition={{
                  delay: reduced ? 0 : side === "left" ? 0.3 : 0.42,
                  duration: reduced ? 0.2 : 0.6,
                  ease: "easeOut",
                  scale: { delay: 0, duration: 0.18 },
                }}
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
      </motion.div>

      {/* 화이트아웃 베일 — 장면 전환 크로스페이드 (걷기 시 블러와 함께 밝아진다) */}
      <motion.div
        className="pointer-events-none absolute inset-0 z-20 bg-white"
        initial={{ opacity: 1 }}
        animate={{
          opacity: isTransitioning ? 1 : 0,
          backdropFilter: walking && !reduced ? "blur(7px)" : "blur(0px)",
        }}
        transition={
          isTransitioning
            ? walking
              ? { delay: reduced ? 0 : 0.6, duration: reduced ? 0.25 : 0.6, ease: "easeIn" }
              : { duration: 0.22 }
            : { duration: reduced ? 0.25 : 0.45, ease: "easeOut" }
        }
      />
    </div>
  );
}
