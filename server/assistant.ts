/**
 * The assistant route: POST /api/assistant drafts clues or answers a question with Claude,
 * GET /api/assistant says whether the route is set up. The API key stays on the server.
 *
 * Used by api/assistant.ts (Vercel) and by the dev server middleware in vite.config.ts.
 */
import Anthropic from '@anthropic-ai/sdk';
import {
  parseAssistantRequest, type AssistantRequest, type AssistantResponse, type CluesResult,
} from '../src/lib/assistantContext';
import { askMessages, cluesPrompt, SYSTEM } from './prompts';

export const MODEL = 'claude-opus-5-5';
const MAX_BODY = 200_000;

const CLUES_SCHEMA = {
  type: 'object',
  properties: {
    easy: { type: 'string', description: 'Monday-level clue' },
    tricky: { type: 'string', description: 'Friday or Saturday clue' },
  },
  required: ['easy', 'tricky'],
  additionalProperties: false,
};

/** The subset of the SDK client this route uses, so tests can pass a fake. */
export interface MessagesClient {
  beta: { messages: { create: Anthropic['beta']['messages']['create'] } };
}

function json(body: AssistantResponse | { available: boolean; model: string }, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
  });
}

async function callClaude(client: MessagesClient, req: AssistantRequest): Promise<AssistantResponse> {
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

function apiError(e: unknown): Response {
  if (e instanceof Anthropic.AuthenticationError || e instanceof Anthropic.PermissionDeniedError) {
    return json({ error: 'The server’s Claude API key was rejected.' }, 502);
  }
  if (e instanceof Anthropic.RateLimitError) {
    return json({ error: 'The assistant is busy. Try again in a minute.' }, 429);
  }
  if (e instanceof Anthropic.APIConnectionError) {
    return json({ error: 'The server could not reach the Claude API.' }, 502);
  }
  if (e instanceof Anthropic.APIError) {
    console.error('Claude API error', e.status, e.message);
    return json({ error: 'The Claude API returned an error. Try again.' }, 502);
  }
  console.error('assistant route failed', e);
  return json({ error: 'The assistant failed unexpectedly.' }, 500);
}

export interface HandlerOptions {
  apiKey?: string;
  /** for tests */
  client?: MessagesClient;
}

export async function handleAssistant(request: Request, opts: HandlerOptions = {}): Promise<Response> {
  const apiKey = opts.apiKey ?? process.env.ANTHROPIC_API_KEY;
  const available = !!(opts.client || apiKey);

  if (request.method === 'GET') return json({ available, model: MODEL });
  if (request.method !== 'POST') return json({ error: 'Use GET or POST.' }, 405);
  if (!available) {
    return json({ error: 'The assistant is not set up on this server. Add ANTHROPIC_API_KEY to its environment.' }, 503);
  }

  const raw = await request.text();
  if (raw.length > MAX_BODY) return json({ error: 'Request is too large.' }, 413);
  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return json({ error: 'Request body must be JSON.' }, 400);
  }
  const req = parseAssistantRequest(body);
  if (typeof req === 'string') return json({ error: `Bad request: ${req}.` }, 400);

  const client = opts.client ?? new Anthropic({ apiKey, maxRetries: 2 });
  try {
    return json(await callClaude(client, req));
  } catch (e) {
    return apiError(e);
  }
}
