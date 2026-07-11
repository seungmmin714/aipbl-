// 설문 "갈림길 선택" 장면의 에셋 경로 규칙과 플레이스홀더 테마 정의
//
// ── 실제 일러스트로 교체하는 방법 ──────────────────────────────
// public/images/scenes/ 폴더에 아래 네이밍 규칙으로 이미지를 넣으면
// 코드 수정 없이 자동으로 플레이스홀더(SVG 도형)를 대체합니다.
// 이미지가 없거나 로드에 실패하면 플레이스홀더가 그대로 표시됩니다.
//
//   {문항ID}-background.png   하늘/원경 레이어   (예: q1-background.png)
//   {문항ID}-road.png         갈림길 레이어      (예: q1-road.png)
//   {문항ID}-foreground.png   바닥/근경 레이어   (예: q1-foreground.png)
//
// 권장 스펙: 세로형 1200×1800px 이상, road/foreground는 투명 배경 PNG(또는 WebP).
// 자세한 가이드는 public/images/scenes/README.md 참고.
// ─────────────────────────────────────────────────────────────

export const SCENES_BASE_PATH = "/images/scenes";

export interface SceneAssets {
  background: string;
  road: string;
  foreground: string;
}

/** 문항 ID(q1~q12) → 레이어별 이미지 경로 */
export function getSceneAssets(questionId: string): SceneAssets {
  return {
    background: `${SCENES_BASE_PATH}/${questionId}-background.png`,
    road: `${SCENES_BASE_PATH}/${questionId}-road.png`,
    foreground: `${SCENES_BASE_PATH}/${questionId}-foreground.png`,
  };
}

/** 플레이스홀더 장면의 색 테마 (브랜드 톤 안에서 축별 색상 변주) */
export interface SceneTheme {
  skyTop: string;
  skyBottom: string;
  sun: string;
  hillFar: string;
  hillNear: string;
  ground: string;
  road: string;
  roadEdge: string;
  bush: string;
  bushDark: string;
}

// 시작/결과 화면과 같은 화이트 & 블루 단일 팔레트 (브랜드 #004be6 계열).
// 모든 축(R/D/L/G)이 동일한 테마를 사용해 설문 전체에 통일감을 준다.
// (축별 변주가 다시 필요해지면 이 객체를 축별 Record로 되돌리면 된다)
const UNIFIED_THEME: SceneTheme = {
  skyTop: "#eef4ff",
  skyBottom: "#bdd5f8",
  sun: "#ffffff",
  hillFar: "#a9c4ee",
  hillNear: "#8fb0e6",
  ground: "#dfe9fb",
  road: "#fafcff",
  roadEdge: "#8aa5cf",
  bush: "#b7cdf1",
  bushDark: "#9cb9ea",
};

/** 문항의 axis(R/D/L/G) → 장면 테마 (현재는 전 축 공통 화이트&블루) */
export function getSceneTheme(_axis: string): SceneTheme {
  return UNIFIED_THEME;
}
