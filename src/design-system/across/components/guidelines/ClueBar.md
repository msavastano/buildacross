# ClueBar

The active clue, shown in one line directly above or below the grid so the solver never has to look away.

- **Provide:** `number`, `direction` (`across` | `down`), the clue text as children, and optional `onPrev` / `onNext` to step through clues.
- The chip reads `14A` / `3D` in `label` style on an `ink` fill; the clue sets in `clue` (Newsreader) on the `word` tint, so it visibly belongs to the highlighted squares.
- It announces politely to screen readers; keep it the single source of truth for which word is active.
- Clue text follows the house style (see the brand book): `___` for blanks, a trailing `?` for wordplay.
