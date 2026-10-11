# Button

Text-only actions for the puzzle toolbar and dialogs: one `primary` per view, `secondary` for the rest, `quiet` for toggles like Pencil.

- **Provide:** `variant` (`primary` | `secondary` | `quiet`, default `secondary`), a short label as children, and any `<button>` attribute (`onClick`, `disabled`, `aria-pressed` for toggles).
- **Labels** are sentence-case verbs naming the scope: “Check puzzle”, “Reveal word”, “Clear square”. No icons, no exclamation marks.
- **Primary** is an `ink` fill with `on-ink` text — use it for the one action that moves the solve forward (Check puzzle, Start).
- **Quiet** is an underlined text action; pair a toggle with `aria-pressed`.
- Focus shows the `focus-ring`. Don't round corners past `radius-sm`.
