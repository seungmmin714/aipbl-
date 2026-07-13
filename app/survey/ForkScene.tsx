"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { SHARED_BACKGROUND_SRC, MOBILE_BACKGROUND_SRC } from "@/lib/scenes";

/* ─── 전환 타이밍 (page.tsx의 진행 로직과 동기화) ─── */
/** 캐릭터가 길을 따라 걷는 시간 (하단 중앙 → 분기점 → 갈래길) */
export const CHARACTER_WALK_MS = 2000;
/** prefers-reduced-motion: 걷기 생략, 즉시 전환 */
export const REDUCED_WALK_MS = 250;

export type RoadSide = "left" | "right";
export type TravelerPhase = "idle" | "walk";

export interface SurveyQuestion {
  id: string;
  axis: string;
  text: string;
  options: { label: string; value: string }[];
}

/* ─── 배경 이미지 속 길의 위치 (이미지 기준 비율 0~1) ───
   background-invest-clean.png의 Y자 길 좌표. 실제 이미지와 어긋나면 이 값만 조정.
   start: 길 시작점(하단 중앙) · fork: 분기점(지평선 바로 아래)
   leftEnd/rightEnd: 좌·우 갈래길이 사라지는 지점(산·도시 방향) */
type RoadPath = {
  start: { fx: number; fy: number };
  fork: { fx: number; fy: number };
  leftEnd: { fx: number; fy: number };
  rightEnd: { fx: number; fy: number };
};

/* 가로(데스크톱) 이미지 background-invest-clean.png 기준 길 좌표 */
const ROAD_DESKTOP: RoadPath = {
  // start와 fork의 fx를 동일하게 두어 분기점까지 수직 직선으로 올라간다
  start: { fx: 0.5, fy: 0.99 },
  fork: { fx: 0.5, fy: 0.83 },
  // 갈래 끝은 길이 지평선과 만나 끝나는 지점 (그 너머는 잔디)
  leftEnd: { fx: 0.33, fy: 0.735 },
  rightEnd: { fx: 0.64, fy: 0.732 },
};

/* 세로(모바일) 이미지 background-invest-mobile.png 기준 길 좌표 */
const ROAD_MOBILE: RoadPath = {
  start: { fx: 0.5, fy: 0.97 },
  fork: { fx: 0.5, fy: 0.74 },
  leftEnd: { fx: 0.33, fy: 0.59 },
  rightEnd: { fx: 0.68, fy: 0.585 },
};

/* 걷기 중 캐릭터 크기 (원근: 멀어질수록 작게) */
const SCALE = { start: 1, fork: 0.72, end: 0.5 } as const;

/* 뷰포트가 세로로 길면(가로/세로 비율 < 1) 모바일 세로 이미지를 쓴다 */
const PORTRAIT_THRESHOLD = 1.0;

interface ForkSceneProps {
  question: SurveyQuestion;
  index: number;
  total: number;
  selectedValue: string | null;
  /** 걷는 방향 (null이면 대기) */
  walkSide: RoadSide | null;
  phase: TravelerPhase;
  isTransitioning: boolean;
  onChoose: (value: string, side: RoadSide) => void;
}

/* ─── 배경 이미지의 실제 렌더 영역 계산 (object-fit: cover, center bottom) ───
   이미지 비율을 자연 크기에서 읽어와, 화면 비율이 바뀌어도 캐릭터가 이미지 속
   길 위 같은 지점에 오도록 비율(fx,fy) → 화면 픽셀(x,y)로 변환한다. */
interface Geometry {
  offsetX: number;
  offsetY: number;
  dispW: number;
  dispH: number;
}

function useImageGeometry(natural: { w: number; h: number } | null): Geometry | null {
  const [geo, setGeo] = useState<Geometry | null>(null);

  useEffect(() => {
    if (!natural || natural.w === 0 || natural.h === 0) return;
    const compute = () => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      // cover: 두 방향 모두 덮는 최대 배율 (가로·세로 이미지 모두 화면을 꽉 채움)
      const scale = Math.max(vw / natural.w, vh / natural.h);
      const dispW = natural.w * scale;
      const dispH = natural.h * scale;
      setGeo({
        offsetX: (vw - dispW) / 2, // 가로 중앙 정렬
        offsetY: vh - dispH, // 세로 하단(center bottom) 정렬 — 길·초원이 항상 하단
        dispW,
        dispH,
      });
    };
    compute();
    window.addEventListener("resize", compute);
    window.addEventListener("orientationchange", compute);
    return () => {
      window.removeEventListener("resize", compute);
      window.removeEventListener("orientationchange", compute);
    };
  }, [natural]);

  return geo;
}

