/**
 * Submission rules, kept in one place so they can be checked against the source.
 *
 * Source: The New York Times, "How to submit crossword puzzles to The New York Times"
 * https://www.nytimes.com/article/submit-crossword-puzzles-the-new-york-times.html
 *
 * These values came from the Across design handoff (2026-10-10) and have not been
 * re-checked against the source page. Verify them there before relying on them.
 */
export const NYT_RULES = {
  sourceUrl: 'https://www.nytimes.com/article/submit-crossword-puzzles-the-new-york-times.html',
  /** grid sizes the paper takes */
  sizes: [
    { rows: 15, cols: 15, name: 'daily' },
    { rows: 21, cols: 21, name: 'Sunday' },
  ],
  maxWords: {
    themed: 78,
    themeless: 72,
    sunday: 140,
  },
  minAnswerLength: 3,
  /**
   * Black-square share above which the editor shows a warning.
   * This is a construction guideline, not a published NYT rule.
   */
  blockShareGuideline: 1 / 6,
} as const;

export type PuzzleType = 'themed' | 'themeless';

export function isNytSize(rows: number, cols: number): boolean {
  return NYT_RULES.sizes.some((s) => s.rows === rows && s.cols === cols);
}

export function maxWordsFor(rows: number, cols: number, ptype: PuzzleType): number {
  if (rows === 21 && cols === 21) return NYT_RULES.maxWords.sunday;
  return ptype === 'themeless' ? NYT_RULES.maxWords.themeless : NYT_RULES.maxWords.themed;
}
