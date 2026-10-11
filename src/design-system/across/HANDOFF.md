# Across design system — handoff for Claude Code

Across is the visual system for the crossword app: newspaper-puzzle styling (ink on newsprint, square corners, the grid as the hero), two themes, a type pairing, spacing/size scales, and five React components for the grid and clues. It was authored as a Claude Design System artifact; this folder is a self-contained export of it, version 1 (2026-10-10).

Read this file first, then `brand/brand-book.md`. `CLAUDE.md` holds the short rules to keep in context while building UI.

## What's in the bundle

```
across-design-system/
├── HANDOFF.md                 ← you are here
├── CLAUDE.md                  ← standing UI rules (copy to repo root or merge into the existing one)
├── brand/
│   └── brand-book.md          ← voice, color, type, layout, interaction, iconography rules
│                                (its last section describes the window.Across reference bundle;
│                                 in the app, import from components/src instead)
├── tokens/
│   ├── tokens.json            ← SOURCE OF TRUTH (names, values per theme, usage notes)
│   ├── tokens.css             ← generated: CSS variables for both themes + .ac-text-* type classes
│   ├── tokens.ts              ← generated: raw values for canvas/SVG/motion code
│   └── build-tokens.mjs       ← regenerates the two files above
├── components/
│   ├── src/                   ← USE THESE: TypeScript React 18 components + across.css
│   │   ├── index.ts, Button.tsx, Cell.tsx, Grid.tsx, ClueBar.tsx, ClueList.tsx
│   │   ├── numberGrid.ts      ← crossword numbering + wordAt()
│   │   ├── cx.ts
│   │   └── across.css         ← component styles (needs tokens.css loaded first)
│   ├── guidelines/<Name>.md   ← per-component usage rules and props
│   └── reference/             ← the original browser bundle (window.Across) — behaviour reference only
│       ├── bundle.js, bundle.css, across.d.ts
└── preview/
    ├── index.html             ← open in a browser: live gallery + wired puzzle, theme toggle
    └── cover.html             ← the system's cover graphic (960×288)
```

## Integrating into the app

1. Copy this folder into the repo, e.g. `src/design-system/across/`. Keep `tokens/` and `components/src/` together; `across.css` assumes `tokens.css` is loaded.
2. At the app root, import the styles once and add the fonts:
   ```ts
   import './design-system/across/tokens/tokens.css';
   import './design-system/across/components/src/across.css';
   ```
   ```html
   <link rel="preconnect" href="https://fonts.googleapis.com">
   <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
   <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Libre+Franklin:wght@400;500;600;700&family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,600;1,6..72,400&display=swap">
   ```
   (`tokens.ts` exports the same URL as `fontsHref`.) Set `body { background: var(--paper); color: var(--ink); font-family: var(--font-sans); }`.
3. Themes: put `data-theme="light"` or `data-theme="dark"` on `<html>`. With no attribute, `tokens.css` follows the OS setting. Light (Newsprint) is the default; persist a user choice if you add a toggle.
4. Import components from `components/src`:
   ```tsx
   import { Grid, ClueBar, ClueList, Button, numberGrid } from './design-system/across/components/src';
   ```
   The sources are plain TSX (React 18, `jsx: react-jsx`, strict mode). No runtime dependencies besides React. They type-check clean under `strict`.
5. Open `preview/index.html` to see the intended look and keyboard behaviour (loads React from jsDelivr, so it needs network).

If the app uses Tailwind or another styling layer, map it onto the CSS variables (e.g. `colors: { paper: 'var(--paper)', … }`) rather than copying hex values.

## Component summary

| Component | What it is | Key props |
|---|---|---|
| `Button` | Text-only action. One `primary` per view. | `variant`: `primary` · `secondary` (default) · `quiet`; any `<button>` attribute |
| `Cell` | One square in any state | `letter`, `number`, `state` (`empty`/`active`/`word`/`block`), `mark` (`wrong`/`revealed`), `pencil`, `circled`, `size` (`sm`/`md`/`lg`) |
| `Grid` | Playable grid with numbering, cursor, keyboard input | `solution` (strings, `#` = block), `entries`, `marks`, `circles`, `active`, `size`, `pencilMode`, `readOnly`, `onSelect`, `onChange` |
| `ClueBar` | The active clue in one line above the grid | `number`, `direction`, children = clue text, `onPrev`/`onNext` |
| `ClueList` | One direction's clue list | `direction`, `clues` `[{number,text,done?}]`, `activeNumber`, `crossingNumber`, `onSelect` |
| `numberGrid()` | Standard numbering + across/down entry lists | `(solution: string[])` → `{numbers, across, down, rows, cols}` |

