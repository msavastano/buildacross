import { describe, expect, it } from 'vitest';
import { cksum, exportPuz, puzClueOrder, toLatin1 } from './puz';
import type { Puzzle } from './puzzle';

const p: Puzzle = {
  id: 't', title: 'Tiny', author: 'Mike', rows: 3, cols: 3, sizeId: 'custom',
  grid: 'CATA#EBET'.split('').map((v) => v),
  clues: { '0-0-A': 'Pet', '0-0-D': 'Taxi', '0-2-D': 'Golf peg, e.g.', '2-0-A': 'Wager' },
  nyt: false, ptype: 'themed', mirror: true, createdAt: 0, updatedAt: 0,
};

const u16 = (b: Uint8Array, o: number) => b[o] | (b[o + 1] << 8);

describe('exportPuz', () => {
  it('writes the header, grids and strings', () => {
    const b = exportPuz(p);
    expect(String.fromCharCode(...b.slice(2, 14))).toBe('ACROSS&DOWN\0');
    expect(b[0x2c]).toBe(3);
    expect(b[0x2d]).toBe(3);
    expect(u16(b, 0x2e)).toBe(4);
    expect(String.fromCharCode(...b.slice(0x34, 0x34 + 9))).toBe('CATA.EBET');
    expect(String.fromCharCode(...b.slice(0x34 + 9, 0x34 + 18))).toBe('----.----');
    const strings = String.fromCharCode(...b.slice(0x34 + 18)).split('\0');
    expect(strings.slice(0, 3)).toEqual(['Tiny', 'Mike', '']);
    expect(strings.slice(3, 7)).toEqual(['Pet', 'Taxi', 'Golf peg, e.g.', 'Wager']);
  });

  it('stores checksums that match the file contents', () => {
    const b = exportPuz(p);
    const cib = cksum(Array.from(b.slice(0x2c, 0x34)));
    expect(u16(b, 0x0e)).toBe(cib);
    const sol = Array.from(b.slice(0x34, 0x34 + 9));
    const grid = Array.from(b.slice(0x34 + 9, 0x34 + 18));
    let c = cksum(grid, cksum(sol, cib));
    const enc = (s: string) => Array.from(s, (ch) => ch.charCodeAt(0));
    c = cksum(enc('Tiny\0'), c);
    c = cksum(enc('Mike\0'), c);
    for (const cl of ['Pet', 'Taxi', 'Golf peg, e.g.', 'Wager']) c = cksum(enc(cl), c);
    expect(u16(b, 0)).toBe(c);
    expect(b[0x10] ^ 0x49).toBe(cib & 0xff);
  });
});

describe('helpers', () => {
  it('orders clues by number, Across first', () => {
    expect(puzClueOrder(p)).toEqual(['Pet', 'Taxi', 'Golf peg, e.g.', 'Wager']);
  });
  it('maps typographic characters to Latin-1', () => {
    expect(toLatin1('Diva’s “aria” — 5 × 5…')).toBe('Diva\'s "aria" - 5 x 5...');
    expect(toLatin1('café')).toBe('café');
  });

  it('writes rebus squares as GRBS and RTBL sections and strips clue formatting', () => {
    const b = exportPuz({ ...p, grid: ['CAT', 'A', 'T', 'A', '#', 'E', 'B', 'E', 'CAT'], clues: { '0-0-A': '<i>Hamlet</i> Q&amp;A' } });
    const text = String.fromCharCode(...b);
    expect(String.fromCharCode(...b.slice(0x34, 0x34 + 9))).toBe('CATA.EBEC');
    expect(text).toContain('Hamlet Q&A\0');
    const g = text.indexOf('GRBS');
    expect(u16(b, g + 4)).toBe(9);
    expect(Array.from(b.slice(g + 8, g + 17))).toEqual([1, 0, 0, 0, 0, 0, 0, 0, 1]);
    expect(u16(b, g + 6)).toBe(cksum(Array.from(b.slice(g + 8, g + 17))));
    const r = text.indexOf('RTBL');
    expect(text.slice(r + 8, r + 8 + u16(b, r + 4))).toBe(' 0:CAT;');
  });
});
