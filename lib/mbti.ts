/**
 * 투자 MBTI 4축 판정 알고리즘
 *
 * 각 축당 3문항, 과반수(2개 이상) 획득 성향 채택.
 * 동점 시(1:1은 홀수 설계로 원천 차단) 보수적 성향(S, I, T, V)으로 판정.
 */

export interface Answer {
  questionId: string;
  value: string; // 'R'|'S' | 'D'|'I' | 'L'|'T' | 'G'|'V'
}

/**
 * 12개 답변 배열을 받아 4자리 MBTI 코드를 반환합니다.
 * 예: ['R','S','R', 'D','D','I', 'L','L','T', 'G','V','G'] → "RDLG"
 */
export function calculateMBTI(answers: Answer[]): string {
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

  return `${axis1}${axis2}${axis3}${axis4}`;
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
