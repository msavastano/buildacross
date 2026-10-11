/**
 * The Claude call behind the assistant. Runs on the server (server/assistant.ts) with the
 * server's key, or in the browser with the constructor's own key (src/lib/assistantApi.ts,
 * loaded lazily so the SDK stays out of the main bundle).
 */
import Anthropic from '@anthropic-ai/sdk';
import type { AssistantRequest, AssistantResponse, CluesResult } from './assistantContext';
import { askMessages, cluesPrompt, SYSTEM } from './assistantPrompts';

export const MODEL = 'claude-opus-5-5';

const CLUES_SCHEMA = {
  type: 'object',
  properties: {
    easy: { type: 'string', description: 'Monday-level clue' },
    tricky: { type: 'string', description: 'Friday or Saturday clue' },
  },
  required: ['easy', 'tricky'],
  additionalProperties: false,
};

/** The subset of the SDK client the assistant uses, so tests can pass a fake. */
export interface MessagesClient {
  beta: { messages: { create: Anthropic['beta']['messages']['create'] } };
}

export async function runAssistant(client: MessagesClient, req: AssistantRequest): Promise<AssistantResponse> {
  const clues = req.task === 'clues';
  const msg = await client.beta.messages.create({
    model: MODEL,
    max_tokens: 8000,
    system: SYSTEM,
    messages: clues ? [{ role: 'user', content: cluesPrompt(req.context) }] : askMessages(req.context, req.question, req.history),
    output_config: clues
      ? { effort: 'low', format: { type: 'json_schema', schema: CLUES_SCHEMA } }
      : { effort: 'medium' },
    // If Claude declines, the API retries on Anthropic's recommended fallback model in the same call.
    betas: ['server-side-fallback-2026-07-01'],
    fallbacks: 'default',
  });

  if (msg.stop_reason === 'refusal') {
    return { refused: true, text: 'The assistant declined this request. Try rewording it.' };
  }
  const text = msg.content.flatMap((b) => (b.type === 'text' ? [b.text] : [])).join('').trim();
  if (!clues) {
    return { task: 'ask', text: text || 'The assistant returned an empty answer. Try asking again.' };
  }
  try {
    const parsed = JSON.parse(text) as CluesResult;
    if (typeof parsed.easy === 'string' && typeof parsed.tricky === 'string') {
      return { task: 'clues', clues: { easy: parsed.easy.trim(), tricky: parsed.tricky.trim() } };
    }
  } catch {
    /* fall through */
  }
  return { error: 'The assistant returned drafts in an unexpected shape. Try again.' };
}

/**
 * A short message for a failed call, and the HTTP status the server route answers with.
 * `owner` says whose key was used: the server's, or the constructor's own.
 */
export function describeError(e: unknown, owner: 'server' | 'own'): { status: number; message: string } {
  if (e instanceof Anthropic.AuthenticationError || e instanceof Anthropic.PermissionDeniedError) {
    return {
      status: 502,
      message: owner === 'own' ? 'Claude rejected your API key. Change it under Your API key.' : 'The server’s Claude API key was rejected.',
    };
  }
  if (e instanceof Anthropic.RateLimitError) {
    return { status: 429, message: 'The assistant is busy. Try again in a minute.' };
  }
  if (e instanceof Anthropic.APIConnectionError) {
    return { status: 502, message: 'Could not reach the Claude API. Check your connection.' };
  }
  if (e instanceof Anthropic.APIError) {
    // With the constructor's own key the API's reason (a low credit balance, say) is theirs to see.
    const body = e.error as { error?: { message?: unknown } } | undefined;
    const reason = typeof body?.error?.message === 'string' ? body.error.message : '';
    const detail = owner === 'own' && reason ? ` ${reason}` : '';
    return { status: 502, message: `The Claude API returned an error.${detail}` };
  }
  return { status: 500, message: 'The assistant failed unexpectedly.' };
}
