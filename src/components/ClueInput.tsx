import { useLayoutEffect, useRef, type ClipboardEvent, type KeyboardEvent } from 'react';
import { parseClue, serializeClue, type ClueRun } from '../lib/clueFormat';

/** Reads an editable element back into clue runs: <i>/<em> italic, <b>/<strong> bold, all else text. */
export function domToRuns(root: Node): ClueRun[] {
  const runs: ClueRun[] = [];
  const walk = (n: Node, i: boolean, b: boolean) => {
    if (n.nodeType === Node.TEXT_NODE) {
      const text = (n.textContent ?? '').replace(/ /g, ' ').replace(/[\r\n]+/g, ' ');
      if (text) runs.push({ text, i, b });
      return;
    }
    if (!(n instanceof HTMLElement)) return;
    const tag = n.tagName;
    if (tag === 'BR') return;
    const style = n.style;
    const ni = i || tag === 'I' || tag === 'EM' || style.fontStyle === 'italic';
    const nb = b || tag === 'B' || tag === 'STRONG' || style.fontWeight === 'bold' || Number(style.fontWeight) >= 600;
    n.childNodes.forEach((c) => walk(c, ni, nb));
    if ((tag === 'DIV' || tag === 'P') && n.nextSibling) runs.push({ text: ' ', i: false, b: false });
  };
  root.childNodes.forEach((c) => walk(c, false, false));
  return runs;
}

export function applyFormat(cmd: 'italic' | 'bold') {
  // execCommand is deprecated but remains the only way to toggle formatting on a selection
  // inside contentEditable without writing an editor; every current browser supports it.
  document.execCommand(cmd);
}

interface Props {
  value: string;
  onChange: (v: string) => void;
  onFocus?: () => void;
  label: string;
  placeholder?: string;
}

/**
 * A one-line clue field that keeps italic and bold. Ctrl or Cmd + I and B toggle them; the
 * clue list's Italic and Bold buttons do the same for whichever field has focus.
 */
export function ClueInput({ value, onChange, onFocus, label, placeholder }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const shown = useRef<string | null>(null);

  // Only rewrite the DOM when the value changed from outside, so the caret stays put while typing.
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || value === shown.current) return;
    el.innerHTML = serializeClue(parseClue(value));
    shown.current = value;
  }, [value]);

  function read() {
    const el = ref.current;
    if (!el) return;
    const v = serializeClue(domToRuns(el)).replace(/^\s+/, '');
    if (!v && el.innerHTML) el.innerHTML = ''; // drop a stray <br> so the placeholder shows
    shown.current = v;
    if (v !== value) onChange(v);
  }

  function onKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if (e.key === 'Enter') { e.preventDefault(); return; }
    if (e.metaKey || e.ctrlKey) {
      const k = e.key.toLowerCase();
      if (k === 'i' || k === 'b') { e.preventDefault(); applyFormat(k === 'i' ? 'italic' : 'bold'); read(); }
      else if (k === 'u') e.preventDefault();
    }
  }

  function onPaste(e: ClipboardEvent<HTMLDivElement>) {
    e.preventDefault();
    const text = e.clipboardData.getData('text/plain').replace(/[\r\n]+/g, ' ');
    document.execCommand('insertText', false, text);
  }

  return (
    <div
      ref={ref}
      className="input input--serif clue-input"
      role="textbox"
      aria-label={label}
      aria-multiline="false"
      contentEditable
      suppressContentEditableWarning
      spellCheck
      data-placeholder={placeholder}
      onInput={read}
      onBlur={read}
      onKeyDown={onKeyDown}
      onPaste={onPaste}
      onFocus={onFocus}
    />
  );
}
