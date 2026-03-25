import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fetchWithRetry } from '../training-gemini';

// Suppress logger output during tests
vi.mock('../logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

describe('fetchWithRetry', () => {
  const mockFetch = vi.fn();

  beforeEach(() => {
    mockFetch.mockReset();
    vi.useFakeTimers();
    vi.stubGlobal('fetch', mockFetch);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('returns immediately on 200', async () => {
    mockFetch.mockResolvedValueOnce(new Response('ok', { status: 200 }));

    const res = await fetchWithRetry('https://example.com', {}, 10_000, 1);
    expect(res.status).toBe(200);
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('does not retry on 400 (client error)', async () => {
    mockFetch.mockResolvedValueOnce(new Response('bad', { status: 400 }));

    const res = await fetchWithRetry('https://example.com', {}, 10_000, 1);
    expect(res.status).toBe(400);
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('does not retry on 401', async () => {
    mockFetch.mockResolvedValueOnce(new Response('unauthorized', { status: 401 }));

    const res = await fetchWithRetry('https://example.com', {}, 10_000, 1);
    expect(res.status).toBe(401);
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('retries once on 429 and returns second response', async () => {
    mockFetch
      .mockResolvedValueOnce(new Response('rate limited', { status: 429 }))
      .mockResolvedValueOnce(new Response('ok', { status: 200 }));

    const promise = fetchWithRetry('https://example.com', {}, 10_000, 1);
    await vi.runAllTimersAsync();
    const res = await promise;

    expect(res.status).toBe(200);
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it('retries on 500 server error', async () => {
    mockFetch
      .mockResolvedValueOnce(new Response('error', { status: 500 }))
      .mockResolvedValueOnce(new Response('ok', { status: 200 }));

    const promise = fetchWithRetry('https://example.com', {}, 10_000, 1);
    await vi.runAllTimersAsync();
    const res = await promise;

    expect(res.status).toBe(200);
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it('retries on 502, 503, 504', async () => {
    for (const status of [502, 503, 504]) {
      mockFetch.mockReset();
      mockFetch
        .mockResolvedValueOnce(new Response('', { status }))
        .mockResolvedValueOnce(new Response('ok', { status: 200 }));

      const promise = fetchWithRetry('https://example.com', {}, 10_000, 1);
      await vi.runAllTimersAsync();
      const res = await promise;

      expect(res.status).toBe(200);
      expect(mockFetch).toHaveBeenCalledTimes(2);
    }
  });

  it('returns last response after exhausting retries', async () => {
    mockFetch.mockResolvedValue(new Response('rate limited', { status: 429 }));

    const promise = fetchWithRetry('https://example.com', {}, 10_000, 1);
    await vi.runAllTimersAsync();
    const res = await promise;

    expect(res.status).toBe(429);
    expect(mockFetch).toHaveBeenCalledTimes(2); // 1 initial + 1 retry
  });

  it('respects Retry-After header (caps at 4s)', async () => {
    const delays: number[] = [];
    const origSetTimeout = globalThis.setTimeout;
    vi.spyOn(globalThis, 'setTimeout').mockImplementation((fn: TimerHandler, ms?: number, ...args: unknown[]) => {
      if (typeof ms === 'number' && ms > 0) delays.push(ms);
      return origSetTimeout(fn as (...args: unknown[]) => void, 0, ...args);
    });

    mockFetch
      .mockResolvedValueOnce(
        new Response('', { status: 429, headers: { 'Retry-After': '3' } }),
      )
      .mockResolvedValueOnce(new Response('ok', { status: 200 }));

    const promise = fetchWithRetry('https://example.com', {}, 10_000, 1);
    await vi.runAllTimersAsync();
    await promise;

    // Should have a 3000ms delay from Retry-After: 3
    expect(delays.some(d => d === 3000)).toBe(true);
  });

  it('caps Retry-After at 4 seconds', async () => {
    const delays: number[] = [];
    const origSetTimeout = globalThis.setTimeout;
    vi.spyOn(globalThis, 'setTimeout').mockImplementation((fn: TimerHandler, ms?: number, ...args: unknown[]) => {
      if (typeof ms === 'number' && ms > 0) delays.push(ms);
      return origSetTimeout(fn as (...args: unknown[]) => void, 0, ...args);
    });

    mockFetch
      .mockResolvedValueOnce(
        new Response('', { status: 429, headers: { 'Retry-After': '60' } }),
      )
      .mockResolvedValueOnce(new Response('ok', { status: 200 }));

    const promise = fetchWithRetry('https://example.com', {}, 10_000, 1);
    await vi.runAllTimersAsync();
    await promise;

    // Delay should be capped at 4000ms, not 60000ms
    expect(delays.some(d => d === 4000)).toBe(true);
    expect(delays.every(d => d <= 10_000)).toBe(true); // nothing above timeout
  });

  it('defaults to 2s delay without Retry-After header', async () => {
    const delays: number[] = [];
    const origSetTimeout = globalThis.setTimeout;
    vi.spyOn(globalThis, 'setTimeout').mockImplementation((fn: TimerHandler, ms?: number, ...args: unknown[]) => {
      if (typeof ms === 'number' && ms > 0) delays.push(ms);
      return origSetTimeout(fn as (...args: unknown[]) => void, 0, ...args);
    });

    mockFetch
      .mockResolvedValueOnce(new Response('', { status: 500 }))
      .mockResolvedValueOnce(new Response('ok', { status: 200 }));

    const promise = fetchWithRetry('https://example.com', {}, 10_000, 1);
    await vi.runAllTimersAsync();
    await promise;

    expect(delays.some(d => d === 2000)).toBe(true);
  });

  it('aborts early if external signal is already aborted', async () => {
    const abortController = new AbortController();
    abortController.abort();

    await expect(
      fetchWithRetry('https://example.com', {}, 10_000, 1, abortController.signal),
    ).rejects.toThrow('Client disconnected');
    expect(mockFetch).not.toHaveBeenCalled();
  });
});
