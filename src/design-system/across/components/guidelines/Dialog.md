# Dialog

A modal for decisions and short explanations that need the person's full attention: confirming something that cannot be undone, or settings that change how the app talks to the outside world. Built on the native `<dialog>` element, so focus stays inside, Escape closes it and focus returns to the opener.

- **Provide:** `open`, `title` (sentence case), `onClose` (called on Escape, a backdrop click, and from your own Cancel), `children` for the body, `actions` for the buttons.
- **Actions:** right-aligned `Button`s. Name the result, not "OK": "Delete puzzle", "Clear letters", "Save key". The safe choice is `secondary` and gets `autoFocus`; at most one `primary`.
- **Destructive confirms** say what is lost and what stays ("Black squares and clues stay.") in one or two sentences.
- **Look:** `cell` sheet with a `stroke-frame` `ink` border over the `scrim` backdrop. Square corners, no shadow, title in Newsreader.
- **Don't** use a dialog for routine status; use an inline notice. Never stack two dialogs.
