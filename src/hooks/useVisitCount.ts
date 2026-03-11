/**
 * Track app visit count in localStorage (unencrypted — not sensitive).
 *
 * - Reads count before increment → returns post-increment value
 *   so visitCount === 1 on the very first visit.
 * - Increment is guarded by a ref to be React Strict Mode safe
 *   (prevents double-fire in dev).
 *
 * localStorage key: 'antiscam-visit-count' (plain integer string)
 */
import { useState, useRef, useEffect } from 'react';

const STORAGE_KEY = 'antiscam-visit-count';

export function useVisitCount(): { readonly visitCount: number } {
  // Read pre-increment count synchronously
  const [preCount] = useState<number>(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw !== null ? parseInt(raw, 10) : 0;
  });

  // Increment once per mount — ref guards against Strict Mode double-fire
  const hasIncrementedRef = useRef(false);
  useEffect(() => {
    if (hasIncrementedRef.current) return;
    hasIncrementedRef.current = true;
    localStorage.setItem(STORAGE_KEY, String(preCount + 1));
  }, [preCount]);

  // Return post-increment value: visit 1 → 1, visit 2 → 2, etc.
  return { visitCount: preCount + 1 };
}
