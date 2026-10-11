# Cell

One square of the grid — the system's atom — in any of its states: empty, pen, pencil, active, in the active word, wrong, revealed, circled or black.

- **Provide:** `letter` (one uppercase letter, or a short rebus), `number` (the clue number, if the square starts a word), `state` (`empty` | `active` | `word` | `block`), `mark` (`wrong` | `revealed`), `pencil`, `circled`, `size` (`sm` | `md` | `lg` → `cell-sm`/`cell-md`/`cell-lg`).
- **Standalone** a Cell draws its own `stroke-hair` border; inside `Grid` (`inGrid`) the grid's gap draws the lines instead.
- **Never colour alone:** `active` adds an inset `on-highlight` ring, `wrong` adds a slash, `revealed` adds a corner flag, pencil drops to weight 400.
- Inside the active cell every mark switches to `on-highlight` so it reads on yellow.
- Letters are always uppercase; numbers sit top-left at 25% of the cell.
