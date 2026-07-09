"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function Home() {
  const [searchCode, setSearchCode] = useState("");
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchCode.trim()) return;
    
    // 코드를 대문자로 정리하여 이동
    const formattedCode = searchCode.trim().toUpperCase();
    
    // 라우팅 이동
    router.push(`/result/${formattedCode}`);
  };

  return (
    <div className="min-h-screen bg-[#0B0E14] text-[#F8FAFC] flex flex-col font-body-md relative overflow-x-hidden">
      {/* Abstract Tech Background */}
      <div className="tech-bg"></div>

      {/* Top Navigation App Bar */}
      <header className="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-6 h-16 bg-[#0B0E14]/70 backdrop-blur-xl border-b border-white/5">
        <div className="flex items-center gap-4">
          <span className="font-headline-lg-mobile text-headline-lg-mobile font-bold text-[#6366F1] tracking-tight">
            Visionary Analyst
          </span>
        </div>
        <div className="flex items-center">
          <button className="p-2 rounded-full hover:bg-white/5 transition-colors text-[#6366F1]">
            <span className="material-symbols-outlined">account_circle</span>
          </button>
        </div>
      </header>

      {/* Main Content Canvas */}
      <main className="flex-grow flex flex-col justify-center items-center px-6 pt-24 pb-32 relative z-10">
        {/* Hero Section */}
        <div className="w-full max-w-[1200px] flex flex-col items-center text-center gap-[80px]">
          <div className="flex flex-col items-center gap-4 max-w-2xl">
            {/* Eyebrow */}
            <div className="font-label-mono text-label-mono text-[#06B6D4] uppercase tracking-widest bg-white/5 px-4 py-2 rounded-full border border-white/5 backdrop-blur-md inline-block mb-4">
              Investment Diagnostic Engine
            </div>
            {/* Headline */}
            <h1 className="font-headline-lg text-3xl md:text-[64px] md:leading-[1.1] md:font-extrabold text-[#F8FAFC] text-glow">
              나의 투자 MBTI는 무엇일까?
            </h1>
            {/* Subtext */}
            <p className="font-body-md text-base md:text-[20px] md:leading-[32px] text-[#94A3B8] max-w-xl mx-auto mt-4">
              12가지 문항에 답하고, 나에게 꼭 맞는 맞춤형 자산 배분 포트폴리오를 추천받아 보세요.
            </p>
          </div>

          {/* Action Area */}
          <div className="flex flex-col items-center gap-4 mt-4">
            <div className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-[#06B6D4]/10 rounded-full text-xs md:text-sm font-semibold text-[#06B6D4] border border-[#06B6D4]/20 shadow-sm">
              <span>⏱️ 약 1분 · 12문항</span>
            </div>
            <Link
              href="/survey"
              className="bg-[#6366F1] hover:bg-[#5053db] text-white font-bold text-xl md:text-2xl px-12 py-5 md:py-6 rounded-2xl transition-all transform hover:-translate-y-0.5 active:translate-y-0 shadow-lg flex items-center justify-center gap-3 w-full max-w-xs md:max-w-sm glow-button"
            >
              <span className="text-base">▶</span>
              <span>진단 시작하기</span>
            </Link>

            <div className="flex flex-col items-center gap-6 w-full max-w-md mt-8">
              <div className="flex items-center gap-4 w-full">
                <div className="h-px bg-white/5 flex-grow"></div>
                <span className="font-label-mono text-label-mono text-[#94A3B8] whitespace-nowrap">
                  또는 이미 진단했다면
                </span>
                <div className="h-px bg-white/5 flex-grow"></div>
              </div>

              <form onSubmit={handleSearch} className="flex w-full gap-2">
                <div className="relative flex-grow">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-[20px]">
                    search
                  </span>
                  <input
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-[#F8FAFC] placeholder-slate-500 font-body-md focus:outline-none focus:border-[#6366F1] focus:bg-white/10 transition-all"
                    placeholder="결과 코드 입력 (예: RDLG)"
                    type="text"
                    value={searchCode}
                    onChange={(e) => setSearchCode(e.target.value)}
                  />
                </div>
                <button
                  type="submit"
                  className="bg-[#6366F1]/10 text-[#6366F1] border border-[#6366F1]/20 font-label-mono px-6 rounded-xl hover:bg-[#6366F1]/20 transition-colors"
                >
                  조회
                </button>
              </form>

              <div className="flex gap-4">
                <span className="font-label-mono text-label-mono text-[#06B6D4]">#투자성향</span>
                <span className="font-label-mono text-label-mono text-[#06B6D4]">#자산배분</span>
                <span className="font-label-mono text-label-mono text-[#06B6D4]">#MBTI</span>
              </div>
            </div>

            {/* Data Point Visual */}
            <div className="flex items-center gap-6 mt-8 p-6 surface-glass rounded-2xl shadow-sm">
              <div className="flex flex-col items-center">
                <span className="font-mbti-code text-2xl font-bold text-[#6366F1] tracking-tight">12</span>
                <span className="font-label-mono text-[10px] text-[#94A3B8] uppercase tracking-wider">Questions</span>
              </div>
              <div className="w-px h-12 bg-white/5"></div>
              <div className="flex flex-col items-center">
                <span className="font-mbti-code text-2xl font-bold text-[#06B6D4] tracking-tight">3m</span>
                <span className="font-label-mono text-[10px] text-[#94A3B8] uppercase tracking-wider">Est. Time</span>
              </div>
              <div className="w-px h-12 bg-white/5"></div>
              <div className="flex flex-col items-center">
                <span className="font-mbti-code text-2xl font-bold text-pink-500 tracking-tight">16</span>
                <span className="font-label-mono text-[10px] text-[#94A3B8] uppercase tracking-wider">Outcomes</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full py-8 px-6 flex flex-col md:flex-row justify-between items-center gap-4 bg-[#0B0E14] border-t border-white/5 mt-auto relative z-10">
        <div className="font-headline-lg-mobile text-headline-lg-mobile font-bold text-[#6366F1]">
          Visionary Analyst
        </div>
        <nav className="flex gap-6">
          <a className="font-label-mono text-label-mono text-[#94A3B8] hover:text-[#06B6D4] transition-colors" href="#">
            About
          </a>
          <a className="font-label-mono text-label-mono text-[#94A3B8] hover:text-[#06B6D4] transition-colors" href="#">
            Methodology
          </a>
          <a className="font-label-mono text-label-mono text-[#94A3B8] hover:text-[#06B6D4] transition-colors" href="#">
            Privacy Policy
          </a>
        </nav>
        <div className="font-label-mono text-label-mono text-[#94A3B8]">
          © 2026 Visionary Analyst Asset Management
        </div>
      </footer>
    </div>
  );
}
