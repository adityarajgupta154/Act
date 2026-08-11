/* GENERATED FROM tokens.json -- DO NOT EDIT. Run scripts/build-tokens.mjs. */
// Portable design tokens (colors as hex). Web consumes the theme via
// src/index.css; mobile (Expo) and any other platform import this object so the
// whole product shares one source of truth.
export const tokens = {
  "color": {
    "light": {
      "background": "#fcfbf8",
      "foreground": "#1f2c47",
      "border": "#e0ddd1",
      "card": "#ffffff",
      "cardForeground": "#1f2c47",
      "popover": "#ffffff",
      "popoverForeground": "#1f2c47",
      "primary": "#f9931f",
      "primaryForeground": "#ffffff",
      "secondary": "#0db9f2",
      "secondaryForeground": "#ffffff",
      "muted": "#ebe8e0",
      "mutedForeground": "#525f7a",
      "accent": "#2eb85c",
      "accentForeground": "#ffffff",
      "destructive": "#ec1337",
      "destructiveForeground": "#ffffff",
      "input": "#e0ddd1",
      "ring": "#f9931f",
      "chart1": "#f9931f",
      "chart2": "#0db9f2",
      "chart3": "#2eb85c",
      "chart4": "#8b5cf6",
      "chart5": "#c9a227",
      "sidebar": "#16254c",
      "sidebarForeground": "#f2efe4",
      "sidebarBorder": "#0f1b3a",
      "sidebarPrimary": "#f9931f",
      "sidebarPrimaryForeground": "#ffffff",
      "sidebarAccent": "#1d3f8c",
      "sidebarAccentForeground": "#ffffff",
      "sidebarRing": "#f9931f"
    },
    "dark": {
      "background": "#0e1a33",
      "foreground": "#f2efe4",
      "border": "#263a66",
      "card": "#16254c",
      "cardForeground": "#f2efe4",
      "popover": "#1b2e5c",
      "popoverForeground": "#f2efe4",
      "primary": "#f9931f",
      "primaryForeground": "#ffffff",
      "secondary": "#0db9f2",
      "secondaryForeground": "#ffffff",
      "muted": "#1c2c52",
      "mutedForeground": "#a8b4d2",
      "accent": "#2eb85c",
      "accentForeground": "#ffffff",
      "destructive": "#f43f5e",
      "destructiveForeground": "#ffffff",
      "input": "#263a66",
      "ring": "#f9931f",
      "chart1": "#f9a03f",
      "chart2": "#35c3f5",
      "chart3": "#3bc96b",
      "chart4": "#a78bfa",
      "chart5": "#e4b04a",
      "sidebar": "#0b1730",
      "sidebarForeground": "#e9edf8",
      "sidebarBorder": "#1a2a50",
      "sidebarPrimary": "#f9931f",
      "sidebarPrimaryForeground": "#ffffff",
      "sidebarAccent": "#1d3f8c",
      "sidebarAccentForeground": "#ffffff",
      "sidebarRing": "#f9931f"
    }
  },
  "fontFamily": {
    "sans": [
      "Nunito",
      "Noto Sans Devanagari",
      "Noto Sans Gujarati",
      "sans-serif"
    ],
    "serif": [
      "Playfair Display",
      "Noto Serif Devanagari",
      "serif"
    ],
    "mono": [
      "Menlo",
      "monospace"
    ]
  },
  "radius": "1rem",
  "spacing": "0.25rem"
} as const;

export type Tokens = typeof tokens;
export default tokens;
