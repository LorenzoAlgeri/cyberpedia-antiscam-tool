/**
 * Reflection questions for the Palestra Mentale training.
 *
 * Two sets based on InterruptReason:
 * - high_risk: user showed vulnerability → introspective questions
 * - max_turns: user stayed aware → analytical questions (positive framing)
 */

import type { ReflectionStep, InterruptReason } from '@/types/training';

const QUESTIONS_HIGH_RISK: Record<ReflectionStep, string> = {
  R1: 'Fermati un attimo. In questo punto, cosa stavi per fare?',
  R2: 'Che sensazione stavi provando di più in quel momento?',
  R3: 'Se ti fossi fermato 10 secondi, avresti fatto la stessa scelta?',
  R4: 'Secondo te, cosa ti ha spinto ad accelerare?',
};

const QUESTIONS_MAX_TURNS: Record<ReflectionStep, string> = {
  R1: 'Cosa hai notato di sospetto in questa conversazione?',
  R2: 'Quali segnali ti hanno messo in allarme?',
  R3: 'Se non fossi stato in una simulazione, avresti fatto qualcosa di diverso?',
  R4: 'Cosa consiglieresti a qualcuno meno esperto in questa situazione?',
};

export function getReflectionQuestion(
  step: ReflectionStep,
  reason?: InterruptReason | null,
): string {
  const questions = reason === 'max_turns' ? QUESTIONS_MAX_TURNS : QUESTIONS_HIGH_RISK;
  return questions[step];
}
