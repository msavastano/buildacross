import { useMemo, type KeyboardEvent } from 'react';
import { Cell, type CellSize } from './Cell';
import { cx } from './cx';
import { numberGrid, wordAt, type Direction } from './numberGrid';

export type ConstructMode = 'letters' | 'blocks';

export interface ConstructGridProps {
  rows: number;
  cols: number;
  /** flat, row-major: '#' black square, '' empty, 'A'–'Z' letter, or a multi-letter rebus */
  grid: string[];
  /** flat index of the cursor square */
  cursor: number;
  direction: Direction;
  mode: ConstructMode;
  /** toggle the 180° partner along with each black square */
  mirror: boolean;
  /** flat indexes of squares to mark with the `wrong` slash (a failing check) */
  marks?: number[];
  /** flat indexes of letters to show as pencil (suggestions not yet inked in) */
  pencil?: number[];
  size?: CellSize;
  label?: string;
  /** `changed` lists the squares written by this edit, even when a letter was retyped as itself */
  onChange: (grid: string[], changed: number[]) => void;
  onCursorChange: (cursor: number, direction: Direction) => void;
  /** Insert or Escape on a white square in Letters mode: the parent asks for a rebus */
  onRebus?: (cursor: number) => void;
  className?: string;
}

const flip = (d: Direction): Direction => (d === 'across' ? 'down' : 'across');

/** Rows for numberGrid: '#' stays, anything else is a white square. */
function toSolution(grid: string[], rows: number, cols: number): string[] {
  const out: string[] = [];
  for (let r = 0; r < rows; r++) {
    let row = '';
    for (let c = 0; c < cols; c++) row += grid[r * cols + c] === '#' ? '#' : '.';
    out.push(row);
  }
  return out;
}

/**
 * Controlled grid for building a puzzle. The parent owns the grid, cursor and direction;
 * this component turns clicks and keys into onChange / onCursorChange calls.
 */
