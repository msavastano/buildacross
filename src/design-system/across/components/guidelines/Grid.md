# Grid

A playable crossword grid: give it the solution and it numbers itself, tracks the cursor and active word, and takes keyboard input.

- **Provide:** `solution` (array of equal-length strings, `#` for black squares), optionally `entries` (same shape: `.` empty, UPPERCASE pen, lowercase pencil), `marks` (`{"row,col": "wrong" | "revealed"}`), `circles` (`["row,col"]`), `active` (`{row, col, direction}`), `size`, `pencilMode`, `readOnly`, `label`.
- **Callbacks:** `onSelect({number, direction, row, col, length})` whenever the active word changes — wire it to `ClueBar` and `ClueList`; `onChange(entries)` after every keystroke.
- **Keyboard:** letters fill and advance; Backspace clears then steps back; arrows move (an arrow across the current direction turns first); Space turns.
- Lines are `grid-line` at `stroke-hair`, the frame `stroke-frame`. Never add rounding, shadows or a coloured frame.
- `Across.numberGrid(solution)` returns the numbering and the across/down word lists if you need them outside the grid.
