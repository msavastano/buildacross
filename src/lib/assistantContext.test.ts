import { describe, expect, it } from 'vitest';
import { buildContext, parseAssistantRequest } from './assistantContext';
import { analyze } from './grid';

const g = ['C', 'A', 'T', '', '', '', '', '', ''];
const m = analyze(g, 3, 3);
const p = { title: 'Mini', rows: 3, cols: 3, grid: g, clues: { '0-0-A': 'Pet' }, nyt: false };

describe('buildContext', () => {
  it('describes the grid, entries and the selected entry with its crossings', () => {
    const c = buildContext(p, 'Mini', m, m.across[0], []);
    expect(c.grid).toEqual(['CAT', '...', '...']);
    expect(c.entries[0]).toEqual({ chip: '1A', label: '1 Across', pattern: 'CAT', clue: 'Pet' });
    expect(c.active?.crossings.map((x) => `${x.chip} ${x.pattern}`)).toEqual(['1D C??', '2D A??', '3D T??']);
  });
});

describe('rebus squares', () => {
  it('marks them in the grid and lists them', () => {
    const rg = ['STAR', 'A', 'T', '', '', '', '', '', ''];
    const rm = analyze(rg, 3, 3);
    const c = buildContext({ ...p, grid: rg }, 'Mini', rm, rm.across[0], []);
    expect(c.grid[0]).toBe('*AT');
    expect(c.rebus).toEqual(['Row 1, column 1: STAR']);
    expect(c.entries[0].pattern).toBe('STARAT');
    expect(parseAssistantRequest({ task: 'clues', context: c })).toMatchObject({ task: 'clues' });
  });
});

describe('parseAssistantRequest', () => {
  const context = buildContext(p, 'Mini', m, m.across[0], []);

  it('accepts a clue request for a complete entry and a question', () => {
    expect(parseAssistantRequest({ task: 'clues', context })).toMatchObject({ task: 'clues' });
    expect(parseAssistantRequest({ task: 'ask', context, question: ' What fits 1 Down? ', history: [{ role: 'ai', text: 'Hi' }] }))
      .toMatchObject({ task: 'ask', question: 'What fits 1 Down?' });
  });

  it('rejects malformed input', () => {
    expect(parseAssistantRequest(null)).toBe('request body must be a JSON object');
    expect(parseAssistantRequest({ task: 'ask', context: { ...context, grid: ['CAT'] }, question: 'x' })).toBe('grid is malformed');
    expect(parseAssistantRequest({ task: 'ask', context, question: '' })).toBe('question is missing or too long');
    expect(parseAssistantRequest({ task: 'ask', context, question: 'x', history: [{ role: 'system', text: 'x' }] })).toBe('history is malformed');
    expect(parseAssistantRequest({ task: 'nope', context })).toBe('unknown task');
    const partial = buildContext(p, 'Mini', m, m.down[0], []);
    expect(parseAssistantRequest({ task: 'clues', context: partial })).toBe('the selected entry has empty squares');
  });
});
