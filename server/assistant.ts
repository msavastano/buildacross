/**
 * The assistant route: POST /api/assistant drafts clues or answers a question with Claude,
 * GET /api/assistant says whether the route is set up. The API key stays on the server.
 *
 * Used by api/assistant.ts (Vercel) and by the dev server middleware in vite.config.ts.
 */
import Anthropic from '@anthropic-ai/sdk';
import { parseAssistantRequest, type AssistantResponse } from '../src/lib/assistantContext.js';
import { describeError, MODEL, runAssistant, type MessagesClient } from '../src/lib/claude.js';

export { MODEL, type MessagesClient };

const MAX_BODY = 200_000;

function json(body: AssistantResponse | { available: boolean; model: string }, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
  });
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
    return json(await runAssistant(client, req));
  } catch (e) {
    const { status, message } = describeError(e, 'server');
    if (status >= 500 && !(e instanceof Anthropic.AuthenticationError)) console.error('assistant route failed', e);
    return json({ error: message }, status);
  }
}
