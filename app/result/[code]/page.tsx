"use client";

import Link from "next/link";
import { useParams } from "next/navigation";

export default function ResultPage() {
  const params = useParams();
  const code = (params?.code as string)?.toUpperCase() || "RDLG";

  return (
    <>
      {/* Ambient Background Glows */}
      <div className="ambient-glow top-0 left-0 opacity-20"></div>
      <div className="ambient-glow ambient-glow-cyan bottom-1/4 right-0 opacity-10"></div>
      <div className="tech-bg"></div>

      {/* Top Header App Bar */}
      <header className="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-gutter h-16 bg-surface-glass backdrop-blur-xl border-b border-white/5">
        <div className="flex items-center gap-4">
          <Link href="/" className="font-headline-lg-mobile text-headline-lg-mobile font-bold text-primary">
            Visionary Analyst
          </Link>
        </div>
        <div className="flex items-center">
          <button className="p-2 rounded-full hover:bg-white/5 transition-colors text-primary">
            <span className="material-symbols-outlined">account_circle</span>
          </button>
        </div>
      </header>

      {/* Main Content Canvas */}
      <main className="flex-grow flex flex-col items-center justify-center p-gutter pt-24 pb-32 relative z-10 w-full max-w-md mx-auto">
        {/* Result Card for Sharing */}
        <div className="bg-surface-glass border border-white/10 backdrop-blur-md w-full rounded-2xl p-6 flex flex-col items-center gap-6 relative overflow-hidden mb-8">
          
          {/* Header Section */}
          <div className="text-center w-full flex flex-col items-center gap-1">
            <span className="font-mbti-code text-mbti-code text-primary tracking-widest drop-shadow-[0_0_10px_rgba(173,198,255,0.5)]">
              {code}
            </span>
            <h1 className="font-headline-lg text-headline-lg text-slate-100 font-bold">
              공격형 전략가
            </h1>
            <p className="font-body-md text-sm text-slate-400 max-w-[280px] mt-2">
              "데이터 기반으로 장기 성장주에 과감히 투자하는 유형"
            </p>
          </div>

          {/* Divider */}
          <div className="w-full h-px bg-white/5"></div>

          {/* Radar Chart Section */}
          <div className="w-full flex flex-col items-center gap-4">
            <h2 className="font-label-mono text-xs text-muted-grey uppercase tracking-widest self-start pl-2">
              Strategy Profile
            </h2>
            <div className="relative w-64 h-64 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 200 200">
                {/* Background Axes */}
                <line className="stroke-white/10 stroke-1" x1="100" x2="100" y1="100" y2="20"></line>
                <line className="stroke-white/10 stroke-1" x1="100" x2="180" y1="100" y2="100"></line>
                <line className="stroke-white/10 stroke-1" x1="100" x2="100" y1="100" y2="180"></line>
                <line className="stroke-white/10 stroke-1" x1="100" x2="20" y1="100" y2="100"></line>
                
                {/* Concentric Circles */}
                <circle cx="100" cy="100" fill="none" r="80" stroke="rgba(255, 255, 255, 0.05)" strokeWidth="1"></circle>
                <circle cx="100" cy="100" fill="none" r="40" stroke="rgba(255, 255, 255, 0.05)" strokeWidth="1"></circle>
                
                {/* Data Polygon */}
                <polygon
                  className="fill-indigo-500/30 stroke-indigo-400 stroke-2"
                  points="100,30 170,100 100,160 40,100"
                ></polygon>
                
                {/* Axis Labels */}
                <text className="font-label-mono text-[8px] fill-[#94A3B8]" textAnchor="middle" transform="rotate(90 100 15)" x="100" y="15">Risk-taking</text>
                <text className="font-label-mono text-[8px] fill-[#94A3B8]" textAnchor="start" transform="rotate(90 185 103)" x="185" y="103">Data-driven</text>
                <text className="font-label-mono text-[8px] fill-[#94A3B8]" textAnchor="middle" transform="rotate(90 100 190)" x="100" y="190">Long-term</text>
                <text className="font-label-mono text-[8px] fill-[#94A3B8]" textAnchor="end" transform="rotate(90 15 103)" x="15" y="103">Growth</text>
              </svg>
            </div>
          </div>

          {/* Divider */}
          <div className="w-full h-px bg-white/5"></div>

          {/* Asset Allocation Donut Chart */}
          <div className="w-full flex flex-col gap-4">
            <h2 className="font-label-mono text-xs text-muted-grey uppercase tracking-widest pl-2">
              Asset Allocation
            </h2>
            <div className="flex items-center justify-between">
              {/* Donut Chart SVG */}
              <div className="relative w-32 h-32">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  {/* Background ring */}
                  <circle cx="50" cy="50" fill="transparent" r="40" stroke="#1d2027" strokeWidth="12"></circle>
                  
                  {/* Domestic Stocks: 30% */}
                  <circle
                    cx="50"
                    cy="50"
                    fill="transparent"
                    r="40"
                    stroke="#6366F1"
                    strokeWidth="12"
                    strokeDasharray="251.2"
                    strokeDashoffset="175.84"
                  ></circle>
                  
                  {/* Overseas Stocks: 40% */}
                  <circle
                    cx="50"
                    cy="50"
                    fill="transparent"
                    r="40"
                    stroke="#ddb7ff"
                    strokeWidth="12"
                    strokeDasharray="251.2"
                    strokeDashoffset="150.72"
                    transform="rotate(108 50 50)"
                  ></circle>
                  
                  {/* Bonds: 10% */}
                  <circle
                    cx="50"
                    cy="50"
                    fill="transparent"
                    r="40"
                    stroke="#06B6D4"
                    strokeWidth="12"
                    strokeDasharray="251.2"
                    strokeDashoffset="226.08"
                    transform="rotate(252 50 50)"
                  ></circle>
                  
                  {/* Cash: 20% */}
                  <circle
                    cx="50"
                    cy="50"
                    fill="transparent"
                    r="40"
                    stroke="#ffb786"
                    strokeWidth="12"
                    strokeDasharray="251.2"
                    strokeDashoffset="200.96"
                    transform="rotate(288 50 50)"
                  ></circle>
                </svg>
                {/* Center Label */}
                <div className="absolute inset-0 flex items-center justify-center flex-col">
                  <span className="font-label-mono text-[9px] text-muted-grey">Total Risk</span>
                  <span className="font-headline-lg-mobile text-slate-100 font-bold">8.5</span>
                </div>
              </div>
              
              {/* Legend */}
              <div className="flex flex-col gap-2 font-label-mono text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-sm bg-[#6366f1]"></div>
                  <span className="text-slate-300">Domestic: 30%</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-sm bg-[#ddb7ff]"></div>
                  <span className="text-slate-300">Overseas: 40%</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-sm bg-cyan-400"></div>
                  <span className="text-slate-300">Bonds: 10%</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-sm bg-[#ffb786]"></div>
                  <span className="text-slate-300">Cash: 20%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Branding Footer */}
          <div className="mt-4 pt-4 border-t border-white/5 w-full text-center">
            <span className="font-label-mono text-[9px] text-slate-500 uppercase tracking-widest">
              Visionary Analyst Asset Management
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-3 w-full">
          <button className="glow-button bg-electric-indigo text-white py-4 px-6 rounded-xl font-medium flex items-center justify-center gap-2 shadow-lg hover:bg-indigo-600 transition-all hover:scale-[1.01]">
            <span className="material-symbols-outlined font-bold">download</span>
            Save Result Image
          </button>
          <button className="bg-surface-glass border border-white/10 hover:border-white/20 text-indigo-300 py-4 px-6 rounded-xl font-medium flex items-center justify-center gap-2 transition-all hover:bg-white/5">
            <span className="material-symbols-outlined">share</span>
            Share Link
          </button>
          <Link
            href="/"
            className="flex justify-center rounded-xl bg-slate-900 border border-slate-800 py-3.5 text-sm font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors mt-2"
          >
            테스트 다시하기
          </Link>
        </div>
      </main>
    </>
  );
}
