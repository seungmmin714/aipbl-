"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { calculateMBTI, Answer } from "@/lib/mbti";
import questionsData from "@/data/questions.json";

export default function SurveyPage() {
  const router = useRouter();
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [selectedValue, setSelectedValue] = useState<string | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [direction, setDirection] = useState<"next" | "prev">("next");

  const totalQuestions = questionsData.length;
  const q = questionsData[currentIdx];

  // 이전에 선택한 답변 복원
  useEffect(() => {
    const prev = answers.find((a) => a.questionId === q.id);
    setSelectedValue(prev ? prev.value : null);
  }, [currentIdx, q.id, answers]);

  const saveAnswer = (value: string) => {
    setSelectedValue(value);
    setAnswers((prev) => {
      const filtered = prev.filter((a) => a.questionId !== q.id);
      return [...filtered, { questionId: q.id, value }];
    });
  };

  const handleNext = () => {
    if (!selectedValue) return;

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
      const code = calculateMBTI(finalAnswers);
      router.push(`/result/${code}`);
    }
  };

  const handlePrev = () => {
    if (currentIdx > 0) {
      setDirection("prev");
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentIdx((prev) => prev - 1);
        setIsTransitioning(false);
      }, 250);
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f5f9] text-[#001a42] flex flex-col font-body-md relative overflow-x-hidden">
      {/* Top Header App Bar */}
      <header className="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-6 h-16 bg-white border-b border-slate-100/80 shadow-sm">
        <div className="flex items-center text-[#004be6] hover:opacity-80">
          <Link href="/">
            <span className="material-symbols-outlined text-2xl font-light">account_circle</span>
          </Link>
        </div>
        <span className="font-extrabold text-[#004be6] text-xl tracking-tight">Invest-Type</span>
        <div className="flex items-center text-[#004be6]">
          <span className="material-symbols-outlined text-2xl font-light">help_outline</span>
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
          <div className="w-full h-2 bg-slate-200/60 rounded-full overflow-hidden relative">
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

          {/* Binary Options */}
          <div className="flex flex-col gap-3 w-full">
            {q.options.map((opt, idx) => {
              const isSelected = selectedValue === opt.value;
              return (
                <button
                  key={idx}
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
                        <span className="material-symbols-outlined text-[16px] font-bold">check</span>
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
            disabled={currentIdx === 0}
            className="w-[30%] py-4 bg-white border border-slate-200 text-slate-500 rounded-2xl font-bold flex items-center justify-center hover:bg-slate-50 transition-all text-sm disabled:opacity-30 disabled:pointer-events-none"
          >
            이전
          </button>
          <button
            onClick={handleNext}
            disabled={!selectedValue}
            className={`w-[70%] py-4 rounded-2xl font-bold flex items-center justify-center gap-1.5 transition-all text-sm ${
              selectedValue
                ? "bg-[#004be6] text-white hover:bg-[#003cb3] shadow-md"
                : "bg-slate-200 text-slate-400 cursor-not-allowed"
            }`}
          >
            <span>{currentIdx === totalQuestions - 1 ? "결과 보기" : "다음"}</span>
            <span className="material-symbols-outlined text-base">arrow_forward</span>
          </button>
        </div>

      </main>
    </div>
  );
}
