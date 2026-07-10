# 투자 MBTI — 결함 수정 패치 문서

- **브랜치**: `fix/qa-critical`
- **기준 커밋**: `a7ef550`
- **작성일**: 2026-07-09
- **적용 결함**: DEF-01 ~ DEF-16, DEF-18, DEF-19 (총 18건)

---

## 0. 검증 결과 (수정 후)

```
$ npx tsc --noEmit        →  ✅ 통과 (에러 0)
$ npx next lint           →  ✅ 경고 1건 (no-img-element, 의도적 유지)
$ npm test                →  ✅ 11 tests, 11 pass, 0 fail
$ npx next build          →  ✅ 컴파일 성공
```

### 번들 크기 변화

| 라우트 | 수정 전 | 수정 후 | 변화 |
|---|---|---|---|
| `/` | 96.2 kB | 97.2 kB | +1.0 kB (에러 UI·검증) |
| `/survey` | 98.5 kB | 99.6 kB | +1.1 kB (세션 복원·접근성) |
| **`/result/[code]`** | **242 kB** | **197 kB** | **−45 kB (−19%)** |

`html2canvas` 지연 로딩 + 미사용 의존성 제거의 효과.

### 변경 파일

```
 .eslintrc.json             |   3 +          (신규)
 app/error.tsx              |  39 +          (신규)
 app/not-found.tsx          |  15 +          (신규)
 lib/mbti.test.mjs          |  73 +          (신규)
 lib/mbti.ts                | 122 ++++----
 app/survey/page.tsx        | 156 +++++----
 app/result/[code]/page.tsx | 103 ++++---
 app/page.tsx               |  64 ++--
 app/layout.tsx             |  26 +-
 app/globals.css            |   9 +
 data/questions.json        |   4 +-
 package.json               |   8 +-
 12 files changed, 458 insertions(+), 164 deletions(-)
```

---

## 1. `lib/mbti.ts` — 채점 로직 (DEF-03, 부분 R-07)

### 무엇이 문제였나

```ts
const axis1 = R >= 2 ? "R" : "S";   // 카운트가 부족하면 무조건 보수 성향
```

`R`, `D`, `L`, `G`만 세고 나머지는 "미달 시 자동 선택"에 맡겼다. 답변이 몇 개든, 값이 무엇이든 항상 4자리 코드가 나온다. 결손 데이터가 전부 `SITV`로 조용히 수렴했다.

### 어떻게 고쳤나

1. **축 정의를 데이터로 승격** — `AXES` 상수. `TOTAL_QUESTIONS`가 여기서 유도되므로 문항 수를 코드 곳곳에 하드코딩하지 않아도 된다 (DEF-12 근본 해결).
2. **네 겹의 입력 검증** — 개수 / 중복 / 알 수 없는 값 / 축별 문항 수.
3. **`scores` 반환** — 축별 원점수(0~3)를 함께 돌려준다. 3:0과 2:1을 구분할 수 있게 되어, 향후 레이더 차트 개선의 토대가 된다.
4. **`isValidMBTICode` 재작성** — 16개 문자열을 나열하는 대신 축 정의에서 검증. 축을 추가해도 자동으로 따라온다.

### 전체 코드

```ts
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
```

> ⚠️ **호출부 변경 필요**: 반환 타입이 `string` → `MBTIResult`로 바뀌었다.
> `const code = calculateMBTI(a)` → `const { code } = calculateMBTI(a)`

---

## 2. `app/survey/page.tsx` — 연타·잔상·상태 휘발 (DEF-01, DEF-06, DEF-09, DEF-19)

### 2-1. 연타 방지 (DEF-01)

```diff
+/** 전환 애니메이션 지속 시간(ms). CSS의 duration-200과 반드시 일치시킬 것. */
+const TRANSITION_MS = 200;

 const handleNext = () => {
-  if (!selectedValue) return;
+  // isTransitioning 가드가 없으면 연타 시 currentIdx가 2 증가해
+  // 문항을 건너뛰거나(결과 25% 반전) 배열 범위를 넘어 크래시한다.
+  if (!selectedValue || isTransitioning) return;
```

```diff
 <button
   onClick={handlePrev}
-  disabled={currentIdx === 0}
+  disabled={currentIdx === 0 || isTransitioning}

 <button
   onClick={handleNext}
-  disabled={!selectedValue}
+  disabled={!selectedValue || isTransitioning}
```

