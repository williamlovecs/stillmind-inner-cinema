import { designTokens, motion } from "@stillmind/design-tokens";

const paper = designTokens.color.light;
export const colors = {
  ...paper,
  // Legacy aliases keep method modules type-safe while V3 uses one earthen accent.
  violet: paper.accent,
  lavender: paper.accentStrong,
  amber: paper.warm,
  white: "#FFF9F1",
  black: "#282E29",
} as const;

export const gradients = {
  primary: [paper.accent, paper.accent] as const,
  observer: [paper.accent, paper.mint, paper.warm] as const,
  warm: [paper.surfaceSoft, paper.backgroundRaised] as const,
  background: [paper.background, paper.background] as const,
} as const;

export const radii = designTokens.radius;
export const spacing = designTokens.spacing;
export { motion };
