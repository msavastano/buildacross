import { useState, type FormEvent } from 'react';
import { Button, Dialog } from '../design-system/across/components/src';
import { looksLikeKey } from '../lib/apiKey';
import { checkOwnKey } from '../lib/assistantApi';

interface Props {
  open: boolean;
  /** the key in use now, if any */
  current: string;
  remembered: boolean;
  onSave: (key: string, remember: boolean) => void;
  onRemove: () => void;
  onClose: () => void;
}

/** Lets the constructor use their own Claude API key when the server has none. */
export function ApiKeyDialog(props: Props) {
  // Remount the form each time the dialog opens so it starts from the saved state.
  return (
    <Dialog open={props.open} title="Use your own Claude API key" onClose={props.onClose}>
      {props.open && <KeyForm {...props} />}
    </Dialog>
  );
}

function KeyForm({ current, remembered, onSave, onRemove, onClose }: Props) {
  const [key, setKey] = useState(current);
  const [remember, setRemember] = useState(remembered);
  const [error, setError] = useState('');
  const [checking, setChecking] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    const k = key.trim();
    if (!looksLikeKey(k)) { setError('That does not look like a Claude API key. Keys start with sk-ant-.'); return; }
    setChecking(true);
    setError('');
    const problem = await checkOwnKey(k);
    setChecking(false);
    if (problem) { setError(problem); return; }
    onSave(k, remember);
  }

  return (
    <form className="key-form" onSubmit={submit}>
      <p>
        This site has no Claude API key of its own, so clue drafts and questions can use yours. Requests go from this
        browser straight to Anthropic and are billed to your Anthropic account. Across’s server never sees the key.
      </p>
      <p>
        Create a key in the <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noreferrer">Claude Console</a>.
      </p>
      <label className="field">
        API key
        <input className="input" type="password" autoComplete="off" spellCheck={false} placeholder="sk-ant-…"
          value={key} autoFocus onChange={(e) => { setKey(e.target.value); setError(''); }}
          aria-invalid={!!error} aria-describedby={error ? 'key-error' : undefined} />
      </label>
      <label className="check plain">
        <input type="checkbox" checked={remember} onChange={() => setRemember(!remember)} />
        Remember on this browser
      </label>
      <p className="muted" style={{ fontSize: 13, lineHeight: '18px' }}>
        {remember
          ? 'The key stays in this browser until you remove it. Anyone using this browser profile could read it.'
          : 'The key is forgotten when you close this tab.'}
      </p>
      {error && <p id="key-error" className="notice" role="alert">{error}</p>}
      <div className="ac-dialog__actions">
        {current && <Button variant="quiet" className="push-left" onClick={onRemove}>Remove key</Button>}
        <Button onClick={onClose}>Cancel</Button>
        <Button type="submit" variant="primary" disabled={checking || !key.trim()}>
          {checking ? 'Checking key' : 'Save key'}
        </Button>
      </div>
    </form>
  );
}
