# 투자 MBTI — 코드 리뷰 결함 리포트

- **저장소**: `seungmmin714/aipbl-` (Next.js 14.2.15 App Router)
- **리뷰 범위**: `app/`, `lib/`, `data/`, `tailwind.config.ts`, `app/globals.css`
- **작성일**: 2026-07-09
- **결함 총계**: Critical 2 / High 3 / Medium 8 / Low 7

---

## ✅ 먼저, 잘 된 부분

자동 검증 스크립트로 데이터 정합성을 확인한 결과 **결함 없음**:

- `data/questions.json` — 12문항, 각 축당 정확히 3문항, 모든 문항 선택지 2개
- `data/mbti-types.json` — 16개 유형 전수 존재, 중복 없음, 누락 없음
- 모든 유형의 `allocation` 합계 = 100%
- 모든 `image` 경로에 실제 파일 존재 (`public/images/animals/*.png` 16개)
- 모든 유형의 `features` 3개, 필수 필드 누락 없음

또한 축 문자를 `R/S`, `D/I`, `L/T`, `G/V`로 **서로 겹치지 않게** 설계한 덕분에 `calculateMBTI`의 전역 카운트 방식이 우연이 아니라 논리적으로 성립한다. 축당 3문항(홀수)이라 동점도 원천 차단된다. 설계 자체는 견고하다.

문제는 **방어 코드**와 **상태 관리**, 그리고 **공유·검색 인프라**에 몰려 있다.

---

## 🔴 Critical

### C-01. `다음` 버튼 연타 시 문항 건너뜀 → 마지막 구간에서 크래시

**위치**: `app/survey/page.tsx` L34–51, L173–184

```ts
const handleNext = () => {
  if (!selectedValue) return;
  if (currentIdx < totalQuestions - 1) {
    setDirection("next");
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentIdx((prev) => prev + 1);
      setIsTransitioning(false);
    }, 250);
  } else { /* 결과 계산 */ }
};
```

**원인**: `currentIdx` 증가가 250ms 지연되는데, 그 사이 버튼은 활성 상태이고 `selectedValue`도 유지된다. 유일한 가드 `if (!selectedValue) return`을 두 번째 클릭도 통과한다.

**재현 (크래시)**
| 단계 | 동작 | `currentIdx` |
|---|---|---|
| 1 | Q11(idx 10) 선택 후 `다음` 클릭 | 10 (타이머 A 예약) |
| 2 | 250ms 이내 재클릭 → `10 < 11` 참 | 10 (타이머 B 예약) |
| 3 | 타이머 A 발동 | 11 |
| 4 | 타이머 B 발동 | **12** |
| 5 | L18 `questionsData[12]` → `undefined` | — |
| 6 | L118 `{q.text}` → `TypeError` | **흰 화면** |

**재현 (조용한 오답)**: 중간 문항에서 연타 → 문항 1개 스킵 → 답변 11개로 결과 산출 (C-01 → H-01 연쇄)

**수정**
```ts
const handleNext = () => {
  if (!selectedValue || isTransitioning) return;
  ...
};

<button disabled={!selectedValue || isTransitioning}>
```
추가로 `handlePrev`에도 동일 가드, 마지막 문항의 `router.push` 중복 호출 방지 필요.

---

### C-02. 에러 바운더리 부재 → 크래시 시 빈 화면

**위치**: `app/error.tsx`, `app/not-found.tsx`, `app/global-error.tsx` 모두 없음

C-01이 터지면 사용자는 아무 안내 없이 백지를 본다. App Router는 `error.tsx`를 두면 자동으로 클라이언트 에러를 잡아준다.

```tsx
// app/error.tsx
"use client";
export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4">
      <p>일시적인 오류가 발생했습니다.</p>
      <button onClick={reset}>다시 시도</button>
    </div>
  );
}
```

---

## 🟠 High

### H-01. `calculateMBTI`에 입력 검증 없음 → 잘못된 결과를 조용히 반환

