/** Browser side of /api/assistant. The Claude API key never reaches the browser. */
import type { AssistantRequest, AssistantResponse } from './assistantContext';

const URL = '/api/assistant';

/** Whether the server has a Claude API key. False when the route is missing (a static host). */
export async function assistantAvailable(): Promise<boolean> {
  try {
    const r = await fetch(URL, { headers: { accept: 'application/json' } });
    if (!r.ok) return false;
    const data = (await r.json()) as { available?: unknown };
    return data.available === true;
  } catch {
    return false;
  }
}

export async function callAssistant(req: AssistantRequest, signal?: AbortSignal): Promise<AssistantResponse> {
  try {
    const r = await fetch(URL, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(req),
      signal,
    });
    const data = (await r.json().catch(() => null)) as AssistantResponse | null;
    if (data && typeof data === 'object') return data;
    return { error: `The assistant route answered with status ${r.status}.` };
  } catch (e) {
    if (e instanceof DOMException && e.name === 'AbortError') throw e;
    return { error: 'Could not reach the assistant. Check your connection.' };
  }
}
