---
name: Deep Space Fintech
colors:
  surface: '#10131a'
  surface-dim: '#10131a'
  surface-bright: '#363941'
  surface-container-lowest: '#0b0e15'
  surface-container-low: '#191b23'
  surface-container: '#1d2027'
  surface-container-high: '#272a31'
  surface-container-highest: '#32353c'
  on-surface: '#e1e2ec'
  on-surface-variant: '#c2c6d6'
  inverse-surface: '#e1e2ec'
  inverse-on-surface: '#2e3038'
  outline: '#8c909f'
  outline-variant: '#424754'
  surface-tint: '#adc6ff'
  primary: '#adc6ff'
  on-primary: '#002e6a'
  primary-container: '#4d8eff'
  on-primary-container: '#00285d'
  inverse-primary: '#005ac2'
  secondary: '#ddb7ff'
  on-secondary: '#490080'
  secondary-container: '#6f00be'
  on-secondary-container: '#d6a9ff'
  tertiary: '#ffb786'
  on-tertiary: '#502400'
  tertiary-container: '#df7412'
  on-tertiary-container: '#461f00'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#d8e2ff'
  primary-fixed-dim: '#adc6ff'
  on-primary-fixed: '#001a42'
  on-primary-fixed-variant: '#004395'
  secondary-fixed: '#f0dbff'
  secondary-fixed-dim: '#ddb7ff'
  on-secondary-fixed: '#2c0051'
  on-secondary-fixed-variant: '#6900b3'
  tertiary-fixed: '#ffdcc6'
  tertiary-fixed-dim: '#ffb786'
  on-tertiary-fixed: '#311400'
  on-tertiary-fixed-variant: '#723600'
  background: '#10131a'
  on-background: '#e1e2ec'
  surface-variant: '#32353c'
  deep-space: '#0B0E14'
  electric-indigo: '#6366F1'
  cyan-accent: '#06B6D4'
  surface-glass: rgba(255, 255, 255, 0.03)
  muted-grey: '#94A3B8'
typography:
  mbti-code:
    fontFamily: Inter
    fontSize: 48px
    fontWeight: '800'
    lineHeight: '1.2'
    letterSpacing: -0.04em
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-mono:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.05em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  container-max: 1200px
  gutter: 24px
  margin-mobile: 20px
  section-gap: 80px
  stack-sm: 8px
  stack-md: 16px
  stack-lg: 32px
---

## Brand & Style

The design system is engineered for the 2030-generation investor, blending the analytical rigor of asset management with the viral, personality-driven engagement of MBTI. The brand personality is "The Visionary Analyst"—intelligent, futuristic, and highly structured, yet accessible through gamification.

The visual style is a fusion of **Corporate Modern** and **Glassmorphism**. It utilizes a deep-space backdrop to establish a high-fidelity "Financial Tech" vibe. By employing translucent layers and subtle neon accents, the UI transitions from a serious diagnostic tool to a vibrant, shareable social asset. The emotional response should be one of confidence and curiosity: users should feel like they are unlocking a sophisticated digital identity for their wealth.

## Colors

This design system uses a dark-first color strategy. The foundation is **Deep Space (#0B0E14)**, providing a high-contrast base for technical data.

- **Primary (Electric Blue/Indigo):** Used for critical actions, active states, and the core Investment MBTI branding. It symbolizes reliability and technological precision.
- **Secondary (Soft Purples/Cyans):** Reserved for data visualization and radar chart gradients, creating a multi-dimensional feel that distinguishes different asset classes.
- **Functional Neutrals:** "Crisp White" (#F8FAFC) is used for primary headings to ensure maximum legibility against the dark void, while "Muted Grey" (#94A3B8) handles secondary metadata and helper text.

## Typography

The typography system relies on **Inter** for its neutral, highly legible character, essential for complex financial data. For the 4-letter MBTI codes (e.g., 'RDLG'), use an ultra-heavy weight with tight tracking to create a "block-like" visual icon. 

**JetBrains Mono** is introduced for labels, legends, and chart coordinates to lean into the "Tech-forward" aesthetic, suggesting a systematic or algorithmic origin for the diagnostic results. 

Responsive scaling is handled by reducing the `headline-lg` size for mobile viewports, ensuring the "Type Nicknames" remain visible above the fold during the result reveal.

## Layout & Spacing

The layout follows a **Fixed Grid** model for desktop to maintain the "Result Card" proportions necessary for social media exports. On mobile, it shifts to a fluid single-column layout with generous side margins to prevent visual clutter.

A vertical "Stack" rhythm is the primary method for organizing diagnostic questions. Generous whitespace between the question prompt and the answer options is critical to maintain focus. The "section-gap" is used to separate high-level summaries (MBTI type) from granular data (Asset Allocation charts), providing a clear narrative arc as the user scrolls down their results.

## Elevation & Depth

Depth is achieved through **Glassmorphism** and **Tonal Layering**. Instead of traditional drop shadows, use "Ambient Glows" where the primary or secondary color bleeds slightly from behind active elements.

- **Surface 1 (Base):** Deep Space background.
- **Surface 2 (Containers):** Semi-transparent glass (`rgba(255, 255, 255, 0.03)`) with a 1px subtle border and a 12px backdrop blur.
- **Interactive Layers:** High-contrast buttons sit at the highest elevation, featuring a soft outer glow in the primary color to draw immediate attention.
- **Visual Depth:** Radar charts should use layered polygon fills with varying opacities to show intersection and balance in asset classes.

## Shapes

The shape language is consistently **Rounded**, using a base radius of 16px for all containers and primary buttons. This softens the "Financial" edge of the product, making it feel more like a lifestyle app and less like a legacy banking tool. 

Radar charts should use slightly rounded vertices on their polygonal paths to maintain consistency with the UI components. Progress bars should have fully rounded caps (pill-shaped) to represent a "filling" liquid motion.

## Components

### Buttons
- **Primary:** Solid Electric Blue background with a 15% opacity outer glow of the same color. White text, Bold weight.
- **Secondary/Answer:** Glassmorphism style with a 1px border. On hover, the border transitions to Primary Blue and the background opacity increases.

### Progress Bars
- Use a dual-layered track. The background track is a dark grey-blue. The active track is a gradient from Cyan to Electric Blue with a "leading glow" effect (a small, high-intensity flare at the current percentage point).

### Question Cards
- Large, glass-morphic containers with 24px internal padding. Each card should feel like a floating module. Transitions between questions should use a horizontal slide + fade effect.

### Charts
- **Radar Chart:** Minimalist design with no background grid lines, only axis labels in `label-mono`. Use semi-transparent secondary colors for the data area.
- **Pie Chart:** Donut-style with a center label indicating "Total Risk Score" or similar metric.

### Result Summary
- A self-contained card layout optimized for sharing. It must include the MBTI Code, the Nickname, and the Radar chart within a single high-contrast container with a branded footer.