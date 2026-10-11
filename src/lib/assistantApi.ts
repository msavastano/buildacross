/**
 * Browser side of the assistant. Requests go to /api/assistant when the server has a Claude
 * API key; otherwise, with the constructor's own key, straight from this browser to Anthropic.
 * Either way the server's key never reaches the browser and the constructor's never reaches
 * our server.
 */
import type { AssistantRequest, AssistantResponse } from './assistantContext';

const URL = '/api/assistant';

export type AssistantRoute = { via: 'server' } | { via: 'own'; key: string };

/** Whether the server has a Claude API key. False when the route is missing (a static host). */
export async function serverAvailable(): Promise<boolean> {
  try {
    const r = await fetch(URL, { headers: { accept: 'application/json' } });
    if (!r.ok) return false;
    const data = (await r.json()) as { available?: unknown };
    return data.available === true;
  } catch {
    return false;
  }
}

async function ownClient(key: string) {
  const { default: Anthropic } = await import('@anthropic-ai/sdk');
  // The key belongs to the person at this browser, and requests go only to Anthropic.
  return new Anthropic({ apiKey: key, dangerouslyAllowBrowser: true, maxRetries: 2 });
}

export async function callAssistant(req: AssistantRequest, route: AssistantRoute): Promise<AssistantResponse> {
  if (route.via === 'own') {
    const { runAssistant, describeError } = await import('./claude');
    try {
      return await runAssistant(await ownClient(route.key), req);
    } catch (e) {
      return { error: describeError(e, 'own').message };
    }
  }
  try {
    const r = await fetch(URL, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(req),
    });
    const data = (await r.json().catch(() => null)) as AssistantResponse | null;
    if (data && typeof data === 'object') return data;
    return { error: `The assistant route answered with status ${r.status}.` };
  } catch {
    return { error: 'Could not reach the assistant. Check your connection.' };
  }
}

/** Checks a key with a free call that lists models. Returns an error message, or null when it works. */
export async function checkOwnKey(key: string): Promise<string | null> {
  const { describeError } = await import('./claude');
  try {
    const client = await ownClient(key);
    await client.models.list({ limit: 1 });
    return null;
  } catch (e) {
    const { message } = describeError(e, 'own');
    return message.startsWith('Claude rejected') ? 'Claude rejected this key. Check that you copied all of it.' : message;
  }
}
