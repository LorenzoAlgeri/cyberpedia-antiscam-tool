/**
 * Step type definitions for the anti-scam wizard.
 *
 * Step 0: Landing — emotional decompression
 * Step 1: Emergency — contacts + to-do checklist
 * Step 2: Simulations — interactive chat scenarios
 * Step 3: Install — PWA home screen guide
 * Step 4: Need Mode — on-demand quick actions (post-wizard)
 */

export const STEP_COUNT = 5 as const;

export type StepIndex = 0 | 1 | 2 | 3 | 4;

/** Hash fragments mapped to step indices */
export const STEP_HASHES = [
  '#landing',
  '#emergency',
  '#simulations',
  '#install',
  '#need',
] as const satisfies readonly string[];

export type StepHash = (typeof STEP_HASHES)[number];

/** Step metadata for indicators and a11y labels */
export interface StepMeta {
  readonly index: StepIndex;
  readonly hash: StepHash;
  readonly label: string;
  readonly ariaLabel: string;
}

export const STEPS: readonly StepMeta[] = [
  {
    index: 0,
    hash: '#landing',
    label: 'Inizio',
    ariaLabel: 'Step 1: Pagina iniziale',
  },
  {
    index: 1,
    hash: '#emergency',
    label: 'Emergenza',
    ariaLabel: 'Step 2: Dati di emergenza',
  },
  {
    index: 2,
    hash: '#simulations',
    label: 'Simulazioni',
    ariaLabel: 'Step 3: Simulazioni interattive',
  },
  {
    index: 3,
    hash: '#install',
    label: 'Installa',
    ariaLabel: 'Step 4: Installa app',
  },
  {
    index: 4,
    hash: '#need',
    label: 'Al bisogno',
    ariaLabel: 'Step 5: Modalità al bisogno',
  },
] as const;
