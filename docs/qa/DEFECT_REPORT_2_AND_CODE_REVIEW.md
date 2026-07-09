# 투자 MBTI — 2차 심화 결함 리포트 & 코드 리뷰

- **저장소**: `seungmmin714/aipbl-` @ `a7ef550`
- **검증 방식**: 의존성 설치 → `tsc --noEmit` → `next lint` → `next build` → 채점 로직 전수조사
- **작성일**: 2026-07-09
- **1차 리포트 대비 신규 결함**: 16건

---

## Part 1. 실행 검증 결과

| 검사 | 결과 |
|---|---|
| `npx tsc --noEmit` | ✅ 통과 (타입 에러 0) |
| `npx next build` | ✅ 컴파일 성공 |
| `npx next lint` | ⚠️ **설정 파일 부재로 실행 불가** (아래 N-01) |
| 데이터 정합성 (16유형/allocation/이미지) | ✅ 통과 |
| 문항-축 의미 매핑 12개 | ✅ 전부 정확 |

빌드 산출물:
```
Route (app)                Size       First Load JS
┌ ○ /                      2.1 kB     96.2 kB
├ ○ /_not-found            873 B      88.1 kB
├ ƒ /result/[code]         148 kB     242 kB     ← 문제
└ ○ /survey                4.37 kB    98.5 kB
```

---

## Part 2. 신규 결함

### 🔴 N-01. ESLint 설정 파일이 저장소에 없음

`package.json`에 `eslint`, `eslint-config-next`가 있지만 `.eslintrc.json` / `eslint.config.mjs`가 **없다.** `npm run lint` 실행 시 대화형 설정 마법사가 뜬다 = **한 번도 린트를 돌린 적이 없다.**

설정을 넣고 돌리자 즉시 경고 검출:
```
./app/result/[code]/page.tsx
170:13  Warning: Using `<img>` could result in slower LCP...  @next/next/no-img-element
```

**수정**: `.eslintrc.json` 추가 → `{"extends": "next/core-web-vitals"}`

---

### 🔴 N-02. 문항 스킵 시 결과가 뒤집힐 확률 — 전수조사 25.0%

1차 리포트 C-01(연타로 문항 스킵)의 실제 영향도를 측정했다.

```
4096개 응답 패턴 × 12개 스킵 위치 = 49,152건
→ 12,288건 (정확히 25.0%) 에서 최종 코드가 달라짐
```

**뒤집히는 조건**: 해당 축이 2:1 접전 + 스킵된 문항이 우세한 쪽일 때.
3:0 축은 문항 하나가 빠져도 `>= 2` 조건을 만족하므로 결과가 같다 → **버그가 절반 이상의 경우 숨는다.**

```
전체 응답 [R,R,S | D,D,I | L,L,T | G,G,V]  →  RDLG   (정답)
q5(D) 스킵                                 →  RILG   (D→I 반전)
```

또한 `calculateMBTI`는 다음을 전부 에러 없이 삼킨다:

| 입력 | 반환 |
|---|---|
| `[]` (빈 배열) | `"SITV"` |
| `[{q1:"R"}]` (1개) | `"SITV"` |
| `["R"]×6` (중복 6개) | `"RITV"` |
| `["X","Y","Z"]×4` (쓰레기 값) | `"SITV"` |

결손·오염 데이터가 **전부 최보수 유형으로 조용히 수렴**한다.

---

### 🟠 N-03. 결과 페이지 First Load JS 242 kB + 정적 생성 미적용

**위치**: `app/result/[code]/page.tsx` L1, L7–8

- `ƒ (Dynamic)` — `generateStaticParams()` 부재로 16개 유형이 매 요청 서버 렌더링
- `recharts` 정적 import — **4조각 도넛 차트 하나**를 위해 라이브러리 전체 번들
- `html2canvas` 정적 import — `이미지 저장` 버튼을 누르지 않아도 항상 다운로드

