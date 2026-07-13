"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useReducedMotion } from "framer-motion";
import { calculateMBTI, Answer } from "@/lib/mbti";
import questionsData from "@/data/questions.json";
import ForkScene, {
  CHARACTER_WALK_MS,
  REDUCED_WALK_MS,
  type RoadSide,
  type TravelerPhase,
} from "./ForkScene";

const STORAGE_KEY = "investMBTI_survey";
const PARTICIPANT_KEY = "investMBTI_participant";

/** 참여자 시작 기록 — 실패해도 설문 진행을 막지 않는다 */
function trackStart() {
  if (typeof window === "undefined") return;
  if (
    sessionStorage.getItem(PARTICIPANT_KEY) ||
    sessionStorage.getItem(`${PARTICIPANT_KEY}_pending`)
  ) {
    return;
  }
  sessionStorage.setItem(`${PARTICIPANT_KEY}_pending`, "1");
  fetch("/api/track", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ event: "start" }),
  })
    .then((res) => (res.ok ? res.json() : null))
    .then((data) => {
      if (data?.participantId) {
        sessionStorage.setItem(PARTICIPANT_KEY, data.participantId);
      }
    })
    .catch(() => {})
    .finally(() => sessionStorage.removeItem(`${PARTICIPANT_KEY}_pending`));
}

/** 참여자 완료 기록 (fire-and-forget) */
function trackComplete() {
  if (typeof window === "undefined") return;
  const participantId = sessionStorage.getItem(PARTICIPANT_KEY);
  if (!participantId) return;
  fetch("/api/track", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ event: "complete", participantId }),
  }).catch(() => {});
}

interface SurveyState {
  currentIdx: number;
  answers: Answer[];
  /** 셔플된 문항 ID 순서 — 세션 동안 유지 (뒤로가기/새로고침에도 동일) */
  order?: string[];
}

const ALL_QUESTION_IDS = questionsData.map((q) => q.id);
const QUESTION_BY_ID = new Map(questionsData.map((q) => [q.id, q]));

/** Fisher-Yates 셔플 (원본 배열은 변경하지 않음) */
function shuffleIds(ids: string[]): string[] {
  const arr = [...ids];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/** 저장된 순서가 현재 문항 ID 집합과 정확히 일치하는지 검증 */
function isValidOrder(order: unknown): order is string[] {
  return (
    Array.isArray(order) &&
    order.length === ALL_QUESTION_IDS.length &&
    new Set(order).size === order.length &&
    order.every((id) => QUESTION_BY_ID.has(id as string))
  );
}

function loadSurveyState(): SurveyState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (
      typeof parsed.currentIdx === "number" &&
      Array.isArray(parsed.answers)
    ) {
      return parsed as SurveyState;
    }
  } catch {
    /* 파싱 실패 시 무시 */
  }
  return null;
}

function saveSurveyState(state: SurveyState) {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* 저장 실패 시 무시 */
  }
}

function clearSurveyState() {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    /* 삭제 실패 시 무시 */
  }
}

