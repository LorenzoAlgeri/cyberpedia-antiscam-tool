export type VictimStatus = 'yes' | 'no';

const KEY = 'antiscam-victim-status';

export function readVictimStatus(): VictimStatus | null {
  const raw = localStorage.getItem(KEY);
  if (raw === 'yes' || raw === 'no') return raw;
  return null;
}

export function writeVictimStatus(value: VictimStatus): void {
  localStorage.setItem(KEY, value);
}

/** @public Intentional public API for future "reset" feature */
export function clearVictimStatus(): void {
  localStorage.removeItem(KEY);
}