**위치**: `lib/mbti.ts` L17–50

```ts
const axis1 = R >= 2 ? "R" : "S";
```

`answers`가 12개인지, 각 축에 3개씩 들어왔는지, 중복 문항이 없는지 **아무것도 검사하지 않는다.**

- 답변 3개만 전달 → `R=D=L=G=0` → `"SITV"` 반환. 에러 없음.
- 즉 **모든 결손 데이터가 최보수 유형으로 수렴**한다.
- C-01로 문항이 스킵되면 사용자는 자기 답과 다른 결과를 받고도 알 수 없다.

**수정**
```ts
export function calculateMBTI(answers: Answer[]): string {
  if (answers.length !== 12)
    throw new Error(`답변 12개가 필요합니다. 받은 개수: ${answers.length}`);
  if (new Set(answers.map(a => a.questionId)).size !== 12)
    throw new Error("중복된 문항 응답이 있습니다.");
  const allowed = new Set(["R","S","D","I","L","T","G","V"]);
  if (answers.some(a => !allowed.has(a.value)))
    throw new Error("알 수 없는 응답 값이 있습니다.");
  ...
}
```

### H-02. `isValidMBTICode()`가 정의만 되고 어디서도 호출되지 않음

**위치**: `lib/mbti.ts` L55–63 (정의) / `app/page.tsx` L11–20 (호출돼야 할 곳)

```ts
const handleSearch = (e: React.FormEvent) => {
  e.preventDefault();
  if (!searchCode.trim()) return;
  const formattedCode = searchCode.trim().toUpperCase();
  router.push(`/result/${formattedCode}`);   // 검증 없이 라우팅
};
```

- 임의 문자열 입력 → `/result/ㅁㄴㅇㄹ` 로 이동 → 결과 페이지에서야 "찾을 수 없음"
- 입력 길이 제한이 없어 수천 자 URL 생성 가능
- 잘못된 코드 입력 시 **입력창에 인라인 에러가 뜨는 게 정상 UX**

> 결과 페이지 L104 `&quot;{code}&quot;` 는 React가 자동 이스케이프하므로 XSS는 아니다. 다만 사용자 입력을 그대로 화면에 반영하므로 길이 제한은 필요.

**수정**
```ts
import { isValidMBTICode } from "@/lib/mbti";

const code = searchCode.trim().toUpperCase();
if (!isValidMBTICode(code)) {
  setError("올바른 코드가 아닙니다. (예: RDLG)");
  return;
}
router.push(`/result/${code}`);
```
+ `<input maxLength={4} />`

### H-03. 투자 자문 면책 문구 부재

**위치**: `app/result/[code]/page.tsx` (자산배분 % 제시), `app/page.tsx` L148 (`© 2024 Visionary Analyst Asset Management`)

구체적 자산배분 비율을 제시하면서 푸터에 실존 자산운용사처럼 보이는 상호를 쓰고 있다. 결과 페이지 하단에 명시 필요:

> 본 결과는 교육·오락 목적의 참고 자료이며 투자 자문이 아닙니다. 투자 판단과 그 결과는 이용자 본인에게 귀속됩니다.

---

## 🟡 Medium

### M-01. 상태 휘발 — 새로고침·뒤로가기 시 답변 전량 소실

**위치**: `app/survey/page.tsx` L11–12

`useState`만 사용. 문항 이동이 라우팅이 아니라 상태 변경이므로:
- F5 → `currentIdx=0`, `answers=[]` 로 초기화, 안내 없음
- 브라우저 뒤로가기 → 설문 전체를 벗어나 랜딩으로 이탈

**개선**: `sessionStorage` 백업, 또는 `/survey?q=7` 쿼리스트링으로 문항 인덱스 이관 (뒤로가기가 문항 이동으로 동작)

### M-02. 결과 페이지가 `"use client"` → OG 태그·SEO 전무

**위치**: `app/result/[code]/page.tsx` L1

