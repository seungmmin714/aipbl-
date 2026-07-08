import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center text-center">
      <div className="space-y-6">
        <div className="inline-block rounded-full bg-blue-500/10 px-4 py-1.5 text-sm font-medium text-blue-400 ring-1 ring-inset ring-blue-500/20">
          투자 성향 MBTI 테스트
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
          나의 <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">투자 MBTI</span>는 무엇일까?
        </h1>
        <p className="mx-auto max-w-md text-base text-slate-400">
          10가지 문항에 답하고, 나에게 꼭 맞는 맞춤형 자산 배분 포트폴리오를 추천받아 보세요.
        </p>
        <div className="pt-4">
          <Link
            href="/survey"
            className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 px-8 py-4 text-base font-semibold text-white shadow-lg shadow-blue-500/20 hover:from-blue-600 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-950 transition-all hover:scale-[1.02]"
          >
            진단 시작하기
          </Link>
        </div>
      </div>
    </div>
  );
}
