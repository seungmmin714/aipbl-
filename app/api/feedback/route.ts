import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isValidMBTICode } from "@/lib/mbti";

const MAX_FEEDBACK_LENGTH = 1000;

/** 개선사항/추가의견 제출: { content, code?, participantId? } */
export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청 본문입니다" }, { status: 400 });
  }

  const content = typeof body.content === "string" ? body.content.trim() : "";
  if (!content) {
    return NextResponse.json({ error: "의견 내용을 입력해 주세요" }, { status: 400 });
  }
  if (content.length > MAX_FEEDBACK_LENGTH) {
    return NextResponse.json(
      { error: `의견은 ${MAX_FEEDBACK_LENGTH}자 이내로 입력해 주세요` },
      { status: 400 }
    );
  }

  try {
    const rawCode = typeof body.code === "string" ? body.code.toUpperCase() : "";
    const code = isValidMBTICode(rawCode) ? rawCode : null;

    const rawId = typeof body.participantId === "string" ? body.participantId : null;
    const participant = rawId
      ? await prisma.participant.findUnique({ where: { id: rawId } })
      : null;

    await prisma.feedback.create({
      data: { content, code, participantId: participant?.id ?? null },
    });
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (err) {
    console.error("피드백 저장 실패", err);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}
