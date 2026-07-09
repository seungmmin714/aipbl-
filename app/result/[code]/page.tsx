"use client";

import Link from "next/link";
import Image from "next/image";
import { useParams } from "next/navigation";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import mbtiTypes from "@/data/mbti-types.json";

// 도넛 차트 컬러 팔레트
const CHART_COLORS = ["#6366F1", "#ddb7ff", "#06B6D4", "#ffb786", "#34d399", "#f472b6"];

// 축별 라벨 매핑
const axisDisplayMap: Record<string, { left: string; right: string; icon: string }> = {
  R: { left: "위험감수(R)", right: "안정지향(S)", icon: "security" },
  D: { left: "데이터(D)", right: "직관(I)", icon: "search" },
  L: { left: "장기투자(L)", right: "단기매매(T)", icon: "schedule" },
  G: { left: "성장자산(G)", right: "가치자산(V)", icon: "account_balance" },
};

export default function ResultPage() {
  const params = useParams();
  const code = (params?.code as string)?.toUpperCase() || "";

  // 유형 데이터 조회
  const typeData = mbtiTypes.find((t) => t.code === code);

  // 존재하지 않는 코드 처리
  if (!typeData) {
    return (
      <div className="min-h-screen bg-[#f4f5f9] flex flex-col items-center justify-center px-6 text-center">
        <span className="material-symbols-outlined text-6xl text-slate-300 mb-4">
          error_outline
        </span>
        <h1 className="font-headline-lg text-headline-lg text-slate-800 mb-2">
          유형을 찾을 수 없습니다
        </h1>
        <p className="font-body-md text-slate-500 mb-8">
          &quot;{code}&quot;는 유효한 투자 MBTI 코드가 아닙니다.
        </p>
        <Link
          href="/"
          className="glow-button bg-[#585cf4] text-white px-8 py-3 rounded-xl font-semibold hover:bg-[#4c50e0] transition-all"
        >
          홈으로 돌아가기
        </Link>
      </div>
    );
  }

  // 축 코드 분해
  const axes = [
    { code: typeData.code[0], axis: "R" },
    { code: typeData.code[1], axis: "D" },
    { code: typeData.code[2], axis: "L" },
    { code: typeData.code[3], axis: "G" },
  ];

  return (
    <div className="min-h-screen bg-[#f4f5f9] text-[#001a42] flex flex-col font-body-md relative overflow-x-hidden">
      {/* Ambient Background */}
      <div className="tech-bg"></div>

      {/* Top Header */}
      <header className="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-gutter h-16 bg-white/70 backdrop-blur-xl border-b border-slate-200/50">
        <Link
          href="/"
          className="font-headline-lg-mobile text-headline-lg-mobile font-bold text-indigo-600"
        >
          Visionary Analyst
        </Link>
        <div className="flex items-center">
          <button className="p-2 rounded-full hover:bg-slate-100 transition-colors text-indigo-600">
            <span className="material-symbols-outlined">account_circle</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow flex flex-col items-center p-gutter pt-24 pb-32 relative z-10 w-full max-w-lg mx-auto">
        {/* Result Card */}
        <div className="bg-white border border-slate-200/80 shadow-lg w-full rounded-2xl overflow-hidden mb-8">
          {/* Animal Image Hero */}
          <div className="relative w-full aspect-square bg-gradient-to-b from-indigo-50 to-white flex items-center justify-center overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(99,102,241,0.08),transparent_70%)]"></div>
            <Image
              src={typeData.image}
              alt={typeData.nickname}
              width={360}
              height={360}
              className="object-contain z-10 drop-shadow-lg"
              priority
            />
          </div>

          {/* Content Section */}
          <div className="p-6 flex flex-col gap-6">
            {/* Header: Code + Nickname */}
            <div className="text-center flex flex-col items-center gap-2">
              <span className="text-5xl">{typeData.emoji}</span>
              <span className="font-mbti-code text-mbti-code text-indigo-600 tracking-widest drop-shadow-[0_0_10px_rgba(99,102,241,0.2)]">
                {typeData.code}
              </span>
              <h1 className="font-headline-lg-mobile text-headline-lg-mobile md:font-headline-lg md:text-headline-lg text-slate-800 font-bold">
                {typeData.nickname}
              </h1>
            </div>

            {/* Trait Tags */}
            <div className="flex flex-wrap justify-center gap-2">
              {typeData.traits.map((trait, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1.5 rounded-full text-xs font-medium border border-indigo-200/60 bg-indigo-50 text-indigo-600 font-label-mono"
                >
                  {trait}
                </span>
              ))}
            </div>

            {/* Divider */}
            <div className="w-full h-px bg-slate-200/60"></div>

            {/* Axis Profile */}
            <div className="flex flex-col gap-3">
              <h2 className="font-label-mono text-xs text-slate-400 uppercase tracking-widest">
                Strategy Profile
              </h2>
              <div className="grid grid-cols-1 gap-2">
                {axes.map((a, idx) => {
                  const display = axisDisplayMap[a.axis];
                  const isLeft = a.code === a.axis;
                  return (
                    <div
                      key={idx}
                      className="flex items-center gap-3 py-2 px-3 rounded-xl bg-slate-50"
                    >
                      <span className="material-symbols-outlined text-sm text-slate-400">
                        {display.icon}
                      </span>
                      <div className="flex-grow flex items-center gap-2">
                        <span
                          className={`text-xs font-medium px-2 py-0.5 rounded ${
                            isLeft
                              ? "bg-indigo-100 text-indigo-600"
                              : "text-slate-400"
                          }`}
                        >
                          {display.left}
                        </span>
                        <div className="flex-grow h-1.5 rounded-full bg-slate-200 relative overflow-hidden">
                          <div
                            className={`absolute top-0 h-full rounded-full transition-all ${
                              isLeft
                                ? "left-0 bg-indigo-500"
                                : "right-0 bg-cyan-400"
                            }`}
                            style={{ width: "66%" }}
                          ></div>
                        </div>
                        <span
                          className={`text-xs font-medium px-2 py-0.5 rounded ${
                            !isLeft
                              ? "bg-cyan-100 text-cyan-600"
                              : "text-slate-400"
                          }`}
                        >
                          {display.right}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Divider */}
            <div className="w-full h-px bg-slate-200/60"></div>

            {/* Description */}
            <div className="flex flex-col gap-3">
              <h2 className="font-label-mono text-xs text-slate-400 uppercase tracking-widest">
                Personality
              </h2>
              <ul className="flex flex-col gap-2.5">
                {typeData.desc.map((line, idx) => (
                  <li key={idx} className="flex gap-2.5 text-sm text-slate-600 leading-relaxed">
                    <span className="text-indigo-400 mt-0.5 flex-shrink-0">•</span>
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Divider */}
            <div className="w-full h-px bg-slate-200/60"></div>

            {/* Asset Allocation Chart */}
            <div className="flex flex-col gap-4">
              <h2 className="font-label-mono text-xs text-slate-400 uppercase tracking-widest">
                Recommended Portfolio
              </h2>
              <div className="flex items-center justify-between">
                {/* Donut Chart */}
                <div className="relative w-40 h-40">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={typeData.allocation}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={65}
                        dataKey="value"
                        strokeWidth={2}
                        stroke="#fff"
                      >
                        {typeData.allocation.map((_, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={CHART_COLORS[index % CHART_COLORS.length]}
                          />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  {/* Center Label */}
                  <div className="absolute inset-0 flex items-center justify-center flex-col">
                    <span className="font-label-mono text-[9px] text-slate-400">
                      Portfolio
                    </span>
                    <span className="font-headline-lg-mobile text-slate-800 font-bold text-sm">
                      {typeData.allocation.length}종
                    </span>
                  </div>
                </div>

                {/* Legend */}
                <div className="flex flex-col gap-2.5 font-label-mono text-xs">
                  {typeData.allocation.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-sm flex-shrink-0"
                        style={{
                          backgroundColor:
                            CHART_COLORS[idx % CHART_COLORS.length],
                        }}
                      ></div>
                      <span className="text-slate-600">
                        {item.name}: {item.value}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Branding Footer */}
            <div className="mt-2 pt-4 border-t border-slate-100 w-full text-center">
              <span className="font-label-mono text-[9px] text-slate-400 uppercase tracking-widest">
                Visionary Analyst Asset Management
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-3 w-full">
          <button className="glow-button bg-[#585cf4] hover:bg-[#4c50e0] text-white py-4 px-6 rounded-xl font-medium flex items-center justify-center gap-2 shadow-lg hover:scale-[1.01] transition-all">
            <span className="material-symbols-outlined font-bold">
              download
            </span>
            결과 이미지 저장
          </button>
          <button className="bg-white border border-slate-200 hover:bg-slate-50 text-indigo-600 py-4 px-6 rounded-xl font-medium flex items-center justify-center gap-2 transition-all">
            <span className="material-symbols-outlined">share</span>
            링크 공유하기
          </button>
          <Link
            href="/survey"
            className="flex justify-center rounded-xl bg-white border border-slate-200 py-3.5 text-sm font-semibold text-slate-500 hover:bg-slate-50 transition-colors mt-2"
          >
            테스트 다시하기
          </Link>
        </div>
      </main>
    </div>
  );
}
