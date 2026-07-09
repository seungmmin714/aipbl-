"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { calculateMBTI, InvalidAnswersError, Answer } from "@/lib/mbti";
import questionsData from "@/data/questions.json";

/** 전환 애니메이션 지속 시간(ms). CSS의 duration-200과 반드시 일치시킬 것. */
const TRANSITION_MS = 200;
const STORAGE_KEY = "invest-mbti:progress";

interface SavedProgress {
  currentIdx: number;
  answers: Answer[];
}

export default function SurveyPage() {
  const router = useRouter();
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [direction, setDirection] = useState<"next" | "prev">("next");
  const [restored, setRestored] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const totalQuestions = questionsData.length;
  const q = questionsData[currentIdx];

  // selectedValue는 answers에서 파생 — 별도 state로 두면 문항 전환 시 한 프레임 잔상이 남는다.
  const selectedValue = answers.find((a) => a.questionId === q.id)?.value ?? null;

  // 새로고침 대비: sessionStorage에서 진행 상황 복원 (마운트 시 1회)
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved: SavedProgress = JSON.parse(raw);
        const validIds = new Set(questionsData.map((x) => x.id));
        const clean = (saved.answers ?? []).filter((a) => validIds.has(a.questionId));
        setAnswers(clean);
        setCurrentIdx(
          Math.min(Math.max(saved.currentIdx ?? 0, 0), questionsData.length - 1)
        );
      }
    } catch {
      /* 손상된 저장값은 무시하고 처음부터 시작 */
    }
    setRestored(true);
  }, []);

  // 진행 상황 저장
  useEffect(() => {
    if (!restored) return;
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ currentIdx, answers }));
    } catch {
      /* 저장 실패는 치명적이지 않음 */
    }
  }, [currentIdx, answers, restored]);

  // 언마운트 시 예약된 타이머 정리 (메모리 누수 · 유령 상태 갱신 방지)
  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  const saveAnswer = (value: string) => {
    if (isTransitioning) return;
    setAnswers((prev) => [
      ...prev.filter((a) => a.questionId !== q.id),
      { questionId: q.id, value },
    ]);
  };

  const move = (dir: "next" | "prev") => {
    setDirection(dir);
    setIsTransitioning(true);
    timerRef.current = setTimeout(() => {
      setCurrentIdx((prev) => prev + (dir === "next" ? 1 : -1));
      setIsTransitioning(false);
    }, TRANSITION_MS);
  };

  const handleNext = () => {
    // isTransitioning 가드가 없으면 연타 시 currentIdx가 2 증가해
    // 문항을 건너뛰거나(결과 25% 반전) 배열 범위를 넘어 크래시한다.
    if (!selectedValue || isTransitioning) return;

    if (currentIdx < totalQuestions - 1) {
      move("next");
      return;
    }

    // 마지막 문항 → 결과 계산
    const finalAnswers: Answer[] = [
      ...answers.filter((a) => a.questionId !== q.id),
      { questionId: q.id, value: selectedValue },
    ];

    try {
      const { code } = calculateMBTI(finalAnswers);
      sessionStorage.removeItem(STORAGE_KEY);
      router.push(`/result/${code}`);
    } catch (err) {
      if (err instanceof InvalidAnswersError) {
        // 여기 도달했다면 UI 가드가 뚫린 것 — 조용히 틀린 결과를 주느니 처음부터.
        console.error("[survey] 응답 검증 실패:", err.message);
        alert("응답에 문제가 있어 처음부터 다시 시작합니다.");
        sessionStorage.removeItem(STORAGE_KEY);
        setAnswers([]);
        setCurrentIdx(0);
        return;
      }
      throw err; // 예상치 못한 오류는 error.tsx가 받는다
    }
  };

  const handlePrev = () => {
    if (currentIdx > 0 && !isTransitioning) move("prev");
  };

  return (
    <div className="min-h-screen bg-[#f4f5f9] text-[#001a42] flex flex-col font-body-md relative overflow-x-hidden">
      {/* Top Header App Bar */}
      <header className="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-6 h-16 bg-white border-b border-slate-100/80 shadow-sm">
        <div className="flex items-center text-[#004be6] hover:opacity-80">
          <Link href="/">
            <span aria-hidden="true" className="material-symbols-outlined text-2xl font-light">account_circle</span>
            <span className="sr-only">홈으로</span>
          </Link>
        </div>
        <span className="font-extrabold text-[#004be6] text-xl tracking-tight">Visionary Analyst</span>
        <div className="flex items-center text-[#004be6]">
          <span aria-hidden="true" className="material-symbols-outlined text-2xl font-light">help_outline</span>
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

          {/* Progress Bar */}
          <div
            role="progressbar"
            aria-valuemin={1}
            aria-valuemax={totalQuestions}
            aria-valuenow={currentIdx + 1}
            aria-label={`전체 ${totalQuestions}문항 중 ${currentIdx + 1}번째`}
            className="w-full h-2 bg-slate-200/60 rounded-full overflow-hidden relative"
          >
            <div
              className="h-full bg-gradient-to-r from-[#004be6] to-[#06b6d4] rounded-full transition-all duration-300 ease-out"
              style={{
                width: `${((currentIdx + 1) / totalQuestions) * 100}%`,
              }}
            ></div>
          </div>
        </div>

        {/* Question Area (No Image) */}
        <div
          className={`flex-grow flex flex-col justify-center my-6 transition-all duration-200 ${
            isTransitioning
              ? direction === "next"
                ? "opacity-0 translate-x-8"
                : "opacity-0 -translate-x-8"
              : "opacity-100 translate-x-0"
          }`}
        >
          {/* Question Text */}
          <h2 aria-live="polite" className="text-xl md:text-2xl font-black text-slate-800 leading-snug text-left mb-2 break-keep">
            Q{currentIdx + 1}. {q.text}
          </h2>
          {/* Subtext instruction */}
          <p className="text-slate-400 text-xs md:text-sm font-semibold text-left mb-8">
            당신의 실제 투자 성향을 가장 잘 나타내는 항목을 선택해 주세요.
          </p>

          {/* Binary Options */}
          <div role="radiogroup" aria-label={q.text} className="flex flex-col gap-3 w-full">
            {q.options.map((opt, idx) => {
              const isSelected = selectedValue === opt.value;
              return (
                <button
                  key={idx}
                  role="radio"
                  aria-checked={isSelected}
                  onClick={() => saveAnswer(opt.value)}
                  className={`rounded-2xl p-5 flex items-center justify-between text-left transition-all duration-200 border-2 w-full ${
                    isSelected
                      ? "border-[#004be6] bg-[#f0f4ff] shadow-sm"
                      : "border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300"
                  }`}
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
                        <span aria-hidden="true" className="material-symbols-outlined text-[16px] font-bold">check</span>
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

        {/* Action Buttons (Bottom) */}
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
            <span aria-hidden="true" className="material-symbols-outlined text-base">arrow_forward</span>
          </button>
        </div>

      </main>
    </div>
  );
}
