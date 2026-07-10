import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        "on-primary": "#002e6a",
        "surface-glass": "rgba(255, 255, 255, 0.03)",
        "surface-bright": "#363941",
        "error-container": "#93000a",
        "on-secondary-fixed": "#2c0051",
        "outline-variant": "#424754",
        "tertiary": "#ffb786",
        "on-surface-variant": "#c2c6d6",
        "inverse-primary": "#005ac2",
        "outline": "#8c909f",
        "surface-container-lowest": "#0b0e15",
        "secondary-fixed": "#f0dbff",
        "on-error-container": "#ffdad6",
        "on-secondary": "#490080",
        "primary-fixed-dim": "#adc6ff",
        "error": "#ffb4ab",
        "surface-dim": "#10131a",
        "inverse-on-surface": "#2e3038",
        "inverse-surface": "#e1e2ec",
        "surface-container-low": "#191b23",
        "secondary": "#ddb7ff",
        "primary-fixed": "#d8e2ff",
        "on-error": "#690005",
        "tertiary-fixed-dim": "#ffb786",
        "background": "#10131a",
        "muted-grey": "#94A3B8",
        "primary-container": "#4d8eff",
        "tertiary-container": "#df7412",
        "on-secondary-container": "#d6a9ff",
        "deep-space": "#0B0E14",
        "surface-variant": "#32353c",
        "surface-container-high": "#272a31",
        "secondary-container": "#6f00be",
        "surface-tint": "#adc6ff",
        "surface-container": "#1d2027",
        "surface": "#10131a",
        "on-tertiary-fixed": "#311400",
        "secondary-fixed-dim": "#ddb7ff",
        "on-primary-container": "#00285d",
        "surface-container-highest": "#32353c",
        "on-tertiary-container": "#461f00",
        "primary": "#adc6ff",
        "on-primary-fixed": "#001a42",
        "on-tertiary": "#502400",
        "cyan-accent": "#06B6D4",
        "on-tertiary-fixed-variant": "#723600",
        "electric-indigo": "#6366F1",
        "tertiary-fixed": "#ffdcc6",
        "on-background": "#e1e2ec",
        "on-primary-fixed-variant": "#004395",
        "on-secondary-fixed-variant": "#6900b3",
        "on-surface": "#e1e2ec"
      },
      borderRadius: {
        "DEFAULT": "0.25rem",
        "lg": "0.5rem",
        "xl": "0.75rem",
        "full": "9999px"
      },
      spacing: {
        "gutter": "24px",
        "container-max": "1200px",
        "stack-sm": "8px",
        "margin-mobile": "20px",
        "section-gap": "80px",
        "stack-md": "16px",
        "stack-lg": "32px"
      },
      fontFamily: {
        "body-md": ["Inter", "sans-serif"],
        "label-mono": ["JetBrains Mono", "monospace"],
        "headline-lg-mobile": ["Inter", "sans-serif"],
        "headline-lg": ["Inter", "sans-serif"],
        "mbti-code": ["Inter", "sans-serif"]
      },
      fontSize: {
        "body-md": ["16px", { "lineHeight": "24px", "fontWeight": "400" }],
        "label-mono": ["12px", { "lineHeight": "16px", "letterSpacing": "0.05em", "fontWeight": "500" }],
        "headline-lg-mobile": ["24px", { "lineHeight": "32px", "fontWeight": "700" }],
        "headline-lg": ["32px", { "lineHeight": "40px", "letterSpacing": "-0.02em", "fontWeight": "700" }],
        "mbti-code": ["48px", { "lineHeight": "1.2", "letterSpacing": "-0.04em", "fontWeight": "800" }]
      },
      transitionDuration: {
        "250": "250ms",
      },
      animation: {
        "fade-in": "fadeIn 0.5s ease-out forwards",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
