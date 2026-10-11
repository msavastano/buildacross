import type { Puzzle } from './puzzle';

/** Puzzles are saved in this browser's localStorage, one key per puzzle plus an index. */
const INDEX = 'across.puzzles';
const key = (id: string) => `across.puzzle.${id}`;

function read<T>(k: string): T | null {
  try {
    const raw = localStorage.getItem(k);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function write(k: string, v: unknown): boolean {
  try {
    localStorage.setItem(k, JSON.stringify(v));
    return true;
  } catch {
    return false;
  }
}

function ids(): string[] {
  return read<string[]>(INDEX) ?? [];
}

export function loadPuzzle(id: string): Puzzle | null {
  const p = read<Puzzle>(key(id));
  if (!p || !Array.isArray(p.grid) || p.grid.length !== p.rows * p.cols) return null;
  return p;
}

/** Returns false when the browser refused the write (private mode, quota). */
export function savePuzzle(p: Puzzle): boolean {
  const ok = write(key(p.id), p);
  if (ok && !ids().includes(p.id)) write(INDEX, [p.id, ...ids()]);
  return ok;
}

export function deletePuzzle(id: string): void {
  try {
    localStorage.removeItem(key(id));
  } catch {
    /* ignore */
  }
  write(INDEX, ids().filter((x) => x !== id));
}

/** Saved puzzles, most recently edited first. */
export function listPuzzles(): Puzzle[] {
  return ids()
    .map(loadPuzzle)
    .filter((p): p is Puzzle => !!p)
    .sort((a, b) => b.updatedAt - a.updatedAt);
}
