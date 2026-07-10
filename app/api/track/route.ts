import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isValidMBTICode } from "@/lib/mbti";

/**
 * 참여 추적 이벤트 수집
 * - { event: "start" }                          → 참여자 생성, participantId 반환
 * - { event: "complete", participantId }        → 완료 시각 기록
 * - { event: "result", code, participantId? }   → 결과 조회 기록
 */
export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청 본문입니다" }, { status: 400 });
  }

  try {
    const event = body.event;

    if (event === "start") {
      const participant = await prisma.participant.create({ data: {} });
      return NextResponse.json({ participantId: participant.id }, { status: 201 });
    }

    if (event === "complete") {
      const participantId = typeof body.participantId === "string" ? body.participantId : null;
      if (participantId) {
        // 존재하지 않는 id는 조용히 무시 (추적 실패가 UX를 막으면 안 됨)
        await prisma.participant
          .update({ where: { id: participantId }, data: { completedAt: new Date() } })
          .catch(() => null);
      }
      return NextResponse.json({ ok: true });
    }

    if (event === "result") {
      const code = typeof body.code === "string" ? body.code.toUpperCase() : "";
      if (!isValidMBTICode(code)) {
        return NextResponse.json({ error: "유효하지 않은 MBTI 코드입니다" }, { status: 400 });
      }
      const rawId = typeof body.participantId === "string" ? body.participantId : null;
      const participant = rawId
        ? await prisma.participant.findUnique({ where: { id: rawId } })
        : null;
      await prisma.result.create({
        data: { code, participantId: participant?.id ?? null },
      });
      return NextResponse.json({ ok: true }, { status: 201 });
    }

    return NextResponse.json({ error: "알 수 없는 이벤트입니다" }, { status: 400 });
  } catch (err) {
    console.error("추적 이벤트 저장 실패", err);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}
