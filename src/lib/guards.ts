/**
 * Runtime type guards for localStorage data boundaries.
 *
 * validateEmergencyData: merges missing fields from defaults, strips
 * unknown keys, and never throws -- tolerant of partial data.
 *
 * assertNever: exhaustive switch helper for compile-time + runtime safety.
 */

import type { EmergencyData, AttackType, TrustedContact } from '@/types/emergency';
import { createEmptyEmergencyData, MAX_CONTACTS } from '@/types/emergency';

// All valid attack type literals -- used for runtime validation
const ATTACK_TYPES: readonly string[] = [
  'financial',
  'romance',
  'fake-operator',
  'phishing',
  'fake-relative',
  'social-engineering',
] as const;

// ---------------------------------------------------------------------------
// Private helpers
// ---------------------------------------------------------------------------

/** Runtime check that `value` is one of the 6 known AttackType literals. */
function isAttackType(value: unknown): value is AttackType {
  return typeof value === 'string' && ATTACK_TYPES.includes(value);
}

/** Runtime check that `value` has at least name + phone strings. */
function isValidContact(value: unknown): value is TrustedContact {
  if (typeof value !== 'object' || value === null) return false;
  const rec = value as Record<string, unknown>;
  return typeof rec['name'] === 'string' && typeof rec['phone'] === 'string';
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Exhaustive switch helper. Place in `default:` branch to get a compile-time
 * error if a case is missing, plus a runtime error if reached anyway.
 */
export function assertNever(value: never, message?: string): never {
  throw new Error(message ?? `Unexpected value: ${String(value)}`);
}

/**
 * Validate and normalize an unknown value into a well-typed EmergencyData.
 *
 * - Non-object / null / array inputs: returns fresh defaults
 * - Missing fields: filled from createEmptyEmergencyData()
 * - Wrong-type fields: replaced with defaults
 * - Extra fields: stripped (only schema fields survive)
 * - Contacts: filtered through isValidContact, capped at MAX_CONTACTS,
 *   extra properties stripped per contact
 *
 * NEVER throws -- returns defaults for any unrecoverable shape.
 */
export function validateEmergencyData(raw: unknown): EmergencyData {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
    return createEmptyEmergencyData();
  }

  const obj = raw as Record<string, unknown>;
  const defaults = createEmptyEmergencyData();

  // Contacts: filter valid entries, strip extra properties, cap at MAX_CONTACTS
  let contacts: TrustedContact[] = defaults.contacts;
  if (Array.isArray(obj['contacts'])) {
    contacts = (obj['contacts'] as unknown[])
      .filter(isValidContact)
      .slice(0, MAX_CONTACTS)
      .map((c) => ({ name: c.name, phone: c.phone, countryCode: typeof c.countryCode === 'string' ? c.countryCode : '+39' }));
  }

  // Completed todo IDs: filter to strings from arrays
  const completedGenericTodos = Array.isArray(obj['completedGenericTodos'])
    ? (obj['completedGenericTodos'] as unknown[]).filter((v): v is string => typeof v === 'string')
    : defaults.completedGenericTodos;

  const completedAttackTodos = Array.isArray(obj['completedAttackTodos'])
    ? (obj['completedAttackTodos'] as unknown[]).filter((v): v is string => typeof v === 'string')
    : defaults.completedAttackTodos;

  return {
    bankName: typeof obj['bankName'] === 'string' ? obj['bankName'] : defaults.bankName,
    bankCountryCode: typeof obj['bankCountryCode'] === 'string' ? obj['bankCountryCode'] : defaults.bankCountryCode,
    bankPhone: typeof obj['bankPhone'] === 'string' ? obj['bankPhone'] : defaults.bankPhone,
    contacts,
    selectedAttack: isAttackType(obj['selectedAttack']) ? obj['selectedAttack'] : defaults.selectedAttack,
    completedGenericTodos,
    completedAttackTodos,
    lastSaved: typeof obj['lastSaved'] === 'string' ? obj['lastSaved'] : defaults.lastSaved,
  };
}
