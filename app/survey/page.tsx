"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SurveyPage() {
  const router = useRouter();
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(3); // 네 번째 옵션을 기본 선택 처리하여 이미지와 싱크 맞춤

  // 더미용 문항 데이터 (survey-screen/code.html 스펙에 맞춤)
  const dummyQuestions = [
    {
      id: "q1",
      text: "투자 원금이 20% 손실 나면?",
      options: [
        { label: "즉시 매도한다", icon: "sell", color: "text-[#93000a]" },
        { label: "일부 매도한다", icon: "remove_shopping_cart", color: "text-[#df7412]" },
        { label: "기다린다", icon: "hourglass_empty", color: "text-[#8c909f]" },
        { label: "추가 매수한다", icon: "add_shopping_cart", color: "text-[#005ac2]", fill: true }
      ]
    }
  ];

  const q = dummyQuestions[0];

  const handleNext = () => {
    if (currentIdx < 9) {
      setCurrentIdx((prev) => prev + 1);
      setSelectedOption(null); // 다음 질문으로 넘어갈 때는 선택 초기화
    } else {
      router.push("/result/RDLG");
    }
  };

  const handlePrev = () => {
    if (currentIdx > 0) {
      setCurrentIdx((prev) => prev - 1);
      setSelectedOption(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f5f9] text-[#001a42] flex flex-col font-body-md relative overflow-x-hidden">
      {/* Ambient Background Effect */}
      <div 
        className="absolute top-50 left-50 -translate-x-1/2 -translate-y-1/2 w-[80vw] h-[80vh] pointer-events-none z-0"
        style={{
          background: "radial-gradient(circle, rgba(77, 142, 255, 0.04) 0%, rgba(244, 245, 249, 0) 70%)"
        }}
      ></div>

      {/* Top Navigation */}
      <header className="w-full px-gutter pt-8 pb-4 flex flex-col gap-4 sticky top-0 z-10 bg-[#f4f5f9]/80 backdrop-blur-md">
        <div className="flex justify-between items-center w-full max-w-container-max mx-auto">
          <span className="font-label-mono text-label-mono text-[#004395] uppercase tracking-widest">
            문항 {currentIdx + 1} / 10
          </span>
        </div>
        {/* Progress Bar */}
        <div className="w-full max-w-container-max mx-auto h-2 bg-[#e1e2ec] rounded-full relative overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#06B6D4] to-[#4d8eff] rounded-full transition-all duration-300 relative"
            style={{ width: `${((currentIdx + 1) / 10) * 100}%` }}
          >
            {/* Leading Glow */}
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-[0_0_10px_2px_#4d8eff]" />
          </div>
        </div>
      </header>

      {/* Main Content Canvas */}
      <main className="flex-grow w-full max-w-container-max mx-auto px-gutter py-stack-lg flex flex-col items-center justify-center min-h-[716px] z-10">
        {/* Question Container */}
        <div className="bg-white border border-[#e1e2ec] shadow-sm rounded-xl p-8 w-full max-w-3xl flex flex-col gap-20 slide-up-fade">
          
          {/* Question Prompt */}
          <div className="text-center">
            <h1 className="font-headline-lg-mobile text-headline-lg-mobile md:font-headline-lg md:text-headline-lg text-[#00285d] mb-2">
              Q{currentIdx + 1}. {q.text}
            </h1>
          </div>

          {/* Options Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-stack-md w-full">
            {q.options.map((opt, idx) => {
              const isSelected = selectedOption === idx;
              return (
                <button
                  key={idx}
                  onClick={() => setSelectedOption(idx)}
                  className={`rounded-lg p-6 flex flex-col items-center justify-center gap-4 text-center min-h-[120px] transition-all transform hover:-translate-y-0.5 active:translate-y-0 focus:outline-none border ${
                    isSelected
                      ? "border-[#4d8eff] bg-[rgba(77,142,255,0.05)] shadow-md"
                      : "border-[#e1e2ec] bg-white hover:bg-slate-50 hover:border-[#4d8eff]/70"
                  }`}
                >
                  <span 
                    className={`material-symbols-outlined text-3xl ${opt.color}`}
                    style={{
                      fontVariationSettings: opt.fill && isSelected ? "'FILL' 1" : undefined
                    }}
                  >
                    {opt.icon}
                  </span>
                  <span className="font-body-md text-body-md text-[#001a42] font-medium">
                    {opt.label}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Bottom Actions */}
          <div className="flex justify-between items-center pt-8 border-t border-[#e1e2ec]">
            <button
              onClick={handlePrev}
              disabled={currentIdx === 0}
              className="px-6 py-2 rounded-lg border border-[#8c909f] text-slate-500 hover:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-30 disabled:pointer-events-none"
            >
              이전
            </button>
            <button
              onClick={handleNext}
              className="px-6 py-2 rounded-lg bg-[#d8e2ff] text-[#001a42] font-semibold hover:opacity-90 transition-colors focus:outline-none"
            >
              다음
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
