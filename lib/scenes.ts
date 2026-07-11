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

// 시작/결과 화면의 브랜드 톤(화이트 #f4f5f9 · 블루 #004be6 · 시안 #06b6d4 ·
// 퍼플 #ddb7ff · 피치 #ffb786)에 맞춘 라이트 파스텔 팔레트.
// 축별로 색상(hue)만 살짝 다르게 — R: 블루 · D: 시안 · L: 인디고 · G: 바이올렛
const SCENE_THEMES: Record<string, SceneTheme> = {
  R: {
    skyTop: "#f0f6ff",
    skyBottom: "#c5dcff",
    sun: "#ffe1a1",
    hillFar: "#b4cdf3",
    hillNear: "#93b5e6",
    ground: "#d7ecdf",
    road: "#d0dae8",
    roadEdge: "#9db0c8",
    bush: "#a6d2bf",
    bushDark: "#8cbfa9",
  },
  D: {
    skyTop: "#ecfaff",
    skyBottom: "#c0e9f8",
    sun: "#fdf0bd",
    hillFar: "#a3d9ec",
    hillNear: "#80c5df",
    ground: "#d2efe6",
    road: "#d2dfe9",
    roadEdge: "#9eb6c5",
    bush: "#9cd6c6",
    bushDark: "#81c2b0",
  },
  L: {
    skyTop: "#f0f2ff",
    skyBottom: "#ccd5fc",
    sun: "#ffe2b5",
    hillFar: "#b1bcf2",
    hillNear: "#929ee3",
    ground: "#d7ebe4",
    road: "#ced8ee",
    roadEdge: "#9aa7d0",
    bush: "#a4cec3",
    bushDark: "#8abaac",
  },
  G: {
    skyTop: "#f7f3ff",
    skyBottom: "#dccffa",
    sun: "#ffd7ea",
    hillFar: "#c2aeef",
    hillNear: "#a68ede",
    ground: "#dfdcf2",
    road: "#d1cce8",
    roadEdge: "#a297ca",
    bush: "#b7a6df",
    bushDark: "#9e8acf",
  },
};

/** 문항의 axis(R/D/L/G) → 장면 테마 */
export function getSceneTheme(axis: string): SceneTheme {
  return SCENE_THEMES[axis] ?? SCENE_THEMES.D;
}
