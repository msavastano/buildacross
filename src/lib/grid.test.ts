import { describe, expect, it } from 'vitest';
import { analyze, findActive, toggleBlock, wordText } from './grid';
import { patternToGrid, SAMPLE15, SAMPLE5, startingGrid } from './puzzle';
import { validate } from './validate';

const blank = (n: number) => new Array(n).fill('');

describe('analyze', () => {
  it('numbers an open 3 × 3 grid like a newspaper', () => {
    const m = analyze(blank(9), 3, 3);
    expect(m.num).toEqual([1, 2, 3, 4, 0, 0, 5, 0, 0]);
    expect(m.across.map((w) => w.num)).toEqual([1, 4, 5]);
    expect(m.down.map((w) => w.num)).toEqual([1, 2, 3]);
    expect(m.across[1]).toMatchObject({ key: '1-0-A', cells: [3, 4, 5] });
    expect(m.words).toBe(6);
  });

  it('finds 76 words and 32 black squares in the sample 15 × 15', () => {
    const g = patternToGrid(SAMPLE15);
    const m = analyze(g, 15, 15);
    expect(m.words).toBe(76);
    expect(m.blocks).toBe(32);
    expect(m.asym).toEqual([]);
    expect(m.cut).toEqual([]);
    expect(m.unchecked).toEqual([]);
    expect(m.shortCount).toBe(0);
  });

  it('flags an unpaired black square', () => {
    const g = blank(25);
    g[0] = '#';
    expect(analyze(g, 5, 5).asym).toEqual([0]);
  });

  it('flags 2-letter entries and unchecked squares', () => {
    // a block in the middle of the top row leaves 2-letter across words
    const g = blank(25);
    g[2] = '#';
    g[22] = '#';
    const m = analyze(g, 5, 5);
    expect(m.shortCount).toBe(4);
    expect(m.short).toContain(0);
    expect(m.unchecked).toEqual([]);
    const g2 = blank(9);
    g2[3] = '#'; g2[5] = '#';
    // middle column: square 4 is only in the down word
    expect(analyze(g2, 3, 3).unchecked).toContain(4);
  });

  it('finds squares walled off from the rest', () => {
    const g = patternToGrid(['.#...', '##...', '.....', '.....', '.....']);
    const m = analyze(g, 5, 5);
    expect(m.cut).toEqual([0]);
  });
});

describe('validate', () => {
  it('passes every rule on the sample 15 × 15 with NYT rules on', () => {
    const { grid, clues } = startingGrid('daily', 15, 15, 'sample');
    const m = analyze(grid, 15, 15);
    const checks = validate({ rows: 15, cols: 15, grid, clues, nyt: true, ptype: 'themed' }, m);
    const byId = Object.fromEntries(checks.map((c) => [c.id, c]));
    for (const id of ['size', 'sym', 'interlock', 'checked', 'short', 'count', 'blocks', 'dupes'] as const) {
      expect(byId[id].status, id).toBe('pass');
    }
    expect(byId.count.detail).toBe('76 of 78 max');
    expect(byId.filled.status).toBe('todo');
    expect(byId.clued.status).toBe('todo');
  });

  it('fails the word count for a themeless limit of 72', () => {
    const grid = patternToGrid(SAMPLE15);
    const m = analyze(grid, 15, 15);
    const count = validate({ rows: 15, cols: 15, grid, clues: {}, nyt: true, ptype: 'themeless' }, m)
      .find((c) => c.id === 'count')!;
    expect(count.status).toBe('fail');
  });

  it('only runs the basic checks with NYT rules off', () => {
    const grid = patternToGrid(SAMPLE5);
    const ids = validate({ rows: 5, cols: 5, grid, clues: {}, nyt: false, ptype: 'themed' }, analyze(grid, 5, 5)).map((c) => c.id);
    expect(ids).toEqual(['short', 'dupes', 'filled', 'clued']);
  });

  it('fails the size check off the NYT sizes', () => {
    const grid = patternToGrid(SAMPLE5);
    const size = validate({ rows: 5, cols: 5, grid, clues: {}, nyt: true, ptype: 'themed' }, analyze(grid, 5, 5))[0];
    expect(size).toMatchObject({ id: 'size', status: 'fail' });
  });

  it('flags repeated answers and passes filled and clued when complete', () => {
    const grid = 'CATAREEAT'.split('');
    const m = analyze(grid, 3, 3);
    const clues = Object.fromEntries([...m.across, ...m.down].map((w) => [w.key, 'x']));
    const checks = validate({ rows: 3, cols: 3, grid, clues, nyt: false, ptype: 'themed' }, m);
    const byId = Object.fromEntries(checks.map((c) => [c.id, c]));
    expect(byId.dupes.status).toBe('pass');
    const g2 = 'CATAAACAT'.split('');
    const d = validate({ rows: 3, cols: 3, grid: g2, clues, nyt: false, ptype: 'themed' }, analyze(g2, 3, 3))
      .find((c) => c.id === 'dupes')!;
    expect(d.status).toBe('fail');
    expect(d.detail.split(', ')).toContain('CAT');
    expect(byId.filled.status).toBe('pass');
    expect(byId.clued.status).toBe('pass');
  });
});

describe('helpers', () => {
  it('mirrors a black square at 180°', () => {
    const g = toggleBlock(blank(25), 1, true);
    expect(g[1]).toBe('#');
    expect(g[23]).toBe('#');
    expect(toggleBlock(g, 1, true).filter((v) => v === '#')).toHaveLength(0);
    expect(toggleBlock(blank(25), 1, false).filter((v) => v === '#')).toHaveLength(1);
  });

  it('finds the active word, falling back to the other direction', () => {
    const g = patternToGrid(['...', '#.#', '...']);
    const m = analyze(g, 3, 3);
    // square 4 is only in 2 Down
    expect(findActive(m, 4, 'A')).toMatchObject({ num: 2, dir: 'D' });
    expect(wordText(['A', '', 'C'], { key: 'x', num: 1, dir: 'A', cells: [0, 1, 2] })).toBe('A?C');
  });
});
