import { describe, expect, it } from 'vitest';
import { clueToPlain, hasFormatting, parseClue, serializeClue } from './clueFormat';

describe('clue formatting', () => {
  it('reads italic and bold runs and entities', () => {
    expect(parseClue('<i>Hamlet</i> or <b>Lear</b> &amp; co.')).toEqual([
      { text: 'Hamlet', i: true, b: false },
      { text: ' or ', i: false, b: false },
      { text: 'Lear', i: false, b: true },
      { text: ' & co.', i: false, b: false },
    ]);
    expect(parseClue('<b><em>Both</em></b>')).toEqual([{ text: 'Both', i: true, b: true }]);
  });

  it('keeps clues written before formatting as plain text', () => {
    expect(clueToPlain('Q&A session')).toBe('Q&A session');
    expect(clueToPlain('x < y, in math')).toBe('x < y, in math');
    expect(hasFormatting('Speed ___')).toBe(false);
  });

  it('round-trips and escapes literal characters', () => {
    const runs = [{ text: 'A & B < ', i: false, b: false }, { text: 'Jaws', i: true, b: false }];
    const s = serializeClue(runs);
    expect(s).toBe('A &amp; B &lt; <i>Jaws</i>');
    expect(parseClue(s)).toEqual(runs);
    expect(serializeClue([{ text: 'a', i: true, b: false }, { text: 'b', i: true, b: false }])).toBe('<i>a</i><i>b</i>'.replace('</i><i>', ''));
  });
});
