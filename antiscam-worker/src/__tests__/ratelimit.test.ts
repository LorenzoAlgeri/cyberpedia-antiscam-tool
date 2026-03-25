import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { checkRateLimit } from '../ratelimit';

/**
 * Mock KV namespace that stores entries in a Map with TTL support.
 * Entries expire based on Date.now() (works with vi.useFakeTimers).
 */
function createMockKV(): KVNamespace {
  const store = new Map<string, { value: string; expiresAt: number }>();
  return {
    get: vi.fn(async (key: string) => {
      const entry = store.get(key);
      if (!entry) return null;
      if (entry.expiresAt > 0 && Date.now() >= entry.expiresAt) {
        store.delete(key);
        return null;
      }
      return entry.value;
    }),
    put: vi.fn(async (key: string, value: string, opts?: { expirationTtl?: number }) => {
      const expiresAt = opts?.expirationTtl ? Date.now() + opts.expirationTtl * 1000 : 0;
      store.set(key, { value, expiresAt });
    }),
    delete: vi.fn(async () => {}),
    list: vi.fn(async () => ({ keys: [], list_complete: true, cacheStatus: null })),
    getWithMetadata: vi.fn(async () => ({ value: null, metadata: null, cacheStatus: null })),
  } as unknown as KVNamespace;
}

describe('checkRateLimit', () => {
  let kv: KVNamespace;

  beforeEach(() => {
    kv = createMockKV();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-06-01T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('allows the first request', async () => {
    const result = await checkRateLimit(kv, '1.2.3.4', 10, 'test');
    expect(result.allowed).toBe(true);
  });

  it('allows multiple requests within the per-IP limit', async () => {
    for (let i = 0; i < 5; i++) {
      const result = await checkRateLimit(kv, '1.2.3.4', 10, 'test');
      expect(result.allowed).toBe(true);
    }
  });

  it('blocks request when per-IP limit is exceeded', async () => {
    // Use limit of 3 for fast testing
    for (let i = 0; i < 3; i++) {
      const result = await checkRateLimit(kv, '1.2.3.4', 3, 'test');
      expect(result.allowed).toBe(true);
    }
    const blocked = await checkRateLimit(kv, '1.2.3.4', 3, 'test');
    expect(blocked.allowed).toBe(false);
    expect(blocked.limitType).toBe('ip');
    expect(blocked.retryAfter).toBeGreaterThan(0);
  });

  it('allows requests from different IPs independently', async () => {
    for (let i = 0; i < 3; i++) {
      await checkRateLimit(kv, '1.2.3.4', 3, 'test');
    }
    // IP 1 is at limit
    const blocked = await checkRateLimit(kv, '1.2.3.4', 3, 'test');
    expect(blocked.allowed).toBe(false);

    // Different IP should still be allowed
    const result = await checkRateLimit(kv, '5.6.7.8', 3, 'test');
    expect(result.allowed).toBe(true);
  });

  it('resets after KV TTL expires (2 full windows)', async () => {
    for (let i = 0; i < 3; i++) {
      await checkRateLimit(kv, '1.2.3.4', 3, 'test');
    }
    const blocked = await checkRateLimit(kv, '1.2.3.4', 3, 'test');
    expect(blocked.allowed).toBe(false);

    // The sliding window stores entries with expirationTtl = WINDOW_SECONDS * 2.
    // Once blocked, the rotation path doesn't write (request denied), so the
    // entry persists until KV TTL expires. After 2 full windows + 1s,
    // the KV entry is gone and the counter starts fresh.
    vi.advanceTimersByTime(7201_000); // 2 hours + 1s → KV TTL expired

    const afterExpiry = await checkRateLimit(kv, '1.2.3.4', 3, 'test');
    expect(afterExpiry.allowed).toBe(true);
  });

  it('enforces global limits for known prefixes', async () => {
    // 'lead' has global limit of 200 — test that global key is checked
    // We can't easily hit 200 in a unit test, but verify the KV get is called
    // for the global key
    await checkRateLimit(kv, '1.2.3.4', 100, 'lead');
    expect(kv.get).toHaveBeenCalledWith(expect.stringContaining('rl:global:lead'));
  });

  it('does not check global limit for unknown prefixes', async () => {
    await checkRateLimit(kv, '1.2.3.4', 100, 'unknown-prefix');
    const calls = (kv.get as ReturnType<typeof vi.fn>).mock.calls;
    const globalCalls = calls.filter((c: string[]) => c[0]?.includes('rl:global:'));
    expect(globalCalls.length).toBe(0);
  });

  it('handles corrupt KV data gracefully', async () => {
    // Pre-populate with corrupt data
    await kv.put('rl:test:1.2.3.4', 'not-json{{{');

    const result = await checkRateLimit(kv, '1.2.3.4', 10, 'test');
    expect(result.allowed).toBe(true); // Should reset and allow
  });
});
