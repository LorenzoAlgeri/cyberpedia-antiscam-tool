/**
 * Step type definitions for the anti-scam wizard.
 *
 * Step 0: Landing — emotional decompression
 * Step 1: Checklist — attack type selector (skipped on first visit)
 * Step 2: Emergency — contacts + bank data (profile setup)
 * Step 3: Simulations — interactive chat scenarios
 * Step 4: Install — PWA home screen guide
 * Step 5: Need Mode — on-demand quick actions (post-wizard)
 */

/** @public Total number of wizard steps */
export const STEP_COUNT = 6 as const;

export type StepIndex = 0 | 1 | 2 | 3 | 4 | 5;

/** Hash fragments mapped to step indices */
export const STEP_HASHES = [
  '#landing',
  '#checklist',
  '#emergency',
  '#simulations',
  '#install',
  '#need',
] as const satisfies readonly string[];

/** @public Union type of all valid step hash fragments */
export type StepHash = (typeof STEP_HASHES)[number];

/** @public Step metadata for indicators and a11y labels */
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
    hash: '#checklist',
    label: 'Checklist',
    ariaLabel: 'Step 2: Cosa sta succedendo',
  },
  {
    index: 2,
    hash: '#emergency',
    label: 'Emergenza',
    ariaLabel: 'Step 3: Dati di emergenza',
  },
  {
    index: 3,
    hash: '#simulations',
    label: 'Simulazioni',
    ariaLabel: 'Step 4: Simulazioni interattive',
  },
  {
    index: 4,
    hash: '#install',
    label: 'Installa',
    ariaLabel: 'Step 5: Installa app',
  },
  {
    index: 5,
    hash: '#need',
    label: 'Al bisogno',
    ariaLabel: 'Step 6: Modalità al bisogno',
  },
] as const;
