/**
 * Clue formatting. A clue is stored as text with two inline tags, <i> and <b>, plus the
 * entities &amp; &lt; &gt; for literal characters. Anything that is not one of those tags or
 * entities reads as plain text, so clues written before formatting existed ("Q&A", "x < y")
 * keep their meaning.
 */

export interface ClueRun {
  text: string;
  i: boolean;
  b: boolean;
}

const TOKEN = /<(\/?)(i|em|b|strong)>|&(amp|lt|gt|quot|#39|nbsp);/gi;
const ENTITY: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', '#39': "'", nbsp: ' ' };

/** Splits a stored clue into runs of text with their italic and bold state. */
export function parseClue(s: string): ClueRun[] {
  const runs: ClueRun[] = [];
  let i = 0;
  let b = 0;
  let buf = '';
  const flush = () => {
    if (!buf) return;
    const last = runs[runs.length - 1];
    if (last && last.i === i > 0 && last.b === b > 0) last.text += buf;
    else runs.push({ text: buf, i: i > 0, b: b > 0 });
    buf = '';
  };
  let pos = 0;
  for (const m of s.matchAll(TOKEN)) {
    buf += s.slice(pos, m.index);
    pos = m.index! + m[0].length;
    if (m[3]) { buf += ENTITY[m[3].toLowerCase()]; continue; }
    flush();
    const close = m[1] === '/';
    const tag = m[2].toLowerCase();
    if (tag === 'i' || tag === 'em') i = Math.max(0, i + (close ? -1 : 1));
    else b = Math.max(0, b + (close ? -1 : 1));
  }
  buf += s.slice(pos);
  flush();
  return runs;
}

const escape = (t: string) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** The stored form of a list of runs: tags only where the formatting changes. */
export function serializeClue(runs: ClueRun[]): string {
  let out = '';
  for (const r of runs) {
    if (!r.text) continue;
    let t = escape(r.text);
    if (r.i) t = `<i>${t}</i>`;
    if (r.b) t = `<b>${t}</b>`;
    out += t;
  }
  return out.replace(/<\/i><i>/g, '').replace(/<\/b><b>/g, '');
}

/** The clue as plain text, for .puz files, checks and the assistant. */
export function clueToPlain(s: string): string {
  return parseClue(s).map((r) => r.text).join('');
}

/** True when the clue has any italic or bold text. */
export function hasFormatting(s: string): boolean {
  return parseClue(s).some((r) => r.i || r.b);
}