레이더 차트(L203–232)는 이미 순수 SVG로 손수 그렸다. 도넛도 SVG `stroke-dasharray` 한 줄이면 되고, 그러면 recharts를 통째로 제거할 수 있다.

```ts
// html2canvas는 필요할 때만
const handleSaveImage = async () => {
  const { default: html2canvas } = await import("html2canvas");
  ...
};
```

---

### 🟠 N-04. 설문 문항 제시 순서에 편향(order bias)

**위치**: `data/questions.json`

| 축 | 첫 번째 선택지 배치 |
|---|---|
| R/S | `[R, S, R]` — 혼합 |
| **D/I** | **`[D, D, D]` — 3문항 전부 D가 위** |
| L/T | `[T, L, T]` — 혼합 |
| G/V | `[G, V, V]` — 혼합 |

초두 효과(primacy effect)로 응답자는 첫 항목을 선택하는 경향이 있다. D/I축만 3문항 모두 `데이터기반`이 위에 있어 **D 쪽으로 체계적 편향**이 발생한다. 다른 세 축은 2:1로 섞어놨는데 이 축만 놓쳤다.

**수정**: `q5` 또는 `q6`의 선택지 순서를 뒤집거나, 렌더링 시 문항 ID를 시드로 순서를 결정론적으로 섞는다.

---

### 🟡 N-05. 선택 하이라이트 잔상 (한 프레임 플래시)

**위치**: `app/survey/page.tsx` L13, L21–24

```ts
const [selectedValue, setSelectedValue] = useState<string | null>(null);
useEffect(() => {
  const prev = answers.find((a) => a.questionId === q.id);
  setSelectedValue(prev ? prev.value : null);
}, [currentIdx, q.id, answers]);
```

`useEffect`는 **페인트 이후**에 실행된다. `currentIdx`가 4→5로 바뀌는 프레임에서는 새 문항(q5)이 그려지는데 `selectedValue`는 아직 q4의 값(`"D"`)이다.

같은 축의 문항은 선택지 `value`를 공유하므로(`q4`,`q5`,`q6` 모두 `D`/`I`), **q5의 `D` 옵션이 한 프레임 동안 선택된 것처럼 파랗게 표시**된다. q5를 이미 `I`로 답해뒀다면 `D`가 반짝였다가 `I`로 튄다.

**수정**: state를 없애고 파생값으로.
```ts
const selectedValue = answers.find((a) => a.questionId === q.id)?.value ?? null;
```
`useEffect`와 `useState` 둘 다 삭제 가능. `saveAnswer`에서 `setSelectedValue` 호출도 불필요.

---

### 🟡 N-06. `animate-fade-in` — 정의되지 않은 클래스

**위치**: `app/result/[code]/page.tsx` L238

`globals.css`에도 `tailwind.config.ts` `keyframes`에도 `fade-in`이 없다. 클래스는 렌더링되지만 **아무 효과가 없다.**
`duration-250`(1차 L-02)과 동일한 유형의 결함 — AI가 생성한 코드에서 자주 나오는 "그럴듯하지만 존재하지 않는 유틸리티".

**전수 점검 결과**
| 클래스 | 정의 | 사용 |
|---|---|---|
| `.tech-bg` | ✅ | 1회 |
| `.text-glow` | ✅ | 1회 |
| `.glow-button` | ✅ | **0회 (죽은 CSS)** |
| `animate-fade-in` | ❌ | 1회 |
| `duration-250` | ❌ | 1회 |

---

### 🟡 N-07. 미사용 의존성 3개

```
lucide-react   (33 MB)  → 코드에서 0회 사용
clsx                    → 0회
tailwind-merge          → 0회
```
`package.json`에서 제거. 설치 시간과 `node_modules` 용량만 잡아먹는다.

---

### 🟡 N-08. 캐릭터 이미지 총 5.8 MB, 최대 498 KB

**위치**: `public/images/animals/*.png` (16개), `app/result/[code]/page.tsx` L170–176

