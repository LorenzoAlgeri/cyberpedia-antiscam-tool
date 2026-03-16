/**
 * Simulation validation test suite.
 *
 * One describe block per validation rule + one full-validation integration test.
 * Each test iterates all scenarios from the barrel import so adding a new
 * scenario automatically includes it in all validation checks.
 */

import { describe, it, expect } from 'vitest';
import { validateSimulation } from '@/lib/simulationValidator';
import { simulations } from '@/data/simulations';

// ---------------------------------------------------------------------------
// Rule 1: choice-feedback-pair
// ---------------------------------------------------------------------------

describe('choice-feedback pairs', () => {
  for (const sim of simulations) {
    it(`${sim.id}: every choice is followed by a feedback step`, () => {
      const result = validateSimulation(sim);
      const errors = result.errors.filter(e => e.rule === 'choice-feedback-pair');
      expect(
        errors,
        `${sim.id} has choice-feedback violations: ${errors.map(e => e.message).join(', ')}`,
      ).toHaveLength(0);
    });
  }
});

// ---------------------------------------------------------------------------
// Rule 2: min-correct-options
// ---------------------------------------------------------------------------

describe('min-correct-options', () => {
  for (const sim of simulations) {
    it(`${sim.id}: every choice has >=2 correct options`, () => {
      const result = validateSimulation(sim);
      const errors = result.errors.filter(e => e.rule === 'min-correct-options');
      expect(
        errors,
        `${sim.id} has min-correct-options violations: ${errors.map(e => e.message).join(', ')}`,
      ).toHaveLength(0);
    });
  }
});

// ---------------------------------------------------------------------------
// Rule 3: skill-diversity
// ---------------------------------------------------------------------------

describe('skill-diversity', () => {
  for (const sim of simulations) {
    it(`${sim.id}: correct options cover different skills`, () => {
      const result = validateSimulation(sim);
      const errors = result.errors.filter(e => e.rule === 'skill-diversity');
      expect(
        errors,
        `${sim.id} has skill-diversity violations: ${errors.map(e => e.message).join(', ')}`,
      ).toHaveLength(0);
    });
  }
});

// ---------------------------------------------------------------------------
// Rule 4: unique-option-ids
// ---------------------------------------------------------------------------

describe('unique-option-ids', () => {
  for (const sim of simulations) {
    it(`${sim.id}: all option IDs are unique`, () => {
      const result = validateSimulation(sim);
      const errors = result.errors.filter(e => e.rule === 'unique-option-ids');
      expect(
        errors,
        `${sim.id} has unique-option-ids violations: ${errors.map(e => e.message).join(', ')}`,
      ).toHaveLength(0);
    });
  }
});

// ---------------------------------------------------------------------------
// Rule 5: no-orphan-steps
// ---------------------------------------------------------------------------

describe('no-orphan-steps', () => {
  for (const sim of simulations) {
    it(`${sim.id}: every step is reachable`, () => {
      const result = validateSimulation(sim);
      const errors = result.errors.filter(e => e.rule === 'no-orphan-steps');
      expect(
        errors,
        `${sim.id} has no-orphan-steps violations: ${errors.map(e => e.message).join(', ')}`,
      ).toHaveLength(0);
    });
  }
});

// ---------------------------------------------------------------------------
// Rule 6: min-arc-length
// ---------------------------------------------------------------------------

describe('min-arc-length', () => {
  for (const sim of simulations) {
    it(`${sim.id}: has >=8 steps`, () => {
      const result = validateSimulation(sim);
      const errors = result.errors.filter(e => e.rule === 'min-arc-length');
      expect(
        errors,
        `${sim.id} has min-arc-length violations: ${errors.map(e => e.message).join(', ')}`,
      ).toHaveLength(0);
    });
  }
});

// ---------------------------------------------------------------------------
// Rule 7: required-fields
// ---------------------------------------------------------------------------

describe('required-fields', () => {
  for (const sim of simulations) {
    it(`${sim.id}: no missing required fields`, () => {
      const result = validateSimulation(sim);
      const errors = result.errors.filter(e => e.rule === 'required-fields');
      expect(
        errors,
        `${sim.id} has required-fields violations: ${errors.map(e => e.message).join(', ')}`,
      ).toHaveLength(0);
    });
  }
});

// ---------------------------------------------------------------------------
// Rule 8: retry-coverage
// ---------------------------------------------------------------------------

describe('retry-coverage', () => {
  for (const sim of simulations) {
    it(`${sim.id}: every wrong option has retry coverage`, () => {
      const result = validateSimulation(sim);
      const errors = result.errors.filter(e => e.rule === 'retry-coverage');
      expect(
        errors,
        `${sim.id} has retry-coverage violations: ${errors.map(e => e.message).join(', ')}`,
      ).toHaveLength(0);
    });
  }
});

// ---------------------------------------------------------------------------
// Rule 9: followup-non-empty
// ---------------------------------------------------------------------------

describe('followup-non-empty', () => {
  for (const sim of simulations) {
    it(`${sim.id}: every feedback has non-empty followUp`, () => {
      const result = validateSimulation(sim);
      const errors = result.errors.filter(e => e.rule === 'followup-non-empty');
      expect(
        errors,
        `${sim.id} has followup-non-empty violations: ${errors.map(e => e.message).join(', ')}`,
      ).toHaveLength(0);
    });
  }
});

// ---------------------------------------------------------------------------
// Integration: full validation
// ---------------------------------------------------------------------------

describe('full validation', () => {
  for (const sim of simulations) {
    it(`${sim.id}: passes all validation rules`, () => {
      const result = validateSimulation(sim);
      expect(
        result.valid,
        `${sim.id} failed validation: ${result.errors.map(e => e.message).join('; ')}`,
      ).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  }
});
