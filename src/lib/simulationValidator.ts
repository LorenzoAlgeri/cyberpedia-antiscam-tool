/**
 * Structural validation for simulation scenarios.
 *
 * Validates that every Simulation object conforms to the 9 rules
 * required by the useChatSimulator engine contract. Pure function,
 * no side effects -- collects ALL errors before returning.
 */

import type { Simulation, SimChoice, SimFeedback, SimMessage } from '@/types/simulation';
import { assertNever } from '@/lib/guards';

export interface ValidationError {
  readonly rule: string;
  readonly scenarioId: string;
  readonly stepIndex: number;
  readonly message: string;
}

export interface ValidationResult {
  readonly valid: boolean;
  readonly errors: readonly ValidationError[];
}

type Errors = ValidationError[];

function push(es: Errors, rule: string, id: string, idx: number, desc: string): void {
  es.push({ rule, scenarioId: id, stepIndex: idx, message: `${id}: step[${idx}] ${desc}` });
}

/** Rule 1: Every choice must be immediately followed by a feedback step. */
function checkChoiceFeedbackPairs(sim: Simulation, es: Errors): void {
  for (let i = 0; i < sim.steps.length; i++) {
    const step = sim.steps[i];
    if (!step || step.type !== 'choice') continue;
    const next = sim.steps[i + 1];
    if (!next || next.type !== 'feedback')
      push(es, 'choice-feedback-pair', sim.id, i, 'choice is not followed by a feedback step');
  }
}

/** Rule 2: Every choice must have >= 2 correct options. */
function checkMinCorrectOptions(sim: Simulation, es: Errors): void {
  for (let i = 0; i < sim.steps.length; i++) {
    const step = sim.steps[i];
    if (!step || step.type !== 'choice') continue;
    const correct = (step as SimChoice).options.filter((o) => o.correct);
    if (correct.length < 2)
      push(es, 'min-correct-options', sim.id, i, `choice has only ${correct.length} correct option -- expected >=2`);
  }
}

/** Rule 3: Correct options must cover different ChoiceSkill values. */
function checkSkillDiversity(sim: Simulation, es: Errors): void {
  for (let i = 0; i < sim.steps.length; i++) {
    const step = sim.steps[i];
    if (!step || step.type !== 'choice') continue;
    const correctOpts = (step as SimChoice).options.filter((o) => o.correct);
    for (const opt of correctOpts) {
      if (opt.skill === undefined)
        push(es, 'skill-diversity', sim.id, i, `correct option "${opt.id}" is missing skill field`);
    }
    const skills = correctOpts.map((o) => o.skill).filter((s): s is NonNullable<typeof s> => s !== undefined);
    if (new Set(skills).size < skills.length)
      push(es, 'skill-diversity', sim.id, i, 'correct options have duplicate skill values');
  }
}

/** Rule 4: All option IDs must be unique across the entire scenario. */
function checkUniqueOptionIds(sim: Simulation, es: Errors): void {
  const seen = new Set<string>();
  for (let i = 0; i < sim.steps.length; i++) {
    const step = sim.steps[i];
    if (!step || step.type !== 'choice') continue;
    for (const opt of (step as SimChoice).options) {
      if (seen.has(opt.id)) push(es, 'unique-option-ids', sim.id, i, `duplicate option ID "${opt.id}"`);
      seen.add(opt.id);
    }
  }
}

/** Rule 5: Sequential walk must reach every step (no orphans). */
function checkNoOrphanSteps(sim: Simulation, es: Errors): void {
  let i = 0;
  while (i < sim.steps.length) {
    const step = sim.steps[i];
    if (!step) break;
    i += step.type === 'choice' ? 2 : 1;
  }
  if (i < sim.steps.length)
    push(es, 'no-orphan-steps', sim.id, i, 'step is unreachable from sequential processing');
}

/**
 * Rule 6: Minimum top-level steps. Threshold 7 matches the smallest valid
 * 2-arc scenario (3 opening messages + 2 choice-feedback pairs).
 */
function checkMinArcLength(sim: Simulation, es: Errors): void {
  if (sim.steps.length < 7)
    push(es, 'min-arc-length', sim.id, 0, `scenario has ${sim.steps.length} steps -- expected >=7`);
}

/** Rule 7: Required fields must be present and non-empty per step type. */
function checkRequiredFields(sim: Simulation, es: Errors): void {
  for (let i = 0; i < sim.steps.length; i++) {
    const step = sim.steps[i];
    if (!step) continue;
    switch (step.type) {
      case 'message': {
        const msg = step as SimMessage;
        if (!msg.sender || msg.sender.length === 0) push(es, 'required-fields', sim.id, i, 'message has empty sender');
        if (!msg.text || msg.text.length === 0) push(es, 'required-fields', sim.id, i, 'message has empty text');
        break;
      }
      case 'choice': {
        const choice = step as SimChoice;
        if (!choice.options || choice.options.length === 0) push(es, 'required-fields', sim.id, i, 'choice has no options');
        break;
      }
      case 'feedback': {
        const fb = step as SimFeedback;
        if (!fb.explanation || fb.explanation.length === 0) push(es, 'required-fields', sim.id, i, 'feedback has empty explanation');
        break;
      }
      default:
        assertNever(step);
    }
  }
}

/** Rule 8: Wrong options must have retry coverage (option or feedback level). */
function checkRetryCoverage(sim: Simulation, es: Errors): void {
  for (let i = 0; i < sim.steps.length; i++) {
    const step = sim.steps[i];
    if (!step || step.type !== 'choice') continue;
    const next = sim.steps[i + 1];
    if (!next || next.type !== 'feedback') continue;
    const fb = next as SimFeedback;
    for (const opt of (step as SimChoice).options.filter((o) => !o.correct)) {
      if (opt.retryMessage === undefined && fb.retryMessage === undefined)
        push(es, 'retry-coverage', sim.id, i, `wrong option "${opt.id}" has no retryMessage and feedback has none either`);
    }
  }
}

/** Rule 9: Every feedback step must have a non-empty followUp array. */
function checkFollowUpNonEmpty(sim: Simulation, es: Errors): void {
  for (let i = 0; i < sim.steps.length; i++) {
    const step = sim.steps[i];
    if (!step || step.type !== 'feedback') continue;
    if ((step as SimFeedback).followUp.length === 0)
      push(es, 'followup-non-empty', sim.id, i, 'feedback has empty followUp array');
  }
}

/** Validate a simulation scenario against all 9 structural rules. */
export function validateSimulation(sim: Simulation): ValidationResult {
  const errors: Errors = [];
  checkChoiceFeedbackPairs(sim, errors);
  checkMinCorrectOptions(sim, errors);
  checkSkillDiversity(sim, errors);
  checkUniqueOptionIds(sim, errors);
  checkNoOrphanSteps(sim, errors);
  checkMinArcLength(sim, errors);
  checkRequiredFields(sim, errors);
  checkRetryCoverage(sim, errors);
  checkFollowUpNonEmpty(sim, errors);
  return { valid: errors.length === 0, errors };
}
