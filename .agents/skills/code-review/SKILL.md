---
name: code-review
description: Use this skill whenever the user asks for a code review, PR review, or feedback on code quality, correctness, security, or performance. Applies to any codebase including TypeScript/Next.js, Python/FastAPI, and C.
---

# Code Review Skill

## 언제 사용하나
- 사용자가 "코드리뷰 해줘", "이 PR/함수 좀 봐줘", "머지해도 될까?" 라고 요청할 때
- 커밋/PR 생성 전 자체 점검이 필요할 때

## 리뷰 절차
관련 파일을 먼저 읽고, 아래 6가지 관점을 순서대로 점검한다. 항목별로 문제가 없으면 넘어가고, 있으면 발견사항으로 기록한다.

1. **정확성 (Correctness)**
   - 로직이 의도대로 동작하는가
   - 엣지 케이스 처리 여부: 빈 입력, null/undefined, 0/음수, 경계값, 동시성
2. **보안 (Security)**
   - 사용자 입력 검증 누락
   - SQL/커맨드 인젝션 가능성
   - 시크릿/API 키 하드코딩
   - 인증·인가 체크 누락
3. **성능 (Performance)**
   - 불필요한 반복 연산, N+1 쿼리
   - 프론트엔드: 불필요한 리렌더링, 무거운 연산의 메인 스레드 블로킹
   - 메모리 누수 가능성 (구독 해제 누락, 리스너 미제거 등)
4. **가독성/스타일 (Readability)**
   - 네이밍의 명확성
   - 함수/컴포넌트 길이, 단일 책임 원칙
   - 중복 코드
   - 프로젝트 기존 컨벤션과의 일관성
5. **테스트 커버리지 (Test coverage)**
   - 핵심 로직에 대한 테스트 존재 여부
   - 커버되지 않은 실패 케이스
6. **아키텍처 정합성 (Architecture fit)**
   - 기존 폴더 구조·계층 분리(예: UI/로직/데이터)와 맞는가
   - 재사용 가능한 로직이 중복 구현되지 않았는가

## 결과 출력 형식
발견된 각 이슈를 다음 형식으로 정리한다:

```
[심각도] 파일:라인
문제: (한 줄 요약)
제안: (구체적 수정 방향, 필요하면 수정 코드 스니펫)
```

심각도는 세 단계 중 하나를 사용한다:
- 🔴 Critical — 반드시 수정 후 머지 (버그, 보안 취약점, 데이터 손실 위험)
- 🟡 Warning — 머지는 가능하나 개선 권장 (성능, 가독성, 테스트 부족)
- 🟢 Suggestion — 선택적 개선 제안 (스타일, 리팩터링 아이디어)

마지막에 **요약** 섹션을 추가한다:
- Critical / Warning / Suggestion 개수
- 전반적인 머지 가능 여부에 대한 한 줄 판단

## 스택별 체크 포인트
- **TypeScript/Next.js**: `any` 남용 여부, 클라이언트/서버 컴포넌트 경계, `useEffect` 의존성 배열 누락, 타입 단언(`as`) 남용
- **Python/FastAPI**: Pydantic 모델을 통한 입력 검증 여부, `async`/`await` 누락으로 인한 블로킹 호출, 예외 처리 및 상태 코드 반환
- **C**: 포인터 null 체크, `malloc` 이후 `free` 누락(메모리 누수), 배열/버퍼 경계 초과 접근

## 제약사항
- 코드 스타일 취향 차이(세미콜론 유무, 따옴표 종류 등)는 Critical로 분류하지 않는다.
- 실제 실행 결과나 컨텍스트를 확인할 수 없어 확신이 서지 않는 부분은 추측하지 말고 "확인 필요"로 표시한다.
- 발견사항이 없다면 억지로 지적을 만들어내지 않고 "주요 이슈 없음"이라고 명시한다.
