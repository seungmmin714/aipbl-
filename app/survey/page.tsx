"use client";

import { useState } from "react";
import Link from "next/link";

export default function SurveyPage() {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);

  // 더미용 문항 데이터 (DESIGN_GUIDE.md 스펙에 맞춤)
  const dummyQuestions = [
    {
      id: "q1",
      text: "Q1. 투자 원금이 20% 손실이 나면 어떻게 대처하시겠습니까?",
      options: [
        { label: "즉시 매도한다", icon: "sell", color: "text-red-500" },
        { label: "일부 매도한다", icon: "remove_shopping_cart", color: "text-amber-500" },
        { label: "기다린다", icon: "hourglass_empty", color: "text-slate-400" },
        { label: "추가 매수한다", icon: "add_shopping_cart", color: "text-indigo-400" }
      ]
    }
  ];

  const q = dummyQuestions[0]; // 더미이므로 첫 번째 문항 고정

  return (
    <>
      {/* Ambient Background Effect */}
      <div className="ambient-glow opacity-30"></div>
      <div className="tech-bg"></div>

      {/* Top Navigation */}
      <header className="w-full max-w-lg mx-auto px-4 pt-8 pb-4 flex flex-col gap-4 sticky top-0 z-10 bg-[#10131a]/80 backdrop-blur-md">
        <div className="flex justify-between items-center w-full">
          <span className="font-label-mono text-label-mono text-indigo-400 uppercase tracking-widest">
            문항 {currentIdx + 1} / 10
          </span>
        </div>
        {/* Custom Progress Bar */}
        <div className="w-full h-2 rounded-full bg-slate-800 relative overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-cyan-400 to-indigo-500 rounded-full transition-all duration-300 relative"
            style={{ width: `${((currentIdx + 1) / 10) * 100}%` }}
          >
            {/* Leading Glow */}
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 bg-white rounded-full shadow-[0_0_8px_2px_#6366F1]" />
          </div>
        </div>
      </header>

      {/* Main Content Canvas */}
      <main className="flex-grow flex flex-col items-center justify-center py-8 relative z-10">
        {/* Question Container */}
        <div className="bg-surface-glass border border-white/5 backdrop-blur-md rounded-2xl p-6 w-full max-w-md flex flex-col gap-8">
          {/* Question Prompt */}
          <div className="text-center">
            <h1 className="font-headline-lg text-xl md:text-2xl text-slate-100 font-bold leading-relaxed">
              {q.text}
            </h1>
          </div>

          {/* Options Grid */}
          <div className="grid grid-cols-1 gap-4 w-full">
            {q.options.map((opt, idx) => {
              const isSelected = selectedOption === idx;
              return (
                <button
                  key={idx}
                  onClick={() => setSelectedOption(idx)}
                  className={`rounded-2xl p-5 flex flex-col items-center justify-center gap-3 text-center min-h-[120px] transition-all transform hover:-translate-y-0.5 active:translate-y-0 focus:outline-none ${
                    isSelected
                      ? "border border-indigo-500 bg-indigo-500/10 shadow-[0_0_15px_rgba(99,102,241,0.2)]"
                      : "border border-white/10 bg-surface-glass hover:border-indigo-500/50 hover:bg-white/5"
                  }`}
                >
                  <span className={`material-symbols-outlined text-3xl ${opt.color}`}>
                    {opt.icon}
                  </span>
                  <span className="font-body-md text-slate-200 font-medium">
                    {opt.label}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Bottom Actions */}
          <div className="flex justify-between items-center pt-6 border-t border-white/5">
            <button
              disabled={currentIdx === 0}
              className="px-6 py-2.5 rounded-xl border border-white/10 text-slate-400 hover:text-white hover:bg-white/5 transition-colors disabled:opacity-30 disabled:pointer-events-none"
            >
              이전
            </button>
            <Link
              href="/result/RDLG"
              className="px-6 py-2.5 rounded-xl bg-electric-indigo hover:bg-indigo-600 text-white font-medium shadow-lg hover:shadow-indigo-500/20 transition-all"
            >
              다음
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}
