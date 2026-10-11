// @vitest-environment node
import Anthropic from '@anthropic-ai/sdk';
import { describe, expect, it, vi } from 'vitest';
import { buildContext } from '../src/lib/assistantContext';
import { analyze } from '../src/lib/grid';
import { handleAssistant, MODEL, type MessagesClient } from './assistant';
import { askMessages } from '../src/lib/assistantPrompts';
import { describeError } from '../src/lib/claude';

const g = ['C', 'A', 'T', '', '', '', '', '', ''];
const m = analyze(g, 3, 3);
const context = buildContext({ title: 'Mini', rows: 3, cols: 3, grid: g, clues: {}, nyt: false }, 'Mini', m, m.across[0], []);

const post = (body: unknown) => new Request('http://x/api/assistant', { method: 'POST', body: JSON.stringify(body) });

function fake(reply: object | Error) {
  const create = vi.fn(async () => {
    if (reply instanceof Error) throw reply;
    return reply;
  });
  return { client: { beta: { messages: { create } } } as unknown as MessagesClient, create };
}

describe('handleAssistant', () => {
  it('reports whether a key is configured', async () => {
    const r = await handleAssistant(new Request('http://x/api/assistant'), { apiKey: '' });
    expect(await r.json()).toEqual({ available: false, model: MODEL });
    const post503 = await handleAssistant(post({ task: 'clues', context }), { apiKey: '' });
    expect(post503.status).toBe(503);
  });

  it('drafts clues with structured output and the default fallback', async () => {
    const { client, create } = fake({ stop_reason: 'end_turn', content: [{ type: 'text', text: '{"easy":"Pet that purrs","tricky":"Tom, for one"}' }] });
    const r = await handleAssistant(post({ task: 'clues', context }), { client });
    expect(await r.json()).toEqual({ task: 'clues', clues: { easy: 'Pet that purrs', tricky: 'Tom, for one' } });
    const params = (create.mock.calls[0] as unknown[])[0] as Record<string, unknown>;
    expect(params).toMatchObject({
      model: MODEL,
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      output_config: { effort: 'low', format: { type: 'json_schema' } },
    });
    expect(JSON.stringify(params.messages)).toContain('1 Across, CAT');
  });

  it('answers questions and handles refusals', async () => {
    const ok = fake({ stop_reason: 'end_turn', content: [{ type: 'text', text: 'Try OAT at 1 Down.' }] });
    const r = await handleAssistant(post({ task: 'ask', context, question: 'Ideas?', history: [] }), { client: ok.client });
    expect(await r.json()).toEqual({ task: 'ask', text: 'Try OAT at 1 Down.' });

    const no = fake({ stop_reason: 'refusal', content: [] });
    const r2 = await handleAssistant(post({ task: 'ask', context, question: 'Ideas?', history: [] }), { client: no.client });
    expect(await r2.json()).toMatchObject({ refused: true });
  });

  it('turns API errors into short messages', async () => {
    const { client } = fake(new Anthropic.RateLimitError(429, {}, 'slow down', new Headers()));
    const r = await handleAssistant(post({ task: 'ask', context, question: 'Ideas?', history: [] }), { client });
    expect(r.status).toBe(429);
    expect(await r.json()).toEqual({ error: 'The assistant is busy. Try again in a minute.' });
  });

  it('rejects bad requests before calling Claude', async () => {
    const { client, create } = fake({});
    const r = await handleAssistant(post({ task: 'ask', context, question: '' }), { client });
    expect(r.status).toBe(400);
    expect(create).not.toHaveBeenCalled();
  });
});

describe('askMessages', () => {
  it('starts with the constructor, merges repeats and ends with the question and puzzle', () => {
    const msgs = askMessages(context, 'What next?', [
      { role: 'ai', text: 'Intro' }, { role: 'you', text: 'Suggest fill' }, { role: 'ai', text: 'A' }, { role: 'ai', text: 'B' },
    ]);
    expect(msgs.map((x) => x.role)).toEqual(['user', 'assistant', 'user']);
    expect(msgs[1].content).toBe('A\n\nB');
    expect(msgs[2].content).toContain('<puzzle>');
    expect(msgs[2].content.endsWith('What next?')).toBe(true);
  });
});

describe('describeError', () => {
  it('words key problems for whose key it was', () => {
    const auth = new Anthropic.AuthenticationError(401, {}, 'bad key', new Headers());
    expect(describeError(auth, 'server').message).toBe('The server’s Claude API key was rejected.');
    expect(describeError(auth, 'own').message).toContain('rejected your API key');
    const low = new Anthropic.BadRequestError(400, { type: 'error', error: { type: 'invalid_request_error', message: 'Your credit balance is too low.' } }, undefined, new Headers());
    expect(describeError(low, 'own').message).toBe('The Claude API returned an error. Your credit balance is too low.');
    expect(describeError(low, 'server').message).toBe('The Claude API returned an error.');
  });
});
