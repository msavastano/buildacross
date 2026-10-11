# ClueList

One direction's clues — Across or Down — as a numbered, clickable list beside the grid.

- **Provide:** `direction` (or a custom `title`), `clues` (`[{number, text, done?}]`), `activeNumber` (the clue being solved: `word` fill), `crossingNumber` (the clue that crosses the cursor in the other direction: underlined), `onSelect(number)`.
- Use two lists side by side on wide screens, stacked under the grid on narrow ones.
- Solved clues (`done`) fade to `ink-muted`; don't strike them through.
- Numbers set in Libre Franklin bold; clue text in `clue`.
