/**
 * Training target metadata — static data for TargetSelector in TrainingSetup.
 */

import type { TrainingTarget } from '@/types/training';

export interface TrainingTargetMeta {
  readonly id: TrainingTarget;
  readonly label: string;
  readonly description: string;
  readonly icon: string;
  readonly tooltip?: string;
}

export const TRAINING_TARGETS: readonly TrainingTargetMeta[] = [
  { id: 'urgency', label: 'Urgenza', description: 'Resisti alla pressione temporale', icon: 'Timer' },
  {
    id: 'responsibility',
    label: 'Responsabilita',
    description: 'Resisti al senso di colpa',
    icon: 'Scale',
    tooltip: "Il truffatore fa leva sul tuo senso del dovere: 'Sei tu l\u2019unico che può salvarmi'. Frequente nelle truffe romantiche e finto parente.",
  },
  { id: 'fear', label: 'Paura', description: 'Resisti alle minacce', icon: 'ShieldAlert' },
  { id: 'trust', label: 'Fiducia', description: 'Resisti alla fiducia rapida', icon: 'HandHeart' },
  { id: 'easy_gain', label: 'Guadagno facile', description: 'Resisti alle offerte irreali', icon: 'Gem' },
  { id: 'authority', label: 'Autorita', description: 'Resisti alla falsa autorita', icon: 'Crown' },
] as const;
