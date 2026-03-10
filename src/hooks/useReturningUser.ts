/**
 * Hook to detect returning users who already have encrypted data.
 *
 * Uses storage.hasStoredData() (which checks localStorage for
 * "antiscam-salt" + "antiscam-data" keys) — no PIN required.
 *
 * Returns:
 *   isReturningUser — true if encrypted data already exists
 *
 * The check runs once on mount (sync localStorage read).
 */

import { useState } from 'react';
import { hasStoredData } from '@/lib/storage';

export function useReturningUser(): {
  readonly isReturningUser: boolean;
} {
  // hasStoredData() is synchronous (localStorage.getItem),
  // so we can initialise directly — no useEffect needed.
  const [isReturningUser] = useState<boolean>(() => hasStoredData());

  return { isReturningUser } as const;
}
