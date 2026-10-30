import { darkColors, designTokens, motion } from "@stillmind/design-tokens";

export const colors = {
  ...darkColors,
  violet: darkColors.accent,
  lavender: darkColors.accentStrong,
  amber: darkColors.warm,
  white: "#FFFFFF",
  black: "#03050B",
} as const;

export const gradients = {
  primary: [darkColors.accent, darkColors.accentStrong] as const,
  observer: [darkColors.accent, darkColors.blue, darkColors.warm] as const,
  warm: [darkColors.surface, darkColors.backgroundRaised] as const,
  background: [darkColors.background, darkColors.background] as const,
} as const;

export const radii = designTokens.radius;
export const spacing = designTokens.spacing;
export { motion };
