/**
 * Zod schemas for runtime validation of Gemini responses to training prompts.
 *
 * Three response schemas, one per endpoint:
 * - StartSessionResponseSchema  → /api/training/start
 * - SendMessageResponseSchema   → /api/training/message
 * - ReflectionResponseSchema    → /api/training/reflect
 */

import { z } from 'zod';

// ── Shared sub-schemas ───────────────────────────────────────────────────────

const ScammerPersonaSchema = z.object({
  name: z.string().min(1),
  role: z.string().min(1),
  tone: z.string().min(1),
});

const ScenarioConfigSchema = z.object({
  scenarioId: z.string().min(1),
  attackType: z.string().min(1),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  trainingTarget: z.string().min(1),
  scammerPersona: ScammerPersonaSchema,
  interruptThreshold: z.number().min(0).max(100),
  minTurnsBeforeInterrupt: z.number().int().min(1).max(10),
});

const BehaviorScoresSchema = z.object({
  activation: z.number().min(0).max(100),
  impulsivity: z.number().min(0).max(100),
  verification: z.number().min(0).max(100),
  awareness: z.number().min(0).max(100),
  riskScore: z.number().min(0).max(100),
});

// ── Start Session Response ───────────────────────────────────────────────────

export const StartSessionResponseSchema = z.object({
  scenarioConfig: ScenarioConfigSchema,
  firstMessage: z.string().min(1),
});

export type StartSessionOutput = z.output<typeof StartSessionResponseSchema>;

// ── Send Message Response ────────────────────────────────────────────────────

export const SendMessageResponseSchema = z.object({
  behaviorScores: BehaviorScoresSchema,
  shouldInterrupt: z.boolean(),
  nextPhase: z.enum(['P1', 'P2', 'P3']),
  aiMessage: z.string().min(1),
});

export type SendMessageOutput = z.output<typeof SendMessageResponseSchema>;

// ── Reflection Response ──────────────────────────────────────────────────────

export const ReflectionResponseSchema = z.object({
  aiAnalysis: z.string().min(1),
  nextQuestion: z.string().nullable(),
  insightSummary: z.string().optional(),
});

export type ReflectionOutput = z.output<typeof ReflectionResponseSchema>;
