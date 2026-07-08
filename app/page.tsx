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
    <>
      {/* Abstract Tech Background */}
      <div className="tech-bg"></div>

      {/* Top Navigation App Bar */}
      <header className="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-gutter h-16 bg-surface-glass backdrop-blur-xl border-b border-white/5">
        <div className="flex items-center gap-4">
          <span className="font-headline-lg-mobile text-headline-lg-mobile font-bold text-primary dark:text-primary">
            Visionary Analyst
          </span>
        </div>
        <div className="flex items-center">
          <button className="p-2 rounded-full hover:bg-white/5 transition-colors text-primary dark:text-primary">
            <span className="material-symbols-outlined">account_circle</span>
          </button>
        </div>
      </header>

      {/* Main Content Canvas */}
      <main className="flex-grow flex flex-col justify-center items-center px-margin-mobile md:px-gutter pt-24 pb-32 relative">
        {/* Hero Section */}
        <div className="w-full max-w-container-max flex flex-col items-center text-center gap-section-gap z-10">
          <div className="flex flex-col items-center gap-stack-md max-w-2xl">
            {/* Eyebrow */}
            <div className="font-label-mono text-label-mono text-cyan-accent uppercase tracking-widest bg-surface-glass px-4 py-2 rounded-full border border-white/5 backdrop-blur-md inline-block mb-4">
              Investment Diagnostic Engine
            </div>
            {/* Headline */}
            <h1 className="font-headline-lg text-headline-lg md:text-[64px] md:leading-[1.1] md:font-extrabold text-on-background text-glow">
              나의 투자 MBTI는 무엇일까?
            </h1>
            {/* Subtext */}
            <p className="font-body-md text-body-md md:text-[20px] md:leading-[32px] text-on-surface-variant max-w-xl mx-auto mt-stack-md">
              10가지 문항에 답하고, 나에게 꼭 맞는 맞춤형 자산 배분 포트폴리오를 추천받아 보세요.
            </p>
          </div>

          {/* Action Area */}
          <div className="flex flex-col items-center gap-stack-lg mt-stack-md">
            <Link
              href="/survey"
              className="glow-button bg-electric-indigo text-white font-headline-lg-mobile text-headline-lg-mobile px-12 py-6 rounded-xl hover:bg-electric-indigo/90 transition-all transform hover:-translate-y-1 active:translate-y-0 shadow-lg flex items-center gap-3"
            >
              <span>진단 시작하기</span>
              <span className="material-symbols-outlined">arrow_forward</span>
            </Link>

            <div className="flex flex-col items-center gap-6 w-full max-w-md mt-8">
              <div className="flex items-center gap-4 w-full">
                <div className="h-px bg-white/10 flex-grow"></div>
                <span className="font-label-mono text-label-mono text-muted-grey whitespace-nowrap">
                  또는 이미 진단했다면
                </span>
                <div className="h-px bg-white/10 flex-grow"></div>
              </div>

              <form onSubmit={handleSearch} className="flex w-full gap-2">
                <div className="relative flex-grow">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-muted-grey text-[20px]">
                    search
                  </span>
                  <input
                    className="w-full bg-surface-glass border border-white/10 rounded-xl py-3 pl-10 pr-4 text-on-background font-body-md focus:outline-none focus:border-primary transition-colors"
                    placeholder="결과 코드 입력 (예: RDLG)"
                    type="text"
                    value={searchCode}
                    onChange={(e) => setSearchCode(e.target.value)}
                  />
                </div>
                <button
                  type="submit"
                  className="bg-surface-bright text-primary font-label-mono px-6 rounded-xl border border-white/10 hover:bg-white/10 transition-colors"
                >
                  조회
                </button>
              </form>

              <div className="flex gap-4">
                <span className="font-label-mono text-label-mono text-cyan-accent">#투자성향</span>
                <span className="font-label-mono text-label-mono text-cyan-accent">#자산배분</span>
                <span className="font-label-mono text-label-mono text-cyan-accent">#MBTI</span>
              </div>
            </div>

            {/* Data Point Visual */}
            <div className="flex items-center gap-6 mt-8 p-6 bg-surface-glass border border-white/5 rounded-2xl backdrop-blur-md">
              <div className="flex flex-col items-center">
                <span className="font-mbti-code text-mbti-code text-primary">10</span>
                <span className="font-label-mono text-label-mono text-muted-grey">Questions</span>
              </div>
              <div className="w-px h-12 bg-white/10"></div>
              <div className="flex flex-col items-center">
                <span className="font-mbti-code text-mbti-code text-secondary">3m</span>
                <span className="font-label-mono text-label-mono text-muted-grey">Est. Time</span>
              </div>
              <div className="w-px h-12 bg-white/10"></div>
              <div className="flex flex-col items-center">
                <span className="font-mbti-code text-mbti-code text-tertiary">16</span>
                <span className="font-label-mono text-label-mono text-muted-grey">Outcomes</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full py-stack-lg px-gutter flex flex-col md:flex-row justify-between items-center gap-stack-md bg-surface-dim border-t border-outline-variant mt-auto relative z-10">
        <div className="font-headline-lg-mobile text-headline-lg-mobile font-bold text-primary dark:text-primary">
          Visionary Analyst
        </div>
        <nav className="flex gap-6">
          <a className="font-label-mono text-label-mono text-muted-grey hover:text-cyan-accent transition-colors" href="#">
            About
          </a>
          <a className="font-label-mono text-label-mono text-muted-grey hover:text-cyan-accent transition-colors" href="#">
            Methodology
          </a>
          <a className="font-label-mono text-label-mono text-muted-grey hover:text-cyan-accent transition-colors" href="#">
            Privacy Policy
          </a>
        </nav>
        <div className="font-label-mono text-label-mono text-muted-grey">
          © 2024 Visionary Analyst Asset Management
        </div>
      </footer>
    </>
  );
}
