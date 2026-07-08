# 투자 MBTI 서비스 디자인 가이드 (v1.0)

본 가이드는 **Deep Space Fintech** 테마를 기반으로 한 투자 MBTI 서비스의 브랜드 아이덴티티 및 디자인 규격을 정의합니다. Day 3부터 Day 10까지 진행되는 모든 화면 개발 시 본 스펙을 필수로 준수해야 합니다.

## 1. 브랜드 퍼소나 & 스타일 컨셉
- **브랜드 퍼소나**: "The Visionary Analyst" (이성적이고 미래지향적이며 구조화된 분석가 스타일)
- **비주얼 스타일**: **Corporate Modern** + **Glassmorphism**의 융합
- **디자인 톤**: 깊고 어두운 우주 테마(#0B0E14)를 바탕으로 데이터의 가독성을 높이고, 부드러운 네온 하이라이트와 반투명 유리 재질로 고급 금융 테크 감각을 연출합니다.

## 2. 색상 시스템 (Color Palette)

| 명칭 | Hex 코드 | 용도 / 설명 |
| --- | --- | --- |
| **Deep Space** | `#0B0E14` | 기본 배경색 (가장 깊은 어둠) |
| **Background (Surface Dim)** | `#10131a` | 세컨더리 배경색 |
| **Electric Indigo (Primary)** | `#6366F1` | 주조색, 핵심 버튼 및 브랜딩 액션 |
| **Cyan Accent (Secondary)** | `#06B6D4` | 데이터 강조색, 프로그레스 바 상태, 해시태그 |
| **Surface Glass** | `rgba(255, 255, 255, 0.03)` | 카드 컨테이너 배경 (12px 블러 + 1px Border 필수) |
| **Muted Grey** | `#94A3B8` | 보조 텍스트, 설명 메타데이터, 구분선 등 |
| **Crisp White (On-Background)** | `#F8FAFC` | 메인 헤드라인 텍스트 색상 |

## 3. 타이포그래피 (Typography)

- **기본 본문 및 제목**: `Inter` 폰트 사용
- **데이터 / 레이블 / 메타 코드**: `JetBrains Mono` 폰트 사용

### 스펙 가이드:
1. **MBTI Code / Big Number**: `Inter`, 48px, Weight 800, LineHeight 1.2, LetterSpacing -0.04em (초강조 데이터용)
2. **Headline Large**: `Inter`, 32px, Weight 700, LineHeight 40px, LetterSpacing -0.02em (모바일에서는 24px/LineHeight 32px로 조절)
3. **Body Medium**: `Inter`, 16px, Weight 400, LineHeight 24px (일반 본문 및 대화형 텍스트)
4. **Label Mono**: `JetBrains Mono`, 12px, Weight 500, LineHeight 16px, LetterSpacing 0.05em (캡션, 칩스, 통계 헤더용)

## 4. 레이아웃 & 스페이싱 (Layout & Spacing)

- **컨테이너 최대 너비**: `1200px` (desktop), 모바일 1열 fluid 레이아웃
- **안쪽 여백(Gutter)**: `24px`
- **모바일 좌우 마진**: `20px`
- **레이아웃 섹션 간격 (Section Gap)**: `80px` (예: 요약 정보와 상세 포트폴리오 사이의 상하 마진)
- **수직 스택 간격 (Stack)**:
  - `stack-sm`: `8px` (간단한 타이틀-부타이틀 간격)
  - `stack-md`: `16px` (본문 문단 간격)
  - `stack-lg`: `32px` (버튼군 및 컨텐츠 카드 간격)

## 5. 컴포넌트 스타일 (UI Components)

### 5.1 버튼 (Buttons)
- **기본 액션 버튼 (Primary Button)**:
  - 배경: `bg-electric-indigo` (#6366F1)
  - 텍스트: 흰색 글자, 굵게 (Bold)
  - 효과: `glow-button` 클래스 (15% 불투명도의 네온 글로우 효과 후방 배치, 호버 시 30%로 강화)
- **보조 / 선택지 버튼 (Secondary Button)**:
  - 배경: `bg-surface-glass` (`rgba(255, 255, 255, 0.03)`)
  - 테두리: `border border-white/10`
  - 호버 효과: 테두리가 `border-primary`로 전이되며 배경 불투명도 증가

### 5.2 컨테이너 카드 (Containers & Cards)
- 유리 효과(`backdrop-blur-md` 또는 `backdrop-blur-xl`)와 `border-white/5` 얇은 실선 테두리로 공중에 뜬 듯한 레이어 감각을 부여합니다.
- 모서리 둥글기: 모든 기본 버튼과 컨텐츠 카드는 **16px (1rem, Tailwind `rounded-2xl` 또는 커스텀 `rounded-xl`)** 모서리 처리를 균일하게 적용합니다.

### 5.3 프로그레스 바 (Progress Bars)
- 배경 트랙은 어두운 회청색, 채워지는 액티브 트랙은 **Cyan (#06B6D4)에서 Electric Blue (#6366F1)로 이어지는 그라데이션**을 적용합니다. 진행 끝 지점에는 밝은 네온 하이라이트(Leading Glow) 효과를 줍니다.

### 5.4 설문 화면 전용 컴포넌트 (Survey Screen Components)
- **진단 설문 카드 (Question Cards)**: 24px 내부 여백(Padding)을 가진 대형 반투명 유리 형태 컨테이너(`bg-surface-glass`, `border-white/5` 얇은 테두리, `backdrop-blur-md`). 공중에 떠 있는 듯한 레이어 감각을 부여합니다.
- **선택지 버튼 (Answer Options)**: 모서리가 16px 둥글게 깎인 글래스모피즘 버튼(`bg-surface-glass`, `border border-white/10`). 호버 시 테두리가 `border-primary` (#6366F1)로 바뀌며 투명도가 낮아집니다.

### 5.5 결과 화면 전용 컴포넌트 (Result Screen Components)
- **결과 카드 (Result Card Summary)**: SNS 공유와 이미지 저장을 고려한 올인원 디자인. 한 장의 컴팩트한 고대비 카드 구조 내에 MBTI 코드(48px), 별명, 상세 정보 및 자산 배분 레이더 차트를 모두 포함하고 하단에 브랜딩 풋터를 둡니다.
- **레이더 차트 (Radar Chart)**: 배경 그리드 선을 노출하지 않는 미니멀 스타일. 축 레이블은 `label-mono` (JetBrains Mono, 12px)로 세련되게 장식하고 데이터 폴리곤 영역은 여러 자산 클래스가 겹쳐 보일 수 있도록 반투명 컬러 레이어로 표현합니다.
- **도넛 차트 (Donut/Pie Chart)**: 자산 배분 파이를 도넛 스타일로 묘사하고, 중앙 레이블 영역에 핵심 자산 비율 혹은 종합 위험도 등을 기입합니다.
