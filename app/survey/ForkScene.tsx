"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { getSceneAssets, getSceneTheme, getFeetAssets, type SceneTheme } from "@/lib/scenes";

/* ─── 전환 타이밍 상수 — page.tsx의 진행 로직(setTimeout)과 동기화되어야 한다 ─── */
/** 선택 → 다음 문항 전환까지: 버튼 하이라이트(0.2s) + 카메라 전진(1.15s) + 화이트아웃 */
export const WALK_ADVANCE_MS = 1500;
/** prefers-reduced-motion 사용자용 단축 전환 */
export const REDUCED_ADVANCE_MS = 420;

const PERSPECTIVE = 1200;

/* 레이어별 깊이(translateZ)와 걷기 애니메이션 배율.
   전경일수록 크게/빠르게 움직여 패럴랙스 깊이감을 만든다.
   bobPx: 걸음걸이(head-bob) 상하 흔들림 진폭 — 가까운 레이어일수록 크게 */
const LAYER_CONFIG = {
  background: { z: -420, walkScale: 1.2, walkShiftPct: 4, bobPx: 4 },
  road: { z: -160, walkScale: 1.85, walkShiftPct: 10, bobPx: 7 },
  foreground: { z: 40, walkScale: 2.3, walkShiftPct: 20, bobPx: 12 },
} as const;

/* 걷기 리듬 — 4걸음: 왼발(12%) → 오른발(37%) → 왼발(62%) → 오른발(87%)
   발 애니메이션과 헤드밥이 같은 타이밍을 공유한다 */
const STEP_DELAY = 0.18;
const STEP_DURATION = 1.15;
const HEADBOB_TIMES = [0, 0.12, 0.25, 0.37, 0.5, 0.62, 0.75, 0.87, 1];

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
      <circle cx="565" cy="260" r="150" fill={theme.sun} opacity="0.35" />
      <circle cx="565" cy="260" r="86" fill={theme.sun} />
      {/* 구름 */}
      <g fill="#ffffff" opacity="0.75">
        <ellipse cx="200" cy="200" rx="95" ry="26" />
        <ellipse cx="255" cy="176" rx="60" ry="20" />
        <ellipse cx="620" cy="130" rx="70" ry="18" opacity="0.6" />
      </g>
      {/* 원경 능선 — 높아진 지평선(y≈470)에 맞춰 배치 */}
      <path
        d="M0 430 Q 130 350 260 418 Q 340 380 430 420 Q 560 355 680 418 Q 740 395 800 412 L 800 560 L 0 560 Z"
        fill={theme.hillFar}
      />
      <path
        d="M0 470 Q 160 405 320 462 Q 470 415 620 465 Q 710 435 800 455 L 800 600 L 0 600 Z"
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
      {/* 들판 — 분기점이 화면 중상단(약 42%)에 오도록 지평선을 높게 잡는다 */}
      <rect y="470" width="800" height="730" fill={theme.ground} />
      {/* Y자 갈림길: 하단 중앙의 넓은 길(가까움)이 위로 갈수록 좁아지다
          중상단 분기점에서 좌상단/우상단으로 곡선을 그리며 갈라진다 */}
      <path
        d="M 180 1200
           C 250 940, 320 720, 352 586
           C 255 528, 155 502, 70 482
           L 88 445
           C 185 458, 305 488, 400 520
           C 495 488, 615 458, 712 445
           L 730 482
           C 645 502, 545 528, 448 586
           C 480 720, 550 940, 620 1200
           Z"
        fill={theme.road}
        stroke={theme.roadEdge}
        strokeWidth="6"
        strokeLinejoin="round"
      />
      {/* 중앙 차선 — 트렁크는 분기점 앞에서 끊기고, 두 갈래를 따라 이어진다 */}
      <g stroke={theme.roadEdge} strokeLinecap="round" fill="none" opacity="0.6">
        <path d="M 400 1180 L 400 660" strokeWidth="8" strokeDasharray="30 26" />
        <path d="M 385 560 C 300 522, 200 500, 105 470" strokeWidth="6" strokeDasharray="22 20" />
        <path d="M 415 560 C 500 522, 600 500, 695 470" strokeWidth="6" strokeDasharray="22 20" />
      </g>
      {/* 분기점 위 수풀 */}
      <ellipse cx="400" cy="490" rx="12" ry="7" fill={theme.bushDark} />
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

