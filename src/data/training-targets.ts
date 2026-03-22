/**
 * Training target metadata — static data for TargetSelector in TrainingSetup.
 */

import type { TrainingTarget } from '@/types/training';

export interface TrainingTargetMeta {
  readonly id: TrainingTarget;
  readonly label: string;
  readonly description: string;
  readonly icon: string;
}

export const TRAINING_TARGETS: readonly TrainingTargetMeta[] = [
  { id: 'urgency', label: 'Urgenza', description: 'Resisti alla pressione temporale', icon: 'Timer' },
  { id: 'responsibility', label: 'Responsabilita', description: 'Resisti al senso di colpa', icon: 'Scale' },
  { id: 'fear', label: 'Paura', description: 'Resisti alle minacce', icon: 'ShieldAlert' },
  { id: 'trust', label: 'Fiducia', description: 'Resisti alla fiducia rapida', icon: 'HandHeart' },
  { id: 'greed', label: 'Avidita', description: 'Resisti alle offerte irreali', icon: 'Gem' },
  { id: 'authority', label: 'Autorita', description: 'Resisti alla falsa autorita', icon: 'Crown' },
] as const;