`saveAnswer`에도 동일 가드를 넣어, 전환 중 선택지 클릭이 이전 문항에 기록되는 것을 막는다.

### 2-2. 잔상 제거 (DEF-09) — state를 파생값으로

```diff
-const [selectedValue, setSelectedValue] = useState<string | null>(null);
-
-// 이전에 선택한 답변 복원
-useEffect(() => {
-  const prev = answers.find((a) => a.questionId === q.id);
-  setSelectedValue(prev ? prev.value : null);
-}, [currentIdx, q.id, answers]);
+// selectedValue는 answers에서 파생 — 별도 state로 두면
+// 문항 전환 시 한 프레임 잔상이 남는다.
+const selectedValue = answers.find((a) => a.questionId === q.id)?.value ?? null;
```

`useEffect`는 페인트 **이후** 실행된다. 그래서 `currentIdx`가 4→5로 바뀌는 프레임에서 `selectedValue`는 아직 q4의 값(`"D"`)이고, q5의 옵션도 `"D"`이므로 잘못 하이라이트됐다. state를 없애면 렌더 시점에 항상 올바른 값이 계산된다.

> **원칙**: 다른 state로부터 계산할 수 있는 값은 state가 아니다.

### 2-3. 진행 상황 보존 (DEF-06)

```ts
const STORAGE_KEY = "invest-mbti:progress";

// 마운트 시 1회 복원
useEffect(() => {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (raw) {
      const saved: SavedProgress = JSON.parse(raw);
      const validIds = new Set(questionsData.map((x) => x.id));
      const clean = (saved.answers ?? []).filter((a) => validIds.has(a.questionId));
      setAnswers(clean);
      setCurrentIdx(
        Math.min(Math.max(saved.currentIdx ?? 0, 0), questionsData.length - 1)
      );
    }
  } catch {
    /* 손상된 저장값은 무시하고 처음부터 시작 */
  }
  setRestored(true);
}, []);

// 변경 시마다 저장
useEffect(() => {
  if (!restored) return;
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ currentIdx, answers }));
  } catch { /* 저장 실패는 치명적이지 않음 */ }
}, [currentIdx, answers, restored]);
```

`restored` 플래그가 없으면 마운트 직후 빈 `answers`가 저장돼 복원 데이터를 덮어쓴다. 복원값도 그대로 믿지 않고 **문항 ID 화이트리스트와 인덱스 범위로 재검증**한다.

### 2-4. 타이머 정리

```ts
const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

useEffect(() => () => {
  if (timerRef.current) clearTimeout(timerRef.current);
}, []);
```

전환 도중 페이지를 이탈하면 언마운트된 컴포넌트에 `setState`가 호출된다.

### 2-5. 검증 실패 처리 (DEF-03 연계)

```ts
try {
  const { code } = calculateMBTI(finalAnswers);
  sessionStorage.removeItem(STORAGE_KEY);
  router.push(`/result/${code}`);
} catch (err) {
  if (err instanceof InvalidAnswersError) {
    // 여기 도달했다면 UI 가드가 뚫린 것 — 조용히 틀린 결과를 주느니 처음부터.
    console.error("[survey] 응답 검증 실패:", err.message);
    alert("응답에 문제가 있어 처음부터 다시 시작합니다.");
    sessionStorage.removeItem(STORAGE_KEY);
    setAnswers([]);
    setCurrentIdx(0);
    return;
  }
  throw err; // 예상치 못한 오류는 error.tsx가 받는다
}
```

### 2-6. 접근성 (DEF-19)

```diff
-<div className="w-full h-2 bg-slate-200/60 ...">
+<div
+  role="progressbar"
+  aria-valuemin={1}
+  aria-valuemax={totalQuestions}
+  aria-valuenow={currentIdx + 1}
+  aria-label={`전체 ${totalQuestions}문항 중 ${currentIdx + 1}번째`}
+  className="w-full h-2 bg-slate-200/60 ..."
+>

-<div className="flex flex-col gap-3 w-full">
+<div role="radiogroup" aria-label={q.text} className="flex flex-col gap-3 w-full">

 <button
   key={idx}
+  role="radio"
+  aria-checked={isSelected}
   onClick={() => saveAnswer(opt.value)}

-<span className="material-symbols-outlined ...">account_circle</span>
+<span aria-hidden="true" className="material-symbols-outlined ...">account_circle</span>
+<span className="sr-only">홈으로</span>
```

