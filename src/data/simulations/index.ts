/**
 * Barrel export for all simulation scripts.
 *
 * 4 scenarios per CLAUDE.md spec:
 * S1: Romance scam
 * S2: Urgent loan from "friend"
 * S3: Fake bank operator
 * S4: Fake relative WhatsApp
 */

import { romanceScam } from './romance-scam';
import { urgentLoan } from './urgent-loan';
import { fakeBankOperator } from './fake-bank-operator';
import { fakeRelative } from './fake-relative';
import type { Simulation } from '@/types/simulation';

/** All simulations in display order */
export const simulations: readonly Simulation[] = [
  romanceScam,
  urgentLoan,
  fakeBankOperator,
  fakeRelative,
] as const;

export { romanceScam, urgentLoan, fakeBankOperator, fakeRelative };