/* ─── 1인칭 발 (화면 하단 중앙) ─── */

/** 플레이스홀더 신발 — 1인칭 시점에서 내려다본 발등 */
function ShoePlaceholder({ tiltClass }: { tiltClass: string }) {
  return (
    <svg
      viewBox="0 0 90 130"
      className={`h-auto w-full drop-shadow-md ${tiltClass}`}
      aria-hidden="true"
    >
      {/* 신발 본체 */}
      <path
        d="M 13 130 L 10 58 C 9 24, 25 5, 45 5 C 65 5, 81 24, 80 58 L 77 130 Z"
        fill="#3d4f70"
      />
      {/* 토캡 */}
      <path
        d="M 45 5 C 63 5, 76 20, 77 40 C 66 48, 24 48, 13 40 C 14 20, 27 5, 45 5 Z"
        fill="#e2e8f0"
      />
      {/* 신발끈 */}
      <rect x="20" y="62" width="50" height="8" rx="4" fill="#e2e8f0" opacity="0.9" />
      <rect x="20" y="80" width="50" height="8" rx="4" fill="#e2e8f0" opacity="0.9" />
      <rect x="20" y="98" width="50" height="8" rx="4" fill="#e2e8f0" opacity="0.9" />
    </svg>
  );
}

/**
 * 1인칭 발 — 대기 시 미세한 idle 흔들림, 선택 시 좌/우발이 번갈아 나가는 4걸음 모션.
 * public/images/scenes/feet-idle.png / feet-left-step.png / feet-right-step.png가
 * 모두 있으면 이미지 스프라이트 교체 방식으로, 없으면 SVG 플레이스홀더로 동작한다.
 */
