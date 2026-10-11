/**
 * Assistant tasks that run locally, ported from the Builder prototype.
 * Fill suggestions and clue drafting need the server route and a word list; they come next.
 */
import { allWords, wordChip, wordLabel, wordText, type Analysis } from './grid';
import type { Check, CheckId } from './validate';

export type Chip =
  | { kind: 'flag'; id: CheckId; label: string }
  | { kind: 'goto'; key: string; label: string };

export interface AssistantMessage {
  role: 'ai' | 'you';
  text: string;
  chips?: Chip[];
}

export const INTRO: AssistantMessage = {
  role: 'ai',
  text: 'Select an entry, then pick a task. I can see your crossings and which checks fail.',
};

export function explainChecks(checks: Check[]): AssistantMessage {
  const bad = checks.filter((c) => c.status === 'fail' || c.status === 'warn');
  if (!bad.length) {
    const todo = checks.filter((c) => c.status === 'todo');
    return {
      role: 'ai',
      text: todo.length
        ? `Every rule passes. Still to do: ${todo.map((c) => `${c.label.toLowerCase()} (${c.detail})`).join('; ')}.`
        : 'Every check passes. This grid is ready to submit.',
    };
  }
  return {
    role: 'ai',
    text: bad.map((c) => `${c.label}: ${c.why}`).join('\n\n'),
    chips: bad.filter((c) => c.cells.length).map((c) => ({ kind: 'flag', id: c.id, label: `Show ${c.label.toLowerCase()}` })),
  };
}

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export function reviewClueStyle(g: string[], m: Analysis, clues: Record<string, string>): AssistantMessage {
  const notes: string[] = [];
  const chips: Chip[] = [];
  let empty = 0;
  let written = 0;
  for (const w of allWords(m)) {
    const clue = (clues[w.key] || '').trim();
    const t = wordText(g, w);
    const label = wordLabel(w);
    if (!clue) {
      if (!t.includes('?')) empty++;
      continue;
    }
    written++;
    let issue = '';
    if (!t.includes('?') && new RegExp(`\\b${escapeRe(t)}\\b`, 'i').test(clue)) issue = `${label} uses its own answer, ${t}, in the clue.`;
    else if (/_/.test(clue) && !/(^|[^_])___([^_]|$)/.test(clue)) issue = `${label}: blanks take exactly three underscores, ___.`;
    else if (/!/.test(clue)) issue = `${label}: skip exclamation marks in clues.`;
    if (issue) {
      notes.push(issue);
      chips.push({ kind: 'goto', key: w.key, label: wordChip(w) });
    }
  }
  const head = `${written} ${written === 1 ? 'clue' : 'clues'} written.` +
    (empty ? ` ${empty} filled ${empty === 1 ? 'entry still needs' : 'entries still need'} a clue.` : '');
  return {
    role: 'ai',
    text: notes.length ? `${head}\n\n${notes.slice(0, 6).join('\n')}` : `${head} No style problems found.`,
    chips: chips.slice(0, 6),
  };
}