- 클라이언트 컴포넌트라 `generateMetadata()`를 쓸 수 없다 → 유형별 제목·설명·썸네일 없음
- `generateStaticParams()`도 없어 16개 유형이 정적 생성되지 않음
- 카카오톡·인스타에 결과 링크를 붙이면 **미리보기 카드가 안 뜬다.** MBTI 서비스의 주 유입 경로가 막힌 셈

**개선**: 서버 컴포넌트를 껍데기로 두고 인터랙션(차트·저장·공유) 부분만 클라이언트 컴포넌트로 분리
```tsx
export async function generateStaticParams() {
  return mbtiTypes.map(t => ({ code: t.code }));
}
export async function generateMetadata({ params }) {
  const t = mbtiTypes.find(x => x.code === params.code.toUpperCase());
  return { title: `${t.nickname} — 투자 MBTI ${t.code}`, openGraph: { images: [t.image] } };
}
```

### M-03. `layout.tsx` 메타 설명의 문항 수 오기

**위치**: `app/layout.tsx` L9 — `"10개 문항으로 진단하는..."` / 실제 `questions.json`은 12문항

### M-04. 소요시간 표기 충돌

**위치**: `app/page.tsx` L63 `약 1분` ↔ L118 `3m (Est. Time)`

### M-05. 브랜드명 불일치

`app/page.tsx` `Visionary Analyst` ↔ `survey/page.tsx` L73 / `result/page.tsx` L142 `Invest-Type`

### M-06. 레이더 차트가 정보를 버림

**위치**: `app/result/[code]/page.tsx` L121–131

```ts
const isR = typeData.code.includes("R");
const yTop = isR ? 35 : 75;
```

축당 좌표가 **두 값 중 하나**뿐이다. 3:0으로 압도한 사람과 2:1로 겨우 넘긴 사람이 완전히 같은 그래프를 본다. "성향 분석"이라는 제목에 비해 담긴 정보가 코드 4글자와 동일하다.

근본 원인은 `calculateMBTI`가 **카운트를 버리고 코드만 반환**하는 것. 카운트를 함께 반환하면 축당 0~3 스케일의 진짜 레이더 차트를 그릴 수 있다.

```ts
export function calculateMBTI(answers: Answer[]): { code: string; scores: Record<string, number> }
```

부수적으로 `code.includes("R")`은 **위치를 무시한 문자 검색**이다. 지금은 축 문자가 안 겹쳐서 우연히 맞지만, 축을 추가하면 즉시 깨진다. `code[0] === "R"` 로 바꿔야 한다.

### M-07. `imgToBase64` — 이미지 로드 완료 검사 없음

**위치**: `app/result/[code]/page.tsx` L20–33

```ts
cvs.width = imgEl.naturalWidth || imgEl.width;
```
이미지가 아직 로드되지 않았으면 `naturalWidth === 0` → 0×0 캔버스 → 빈 이미지 저장. 또한 이 Promise는 **절대 reject하지 않으므로** L43의 `try/catch`가 무의미하다.

```ts
if (!imgEl.complete || imgEl.naturalWidth === 0) return imgEl.src;
```

### M-08. `handleShare` — 클립보드 실패 처리 없음

**위치**: `app/result/[code]/page.tsx` L84–87

```ts
await navigator.clipboard.writeText(url);
alert("결과 링크가 클립보드에 복사되었습니다.");
```
권한 거부·비보안 컨텍스트에서 reject → `alert`도 안 뜨고 콘솔에 unhandled rejection만 남는다. `try/catch` + 실패 시 URL 텍스트 노출 폴백 필요.

---

## 🟢 Low

