/**
 * Hook for managing persistent user training profile in plain localStorage.
 * Scores are not PII, so no encryption is needed.
 *
 * - Keeps last 20 sessions in history (newest first)
 * - Rolling average over last 10 sessions (incremental)
 * - Merges recurring patterns by patternId
 */

import { useState, useCallback } from 'react';
import type {
  UserProfile,
  BehaviorScores,
  TrainingDimension,
  SessionSummary,
  UserPattern,
  TrainingTarget,
} from '@/types/training';
// AttackType is used indirectly via SessionSummary

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const STORAGE_KEY = 'antiscam-training-profile';
const MAX_HISTORY = 20;
const ROLLING_WINDOW = 10;

/** Maps each vulnerability dimension to the training target that addresses it */
const DIMENSION_TO_TARGET: Record<TrainingDimension, TrainingTarget> = {
  activation: 'fear',
  impulsivity: 'urgency',
  verification: 'trust',
  awareness: 'authority',
} as const;

const ALL_DIMENSIONS: readonly TrainingDimension[] = [
  'activation',
  'impulsivity',
  'verification',
  'awareness',
] as const;

// ---------------------------------------------------------------------------
// Public result interface
// ---------------------------------------------------------------------------

export interface UseTrainingProfileResult {
  readonly profile: UserProfile;
  readonly saveSession: (
    summary: SessionSummary,
    scores: BehaviorScores,
    patterns: readonly UserPattern[],
  ) => void;
  readonly getRecommendedTarget: () => TrainingTarget;
  readonly resetProfile: () => void;
}

// ---------------------------------------------------------------------------
// Default profile factory
// ---------------------------------------------------------------------------

function createEmptyProfile(): UserProfile {
  return {
    sessionsCompleted: 0,
    averageScores: {
      activation: 0,
      impulsivity: 0,
      verification: 0,
      awareness: 0,
    },
    weakestDimension: null,
    patterns: [],
    sessionHistory: [],
  };
}

// ---------------------------------------------------------------------------
// localStorage helpers (module-level, no hook dependency)
// ---------------------------------------------------------------------------

function loadProfile(): UserProfile {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === null) return createEmptyProfile();
    const parsed: unknown = JSON.parse(raw);
    // Basic shape validation — trust stored data but guard against corruption
    if (
      typeof parsed === 'object' &&
      parsed !== null &&
      'sessionsCompleted' in parsed
    ) {
      return parsed as UserProfile;
    }
    return createEmptyProfile();
  } catch {
    return createEmptyProfile();
  }
}

function saveProfile(profile: UserProfile): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  } catch {
    // Storage full or unavailable — silently ignore
  }
}

// ---------------------------------------------------------------------------
// Pure computation helpers
// ---------------------------------------------------------------------------

/**
 * Determine the weakest dimension.
 * - activation / impulsivity: higher = worse (vulnerability axes)
 * - verification / awareness: lower = worse (protective axes)
 *
 * We normalize all to a "weakness" score where higher = weaker,
 * then pick the maximum.
 */
function computeWeakest(
  averageScores: Record<TrainingDimension, number>,
): TrainingDimension | null {
  const allZero = ALL_DIMENSIONS.every((d) => averageScores[d] === 0);
  if (allZero) return null;

  let weakest: TrainingDimension = 'activation';
  let maxWeakness = -Infinity;

  for (const dim of ALL_DIMENSIONS) {
    // For activation/impulsivity: higher score = more vulnerable (use as-is)
    // For verification/awareness: lower score = more vulnerable (invert)
    const weakness =
      dim === 'activation' || dim === 'impulsivity'
        ? averageScores[dim]
        : 100 - averageScores[dim];

    if (weakness > maxWeakness) {
      maxWeakness = weakness;
      weakest = dim;
    }
  }

  return weakest;
}

/**
 * Merge incoming patterns into existing ones.
 * If a pattern with the same patternId exists, increment its frequency
 * and update lastSeen. Otherwise append as new.
 */
function mergePatterns(
  existing: readonly UserPattern[],
  incoming: readonly UserPattern[],
): readonly UserPattern[] {
  const map = new Map<string, UserPattern>();

  for (const p of existing) {
    map.set(p.patternId, p);
  }

  for (const p of incoming) {
    const prev = map.get(p.patternId);
    if (prev !== undefined) {
      map.set(p.patternId, {
        ...prev,
        frequency: prev.frequency + p.frequency,
        lastSeen: p.lastSeen,
      });
    } else {
      map.set(p.patternId, p);
    }
  }

  return Array.from(map.values());
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useTrainingProfile(): UseTrainingProfileResult {
  const [profile, setProfile] = useState<UserProfile>(loadProfile);

  /**
   * Save a completed session to the profile.
   * Maintains max history, recomputes averages and weakest dimension.
   */
  const saveSession = useCallback(
    (
      summary: SessionSummary,
      scores: BehaviorScores,
      patterns: readonly UserPattern[],
    ) => {
      setProfile((prev) => {
        // Build new history (newest first, capped)
        const newHistory = [summary, ...prev.sessionHistory].slice(
          0,
          MAX_HISTORY,
        );

        // Incremental rolling average: blend new score into previous average
        const recentCount = Math.min(newHistory.length, ROLLING_WINDOW);
        const prevCount = recentCount - 1; // sessions already in the average

        const newAverages = { ...prev.averageScores };
        for (const dim of ALL_DIMENSIONS) {
          if (prevCount <= 0) {
            // First session — the score IS the average
            newAverages[dim] = scores[dim];
          } else if (recentCount <= ROLLING_WINDOW) {
            // Still within window — expand average
            newAverages[dim] = Math.round(
              (prev.averageScores[dim] * prevCount + scores[dim]) /
                recentCount,
            );
          } else {
            // Window full — approximate by blending (avoids needing all historic scores)
            newAverages[dim] = Math.round(
              prev.averageScores[dim] +
                (scores[dim] - prev.averageScores[dim]) / ROLLING_WINDOW,
            );
          }
        }

        const weakestDimension = computeWeakest(newAverages);
        const mergedPatterns = mergePatterns(prev.patterns, patterns);

        const updated: UserProfile = {
          sessionsCompleted: prev.sessionsCompleted + 1,
          averageScores: newAverages,
          weakestDimension,
          patterns: mergedPatterns,
          sessionHistory: newHistory,
        };

        saveProfile(updated);
        return updated;
      });
    },
    [],
  );

  /**
   * Return the recommended training target based on the weakest dimension.
   * Falls back to 'urgency' when no data is available.
   */
  const getRecommendedTarget = useCallback((): TrainingTarget => {
    const weakest = profile.weakestDimension;
    if (weakest === null) return 'urgency';
    return DIMENSION_TO_TARGET[weakest];
  }, [profile.weakestDimension]);

  /** Clear all training profile data */
  const resetProfile = useCallback(() => {
    const empty = createEmptyProfile();
    saveProfile(empty);
    setProfile(empty);
  }, []);

  return { profile, saveSession, getRecommendedTarget, resetProfile };
}
