/**
 * N8N webhook client for Palestra Mentale training endpoints.
 *
 * Separate from n8n.ts (simulation generation) — uses a different
 * N8N webhook URL (N8N_TRAINING_WEBHOOK_URL).
 *
 * Three call types routed via `action` field in the request body:
 * - 'start'   → generate scenario + first message
 * - 'message' → analyze user message + generate next scammer message
 * - 'reflect' → analyze reflection answer
 *
 * Timeout: 25s (same headroom as simulation webhook).
 */

import {
  StartSessionResponseSchema,
  SendMessageResponseSchema,
  ReflectionResponseSchema,
  type StartSessionOutput,
  type SendMessageOutput,
  type ReflectionOutput,
} from './training-schema';
import {
  buildStartSessionSystemPrompt,
  buildStartSessionUserPrompt,
  buildConversationSystemPrompt,
  buildConversationUserPrompt,
  buildReflectionSystemPrompt,
  buildReflectionUserPrompt,
} from './training-prompt';
import type {
  StartSessionRequest,
  SendMessageRequest,
  ReflectionRequest,
  ScenarioConfig,
  ConversationTurn,
  ReflectionAnswer,
  ReflectionStep,
} from './training-types';
import { N8NTimeoutError, N8NApiError, N8NValidationError } from './n8n';

// ── Constants ────────────────────────────────────────────────────────────────

const TIMEOUT_MS = 28_000;

// ── Internal helper ──────────────────────────────────────────────────────────

async function callWebhook(
  webhookUrl: string,
  payload: Record<string, unknown>,
): Promise<unknown> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
  } catch (e) {
    if (e instanceof Error && e.name === 'AbortError') throw new N8NTimeoutError();
    throw e;
  } finally {
    clearTimeout(timeoutId);
  }

  const text = await response.text();
  if (!response.ok) throw new N8NApiError(response.status, text);

  try {
    return JSON.parse(text);
  } catch {
    throw new N8NApiError(200, `Non-JSON response: ${text.slice(0, 200)}`);
  }
}

// ── Public API ───────────────────────────────────────────────────────────────

/** Start a new training session — generates scenario config + first message. */
export async function callTrainingStart(
  req: StartSessionRequest,
  webhookUrl: string,
): Promise<StartSessionOutput> {
  const parsed = await callWebhook(webhookUrl, {
    action: 'start',
    systemPrompt: buildStartSessionSystemPrompt(req.attackType, req.difficulty, req.trainingTargets, req.customDescription, req.customPersona, req.scammerGender),
    userPrompt: buildStartSessionUserPrompt(req.attackType, req.difficulty, req.trainingTargets[0]!),
  });

  const result = StartSessionResponseSchema.safeParse(parsed);
  if (result.success) return result.data;
  throw new N8NValidationError(JSON.stringify(result.error.issues));
}

/** Send a user message — returns behavior analysis + next scammer message. */
export async function callTrainingMessage(
  req: SendMessageRequest,
  webhookUrl: string,
): Promise<SendMessageOutput> {
  const parsed = await callWebhook(webhookUrl, {
    action: 'message',
    systemPrompt: buildConversationSystemPrompt(req.scenarioConfig),
    userPrompt: buildConversationUserPrompt(req.conversationHistory, req.userMessage, req.turnCount),
  });

  const result = SendMessageResponseSchema.safeParse(parsed);
  if (result.success) return result.data;
  throw new N8NValidationError(JSON.stringify(result.error.issues));
}

/** Submit a reflection answer — returns AI analysis + next question. */
export async function callTrainingReflect(
  req: ReflectionRequest,
  webhookUrl: string,
): Promise<ReflectionOutput> {
  const parsed = await callWebhook(webhookUrl, {
    action: 'reflect',
    systemPrompt: buildReflectionSystemPrompt(req.scenarioConfig, req.interruptReason),
    userPrompt: buildReflectionUserPrompt(
      req.triggerMessage,
      req.reflectionStep,
      req.userAnswer,
      req.previousReflections,
    ),
  });

  const result = ReflectionResponseSchema.safeParse(parsed);
  if (result.success) return result.data;
  throw new N8NValidationError(JSON.stringify(result.error.issues));
}