function WalkingFeet({ walkSide, reduced }: { walkSide: RoadSide | null; reduced: boolean }) {
  const feet = getFeetAssets();
  const [idleOk, setIdleOk] = useState(false);
  const [leftOk, setLeftOk] = useState(false);
  const [rightOk, setRightOk] = useState(false);

  const walking = walkSide !== null && !reduced;
  // 왼쪽 길 선택 → 발이 왼쪽으로 이동·회전
  const dir = walkSide === "left" ? -1 : 1;
  const hasStepSprites = idleOk && leftOk && rightOk;
  const stepTransition = { delay: STEP_DELAY, duration: STEP_DURATION };

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[12] flex justify-center">
      <motion.div
        className="relative h-[118px] w-[184px]"
        initial={false}
        animate={
          walking
            ? {
                x: dir * 26,
                rotate: dir * 9,
                y: [0, -6, 2, -6, 2, -6, 2, -5, 0],
              }
            : { x: 0, rotate: 0, y: reduced ? 0 : [0, -3, 0] }
        }
        transition={
          walking
            ? {
                ...stepTransition,
                ease: "easeInOut",
                y: { ...stepTransition, times: HEADBOB_TIMES, ease: "easeInOut" },
              }
            : reduced
              ? { duration: 0 }
              : {
                  x: { duration: 0.2 },
                  rotate: { duration: 0.2 },
                  // idle: 숨쉬듯 미세하게 위아래로
                  y: { duration: 2.6, repeat: Infinity, ease: "easeInOut" },
                }
        }
      >
        {/* SVG 플레이스홀더 발 (feet-idle.png 로드 시 숨김) */}
        {!idleOk && (
          <>
            <motion.div
              className="absolute bottom-[-10px] left-[10px] w-[76px]"
              initial={false}
              animate={walking ? { y: [0, -14, 0, 0, -14, 0, 0] } : { y: 0 }}
              transition={
                walking
                  ? { ...stepTransition, times: [0, 0.12, 0.25, 0.5, 0.62, 0.75, 1], ease: "easeInOut" }
                  : { duration: 0.2 }
              }
            >
              <ShoePlaceholder tiltClass="-rotate-[7deg]" />
            </motion.div>
            <motion.div
              className="absolute bottom-[-10px] right-[10px] w-[76px]"
              initial={false}
              animate={walking ? { y: [0, 0, -14, 0, 0, -14, 0] } : { y: 0 }}
              transition={
                walking
                  ? { ...stepTransition, times: [0, 0.25, 0.37, 0.5, 0.75, 0.87, 1], ease: "easeInOut" }
                  : { duration: 0.2 }
              }
            >
              <ShoePlaceholder tiltClass="rotate-[7deg]" />
            </motion.div>
          </>
        )}

        {/* 실제 발 일러스트 — 파일이 있으면 자동 사용 */}
        <motion.img
          src={feet.idle}
          alt=""
          aria-hidden="true"
          draggable={false}
          onLoad={() => setIdleOk(true)}
          onError={(e) => {
            e.currentTarget.style.display = "none";
          }}
          className="absolute inset-0 h-full w-full select-none object-contain object-bottom"
          initial={false}
          animate={{ opacity: idleOk ? (walking && hasStepSprites ? 0 : 1) : 0 }}
          transition={{ duration: 0.15 }}
        />
        <motion.img
          src={feet.leftStep}
          alt=""
          aria-hidden="true"
          draggable={false}
          onLoad={() => setLeftOk(true)}
          onError={(e) => {
            e.currentTarget.style.display = "none";
          }}
          className="absolute inset-0 h-full w-full select-none object-contain object-bottom"
          initial={false}
          animate={
            walking && hasStepSprites
              ? { opacity: [1, 1, 0, 0, 1, 1, 0, 0] }
              : { opacity: 0 }
          }
          transition={
            walking && hasStepSprites
              ? { ...stepTransition, times: [0, 0.24, 0.25, 0.49, 0.5, 0.74, 0.75, 1] }
              : { duration: 0.1 }
          }
        />
        <motion.img
          src={feet.rightStep}
          alt=""
          aria-hidden="true"
          draggable={false}
          onLoad={() => setRightOk(true)}
          onError={(e) => {
            e.currentTarget.style.display = "none";
          }}
          className="absolute inset-0 h-full w-full select-none object-contain object-bottom"
          initial={false}
          animate={
            walking && hasStepSprites
              ? { opacity: [0, 0, 1, 1, 0, 0, 1, 1] }
              : { opacity: 0 }
          }
          transition={
            walking && hasStepSprites
              ? { ...stepTransition, times: [0, 0.24, 0.25, 0.49, 0.5, 0.74, 0.75, 1] }
              : { duration: 0.1 }
          }
        />
      </motion.div>
    </div>
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
          ? {
              scale: baseScale * cfg.walkScale,
              x: `${dir * cfg.walkShiftPct}%`,
              // 4걸음 발디딤에 맞춘 헤드밥 (발 애니메이션과 동기화)
              y: [0, -cfg.bobPx, 0, -cfg.bobPx, 0, -cfg.bobPx, 0, -cfg.bobPx, 0],
            }
          : { scale: baseScale, x: "0%", y: 0 }
      }
      transition={
        walking
          ? {
              delay: STEP_DELAY,
              duration: STEP_DURATION,
              ease: [0.5, 0, 0.3, 1],
              y: {
                delay: STEP_DELAY,
                duration: STEP_DURATION,
                times: HEADBOB_TIMES,
                ease: "easeInOut",
              },
            }
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

      {/* 1인칭 발 — 화면 하단 중앙 */}
      <WalkingFeet walkSide={walkSide} reduced={reduced} />

      {/* 질문 + 선택지 오버레이 */}
      <motion.div
        className="absolute inset-0 z-10"
        animate={{ opacity: isTransitioning ? 0 : 1 }}
        transition={{
          duration: reduced ? 0.15 : 0.4,
          delay: isTransitioning && walking && !reduced ? 0.25 : 0,
        }}
      >
        {/* 질문 텍스트 — 분기점 위 하늘 영역 */}
        <motion.div
          aria-live="polite"
          className="absolute inset-x-0 top-[8%] flex flex-col items-center gap-3 px-6 text-center"
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

        {/* 선택지 버튼 — 좌상단/우상단으로 뻗는 두 갈래 길 위에 오버레이 */}
        <div
          className="absolute inset-x-0 top-[30%] flex justify-between gap-3 px-4 sm:px-8"
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