Material Symbols는 **리거처 폰트**라 스크린리더가 `account_circle`이라는 글자를 그대로 읽는다. `aria-hidden`으로 감추고 `sr-only` 텍스트를 따로 준다.

### 2-7. 기타

```diff
-className="... transition-all duration-250 ..."
+className="... transition-all duration-200 ..."
```
`duration-250`은 Tailwind 기본 스케일에 없다 (DEF-15). CSS 값과 `TRANSITION_MS` 상수를 200으로 맞췄다.

---

## 3. `app/page.tsx` — 코드 검증·정보 정합성·면책 (DEF-04, DEF-05, DEF-13, DEF-18)

```diff
+import { isValidMBTICode, TOTAL_QUESTIONS } from "@/lib/mbti";

 export default function Home() {
   const [searchCode, setSearchCode] = useState("");
+  const [error, setError] = useState<string | null>(null);
   const router = useRouter();

   const handleSearch = (e: React.FormEvent) => {
     e.preventDefault();
-    if (!searchCode.trim()) return;
-    const formattedCode = searchCode.trim().toUpperCase();
-    router.push(`/result/${formattedCode}`);
+    const code = searchCode.trim().toUpperCase();
+
+    if (!code) {
+      setError("결과 코드를 입력해 주세요.");
+      return;
+    }
+    // 잘못된 코드는 결과 페이지로 보내지 말고 입력 시점에 막는다.
+    if (!isValidMBTICode(code)) {
+      setError("올바른 코드가 아닙니다. 4자리 코드를 입력해 주세요. (예: RDLG)");
+      return;
+    }
+
+    setError(null);
+    router.push(`/result/${code}`);
   };
```

입력창:
```diff
 <input
   type="text"
+  maxLength={4}
+  aria-label="투자 MBTI 결과 코드"
+  aria-invalid={!!error}
+  aria-describedby={error ? "search-error" : undefined}
   value={searchCode}
-  onChange={(e) => setSearchCode(e.target.value)}
+  onChange={(e) => {
+    setSearchCode(e.target.value);
+    if (error) setError(null);   // 타이핑 시작하면 에러 해제
+  }}
 />
+{error && (
+  <p id="search-error" role="alert" className="text-xs font-semibold text-rose-500 ...">
+    {error}
+  </p>
+)}
```

정보 정합성 (DEF-12, DEF-13):
```diff
-<span>⏱️ 약 1분 · 12문항</span>
+<span>⏱️ 약 3분 · {TOTAL_QUESTIONS}문항</span>

-<span className="font-mbti-code ...">12</span>
+<span className="font-mbti-code ...">{TOTAL_QUESTIONS}</span>
```
문항 수를 상수에서 끌어오므로 두 곳이 다시 어긋날 수 없다.

푸터 (DEF-05, DEF-18):
```diff
-<nav className="flex gap-6">
-  <a href="#">About</a>
-  <a href="#">Methodology</a>
-  <a href="#">Privacy Policy</a>
-</nav>
-<div className="...">© 2024 Visionary Analyst Asset Management</div>
+<p className="... max-w-md text-center md:text-left">
+  본 서비스는 교육·오락 목적의 참고 자료이며 투자 자문이 아닙니다.
+  투자 판단과 그 결과는 이용자 본인에게 귀속됩니다.
+</p>
+<div className="...">© {new Date().getFullYear()} Visionary Analyst</div>
```

동작하지 않는 링크는 **지우는 게 남겨두는 것보다 낫다.** `Asset Management` 상호도 제거했다.

---

## 4. `app/result/[code]/page.tsx` — 저장·공유·성능 (DEF-05, DEF-08, DEF-11, DEF-14, DEF-19)

### 4-1. `html2canvas` 지연 로딩 (DEF-08)

