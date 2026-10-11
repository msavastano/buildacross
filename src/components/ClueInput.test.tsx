import { describe, expect, it } from 'vitest';
import { serializeClue } from '../lib/clueFormat';
import { domToRuns } from './ClueInput';

describe('domToRuns', () => {
  it('reads what browsers produce for italic and bold', () => {
    const el = document.createElement('div');
    el.innerHTML = 'See <i>Hamlet</i>, <span style="font-weight: bold">act</span> <strong>III</strong>&nbsp;<br>';
    expect(serializeClue(domToRuns(el))).toBe('See <i>Hamlet</i>, <b>act</b> <b>III</b> ');
  });
});