```tsx
<img src={typeData.image} style={{ width: '200px', height: '200px' }} />
```
498 KB PNG를 받아서 **200×200 px로 축소 표시**한다. `next/image`를 쓰면 자동 리사이즈·WebP 변환되지만, html2canvas 캡처 때문에 raw `<img>`를 쓴 것으로 보인다.

**대안**: 빌드 시점에 이미지를 400×400 WebP로 사전 변환 (용량 90% 이상 감소 기대). `next/image`를 쓰되 `unoptimized` 없이도 html2canvas가 동작하도록 base64 변환 로직은 이미 있다.

---

### 🟡 N-09. `html2canvas` 옵션 모순 및 SVG 캡처 위험

**위치**: `app/result/[code]/page.tsx` L50–56

```ts
const canvas = await html2canvas(printRef.current, {
  useCORS: true,
  allowTaint: true,   // ← 이 둘은 함께 쓰면 안 됨
  ...
});
link.href = canvas.toDataURL("image/png");
```

`allowTaint: true`는 CORS 미허용 이미지를 캔버스에 그리되 캔버스를 **오염(taint)** 시킨다. 오염된 캔버스에 `toDataURL()`을 호출하면 `SecurityError`가 던져진다. 지금은 사전 base64 변환 덕에 우연히 동작할 뿐, `allowTaint`는 제거해야 한다.

또한 캡처 영역(`printRef`)에 **recharts가 생성한 SVG**와 손수 그린 레이더 SVG가 포함된다. html2canvas는 SVG 렌더링이 불안정한 것으로 알려져 있어, 저장된 이미지에서 차트가 비거나 깨질 수 있다. **실기기 검증 필요.**

부수: L175 `crossOrigin="anonymous"` — 동일 출처 이미지에는 불필요하며 일부 환경에서 오히려 로드 실패를 유발한다.

---

### 🟢 N-10 ~ N-16 (Low)

| ID | 위치 | 내용 |
|---|---|---|
| N-10 | `next.config.mjs` | 완전히 비어 있음. 보안 헤더(`headers()`), `images` 설정, `poweredByHeader: false` 등 미설정 |
| N-11 | 저장소 전체 | **테스트 코드 0개.** `calculateMBTI`는 부작용 없는 순수 함수로 테스트하기 가장 쉬운 대상인데 없다 |
| N-12 | `.gitignore` L36 | `/design-reference/`를 무시하도록 적었으나 **이미 커밋되어 추적 중** → gitignore 무효. `git rm -r --cached design-reference` 필요 |
| N-13 | `.gitignore` L33–34 | `tatus` (`git status` 오타로 생긴 파일), `copy_images.bat` 같은 개인 임시 항목이 남아 있음 |
| N-14 | `result/[code]` | `/result/rdlg` 와 `/result/RDLG` 가 서로 다른 URL로 동작 → 중복 콘텐츠. `canonical` 태그 없음 |
| N-15 | `data/mbti-types.json` | 자산명 표기 불일치: `국내 성장주` vs `국내성장주`, `해외성장주` vs `미국 주도 성장주`, `현금/CMA` vs `발행어음/CMA` vs `CMA/파킹통장`. 37종의 자산명이 난립 |
| N-16 | `result/[code]/page.tsx` L288–291 | 도넛 중앙 `Risk 7.5` — 척도(0~10?) 설명이 없다. 실제 `riskScore` 범위는 2.0~9.5 |

부수: `CHART_COLORS`는 6색인데 `allocation`은 14개 유형이 4항목, 2개 유형이 3항목 → 색상 2개는 영원히 미사용.

---

## Part 3. 코드 리뷰 (아키텍처·설계)

### 잘 된 부분 — 그대로 유지할 것

**1. 축 문자를 비충돌로 설계했다.**
`R/S`, `D/I`, `L/T`, `G/V` — 8글자가 전부 다르다. 덕분에 `calculateMBTI`가 위치를 무시하고 전역 카운트를 해도 정확히 동작한다. 우연이 아니라 의도된 설계로 보인다.

