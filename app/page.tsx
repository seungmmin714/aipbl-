"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { isValidMBTICode, TOTAL_QUESTIONS } from "@/lib/mbti";

export default function Home() {
  const [searchCode, setSearchCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const code = searchCode.trim().toUpperCase();

    if (!code) {
      setError("결과 코드를 입력해 주세요.");
      return;
    }
    // 잘못된 코드는 결과 페이지로 보내지 말고 입력 시점에 막는다.
    if (!isValidMBTICode(code)) {
      setError("올바른 코드가 아닙니다. 4자리 코드를 입력해 주세요. (예: RDLG)");
      return;
    }

    setError(null);
    router.push(`/result/${code}`);
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
              <span>⏱️ 약 3분 · {TOTAL_QUESTIONS}문항</span>
            </div>
            <Link
              href="/survey"
              className="bg-[#004be6] hover:bg-[#003cb3] text-white font-bold text-xl md:text-2xl px-12 py-5 md:py-6 rounded-2xl transition-all transform hover:-translate-y-0.5 active:translate-y-0 shadow-lg flex items-center justify-center gap-3 w-full max-w-xs md:max-w-sm"
            >
              <span className="text-base">▶</span>
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

              <form onSubmit={handleSearch} noValidate className="flex w-full flex-col gap-2">
                <div className="flex w-full gap-2">
                <div className="relative flex-grow">
                  <span aria-hidden="true" className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">
                    search
                  </span>
                  <input
                    className="w-full bg-white border border-slate-200 rounded-xl py-3 pl-10 pr-4 text-slate-800 font-body-md focus:outline-none focus:border-indigo-500 transition-colors"
                    placeholder="결과 코드 입력 (예: RDLG)"
                    type="text"
                    maxLength={4}
                    aria-label="투자 MBTI 결과 코드"
                    aria-invalid={!!error}
                    aria-describedby={error ? "search-error" : undefined}
                    value={searchCode}
                    onChange={(e) => {
                      setSearchCode(e.target.value);
                      if (error) setError(null);
                    }}
                  />
                </div>
                <button
                  type="submit"
                  className="bg-slate-800 text-white font-label-mono px-6 rounded-xl border border-slate-700 hover:bg-slate-700 transition-colors"
                >
                  조회
                </button>
                </div>
                {error && (
                  <p id="search-error" role="alert" className="text-xs font-semibold text-rose-500 text-left px-1">
                    {error}
                  </p>
                )}
              </form>


            </div>

            {/* Data Point Visual */}
            <div className="flex items-center gap-6 mt-8 p-6 bg-white/60 border border-slate-200/80 rounded-2xl backdrop-blur-md shadow-sm">
              <div className="flex flex-col items-center">
                <span className="font-mbti-code text-mbti-code text-[#4d8eff]">{TOTAL_QUESTIONS}</span>
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
        <p className="font-label-mono text-label-mono text-slate-400 max-w-md text-center md:text-left">
          본 서비스는 교육·오락 목적의 참고 자료이며 투자 자문이 아닙니다.
          투자 판단과 그 결과는 이용자 본인에게 귀속됩니다.
        </p>
        <div className="font-label-mono text-label-mono text-slate-400">
          © {new Date().getFullYear()} Visionary Analyst
        </div>
      </footer>
    </div>
  );
}
