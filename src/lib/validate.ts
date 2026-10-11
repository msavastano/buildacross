import { allWords, wordText, type Analysis } from './grid';
import { NYT_RULES, isNytSize, maxWordsFor, type PuzzleType } from './rules';

export type CheckStatus = 'pass' | 'fail' | 'warn' | 'todo';
export type CheckId = 'size' | 'sym' | 'interlock' | 'checked' | 'short' | 'count' | 'blocks' | 'dupes' | 'filled' | 'clued';

export interface Check {
  id: CheckId;
  label: string;
  status: CheckStatus;
  /** short result shown beside the label */
  detail: string;
  /** squares to mark when the user asks to see the problem */
  cells: number[];
  /** plain-language explanation and fix */
  why: string;
}

export interface ValidateInput {
  rows: number;
  cols: number;
  grid: string[];
  clues: Record<string, string>;
  nyt: boolean;
  ptype: PuzzleType;
}

const plural = (n: number, one: string, many: string) => (n === 1 ? one : many);

/** Live checks. With NYT rules off, only 3+ letters, repeats, filled and clued are checked. */
export function validate(s: ValidateInput, m: Analysis): Check[] {
  const { rows: R, cols: C, grid: g } = s;
  const total = R * C;
  const out: Check[] = [];
  const ck = (id: CheckId, label: string, status: CheckStatus, detail: string, cells: number[] = [], why = '') =>
    out.push({ id, label, status, detail, cells, why });
  const words = allWords(m);

  if (s.nyt) {
    const sizeOk = isNytSize(R, C);
    ck('size', 'Grid size', sizeOk ? 'pass' : 'fail',
      `${R} × ${C}${sizeOk ? (R === 21 ? ' Sunday' : ' daily') : ' · needs 15 × 15 or 21 × 21'}`, [],
      'NYT takes 15 × 15 dailies and 21 × 21 Sundays. Start a new puzzle at one of those sizes.');
    ck('sym', 'Rotational symmetry', m.asym.length ? 'fail' : 'pass',
      m.asym.length ? `${m.asym.length} unpaired black ${plural(m.asym.length, 'square', 'squares')}` : 'Matches at 180°', m.asym,
      `${m.asym.length} black ${plural(m.asym.length, 'square has', 'squares have')} no partner at the rotated position. Add the partner, or remove the square.`);
    ck('interlock', 'All-over interlock', m.cut.length ? 'fail' : 'pass',
      m.cut.length ? `${m.cut.length} squares cut off` : 'One connected grid', m.cut,
      'Part of the grid is walled off from the rest. Open a black square on the border between the sections.');
    ck('checked', 'No unchecked squares', m.unchecked.length ? 'fail' : 'pass',
      m.unchecked.length ? `${m.unchecked.length} in only one word` : 'Every letter crosses', m.unchecked,
      `${m.unchecked.length} ${plural(m.unchecked.length, 'square belongs', 'squares belong')} to only one answer. Every letter should be part of an Across and a Down.`);
  }

  ck('short', `Every answer ${NYT_RULES.minAnswerLength}+ letters`, m.shortCount ? 'fail' : 'pass',
    m.shortCount ? `${m.shortCount} too short` : 'No 2-letter entries', m.short,
    `${m.shortCount} ${plural(m.shortCount, 'entry is', 'entries are')} under 3 letters. Move a black square to lengthen or remove them.`);

  if (s.nyt) {
    const max = maxWordsFor(R, C, s.ptype);
    ck('count', 'Word count', m.words <= max ? 'pass' : 'fail', `${m.words} of ${max} max`, [],
      `The grid has ${m.words} answers; the limit is ${max}. Remove black squares to make fewer, longer entries.`);
    const lim = Math.floor(total * NYT_RULES.blockShareGuideline);
    ck('blocks', 'Black squares', m.blocks <= lim ? 'pass' : 'warn', `${m.blocks} · guideline ${lim} or fewer`, [],
      `${m.blocks} black squares is more than a sixth of the grid. Editors tend to push back on heavy grids.`);
  }

  const seen = new Map<string, number[]>();
  let dupeCells: number[] = [];
  const dupeWords: string[] = [];
  for (const w of words) {
    const t = wordText(g, w);
    if (t.includes('?')) continue;
    const prev = seen.get(t);
    if (prev) {
      dupeCells = dupeCells.concat(w.cells, prev);
      if (!dupeWords.includes(t)) dupeWords.push(t);
    } else seen.set(t, w.cells);
  }
  ck('dupes', 'No repeated answers', dupeWords.length ? 'fail' : 'pass',
    dupeWords.length ? dupeWords.join(', ') : 'Each answer used once', dupeCells,
    `${dupeWords.join(', ')} ${plural(dupeWords.length, 'appears', 'appear')} more than once. Change one of the entries.`);

  let filled = 0;
  for (let i = 0; i < total; i++) if (g[i] && g[i] !== '#') filled++;
  ck('filled', 'Every square filled', filled === m.open ? 'pass' : 'todo', `${filled} of ${m.open} squares`);

  const clued = words.filter((w) => (s.clues[w.key] || '').trim()).length;
  ck('clued', 'Every answer clued', clued === words.length && words.length ? 'pass' : 'todo', `${clued} of ${words.length} clues`);

  return out;
}
