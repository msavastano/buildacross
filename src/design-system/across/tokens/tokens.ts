// Across — generated from tokens.json. Raw values for places CSS variables can't reach
// (canvas, SVG export, motion libraries, emails). In normal UI use the CSS variables instead.

export const themes = [{"id":"light","name":"Newsprint"},{"id":"dark","name":"Night edition"}] as const;
export type ThemeId = (typeof themes)[number]['id'];

export const color = {
  "light": {
    "paper": "#f6f3ea",
    "cell": "#ffffff",
    "ink": "#171717",
    "ink-muted": "#5e5b53",
    "rule": "#d9d3c3",
    "grid-line": "#171717",
    "block": "#171717",
    "highlight": "#ffd43b",
    "on-highlight": "#171717",
    "word": "#c6def5",
    "check": "#ad3307",
    "reveal": "#1c5aa6",
    "pencil": "#625f58",
    "on-ink": "#f6f3ea",
    "link": "#1c5aa6"
  },
  "dark": {
    "paper": "#121211",
    "cell": "#1f1e1c",
    "ink": "#ece8de",
    "ink-muted": "#a8a397",
    "rule": "#3a3833",
    "grid-line": "#6e6b63",
    "block": "#6e6b63",
    "highlight": "#e9b949",
    "on-highlight": "#171717",
    "word": "#233f57",
    "check": "#ff8f61",
    "reveal": "#8bbcf0",
    "pencil": "#b3afa4",
    "on-ink": "#171717",
    "link": "#8bbcf0"
  }
} as const;
export type ColorToken = keyof (typeof color)['light'];

export const spacing = {
  "space-1": "4px",
  "space-2": "8px",
  "space-3": "12px",
  "space-4": "16px",
  "space-6": "24px",
  "space-8": "32px",
  "space-12": "48px"
} as const;
export const radius = {
  "radius-none": "0",
  "radius-sm": "2px",
  "radius-circle": "50%"
} as const;
export const size = {
  "cell-sm": "32px",
  "cell-md": "40px",
  "cell-lg": "48px"
} as const;
export const stroke = {
  "stroke-hair": "1px",
  "stroke-frame": "2px"
} as const;
export const fontFamily = {
  "serif": "\"Newsreader\", Georgia, \"Times New Roman\", serif",
  "sans": "\"Libre Franklin\", \"Franklin Gothic Medium\", \"Helvetica Neue\", Arial, sans-serif"
} as const;
export const typeStyles = {
  "display": {
    "family": "serif",
    "fontSize": "44px",
    "lineHeight": "48px",
    "fontWeight": 600,
    "letterSpacing": "-0.01em"
  },
  "headline": {
    "family": "serif",
    "fontSize": "26px",
    "lineHeight": "32px",
    "fontWeight": 600
  },
  "clue": {
    "family": "serif",
    "fontSize": "17px",
    "lineHeight": "24px",
    "fontWeight": 400
  },
  "body": {
    "family": "sans",
    "fontSize": "15px",
    "lineHeight": "22px",
    "fontWeight": 400
  },
  "ui": {
    "family": "sans",
    "fontSize": "14px",
    "lineHeight": "20px",
    "fontWeight": 600
  },
  "label": {
    "family": "sans",
    "fontSize": "12px",
    "lineHeight": "16px",
    "fontWeight": 700,
    "letterSpacing": "0.1em"
  },
  "cell-letter": {
    "family": "sans",
    "fontSize": "24px",
    "lineHeight": "24px",
    "fontWeight": 500
  },
  "cell-number": {
    "family": "sans",
    "fontSize": "10px",
    "lineHeight": "10px",
    "fontWeight": 500
  }
} as const;
export const focusRing = {
  "light": "0 0 0 2px #f6f3ea, 0 0 0 4px #1c5aa6",
  "dark": "0 0 0 2px #121211, 0 0 0 4px #8bbcf0"
} as const;

/** Google Fonts stylesheet for both families. */
export const fontsHref = 'https://fonts.googleapis.com/css2?family=Libre+Franklin:wght@400;500;600;700&family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,600;1,6..72,400&display=swap';
