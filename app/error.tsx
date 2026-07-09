"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[error boundary]", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#f4f5f9] flex flex-col items-center justify-center px-6 text-center gap-4">
      <span aria-hidden="true" className="material-symbols-outlined text-6xl text-slate-300">
        error_outline
      </span>
      <h1 className="text-2xl font-black text-slate-800">일시적인 오류가 발생했습니다</h1>
      <p className="text-sm text-slate-500">잠시 후 다시 시도해 주세요.</p>
      <div className="flex gap-3 mt-2">
        <button
          onClick={reset}
          className="bg-[#004be6] text-white px-8 py-3 rounded-xl font-semibold hover:bg-[#003cb3] transition-all"
        >
          다시 시도
        </button>
        <a
          href="/"
          className="bg-white border border-slate-200 text-slate-700 px-8 py-3 rounded-xl font-semibold hover:bg-slate-50 transition-all"
        >
          홈으로
        </a>
      </div>
    </div>
  );
}