**2. 축당 3문항(홀수)으로 동점을 원천 차단했다.**
`lib/mbti.ts` 주석에도 명시돼 있다. 짝수였다면 타이브레이커 규칙이라는 골치 아픈 문제가 생겼을 것이다.

**3. 데이터와 로직을 분리했다.**
`data/questions.json`, `data/axes.json`, `data/mbti-types.json`. 문항을 바꾸는 데 코드 수정이 필요 없다. 정합성 검증 스크립트를 돌려보니 16유형 전수 존재, allocation 합계 100%, 이미지 경로 전부 유효 — **데이터 품질이 매우 좋다.**

**4. `calculateMBTI`가 순수 함수다.** React에 의존하지 않아 단위 테스트가 즉시 가능하다.

**5. 디자인 레퍼런스를 저장소에 남겼다.** `design-reference/*/DESIGN.md` + `screen.png` + `code.html`. AI 협업 워크플로의 흔적이 잘 보인다.

---

### 개선할 부분

#### R-01. 상태를 저장하지 말고 파생하라

`survey/page.tsx`의 `selectedValue`는 `answers`와 `currentIdx`로부터 100% 결정된다. 그런데 별도 state로 들고 `useEffect`로 동기화하고 있다. 이것이 N-05(플래시)의 직접 원인이다.

> **원칙**: 다른 state로부터 계산할 수 있는 값은 state가 아니다.

`isTransitioning`, `direction`도 마찬가지로 애니메이션 전용이라면 CSS `key` prop 교체로 대체 가능하다.

#### R-02. 341줄짜리 단일 컴포넌트

`app/result/[code]/page.tsx`는 이미지 변환, 캡처, 공유, 레이더 차트, 도넛 차트, 4개 카드 레이아웃을 한 함수에 담고 있다.

```
ResultPage (341줄)
 ├─ imgToBase64        → lib/image.ts
 ├─ handleSaveImage    → hooks/useSaveImage.ts
 ├─ handleShare        → hooks/useShare.ts
 ├─ RadarChart         → components/RadarChart.tsx
 ├─ AllocationDonut    → components/AllocationDonut.tsx
 └─ TypeCard / FeatureList / Header
```

특히 `Header`(로고 + 두 아이콘)는 `survey/page.tsx`와 **완전히 중복**돼 있다. 한 곳만 고치면 다른 쪽이 어긋난다 — 실제로 1차 리포트의 브랜드명 불일치가 이렇게 생겼다.

#### R-03. 서버/클라이언트 경계를 잘못 그었다

세 페이지 모두 최상단이 `"use client"`다. 하지만 실제로 클라이언트가 필요한 건:

| 페이지 | 클라이언트가 필요한 부분 |
|---|---|
| `/` | 검색 입력창 하나 |
| `/survey` | 전체 (인터랙션) |
| `/result/[code]` | 저장·공유 버튼, 도넛 차트 |

`/`와 `/result/[code]`는 서버 컴포넌트를 껍데기로 두고 인터랙티브 부분만 잘라내면 `generateMetadata()`(OG 태그)와 `generateStaticParams()`(정적 생성)를 되찾을 수 있다. 1차 리포트 M-02의 근본 해결책이다.

#### R-04. 매직 넘버가 흩어져 있다

```ts
setTimeout(..., 250);            // survey L43, L60 — CSS의 duration과 무관하게 하드코딩
const yTop = isR ? 35 : 75;      // result L126–129 — 좌표 4쌍이 무슨 의미인지 불명
innerRadius={36} outerRadius={56}
```

`ANIMATION_MS = 250` 같은 상수로 뽑고, 레이더 좌표는 `SCALE_MIN/MAX`에서 계산하도록 하면 N-04(차트가 정보를 버리는 문제) 개선 시 그대로 재사용된다.

