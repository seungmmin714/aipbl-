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
    <div className="min-h-screen bg-[#f4f5f9] text-[#001a42] flex flex-col font-body-md relative overflow-x-hidden">
      {/* Abstract Tech Background */}
      <div className="tech-bg"></div>

      {/* Top Navigation App Bar */}
      <header className="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-gutter h-16 bg-white/70 backdrop-blur-xl border-b border-slate-200/50">
        <div className="flex items-center gap-4">
          <span className="font-headline-lg-mobile text-headline-lg-mobile font-bold text-indigo-600">
            Visionary Analyst
          </span>
        </div>
        <div className="flex items-center">
          <button className="p-2 rounded-full hover:bg-slate-100 transition-colors text-indigo-600">
            <span className="material-symbols-outlined">account_circle</span>
          </button>
        </div>
      </header>

      {/* Main Content Canvas */}
      <main className="flex-grow flex flex-col justify-center items-center px-margin-mobile md:px-gutter pt-24 pb-32 relative z-10">
        {/* Hero Section */}
        <div className="w-full max-w-container-max flex flex-col items-center text-center gap-section-gap">
          <div className="flex flex-col items-center gap-stack-md max-w-2xl">
            {/* Eyebrow */}
            <div className="font-label-mono text-label-mono text-cyan-500 uppercase tracking-widest bg-white/60 px-4 py-2 rounded-full border border-slate-200/80 backdrop-blur-md inline-block mb-4">
              Investment Diagnostic Engine
            </div>
            {/* Headline */}
            <h1 className="font-headline-lg text-headline-lg md:text-[64px] md:leading-[1.1] md:font-extrabold text-slate-800 text-glow">
              나의 투자 MBTI는 무엇일까?
            </h1>
            {/* Subtext */}
            <p className="font-body-md text-body-md md:text-[20px] md:leading-[32px] text-slate-500 max-w-xl mx-auto mt-stack-md">
              12가지 문항에 답하고, 나에게 꼭 맞는 맞춤형 자산 배분 포트폴리오를 추천받아 보세요.
            </p>
          </div>

          {/* Action Area */}
          <div className="flex flex-col items-center gap-4 mt-stack-md">
            <div className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-[#e6fcf5] rounded-full text-xs md:text-sm font-semibold text-[#099268] border border-[#c3fae8]/80 shadow-sm">
              <span>⏱️ 약 1분 · 12문항</span>
            </div>
            <Link
              href="/survey"
              className="bg-[#004be6] hover:bg-[#003cb3] text-white font-bold text-lg md:text-xl px-12 py-4.5 rounded-2xl transition-all transform hover:-translate-y-0.5 active:translate-y-0 shadow-md flex items-center justify-center gap-3 w-64 md:w-80"
            >
              <span className="text-sm">▶</span>
              <span>진단 시작하기</span>
            </Link>

            <div className="flex flex-col items-center gap-6 w-full max-w-md mt-8">
              <div className="flex items-center gap-4 w-full">
                <div className="h-px bg-slate-200 flex-grow"></div>
                <span className="font-label-mono text-label-mono text-slate-400 whitespace-nowrap">
                  또는 이미 진단했다면
                </span>
                <div className="h-px bg-slate-200 flex-grow"></div>
              </div>

              <form onSubmit={handleSearch} className="flex w-full gap-2">
                <div className="relative flex-grow">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">
                    search
                  </span>
                  <input
                    className="w-full bg-white border border-slate-200 rounded-xl py-3 pl-10 pr-4 text-slate-800 font-body-md focus:outline-none focus:border-indigo-500 transition-colors"
                    placeholder="결과 코드 입력 (예: RDLG)"
                    type="text"
                    value={searchCode}
                    onChange={(e) => setSearchCode(e.target.value)}
                  />
                </div>
                <button
                  type="submit"
                  className="bg-slate-800 text-white font-label-mono px-6 rounded-xl border border-slate-700 hover:bg-slate-700 transition-colors"
                >
                  조회
                </button>
              </form>

              <div className="flex gap-4">
                <span className="font-label-mono text-label-mono text-cyan-500">#투자성향</span>
                <span className="font-label-mono text-label-mono text-cyan-500">#자산배분</span>
                <span className="font-label-mono text-label-mono text-cyan-500">#MBTI</span>
              </div>
            </div>

            {/* Data Point Visual */}
            <div className="flex items-center gap-6 mt-8 p-6 bg-white/60 border border-slate-200/80 rounded-2xl backdrop-blur-md shadow-sm">
              <div className="flex flex-col items-center">
                <span className="font-mbti-code text-mbti-code text-[#4d8eff]">12</span>
                <span className="font-label-mono text-label-mono text-slate-400">Questions</span>
              </div>
              <div className="w-px h-12 bg-slate-200"></div>
              <div className="flex flex-col items-center">
                <span className="font-mbti-code text-mbti-code text-[#ddb7ff]">3m</span>
                <span className="font-label-mono text-label-mono text-slate-400">Est. Time</span>
              </div>
              <div className="w-px h-12 bg-slate-200"></div>
              <div className="flex flex-col items-center">
                <span className="font-mbti-code text-mbti-code text-[#ffb786]">16</span>
                <span className="font-label-mono text-label-mono text-slate-400">Outcomes</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full py-stack-lg px-gutter flex flex-col md:flex-row justify-between items-center gap-stack-md bg-white border-t border-slate-200 mt-auto relative z-10">
        <div className="font-headline-lg-mobile text-headline-lg-mobile font-bold text-indigo-600">
          Visionary Analyst
        </div>
        <nav className="flex gap-6">
          <a className="font-label-mono text-label-mono text-slate-400 hover:text-cyan-500 transition-colors" href="#">
            About
          </a>
          <a className="font-label-mono text-label-mono text-slate-400 hover:text-cyan-500 transition-colors" href="#">
            Methodology
          </a>
          <a className="font-label-mono text-label-mono text-slate-400 hover:text-cyan-500 transition-colors" href="#">
            Privacy Policy
          </a>
        </nav>
        <div className="font-label-mono text-label-mono text-slate-400">
          © 2024 Visionary Analyst Asset Management
        </div>
      </footer>
    </div>
  );
}
