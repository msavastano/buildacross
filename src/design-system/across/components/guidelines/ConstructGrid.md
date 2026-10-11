# ConstructGrid

The builder's grid. Unlike `Grid` (the solver), it is **controlled**: the parent owns the squares, the cursor and the direction, and the grid reports every change.

- **Provide:** `rows`, `cols`, `grid` (flat row-major array: `#` black, `''` empty, `A`–`Z`), `cursor` (flat index), `direction` (`across` | `down`), `mode` (`letters` | `blocks`), `mirror`, optionally `marks` (flat indexes to slash), `size`, `label`.
- **Callbacks:** `onChange(grid)` after any edit; `onCursorChange(cursor, direction)` after any move or turn. Derive the active word and the ClueBar from the same state.
- **Keyboard:** letters type and advance; Backspace clears then steps back; arrows move (in Letters mode a perpendicular arrow turns first); Space turns, or toggles a black square in Black squares mode; `.` toggles a black square in either mode; Enter toggles in Black squares mode. Clicking the cursor again turns direction; in Black squares mode a click toggles.
- **Mirroring** toggles the 180° partner with every black square. Turn it on whenever submission rules ask for symmetry.
- **Cursor on a black square** keeps the `block` fill with an inset `highlight` ring (`ac-cell--cursor`). Black squares never get a new colour.
- **Marks** use the `wrong` slash: `check` on white squares, `on-ink` on black squares so it reads on `block`. Always pair them with the check that explains them.
- The grid is one focusable widget (`tabIndex=0`, focus ring on `:focus-visible`); squares are not tab stops. A polite live region names the cursor square and its entry.
- Cell size: `lg` up to 7 squares across, `md` up to 15, `sm` beyond and for 15 × 15 at phone width.
