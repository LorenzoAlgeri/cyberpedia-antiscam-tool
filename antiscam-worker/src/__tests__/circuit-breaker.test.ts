import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createCircuitBreaker } from '../circuit-breaker';

// Suppress logger output during tests
vi.mock('../logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

describe('createCircuitBreaker', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('is closed by default', () => {
    const cb = createCircuitBreaker('test');
    expect(cb.isOpen()).toBe(false);
  });

  it('stays closed below the failure threshold', () => {
    const cb = createCircuitBreaker('test');
    cb.recordFailure();
    cb.recordFailure();
    expect(cb.isOpen()).toBe(false);
  });

  it('opens after 3 consecutive failures', () => {
    const cb = createCircuitBreaker('test');
    cb.recordFailure();
    cb.recordFailure();
    cb.recordFailure();
    expect(cb.isOpen()).toBe(true);
  });

  it('stays open within the reset window', () => {
    const cb = createCircuitBreaker('test');
    cb.recordFailure();
    cb.recordFailure();
    cb.recordFailure();
    vi.advanceTimersByTime(30_000); // 30s — still within 60s window
    expect(cb.isOpen()).toBe(true);
  });

  it('transitions to half-open after reset window expires', () => {
    const cb = createCircuitBreaker('test');
    cb.recordFailure();
    cb.recordFailure();
    cb.recordFailure();
    expect(cb.isOpen()).toBe(true);

    vi.advanceTimersByTime(61_000);
    // Half-open: allows one probe through
    expect(cb.isOpen()).toBe(false);
  });

  it('re-opens if probe fails in half-open state', () => {
    const cb = createCircuitBreaker('test');
    cb.recordFailure();
    cb.recordFailure();
    cb.recordFailure();

    vi.advanceTimersByTime(61_000);
    expect(cb.isOpen()).toBe(false); // half-open probe allowed

    // Probe fails — should re-open (failures went from THRESHOLD-1 to THRESHOLD)
    cb.recordFailure();
    expect(cb.isOpen()).toBe(true);
  });

  it('closes fully after a success', () => {
    const cb = createCircuitBreaker('test');
    cb.recordFailure();
    cb.recordFailure();
    cb.recordFailure();
    cb.recordSuccess();
    expect(cb.isOpen()).toBe(false);
  });

  it('resets failure counter after a success', () => {
    const cb = createCircuitBreaker('test');
    cb.recordFailure();
    cb.recordFailure();
    cb.recordSuccess(); // resets
    cb.recordFailure();
    cb.recordFailure();
    // Only 2 failures since last success — still below threshold
    expect(cb.isOpen()).toBe(false);
  });

  it('requires 3 more failures to re-open after success resets', () => {
    const cb = createCircuitBreaker('test');
    cb.recordFailure();
    cb.recordFailure();
    cb.recordSuccess();
    cb.recordFailure();
    cb.recordFailure();
    cb.recordFailure();
    expect(cb.isOpen()).toBe(true);
  });
});
