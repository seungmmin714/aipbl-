"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { calculateMBTI, Answer, TOTAL_QUESTIONS } from "@/lib/mbti";
import questionsData from "@/data/questions.json";

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
  const [direction, setDirection] = useState<"next" | "prev">("next");

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

  const saveAnswer = useCallback(
    (value: string) => {
      if (isTransitioning) return; // 전환 중 클릭 방지 (TC-13)
      setAnswers((prev) => {
        const filtered = prev.filter((a) => a.questionId !== q.id);
        return [...filtered, { questionId: q.id, value }];
      });
    },
    [isTransitioning, q.id]
  );

  const handleNext = useCallback(() => {
    // DEF-01: isTransitioning 가드 추가 — 연타 방지
    if (!selectedValue || isTransitioning) return;

    if (currentIdx < totalQuestions - 1) {
      setDirection("next");
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentIdx((prev) => prev + 1);
        setIsTransitioning(false);
      }, 250);
    } else {
      // 마지막 문항 → 결과 계산
      const finalAnswers = answers.filter((a) => a.questionId !== q.id);
      finalAnswers.push({ questionId: q.id, value: selectedValue });

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
  }, [selectedValue, isTransitioning, currentIdx, totalQuestions, answers, q.id, router]);

  const handlePrev = useCallback(() => {
    // DEF-01: isTransitioning 가드 추가
    if (currentIdx <= 0 || isTransitioning) return;

    setDirection("prev");
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentIdx((prev) => prev - 1);
      setIsTransitioning(false);
    }, 250);
  }, [currentIdx, isTransitioning]);

  return (
    <div className="min-h-screen bg-[#f4f5f9] text-[#001a42] flex flex-col font-body-md relative overflow-x-hidden">
      {/* Top Header App Bar */}
      <header className="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-6 h-16 bg-white border-b border-slate-100/80 shadow-sm">
        <div className="flex items-center text-[#004be6] hover:opacity-80">
          <Link href="/">
            <span className="material-symbols-outlined text-2xl font-light" aria-hidden="true">arrow_back</span>
          </Link>
        </div>
        <span className="font-extrabold text-[#004be6] text-xl tracking-tight">Invest-Type</span>
        <div className="flex items-center text-[#004be6]">
          <span className="material-symbols-outlined text-2xl font-light" aria-hidden="true">help_outline</span>
        </div>
      </header>

      {/* Main Content Canvas */}
      <main className="flex-grow w-full max-w-md mx-auto px-4 pt-20 pb-8 flex flex-col justify-between min-h-[600px] z-10">
        
        {/* Progress & Badge Indicator */}
        <div className="flex flex-col gap-3 mt-4 w-full">
          <div className="flex justify-between items-center w-full">
            {/* Pill Badge: Question XX */}
            <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-[#e8edfc] text-[#004be6] tracking-wide">
              Question {String(currentIdx + 1).padStart(2, "0")}
            </span>
            {/* Progress Text */}
            <span className="text-xs text-slate-500 font-semibold">
              진행률 {currentIdx + 1}/{totalQuestions}
            </span>
          </div>

          {/* Progress Bar (DEF-19: role="progressbar" 추가) */}
          <div
            className="w-full h-2 bg-slate-200/60 rounded-full overflow-hidden relative"
            role="progressbar"
            aria-valuenow={currentIdx + 1}
            aria-valuemin={1}
            aria-valuemax={totalQuestions}
            aria-label={`진행률: ${totalQuestions}문항 중 ${currentIdx + 1}번째`}
          >
            <div
              className="h-full bg-gradient-to-r from-[#004be6] to-[#06b6d4] rounded-full transition-all duration-300 ease-out"
              style={{
                width: `${((currentIdx + 1) / totalQuestions) * 100}%`,
              }}
            ></div>
          </div>
        </div>

        {/* Question Area — aria-live로 문항 전환 시 낭독 (DEF-19) */}
        <div
          aria-live="polite"
          className={`flex-grow flex flex-col justify-center my-6 transition-all duration-250 ${
            isTransitioning
              ? direction === "next"
                ? "opacity-0 translate-x-8"
                : "opacity-0 -translate-x-8"
              : "opacity-100 translate-x-0"
          }`}
        >
          {/* Question Text */}
          <h2 className="text-xl md:text-2xl font-black text-slate-800 leading-snug text-left mb-2 break-keep">
            Q{currentIdx + 1}. {q.text}
          </h2>
          {/* Subtext instruction */}
          <p className="text-slate-400 text-xs md:text-sm font-semibold text-left mb-8">
            당신의 실제 투자 성향을 가장 잘 나타내는 항목을 선택해 주세요.
          </p>

          {/* Binary Options (DEF-19: role="radiogroup" 추가) */}
          <div className="flex flex-col gap-3 w-full" role="radiogroup" aria-label={q.axisTitle}>
            {q.options.map((opt, idx) => {
              const isSelected = selectedValue === opt.value;
              return (
                <button
                  key={`${q.id}-${idx}`}
                  onClick={() => saveAnswer(opt.value)}
                  role="radio"
                  aria-checked={isSelected}
                  disabled={isTransitioning}
                  className={`rounded-2xl p-5 flex items-center justify-between text-left transition-all duration-200 border-2 w-full ${
                    isSelected
                      ? "border-[#004be6] bg-[#f0f4ff] shadow-sm"
                      : "border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300"
                  } ${isTransitioning ? "pointer-events-none" : ""}`}
                >
                  {/* Option Text */}
                  <span
                    className={`font-semibold text-sm md:text-base leading-relaxed pr-4 ${
                      isSelected ? "text-[#004be6]" : "text-slate-700"
                    }`}
                  >
                    {opt.label}
                  </span>

                  {/* Selector Circle */}
                  <div className="flex-shrink-0">
                    {isSelected ? (
                      <div className="w-6 h-6 bg-[#004be6] rounded-full flex items-center justify-center text-white shadow-inner">
                        <span className="material-symbols-outlined text-[16px] font-bold" aria-hidden="true">check</span>
                      </div>
                    ) : (
                      <div className="w-6 h-6 border-2 border-slate-200 rounded-full"></div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Action Buttons (Bottom) — DEF-01: disabled={isTransitioning} 추가 */}
        <div className="flex gap-4 w-full mt-auto pt-4 border-t border-slate-100">
          <button
            onClick={handlePrev}
            disabled={currentIdx === 0 || isTransitioning}
            className="w-[30%] py-4 bg-white border border-slate-200 text-slate-500 rounded-2xl font-bold flex items-center justify-center hover:bg-slate-50 transition-all text-sm disabled:opacity-30 disabled:pointer-events-none"
          >
            이전
          </button>
          <button
            onClick={handleNext}
            disabled={!selectedValue || isTransitioning}
            className={`w-[70%] py-4 rounded-2xl font-bold flex items-center justify-center gap-1.5 transition-all text-sm ${
              selectedValue && !isTransitioning
                ? "bg-[#004be6] text-white hover:bg-[#003cb3] shadow-md"
                : "bg-slate-200 text-slate-400 cursor-not-allowed"
            }`}
          >
            <span>{currentIdx === totalQuestions - 1 ? "결과 보기" : "다음"}</span>
            <span className="material-symbols-outlined text-base" aria-hidden="true">arrow_forward</span>
          </button>
        </div>

      </main>
    </div>
  );
}