export function ConstructGrid({
  rows, cols, grid, cursor, direction, mode, mirror, marks = [], pencil = [], size = 'md',
  label = 'Puzzle grid', onChange, onCursorChange, onRebus, className,
}: ConstructGridProps) {
  const shape = toSolution(grid, rows, cols).join('|');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const info = useMemo(() => numberGrid(shape.split('|')), [shape]);
  const marked = useMemo(() => new Set(marks), [marks]);
  const penciled = useMemo(() => new Set(pencil), [pencil]);

  const r0 = Math.floor(cursor / cols);
  const c0 = cursor % cols;
  const onBlock = grid[cursor] === '#';
  let dir = direction;
  let word = onBlock ? null : wordAt(info, r0, c0, dir);
  if (!word && !onBlock) {
    const other = wordAt(info, r0, c0, flip(dir));
    if (other) { dir = flip(dir); word = other; }
  }
  const inWord = (r: number, c: number) =>
    !!word && (dir === 'across'
      ? r === word.row && c >= word.col && c < word.col + word.length
      : c === word.col && r >= word.row && r < word.row + word.length);

  function toggle(i: number) {
    const next = grid.slice();
    const v = next[i] === '#' ? '' : '#';
    next[i] = v;
    const changed = [i];
    if (mirror) { next[rows * cols - 1 - i] = v; changed.push(rows * cols - 1 - i); }
    onChange(next, changed);
  }

  /** one square along the direction, or null at an edge or a black square */
  function step(from: number, k: 1 | -1): number | null {
    let r = Math.floor(from / cols);
    let c = from % cols;
    if (dir === 'across') c += k; else r += k;
    if (r < 0 || c < 0 || r >= rows || c >= cols) return null;
    const j = r * cols + c;
    return grid[j] === '#' ? null : j;
  }

  function onKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    const k = e.key;
    const arrows: Record<string, [Direction, number, number]> = {
      ArrowLeft: ['across', 0, -1], ArrowRight: ['across', 0, 1], ArrowUp: ['down', -1, 0], ArrowDown: ['down', 1, 0],
    };
    const a = arrows[k];
    if (a) {
      e.preventDefault();
      if (a[0] !== dir && mode === 'letters' && !onBlock) { onCursorChange(cursor, a[0]); return; } // turn first
      const nr = Math.max(0, Math.min(rows - 1, r0 + a[1]));
      const nc = Math.max(0, Math.min(cols - 1, c0 + a[2]));
      onCursorChange(nr * cols + nc, a[0]);
      return;
    }
    if (k === ' ') {
      e.preventDefault();
      if (mode === 'blocks') toggle(cursor); else onCursorChange(cursor, flip(dir));
      return;
    }
    if (k === '.' || (k === 'Enter' && mode === 'blocks')) { e.preventDefault(); toggle(cursor); return; }
    if (mode !== 'letters') return;
    if ((k === 'Insert' || k === 'Escape') && onRebus && !onBlock) { e.preventDefault(); onRebus(cursor); return; }
    if (/^[a-zA-Z]$/.test(k)) {
      e.preventDefault();
      if (onBlock) return;
      const next = grid.slice();
      next[cursor] = k.toUpperCase();
      onChange(next, [cursor]);
      const n = step(cursor, 1);
      if (n !== null) onCursorChange(n, dir);
      return;
    }
    if (k === 'Backspace') {
      e.preventDefault();
      if (onBlock) return;
      if (grid[cursor]) {
        const next = grid.slice(); next[cursor] = ''; onChange(next, [cursor]);
        return;
      }
      const p = step(cursor, -1);
      if (p === null) return;
      if (grid[p]) { const next = grid.slice(); next[p] = ''; onChange(next, [p]); }
      onCursorChange(p, dir);
      return;
    }
    if (k === 'Delete') {
      e.preventDefault();
      if (!onBlock && grid[cursor]) { const next = grid.slice(); next[cursor] = ''; onChange(next, [cursor]); }
    }
  }

  function click(i: number) {
    if (mode === 'blocks') { toggle(i); onCursorChange(i, dir); return; }
    onCursorChange(i, i === cursor ? flip(dir) : dir);
  }

  const rowEls = [];
  for (let r = 0; r < rows; r++) {
    const cells = [];
    for (let c = 0; c < cols; c++) {
      const i = r * cols + c;
      const v = grid[i];
      const isCur = i === cursor;
      if (v === '#') {
        cells.push(
          <Cell key={i} size={size} inGrid state="block" mark={marked.has(i) ? 'wrong' : undefined}
            className={cx(isCur && 'ac-cell--cursor')} onClick={() => click(i)} />,
        );
        continue;
      }
      cells.push(
        <Cell
          key={i}
          size={size}
          inGrid
          state={isCur ? 'active' : inWord(r, c) ? 'word' : 'empty'}
          letter={v}
          pencil={!!v && penciled.has(i)}
          number={info.numbers[r][c] || undefined}
          mark={marked.has(i) ? 'wrong' : undefined}
          onClick={() => click(i)}
        />,
      );
    }
    rowEls.push(<div key={r} role="row" className="ac-construct__row">{cells}</div>);
  }

  const where = `Row ${r0 + 1}, column ${c0 + 1}, ${onBlock ? 'black square' : grid[cursor] || 'empty'}` +
    (word ? `, ${word.number} ${dir === 'across' ? 'Across' : 'Down'}` : '');

  return (
    <div className={cx('ac-construct', className)}>
      <div
        className={cx('ac-grid', `ac-grid--${size}`)}
        role="grid"
        aria-label={`${label}, ${rows} by ${cols}. ${mode === 'blocks' ? 'Black squares mode.' : 'Letters mode.'} Arrow keys move.`}
        tabIndex={0}
        onKeyDown={onKeyDown}
        style={{ gridTemplateColumns: `repeat(${cols}, var(--ac-cell))` }}
      >
        {rowEls}
      </div>
      <span className="ac-sr-only" aria-live="polite">{where}</span>
    </div>
  );
}
