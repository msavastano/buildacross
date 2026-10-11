// Regenerate tokens.css and tokens.ts from tokens.json:
//   node tokens/build-tokens.mjs tokens/tokens.json tokens
import fs from 'fs';
const [,, src, outDir] = process.argv;
const tk = JSON.parse(fs.readFileSync(src, 'utf8'));
const themes = tk.color.themes.map(t => t.id);
const first = themes[0];
const val = (v, th) => typeof v === 'string' ? v : (v[th] ?? v[first]);
const cv = s => s.replace(/^\{(.+)\}$/, 'var(--$1)');
const scales = ['spacing', 'radius', 'size', 'stroke'];
let css = `/* Across — generated from tokens.json. Do not edit by hand; change tokens.json and regenerate. */\n\n`;
css += `/* Themes: set data-theme="light" (Newsprint, default) or data-theme="dark" (Night edition) on <html>. */\n`;
for (const th of themes) {
  const sel = th === first ? `:root,\n[data-theme="${th}"]` : `[data-theme="${th}"]`;
  css += `${sel} {\n  color-scheme: ${th === 'dark' ? 'dark' : 'light'};\n`;
  for (const t of tk.color.tokens) css += `  --${t.name}: ${cv(val(t.value, th))};\n`;
  for (const t of tk.shadow.tokens) css += `  --${t.name}: ${val(t.value, th)};\n`;
  css += `}\n\n`;
}
css += `/* Optional: follow the OS setting when no data-theme is set */\n@media (prefers-color-scheme: dark) {\n  :root:not([data-theme]) {\n    color-scheme: dark;\n`;
for (const t of tk.color.tokens) css += `    --${t.name}: ${cv(val(t.value, 'dark'))};\n`;
for (const t of tk.shadow.tokens) css += `    --${t.name}: ${val(t.value, 'dark')};\n`;
css += `  }\n}\n\n:root {\n`;
for (const f of scales) for (const t of tk[f].tokens) css += `  --${t.name}: ${t.value};\n`;
for (const [k, v] of Object.entries(tk.type.families)) css += `  --font-${k}: ${v};\n`;
css += `}\n\n/* Type styles — one class per style in tokens.json */\n`;
for (const g of tk.type.groups) for (const s of g.styles) {
  css += `.ac-text-${s.name} { font-family: var(--font-${s.family || g.family}); font-size: ${s.fontSize}; line-height: ${s.lineHeight}; font-weight: ${s.fontWeight};${s.letterSpacing ? ` letter-spacing: ${s.letterSpacing};` : ''}${s.name === 'label' ? ' text-transform: uppercase;' : ''} }\n`;
}
fs.writeFileSync(`${outDir}/tokens.css`, css);
// tokens.ts
const color = {};
for (const th of themes) { color[th] = {}; for (const t of tk.color.tokens) { let v = val(t.value, th); const m = /^\{(.+)\}$/.exec(v); if (m) v = val(tk.color.tokens.find(x => x.name === m[1]).value, th); color[th][t.name] = v; } }
const scale = f => Object.fromEntries(tk[f].tokens.map(t => [t.name, t.value]));
const type = Object.fromEntries(tk.type.groups.flatMap(g => g.styles.map(s => [s.name, { family: s.family || g.family, fontSize: s.fontSize, lineHeight: s.lineHeight, fontWeight: s.fontWeight, ...(s.letterSpacing ? { letterSpacing: s.letterSpacing } : {}) }])));
const ts = `// Across — generated from tokens.json. Raw values for places CSS variables can't reach
// (canvas, SVG export, motion libraries, emails). In normal UI use the CSS variables instead.

export const themes = ${JSON.stringify(tk.color.themes)} as const;
export type ThemeId = (typeof themes)[number]['id'];

export const color = ${JSON.stringify(color, null, 2)} as const;
export type ColorToken = keyof (typeof color)['light'];

export const spacing = ${JSON.stringify(scale('spacing'), null, 2)} as const;
export const radius = ${JSON.stringify(scale('radius'), null, 2)} as const;
export const size = ${JSON.stringify(scale('size'), null, 2)} as const;
export const stroke = ${JSON.stringify(scale('stroke'), null, 2)} as const;
export const fontFamily = ${JSON.stringify(tk.type.families, null, 2)} as const;
export const typeStyles = ${JSON.stringify(type, null, 2)} as const;
export const focusRing = ${JSON.stringify(Object.fromEntries(themes.map(th => [th, val(tk.shadow.tokens[0].value, th)])), null, 2)} as const;

/** Google Fonts stylesheet for both families. */
export const fontsHref = 'https://fonts.googleapis.com/css2?family=Libre+Franklin:wght@400;500;600;700&family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,600;1,6..72,400&display=swap';
`;
fs.writeFileSync(`${outDir}/tokens.ts`, ts);
console.log('ok');
