/**
 * Type definitions for emergency data stored encrypted in localStorage.
 *
 * Data model:
 * - Bank anti-fraud phone number
 * - Up to 3 trusted contacts (name + phone)
 * - Selected attack type
 * - Completed to-do item IDs
 */

/** The 6 attack types supported by the tool */
export type AttackType =
  | 'financial'
  | 'romance'
  | 'fake-operator'
  | 'phishing'
  | 'fake-relative'
  | 'social-engineering';

/** Attack type metadata for UI rendering */
export interface AttackTypeMeta {
  readonly id: AttackType;
  readonly label: string;
  readonly description: string;
  readonly icon: string; // Lucide icon name
}

/** A trusted contact entry */
export interface TrustedContact {
  name: string;
  phone: string;
}

/** Maximum number of trusted contacts */
export const MAX_CONTACTS = 3 as const;

/**
 * The full emergency data payload that gets encrypted.
 * This is the single source of truth for user data.
 */
export interface EmergencyData {
  /** Bank anti-fraud phone number */
  bankPhone: string;
  /** Up to 3 trusted contacts */
  contacts: TrustedContact[];
  /** Currently selected attack type (null = generic) */
  selectedAttack: AttackType | null;
  /** IDs of completed generic to-do items */
  completedGenericTodos: string[];
  /** IDs of completed attack-specific to-do items */
  completedAttackTodos: string[];
  /** Timestamp of last save (ISO 8601) */
  lastSaved: string;
}

/** Factory for a blank EmergencyData record */
export function createEmptyEmergencyData(): EmergencyData {
  return {
    bankPhone: '',
    contacts: [],
    selectedAttack: null,
    completedGenericTodos: [],
    completedAttackTodos: [],
    lastSaved: new Date().toISOString(),
  };
}