/** 뷰포트가 세로로 길면 true (모바일 세로 이미지 사용) — resize/회전 대응 */
function useIsPortrait(): boolean {
  const [portrait, setPortrait] = useState(false);
  useEffect(() => {
    const update = () =>
      setPortrait(window.innerWidth / window.innerHeight < PORTRAIT_THRESHOLD);
    update();
    window.addEventListener("resize", update);
    window.addEventListener("orientationchange", update);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("orientationchange", update);
    };
  }, []);
  return portrait;
}

/** 이미지 비율 좌표(fx,fy) → 화면 픽셀 */
function toPx(geo: Geometry, fx: number, fy: number) {
  return { x: geo.offsetX + fx * geo.dispW, y: geo.offsetY + fy * geo.dispH };
}

/* ─── 1인칭? 아니, 3인칭 캐릭터 (길 위를 걷는다) ─── */
function Traveler({
  geo,
  road,
  phase,
  side,
  reduced,
}: {
  geo: Geometry;
  road: RoadPath;
  phase: TravelerPhase;
  side: RoadSide | null;
  reduced: boolean;
}) {
  const walking = phase === "walk" && side !== null && !reduced;
  const walkS = CHARACTER_WALK_MS / 1000;

  const start = toPx(geo, road.start.fx, road.start.fy);
  const fork = toPx(geo, road.fork.fx, road.fork.fy);
  const end = toPx(
    geo,
    side === "left" ? road.leftEnd.fx : road.rightEnd.fx,
    side === "left" ? road.leftEnd.fy : road.rightEnd.fy
  );

  // 경로: 하단 중앙(start) → 수직으로 분기점(fork) → 대각선 갈래길(end)
  const animate = walking
    ? {
        left: [start.x, fork.x, end.x],
        top: [start.y, fork.y, end.y],
        scale: [SCALE.start, SCALE.fork, SCALE.end],
      }
    : { left: start.x, top: start.y, scale: SCALE.start };

  return (
    <motion.div
      className="pointer-events-none absolute z-10"
      style={{ transformOrigin: "50% 100%" }}
      initial={false}
      animate={animate}
      transition={
        walking
          ? {
              duration: walkS,
              ease: "easeInOut",
              // 전반 55% 트렁크 직진, 후반 45% 갈래길 진입
              times: [0, 0.55, 1],
            }
          : { duration: reduced ? 0 : 0.3 }
      }
    >
      {/* 발끝이 (left,top)에 오도록 위로 올려 그린다 */}
      <div className="relative -translate-x-1/2 -translate-y-full">
        {/* 고민 말풍선 — 대기 상태 */}
        <motion.div
          className="absolute -right-11 -top-11"
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

        {/* 실루엣 캐릭터 — 걷는 동안 다리 교차 스윙 */}
        <svg width="46" height="64" viewBox="0 0 46 64" className="overflow-visible drop-shadow-md">
          <motion.g
            style={{ transformBox: "fill-box", transformOrigin: "50% 8%" }}
            initial={false}
            animate={{ rotate: walking ? [0, -26, 26, -26, 26, -26, 26, 0] : 0 }}
            transition={walking ? { duration: walkS, ease: "linear" } : { duration: 0.2 }}
          >
            <rect x="24.5" y="42" width="8" height="21" rx="4" fill="#22305a" />
          </motion.g>
          <motion.g
            style={{ transformBox: "fill-box", transformOrigin: "50% 8%" }}
            initial={false}
            animate={{ rotate: walking ? [0, 26, -26, 26, -26, 26, -26, 0] : 0 }}
            transition={walking ? { duration: walkS, ease: "linear" } : { duration: 0.2 }}
          >
            <rect x="13.5" y="42" width="8" height="21" rx="4" fill="#2b3a67" />
          </motion.g>
          <path
            d="M 23 20 C 32 20, 36 27, 36 38 L 35 47 L 11 47 L 10 38 C 10 27, 14 20, 23 20 Z"
            fill="#2b3a67"
          />
          <circle cx="23" cy="10" r="9" fill="#2b3a67" />
        </svg>
      </div>
    </motion.div>
  );
}

