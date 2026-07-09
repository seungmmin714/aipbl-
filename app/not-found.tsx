import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#f4f5f9] flex flex-col items-center justify-center px-6 text-center gap-4">
      <h1 className="text-2xl font-black text-slate-800">페이지를 찾을 수 없습니다</h1>
      <Link
        href="/"
        className="bg-[#004be6] text-white px-8 py-3 rounded-xl font-semibold hover:bg-[#003cb3] transition-all mt-2"
      >
        홈으로 돌아가기
      </Link>
    </div>
  );
}
