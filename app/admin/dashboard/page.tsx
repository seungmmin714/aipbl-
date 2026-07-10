import Link from "next/link";
import { prisma } from "@/lib/prisma";
import mbtiTypes from "@/data/mbti-types.json";

// 항상 최신 통계를 조회 (정적 캐싱 방지)
export const dynamic = "force-dynamic";

const nicknameOf = (code: string) =>
  mbtiTypes.find((t) => t.code === code)?.nickname ?? "알 수 없음";

function StatCard({ label, value, icon }: { label: string; value: string; icon: string }) {
  return (
    <div className="bg-white shadow-md rounded-3xl p-5 border border-slate-100 flex flex-col gap-1">
      <div className="flex items-center gap-1.5 text-slate-400 text-xs font-semibold">
        <span className="material-symbols-outlined text-base" aria-hidden="true">{icon}</span>
        <span>{label}</span>
      </div>
      <span className="text-2xl font-black text-slate-800">{value}</span>
    </div>
  );
}

export default async function AdminDashboardPage() {
  let stats;
  try {
    const [totalParticipants, completedCount, resultCount, resultGroups, recentFeedback] =
      await Promise.all([
        prisma.participant.count(),
        prisma.participant.count({ where: { completedAt: { not: null } } }),
        prisma.result.count(),
        prisma.result.groupBy({
          by: ["code"],
          _count: { code: true },
          orderBy: { _count: { code: "desc" } },
        }),
        prisma.feedback.findMany({ orderBy: { createdAt: "desc" }, take: 10 }),
      ]);
    stats = { totalParticipants, completedCount, resultCount, resultGroups, recentFeedback };
  } catch (err) {
    console.error("대시보드 통계 조회 실패", err);
    return (
      <div className="min-h-screen bg-[#f4f5f9] flex flex-col items-center justify-center px-6 text-center">
        <span className="material-symbols-outlined text-6xl text-slate-300 mb-4" aria-hidden="true">
          database_off
        </span>
        <h1 className="font-headline-lg text-headline-lg text-slate-800 mb-2">
          데이터베이스에 연결할 수 없습니다
        </h1>
        <p className="font-body-md text-slate-500 mb-8 break-keep">
          DATABASE_URL 환경변수가 설정되어 있는지, 마이그레이션(pnpm db:migrate)이 적용되었는지
          확인해 주세요.
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

  const { totalParticipants, completedCount, resultCount, resultGroups, recentFeedback } = stats;
  const completionRate =
    totalParticipants > 0 ? Math.round((completedCount / totalParticipants) * 100) : 0;
  const maxGroupCount = resultGroups[0]?._count.code ?? 0;

  return (
    <div className="min-h-screen bg-[#f4f5f9] text-[#001a42] flex flex-col font-body-md">
      {/* Top Header App Bar */}
      <header className="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-6 h-16 bg-white border-b border-slate-100/80 shadow-sm">
        <div className="flex items-center text-[#004be6] hover:opacity-80">
          <Link href="/">
            <span className="material-symbols-outlined text-2xl font-light" aria-hidden="true">arrow_back</span>
          </Link>
        </div>
        <span className="font-extrabold text-[#004be6] text-xl tracking-tight">
          관리자 대시보드
        </span>
        <div className="w-8" />
      </header>

      <main className="flex-grow w-full max-w-2xl mx-auto px-4 pt-24 pb-12 flex flex-col gap-4">
        {/* 요약 통계 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard label="총 참여자" value={totalParticipants.toLocaleString()} icon="group" />
          <StatCard label="완료" value={completedCount.toLocaleString()} icon="task_alt" />
          <StatCard label="완료율" value={`${completionRate}%`} icon="percent" />
          <StatCard label="결과 조회" value={resultCount.toLocaleString()} icon="visibility" />
        </div>

        {/* MBTI 유형 분포 */}
        <div className="bg-white shadow-md rounded-3xl p-6 border border-slate-100">
          <div className="flex items-center gap-2 text-slate-800 font-bold text-base border-b border-slate-50 pb-3 mb-4">
            <span className="material-symbols-outlined text-lg text-slate-400" aria-hidden="true">bar_chart</span>
            <h3>MBTI 유형별 분포</h3>
          </div>
          {resultGroups.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-6">아직 기록된 결과가 없습니다.</p>
          ) : (
            <ul className="flex flex-col gap-3">
              {resultGroups.map((g) => (
                <li key={g.code} className="flex items-center gap-3">
                  <span className="w-14 font-black text-[#004be6] text-sm">{g.code}</span>
                  <div className="flex-grow h-3 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#004be6] to-[#06b6d4] rounded-full"
                      style={{
                        width: `${maxGroupCount ? (g._count.code / maxGroupCount) * 100 : 0}%`,
                      }}
                    />
                  </div>
                  <span className="w-10 text-right text-sm font-bold text-slate-700">
                    {g._count.code}
                  </span>
                  <span className="hidden md:block w-28 text-xs text-slate-400 truncate">
                    {nicknameOf(g.code)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* 최근 추가의견 */}
        <div className="bg-white shadow-md rounded-3xl p-6 border border-slate-100">
          <div className="flex items-center gap-2 text-slate-800 font-bold text-base border-b border-slate-50 pb-3 mb-4">
            <span className="material-symbols-outlined text-lg text-slate-400" aria-hidden="true">chat_bubble</span>
            <h3>최근 추가의견</h3>
          </div>
          {recentFeedback.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-6">아직 제출된 의견이 없습니다.</p>
          ) : (
            <ul className="flex flex-col divide-y divide-slate-50">
              {recentFeedback.map((f) => (
                <li key={f.id} className="py-3 flex flex-col gap-1.5">
                  <p className="text-sm text-slate-700 leading-relaxed break-keep whitespace-pre-wrap">
                    {f.content}
                  </p>
                  <div className="flex items-center gap-2 text-[11px] text-slate-400">
                    {f.code && (
                      <span className="px-2 py-0.5 rounded-full bg-[#e8edfc] text-[#004be6] font-bold">
                        {f.code}
                      </span>
                    )}
                    <span>
                      {new Date(f.createdAt).toLocaleString("ko-KR", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
    </div>
  );
}
