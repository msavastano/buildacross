/**
 * Across Lite (.puz) export, version 1.3.
 * Format reference: https://code.google.com/archive/p/puz/wikis/FileFormat.wiki
 */
import { analyze } from './grid';
import type { Puzzle } from './puzzle';

const MAGIC = 'ACROSS&DOWN\0';

/** .puz strings are Latin-1: swap common typographic characters and replace anything else. */
export function toLatin1(s: string): string {
  return s
    .replace(/[‘’‚′]/g, "'")
    .replace(/[“”„″]/g, '"')
    .replace(/[–—−]/g, '-')
    .replace(/…/g, '...')
    .replace(/×/g, 'x')
    .replace(/[^\x00-\xFF]/g, '?');
}

function bytes(s: string): number[] {
  const out: number[] = [];
  for (let i = 0; i < s.length; i++) out.push(s.charCodeAt(i) & 0xff);
  return out;
}

export function cksum(data: number[], start = 0): number {
  let c = start;
  for (const b of data) {
    c = c & 1 ? (c >> 1) + 0x8000 : c >> 1;
    c = (c + b) & 0xffff;
  }
  return c;
}

/** Clues in .puz order: by number, Across before Down at the same number. */
export function puzClueOrder(p: Pick<Puzzle, 'grid' | 'rows' | 'cols' | 'clues'>): string[] {
  const m = analyze(p.grid, p.rows, p.cols);
  const words = [...m.across, ...m.down].sort((a, b) => a.num - b.num || (a.dir === 'A' ? -1 : 1));
  return words.map((w) => p.clues[w.key] ?? '');
}

export function canExportPuz(p: Pick<Puzzle, 'grid' | 'rows' | 'cols'>): { ok: boolean; reason?: string } {
  if (p.rows > 255 || p.cols > 255) return { ok: false, reason: 'The grid is too large for a .puz file.' };
  if (p.grid.some((v) => v === '')) return { ok: false, reason: 'Fill every square before exporting a .puz file.' };
  return { ok: true };
}

export function exportPuz(p: Puzzle, copyright = ''): Uint8Array {
  const solution = bytes(p.grid.map((v) => (v === '#' ? '.' : v.toUpperCase())).join(''));
  const state = bytes(p.grid.map((v) => (v === '#' ? '.' : '-')).join(''));
  const title = toLatin1(p.title.trim());
  const author = toLatin1(p.author.trim());
  const copy = toLatin1(copyright);
  const clues = puzClueOrder(p).map((c) => toLatin1(c.trim()));
  const notes = '';

  // checksum over the strings section
  const strSum = (start: number) => {
    let c = start;
    if (title) c = cksum(bytes(title + '\0'), c);
    if (author) c = cksum(bytes(author + '\0'), c);
    if (copy) c = cksum(bytes(copy + '\0'), c);
    for (const cl of clues) c = cksum(bytes(cl), c);
    if (notes) c = cksum(bytes(notes + '\0'), c);
    return c;
  };

  const header = new Uint8Array(0x34);
  const dv = new DataView(header.buffer);
  header.set(bytes(MAGIC), 0x02);
  header.set(bytes('1.3\0'), 0x18);
  header[0x2c] = p.cols;
  header[0x2d] = p.rows;
  dv.setUint16(0x2e, clues.length, true);
  dv.setUint16(0x30, 0x0001, true); // puzzle type: normal
  dv.setUint16(0x32, 0x0000, true); // not scrambled

  const cib = cksum(Array.from(header.slice(0x2c, 0x34)));
  dv.setUint16(0x0e, cib, true);

  let overall = cksum(solution, cib);
  overall = cksum(state, overall);
  overall = strSum(overall);
  dv.setUint16(0x00, overall, true);

  const sums = [cib, cksum(solution), cksum(state), strSum(0)];
  const mask = bytes('ICHEATED');
  for (let i = 0; i < 4; i++) {
    header[0x10 + i] = mask[i] ^ (sums[i] & 0xff);
    header[0x14 + i] = mask[i + 4] ^ (sums[i] >> 8);
  }

  const body = [
    ...solution,
    ...state,
    ...bytes(title + '\0'),
    ...bytes(author + '\0'),
    ...bytes(copy + '\0'),
    ...clues.flatMap((c) => bytes(c + '\0')),
    ...bytes(notes + '\0'),
  ];
  const out = new Uint8Array(header.length + body.length);
  out.set(header, 0);
  out.set(body, header.length);
  return out;
}

export function puzFileName(title: string): string {
  const base = title.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return `${base || 'puzzle'}.puz`;
}
