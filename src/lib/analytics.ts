import type { AttackType } from '@/types/emergency';

type TrackedAttackType = AttackType | 'implicit-default';

const STATS_KEY = 'antiscam-attack-stats';
const DEVICE_KEY = 'antiscam-device-id';
const MAX_RECORDS = 500;

interface AttackStatRecord {
  readonly attackType: TrackedAttackType;
  readonly timestamp: string;
  /**
   * Stable per-device anonymous identifier.
   * Not a browser "session" — persists across visits.
   */
  readonly deviceId: string;
}

function getDeviceId(): string {
  const existing = localStorage.getItem(DEVICE_KEY);
  if (existing) return existing;
  const id = crypto.randomUUID();
  localStorage.setItem(DEVICE_KEY, id);
  return id;
}

export function trackAttackSelection(attackType: TrackedAttackType): void {
  try {
    const raw = localStorage.getItem(STATS_KEY);
    const list: AttackStatRecord[] = raw ? JSON.parse(raw) : [];
    const record: AttackStatRecord = {
      attackType,
      timestamp: new Date().toISOString(),
      deviceId: getDeviceId(),
    };
    if (list.length >= MAX_RECORDS) {
      list.shift();
    }
    list.push(record);
    localStorage.setItem(STATS_KEY, JSON.stringify(list));
  } catch {
    // Best-effort: never block the UX if stats fail
  }
}

