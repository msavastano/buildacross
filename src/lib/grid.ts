/**
 * Pure grid logic, ported from the Builder prototype (docs/handoff/design/Builder.dc.html).
 *
 * A grid is a flat array of R × C squares in row-major order: '#' is a black square,
 * '' is an empty white square, and an uppercase letter is a filled square. A square can also
 * hold a rebus: several characters (A–Z, 0–9) that solvers enter in one square.
 */
export type Dir = 'A' | 'D';

export interface Word {
  /** stable key based on the start square, e.g. "0-4-A"; clues are stored under it so they survive renumbering */
  key: string;
  num: number;
  dir: Dir;
  /** flat indexes of the word's squares, in reading order */
  cells: number[];
}

export interface Analysis {
  /** clue number per square, 0 where none */
  num: number[];
  across: Word[];
  down: Word[];
  /** black squares with no partner at the 180° rotated position */
  asym: number[];
  /** white squares that belong to only one word */
  unchecked: number[];
  /** squares of entries shorter than 3 */
  short: number[];
  shortCount: number;
  /** white squares outside the largest connected region */
  cut: number[];
  blocks: number;
  /** number of white squares */
  open: number;
  words: number;
}

export const isBlock = (v: string | undefined) => v === '#';

export function analyze(g: string[], R: number, C: number): Analysis {
  const B = (r: number, c: number) => g[r * C + c] === '#';
  const num: number[] = new Array(R * C).fill(0);
  const across: Word[] = [];
  const down: Word[] = [];
  let n = 0;
  for (let r = 0; r < R; r++) {
    for (let c = 0; c < C; c++) {
      if (B(r, c)) continue;
      const sa = (c === 0 || B(r, c - 1)) && c + 1 < C && !B(r, c + 1);
      const sd = (r === 0 || B(r - 1, c)) && r + 1 < R && !B(r + 1, c);
      if (sa || sd) num[r * C + c] = ++n;
      if (sa) {
        const cells: number[] = [];
        for (let k = c; k < C && !B(r, k); k++) cells.push(r * C + k);
        across.push({ key: `${r}-${c}-A`, num: n, dir: 'A', cells });
      }
      if (sd) {
        const cells: number[] = [];
        for (let k = r; k < R && !B(k, c); k++) cells.push(k * C + c);
        down.push({ key: `${r}-${c}-D`, num: n, dir: 'D', cells });
      }
    }
  }

  const asym: number[] = [];
  const unchecked: number[] = [];
  const open: number[] = [];
  let blocks = 0;
  for (let i = 0; i < R * C; i++) {
    const r = Math.floor(i / C);
    const c = i % C;
    if (g[i] === '#') {
      blocks++;
      if (g[R * C - 1 - i] !== '#') asym.push(i);
      continue;
    }
    open.push(i);
    const h = (c > 0 && !B(r, c - 1)) || (c < C - 1 && !B(r, c + 1));
    const v = (r > 0 && !B(r - 1, c)) || (r < R - 1 && !B(r + 1, c));
    if (!h || !v) unchecked.push(i);
  }

  let short: number[] = [];
  let shortCount = 0;
  for (const w of [...across, ...down]) {
    if (w.cells.length < 3) {
      shortCount++;
      short = short.concat(w.cells);
    }
  }

  // Connected regions of white squares; everything outside the largest one is "cut off".
  const comp = new Map<number, number>();
  const comps: number[][] = [];
  for (const s0 of open) {
    if (comp.has(s0)) continue;
    const id = comps.length;
    const members = [s0];
    const q = [s0];
    comp.set(s0, id);
    while (q.length) {
      const x = q.pop()!;
      const xr = Math.floor(x / C);
      const xc = x % C;
      for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nr = xr + dr;
        const nc = xc + dc;
        if (nr < 0 || nc < 0 || nr >= R || nc >= C) continue;
        const y = nr * C + nc;
        if (g[y] === '#' || comp.has(y)) continue;
        comp.set(y, id);
        members.push(y);
        q.push(y);
      }
    }
    comps.push(members);
  }
  let cut: number[] = [];
  if (comps.length > 1) {
    let big = 0;
    comps.forEach((m, j) => { if (m.length > comps[big].length) big = j; });
    comps.forEach((m, j) => { if (j !== big) cut = cut.concat(m); });
  }

  return {
    num, across, down, asym, unchecked, short, shortCount, cut, blocks,
    open: open.length, words: across.length + down.length,
  };
}

/** The word's letters, with '?' for empty squares. A rebus square adds all its letters. */
export function wordText(g: string[], w: Word): string {
  return w.cells.map((i) => g[i] || '?').join('');
}

export function wordLabel(w: Word): string {
  return `${w.num} ${w.dir === 'A' ? 'Across' : 'Down'}`;
}

/** Chip form, e.g. "14A". */
export function wordChip(w: Word): string {
  return `${w.num}${w.dir}`;
}

/** The word under the cursor in the current direction, falling back to the other direction. */
export function findActive(m: Analysis, cur: number, dir: Dir): Word | null {
  const list = dir === 'A' ? m.across : m.down;
  const other = dir === 'A' ? m.down : m.across;
  return list.find((w) => w.cells.includes(cur)) ?? other.find((w) => w.cells.includes(cur)) ?? null;
}

/** Toggle a black square, and its 180° partner when mirroring. */
export function toggleBlock(g: string[], i: number, mirror: boolean): string[] {
  const next = g.slice();
  const v = next[i] === '#' ? '' : '#';
  next[i] = v;
  if (mirror) next[next.length - 1 - i] = v;
  return next;
}

/** Every word in clue order: across then down, each by number. */
export function allWords(m: Analysis): Word[] {
  return [...m.across, ...m.down];
}
