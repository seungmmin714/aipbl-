/**
 * 투자 MBTI 4축 판정 알고리즘
 *
 * 각 축당 3문항, 과반수(2개 이상) 획득 성향 채택.
 * 축당 문항 수가 홀수(3)이므로 동점은 원천 발생하지 않는다.
 */

export const AXES = [
  { key: "risk", pos: "R", neg: "S" },
  { key: "info", pos: "D", neg: "I" },
  { key: "term", pos: "L", neg: "T" },
  { key: "asset", pos: "G", neg: "V" },
] as const;

export const QUESTIONS_PER_AXIS = 3;
export const TOTAL_QUESTIONS = AXES.length * QUESTIONS_PER_AXIS; // 12

const VALID_VALUES = new Set(AXES.flatMap((a) => [a.pos, a.neg]));

export interface Answer {
  questionId: string;
  value: string; // 'R'|'S' | 'D'|'I' | 'L'|'T' | 'G'|'V'
}

/** 축별 원점수(0~3). pos 성향을 고른 횟수. */
export interface AxisScores {
  risk: number;
  info: number;
  term: number;
  asset: number;
}

export interface MBTIResult {
  code: string;
  scores: AxisScores;
}

export class InvalidAnswersError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidAnswersError";
  }
}

/**
 * 12개 답변 배열을 받아 4자리 MBTI 코드와 축별 원점수를 반환합니다.
 *
 * @throws {InvalidAnswersError} 개수 불일치, 문항 중복, 알 수 없는 값,
 *                               축별 문항 수 불일치인 경우
 */
export function calculateMBTI(answers: Answer[]): MBTIResult {
  // ── 입력 검증 ────────────────────────────────────────────
  if (!Array.isArray(answers)) {
    throw new InvalidAnswersError("answers는 배열이어야 합니다.");
  }
  if (answers.length !== TOTAL_QUESTIONS) {
    throw new InvalidAnswersError(
      `답변 ${TOTAL_QUESTIONS}개가 필요합니다. 받은 개수: ${answers.length}`
    );
  }
  if (new Set(answers.map((a) => a.questionId)).size !== TOTAL_QUESTIONS) {
    throw new InvalidAnswersError("중복된 문항 응답이 있습니다.");
  }
  const bad = answers.find((a) => !VALID_VALUES.has(a.value as never));
  if (bad) {
    throw new InvalidAnswersError(
      `알 수 없는 응답 값입니다: ${bad.questionId}="${bad.value}"`
    );
  }

  // ── 축별 집계 ────────────────────────────────────────────
  const scores = { risk: 0, info: 0, term: 0, asset: 0 } as AxisScores;
  const seen = { risk: 0, info: 0, term: 0, asset: 0 } as AxisScores;

  for (const answer of answers) {
    const axis = AXES.find((a) => a.pos === answer.value || a.neg === answer.value)!;
    seen[axis.key] += 1;
    if (answer.value === axis.pos) scores[axis.key] += 1;
  }

  const wrong = AXES.find((a) => seen[a.key] !== QUESTIONS_PER_AXIS);
  if (wrong) {
    throw new InvalidAnswersError(
      `'${wrong.key}' 축의 응답이 ${seen[wrong.key]}개입니다. ` +
        `${QUESTIONS_PER_AXIS}개여야 합니다.`
    );
  }

  // ── 과반수 판정 (3문항 중 2개 이상) ──────────────────────
  const threshold = Math.ceil(QUESTIONS_PER_AXIS / 2); // 2
  const code = AXES.map((a) =>
    scores[a.key] >= threshold ? a.pos : a.neg
  ).join("");

  return { code, scores };
}

/** MBTI 코드가 유효한 16개 유형 중 하나인지 검증합니다. */
export function isValidMBTICode(code: string): boolean {
  if (typeof code !== "string" || code.length !== AXES.length) return false;
  const upper = code.toUpperCase();
  return AXES.every((a, i) => upper[i] === a.pos || upper[i] === a.neg);
}
