import { describe, expect, it } from 'vitest';
import { reviewClueStyle } from './assistant';
import { analyze } from './grid';

describe('reviewClueStyle', () => {
  const g = 'CATA#EBET'.split('');
  const m = analyze(g, 3, 3);
  it('flags an answer used in its own clue, bad blanks and exclamation marks', () => {
    const r = reviewClueStyle(g, m, { '0-0-A': 'Cat food brand', '0-0-D': 'Taxi __', '2-0-A': 'Wager!' });
    expect(r.text).toContain('1 Across uses its own answer, CAT');
    expect(r.text).toContain('1 Down: blanks take exactly three underscores');
    expect(r.text).toContain('3 Across: skip exclamation marks');
    expect(r.chips?.map((c) => c.label)).toEqual(['1A', '3A', '1D']);
    expect(r.text).toContain('1 filled entry still needs a clue');
  });
  it('accepts house style', () => {
    const r = reviewClueStyle(g, m, { '0-0-A': 'Pet', '0-0-D': 'Taxi', '0-2-D': 'Golf peg', '2-0-A': 'Speed ___' });
    expect(r.text).toBe('4 clues written. No style problems found.');
  });
});
