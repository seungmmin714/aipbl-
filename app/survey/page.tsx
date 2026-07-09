"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { calculateMBTI, Answer } from "@/lib/mbti";
import questionsData from "@/data/questions.json";

// 축별 아이콘 매핑
const axisIcons: Record<string, string> = {
  Risk: "security",
  Info: "search",
  Term: "schedule",
  Asset: "account_balance",
};

// 축별 색상 매핑
const axisColors: Record<string, string> = {
  Risk: "#ef4444",
  Info: "#06B6D4",
  Term: "#f59e0b",
  Asset: "#10b981",
};

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

  // 현재 축 그룹의 시작 문항 번호 계산 (표시용)
  const currentAxisLabel = q.axisLabel;
  const currentAxisTitle = q.axisTitle;
  const axisIcon = axisIcons[currentAxisLabel] || "quiz";
  const axisColor = axisColors[currentAxisLabel] || "#6366F1";

  return (
    <div className="min-h-screen bg-[#f4f5f9] text-[#001a42] flex flex-col font-body-md relative overflow-x-hidden">
      {/* Ambient Background Effect */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] h-[80vh] pointer-events-none z-0"
        style={{
          background:
            "radial-gradient(circle, rgba(77, 142, 255, 0.04) 0%, rgba(244, 245, 249, 0) 70%)",
        }}
      ></div>

      {/* Top Navigation */}
      <header className="w-full px-gutter pt-6 pb-4 flex flex-col gap-4 sticky top-0 z-10 bg-[#f4f5f9]/80 backdrop-blur-md">
        <div className="flex justify-between items-center w-full max-w-container-max mx-auto">
          {/* Axis Badge */}
          <div
            className="flex items-center gap-2 px-3 py-1.5 rounded-full border"
            style={{
              borderColor: `${axisColor}30`,
              backgroundColor: `${axisColor}08`,
            }}
          >
            <span
              className="material-symbols-outlined text-sm"
              style={{ color: axisColor }}
            >
              {axisIcon}
            </span>
            <span
              className="font-label-mono text-label-mono uppercase tracking-widest"
              style={{ color: axisColor }}
            >
              {currentAxisTitle}
            </span>
          </div>

          {/* Question Counter */}
          <span className="font-label-mono text-label-mono text-[#004395] uppercase tracking-widest">
            {currentIdx + 1} / {totalQuestions}
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full max-w-container-max mx-auto h-2 bg-[#e1e2ec] rounded-full relative overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#06B6D4] to-[#4d8eff] rounded-full transition-all duration-500 ease-out relative"
            style={{
              width: `${((currentIdx + 1) / totalQuestions) * 100}%`,
            }}
          >
            {/* Leading Glow */}
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-[0_0_10px_2px_#4d8eff]" />
          </div>
        </div>
      </header>

      {/* Main Content Canvas */}
      <main className="flex-grow w-full max-w-container-max mx-auto px-gutter py-stack-lg flex flex-col items-center justify-center min-h-[600px] z-10">
        {/* Question Container */}
        <div
          className={`bg-white border border-[#e1e2ec] shadow-sm rounded-2xl p-6 md:p-10 w-full max-w-2xl flex flex-col gap-10 transition-all duration-250 ${
            isTransitioning
              ? direction === "next"
                ? "opacity-0 translate-x-8"
                : "opacity-0 -translate-x-8"
              : "opacity-100 translate-x-0"
          }`}
        >
          {/* Question Prompt */}
          <div className="text-center flex flex-col items-center gap-3">
            <span className="font-label-mono text-label-mono text-slate-400 uppercase tracking-widest">
              Question {currentIdx + 1}
            </span>
            <h1 className="font-headline-lg-mobile text-headline-lg-mobile md:text-[28px] md:leading-[38px] md:font-bold text-[#00285d] leading-relaxed">
              {q.text}
            </h1>
          </div>

          {/* Two Options - Vertical Cards */}
          <div className="flex flex-col gap-4 w-full">
            {q.options.map((opt, idx) => {
              const isSelected = selectedValue === opt.value;
              const optionLabel = idx === 0 ? "A" : "B";
              return (
                <button
                  key={idx}
                  onClick={() => saveAnswer(opt.value)}
                  className={`rounded-2xl p-5 md:p-6 flex items-start gap-4 text-left transition-all duration-200 transform hover:-translate-y-0.5 active:translate-y-0 focus:outline-none border-2 ${
                    isSelected
                      ? "border-[#4d8eff] bg-[rgba(77,142,255,0.06)] shadow-md shadow-[#4d8eff]/10"
                      : "border-[#e1e2ec] bg-white hover:bg-slate-50 hover:border-[#4d8eff]/40"
                  }`}
                >
                  {/* Option Label Badge */}
                  <div
                    className={`flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center font-headline-lg-mobile text-sm font-bold transition-colors ${
                      isSelected
                        ? "bg-[#4d8eff] text-white"
                        : "bg-[#f0f1f5] text-slate-400"
                    }`}
                  >
                    {optionLabel}
                  </div>
                  {/* Option Text */}
                  <span
                    className={`font-body-md text-body-md leading-relaxed pt-1.5 ${
                      isSelected
                        ? "text-[#001a42] font-medium"
                        : "text-[#3d4455]"
                    }`}
                  >
                    {opt.label}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Bottom Actions */}
          <div className="flex justify-between items-center pt-6 border-t border-[#e1e2ec]">
            <button
              onClick={handlePrev}
              disabled={currentIdx === 0}
              className="px-5 py-2.5 rounded-xl border border-[#8c909f]/40 text-slate-500 hover:bg-slate-100 transition-colors focus:outline-none disabled:opacity-30 disabled:pointer-events-none flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-lg">
                chevron_left
              </span>
              이전
            </button>
            <button
              onClick={handleNext}
              disabled={!selectedValue}
              className={`px-6 py-2.5 rounded-xl font-semibold flex items-center gap-1.5 transition-all ${
                selectedValue
                  ? "bg-[#585cf4] text-white hover:bg-[#4c50e0] shadow-md"
                  : "bg-[#e1e2ec] text-slate-400 cursor-not-allowed"
              }`}
            >
              {currentIdx === totalQuestions - 1 ? "결과 보기" : "다음"}
              <span className="material-symbols-outlined text-lg">
                {currentIdx === totalQuestions - 1
                  ? "check_circle"
                  : "chevron_right"}
              </span>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