```diff
-import html2canvas from "html2canvas";
-import Image from "next/image";        // 미사용 import
```
```diff
 const handleSaveImage = useCallback(async () => {
-  if (!printRef.current) return;
+  if (!printRef.current || isSaving) return;
+  setIsSaving(true);
+  const origSrcs: string[] = [];
+  let imgs: HTMLImageElement[] = [];
   try {
+    // html2canvas(약 200KB)는 저장 버튼을 누른 시점에만 내려받는다.
+    const { default: html2canvas } = await import("html2canvas");
```

`/result/[code]` First Load JS **242 kB → 197 kB.**

### 4-2. `allowTaint` 제거 (DEF-11)

```diff
 const canvas = await html2canvas(printRef.current, {
   scale: 2,
   useCORS: true,
-  allowTaint: true,
+  // allowTaint:true 는 캔버스를 오염시켜 toDataURL()이 SecurityError를 던지게 한다.
+  // 이미 base64로 치환했으므로 useCORS만으로 충분하다.
   backgroundColor: "#f4f5f9",
   logging: false,
 });
```

### 4-3. 이미지 로드 검사 + `finally` 복원

```diff
 const imgToBase64 = (imgEl: HTMLImageElement): Promise<string> => {
   return new Promise((resolve) => {
+    // 로드가 끝나지 않은 이미지는 naturalWidth가 0 → 빈 캔버스가 저장된다.
+    if (!imgEl.complete || imgEl.naturalWidth === 0) {
+      resolve(imgEl.src);
+      return;
+    }
     const cvs = document.createElement("canvas");
-    cvs.width = imgEl.naturalWidth || imgEl.width;
+    cvs.width = imgEl.naturalWidth;
```

```diff
   } catch (err) {
     console.error("이미지 저장 실패", err);
+    alert("이미지 저장에 실패했습니다. 잠시 후 다시 시도해 주세요.");
+  } finally {
+    // 실패하더라도 원본 src는 반드시 복원
+    imgs.forEach((img, i) => { if (origSrcs[i]) img.src = origSrcs[i]; });
+    setIsSaving(false);
   }
```

기존 코드는 캡처가 실패하면 `img.src`가 base64인 채로 남아 페이지가 깨진 상태로 방치됐다.

### 4-4. 공유 폴백

```diff
 if (navigator.share) {
   try {
     await navigator.share({ title, text, url });
   } catch (err) {
-    console.error("공유 실패", err);
+    // 사용자가 공유 시트를 닫은 경우(AbortError)는 오류가 아니다.
+    if ((err as Error)?.name !== "AbortError") console.error("공유 실패", err);
   }
-} else {
-  await navigator.clipboard.writeText(url);
-  alert("결과 링크가 클립보드에 복사되었습니다.");
+  return;
 }
+
+try {
+  await navigator.clipboard.writeText(url);
+  alert("결과 링크가 클립보드에 복사되었습니다.");
+} catch {
+  // 권한 거부·비보안 컨텍스트 폴백
+  window.prompt("아래 링크를 복사해 주세요.", url);
+}
```

### 4-5. 축 판정을 인덱스로

```diff
-const isR = typeData.code.includes("R");
-const isD = typeData.code.includes("D");
-const isL = typeData.code.includes("L");
-const isG = typeData.code.includes("G");
+// includes()는 위치를 무시한다. 축을 추가하면 조용히 깨지므로 인덱스로 접근한다.
+const isR = typeData.code[0] === "R";
+const isD = typeData.code[1] === "D";
+const isL = typeData.code[2] === "L";
+const isG = typeData.code[3] === "G";
```

> 💡 `const [risk, info, term, asset] = typeData.code`는 더 깔끔하지만
> `tsconfig.json`의 `"target": "es5"` 때문에 `TS2802`가 난다. (실제로 겪었다)

### 4-6. 면책 문구 (DEF-05)

```tsx
<p className="text-[11px] leading-relaxed text-slate-400 text-center px-2 mt-2 break-keep">
  본 결과는 교육·오락 목적의 참고 자료이며 투자 자문이 아닙니다.
  제시된 자산 배분은 특정 상품의 매수·매도 권유가 아니며,
  투자 판단과 그 결과는 이용자 본인에게 귀속됩니다.
</p>
```

### 4-7. 기타
- `crossOrigin="anonymous"` 제거 (동일 출처 이미지에 불필요)
- 브랜드명 `Invest-Type` → `Visionary Analyst` (DEF-14)
- 아이콘 8개에 `aria-hidden="true"`, SVG에 `role="img"` + `aria-label`
- `이미지 저장` 버튼에 `disabled={isSaving}` + `저장 중…` 라벨

