import { useState, type FormEvent } from 'react';
import { Button, Dialog } from '../design-system/across/components/src';

export const REBUS_MAX = 8;
const VALID = new RegExp(`^[A-Z0-9]{1,${REBUS_MAX}}$`);

interface Props {
  /** the square being edited, or null when closed */
  at: { row: number; col: number; value: string } | null;
  onSave: (value: string) => void;
  onClose: () => void;
}

/** Collects the letters for a rebus square: several letters (or digits) solvers enter in one square. */
export function RebusDialog({ at, onSave, onClose }: Props) {
  return (
    <Dialog open={!!at} title="Rebus square" onClose={onClose}>
      {at && <RebusForm at={at} onSave={onSave} onClose={onClose} />}
    </Dialog>
  );
}

function RebusForm({ at, onSave, onClose }: { at: NonNullable<Props['at']>; onSave: Props['onSave']; onClose: Props['onClose'] }) {
  const [v, setV] = useState(at.value);
  const [error, setError] = useState('');

  function submit(e: FormEvent) {
    e.preventDefault();
    const t = v.trim().toUpperCase();
    if (!VALID.test(t)) { setError(`Use 1 to ${REBUS_MAX} letters or digits, with no spaces.`); return; }
    onSave(t);
  }

  return (
    <form className="key-form" onSubmit={submit}>
      <p>
        Type everything that goes in row {at.row}, column {at.col}, such as STAR or HEART. Both entries through the
        square use all of it.
      </p>
      <label className="field">
        Letters
        <input className="input" type="text" value={v} autoFocus autoComplete="off" spellCheck={false}
          maxLength={REBUS_MAX} style={{ textTransform: 'uppercase' }}
          aria-invalid={!!error} aria-describedby={error ? 'rebus-error' : undefined}
          onChange={(e) => { setV(e.target.value.replace(/[^a-zA-Z0-9]/g, '')); setError(''); }} />
      </label>
      {error && <p id="rebus-error" className="notice" role="alert">{error}</p>}
      <div className="ac-dialog__actions">
        {at.value && <Button variant="quiet" className="push-left" onClick={() => onSave('')}>Clear square</Button>}
        <Button onClick={onClose}>Cancel</Button>
        <Button type="submit" variant="primary" disabled={!v.trim()}>Save</Button>
      </div>
    </form>
  );
}
