import { useEffect, useMemo, useState, type KeyboardEvent } from 'react';
import { Cell, type CellMark, type CellSize } from './Cell';
import { cx } from './cx';
import { numberGrid, wordAt, type Direction } from './numberGrid';

export interface ActiveWord { number: number; direction: Direction; row: number; col: number; length: number }

export interface GridProps {
  /** rows of the answer grid, '#' = black square */
  solution: string[];
  /** initial entries, same shape: '.' empty, UPPERCASE pen, lowercase pencil (uncontrolled) */
  entries?: string[];
  /** keyed "row,col" */
  marks?: Record<string, CellMark>;
  /** "row,col" keys of circled squares */
  circles?: string[];
  active?: { row: number; col: number; direction?: Direction };
  size?: CellSize;
  pencilMode?: boolean;
  readOnly?: boolean;
  label?: string;
  onSelect?: (word: ActiveWord) => void;
  onChange?: (entries: string[]) => void;
  className?: string;
}

interface Sel { r: number; c: number; dir: Direction }
const flip = (d: Direction): Direction => (d === 'across' ? 'down' : 'across');

export function Grid({
  solution, entries, marks = {}, circles = [], active, size = 'md', pencilMode, readOnly,
  label = 'Crossword grid', onSelect, onChange, className,
}: GridProps) {
  const key = solution.join('|');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const info = useMemo(() => numberGrid(solution), [key]);
  const [grid, setGrid] = useState<string[][]>(() =>
    (entries ?? solution.map((row) => row.replace(/[^#]/g, '.'))).map((row) => row.split('')),
  );
  const [sel, setSel] = useState<Sel>(() => {
    if (active) return { r: active.row, c: active.col, dir: active.direction ?? 'across' };
    for (let r = 0; r < info.rows; r++)
      for (let c = 0; c < info.cols; c++) if (solution[r][c] !== '#') return { r, c, dir: 'across' };
    return { r: 0, c: 0, dir: 'across' };
  });

  // A square in only one word falls back to the direction it has.
  let dir = sel.dir;
  let word = wordAt(info, sel.r, sel.c, dir);
  if (!word) { dir = flip(dir); word = wordAt(info, sel.r, sel.c, dir); }

  useEffect(() => {
    if (onSelect && word) onSelect({ number: word.number, direction: dir, row: word.row, col: word.col, length: word.length });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [word?.number, dir]);

  const isBlock = (r: number, c: number) =>
    r < 0 || c < 0 || r >= info.rows || c >= info.cols || solution[r][c] === '#';
  const inWord = (r: number, c: number) =>
    !!word && (dir === 'across'
      ? r === word.row && c >= word.col && c < word.col + word.length
      : c === word.col && r >= word.row && r < word.row + word.length);

  function step(r: number, c: number, d: Direction, k: 1 | -1) {
    const dr = d === 'down' ? k : 0;
    const dc = d === 'across' ? k : 0;
    let nr = r + dr;
    let nc = c + dc;
    const inside = () => nr >= 0 && nc >= 0 && nr < info.rows && nc < info.cols;
    while (inside() && isBlock(nr, nc)) { nr += dr; nc += dc; } // hop over black squares
    return isBlock(nr, nc) ? null : { r: nr, c: nc };
  }

  function setLetter(r: number, c: number, ch: string) {
    const next = grid.map((row) => row.slice());
    next[r][c] = ch;
    setGrid(next);
    onChange?.(next.map((row) => row.join('')));
  }

  function onKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    const arrows: Record<string, [Direction, 1 | -1]> = {
      ArrowLeft: ['across', -1], ArrowRight: ['across', 1], ArrowUp: ['down', -1], ArrowDown: ['down', 1],
    };
    const a = arrows[e.key];
    if (a) {
      e.preventDefault();
      if (a[0] !== dir) { setSel({ ...sel, dir: a[0] }); return; } // turn first
      const n = step(sel.r, sel.c, a[0], a[1]);
      if (n) setSel({ r: n.r, c: n.c, dir });
      return;
    }
    if (e.key === ' ') { e.preventDefault(); setSel({ ...sel, dir: flip(dir) }); return; }
    if (readOnly) return;
    if (/^[a-zA-Z]$/.test(e.key) && !e.metaKey && !e.ctrlKey) {
      e.preventDefault();
      setLetter(sel.r, sel.c, pencilMode ? e.key.toLowerCase() : e.key.toUpperCase());
      const nr = sel.r + (dir === 'down' ? 1 : 0);
      const nc = sel.c + (dir === 'across' ? 1 : 0);
      if (inWord(nr, nc)) setSel({ r: nr, c: nc, dir });
      return;
    }
    if (e.key === 'Backspace') {
      e.preventDefault();
      if (grid[sel.r][sel.c] !== '.') { setLetter(sel.r, sel.c, '.'); return; }
      const pr = sel.r - (dir === 'down' ? 1 : 0);
      const pc = sel.c - (dir === 'across' ? 1 : 0);
      if (inWord(pr, pc)) { setLetter(pr, pc, '.'); setSel({ r: pr, c: pc, dir }); }
    }
  }

  const cells = [];
  for (let r = 0; r < info.rows; r++) {
    for (let c = 0; c < info.cols; c++) {
      const k = `${r},${c}`;
      if (isBlock(r, c)) { cells.push(<Cell key={k} state="block" size={size} inGrid />); continue; }
      const raw = grid[r][c];
      cells.push(
        <Cell
          key={k}
          size={size}
          inGrid
          state={r === sel.r && c === sel.c ? 'active' : inWord(r, c) ? 'word' : 'empty'}
          letter={raw === '.' ? '' : raw.toUpperCase()}
          pencil={raw !== '.' && raw !== raw.toUpperCase()}
          number={info.numbers[r][c] || undefined}
          mark={marks[k]}
          circled={circles.includes(k)}
          onClick={() => setSel(r === sel.r && c === sel.c ? { r, c, dir: flip(dir) } : { r, c, dir })}
        />,
      );
    }
  }

  return (
    <div
      className={cx('ac-grid', `ac-grid--${size}`, className)}
      role="grid"
      aria-label={label}
      tabIndex={0}
      onKeyDown={onKeyDown}
      style={{ gridTemplateColumns: `repeat(${info.cols}, var(--ac-cell))` }}
    >
      {cells}
    </div>
  );
}