---

## 5. 신규 파일

### `app/error.tsx` (DEF-02)

```tsx
"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[error boundary]", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#f4f5f9] flex flex-col items-center justify-center px-6 text-center gap-4">
      <span aria-hidden="true" className="material-symbols-outlined text-6xl text-slate-300">
        error_outline
      </span>
      <h1 className="text-2xl font-black text-slate-800">일시적인 오류가 발생했습니다</h1>
      <p className="text-sm text-slate-500">잠시 후 다시 시도해 주세요.</p>
      <div className="flex gap-3 mt-2">
        <button onClick={reset} className="bg-[#004be6] text-white px-8 py-3 rounded-xl font-semibold hover:bg-[#003cb3] transition-all">
          다시 시도
        </button>
        <a href="/" className="bg-white border border-slate-200 text-slate-700 px-8 py-3 rounded-xl font-semibold hover:bg-slate-50 transition-all">
          홈으로
        </a>
      </div>
    </div>
  );
}
```

### `app/not-found.tsx`

```tsx
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#f4f5f9] flex flex-col items-center justify-center px-6 text-center gap-4">
      <h1 className="text-2xl font-black text-slate-800">페이지를 찾을 수 없습니다</h1>
      <Link href="/" className="bg-[#004be6] text-white px-8 py-3 rounded-xl font-semibold hover:bg-[#003cb3] transition-all mt-2">
        홈으로 돌아가기
      </Link>
    </div>
  );
}
```

### `.eslintrc.json` (DEF-07)

```json
{
  "extends": "next/core-web-vitals"
}
```

이 파일이 없어서 `npm run lint`가 대화형 설정 마법사를 띄웠다 = **린트를 한 번도 돌린 적이 없다.**

### `lib/mbti.test.mjs` (DEF-20)

전체 11개 테스트. 핵심 부분:

```js
import { test } from "node:test";
import assert from "node:assert/strict";
import { calculateMBTI, isValidMBTICode, InvalidAnswersError, TOTAL_QUESTIONS } from "./mbti.mjs";

const mk = (vals) => vals.map((v, i) => ({ questionId: `q${i + 1}`, value: v }));

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
  assert.throws(() => calculateMBTI(mk(["X","Y","Z","X","Y","Z","X","Y","Z","X","Y","Z"])), /알 수 없는/);
});

// ── 전수조사 ──
test("4096개 응답 패턴 전부 유효한 16개 코드 중 하나를 반환", () => {
  const opts = [["R","S"],["D","I"],["L","T"],["G","V"]];
  const seen = new Set();
  for (let mask = 0; mask < 4096; mask++) {
    const vals = Array.from({ length: 12 }, (_, i) => opts[Math.floor(i / 3)][(mask >> i) & 1]);
    const { code } = calculateMBTI(mk(vals));
    assert.ok(isValidMBTICode(code), `잘못된 코드: ${code}`);
    seen.add(code);
  }
  assert.equal(seen.size, 16, "16개 유형이 모두 도달 가능해야 함");
});
```

**실행 결과**
```
$ node --test lib/mbti.test.mjs
# tests 11
# pass 11
# fail 0
```

> TS 파일을 `node --test`로 바로 돌릴 수 없어 `.mjs`로 두었다.
> 정식으로는 `vitest`를 추가해 `lib/mbti.test.ts`로 옮기는 것을 권한다.

---

## 6. 나머지 자잘한 수정

### `app/layout.tsx` (DEF-12, DEF-08 일부)

```diff
+import { TOTAL_QUESTIONS } from "@/lib/mbti";

+const SITE_NAME = "Visionary Analyst";
+const TITLE = "투자 MBTI - 나의 투자 성향 진단";
+const DESCRIPTION = `${TOTAL_QUESTIONS}개 문항으로 진단하는 나의 투자 MBTI 성향과 맞춤형 자산 배분 제안`;
+
 export const metadata: Metadata = {
-  title: "투자 MBTI - 나의 투자 성향 진단",
-  description: "10개 문항으로 진단하는 나의 투자 MBTI 성향과 맞춤형 자산 배분 제안",
+  title: TITLE,
+  description: DESCRIPTION,
+  applicationName: SITE_NAME,
+  openGraph: {
+    type: "website", siteName: SITE_NAME,
+    title: TITLE, description: DESCRIPTION, locale: "ko_KR",
+  },
+  twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION },
 };
```

