import { describe, expect, it } from 'vitest';
import { analyze } from './grid';
import { fits, matchPattern, parseWordList, suggestFill } from './wordlist';

const LIST = parseWordList('# test list\n@70\nCOT\n@60\nCAT\nCAT\n@50\nARE\nTEN\n@40\nCAB\nAREA\nbad word\n');

describe('parseWordList', () => {
  it('groups by length, best score first, and skips comments, repeats and bad lines', () => {
    expect(LIST.byLength.get(3)).toEqual(['COT', 'CAT', 'ARE', 'TEN', 'CAB']);
    expect(LIST.byLength.get(4)).toEqual(['AREA']);
    expect(LIST.scores.get('CAT')).toBe(60);
    expect(LIST.scores.has('bad word')).toBe(false);
  });
});

describe('matchPattern', () => {
  it('matches known letters and wildcards', () => {
    expect(fits('CAT', 'C?T')).toBe(true);
    expect(fits('CAT', 'C?')).toBe(false);
    expect(matchPattern(LIST, 'CA?')).toEqual(['CAT', 'CAB']);
    expect(matchPattern(LIST, '???', 2)).toEqual(['COT', 'CAT']);
  });
});

describe('suggestFill', () => {
  // 3 × 3 open grid: every square is crossed.
  const empty = new Array(9).fill('');
  const m = analyze(empty, 3, 3);
  const oneA = m.across[0];

  it('keeps only words that leave every crossing an answer', () => {
    // Down entries must start with C, A or T (the first letters in the list), so only CAT works.
    const s = suggestFill(LIST, empty, m, oneA);
    expect(s).toMatchObject({ pattern: '???', matches: 5, full: false });
    expect(s.viable).toEqual([{ word: 'CAT', score: 60 }]);
  });

  it('leaves out words already in the grid', () => {
    const g = ['', '', '', 'C', 'A', 'T', '', '', ''];
    const s = suggestFill(LIST, g, analyze(g, 3, 3), oneA);
    expect(s.viable.map((v) => v.word)).not.toContain('CAT');
  });

  it('reports a full entry', () => {
    const g = ['C', 'A', 'T', '', '', '', '', '', ''];
    expect(suggestFill(LIST, g, analyze(g, 3, 3), oneA).full).toBe(true);
  });

  it('skips entries with a rebus square', () => {
    const g = ['CAT', '', '', '', '', '', '', '', ''];
    expect(suggestFill(LIST, g, analyze(g, 3, 3), oneA)).toMatchObject({ rebus: true, viable: [] });
  });
});
