/** StillMind Experience V2: semantic values shared by web and native views. */
export const designTokens = {
  color: {
    dark: {
      background: "#080D18",
      backgroundRaised: "#0E1625",
      surface: "#121D2E",
      surfaceSoft: "#182438",
      surfaceQuiet: "#0B1320",
      border: "#2A374C",
      borderStrong: "#62728F",
      text: "#F1F0EB",
      textMuted: "#A9B3C4",
      textFaint: "#8996AB",
      accent: "#B7ACEB",
      accentStrong: "#CDC4F7",
      accentInk: "#15162B",
      warm: "#DABD8B",
      blue: "#99C5DD",
      mint: "#99CDBB",
      rose: "#DFABB1",
      danger: "#F1AAAA",
    },
    light: {
      background: "#F2F1EC",
      backgroundRaised: "#FAF9F5",
      surface: "#FFFFFF",
      surfaceSoft: "#E9EBF0",
      surfaceQuiet: "#ECEBE5",
      border: "#CDD2DD",
      borderStrong: "#7B8599",
      text: "#202737",
      textMuted: "#4C586C",
      textFaint: "#606D82",
      accent: "#5C508C",
      accentStrong: "#4E427E",
      accentInk: "#FFFFFF",
      warm: "#785928",
      blue: "#386780",
      mint: "#366B55",
      rose: "#864C55",
      danger: "#913F45",
    },
  },
  spacing: { xs: 6, sm: 10, md: 16, lg: 24, xl: 32, xxl: 48 },
  radius: { small: 10, medium: 14, large: 20, stage: 28, round: 999 },
  elevation: { none: "none", resting: "0 12px 32px rgba(0,0,0,0.14)" },
  motion: { instant: 1, fast: 120, standard: 220, slow: 420, easing: "cubic-bezier(0.2,0,0,1)" },
  touch: { minimum: 44, comfortable: 48 },
  typography: {
    sans: '"PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Noto Sans SC", Arial, sans-serif',
    displayWeight: "600",
    bodyLineHeight: 1.7,
  },
} as const;

export const darkColors = designTokens.color.dark;
export const spacing = designTokens.spacing;
export const radii = designTokens.radius;
export const motion = designTokens.motion;
