// Builds public/wordlist.txt from the Collaborative Word List (Crossword Nexus, MIT License).
// Usage: node scripts/build-wordlist.mjs [path-to-xwordlist.dict]
// Without a path it downloads the list from GitHub.
//
// Output: a header comment, then score groups from best to worst. A line "@63" starts the
// group of words scored 63; each following line is one word. Only A–Z words of 3–25 letters
// scored 30 or more are kept, which still includes common crosswordese like ETUI.
import { readFile, writeFile } from 'node:fs/promises';

const SOURCE = 'https://raw.githubusercontent.com/Crossword-Nexus/collaborative-word-list/main/xwordlist.dict';
const MIN_SCORE = 30;

const path = process.argv[2];
const text = path ? await readFile(path, 'utf8') : await (await fetch(SOURCE)).text();

const byScore = new Map();
for (const line of text.split(/\r?\n/)) {
  const [w, s] = line.split(';');
  const score = Number(s);
  if (!w || !/^[A-Z]{3,25}$/.test(w) || !(score >= MIN_SCORE)) continue;
  if (!byScore.has(score)) byScore.set(score, []);
  byScore.get(score).push(w);
}

const out = [
  '# Collaborative Word List by Crossword Nexus, MIT License: https://github.com/Crossword-Nexus/collaborative-word-list',
];
let total = 0;
for (const score of [...byScore.keys()].sort((a, b) => b - a)) {
  const words = byScore.get(score).sort();
  out.push(`@${score}`, ...words);
  total += words.length;
}
await writeFile(new URL('../public/wordlist.txt', import.meta.url), out.join('\n') + '\n');
console.log(`wrote ${total} words`);
