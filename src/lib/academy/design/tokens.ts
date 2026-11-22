/**
 * Zigzag Academy design tokens — mirrored as CSS variables under `.academy-root`.
 * Scoped so Polymarket Edge Lab tokens remain untouched.
 */
export const academyTokens = {
  brand: "ZIGZAG",
  product: "Trading Academy",
  productHe: "אקדמיית המסחר",
  colors: {
    background: "#071018",
    backgroundElevated: "#0c1a24",
    backgroundMuted: "#122734",
    foreground: "#eef6f8",
    foregroundMuted: "#8aa3ad",
    primary: "#2dd4bf",
    primaryForeground: "#04201c",
    accent: "#38bdf8",
    accentForeground: "#062033",
    warning: "#f0b429",
    risk: "#f07167",
    border: "#1e3a47",
    sim: "#f0b429",
  },
  radii: {
    md: "0.75rem",
    lg: "1rem",
    xl: "1.25rem",
  },
} as const;

export type AcademyTokens = typeof academyTokens;
