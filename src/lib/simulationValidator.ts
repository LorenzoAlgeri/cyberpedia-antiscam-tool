/**
 * Structural validation for simulation scenarios.
 *
 * Validates that every Simulation object conforms to the 9 rules
 * required by the useChatSimulator engine contract. Pure function,
 * no side effects -- collects ALL errors before returning.
 */

import type {
  Simulation,
  SimChoice,
  SimFeedback,
  SimMessage,
} from '@/types/simulation';
import { assertNever } from '@/lib/guards';

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function err(
  errors: ValidationError[],
  rule: string,
  scenarioId: string,
  stepIndex: number,
  description: string,
): void {
  errors.push({
    rule,
    scenarioId,
    stepIndex,
    message: `${scenarioId}: step[${stepIndex}] ${description}`,
  });
}

// ---------------------------------------------------------------------------
// Rule implementations
// ---------------------------------------------------------------------------

/** Rule 1: Every choice must be immediately followed by a feedback step. */
function checkChoiceFeedbackPairs(
  sim: Simulation,
  errors: ValidationError[],
): void {
  for (let i = 0; i < sim.steps.length; i++) {
    const step = sim.steps[i];
    if (!step) continue;
    if (step.type === 'choice') {
      const next = sim.steps[i + 1];
      if (!next || next.type !== 'feedback') {
        err(errors, 'choice-feedback-pair', sim.id, i,
          'choice is not followed by a feedback step');
      }
    }
  }
}

/** Rule 2: Every choice must have >= 2 correct options. */
function checkMinCorrectOptions(
  sim: Simulation,
  errors: ValidationError[],
): void {
  for (let i = 0; i < sim.steps.length; i++) {
    const step = sim.steps[i];
    if (!step) continue;
    if (step.type === 'choice') {
      const correct = (step as SimChoice).options.filter((o) => o.correct);
      if (correct.length < 2) {
        err(errors, 'min-correct-options', sim.id, i,
          `choice has only ${correct.length} correct option -- expected >=2`);
      }
    }
  }
}

/** Rule 3: Correct options in a choice must cover different ChoiceSkill values. */
function checkSkillDiversity(
  sim: Simulation,
  errors: ValidationError[],
): void {
  for (let i = 0; i < sim.steps.length; i++) {
    const step = sim.steps[i];
    if (!step) continue;
    if (step.type === 'choice') {
      const correctOpts = (step as SimChoice).options.filter((o) => o.correct);
      for (const opt of correctOpts) {
        if (opt.skill === undefined) {
          err(errors, 'skill-diversity', sim.id, i,
            `correct option "${opt.id}" is missing skill field`);
        }
      }
      const skills = correctOpts
        .map((o) => o.skill)
        .filter((s): s is NonNullable<typeof s> => s !== undefined);
      const unique = new Set(skills);
      if (unique.size < skills.length) {
        err(errors, 'skill-diversity', sim.id, i,
          'correct options have duplicate skill values');
      }
    }
  }
}

/** Rule 4: All option IDs must be unique across the entire scenario. */
function checkUniqueOptionIds(
  sim: Simulation,
  errors: ValidationError[],
): void {
  const seen = new Set<string>();
  for (let i = 0; i < sim.steps.length; i++) {
    const step = sim.steps[i];
    if (!step) continue;
    if (step.type === 'choice') {
      for (const opt of (step as SimChoice).options) {
        if (seen.has(opt.id)) {
          err(errors, 'unique-option-ids', sim.id, i,
            `duplicate option ID "${opt.id}"`);
        }
        seen.add(opt.id);
      }
    }
  }
}

/** Rule 5: Sequential walk must reach every step (no orphans). */
function checkNoOrphanSteps(
  sim: Simulation,
  errors: ValidationError[],
): void {
  let i = 0;
  while (i < sim.steps.length) {
    const step = sim.steps[i];
    if (!step) break;
    if (step.type === 'choice') {
      // Engine reads choice + feedback as a pair, advance by 2
      i += 2;
    } else {
      i += 1;
    }
  }
  if (i < sim.steps.length) {
    err(errors, 'no-orphan-steps', sim.id, i,
      `step is unreachable from sequential processing`);
  }
}

/** Rule 6: Scenario must have >= 8 steps. */
function checkMinArcLength(
  sim: Simulation,
  errors: ValidationError[],
): void {
  if (sim.steps.length < 8) {
    err(errors, 'min-arc-length', sim.id, 0,
      `scenario has ${sim.steps.length} steps -- expected >=8`);
  }
}

/** Rule 7: Required fields must be present and non-empty per step type. */
function checkRequiredFields(
  sim: Simulation,
  errors: ValidationError[],
): void {
  for (let i = 0; i < sim.steps.length; i++) {
    const step = sim.steps[i];
    if (!step) continue;
    switch (step.type) {
      case 'message': {
        const msg = step as SimMessage;
        if (!msg.sender || msg.sender.length === 0) {
          err(errors, 'required-fields', sim.id, i, 'message has empty sender');
        }
        if (!msg.text || msg.text.length === 0) {
          err(errors, 'required-fields', sim.id, i, 'message has empty text');
        }
        break;
      }
      case 'choice': {
        const choice = step as SimChoice;
        if (!choice.options || choice.options.length === 0) {
          err(errors, 'required-fields', sim.id, i, 'choice has no options');
        }
        break;
      }
      case 'feedback': {
        const fb = step as SimFeedback;
        if (!fb.explanation || fb.explanation.length === 0) {
          err(errors, 'required-fields', sim.id, i,
            'feedback has empty explanation');
        }
        break;
      }
      default:
        assertNever(step);
    }
  }
}

/** Rule 8: Wrong options must have retry coverage (option or feedback level). */
function checkRetryCoverage(
  sim: Simulation,
  errors: ValidationError[],
): void {
  for (let i = 0; i < sim.steps.length; i++) {
    const step = sim.steps[i];
    if (!step) continue;
    if (step.type === 'choice') {
      const next = sim.steps[i + 1];
      if (!next || next.type !== 'feedback') continue;
      const fb = next as SimFeedback;
      const wrongOpts = (step as SimChoice).options.filter((o) => !o.correct);
      for (const opt of wrongOpts) {
        if (opt.retryMessage === undefined && fb.retryMessage === undefined) {
          err(errors, 'retry-coverage', sim.id, i,
            `wrong option "${opt.id}" has no retryMessage and feedback has none either`);
        }
      }
    }
  }
}

/** Rule 9: Every feedback step must have a non-empty followUp array. */
function checkFollowUpNonEmpty(
  sim: Simulation,
  errors: ValidationError[],
): void {
  for (let i = 0; i < sim.steps.length; i++) {
    const step = sim.steps[i];
    if (!step) continue;
    if (step.type === 'feedback') {
      const fb = step as SimFeedback;
      if (fb.followUp.length === 0) {
        err(errors, 'followup-non-empty', sim.id, i,
          'feedback has empty followUp array');
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/** Validate a simulation scenario against all 9 structural rules. */
export function validateSimulation(sim: Simulation): ValidationResult {
  const errors: ValidationError[] = [];

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
