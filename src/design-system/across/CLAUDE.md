# UI rules: Across design system

All UI in this app uses the Across design system. Paths below are relative to the design-system folder (e.g. `src/design-system/across/`); adjust them if you move this file to the repo root. Full context is in `HANDOFF.md`; voice and visual rules are in `brand/brand-book.md`; component rules are in `components/guidelines/`.

- Style only with the CSS variables from `tokens/tokens.css` (`var(--paper)`, `var(--space-4)`, …). Never write raw hex or px values that a token already covers. If a value is missing, add it to `tokens/tokens.json` with a usage note and run `node tokens/build-tokens.mjs tokens/tokens.json tokens`.
- Reuse `Button`, `Cell`, `Grid`, `ClueBar`, `ClueList` and `numberGrid` from `components/src` before writing new UI. New components follow the same rules and get a file in `components/guidelines/`.
- `--highlight` (yellow) marks the cursor square only.
- Never use colour alone for meaning. Pair it with a shape or a word (ring, slash, corner flag, label).
- Corners are square (`--radius-none`). Only buttons and chips get `--radius-sm`. Only circled squares get `--radius-circle`.
- No shadows except `--focus-ring`. Every focusable element shows it on `:focus-visible`.
- Fonts: Newsreader (`--font-serif`) for titles and clues; Libre Franklin (`--font-sans`) for everything else, grid letters included.
- Copy: sentence case, no exclamation marks, no emoji. "14 Across" in prose, `14A` in chips. Answers in UPPERCASE.
- Check both themes (`data-theme="light"` / `"dark"`) before calling UI work done.
- `Grid` is uncontrolled in v1. Remount it with a `key` when the grid size changes. See "Known limits" in `HANDOFF.md`.
