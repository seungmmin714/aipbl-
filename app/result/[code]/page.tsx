"use client";

import { useRef, useCallback, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import html2canvas from "html2canvas";
import mbtiTypes from "@/data/mbti-types.json";

// 도넛 차트 컬러 팔레트 ( mock-up 색상 맞춤: Blue, Mint/Teal, Gold/Yellow, Slate/Gray )
const CHART_COLORS = ["#004be6", "#06b6d4", "#a16207", "#cbd5e1", "#6366f1", "#f472b6"];

export default function ResultPage() {
  const params = useParams();
  const code = (params?.code as string)?.toUpperCase() || "";
  const printRef = useRef<HTMLDivElement>(null);
  const [isSaving, setIsSaving] = useState(false); // DEF-05: 중복 클릭 방지

  // 이미지를 base64 Data URL로 변환하는 헬퍼
  const imgToBase64 = (imgEl: HTMLImageElement): Promise<string> => {
    return new Promise((resolve) => {
      const cvs = document.createElement("canvas");
      cvs.width = imgEl.naturalWidth || imgEl.width;
      cvs.height = imgEl.naturalHeight || imgEl.height;
      const ctx = cvs.getContext("2d");
      if (ctx) {
        ctx.drawImage(imgEl, 0, 0, cvs.width, cvs.height);
        resolve(cvs.toDataURL("image/png"));
      } else {
        resolve(imgEl.src);
      }
    });
  };

  const handleSaveImage = useCallback(async () => {
    if (!printRef.current || isSaving) return; // TC-23: 저장 중 재클릭 방지
    setIsSaving(true);
    try {
      // 1. 캡처 영역 내 모든 <img>를 base64로 치환 (html2canvas CORS 회피)
      const imgs = printRef.current.querySelectorAll("img");
      const origSrcs: string[] = [];
      for (const img of Array.from(imgs)) {
        origSrcs.push(img.src);
        try {
          const b64 = await imgToBase64(img);
          img.src = b64;
        } catch { /* 변환 실패 시 원본 유지 */ }
      }

      // 2. html2canvas 캡처
      const canvas = await html2canvas(printRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: false,
        backgroundColor: "#f4f5f9",
        logging: false,
        // html2canvas는 문서를 클론해 캡처하는데, 클론에서 CSS 애니메이션이
        // 처음부터 다시 시작돼 fade-in 요소가 초기 상태(opacity 0)로 찍힌다.
        // 클론 문서의 애니메이션을 전부 끄고 최종 상태로 고정한다.
        onclone: (clonedDoc) => {
          const style = clonedDoc.createElement("style");
          style.textContent =
            "*, *::before, *::after { animation: none !important; transition: none !important; }";
          clonedDoc.head.appendChild(style);
          clonedDoc.querySelectorAll<HTMLElement>('[class*="animate-"]').forEach((el) => {
            el.style.opacity = "1";
            el.style.transform = "none";
          });
        },
      });

      // 3. 원본 src 복원
      Array.from(imgs).forEach((img, i) => {
        img.src = origSrcs[i];
      });

      // 4. 다운로드
      const link = document.createElement("a");
      link.download = `investment-mbti-${code}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch (err) {
      console.error("이미지 저장 실패", err);
    } finally {
      setIsSaving(false);
    }
  }, [code, isSaving]);

  const handleShare = async () => {
    const url = window.location.href;
    const title = `나의 투자 MBTI는 ${code}!`;
    const text = `나에게 꼭 맞는 맞춤형 자산 배분 포트폴리오를 확인해보세요.`;

    if (navigator.share) {
      try {
        await navigator.share({ title, text, url });
      } catch (err) {
        console.error("공유 실패", err);
      }
    } else {
      // TC-24: 클립보드 복사 시도 + prompt 폴백
      try {
        await navigator.clipboard.writeText(url);
        alert("결과 링크가 클립보드에 복사되었습니다.");
      } catch {
        // 클립보드 API 실패 시 prompt 폴백
        window.prompt("아래 링크를 복사하세요:", url);
      }
    }
  };

  // 유형 데이터 조회
  const typeData = mbtiTypes.find((t) => t.code === code);

  // 존재하지 않는 코드 처리
  if (!typeData) {
    return (
      <div className="min-h-screen bg-[#f4f5f9] flex flex-col items-center justify-center px-6 text-center">
        <span className="material-symbols-outlined text-6xl text-slate-300 mb-4" aria-hidden="true">
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
          className="bg-[#004be6] text-white px-8 py-3 rounded-xl font-semibold hover:bg-[#003cb3] transition-all"
        >
          홈으로 돌아가기
        </Link>
      </div>
    );
  }

  // 4축 코드 분해를 이용해 방사형 차트 좌표 계산
  const isR = typeData.code.includes("R");
  const isD = typeData.code.includes("D");
  const isL = typeData.code.includes("L");
  const isG = typeData.code.includes("G");

  const yTop = isR ? 35 : 75;       // 위험감수 (y값 작을수록 위)
  const xRight = isD ? 165 : 125;   // 데이터기반 (x값 클수록 오른쪽)
  const yBottom = isL ? 165 : 125;  // 장기투자 (y값 클수록 아래)
  const xLeft = isG ? 35 : 75;      // 성장자산 (x값 작을수록 왼쪽)

  const pointsStr = `100,${yTop} ${xRight},100 100,${yBottom} ${xLeft},100`;

  return (
    <div className="min-h-screen bg-[#f4f5f9] text-[#001a42] flex flex-col font-body-md relative overflow-x-hidden">
      {/* Top Header App Bar — DEF-14: 브랜드명 통일 */}
      <header className="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-6 h-16 bg-white border-b border-slate-100/80 shadow-sm">
        <div className="flex items-center text-[#004be6] hover:opacity-80">
          <Link href="/">
            <span className="material-symbols-outlined text-2xl font-light" aria-hidden="true">arrow_back</span>
          </Link>
        </div>
        <span className="font-extrabold text-[#004be6] text-xl tracking-tight">Invest-Type</span>
        <div className="flex items-center text-[#004be6]">
          <span className="material-symbols-outlined text-2xl font-light" aria-hidden="true">help_outline</span>
        </div>
      </header>

      {/* Main Content Canvas */}
      <main className="flex-grow flex flex-col items-center justify-center pt-24 pb-12 relative z-10 w-full max-w-md mx-auto bg-[#f4f5f9]">
        
        {/* Capture Area for Image Save */}
        <div ref={printRef} className="w-full flex flex-col items-center bg-[#f4f5f9] px-4 pb-4 pt-4 -mt-4">
          
          {/* Badge: 당신의 투자 MBTI는 */}
          <div className="mb-2">
            <span className="inline-block px-4 py-1.5 rounded-full text-xs font-bold bg-[#e8edfc] text-[#004be6] tracking-wide">
              당신의 투자 MBTI는
            </span>
          </div>

        {/* MBTI Code */}
        <h1 className="font-black text-5xl md:text-6xl text-[#004be6] tracking-wider mb-6">
          {typeData.code}
        </h1>

        {/* Card 1: Main Animal Card */}
        <div className="bg-white shadow-md w-full rounded-3xl p-6 flex flex-col items-center gap-4 relative overflow-hidden mb-4 border border-slate-100">
          {/* Circular Image Container */}
          <div className="relative w-56 h-56 rounded-full overflow-hidden bg-[#e0f2fe] flex items-center justify-center p-3 border border-sky-100/50 shadow-inner">
            <img
              src={typeData.image}
              alt={typeData.nickname}
              style={{ width: '200px', height: '200px', objectFit: 'contain' }}
              className="z-10"
              crossOrigin="anonymous"
            />
          </div>

          {/* Nickname & Emoji */}
          <div className="text-center mt-2">
            <h2 className="text-2xl font-black text-slate-800 flex items-center justify-center gap-1.5">
              <span>{typeData.nickname}</span>
              <span className="text-3xl">{typeData.emoji}</span>
            </h2>
          </div>

          {/* Summary description paragraph */}
          <p className="text-slate-600 text-sm text-center leading-relaxed max-w-[310px] mt-1 break-keep">
            {typeData.desc}
          </p>
        </div>

        {/* Card 2: 성향 분석 (Radar Chart) */}
        <div className="bg-white shadow-md w-full rounded-3xl p-6 flex flex-col gap-4 border border-slate-100 mb-4">
          <div className="flex items-center gap-2 text-slate-800 font-bold text-base border-b border-slate-50 pb-3">
            <span className="material-symbols-outlined text-lg text-slate-400" aria-hidden="true">signal_cellular_alt</span>
            <h3>성향 분석</h3>
          </div>

          {/* SVG Custom Radar Chart */}
          <div className="flex items-center justify-center py-2">
            <div className="relative w-60 h-60 flex items-center justify-center">
              <svg className="w-full h-full overflow-visible" viewBox="-40 0 280 200" aria-label="투자 성향 레이더 차트" role="img">
                {/* Concentric Grid Diamonds */}
                <polygon points="100,30 170,100 100,170 30,100" fill="none" stroke="#f1f3f9" strokeWidth="1.5" />
                <polygon points="100,55 145,100 100,145 55,100" fill="none" stroke="#f8f9fc" strokeWidth="1.5" />
                <polygon points="100,80 120,100 100,120 80,100" fill="none" stroke="#f8f9fc" strokeWidth="1" />
                
                {/* Axes Lines */}
                <line x1="100" y1="30" x2="100" y2="170" stroke="#e9ecef" strokeWidth="1" strokeDasharray="3,3" />
                <line x1="30" y1="100" x2="170" y2="100" stroke="#e9ecef" strokeWidth="1" strokeDasharray="3,3" />
                
                {/* Data Area Polygon */}
                <polygon
                  points={pointsStr}
                  fill="rgba(0, 75, 230, 0.08)"
                  stroke="#004be6"
                  strokeWidth="2.5"
                />

                {/* Corners Markers */}
                <circle cx="100" cy={yTop} r="3" fill="#004be6" />
                <circle cx={xRight} cy="100" r="3" fill="#004be6" />
                <circle cx="100" cy={yBottom} r="3" fill="#004be6" />
                <circle cx={xLeft} cy="100" r="3" fill="#004be6" />
                
                {/* Grid Labels */}
                <text x="100" y="20" textAnchor="middle" className="text-[11px] font-bold fill-slate-500">위험감수</text>
                <text x="180" y="104" textAnchor="start" className="text-[11px] font-bold fill-slate-500">데이터기반</text>
                <text x="100" y="185" textAnchor="middle" className="text-[11px] font-bold fill-slate-500">장기투자</text>
                <text x="20" y="104" textAnchor="end" className="text-[11px] font-bold fill-slate-500">성장자산</text>
              </svg>
            </div>
          </div>
        </div>

        {/* Card 3: 성격적 특징 (Detailed traits list) */}
        <div className="bg-white shadow-md w-full rounded-3xl p-6 flex flex-col gap-4 border border-slate-100 mb-4">
          <div className="flex items-center gap-2 text-slate-800 font-bold text-base border-b border-slate-50 pb-3">
            <span className="material-symbols-outlined text-lg text-slate-400" aria-hidden="true">subject</span>
            <h3>성격적 특징</h3>
          </div>
          <ul className="flex flex-col gap-3">
            {typeData.features?.map((feat, idx) => (
              <li key={idx} className="flex gap-2.5 text-sm text-slate-600 leading-relaxed break-keep text-left">
                <span className="text-[#004be6] mt-0.5 flex-shrink-0 font-bold">•</span>
                <span>{feat}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Card 4: 추천 자산배분 (Donut Chart) */}
        <div className="bg-white shadow-md w-full rounded-3xl p-6 flex flex-col gap-4 border border-slate-100 mb-4">
          <div className="flex items-center gap-2 text-slate-800 font-bold text-base border-b border-slate-50 pb-3">
            <span className="material-symbols-outlined text-lg text-slate-400" aria-hidden="true">pie_chart</span>
            <h3>추천 자산배분</h3>
          </div>

          <div className="flex items-center justify-between gap-2 py-2">
            {/* Recharts Donut Chart */}
            <div className="relative w-36 h-36 flex-shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={typeData.allocation}
                    cx="50%"
                    cy="50%"
                    innerRadius={36}
                    outerRadius={56}
                    dataKey="value"
                    strokeWidth={2}
                    stroke="#fff"
                    paddingAngle={2}
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
              
              {/* Center Donut Label */}
              <div className="absolute inset-0 flex items-center justify-center flex-col">
                <span className="text-[10px] text-slate-400 font-medium">Risk</span>
                <span className="text-xl text-[#004be6] font-extrabold leading-none mt-0.5">
                  {typeData.riskScore?.toFixed(1) || "5.0"}
                </span>
              </div>
            </div>

            {/* Allocation Legend */}
            <div className="flex flex-col gap-2 w-full max-w-[150px] pr-2">
              {typeData.allocation.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between gap-1 w-full text-xs font-semibold">
                  <div className="flex items-center gap-1.5 overflow-hidden">
                    <div
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{
                        backgroundColor: CHART_COLORS[idx % CHART_COLORS.length],
                      }}
                    ></div>
                    <span className="text-slate-500 truncate">{item.name}</span>
                  </div>
                  <span className="text-slate-800 flex-shrink-0">{item.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* DEF-05: 투자 자문 면책 문구 (TC-25) */}
        <div className="w-full px-2 mb-2">
          <p className="text-[11px] text-slate-400 leading-relaxed text-center break-keep">
            ※ 본 진단 결과는 투자 자문이 아니며, 특정 금융상품의 매수·매도를 권유하지 않습니다. 
            투자 의사결정은 본인의 판단과 책임 하에 이루어져야 하며, 본 서비스는 참고용 정보만을 제공합니다.
          </p>
        </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-3 w-full px-4 mt-2">
          {/* Side by side save & share */}
          <div className="flex gap-3 w-full">
            <button
              onClick={handleSaveImage}
              disabled={isSaving}
              className={`flex-1 py-4 bg-white border border-slate-200 text-slate-700 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-slate-50 transition-all text-sm ${
                isSaving ? "opacity-60 cursor-not-allowed" : ""
              }`}
            >
              <span className="material-symbols-outlined text-lg" aria-hidden="true">download</span>
              {isSaving ? "저장 중…" : "이미지 저장"}
            </button>
            <button onClick={handleShare} className="flex-1 py-4 bg-white border border-slate-200 text-slate-700 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-slate-50 transition-all text-sm">
              <span className="material-symbols-outlined text-lg" aria-hidden="true">share</span>
              공유하기
            </button>
          </div>
          
          {/* Large play again button */}
          <Link
            href="/survey"
            className="w-full py-5 bg-[#004be6] hover:bg-[#003cb3] text-white rounded-2xl font-bold flex items-center justify-center transition-all shadow-lg text-center text-lg md:text-xl"
          >
            다시 진단하기
          </Link>
        </div>
      </main>
    </div>
  );
}
