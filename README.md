# Across

A workbench for crossword constructors: pick a grid size, place mirrored black squares, write every clue beside its entry, and check the puzzle against NYT submission rules as you build.

## Run it

```sh
npm install
npm run dev        # http://localhost:5173
npm test           # Vitest: grid analysis, checks, .puz export, fill matching, assistant route
npm run typecheck
npm run build      # static site in dist/
```

For clue drafts and questions, put a Claude API key in `.env.local` (git ignores it) and restart `npm run dev`:

```sh
ANTHROPIC_API_KEY=sk-ant-...
```

Without a key everything else works, including fill suggestions.

## Deploy (Vercel)

Import the repository in Vercel; `vercel.json` sets the Vite build, the `api/assistant.ts` function and the rewrite that sends every page path to `index.html`. Add `ANTHROPIC_API_KEY` under Project settings, Environment variables. The key only lives on the server; the browser talks to `/api/assistant`.

There are no accounts yet, so anyone who can open the site can spend API credit through the assistant. Keep the deployment private (Vercel deployment protection) or watch usage until sign-in exists.

## What's here

- **Landing** (`/`): animated hero grid (pause button, static under reduced motion), how it works, a 7 × 7 practice grid scored by the same rules as the editor.
- **New puzzle** (`/new`): title, constructor, size (5 × 5, 15 × 15, 21 × 21, custom 3–25), NYT rules with puzzle type, sample or blank start.
- **Editor** (`/puzzle/:id`): Letters and Black squares modes, mirroring, keyboard entry, clue bar, Across and Down clue lists keyed by start square, live checks with "Show" marks, an assistant panel, export to `.puz`, a print view and a JSON backup.
- **Assistant** (editor side panel): *Suggest fill* matches the selected entry against a scored word list in the browser and keeps only words that leave every crossing an answer; a placed word goes in as pencil until you type over it or ink it in. *Draft clues* asks Claude for an easy and a tricky clue, each with a Use button. *Explain checks* and *Review clue style* run locally. The text box asks Claude anything about the puzzle; it sees the grid, every entry and clue, the selected entry with its crossings and the failing checks.
- **Your puzzles** (`/puzzles`): everything saved in this browser, with delete and import from a backup.
- Newsprint and Night edition themes; the choice is remembered per browser.

## Not built yet

Accounts and cloud saving, undo and redo, rebus and circled squares, and an on-screen keyboard for phones.

## Layout

- `src/lib`: pure logic (`grid.ts`, `validate.ts`, `rules.ts`, `puz.ts`, `storage.ts`, `wordlist.ts`, `assistant.ts`, `assistantContext.ts`) with tests.
- `server/assistant.ts`: the assistant route (Claude API, `claude-opus-5-5`, with the API's default fallback model if a request is declined). `api/assistant.ts` exposes it on Vercel; `vite.config.ts` mounts it for `npm run dev` and `npm run preview`.
- `public/wordlist.txt`: the [Collaborative Word List](https://github.com/Crossword-Nexus/collaborative-word-list) by Crossword Nexus (MIT License, `public/wordlist-LICENSE.txt`), words scored 30 or more. Rebuild with `node scripts/build-wordlist.mjs`.
- `src/pages`, `src/components`: the app.
- `src/design-system/across`: the Across design system (tokens, components, brand book). `ConstructGrid` is the builder's grid, added on top of the v1 system.
- `docs/handoff`: the original design prototype and handoff notes.

Submission rules live in `src/lib/rules.ts` with a link to the source. They were taken from the design handoff and should be checked against the NYT page before relying on them.
