/**
 * Scored word list and pattern matching for fill suggestions. Runs in the browser, no server.
 *
 * The list is public/wordlist.txt, built by scripts/build-wordlist.mjs from the Collaborative
 * Word List (Crossword Nexus, MIT License). Format: "#" comment lines, "@63" starts the group
 * of words scored 63, every other line is one UPPERCASE word. Groups run from best to worst.
 */
import { wordText, type Analysis, type Word } from './grid';

export interface WordList {
  /** words of each length, best score first */
  byLength: Map<number, string[]>;
  scores: Map<string, number>;
}

export function parseWordList(text: string): WordList {
  const byLength = new Map<number, string[]>();
  const scores = new Map<string, number>();
  let score = 50;
  for (const raw of text.split('\n')) {
    const line = raw.trim();
    if (!line || line[0] === '#') continue;
    if (line[0] === '@') { score = Number(line.slice(1)) || 0; continue; }
    if (!/^[A-Z]+$/.test(line) || scores.has(line)) continue;
    scores.set(line, score);
    let bucket = byLength.get(line.length);
    if (!bucket) byLength.set(line.length, (bucket = []));
    bucket.push(line);
  }
  return { byLength, scores };
}

let loading: Promise<WordList> | null = null;

/** Fetches and parses the list once per page load. */
export function loadWordList(url = '/wordlist.txt'): Promise<WordList> {
  if (!loading) {
    loading = fetch(url)
      .then((r) => {
        if (!r.ok) throw new Error(`Word list request failed (${r.status})`);
        return r.text();
      })
      .then(parseWordList)
      .catch((e) => { loading = null; throw e; });
  }
  return loading;
}

/** True when every known letter of the pattern ('?' for unknown) matches the word. */
export function fits(word: string, pattern: string): boolean {
  if (word.length !== pattern.length) return false;
  for (let i = 0; i < pattern.length; i++) {
    const p = pattern[i];
    if (p !== '?' && p !== word[i]) return false;
  }
  return true;
}

/** Words that fit the pattern, best score first. */
export function matchPattern(list: WordList, pattern: string, limit = Infinity): string[] {
  const out: string[] = [];
  for (const w of list.byLength.get(pattern.length) ?? []) {
    if (fits(w, pattern)) {
      out.push(w);
      if (out.length >= limit) break;
    }
  }
  return out;
}

/** Letters some fitting word has at position k; stops scanning once all 26 have turned up. */
function lettersAt(list: WordList, pattern: string, k: number): Set<string> {
  const seen = new Set<string>();
  for (const w of list.byLength.get(pattern.length) ?? []) {
    if (fits(w, pattern)) {
      seen.add(w[k]);
      if (seen.size === 26) break;
    }
  }
  return seen;
}

export interface FillSuggestions {
  pattern: string;
  /** every word in the list that fits the entry's own pattern */
  matches: number;
  /** words that fit and leave every crossing with at least one word in the list, best first */
  viable: { word: string; score: number }[];
  /** true when the entry has no empty squares */
  full: boolean;
  /** true when the entry has a rebus square; the list only covers one letter per square */
  rebus: boolean;
}

/**
 * Fill suggestions for one entry. A candidate counts as viable when, for each empty square
 * it would fill, the crossing entry still has a word in the list with that letter there.
 * Words already in the grid are left out.
 */
export function suggestFill(list: WordList, g: string[], m: Analysis, w: Word, limit = 8): FillSuggestions {
  const pattern = wordText(g, w);
  const full = !pattern.includes('?');
  if (pattern.length !== w.cells.length) return { pattern, matches: 0, viable: [], full, rebus: true };
  const inGrid = new Set<string>();
  for (const x of [...m.across, ...m.down]) {
    if (x.key === w.key) continue;
    const t = wordText(g, x);
    if (!t.includes('?')) inGrid.add(t);
  }

  // For each empty square, the letters its crossing allows (null when nothing crosses).
  const crossers = w.dir === 'A' ? m.down : m.across;
  const allowed: (Set<string> | null)[] = w.cells.map((cell) => {
    if (g[cell]) return null;
    const x = crossers.find((c) => c.cells.includes(cell));
    if (!x) return null;
    const xp = wordText(g, x);
    if (xp.length < 3 || xp.length !== x.cells.length) return null; // too short, or crosses at a rebus
    return lettersAt(list, xp, x.cells.indexOf(cell));
  });

  let matches = 0;
  const viable: { word: string; score: number }[] = [];
  for (const word of list.byLength.get(pattern.length) ?? []) {
    if (!fits(word, pattern)) continue;
    matches++;
    if (viable.length >= limit || inGrid.has(word) || word === pattern) continue;
    if (allowed.every((s, k) => !s || s.has(word[k]))) viable.push({ word, score: list.scores.get(word) ?? 0 });
  }
  return { pattern, matches, viable, full, rebus: false };
}
