Across is a design system for crossword puzzles and the products around them: a daily puzzle page, a solving app, an archive. It borrows from the newspaper puzzle page — ink on newsprint, square corners, a grid that does the talking — and adds just enough colour to show where the solver is.

**The one idea:** the grid is the hero. Everything else (clues, controls, chrome) is quieter than the black squares.

## Voice

Clues and interface copy are two different voices. Keep them apart.

**Clues** follow crossword house style:

- Match the answer's part of speech and tense: *Has dinner* → EATS, not *Dinner*.
- Fill-in-the-blank uses three underscores: *Speed ___* → LIMIT.
- A trailing question mark flags wordplay: *Hint at the end of a line?* → CLUE.
- "e.g." signals an example of a category: *Meters and grams, e.g.* → UNITS.
- Abbreviated clue → abbreviated answer. Never reuse an answer word in its own clue.
- Answers are written in uppercase whenever they appear in copy (CHINA, not “China”).

**Interface copy** is terse and plain, like a puzzle editor's note:

- Sentence case for buttons and headings: “Check puzzle”, “Reveal word”, “Clear square”.
- Name the scope in every check or reveal action: square, word, puzzle.
- Address the solver as “you”, sparingly. No exclamation marks, no emoji — even on the solved screen (“Solved in 4:12.”).
- Clue references are number + direction: “14 Across” in prose, `14A` in chips and tight space.
- Days of the week carry difficulty; say “Saturday puzzle”, not “Hard puzzle”.

## Color

Two themes: **Newsprint** (`light`, the default) and **Night edition** (`dark`).

- Page background is `paper`; white squares and raised panels are `cell`, always framed by a `grid-line` or `rule` hairline since they sit close to `paper`.
- Text is `ink` on `paper`, `cell` or `word`. Secondary text is `ink-muted`.
- Black squares are `block`. In Night edition they turn graphite (equal to `grid-line`) so they stay visible against dark cells — don't override them to pure black.
- The cursor (active square) is `highlight` with `on-highlight` letters and an inset `on-highlight` ring at `stroke-frame`. The rest of the active word, and the active clue, get the `word` tint.
- Feedback states always pair colour with a shape: wrong letters are `check` plus a slash; revealed letters are `reveal` plus a corner flag; pencil entries are `pencil` at weight 400. Inside the cursor, every mark switches to `on-highlight`.
- `check` (orange-red) and `reveal` (blue) were chosen to separate in lightness and across the blue–orange axis, never red vs green.
- `highlight` yellow is the brand's signature. Use it only for the cursor — never for buttons, banners or decoration.
- Links are `link` (an alias of `reveal`).

## Type

Two Google Fonts families, both loaded with one stylesheet link:

```html
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Libre+Franklin:wght@400;500;600;700&family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,600;1,6..72,400&display=swap">
```

- **Newsreader** (`--font-serif`) is the editorial voice: `display` for puzzle titles, `headline` for section heads, `clue` for every clue.
- **Libre Franklin** (`--font-sans`) is the newspaper grotesque for everything functional: `body`, `ui` for buttons, `label` (uppercase, tracked 0.1em) for ACROSS / DOWN, clue chips and the timer.
- Grid letters are Libre Franklin `cell-letter` (60% of the cell, weight 500) with `cell-number` at 25%. Scale both with the cell; never set grid letters in the serif.
- Use tabular figures (`font-variant-numeric: tabular-nums`) for the timer and stats.

## Layout and shape

- The grid is measured in cells: `cell-lg` (48px) for minis, `cell-md` (40px) by default, `cell-sm` (32px) for 15×15 grids at phone width.
- Lines between cells are `stroke-hair`; the outer frame is `stroke-frame`. Both in `grid-line`.
- Everything is square: `radius-none` for cells, grids, panels and the ClueBar; `radius-sm` only for buttons and chips; `radius-circle` only for circled squares.
- No elevation shadows. Separate things with hairlines (`rule`) and space (`space-6` between the grid and the clue lists, `space-8` between sections). The only shadow is `focus-ring`.
- Puzzle page layout: grid on the left with the ClueBar directly above it, Across and Down lists to its right. Below 720px, stack ClueBar, grid, then lists.

## Interaction

- Clicking a square selects it; clicking the cursor again turns direction. Arrows move, Space turns, Backspace clears then steps back.
- Keyboard focus is always visible: `focus-ring` is a 2px `paper` gap then a 2px `reveal` ring.
- The active word is always named in the ClueBar, so meaning never rests on the `word` tint alone.
- No motion beyond instant state changes. A solved puzzle simply locks and says so.

## Iconography and imagery

- There is no icon set and no logo yet. Set the name “Across” in Newsreader `display` wherever a mark would go.
- Controls are text labels. Where a glyph is unavoidable (clue stepping), use the typographic single guillemets ‹ › with an `aria-label`.
- No illustration or photography. The grid — black squares in a rotationally symmetric pattern — is the brand's only image.

## Components

Five React components live on `window.Across` (React 18 on the page): `Button`, `Cell`, `Grid`, `ClueBar` and `ClueList`, plus the `Across.numberGrid(solution)` helper. A `Grid`'s `onSelect` drives the `ClueBar` and the lists' `activeNumber`.
