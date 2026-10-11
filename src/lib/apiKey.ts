/**
 * The constructor's own Claude API key, for when the server has none. It stays in this
 * browser: localStorage when they choose "Remember on this browser", otherwise
 * sessionStorage (gone when the tab closes). It is only ever sent to Anthropic.
 */
const KEY = 'across.anthropicKey';

export function getOwnKey(): { key: string; remembered: boolean } {
  try {
    const saved = localStorage.getItem(KEY);
    if (saved) return { key: saved, remembered: true };
    return { key: sessionStorage.getItem(KEY) ?? '', remembered: false };
  } catch {
    return { key: '', remembered: false };
  }
}

/** Returns false when the browser refused to store it. */
export function setOwnKey(key: string, remember: boolean): boolean {
  clearOwnKey();
  try {
    (remember ? localStorage : sessionStorage).setItem(KEY, key.trim());
    return true;
  } catch {
    return false;
  }
}

export function clearOwnKey(): void {
  try {
    localStorage.removeItem(KEY);
    sessionStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}

/** Claude API keys start with sk-ant-. */
export function looksLikeKey(k: string): boolean {
  return /^sk-ant-[A-Za-z0-9_-]{20,}$/.test(k.trim());
}