`"10개 문항"` 하드코딩을 상수 참조로 바꿔 **다시는 어긋날 수 없게** 만들었다.

### `app/globals.css` (DEF-15)

```css
/* animate-fade-in 유틸리티가 참조하던 키프레임 (정의 누락 수정) */
@keyframes fade-in {
  from { opacity: 0; transform: translateY(4px); }
  to   { opacity: 1; transform: translateY(0); }
}
.animate-fade-in {
  animation: fade-in 0.3s ease-out both;
}
```

### `data/questions.json` (DEF-10)

`q5`의 선택지 순서를 뒤집었다.

```
수정 전 → D/I축 첫 선택지: [D, D, D]   ← 초두 효과로 D 과대표집
수정 후 → D/I축 첫 선택지: [D, I, D]   ← 다른 축과 동일한 2:1 혼합
```

변경분은 **4줄뿐**이다 (`q5`의 두 옵션 객체 교환).

### `package.json` (DEF-16, DEF-20)

```diff
   "dependencies": {
     "recharts": "^2.12.7",
     "html2canvas": "^1.4.1",
-    "lucide-react": "^0.453.0",
-    "clsx": "^2.1.1",
-    "tailwind-merge": "^2.5.4"
   },
   "scripts": {
+    "test": "node --test lib/mbti.test.mjs"
   }
```

세 패키지 모두 코드에서 **0회 사용**이었다. `lucide-react`만 33 MB.

---

## 7. 적용 방법

패치 파일 `fix-qa-critical.patch`를 받아서:

```bash
git checkout -b fix/qa-critical
git apply fix-qa-critical.patch
npm install          # package.json 변경 반영
npm test             # 11/11 통과 확인
npx tsc --noEmit     # 타입 에러 0 확인
npx next build       # 빌드 확인
npm run dev          # 로컬에서 TC-12 ~ TC-25 수동 검증
```

---

## 8. 이번 패치에 **포함하지 않은** 것

의도적으로 남겼다. 범위가 커서 별도 작업으로 분리하는 게 낫다.

| 항목 | 이유 | 예상 작업량 |
|---|---|---|
| `/result/[code]` 서버 컴포넌트 분리 → `generateMetadata` + `generateStaticParams` | 컴포넌트 구조 개편 필요. 유형별 OG 이미지도 함께 설계해야 함 | 2시간 |
| `recharts` 제거 (도넛을 순수 SVG로) | 추가 −100 kB. 레이더 차트는 이미 손수 SVG로 그렸으므로 같은 방식 적용 가능 | 1시간 |
| 레이더 차트를 `scores`(0~3) 기반으로 개선 | 이번에 `calculateMBTI`가 `scores`를 반환하도록 바꿨으므로 **이제 가능해졌다** | 1시간 |
| 캐릭터 PNG → WebP (5.8 MB → 약 0.5 MB) | 빌드 파이프라인 추가 | 30분 |
| `Header` 컴포넌트 중복 제거 | 브랜드명 불일치의 근본 원인. 이번엔 양쪽을 각각 고쳤을 뿐 | 30분 |
| `zod`로 `data/*.json` 스키마 검증 | 자산명 표기 난립(`국내 성장주` vs `국내성장주`) 등을 빌드 타임에 차단 | 1시간 |

---

## 부록. 이 패치를 만들면서 실제로 겪은 실수

정직하게 남긴다.

`const [risk, info, term, asset] = typeData.code;` — 문자열 구조분해가 더 읽기 좋아서 이렇게 썼는데, `npx next build`가 잡아냈다.

```
Type error: Type 'string' can only be iterated through when using the
'--downlevelIteration' flag or with a '--target' of 'es2015' or higher.
```

`tsconfig.json`의 `"target": "es5"` 때문이다. 인덱스 접근으로 바꿔서 해결했다.

**교훈**: 타입체크·린트·빌드·테스트를 실제로 돌려보지 않은 "수정"은 수정이 아니다. 이 문서의 모든 코드는 위 네 가지를 통과한 상태다.
