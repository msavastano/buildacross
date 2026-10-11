# Across

Crossword construction web app. Vite + React 18 + TypeScript, react-router, plain CSS on design tokens, Vitest.

- `npm run dev` · `npm test` · `npm run typecheck` · `npm run build`
- Routes: `/` landing, `/new` setup, `/puzzles` saved puzzles, `/puzzle/:id` editor, `/puzzle/:id/settings`, `/puzzle/:id/print`.
- Pure logic lives in `src/lib` (`grid.ts` analyze/numbering, `validate.ts` checks, `puz.ts` Across Lite export, `storage.ts` localStorage, `wordlist.ts` fill matching, `assistantContext.ts` what the assistant sees). Keep it UI-free and tested.
- The assistant route is `server/assistant.ts` (prompts in `server/prompts.ts`), served by `api/assistant.ts` on Vercel and by the Vite plugin in dev. `ANTHROPIC_API_KEY` stays server-side; never read it in `src/`.
- Assistant-placed letters are pencil (`Puzzle.pencil`) until the constructor types over them or inks them in.
- Submission rules live only in `src/lib/rules.ts`, with their source link.
- The original design handoff (prototype `.dc.html` files) is in `docs/handoff/`; the design system is in `src/design-system/across/`.

## UI rules (Across design system)

Full context: `src/design-system/across/HANDOFF.md`, `brand/brand-book.md`, `components/guidelines/`.

- Style only with the CSS variables from `src/design-system/across/tokens/tokens.css`. No raw hex in app code. If a value is missing, add it to `tokens/tokens.json` with a usage note and run `npm run tokens`.
- Reuse `Button`, `Cell`, `Grid`, `ConstructGrid`, `ClueBar`, `ClueList` and `numberGrid` before writing new UI. New components get a file in `components/guidelines/`.
- `--highlight` (yellow) marks the cursor square only.
- Never use colour alone for meaning. Pair it with a shape or a word (ring, slash, corner flag, label).
- Corners are square. Only buttons and chips get `--radius-sm`; only circled squares get `--radius-circle`.
- No shadows except `--focus-ring`. Every focusable element shows it on `:focus-visible`.
- Fonts: Newsreader for titles and clues; Libre Franklin for everything else, grid letters included.
- Copy: sentence case, no exclamation marks, no emoji. "14 Across" in prose, `14A` in chips. Answers in UPPERCASE.
- Check both themes (`data-theme="light"` / `"dark"`) before calling UI work done.
- No motion on the setup and editor screens. The landing hero animates (stepped, with Pause and a static frame under reduced motion).
