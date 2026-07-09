import { test } from "node:test";
import assert from "node:assert/strict";
import { calculateMBTI, isValidMBTICode, InvalidAnswersError, TOTAL_QUESTIONS } from "./mbti.mjs";

const mk = (vals) => vals.map((v, i) => ({ questionId: `q${i + 1}`, value: v }));
const FULL_RDLG = mk(["R","R","R","D","D","D","L","L","L","G","G","G"]);

test("정상 응답 12개 → 코드와 원점수를 반환", () => {
  const r = calculateMBTI(FULL_RDLG);
  assert.equal(r.code, "RDLG");
  assert.deepEqual(r.scores, { risk: 3, info: 3, term: 3, asset: 3 });
});

test("2:1 접전도 정확히 판정", () => {
  const r = calculateMBTI(mk(["R","R","S","D","D","I","L","L","T","G","G","V"]));
  assert.equal(r.code, "RDLG");
  assert.deepEqual(r.scores, { risk: 2, info: 2, term: 2, asset: 2 });
});

test("전부 반대 성향 → SITV", () => {
  assert.equal(calculateMBTI(mk(["S","S","S","I","I","I","T","T","T","V","V","V"])).code, "SITV");
});

// ── 회귀 테스트: 이전 구현이 조용히 통과시키던 입력들 ──
test("[회귀] 빈 배열은 예외를 던진다", () => {
  assert.throws(() => calculateMBTI([]), InvalidAnswersError);
});

test("[회귀] 답변 11개(문항 스킵)는 예외를 던진다", () => {
  const skipped = mk(["R","R","S","D","I","L","L","T","G","G","V"]);
  assert.throws(() => calculateMBTI(skipped), InvalidAnswersError);
});

test("[회귀] 중복 문항 응답은 예외를 던진다", () => {
  const dup = FULL_RDLG.map((a, i) => (i === 5 ? { ...a, questionId: "q1" } : a));
  assert.throws(() => calculateMBTI(dup), /중복/);
});

test("[회귀] 알 수 없는 값은 예외를 던진다", () => {
  const bad = mk(["X","Y","Z","X","Y","Z","X","Y","Z","X","Y","Z"]);
  assert.throws(() => calculateMBTI(bad), /알 수 없는/);
});

test("[회귀] 축별 문항 수가 3개가 아니면 예외를 던진다", () => {
  const lopsided = mk(["R","R","R","R","D","D","L","L","L","G","G","G"]);
  assert.throws(() => calculateMBTI(lopsided), /축의 응답/);
});

// ── 전수조사 ──
test("4096개 응답 패턴 전부 유효한 16개 코드 중 하나를 반환", () => {
  const opts = [["R","S"],["D","I"],["L","T"],["G","V"]];
  const seen = new Set();
  for (let mask = 0; mask < 4096; mask++) {
    const vals = Array.from({ length: 12 }, (_, i) =>
      opts[Math.floor(i / 3)][(mask >> i) & 1]
    );
    const { code } = calculateMBTI(mk(vals));
    assert.ok(isValidMBTICode(code), `잘못된 코드: ${code}`);
    seen.add(code);
  }
  assert.equal(seen.size, 16, "16개 유형이 모두 도달 가능해야 함");
});

test("isValidMBTICode: 유효/무효 판별", () => {
  assert.ok(isValidMBTICode("RDLG"));
  assert.ok(isValidMBTICode("rdlg"));   // 대소문자 무관
  assert.ok(!isValidMBTICode("RDLX"));  // 4번째 축에 없는 문자
  assert.ok(!isValidMBTICode("DRLG"));  // 축 순서 뒤바뀜
  assert.ok(!isValidMBTICode("RDL"));   // 길이 부족
  assert.ok(!isValidMBTICode(""));
});

test("TOTAL_QUESTIONS 상수는 12", () => assert.equal(TOTAL_QUESTIONS, 12));