Wiring: `Grid.onSelect({number, direction, …})` → set state → feed `ClueBar` and the matching `ClueList.activeNumber`. `preview/index.html` shows exactly this.

Full rules per component are in `components/guidelines/`.

## Known limits of v1 (read before building on Grid)

- **Grid is uncontrolled.** `entries` and `active` are read once on mount. Changing `solution` (e.g. a new grid size) does **not** reset internal state and can index past the old arrays. Until it's made controlled, remount it: `<Grid key={`${rows}x${cols}`} … />`.
- **Grid is a solver.** It has no way to toggle black squares, no rebus input, no Tab-to-next-word, and no check/reveal logic (it only *displays* `marks` you pass in).
- `onSelect` fires from an effect, so it lands one render after the cursor moves. Fine for display; don't rely on it for synchronous logic.
- No icon set and no logo. The name is set in Newsreader `display` wherever a mark would go.
- Fonts are hosted by Google Fonts; there are no self-hosted font files.

## Gaps for the crossword builder

The system was designed around solving a puzzle. The builder needs these and they don't exist yet. Extend the system rather than inventing a parallel style. Every new piece uses existing tokens and follows the brand book.

- **Construct mode for Grid.** Make Grid controlled (`entries`/`onChange` as the single source of truth, plus a `blocks` input or a `#` in `entries`). Add a mode where clicking or pressing `.` toggles a black square. Mirroring the 180° partner square is a likely setting, but confirm with Mike. Black squares stay `block`; don't introduce a new colour for "selected block".
- **Grid size picker.** Plain choices (5×5, 15×15, 21×21, custom) as `secondary` buttons or a select, labelled in sentence case. Use `cell-lg` for minis, `cell-md` default, `cell-sm` for 15×15 on phones.
- **Clue editor.** One row per entry: the number + direction chip in the `ClueBar` chip style (`14A`), the answer in uppercase, and a text field set in `clue` style. Inputs: `cell` background, `stroke-hair` `ink` border, `radius-sm`, `focus-ring`.
- **Validation messages.** Never colour alone. Problems use `check` text **plus** a word ("Unchecked square", "2-letter word") and, on the grid, the `wrong` slash or an outline on the affected cells. Informational notes use `reveal`. Keep copy terse and specific. Don't hard-code any publication's submission rules from memory. Put them in one config file with a source link so Mike can verify them.
- **AI help.** No pattern exists yet. Keep it text-first, quiet, and visibly separate from the solver's own entries. AI-suggested letters should render as `pencil` entries so they never pass as pen.
- **Landing page.** The brand book's "no motion" rule was written for the puzzle UI. Motion on the landing page is an open question for Mike. Until he decides, keep motion off the puzzle and builder screens. For any motion, take colours and sizes from `tokens.ts`, not new values.

When you add a component, give it a guidelines file in `components/guidelines/` and add it to the gallery.

## Rules that are easy to break

- Only tokens. No raw hex, no new greys, no new blues. If a value is missing, add it to `tokens.json`, regenerate, and give it a usage note.
- `highlight` (yellow) is the cursor and nothing else.
- Colour never carries meaning alone: the cursor has an inset ring, wrong has a slash, revealed has a corner flag, pencil is lighter weight, the active word is named in the ClueBar.
- Square corners: `radius-none` everywhere except buttons and chips (`radius-sm`) and circled squares (`radius-circle`).
- No shadows except `--focus-ring`. Separate things with `rule` hairlines and spacing.
- Newsreader for titles and clues. Libre Franklin for everything functional, including grid letters.
- Copy: sentence case, no exclamation marks, no emoji. "14 Across" in prose, `14A` in chips. Answers in UPPERCASE.
- Night edition blocks are graphite (`#6e6b63`), not black, on purpose. Don't "fix" them.

## Changing tokens

Edit `tokens/tokens.json` (keep the list shape: `{ name, value: { light, dark }, usage }`), then:

```sh
node tokens/build-tokens.mjs tokens/tokens.json tokens
```

This rewrites `tokens.css` and `tokens.ts`. Text colours must hold 4.5:1 on the surfaces their usage note names, in **both** themes. Borders, focus rings and meaningful marks must hold 3:1. The v1 values were checked against those floors.

## Done checklist for any UI you build

- [ ] Renders correctly in both themes (`data-theme="light"` and `"dark"`).
- [ ] Every interactive element is keyboard-reachable with a visible `focus-ring`.
- [ ] No hex values or one-off colours in app code (grep for `#[0-9a-fA-F]{3,8}` outside `tokens/`).
- [ ] Any state shown by colour also has a shape or a word.
- [ ] Copy follows the voice rules in the brand book.
