/**
 * Attack type metadata — static data for the AttackTypeSelector.
 *
 * 6 types per CLAUDE.md spec, each with:
 * - Lucide icon name (matched in component via icon map)
 * - Italian label + short description
 *
 * Sources referenced: Polizia Postale, ENISA, FBI IC3
 */

import type { AttackTypeMeta } from '@/types/emergency';

export const ATTACK_TYPES: readonly AttackTypeMeta[] = [
  {
    id: 'financial',
    label: 'Truffa finanziaria',
    description: 'Investimenti falsi, trading, crypto scam',
    icon: 'Banknote',
  },
  {
    id: 'romance',
    label: 'Truffa sentimentale',
    description: 'Romance scam, relazioni online false',
    icon: 'Heart',
  },
  {
    id: 'fake-operator',
    label: 'Finto operatore',
    description: 'Falso bancario o supporto tecnico',
    icon: 'Headset',
  },
  {
    id: 'phishing',
    label: 'Phishing / Smishing',
    description: 'Email o SMS con link fraudolenti',
    icon: 'Mail',
  },
  {
    id: 'fake-relative',
    label: 'Finto parente',
    description: '"Ciao mamma, ho cambiato numero"',
    icon: 'Users',
  },
  {
    id: 'social-engineering',
    label: 'Pressione e urgenza',
    description: 'Manipolazione psicologica, richieste sotto pressione',
    icon: 'Brain',
  },
] as const;

