"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function SurveyError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("설문 에러:", error);
  }, [error]);

  // sessionStorage 정리
  useEffect(() => {
    try {
      sessionStorage.removeItem("investMBTI_survey");
    } catch {
      /* ignore */
    }
  }, []);

  return (
    <div className="min-h-screen bg-[#f4f5f9] flex flex-col items-center justify-center px-6 text-center">
      <span
        className="material-symbols-outlined text-6xl text-amber-300 mb-4"
        aria-hidden="true"
      >
        quiz
      </span>
      <h1 className="text-2xl font-bold text-slate-800 mb-2">
        설문 진행 중 오류가 발생했습니다
      </h1>
      <p className="text-slate-500 mb-8 max-w-sm">
        문제가 지속되면 처음부터 다시 시작해 주세요.
      </p>
      <div className="flex gap-4">
        <button
          onClick={reset}
          className="bg-white border border-slate-200 text-slate-700 px-6 py-3 rounded-xl font-semibold hover:bg-slate-50 transition-all"
        >
          다시 시도
        </button>
        <Link
          href="/"
          className="bg-[#004be6] text-white px-6 py-3 rounded-xl font-semibold hover:bg-[#003cb3] transition-all"
        >
          홈으로 돌아가기
        </Link>
      </div>
    </div>
  );
}
