/**
 * Assistant messages. Explain checks, Review clue style and Suggest fill run in the browser;
 * clue drafts and questions go to the server route (src/lib/assistantApi.ts).
 */
import type { CluesResult } from './assistantContext';
import { clueToPlain } from './clueFormat';
import { allWords, wordChip, wordLabel, wordText, type Analysis, type Word } from './grid';
import type { Check, CheckId } from './validate';
import type { FillSuggestions } from './wordlist';

export type Chip =
  | { kind: 'flag'; id: CheckId; label: string }
  | { kind: 'goto'; key: string; label: string }
  /** write the word into the entry's squares as pencil */
  | { kind: 'place'; key: string; word: string; label: string }
  /** turn the entry's pencil letters into pen */
  | { kind: 'ink'; key: string; label: string }
  /** set the entry's clue */
  | { kind: 'clue'; key: string; text: string; label: string };

export interface AssistantMessage {
  role: 'ai' | 'you';
  text: string;
  chips?: Chip[];
}

export const INTRO: AssistantMessage = {
  role: 'ai',
  text: 'Select an entry, then pick a task or ask a question. I can see your crossings and which checks fail.',
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
    const clue = clueToPlain(clues[w.key] || '').trim();
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

const plural = (n: number, one: string, many: string) => `${n.toLocaleString('en-US')} ${n === 1 ? one : many}`;

export function fillMessage(w: Word, s: FillSuggestions): AssistantMessage {
  const label = wordLabel(w);
  if (s.rebus) {
    return { role: 'ai', text: `${label} has a rebus square. Fill suggestions only cover entries with one letter per square.` };
  }
  if (s.full) {
    return { role: 'ai', text: `${label} is full: ${s.pattern}. Clear the letters you want to change, then ask again.` };
  }
  if (!s.matches) {
    return { role: 'ai', text: `No word in the list fits ${label}, ${s.pattern}. Try changing a crossing or moving a black square.` };
  }
  if (!s.viable.length) {
    return {
      role: 'ai',
      text: `${plural(s.matches, 'word fits', 'words fit')} ${label}, ${s.pattern}, but each one leaves a crossing with no answer in the list. Try changing a crossing.`,
    };
  }
  return {
    role: 'ai',
    text: `${plural(s.matches, 'word fits', 'words fit')} ${label}, ${s.pattern}. Here are the best scored that keep every crossing workable. A placed word goes in as pencil.`,
    chips: s.viable.map((v) => ({ kind: 'place', key: w.key, word: v.word, label: v.word })),
  };
}

export function cluesMessage(w: Word, answer: string, c: CluesResult): AssistantMessage {
  return {
    role: 'ai',
    text: `Two drafts for ${wordLabel(w)}, ${answer}.\n\nEasy: ${c.easy}\nTricky: ${c.tricky}`,
    chips: [
      { kind: 'clue', key: w.key, text: c.easy, label: 'Use easy' },
      { kind: 'clue', key: w.key, text: c.tricky, label: 'Use tricky' },
    ],
  };
}
