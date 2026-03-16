/**
 * useContactPicker — wraps the Contact Picker API with feature detection.
 *
 * Returns:
 *   isSupported — true only on Android Chrome ≥80 / Samsung Internet ≥11.
 *                 Stable for the session; hides the import button on unsupported browsers.
 *   pickContact — opens the native OS contact picker and returns the first
 *                 selected contact's name and phone. Returns null if:
 *                   - browser does not support the API
 *                   - user cancelled the picker (empty array result)
 *                   - a DOMException was thrown (no user gesture, permission denied)
 *
 * Empty-string handling: name and phone are trimmed but may be empty if the
 * contact record has no value for that field. The caller is responsible for
 * deciding whether to write empty strings to state (EmergencyForm skips them).
 */

import { useCallback, useMemo } from 'react';

/** @public Contact data returned by the native Contact Picker API */
export interface PickedContact {
  /** Trimmed display name from the contact record. Empty string if not present. */
  readonly name: string;
  /** Trimmed phone number from the contact record. Empty string if not present. */
  readonly phone: string;
}

/** @public Hook return type — exported for consumer type inference */
export interface ContactPickerResult {
  readonly isSupported: boolean;
  readonly pickContact: () => Promise<PickedContact | null>;
}

/** Stable feature detection — reads browser globals once. */
function detectSupport(): boolean {
  return (
    typeof navigator !== 'undefined' &&
    'contacts' in navigator &&
    navigator.contacts !== undefined
  );
}

export function useContactPicker(): ContactPickerResult {
  // useMemo so the value is computed once and stable across renders
  const isSupported = useMemo(() => detectSupport(), []);

  const pickContact = useCallback(async (): Promise<PickedContact | null> => {
    if (!isSupported || !navigator.contacts) return null;

    try {
      const results = await navigator.contacts.select(['name', 'tel'], {
        multiple: false,
      });

      // Empty array = user dismissed the picker without selecting
      if (results.length === 0) return null;

      const contact = results[0];
      if (!contact) return null;

      const name = contact.name?.[0]?.trim() ?? '';
      const phone = contact.tel?.[0]?.trim() ?? '';

      // Both empty = no useful data; treat as cancellation
      if (!name && !phone) return null;

      return { name, phone };
    } catch {
      // DOMException: user gesture not detected, or picker unavailable
      return null;
    }
  }, [isSupported]);

  return { isSupported, pickContact };
}
