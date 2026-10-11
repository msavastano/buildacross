# Across

A workbench for crossword constructors: pick a grid size, place mirrored black squares, write every clue beside its entry, and check the puzzle against NYT submission rules as you build.

## Run it

```sh
npm install
npm run dev        # http://localhost:5173
npm test           # Vitest: grid analysis, checks, .puz export, clue style review
npm run typecheck
npm run build      # static site in dist/
```

The app is a static single-page site. When deploying, route every path to `index.html` so `/new` and `/puzzle/:id` load directly.

## What's here

- **Landing** (`/`): animated hero grid (pause button, static under reduced motion), how it works, a 7 × 7 practice grid scored by the same rules as the editor.
- **New puzzle** (`/new`): title, constructor, size (5 × 5, 15 × 15, 21 × 21, custom 3–25), NYT rules with puzzle type, sample or blank start.
- **Editor** (`/puzzle/:id`): Letters and Black squares modes, mirroring, keyboard entry, clue bar, Across and Down clue lists keyed by start square, live checks with "Show" marks, an assistant panel (explain checks, review clue style), export to `.puz`, a print view and a JSON backup.
- **Your puzzles** (`/puzzles`): everything saved in this browser, with delete and import from a backup.
- Newsprint and Night edition themes; the choice is remembered per browser.

## Not built yet

The assistant's fill suggestions, clue drafts and free-text questions (needs a server route to the Claude API and a scored word list), accounts and cloud saving, undo and redo, rebus and circled squares, and an on-screen keyboard for phones.

## Layout

- `src/lib`: pure logic (`grid.ts`, `validate.ts`, `rules.ts`, `puz.ts`, `storage.ts`, `assistant.ts`) with tests.
- `src/pages`, `src/components`: the app.
- `src/design-system/across`: the Across design system (tokens, components, brand book). `ConstructGrid` is the builder's grid, added on top of the v1 system.
- `docs/handoff`: the original design prototype and handoff notes.

Submission rules live in `src/lib/rules.ts` with a link to the source. They were taken from the design handoff and should be checked against the NYT page before relying on them.
