"use client";

import Link from "next/link";
import Image from "next/image";
import { useParams } from "next/navigation";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import mbtiTypes from "@/data/mbti-types.json";
import { useEffect, useState } from "react";

// 도넛 차트 컬러 팔레트 ( 디자인 가이드 다크 모드에 어울리는 보라, 청록, 핑크, 에메랄드 등 )
const CHART_COLORS = ["#6366f1", "#06b6d4", "#ec4899", "#10b981", "#f59e0b", "#8b5cf6"];

export default function ResultPage() {
  const params = useParams();
  const code = (params?.code as string)?.toUpperCase() || "";

  // 유형 데이터 조회
  const typeData = mbtiTypes.find((t) => t.code === code);

  // 디버깅/검증을 위한 LocalStorage 카운터 상태 관리 (UI에 노출되지는 않으나 로직 검증용)
  const [saveCount, setSaveCount] = useState(0);
  const [shareCount, setShareCount] = useState(0);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setSaveCount(parseInt(localStorage.getItem("mbti_save_click_count") || "0", 10));
      setShareCount(parseInt(localStorage.getItem("mbti_share_click_count") || "0", 10));
    }
  }, []);

  // 존재하지 않는 코드 처리
  if (!typeData) {
    return (
      <div className="min-h-screen bg-[#0B0E14] text-[#F8FAFC] flex flex-col items-center justify-center px-6 text-center">
        <span className="material-symbols-outlined text-6xl text-slate-500 mb-4">
          error_outline
        </span>
        <h1 className="font-headline-lg text-2xl font-bold text-[#F8FAFC] mb-2">
          유형을 찾을 수 없습니다
        </h1>
        <p className="font-body-md text-slate-400 mb-8">
          &quot;{code}&quot;는 유효한 투자 MBTI 코드가 아닙니다.
        </p>
        <Link
          href="/"
          className="bg-[#6366F1] text-white px-8 py-3 rounded-xl font-semibold hover:bg-[#5053db] transition-all glow-button"
        >
          홈으로 돌아가기
        </Link>
      </div>
    );
  }

  // 4축 코드 분해를 이용해 방사형 차트 좌표 계산
  // 1.위험감수 (Top)
  // 2.데이터기반 (Right)
  // 3.장기투자 (Bottom)
  // 4.성장자산 (Left)
  const isR = typeData.code.includes("R");
  const isD = typeData.code.includes("D");
  const isL = typeData.code.includes("L");
  const isG = typeData.code.includes("G");

  const yTop = isR ? 35 : 75;       // 위험감수 (y값 작을수록 위)
  const xRight = isD ? 165 : 125;   // 데이터기반 (x값 클수록 오른쪽)
  const yBottom = isL ? 165 : 125;  // 장기투자 (y값 클수록 아래)
  const xLeft = isG ? 35 : 75;      // 성장자산 (x값 작을수록 왼쪽)

  const pointsStr = `100,${yTop} ${xRight},100 100,${yBottom} ${xLeft},100`;

  // 이미지 저장 기능 (html2canvas)
  const handleSaveImage = async () => {
    // 1. LocalStorage 카운터 증가
    const newCount = saveCount + 1;
    localStorage.setItem("mbti_save_click_count", newCount.toString());
    setSaveCount(newCount);

    // 2. html2canvas 동적 로드 (SSR 빌드 에러 방지)
    const element = document.getElementById("result-card-capture");
    if (!element) return;
    try {
      const html2canvas = (await import("html2canvas")).default;
      const canvas = await html2canvas(element, {
        useCORS: true,
        backgroundColor: "#0B0E14",
        scale: 2, // 고화질 캡처
        logging: false,
      });
      const dataUrl = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.download = `투자_MBTI_결과_${code}.png`;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error("Failed to save image:", error);
      alert("이미지 저장 중 오류가 발생했습니다. 다시 시도해 주세요.");
    }
  };

  // 공유 기능 (Web Share & Clipboard)
  const handleShare = async () => {
    // 1. LocalStorage 카운터 증가
    const newCount = shareCount + 1;
    localStorage.setItem("mbti_share_click_count", newCount.toString());
    setShareCount(newCount);

    // 2. 공유 텍스트 작성
    const shareUrl = typeof window !== "undefined" ? window.location.href : "";
    const shareText = `나의 투자 MBTI 결과는 [${typeData.code}: ${typeData.nickname}]!
${typeData.desc}

맞춤형 자산배분 포트폴리오를 지금 확인해 보세요!`;

    // 3. Web Share API 분기
    if (navigator.share) {
      try {
        await navigator.share({
          title: "투자 MBTI 진단 결과",
          text: shareText,
          url: shareUrl,
        });
      } catch (err) {
        console.log("Web Share cancelled or failed", err);
      }
    } else {
      // 4. 클립보드 복사 폴백
      try {
        await navigator.clipboard.writeText(`${shareText}\n\n결과 링크: ${shareUrl}`);
        alert("결과 링크가 클립보드에 복사되었습니다! SNS 등에 붙여넣어 공유해 보세요.");
      } catch (err) {
        console.error("Clipboard copy failed:", err);
        alert("링크 복사에 실패했습니다. 브라우저 주소창의 URL을 복사하여 전달해 주세요.");
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0E14] text-[#F8FAFC] flex flex-col font-body-md relative overflow-x-hidden">
      {/* Abstract Tech Background */}
      <div className="tech-bg"></div>

      {/* Top Header App Bar */}
      <header className="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-6 h-16 bg-[#0B0E14]/70 backdrop-blur-xl border-b border-white/5 shadow-sm">
        <div className="flex items-center text-[#6366F1] hover:opacity-80">
          <Link href="/">
            <span className="material-symbols-outlined text-2xl font-light">account_circle</span>
          </Link>
        </div>
        <span className="font-extrabold text-[#6366F1] text-xl tracking-tight">Invest-Type</span>
        <div className="flex items-center text-[#6366F1]">
          <span className="material-symbols-outlined text-2xl font-light">help_outline</span>
        </div>
      </header>

      {/* Main Content Canvas */}
      <main className="flex-grow flex flex-col items-center justify-center px-4 pt-24 pb-12 relative z-10 w-full max-w-md mx-auto">
        
        {/* Badge: 당신의 투자 MBTI는 */}
        <div className="mb-2">
          <span className="inline-block px-4 py-1.5 rounded-full text-xs font-bold bg-[#6366F1]/10 text-[#6366F1] tracking-wide border border-[#6366F1]/20">
            당신의 투자 MBTI는
          </span>
        </div>

        {/* MBTI Code */}
        <h1 className="font-black text-5xl md:text-6xl text-[#6366F1] tracking-wider mb-6 text-glow">
          {typeData.code}
        </h1>

        {/* Capture Container: Everything inside this div will be saved as a PNG image */}
        <div id="result-card-capture" className="w-full flex flex-col gap-4 bg-[#0B0E14] p-4 rounded-3xl border border-white/5">
          
          {/* Card 1: Main Animal Card */}
          <div className="surface-glass shadow-2xl w-full rounded-3xl p-6 flex flex-col items-center gap-4 relative overflow-hidden">
            {/* Circular Image Container */}
            <div className="relative w-56 h-56 rounded-full overflow-hidden bg-[#10131a] flex items-center justify-center p-3 border border-white/5 shadow-inner">
              <Image
                src={typeData.image}
                alt={typeData.nickname}
                width={200}
                height={200}
                className="object-contain z-10"
                priority
              />
            </div>

            {/* Nickname & Emoji */}
            <div className="text-center mt-2">
              <h2 className="text-2xl font-black text-[#F8FAFC] flex items-center justify-center gap-1.5">
                <span>{typeData.nickname}</span>
                <span className="text-3xl">{typeData.emoji}</span>
              </h2>
            </div>

            {/* Summary description paragraph */}
            <p className="text-[#94A3B8] text-sm text-center leading-relaxed max-w-[310px] mt-1 break-keep">
              {typeData.desc}
            </p>
          </div>

          {/* Card 2: 성향 분석 (Radar Chart) */}
          <div className="surface-glass shadow-2xl w-full rounded-3xl p-6 flex flex-col gap-4">
            <div className="flex items-center gap-2 text-[#F8FAFC] font-bold text-base border-b border-white/5 pb-3">
              <span className="material-symbols-outlined text-lg text-[#6366F1]">signal_cellular_alt</span>
              <h3>성향 분석</h3>
            </div>

            {/* SVG Custom Radar Chart */}
            <div className="flex items-center justify-center py-2">
              <div className="relative w-60 h-60 flex items-center justify-center">
                <svg className="w-full h-full overflow-visible" viewBox="-40 0 280 200">
                  {/* Concentric Grid Diamonds */}
                  <polygon points="100,30 170,100 100,170 30,100" fill="none" stroke="rgba(255, 255, 255, 0.05)" strokeWidth="1.5" />
                  <polygon points="100,55 145,100 100,145 55,100" fill="none" stroke="rgba(255, 255, 255, 0.03)" strokeWidth="1.5" />
                  <polygon points="100,80 120,100 100,120 80,100" fill="none" stroke="rgba(255, 255, 255, 0.02)" strokeWidth="1" />
                  
                  {/* Axes Lines */}
                  <line x1="100" y1="30" x2="100" y2="170" stroke="rgba(255, 255, 255, 0.05)" strokeWidth="1" strokeDasharray="3,3" />
                  <line x1="30" y1="100" x2="170" y2="100" stroke="rgba(255, 255, 255, 0.05)" strokeWidth="1" strokeDasharray="3,3" />
                  
                  {/* Data Area Polygon */}
                  <polygon
                    points={pointsStr}
                    fill="rgba(99, 102, 241, 0.15)"
                    stroke="#6366F1"
                    strokeWidth="2.5"
                  />

                  {/* Corners Markers */}
                  <circle cx="100" cy={yTop} r="3.5" fill="#6366F1" />
                  <circle cx={xRight} cy="100" r="3.5" fill="#6366F1" />
                  <circle cx="100" cy={yBottom} r="3.5" fill="#6366F1" />
                  <circle cx={xLeft} cy="100" r="3.5" fill="#6366F1" />
                  
                  {/* Grid Labels */}
                  <text x="100" y="18" textAnchor="middle" className="text-[11px] font-bold fill-[#94A3B8] font-mono">위험감수</text>
                  <text x="180" y="104" textAnchor="start" className="text-[11px] font-bold fill-[#94A3B8] font-mono">데이터기반</text>
                  <text x="100" y="187" textAnchor="middle" className="text-[11px] font-bold fill-[#94A3B8] font-mono">장기투자</text>
                  <text x="20" y="104" textAnchor="end" className="text-[11px] font-bold fill-[#94A3B8] font-mono">성장자산</text>
                </svg>
              </div>
            </div>
          </div>

          {/* Card 3: 성격적 특징 (Detailed traits list) */}
          <div className="surface-glass shadow-2xl w-full rounded-3xl p-6 flex flex-col gap-4 animate-fade-in">
            <div className="flex items-center gap-2 text-[#F8FAFC] font-bold text-base border-b border-white/5 pb-3">
              <span className="material-symbols-outlined text-lg text-[#6366F1]">subject</span>
              <h3>성격적 특징</h3>
            </div>
            <ul className="flex flex-col gap-3">
              {typeData.features?.map((feat, idx) => (
                <li key={idx} className="flex gap-2.5 text-sm text-[#94A3B8] leading-relaxed break-keep text-left">
                  <span className="text-[#6366F1] mt-0.5 flex-shrink-0 font-bold">•</span>
                  <span>{feat}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Card 4: 추천 자산배분 (Donut Chart) */}
          <div className="surface-glass shadow-2xl w-full rounded-3xl p-6 flex flex-col gap-4 mb-2">
            <div className="flex items-center gap-2 text-[#F8FAFC] font-bold text-base border-b border-white/5 pb-3">
              <span className="material-symbols-outlined text-lg text-[#6366F1]">pie_chart</span>
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
                      stroke="#0B0E14"
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
                  <span className="text-[10px] text-[#94A3B8] font-medium uppercase font-mono">Risk</span>
                  <span className="text-xl text-[#06B6D4] font-extrabold leading-none mt-0.5 text-glow">
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
                      <span className="text-[#94A3B8] truncate">{item.name}</span>
                    </div>
                    <span className="text-[#F8FAFC] flex-shrink-0">{item.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Hidden Capture Footer */}
          <div className="text-center pt-3 border-t border-white/5 mt-1">
            <span className="font-label-mono text-[9px] text-slate-600 uppercase tracking-widest font-mono">
              INVEST-TYPE BY VISIONARY ANALYST
            </span>
          </div>

        </div>

        {/* Action Buttons (Excluded from capture) */}
        <div className="flex flex-col gap-3 w-full mt-4">
          {/* Side by side save & share */}
          <div className="flex gap-3 w-full">
            <button
              onClick={handleSaveImage}
              className="flex-1 py-4 bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 text-[#F8FAFC] rounded-2xl font-bold flex items-center justify-center gap-2 transition-all text-sm"
            >
              <span className="material-symbols-outlined text-lg">download</span>
              이미지 저장
            </button>
            <button
              onClick={handleShare}
              className="flex-1 py-4 bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 text-[#F8FAFC] rounded-2xl font-bold flex items-center justify-center gap-2 transition-all text-sm"
            >
              <span className="material-symbols-outlined text-lg">share</span>
              공유하기
            </button>
          </div>
          
          {/* Large play again button */}
          <Link
            href="/survey"
            className="w-full py-5 bg-[#6366F1] hover:bg-[#5053db] text-white rounded-2xl font-bold flex items-center justify-center transition-all shadow-lg text-center text-lg md:text-xl glow-button"
          >
            다시 진단하기
          </Link>
        </div>
      </main>
    </div>
  );
}