/* ─── 갈림길 장면 — 배경 이미지(길 포함) + 캐릭터 + 질문/선택지 오버레이 ─── */
export default function ForkScene({
  question,
  index,
  selectedValue,
  walkSide,
  phase,
  isTransitioning,
  onChoose,
}: ForkSceneProps) {
  const reduced = !!useReducedMotion();
  const isPortrait = useIsPortrait();
  const imgRef = useRef<HTMLImageElement>(null);
  const [natural, setNatural] = useState<{ w: number; h: number } | null>(null);
  const geo = useImageGeometry(natural);
  const walking = walkSide !== null;

  // 화면 방향에 따라 배경 이미지·길 좌표를 다르게 사용한다
  const bgSrc = isPortrait ? MOBILE_BACKGROUND_SRC : SHARED_BACKGROUND_SRC;
  const road = isPortrait ? ROAD_MOBILE : ROAD_DESKTOP;

  // 이미지 소스가 바뀌면(방향 전환) 새 이미지의 자연 크기로 갱신 (캐시 로드 보정 포함)
  useEffect(() => {
    const el = imgRef.current;
    if (el && el.complete && el.naturalWidth > 0) {
      setNatural({ w: el.naturalWidth, h: el.naturalHeight });
    } else {
      setNatural(null);
    }
  }, [bgSrc]);

  return (
    <div className="absolute inset-0 overflow-hidden bg-[#f8ecd6]">
      {/* 배경 이미지 — 방향별로 다른 이미지를 cover + center bottom으로 채운다.
          가로=가로형 이미지, 세로=세로형 이미지라 어느 화면이든 잘림이 최소. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        ref={imgRef}
        key={bgSrc}
        src={bgSrc}
        alt=""
        aria-hidden="true"
        draggable={false}
        onLoad={(e) =>
          setNatural({
            w: e.currentTarget.naturalWidth,
            h: e.currentTarget.naturalHeight,
          })
        }
        // 이미지 누락 시에도 캐릭터가 배치되도록 폴백
        onError={() => setNatural((prev) => prev ?? { w: 1600, h: 900 })}
        className="absolute inset-0 h-full w-full select-none object-cover"
        style={{ objectPosition: "center bottom" }}
      />

      {/* 캐릭터 (이미지 렌더 영역이 계산된 뒤 배치) */}
      {geo && (
        <Traveler geo={geo} road={road} phase={phase} side={walkSide} reduced={reduced} />
      )}

      {/* 질문 + 선택지 오버레이 */}
      <div className="absolute inset-0 z-20">
        {/* 질문 텍스트 — 상단 중앙 */}
        <motion.div
          aria-live="polite"
          className="absolute inset-x-0 top-[7%] flex flex-col items-center gap-3 px-6 text-center"
          initial={{ opacity: 0, y: reduced ? 0 : 24 }}
          animate={{
            opacity: isTransitioning ? 0 : 1,
            y: isTransitioning ? (reduced ? 0 : 12) : 0,
          }}
          transition={
            isTransitioning
              ? { duration: reduced ? 0.12 : 0.3 }
              : { delay: reduced ? 0 : 0.12, duration: reduced ? 0.2 : 0.5, ease: "easeOut" }
          }
        >
          <span className="inline-block rounded-full bg-white/80 px-3 py-1 text-xs font-bold tracking-wide text-[#004be6] shadow-sm backdrop-blur-md">
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

        {/* 선택지 카드 — 좌/우 갈래 길 방향에 오버레이 */}
        <div
          className="absolute inset-x-0 top-[50%] flex justify-between gap-3 px-4 sm:px-8"
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
                initial={{ opacity: 0, y: reduced ? 0 : 28 }}
                animate={{
                  opacity: isTransitioning ? 0 : 1,
                  y: isTransitioning ? (reduced ? 0 : 12) : 0,
                  scale: isChosen && !reduced ? 1.06 : 1,
                }}
                transition={
                  isTransitioning
                    ? {
                        duration: reduced ? 0.12 : 0.3,
                        delay: reduced ? 0 : 0.25,
                        scale: { delay: 0, duration: 0.18 },
                      }
                    : {
                        delay: reduced ? 0 : side === "left" ? 0.24 : 0.34,
                        duration: reduced ? 0.2 : 0.5,
                        ease: "easeOut",
                        scale: { delay: 0, duration: 0.18 },
                      }
                }
                whileTap={isTransitioning ? undefined : { scale: 0.97 }}
              >
                <span
                  className={`mb-1.5 inline-block rounded-full px-2 py-0.5 text-[11px] font-bold ${
                    isSelected || isChosen ? "bg-[#004be6] text-white" : "bg-slate-100 text-slate-500"
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
    </div>
  );
}
