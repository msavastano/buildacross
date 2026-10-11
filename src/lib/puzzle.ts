import type { PuzzleType } from './rules';

export type SizeId = 'mini' | 'daily' | 'sunday' | 'custom';

export interface Puzzle {
  id: string;
  title: string;
  author: string;
  rows: number;
  cols: number;
  sizeId: SizeId;
  /** flat grid: '#' black, '' empty, 'A'–'Z' filled */
  grid: string[];
  /** keyed by Word.key ("r-c-A") so clues survive renumbering */
  clues: Record<string, string>;
  nyt: boolean;
  ptype: PuzzleType;
  /** mirror black squares at 180°; always on while NYT rules are on */
  mirror: boolean;
  createdAt: number;
  updatedAt: number;
}

export const SIZES: { id: SizeId; label: string; rows: number; cols: number; note: string }[] = [
  { id: 'mini', label: 'Mini', rows: 5, cols: 5, note: 'A quick warm-up' },
  { id: 'daily', label: 'Daily', rows: 15, cols: 15, note: 'Monday to Saturday' },
  { id: 'sunday', label: 'Sunday', rows: 21, cols: 21, note: 'The big one' },
  { id: 'custom', label: 'Custom', rows: 0, cols: 0, note: 'Up to 25 × 25' },
];

export const MIN_DIM = 3;
export const MAX_DIM = 25;

export function clampDim(v: string | number): number {
  const n = typeof v === 'number' ? v : parseInt(v, 10);
  if (Number.isNaN(n)) return 15;
  return Math.max(MIN_DIM, Math.min(MAX_DIM, n));
}

export const SAMPLE15 = [
  '....#.....#....',
  '....#.....#....',
  '..........#....',
  '...#....#......',
  '......#....#...',
  '###....#.......',
  '....#....#.....',
  '....#.....#....',
  '.....#....#....',
  '.......#....###',
  '...#....#......',
  '......#....#...',
  '....#..........',
  '....#.....#....',
  '....#.....#....',
];

export const SAMPLE5 = ['....#', '.....', '.....', '.....', '#....'];

const PREFILL15 = [
  { r: 0, c: 0, w: 'ACRE', clue: '43,560 square feet' },
  { r: 0, c: 5, w: 'SLATE', clue: 'List of candidates' },
  { r: 0, c: 11, w: 'OBOE', clue: 'Woodwind that tunes the orchestra' },
  { r: 2, c: 0, w: 'CROSSWORDS', clue: 'Puzzles with Across and Down' },
  { r: 7, c: 0, w: 'ECHO', clue: 'Repeat' },
  { r: 7, c: 5, w: 'THEME', clue: 'Unifying idea of a Tuesday puzzle' },
  { r: 7, c: 11, w: 'INKS', clue: 'Signs, as a contract' },
  { r: 12, c: 5, w: 'INTERLOCKS', clue: 'Fits together, as gears' },
  { r: 14, c: 0, w: 'EDIT', clue: '' },
];

export function patternToGrid(rows: string[]): string[] {
  return rows.join('').split('').map((ch) => (ch === '#' ? '#' : ''));
}

export function sampleAvailable(sizeId: SizeId): boolean {
  return sizeId === 'daily' || sizeId === 'mini';
}

/** The starting grid and clues for a new puzzle. */
export function startingGrid(
  sizeId: SizeId, rows: number, cols: number, start: 'sample' | 'blank',
): { grid: string[]; clues: Record<string, string>; cursor: number } {
  if (start === 'sample' && sizeId === 'daily') {
    const grid = patternToGrid(SAMPLE15);
    const clues: Record<string, string> = {};
    for (const p of PREFILL15) {
      for (let j = 0; j < p.w.length; j++) grid[p.r * 15 + p.c + j] = p.w[j];
      if (p.clue) clues[`${p.r}-${p.c}-A`] = p.clue;
    }
    return { grid, clues, cursor: 15 };
  }
  if (start === 'sample' && sizeId === 'mini') {
    return { grid: patternToGrid(SAMPLE5), clues: {}, cursor: 0 };
  }
  return { grid: new Array(rows * cols).fill(''), clues: {}, cursor: 0 };
}

export function newId(): string {
  const c = globalThis.crypto;
  if (c && 'randomUUID' in c) return c.randomUUID().slice(0, 8);
  return Math.random().toString(36).slice(2, 10);
}

export function puzzleTypeName(p: Pick<Puzzle, 'rows' | 'cols' | 'nyt' | 'ptype'>): string {
  if (p.rows === 21 && p.cols === 21) return 'Sunday';
  if (p.nyt && p.rows === 15 && p.cols === 15) return p.ptype === 'themeless' ? 'Themeless' : 'Themed';
  if (p.rows === 5 && p.cols === 5) return 'Mini';
  return 'Practice';
}
