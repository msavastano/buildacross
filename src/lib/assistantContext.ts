/**
 * What the browser sends to the assistant route, and the checks the server runs on it.
 * Shared by the editor (src/pages/Editor.tsx) and the server (server/assistant.ts).
 */
import { clueToPlain } from './clueFormat';
import { allWords, wordChip, wordLabel, wordText, type Analysis, type Word } from './grid';
import type { Check } from './validate';

export interface EntryContext {
  /** "14A" */
  chip: string;
  /** "14 Across" */
  label: string;
  /** letters with '?' for empty squares */
  pattern: string;
  clue: string;
}

export interface PuzzleContext {
  title: string;
  rows: number;
  cols: number;
  /** one string per row: '#' black, '.' empty, A–Z letter, '*' rebus square */
  grid: string[];
  /** rebus squares, "Row 3, column 5: STAR" */
  rebus: string[];
  nyt: boolean;
  puzzleType: string;
  entries: EntryContext[];
  active: (EntryContext & { crossings: EntryContext[] }) | null;
  /** failing or warning checks, "Label: detail" */
  failing: string[];
}

export interface HistoryItem {
  role: 'you' | 'ai';
  text: string;
}

export type AssistantRequest =
  | { task: 'clues'; context: PuzzleContext }
  | { task: 'ask'; context: PuzzleContext; question: string; history: HistoryItem[] };

export interface CluesResult { easy: string; tricky: string }

export type AssistantResponse =
  | { task: 'clues'; clues: CluesResult }
  | { task: 'ask'; text: string }
  | { refused: true; text: string }
  | { error: string };

export const LIMITS = {
  maxDim: 25,
  clue: 300,
  title: 200,
  question: 1000,
  historyItems: 8,
  historyText: 2000,
  failing: 20,
  rebus: 100,
  pattern: 200,
} as const;

function entry(g: string[], w: Word, clues: Record<string, string>): EntryContext {
  return { chip: wordChip(w), label: wordLabel(w), pattern: wordText(g, w), clue: clueToPlain(clues[w.key] || '').trim().slice(0, LIMITS.clue) };
}

export function buildContext(
  p: { title: string; rows: number; cols: number; grid: string[]; clues: Record<string, string>; nyt: boolean },
  puzzleType: string,
  m: Analysis,
  active: Word | null,
  checks: Check[],
): PuzzleContext {
  const { rows, cols, grid: g, clues } = p;
  const lines: string[] = [];
  const rebus: string[] = [];
  for (let r = 0; r < rows; r++) {
    lines.push(g.slice(r * cols, (r + 1) * cols).map((v) => (v.length > 1 ? '*' : v || '.')).join(''));
  }
  g.forEach((v, i) => {
    if (v.length > 1 && v !== '#') rebus.push(`Row ${Math.floor(i / cols) + 1}, column ${(i % cols) + 1}: ${v}`);
  });
  let act: PuzzleContext['active'] = null;
  if (active) {
    const crossers = active.dir === 'A' ? m.down : m.across;
    const crossings = active.cells
      .map((cell) => crossers.find((x) => x.cells.includes(cell)))
      .filter((x): x is Word => !!x)
      .map((x) => entry(g, x, clues));
    act = { ...entry(g, active, clues), crossings };
  }
  return {
    title: p.title.slice(0, LIMITS.title),
    rows,
    cols,
    grid: lines,
    rebus: rebus.slice(0, LIMITS.rebus),
    nyt: p.nyt,
    puzzleType,
    entries: allWords(m).map((w) => entry(g, w, clues)),
    active: act,
    failing: checks
      .filter((c) => c.status === 'fail' || c.status === 'warn')
      .map((c) => `${c.label}: ${c.detail}`)
      .slice(0, LIMITS.failing),
  };
}

// ---- validation (server side) -------------------------------------------------------------

const isObj = (x: unknown): x is Record<string, unknown> => typeof x === 'object' && x !== null && !Array.isArray(x);
const str = (x: unknown, max: number): x is string => typeof x === 'string' && x.length <= max;
const CHIP = /^\d{1,3}[AD]$/;
const LABEL = /^\d{1,3} (Across|Down)$/;
const PATTERN = /^[A-Z0-9?]{1,200}$/;

function isEntry(x: unknown): x is EntryContext {
  return isObj(x) && str(x.chip, 4) && CHIP.test(x.chip) && str(x.label, 10) && LABEL.test(x.label)
    && str(x.pattern, LIMITS.pattern) && PATTERN.test(x.pattern) && str(x.clue, LIMITS.clue);
}

function contextError(c: unknown): string | null {
  if (!isObj(c)) return 'context is missing';
  const { rows, cols } = c;
  if (typeof rows !== 'number' || typeof cols !== 'number' || !Number.isInteger(rows) || !Number.isInteger(cols)
    || rows < 1 || cols < 1 || rows > LIMITS.maxDim || cols > LIMITS.maxDim) return 'grid size is out of range';
  if (!str(c.title, LIMITS.title) || !str(c.puzzleType, 40) || typeof c.nyt !== 'boolean') return 'puzzle details are malformed';
  if (!Array.isArray(c.grid) || c.grid.length !== rows
    || !c.grid.every((row) => typeof row === 'string' && row.length === cols && /^[A-Z0-9.#*]+$/.test(row))) return 'grid is malformed';
  if (!Array.isArray(c.rebus) || c.rebus.length > LIMITS.rebus || !c.rebus.every((x) => str(x, 60))) return 'rebus squares are malformed';
  if (!Array.isArray(c.entries) || c.entries.length > 2 * rows * cols || !c.entries.every(isEntry)) return 'entries are malformed';
  if (c.active !== null) {
    const a = c.active;
    if (!isEntry(a) || !isObj(a) || !Array.isArray(a.crossings) || a.crossings.length > LIMITS.maxDim
      || !a.crossings.every(isEntry)) return 'selected entry is malformed';
  }
  if (!Array.isArray(c.failing) || c.failing.length > LIMITS.failing || !c.failing.every((f) => str(f, 300))) return 'checks are malformed';
  return null;
}

/** Returns the request, or a short reason it was rejected. */
export function parseAssistantRequest(body: unknown): AssistantRequest | string {
  if (!isObj(body)) return 'request body must be a JSON object';
  const err = contextError(body.context);
  if (err) return err;
  const context = body.context as unknown as PuzzleContext;
  if (body.task === 'clues') {
    if (!context.active) return 'select an entry first';
    if (context.active.pattern.includes('?')) return 'the selected entry has empty squares';
    return { task: 'clues', context };
  }
  if (body.task === 'ask') {
    const q = body.question;
    if (typeof q !== 'string' || !q.trim() || q.length > LIMITS.question) return 'question is missing or too long';
    const h = body.history ?? [];
    if (!Array.isArray(h) || h.length > LIMITS.historyItems
      || !h.every((x) => isObj(x) && (x.role === 'you' || x.role === 'ai') && str(x.text, LIMITS.historyText))) return 'history is malformed';
    return { task: 'ask', context, question: q.trim(), history: h as HistoryItem[] };
  }
  return 'unknown task';
}
