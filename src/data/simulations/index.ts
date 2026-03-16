/**
 * Barrel export for all simulation scripts.
 *
 * 3 scenarios per I6 spec:
 * S1: Romance scam — carta clonata all'estero
 * S2: Dogana / pacco (smishing)
 * S3: Ti mando i documenti (vishing)
 */

import { romanceScam } from './romance-scam';
import { doganaPacco } from './dogana-pacco';
import { documenti } from './documenti';
import type { Simulation } from '@/types/simulation';

/** All simulations in display order */
export const simulations: readonly Simulation[] = [
  romanceScam,
  doganaPacco,
  documenti,
] as const;

