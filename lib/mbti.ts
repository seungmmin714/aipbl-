/**
 * 투자 MBTI 4축 판정 알고리즘
 *
 * 각 축당 3문항, 과반수(2개 이상) 획득 성향 채택.
 * 동점 시(1:1은 홀수 설계로 원천 차단) 보수적 성향(S, I, T, V)으로 판정.
 */

export const TOTAL_QUESTIONS = 12;

export interface Answer {
  questionId: string;
  value: string; // 'R'|'S' | 'D'|'I' | 'L'|'T' | 'G'|'V'
}

export interface MBTIResult {
  code: string;
  scores: { R: number; D: number; L: number; G: number };
}

/** 입력 검증 실패 시 발생하는 에러 */
export class InvalidAnswersError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidAnswersError";
  }
}

// 축 정의: 각 축의 positive 값과 해당 문항 ID
const AXES = [
  { pos: "R", neg: "S", questions: ["q1", "q2", "q3"] },
  { pos: "D", neg: "I", questions: ["q4", "q5", "q6"] },
  { pos: "L", neg: "T", questions: ["q7", "q8", "q9"] },
  { pos: "G", neg: "V", questions: ["q10", "q11", "q12"] },
] as const;

const VALID_VALUES = new Set(["R", "S", "D", "I", "L", "T", "G", "V"]);

/**
 * 12개 답변 배열을 받아 4자리 MBTI 코드와 축별 점수를 반환합니다.
 * 입력이 유효하지 않으면 InvalidAnswersError를 throw합니다.
 *
 * 예: [{q1:"R"}, {q2:"S"}, ...] → { code: "RDLG", scores: {R:2, D:3, L:2, G:3} }
 */
export function calculateMBTI(answers: Answer[]): MBTIResult {
  // 1) 답변 개수 검증
  if (!Array.isArray(answers) || answers.length !== TOTAL_QUESTIONS) {
    throw new InvalidAnswersError(
      `답변은 정확히 ${TOTAL_QUESTIONS}개여야 합니다. (현재: ${Array.isArray(answers) ? answers.length : 0}개)`
    );
  }

  // 2) 중복 questionId 검증
  const questionIds = answers.map((a) => a.questionId);
  const uniqueIds = new Set(questionIds);
  if (uniqueIds.size !== answers.length) {
    throw new InvalidAnswersError("중복된 문항 ID가 있습니다.");
  }

  // 3) 알 수 없는 값 검증
  for (const answer of answers) {
    if (!VALID_VALUES.has(answer.value)) {
      throw new InvalidAnswersError(
        `알 수 없는 응답 값 "${answer.value}"이(가) 있습니다.`
      );
    }
  }

  // 4) 축별 문항 수 검증
  const answerMap = new Map(answers.map((a) => [a.questionId, a.value]));
  for (const axis of AXES) {
    const count = axis.questions.filter((qId) => answerMap.has(qId)).length;
    if (count !== 3) {
      throw new InvalidAnswersError(
        `${axis.pos}/${axis.neg} 축의 응답이 3개가 아닙니다. (현재: ${count}개)`
      );
    }

    // 값이 해당 축의 값인지 확인
    for (const qId of axis.questions) {
      const val = answerMap.get(qId);
      if (val && val !== axis.pos && val !== axis.neg) {
        throw new InvalidAnswersError(
          `문항 ${qId}의 응답 "${val}"은(는) ${axis.pos}/${axis.neg} 축에 유효하지 않습니다.`
        );
      }
    }
  }

  // 축별 카운트 초기화
  let R = 0;
  let D = 0;
  let L = 0;
  let G = 0;

  for (const answer of answers) {
    switch (answer.value) {
      case "R":
        R++;
        break;
      case "D":
        D++;
        break;
      case "L":
        L++;
        break;
      case "G":
        G++;
        break;
      // S, I, T, V는 카운트하지 않음 — 반대 축 미달 시 자동 선택
    }
  }

  // 과반수 판정 (각 축 3문항 중 2개 이상)
  // 동점 시 보수적 성향(우측: S, I, T, V) 선택
  const axis1 = R >= 2 ? "R" : "S";
  const axis2 = D >= 2 ? "D" : "I";
  const axis3 = L >= 2 ? "L" : "T";
  const axis4 = G >= 2 ? "G" : "V";

  return {
    code: `${axis1}${axis2}${axis3}${axis4}`,
    scores: { R, D, L, G },
  };
}

/**
 * MBTI 코드가 유효한 16개 유형 중 하나인지 검증합니다.
 */
export function isValidMBTICode(code: string): boolean {
  const validCodes = [
    "RDLG", "RDLV", "RDTG", "RDTV",
    "RILG", "RILV", "RITG", "RITV",
    "SDLG", "SDLV", "SDTG", "SDTV",
    "SILG", "SILV", "SITG", "SITV",
  ];
  return validCodes.includes(code.toUpperCase());
}
