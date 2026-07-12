"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AnimatePresence, useReducedMotion } from "framer-motion";
import { calculateMBTI, Answer } from "@/lib/mbti";
import questionsData from "@/data/questions.json";
import ForkScene, {
  TravelerCharacter,
  CHARACTER_WALK_MS,
  CAMERA_PAN_MS,
  REDUCED_WALK_MS,
  REDUCED_PAN_MS,
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
  // 캐릭터 상태: 대기 → 걷기(선택한 길로) → 카메라 팬(다음 장면으로) → 대기
  const [phase, setPhase] = useState<TravelerPhase>("idle");
  // 걷기 중 방향 — 선택 버튼 하이라이트용 (걷기 끝나면 null)
  const [walkSide, setWalkSide] = useState<RoadSide | null>(null);
  // 카메라 팬 방향 — 장면 exit/enter 슬라이드용 (전환 종료까지 유지)
  const [panSide, setPanSide] = useState<RoadSide | null>(null);
  // 연타 방지 보강 — 같은 프레임에 두 번 클릭돼도 전환 타이머는 한 번만 등록
  const advancingRef = useRef(false);

  const totalQuestions = questionsData.length;
  const q = questionsData[currentIdx];

  // 현재 문항에 대한 이전 답변을 동기적으로 계산 (DEF-09: useEffect 대신 직접 계산)
  const prevAnswer = answers.find((a) => a.questionId === q.id);
  const selectedValue = prevAnswer ? prevAnswer.value : null;

  // sessionStorage에 상태 저장 (DEF-06)
  useEffect(() => {
    saveSurveyState({ currentIdx, answers });
  }, [currentIdx, answers]);

  // 참여자 시작 기록 (DB 통계용)
  useEffect(() => {
    trackStart();
  }, []);

  /**
   * 길(선택지) 선택 → 답변 저장 → 캐릭터가 그 길로 걸어감 → 카메라 팬으로
   * 다음 갈림길 장면이 이어져 들어옴. 답변 누적/채점/완주 로직은 기존과 동일하다.
   */
  const handleChoose = useCallback(
    (value: string, side: RoadSide) => {
      // DEF-01/TC-13: 전환 중 클릭 방지
      if (isTransitioning || advancingRef.current) return;
      advancingRef.current = true;

      // 답변 저장 — 문항별 1개로 교체 저장 (기존 로직 유지)
      setAnswers((prev) => {
        const filtered = prev.filter((a) => a.questionId !== q.id);
        return [...filtered, { questionId: q.id, value }];
      });
      setWalkSide(side);
      setPanSide(side);
      setPhase("walk");
      setIsTransitioning(true);

      const walkMs = reduced ? REDUCED_WALK_MS : CHARACTER_WALK_MS;
      const panMs = reduced ? REDUCED_PAN_MS : CAMERA_PAN_MS;
      window.setTimeout(() => {
        if (currentIdx < totalQuestions - 1) {
          // 걷기 완료 → 문항 교체와 동시에 카메라 팬 시작
          setCurrentIdx((prev) => prev + 1);
          setWalkSide(null);
          setPhase("pan");
          window.setTimeout(() => {
            advancingRef.current = false;
            setPanSide(null);
            setPhase("idle");
            setIsTransitioning(false);
          }, panMs);
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
    [isTransitioning, reduced, currentIdx, totalQuestions, answers, q.id, router]
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

  return (
    <div className="relative h-[100dvh] min-h-[560px] overflow-hidden bg-[#f4f5f9] font-body-md text-[#001a42]">
      {/* 갈림길 장면 — 문항 교체 시 이전 장면은 팬 아웃, 새 장면은 같은 방향에서 팬 인 */}
      <AnimatePresence initial={false}>
        <ForkScene
          key={q.id}
          question={q}
          index={currentIdx}
          total={totalQuestions}
          selectedValue={selectedValue}
          walkSide={walkSide}
          panSide={panSide}
          isTransitioning={isTransitioning}
          onChoose={handleChoose}
        />
      </AnimatePresence>

      {/* 3인칭 캐릭터 — 장면 전환과 무관하게 유지되며 선택한 길로 걸어간다 */}
      <TravelerCharacter phase={phase} side={panSide} reduced={reduced} />

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
