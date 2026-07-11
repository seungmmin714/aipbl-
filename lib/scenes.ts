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

/** 플레이스홀더 장면의 색 테마 (축별로 시간대가 다른 하늘 연출) */
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

// R: 새벽/일출(모험) · D: 맑은 낮(데이터) · L: 황금 오후(장기) · G: 보랏빛 황혼(성장)
const SCENE_THEMES: Record<string, SceneTheme> = {
  R: {
    skyTop: "#ffeeda",
    skyBottom: "#ffc59e",
    sun: "#ffb45e",
    hillFar: "#f2a380",
    hillNear: "#e08a63",
    ground: "#ffd9a1",
    road: "#d99e63",
    roadEdge: "#b67c46",
    bush: "#e8975f",
    bushDark: "#cf7f4b",
  },
  D: {
    skyTop: "#e9f5ff",
    skyBottom: "#bfe0ff",
    sun: "#fff6c9",
    hillFar: "#a9cdf0",
    hillNear: "#85b4e3",
    ground: "#b5e0a8",
    road: "#e0d2ab",
    roadEdge: "#b7a67c",
    bush: "#8cc981",
    bushDark: "#6faf66",
  },
  L: {
    skyTop: "#fffbe6",
    skyBottom: "#ffe9a3",
    sun: "#ffcf57",
    hillFar: "#ecc879",
    hillNear: "#dcb35c",
    ground: "#d8d489",
    road: "#cfa763",
    roadEdge: "#a98443",
    bush: "#b3bd6b",
    bushDark: "#99a655",
  },
  G: {
    skyTop: "#efe9ff",
    skyBottom: "#cbbcf7",
    sun: "#ffc9e3",
    hillFar: "#ab9be4",
    hillNear: "#9182d3",
    ground: "#a99ade",
    road: "#8d80c0",
    roadEdge: "#6f639f",
    bush: "#8375bd",
    bushDark: "#6c5fa6",
  },
};

/** 문항의 axis(R/D/L/G) → 장면 테마 */
export function getSceneTheme(axis: string): SceneTheme {
  return SCENE_THEMES[axis] ?? SCENE_THEMES.D;
}
