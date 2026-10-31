/** StillMind V3 / Still Room: warm paper, mineral ink and one earthen accent. */
export const designTokens = {
  color: {
    dark: {
      background: "#252A26",
      backgroundRaised: "#30362F",
      surface: "#363C34",
      surfaceSoft: "#41483D",
      surfaceQuiet: "#2B302A",
      border: "#565D50",
      borderStrong: "#8D9583",
      text: "#F4F1E9",
      textMuted: "#C4C7B8",
      textFaint: "#A5AA9A",
      accent: "#D88D6F",
      accentStrong: "#E6A488",
      accentInk: "#252A26",
      warm: "#D8BD91",
      blue: "#A8B8AA",
      mint: "#B7C3A9",
      rose: "#DDA99B",
      danger: "#F0B0A0",
    },
    light: {
      background: "#F4F1E9",
      backgroundRaised: "#FAF8F2",
      surface: "#FAF8F2",
      surfaceSoft: "#E7EAE0",
      surfaceQuiet: "#EEECE3",
      border: "#D4D2C5",
      borderStrong: "#8B9181",
      text: "#282E29",
      textMuted: "#596055",
      textFaint: "#6B7165",
      accent: "#A9563D",
      accentStrong: "#8E4431",
      accentInk: "#FFF9F1",
      warm: "#806239",
      blue: "#526D60",
      mint: "#53694B",
      rose: "#875346",
      danger: "#8C3F33",
    },
  },
  spacing: { xs: 6, sm: 10, md: 16, lg: 24, xl: 32, xxl: 48 },
  radius: { small: 6, medium: 10, large: 18, stage: 24, round: 999 },
  elevation: { none: "none", resting: "0 16px 36px rgba(61,54,39,0.08)" },
  motion: { instant: 1, fast: 140, standard: 240, slow: 360, easing: "cubic-bezier(0.2,0,0,1)" },
  touch: { minimum: 44, comfortable: 48 },
  typography: {
    sans: '"PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Noto Sans SC", Arial, sans-serif',
    displayWeight: "500",
    bodyLineHeight: 1.75,
  },
} as const;

export const darkColors = designTokens.color.dark;
export const spacing = designTokens.spacing;
export const radii = designTokens.radius;
export const motion = designTokens.motion;
