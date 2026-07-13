// 설문 "갈림길 선택" 장면의 에셋 경로 규칙과 플레이스홀더 테마 정의
//
// ── 실제 일러스트로 교체하는 방법 ──────────────────────────────
// public/images/scenes/ 폴더에 아래 네이밍 규칙으로 이미지를 넣으면
// 코드 수정 없이 자동으로 플레이스홀더(SVG 도형)를 대체합니다.
// 이미지가 없거나 로드에 실패하면 플레이스홀더가 그대로 표시됩니다.
//
//   background.png            전 문항 공통 배경 (하늘/원경/들판 전체 아트)
//   {문항ID}-background.png   문항별 배경 — 공통 배경보다 우선   (예: q1-background.png)
//   {문항ID}-road.png         갈림길 레이어      (예: q1-road.png)
//   {문항ID}-foreground.png   바닥/근경 레이어   (예: q1-foreground.png)
//
// 권장 스펙: 세로형 1200×1800px 이상, road/foreground는 투명 배경 PNG(또는 WebP).
// 자세한 가이드는 public/images/scenes/README.md 참고.
// ─────────────────────────────────────────────────────────────

export const SCENES_BASE_PATH = "/images/scenes";

/** 전 문항 공통 배경 일러스트 — 파일이 있으면 배경 플레이스홀더(산/도시/들판)를
    대체한다 (object-cover). 문항별 q{n}-background.png가 있으면 그게 다시 우선. */
export const SHARED_BACKGROUND_SRC = `${SCENES_BASE_PATH}/background.png`;

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

/** 플레이스홀더 장면의 색 테마 */
export interface SceneTheme {
  skyTop: string;
  skyBottom: string;
  sun: string;
  hillFar: string; // 산맥(원경)
  hillNear: string; // 산맥(근경)
  ground: string; // 들판
  groundLight: string; // 하단 근경 언덕 밴드
  road: string;
  roadEdge: string;
  bush: string;
  bushDark: string;
  city: string; // 도시 건물
  cityLight: string; // 건물 창문
  treeTrunk: string; // 나무 기둥/이정표 기둥
  wood: string; // 이정표 판자
}

// 따뜻한 자연 톤 단일 팔레트 (레퍼런스: 크림 하늘 · 주황 해 · 초록 들판 ·
// 모래색 길 · 초록 산맥 · 블루그레이 도시). 모든 축(R/D/L/G) 공통 사용.
// (축별 변주가 다시 필요해지면 이 객체를 축별 Record로 되돌리면 된다)
const UNIFIED_THEME: SceneTheme = {
  skyTop: "#fdf0da",
  skyBottom: "#fbe2bd",
  sun: "#f4a952",
  hillFar: "#b9d3a2",
  hillNear: "#8cb97d",
  ground: "#8cc06d",
  groundLight: "#9bcb7d",
  road: "#e9daa9",
  roadEdge: "#d2bf8a",
  bush: "#6fae56",
  bushDark: "#58974a",
  city: "#8b9cba",
  cityLight: "#d5dfef",
  treeTrunk: "#8a6b47",
  wood: "#7d5f3e",
};

/** 문항의 axis(R/D/L/G) → 장면 테마 (현재는 전 축 공통) */
export function getSceneTheme(_axis: string): SceneTheme {
  return UNIFIED_THEME;
}
