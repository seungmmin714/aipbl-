"use client";

import { useState } from "react";
import Link from "next/link";

export default function SurveyPage() {
  const [currentIdx, setCurrentIdx] = useState(0);

  return (
    <div className="flex min-h-[80vh] flex-col justify-between py-6">
      {/* 상단 프로그레스 바 */}
      <div className="space-y-2">
        <div className="flex justify-between text-xs text-slate-400 font-medium">
          <span>문항 {currentIdx + 1} / 10</span>
          <span>진행률 {Math.round(((currentIdx + 1) / 10) * 100)}%</span>
        </div>
        <div className="h-2 w-full rounded-full bg-slate-800">
          <div
            className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-300"
            style={{ width: `${((currentIdx + 1) / 10) * 100}%` }}
          />
        </div>
      </div>

      {/* 설문 질문 영역 */}
      <div className="my-auto space-y-6 py-8">
        <h2 className="text-xl font-bold leading-relaxed text-white">
          Q{currentIdx + 1}. 투자 설문 질문이 여기에 들어갑니다. (뼈대)
        </h2>
        <div className="space-y-3">
          {[1, 2, 3, 4].map((num) => (
            <button
              key={num}
              onClick={() => {
                if (currentIdx < 9) {
                  setCurrentIdx(prev => prev + 1);
                } else {
                  // 임시 결과로 이동 (예시로 RDLG)
                  window.location.href = "/result/RDLG";
                }
              }}
              className="w-full rounded-xl border border-slate-800 bg-slate-900/50 p-4 text-left text-sm font-medium text-slate-300 hover:border-slate-700 hover:bg-slate-800 hover:text-white transition-all focus:outline-none"
            >
              선택지 {num} - 클릭 시 다음 문항 이동 (10번째는 결과 페이지 이동)
            </button>
          ))}
        </div>
      </div>

      {/* 하단 네비게이션 */}
      <div className="flex justify-between items-center border-t border-slate-900 pt-4">
        <button
          onClick={() => currentIdx > 0 && setCurrentIdx(prev => prev - 1)}
          disabled={currentIdx === 0}
          className="text-sm font-medium text-slate-400 hover:text-white disabled:opacity-30 disabled:hover:text-slate-400 transition-colors"
        >
          이전 문항
        </button>
        <Link href="/" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">
          홈으로
        </Link>
      </div>
    </div>
  );
}
