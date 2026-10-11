export type Direction = 'across' | 'down';

export interface Entry {
  number: number;
  row: number;
  col: number;
  length: number;
  /** the solution letters for this slot ('' positions if the grid has no letters yet) */
  answer: string;
}

export interface Numbering {
  /** clue number per square, 0 where none */
  numbers: number[][];
  across: Entry[];
  down: Entry[];
  rows: number;
  cols: number;
}

/**
 * Standard crossword numbering: a white square gets the next number when it
 * starts an across word (black/edge on its left, white on its right) or a down
 * word (black/edge above, white below). '#' marks a black square.
 */
export function numberGrid(solution: string[]): Numbering {
  const rows = solution.length;
  const cols = rows ? solution[0].length : 0;
  const isBlock = (r: number, c: number) =>
    r < 0 || c < 0 || r >= rows || c >= cols || solution[r][c] === '#';
  const numbers: number[][] = [];
  const across: Entry[] = [];
  const down: Entry[] = [];
  let n = 0;
  for (let r = 0; r < rows; r++) {
    numbers.push([]);
    for (let c = 0; c < cols; c++) {
      let num = 0;
      if (!isBlock(r, c)) {
        const a = isBlock(r, c - 1) && !isBlock(r, c + 1);
        const d = isBlock(r - 1, c) && !isBlock(r + 1, c);
        if (a || d) {
          num = ++n;
          if (a) {
            let len = 0;
            while (!isBlock(r, c + len)) len++;
            across.push({ number: num, row: r, col: c, length: len, answer: solution[r].substr(c, len) });
          }
          if (d) {
            let len = 0;
            let answer = '';
            while (!isBlock(r + len, c)) { answer += solution[r + len][c]; len++; }
            down.push({ number: num, row: r, col: c, length: len, answer });
          }
        }
      }
      numbers[r].push(num);
    }
  }
  return { numbers, across, down, rows, cols };
}

/** The across or down entry covering square (r, c), or null. */
export function wordAt(info: Numbering, r: number, c: number, dir: Direction): Entry | null {
  const list = dir === 'across' ? info.across : info.down;
  for (const w of list) {
    if (dir === 'across' && w.row === r && c >= w.col && c < w.col + w.length) return w;
    if (dir === 'down' && w.col === c && r >= w.row && r < w.row + w.length) return w;
  }
  return null;
}
