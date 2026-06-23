export const colors = {
  background: "#050914",
  backgroundRaised: "#091224",
  surface: "rgba(17, 25, 49, 0.88)",
  surfaceSoft: "rgba(27, 35, 65, 0.72)",
  border: "rgba(196, 181, 253, 0.16)",
  borderStrong: "rgba(216, 180, 254, 0.34)",
  text: "#F8F7FC",
  textMuted: "#A8ADC2",
  textFaint: "#71778F",
  violet: "#9B87F5",
  lavender: "#D8B4FE",
  blue: "#67B7E8",
  amber: "#F4B66A",
  rose: "#E28A92",
  mint: "#7ED5C3",
  danger: "#FF9B9B",
  white: "#FFFFFF",
  black: "#03050B",
} as const;

export const gradients = {
  primary: ["#7457D8", "#A984EB", "#D3A6E8"] as const,
  observer: ["#6C4BD8", "#7FA9E8", "#E1A45D"] as const,
  warm: ["#402D5A", "#704C63", "#A86E56"] as const,
  background: ["#050914", "#07111F", "#0B1020"] as const,
} as const;

export const radii = { small: 10, medium: 16, large: 22, round: 999 } as const;
export const spacing = { xs: 6, sm: 10, md: 16, lg: 24, xl: 32, xxl: 44 } as const;
