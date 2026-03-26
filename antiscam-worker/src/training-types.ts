/**
 * Worker-side types for /api/training/* endpoints.
 *
 * Intentionally separate from frontend types (src/types/training.ts).
 * The Worker validates its own request/response surface independently.
 */

// ── Shared enums ─────────────────────────────────────────────────────────────

export const VALID_TRAINING_ATTACK_TYPES = [
  'financial',
  'romance',
  'fake-operator',
  'phishing',
  'fake-relative',
  'social-engineering',
] as const;

export type TrainingAttackType = (typeof VALID_TRAINING_ATTACK_TYPES)[number];

export const VALID_TRAINING_TARGETS = [
  'urgency',
  'responsibility',
  'fear',
  'trust',
  'easy_gain',
  'authority',
] as const;

export type TrainingTarget = (typeof VALID_TRAINING_TARGETS)[number];

export const VALID_DIFFICULTIES = ['easy', 'medium', 'hard'] as const;
export type Difficulty = (typeof VALID_DIFFICULTIES)[number];

export type ScammerGender = 'male' | 'female' | 'unspecified';

export type NarrativePhase = 'P1' | 'P2' | 'P3';
export type ReflectionStep = 'R1' | 'R2' | 'R3' | 'R4';

/** Reason why the training session was interrupted */
export type InterruptReason = 'high_risk' | 'max_turns';

// ── Behavior scores ──────────────────────────────────────────────────────────

export interface BehaviorScores {
  readonly activation: number;
  readonly impulsivity: number;
  readonly verification: number;
  readonly awareness: number;
  readonly riskScore: number;
}

// ── Scenario config ──────────────────────────────────────────────────────────

export interface ScammerPersona {
  readonly name: string;
  readonly role: string;
  readonly tone: string;
}

export interface ScenarioConfig {
  readonly scenarioId: string;
  readonly attackType: TrainingAttackType;
  readonly difficulty: Difficulty;
  readonly trainingTarget: TrainingTarget;
  readonly trainingTargets: TrainingTarget[];
  readonly scammerPersona: ScammerPersona;
  readonly interruptThreshold: number;
  readonly minTurnsBeforeInterrupt: number;
  readonly maxTurns: number;
  readonly scammerGender?: ScammerGender;
}

// ── Conversation turn ────────────────────────────────────────────────────────

export interface ConversationTurn {
  readonly id: string;
  readonly timestamp: string;
  readonly role: 'user' | 'scammer' | 'system';
  readonly content: string;
  readonly scores?: BehaviorScores;
  readonly phase: NarrativePhase;
}

// ── Reflection answer ────────────────────────────────────────────────────────

export interface ReflectionAnswer {
  readonly step: ReflectionStep;
  readonly question: string;
  readonly userAnswer: string;
  readonly aiAnalysis: string;
}

// ── Request types ────────────────────────────────────────────────────────────

export interface StartSessionRequest {
  readonly attackType: TrainingAttackType;
  readonly difficulty: Difficulty;
  readonly trainingTargets: TrainingTarget[];
  readonly scammerGender?: ScammerGender | undefined;
  /** Custom scenario description — overrides attackType for prompt generation */
  readonly customDescription?: string | undefined;
  /** Custom scammer persona — used instead of AI-generated one */
  readonly customPersona?: { name: string; role: string; tone: string } | undefined;
}

export interface SendMessageRequest {
  readonly scenarioConfig: ScenarioConfig;
  readonly conversationHistory: readonly ConversationTurn[];
  readonly userMessage: string;
  readonly turnCount: number;
}

export interface ReflectionRequest {
  readonly scenarioConfig: ScenarioConfig;
  readonly triggerMessage: string;
  readonly reflectionStep: ReflectionStep;
  readonly userAnswer: string;
  readonly previousReflections: readonly ReflectionAnswer[];
  readonly interruptReason?: InterruptReason;
}

// ── Response types ───────────────────────────────────────────────────────────

export interface StartSessionResponse {
  readonly scenarioConfig: ScenarioConfig;
  readonly firstMessage: string;
}

export interface SendMessageResponse {
  readonly aiMessage: string;
  readonly behaviorScores: BehaviorScores;
  readonly shouldInterrupt: boolean;
  readonly nextPhase: NarrativePhase;
  readonly interruptReason?: InterruptReason;
}

export interface ReflectionResponse {
  readonly aiAnalysis: string;
  readonly nextQuestion: string | null;
  readonly insightSummary?: string;
}

// ── Reflection suggestions ──────────────────────────────────────────────────

export interface ReflectionSuggestionsRequest {
  readonly scenarioConfig: ScenarioConfig;
  readonly conversationHistory: readonly ConversationTurn[];
  readonly triggerMessage: string;
  readonly reflectionStep: ReflectionStep;
  readonly currentQuestion: string;
  readonly interruptReason?: InterruptReason;
  readonly previousReflections: readonly ReflectionAnswer[];
}

export interface ReflectionSuggestionsResponse {
  readonly suggestions: readonly string[];
}
