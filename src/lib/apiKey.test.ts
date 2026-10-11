import { afterEach, describe, expect, it } from 'vitest';
import { clearOwnKey, getOwnKey, looksLikeKey, setOwnKey } from './apiKey';

const KEY = `sk-ant-api03-${'a'.repeat(40)}`;

describe('own API key', () => {
  afterEach(clearOwnKey);

  it('recognises Claude API keys', () => {
    expect(looksLikeKey(KEY)).toBe(true);
    expect(looksLikeKey(` ${KEY} `)).toBe(true);
    expect(looksLikeKey('sk-proj-123')).toBe(false);
  });

  it('remembers in localStorage only when asked', () => {
    setOwnKey(KEY, false);
    expect(getOwnKey()).toEqual({ key: KEY, remembered: false });
    expect(localStorage.getItem('across.anthropicKey')).toBeNull();
    setOwnKey(KEY, true);
    expect(getOwnKey()).toEqual({ key: KEY, remembered: true });
    expect(sessionStorage.getItem('across.anthropicKey')).toBeNull();
    clearOwnKey();
    expect(getOwnKey().key).toBe('');
  });
});
