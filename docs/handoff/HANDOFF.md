# Across: crossword builder handoff

You are building a production web app from a design prototype. Read this file first, then `design-system/README.md`, then the three files in `design/`.

## What's in this bundle

| Path | What it is |
|---|---|
| `design/Main.dc.html` | Landing page: animated hero grid, how it works, interactive 7×7 practice grid, assistant section, CTA |
| `design/Setup.dc.html` | Thin wrapper that opens the Builder on its setup screen |
| `design/Builder.dc.html` | The app: new-puzzle setup screen and the editor (grid, clue forms, NYT checks, assistant panel) |
| `design/canvas.json` | Canvas layout metadata only; ignore for the build |
| `design-system/README.md` | The Across design system: voice, color, type, layout and interaction rules. Follow it. |
| `design-system/tokens.json` | Every color (light "Newsprint" and dark "Night edition" themes), type style, spacing step, radius, cell size and stroke |

### About the `.dc.html` format
These are canvas prototype files, not production code. Markup sits inside `<x-dc>`. `{{name}}` holes, `<sc-for>` loops and `<sc-if>` branches are filled in by the `renderVals()` method of the `Component` class in the `<script type="text/x-dc">` block at the bottom of each file. Treat the markup as the spec for layout, copy and states. Treat the script as the spec for behavior. The **pure functions** at the top of the Builder script (`analyze`, `validate`, `makePuzzle`, `findActive`, `wordText`) are tested and can be ported almost as-is.

## Build target

- Vite + React + TypeScript; plain CSS or CSS modules driven by CSS variables generated from `tokens.json` (both themes).
- Routes: `/` (landing), `/new` (setup), `/puzzle/:id` (editor).
- Fonts: Newsreader + Libre Franklin from Google Fonts (link in the design-system README).

## Behavior to preserve

**Setup**
- Title, constructor name.
- Grid size: Mini 5×5, Daily 15×15, Sunday 21×21, Custom (3–25 each way).
- "Follow NYT submission guidelines" checkbox. When on, black squares always mirror, and a 15×15 grid asks Themed (78 words max) or Themeless (72); 21×21 is Sunday (140). Non-NYT sizes show a warning, not a block.
- Starting grid: sample pattern (5×5 and 15×15 only) or blank.

**Editor**
- Modes: Letters / Black squares. Mirror toggle (forced on with NYT rules).
- Keyboard on the focused grid: letters type and advance; Backspace clears then steps back; arrows move (perpendicular arrow first turns direction); Space turns direction (toggles a block in Black squares mode); `.` toggles a black square.
- Click the cursor square again to turn direction. Active square = `highlight` + inset ring; rest of word = `word` tint.
- Clue bar above the grid names the active entry, with ‹ › stepping.
- Auto-numbered Across / Down tabs; each entry shows its pattern, length and a clue input. Clues are keyed by start cell (`r-c-A`), so they survive renumbering.
- Checks panel (live): grid size, rotational symmetry, all-over interlock, no unchecked squares, every answer 3+ letters, word count vs limit, black squares (warning above 1/6 of the grid; this is a guideline, not an NYT rule), no repeated answers, every square filled, every answer clued. "Show" marks offending squares with a check-colored slash.
- Without NYT rules, only 3+ letters, repeats, filled and clued are checked.

**Assistant panel (currently faked; make it real)**
- Tasks: Suggest fill (pattern-match the active entry), Draft clues (house style, easy then tricky, "Use" applies), Explain checks (plain-language fixes plus "Show" buttons), Review clue style (answer in its own clue, blanks must be `___`, no `!`, unclued entries), plus free-text questions.
- In the prototype, fill comes from a ~350-word demo list and clues from a small built-in bank; free-text replies are placeholders. Replace with:
  - A server route that calls the Claude API with the grid, active entry, its crossings and failing checks as context. **Never expose the API key in the browser.**
  - A real crossword word list (with scores) for pattern fill. Keep this local and fast; use the model for ranking and clue writing.
- The assistant suggests; the user applies. It never edits the grid without a click.

**Landing page**
- Hero grid animation loops: black squares appear in mirrored pairs, numbers appear, the cursor types answers while the clue bar shows each clue, then four check chips pass. Stepped timing (140ms ticks, `steps()` easing), a Pause button, and a static final frame under `prefers-reduced-motion`.
- The practice grid uses the same `analyze()` logic as the editor.

## Not built yet
- Save / load (start with localStorage, then accounts).
- Export: `.puz` file and printable PDF (the Export button is inert).
- Dark theme toggle (tokens exist).
- Undo / redo, rebus squares, circled squares (`radius-circle` token exists).

## Quality bar
- Unit tests for `analyze` and `validate` (the sample 15×15 pattern in `Builder.dc.html` should pass every rule with 76 words and 32 black squares).
- Accessible: real buttons and labels, visible `focus-ring`, the grid is one focusable widget with arrow-key navigation, and color is never the only signal (follow the design-system README).
