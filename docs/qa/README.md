# QA 문서

`a7ef550` 기준으로 수행한 코드 리뷰 및 결함 분석 결과.

| 문서 | 내용 |
|---|---|
| [QA_TEST_PLAN.md](./QA_TEST_PLAN.md) | 결함 20건 요약, 재현 절차, 테스트 케이스 37개 |
| [DEFECT_REPORT_1.md](./DEFECT_REPORT_1.md) | 1차 코드 리뷰 결함 리포트 (Critical 2 / High 3 / Medium 8 / Low 7) |
| [DEFECT_REPORT_2_AND_CODE_REVIEW.md](./DEFECT_REPORT_2_AND_CODE_REVIEW.md) | 2차 심화 분석 + 아키텍처 리뷰 (신규 16건) |
| [FIX_PATCH_NOTES.md](./FIX_PATCH_NOTES.md) | 수정 패치 상세 설명 |

## 검증 방법

```bash
npm install
npm test             # 11 tests, 11 pass
npx tsc --noEmit     # 에러 0
npm run lint         # 경고 1건 (no-img-element)
npx next build       # 성공
```

## 핵심 발견

- **`다음` 버튼 연타 → 문항 스킵.** 전수조사(4096 패턴 × 12 스킵 위치 = 49,152건)
  결과 **25.0%** 에서 최종 코드가 반전. 마지막 구간에서는 크래시.
- **`calculateMBTI`에 입력 검증이 없어** 빈 배열도 `"SITV"`를 반환.
  모든 결손 데이터가 최보수 유형으로 조용히 수렴.
- **결과 페이지 First Load JS 242 kB.** `html2canvas`가 저장 버튼을 누르지
  않아도 항상 로드됨.
