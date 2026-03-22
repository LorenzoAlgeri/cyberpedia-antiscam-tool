/**
 * Default reflection questions for the Palestra Mentale training.
 *
 * These are used as fallbacks when the AI doesn't provide a custom question.
 * The AI may generate context-specific questions instead.
 */

import type { ReflectionStep } from '@/types/training';

const REFLECTION_QUESTIONS: Record<ReflectionStep, string> = {
  R1: 'Fermati un attimo. In questo punto, cosa stavi per fare?',
  R2: 'Che sensazione stavi provando di più in quel momento?',
  R3: 'Se ti fossi fermato 10 secondi, avresti fatto la stessa scelta?',
  R4: 'Secondo te, cosa ti ha spinto ad accelerare?',
};

export function getReflectionQuestion(step: ReflectionStep): string {
  return REFLECTION_QUESTIONS[step];
}
