import { useState } from 'react';
import { Button, Dialog } from '../design-system/across/components/src';

/** What "saved in this browser" means, in a few sentences. Shared by the dialog and Your puzzles. */
export function SavingFacts() {
  return (
    <>
      <p>Across saves your puzzles in this browser, on this device. Nothing is uploaded and there is no account.</p>
      <p>
        So your puzzles are not on your other devices or in other browsers, and they are lost if you clear this
        site’s data or work in a private window.
      </p>
      <p>
        To keep a copy, open Export puzzle and download a backup (.json). You can import it from Your puzzles in
        any browser.
      </p>
      <p>If you add your own Claude API key, it stays in this browser too and is only ever sent to Anthropic.</p>
    </>
  );
}

/** A quiet "How saving works" button that opens the explanation. */
export function SavingExplainerButton({ className }: { className?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" className={`text-btn${className ? ` ${className}` : ''}`} onClick={() => setOpen(true)}>
        How saving works
      </button>
      <Dialog
        open={open}
        title="Your puzzles stay in this browser"
        onClose={() => setOpen(false)}
        actions={<Button autoFocus onClick={() => setOpen(false)}>Close</Button>}
      >
        <SavingFacts />
      </Dialog>
    </>
  );
}