#### R-05. JSON import에 타입 계약이 없다

```ts
import mbtiTypes from "@/data/mbti-types.json";
typeData.riskScore?.toFixed(1) || "5.0"
```

`resolveJsonModule`이 구조를 추론해주지만, JSON을 잘못 편집해도 **런타임까지 못 잡는다.** `?.`과 `|| "5.0"` 같은 방어 코드가 붙은 것 자체가 타입 계약 부재의 증상이다.

```ts
// lib/types.ts
export interface MBTIType {
  code: string; nickname: string; emoji: string; desc: string;
  features: string[]; allocation: { name: string; value: number }[];
  image: string; riskScore: number;
}
const mbtiTypes = raw as MBTIType[];
```
더 나아가 `zod`로 스키마 검증을 하면 N-15(자산명 난립)나 allocation 합계 오류를 빌드 타임에 잡을 수 있다.

#### R-06. `code.includes("R")`은 위치를 보지 않는다

**위치**: `result/[code]/page.tsx` L121–124

지금은 8글자가 안 겹쳐서 우연히 맞다. 축을 하나만 추가해도(예: `Reactive`의 `R`) 조용히 깨진다. 인덱스로 접근하라.

```ts
const [risk, info, term, asset] = typeData.code;
const isR = risk === "R";
```

#### R-07. 채점 결과가 코드 4글자로 압축되며 정보가 소실된다

```ts
export function calculateMBTI(answers: Answer[]): string
```

3:0으로 압도한 사람과 2:1로 겨우 넘긴 사람이 구분되지 않는다. 그래서 레이더 차트가 축당 두 값만 가질 수밖에 없다(1차 M-06). 반환 타입을 넓히면 차트·설명·`riskScore`까지 개인화할 수 있다.

```ts
export function calculateMBTI(answers: Answer[]): {
  code: string;
  scores: { risk: number; info: number; term: number; asset: number }; // 각 0~3
}
```

#### R-08. 테스트가 0개

`calculateMBTI`는 순수 함수라 5분이면 안전망을 만들 수 있다. N-02의 25% 반전 버그도 아래 한 줄이면 잡혔다.

```ts
// lib/mbti.test.ts
it("답변이 12개가 아니면 던진다", () => {
  expect(() => calculateMBTI([])).toThrow();
});
it("전체 R/D/L/G 응답은 RDLG", () => {
  expect(calculateMBTI(all("R","D","L","G"))).toBe("RDLG");
});
```

---

## Part 4. 통합 우선순위 (1차 + 2차)

| 순위 | 항목 | 예상 작업량 |
|---|---|---|
| 1 | C-01 연타 방지 (`\|\| isTransitioning`) + C-02 `error.tsx` | 10분 |
| 2 | H-01 `calculateMBTI` 입력 검증 + N-11 단위 테스트 | 30분 |
| 3 | H-02 `isValidMBTICode` 연결 + `maxLength={4}` | 10분 |
| 4 | H-03 면책 문구 | 5분 |
| 5 | N-01 `.eslintrc.json` 추가 | 1분 |
| 6 | N-05 `selectedValue` 파생값 전환 | 10분 |
| 7 | M-01 `sessionStorage` 상태 보존 | 30분 |
| 8 | N-04 D/I축 선택지 순서 교정 | 5분 |
| 9 | M-02 + N-03 서버 컴포넌트 분리 → OG 태그 + 정적 생성 | 2시간 |
| 10 | N-03 `html2canvas` 동적 import, recharts 제거 | 1시간 |
| 11 | N-07 미사용 의존성 제거, N-06 죽은 CSS 정리 | 10분 |
| 12 | N-08 이미지 WebP 변환 | 30분 |
| 13 | R-02 컴포넌트 분리, R-05 타입 계약 | 반나절 |

**1~8번까지가 약 1시간 40분.** 여기까지만 해도 크래시·오답·법적 리스크·측정 편향이 모두 해소된다.
