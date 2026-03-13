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

export function clearVictimStatus(): void {
  localStorage.removeItem(KEY);
}