export default function SurveyPage() {
  const router = useRouter();
  const reduced = !!useReducedMotion();

  // sessionStorage에서 복원 (DEF-06)
  const [currentIdx, setCurrentIdx] = useState(() => {
    const saved = loadSurveyState();
    return saved ? saved.currentIdx : 0;
  });
  const [answers, setAnswers] = useState<Answer[]>(() => {
    const saved = loadSurveyState();
    return saved ? saved.answers : [];
  });
  const [isTransitioning, setIsTransitioning] = useState(false);
  // 캐릭터 상태: 대기 → 걷기(선택한 길로) → (문항 교체) → 다시 대기
  const [phase, setPhase] = useState<TravelerPhase>("idle");
  // 걷는 방향 — 선택 버튼 하이라이트 + 캐릭터 이동 방향
  const [walkSide, setWalkSide] = useState<RoadSide | null>(null);
  // 연타 방지 보강 — 같은 프레임에 두 번 클릭돼도 전환 타이머는 한 번만 등록
  const advancingRef = useRef(false);

  // 문항 출제 순서 — 시작 시 무작위 셔플, 세션 동안 유지 (SSR 불일치 방지를 위해
  // 클라이언트 마운트 후 초기화)
  const [order, setOrder] = useState<string[] | null>(null);
  useEffect(() => {
    const saved = loadSurveyState();
    setOrder(
      saved && isValidOrder(saved.order) ? saved.order : shuffleIds(ALL_QUESTION_IDS)
    );
  }, []);

  const totalQuestions = questionsData.length;
  // 표시 순서(currentIdx)는 셔플된 순서 기준, 문항 자체는 ID로 조회
  const q = order
    ? QUESTION_BY_ID.get(order[Math.min(currentIdx, totalQuestions - 1)]) ?? null
    : null;

  // 현재 문항에 대한 이전 답변을 동기적으로 계산 (DEF-09: useEffect 대신 직접 계산)
  const prevAnswer = q ? answers.find((a) => a.questionId === q.id) : undefined;
  const selectedValue = prevAnswer ? prevAnswer.value : null;

  // sessionStorage에 상태 저장 (DEF-06) — 셔플 순서도 함께 저장
  useEffect(() => {
    if (!order) return;
    saveSurveyState({ currentIdx, answers, order });
  }, [currentIdx, answers, order]);

  // 참여자 시작 기록 (DB 통계용)
  useEffect(() => {
    trackStart();
  }, []);

  /**
   * 길(선택지) 선택 → 답변 저장 → 캐릭터가 그 길로 걸어감 → 문항 교체 후
   * 캐릭터는 다시 시작점에서 대기. 답변 누적/채점/완주 로직은 기존과 동일하다.
   */
  const handleChoose = useCallback(
    (value: string, side: RoadSide) => {
      // DEF-01/TC-13: 전환 중 클릭 방지 (순서 초기화 전이면 무시)
      if (!q || isTransitioning || advancingRef.current) return;
      advancingRef.current = true;

      // 답변 저장 — 문항별 1개로 교체 저장 (기존 로직 유지)
      setAnswers((prev) => {
        const filtered = prev.filter((a) => a.questionId !== q.id);
        return [...filtered, { questionId: q.id, value }];
      });
      setWalkSide(side);
      setPhase("walk");
      setIsTransitioning(true);

      const walkMs = reduced ? REDUCED_WALK_MS : CHARACTER_WALK_MS;
      window.setTimeout(() => {
        advancingRef.current = false;
        if (currentIdx < totalQuestions - 1) {
          // 걷기 완료 → 문항 교체, 캐릭터는 시작점으로 리셋
          setCurrentIdx((prev) => prev + 1);
          setWalkSide(null);
          setPhase("idle");
          setIsTransitioning(false);
        } else {
          // 마지막 문항 → 결과 계산 (기존 handleNext의 완주 처리와 동일)
          const finalAnswers = answers.filter((a) => a.questionId !== q.id);
          finalAnswers.push({ questionId: q.id, value });

          try {
            const result = calculateMBTI(finalAnswers);
            clearSurveyState(); // 완주 시 sessionStorage 정리 (TC-20)
            trackComplete(); // 완료 시각 기록 (participantId는 유지 — 결과/피드백 연결용)
            router.push(`/result/${result.code}`);
          } catch (err) {
            console.error("채점 오류:", err);
            // 에러 발생 시에도 가능한 코드로 이동
            clearSurveyState();
            router.push("/");
          }
        }
      }, walkMs);
    },
    [isTransitioning, reduced, currentIdx, totalQuestions, answers, q, router]
  );

  const handlePrev = useCallback(() => {
    // DEF-01: isTransitioning 가드
    if (currentIdx <= 0 || isTransitioning || advancingRef.current) return;

    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentIdx((prev) => prev - 1);
      setIsTransitioning(false);
    }, 300);
  }, [currentIdx, isTransitioning]);

  // 셔플 순서 초기화 전(첫 프레임) — 배경색만 렌더 (SSR/hydration 불일치 방지)
  if (!q) {
    return (
      <div className="relative h-[100dvh] min-h-[560px] overflow-hidden bg-[#f4f5f9]" />
    );
  }

  return (
    <div className="relative h-[100dvh] min-h-[560px] overflow-hidden bg-[#f4f5f9] font-body-md text-[#001a42]">
      {/* 갈림길 장면 — 배경 이미지(길 포함, 고정) + 걷는 캐릭터 + 질문/선택지.
          배경은 문항이 바뀌어도 그대로 유지되고 질문·선택지만 교체된다. */}
      <ForkScene
        question={q}
        index={currentIdx}
        total={totalQuestions}
        selectedValue={selectedValue}
        walkSide={walkSide}
        phase={phase}
        isTransitioning={isTransitioning}
        onChoose={handleChoose}
      />

      {/* 상단 플로팅 크롬 (장면 리마운트와 무관하게 유지) */}
      <div className="absolute inset-x-0 top-0 z-30 flex items-center justify-between px-4 pt-4">
        <Link
          href="/"
          aria-label="홈으로 나가기"
          className="flex h-10 w-10 items-center justify-center rounded-full border border-white/70 bg-white/80 text-slate-600 shadow backdrop-blur-md transition-colors hover:bg-white"
        >
          <span className="material-symbols-outlined text-xl" aria-hidden="true">
            home
          </span>
        </Link>
        <span className="rounded-full border border-white/70 bg-white/70 px-3 py-1.5 text-sm font-extrabold tracking-tight text-[#004be6] shadow backdrop-blur-md">
          Invest-Type
        </span>
      </div>

      {/* 하단 진행도 바 — 현재 문항/전체 표시 (DEF-19: role="progressbar" 유지) */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-30 bg-gradient-to-t from-[#2e5c22]/20 to-transparent px-4 pb-5 pt-10">
        <div className="pointer-events-auto mx-auto flex w-full max-w-md items-center gap-3">
          <button
            type="button"
            onClick={handlePrev}
            disabled={currentIdx === 0 || isTransitioning}
            aria-label="이전 문항으로"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/70 bg-white/85 text-slate-600 shadow backdrop-blur-md transition-colors hover:bg-white disabled:pointer-events-none disabled:opacity-30"
          >
            <span className="material-symbols-outlined text-xl" aria-hidden="true">
              arrow_back
            </span>
          </button>
          <div
            className="relative h-2.5 flex-1 overflow-hidden rounded-full bg-white/50 shadow-inner"
            role="progressbar"
            aria-valuenow={currentIdx + 1}
            aria-valuemin={1}
            aria-valuemax={totalQuestions}
            aria-label={`진행률: ${totalQuestions}문항 중 ${currentIdx + 1}번째`}
          >
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#004be6] to-[#06b6d4] transition-all duration-300 ease-out"
              style={{
                width: `${((currentIdx + 1) / totalQuestions) * 100}%`,
              }}
            ></div>
          </div>
          <span className="shrink-0 rounded-full bg-white/75 px-2.5 py-1 text-xs font-bold text-slate-700 shadow-sm backdrop-blur-md">
            {currentIdx + 1} / {totalQuestions}
          </span>
        </div>
      </div>
    </div>
  );
}
