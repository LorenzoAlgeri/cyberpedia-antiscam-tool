/**
 * Debounced auto-save hook for encrypted emergency data.
 *
 * Orchestrates save timing and status feedback:
 * - scheduleAutoSave() → debounces at 1.5s, only fires when PIN is set
 * - triggerSave()      → immediate save (for manual "Salva" button)
 * - saveWithPin(pin)   → immediate save with a PIN override
 *                        (used when PIN is first created and state
 *                         hasn't propagated yet)
 *
 * Returns a reactive `status` for the SaveStatusBadge:
 *   'idle' | 'saving' | 'saved' | 'error'
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import type { EmergencyData } from '@/types/emergency';
import { saveEmergencyData } from '@/lib/storage';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Auto-save debounce delay (ms) — per CLAUDE.md spec */
const AUTO_SAVE_DELAY = 1_500;

/** How long the "Salvato ✓" badge stays visible (ms) */
const SAVED_DISPLAY_MS = 2_500;

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useAutoSave(
  getData: () => EmergencyData,
  pin: string | null,
) {
  const [status, setStatus] = useState<SaveStatus>('idle');
  const [lastSaved, setLastSaved] = useState<string | null>(null);

  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const getDataRef = useRef(getData);

  // Always keep the latest getData without effect re-runs
  useEffect(() => {
    getDataRef.current = getData;
  });

  // Cleanup timers on unmount
  useEffect(
    () => () => {
      if (timerRef.current !== undefined) clearTimeout(timerRef.current);
      if (savedTimerRef.current !== undefined)
        clearTimeout(savedTimerRef.current);
    },
    [],
  );

  /** Internal: execute the actual save and manage status transitions. */
  const executeSave = useCallback(async (savePin: string) => {
    setStatus('saving');
    try {
      await saveEmergencyData(getDataRef.current(), savePin);
      setLastSaved(new Date().toISOString());
      setStatus('saved');
      // Reset to idle after a short display period
      if (savedTimerRef.current !== undefined)
        clearTimeout(savedTimerRef.current);
      savedTimerRef.current = setTimeout(
        () => setStatus('idle'),
        SAVED_DISPLAY_MS,
      );
    } catch {
      setStatus('error');
    }
  }, []);

  /**
   * Schedule a debounced auto-save.
   * Call this on every data mutation; it only fires when PIN is available.
   */
  const scheduleAutoSave = useCallback(() => {
    if (!pin) return; // No PIN yet → skip silently
    if (timerRef.current !== undefined) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => void executeSave(pin), AUTO_SAVE_DELAY);
  }, [pin, executeSave]);

  /** Immediate save using the current PIN state. */
  const triggerSave = useCallback(async () => {
    if (!pin) return;
    if (timerRef.current !== undefined) clearTimeout(timerRef.current);
    await executeSave(pin);
  }, [pin, executeSave]);

  /**
   * Immediate save with an explicit PIN override.
   * Used when the PIN was just created and useState hasn't propagated.
   */
  const saveWithPin = useCallback(
    async (overridePin: string) => {
      if (timerRef.current !== undefined) clearTimeout(timerRef.current);
      await executeSave(overridePin);
    },
    [executeSave],
  );

  return { status, lastSaved, scheduleAutoSave, triggerSave, saveWithPin } as const;
}