| ID | 위치 | 내용 |
|---|---|---|
| L-01 | `result/[code]/page.tsx` L5 | `import Image from "next/image"` 후 미사용. 실제로는 `<img>` 사용 → ESLint `@next/next/no-img-element` 경고 |
| L-02 | `survey/page.tsx` L108 | `duration-250`은 Tailwind 기본 스케일에 없는 클래스(100/150/200/300/500/700/1000). config에도 미확장 → **적용 안 됨**. `setTimeout(250)`과 CSS 전환 시간이 어긋난다 |
| L-03 | `survey/page.tsx` L75, `result` L144 | `help_outline` 아이콘이 클릭 불가한 장식. `account_circle`이 홈 링크 — 계정 아이콘인데 홈으로 감 (의미 불일치) |
| L-04 | 전 페이지 | 아이콘 `<span>`에 `aria-hidden="true"` 없음 → 스크린리더가 "account_circle"을 그대로 읽음 |
| L-05 | `survey/page.tsx` L126–161, L96–103 | 선택지에 `role="radiogroup"`/`aria-checked` 없음. 진행바에 `role="progressbar"`·`aria-valuenow` 없음. 문항 전환 시 `aria-live` 안내 없음 |
| L-06 | `tailwind.config.ts` L11–63 | 색상 토큰 약 50개가 **다크 테마 기준**(`background: #10131a`)인데 `globals.css`의 실제 body는 `#f4f5f9` 라이트. 대부분 미사용 죽은 토큰 |
| L-07 | `globals.css` L1–2 + `layout.tsx` L5 | `@import url(fonts.googleapis.com...)`는 렌더 블로킹. 게다가 `layout.tsx`가 `next/font`로 Inter를 또 로드 → **Inter 중복 로드** |
| L-08 | `app/page.tsx` L137–143 | 푸터 링크 3개 모두 `href="#"` (더미) |
| L-09 | `app/page.tsx` L148 | `© 2024` — 연도 하드코딩 |
| L-10 | `result/[code]/page.tsx` L203–232 | SVG 레이더 차트에 `<title>`/`aria-label` 없음 |

---

## 수정 우선순위

| 순위 | 항목 | 근거 |
|---|---|---|
| 1 | **C-01 + C-02** | 실제 크래시. 워크숍 시연 중 터지면 즉시 노출됨. 수정은 조건문 한 줄 |
| 2 | **H-01 + H-02** | 결과가 조용히 틀어지는 버그. 진단 서비스의 신뢰도 자체 |
| 3 | **H-03** | 법적 리스크. 문구 한 줄 |
| 4 | **M-01** | 이탈률 직결 (11문항 풀고 날아가면 재도전 안 함) |
| 5 | **M-02** | 공유 썸네일. MBTI 서비스 성장의 핵심 |
| 6 | M-03~M-05 | 정보 정합성 (문항 수·시간·브랜드명) |
| 7 | M-06 | 차트 개선. 사실상 신규 기능이므로 여유 있을 때 |
| 8 | Low 전체 | 코드 위생·접근성 |

---

## 부록: 즉시 적용 가능한 패치 3종

### 1) `app/survey/page.tsx` — 연타 방지
```diff
  const handleNext = () => {
-   if (!selectedValue) return;
+   if (!selectedValue || isTransitioning) return;

  const handlePrev = () => {
-   if (currentIdx > 0) {
+   if (currentIdx > 0 && !isTransitioning) {

-   disabled={!selectedValue}
+   disabled={!selectedValue || isTransitioning}
```

### 2) `lib/mbti.ts` — 입력 검증
```diff
  export function calculateMBTI(answers: Answer[]): string {
+   if (answers.length !== 12)
+     throw new Error(`답변 12개 필요. 받은 개수: ${answers.length}`);
+   if (new Set(answers.map((a) => a.questionId)).size !== 12)
+     throw new Error("중복 문항 응답");
```

### 3) `app/page.tsx` — 코드 검증
```diff
+ import { isValidMBTICode } from "@/lib/mbti";

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchCode.trim()) return;
    const formattedCode = searchCode.trim().toUpperCase();
+   if (!isValidMBTICode(formattedCode)) {
+     setError("올바른 코드가 아닙니다. (예: RDLG)");
+     return;
+   }
    router.push(`/result/${formattedCode}`);
  };
```
