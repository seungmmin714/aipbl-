import Link from "next/link";

interface ResultPageProps {
  params: {
    code: string;
  };
}

export default function ResultPage({ params }: ResultPageProps) {
  const code = params.code?.toUpperCase() || "RDLG";

  return (
    <div className="space-y-8 py-4">
      {/* 상단 타이틀 */}
      <div className="text-center space-y-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-blue-400">
          투자 MBTI 진단 결과
        </span>
        <h1 className="text-3xl font-extrabold text-white">
          나의 투자 MBTI 코드: <span className="text-indigo-400">{code}</span>
        </h1>
      </div>

      {/* 결과 요약 카드 (Glassmorphism 스타일) */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 backdrop-blur-md space-y-4">
        <h2 className="text-lg font-bold text-white">유형 분석 (뼈대)</h2>
        <p className="text-sm text-slate-300 leading-relaxed">
          이 유형은 데이터 분석 결과를 바탕으로 장기적인 성장을 노리는 스타일입니다. (임시 텍스트)
        </p>
      </div>

      {/* 추천 자산 배분 비중 (뼈대) */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 backdrop-blur-md space-y-4">
        <h2 className="text-lg font-bold text-white">추천 자산 포트폴리오 (뼈대)</h2>
        <div className="space-y-2 text-sm text-slate-300">
          <div className="flex justify-between">
            <span>국내 주식</span>
            <span className="font-semibold text-white">30%</span>
          </div>
          <div className="flex justify-between">
            <span>해외 주식</span>
            <span className="font-semibold text-white">40%</span>
          </div>
          <div className="flex justify-between">
            <span>채권</span>
            <span className="font-semibold text-white">10%</span>
          </div>
          <div className="flex justify-between">
            <span>현금</span>
            <span className="font-semibold text-white">20%</span>
          </div>
        </div>
      </div>

      {/* 하단 버튼 및 액션 */}
      <div className="flex flex-col gap-3 pt-4">
        <Link
          href="/"
          className="flex justify-center rounded-xl bg-slate-900 border border-slate-800 py-3.5 text-sm font-semibold text-white hover:bg-slate-800 transition-colors"
        >
          테스트 다시하기
        </Link>
      </div>
    </div>
  );
}
