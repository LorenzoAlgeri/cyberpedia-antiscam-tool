# Phase 2 — Profilo e Personalizzazione

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add persistent user profiles, complete training setup UI, R4 pattern detection, radar chart, and UX improvements to the Palestra Mentale training system.

**Architecture:** User profile stored as plain JSON in localStorage (no encryption — scores are not PII). New `useTrainingProfile` hook manages profile CRUD. `TrainingSetup` component replaces hardcoded MVP parameters with interactive selection (attack type, difficulty, target). Radar chart is a lightweight custom SVG component.

**Tech Stack:** React 19 + TypeScript strict + Tailwind v4 + Framer Motion + Lucide icons

---

## Task 1: useTrainingProfile Hook

**Files:**
- Create: `src/hooks/useTrainingProfile.ts`

**Step 1: Create the hook**

```typescript
/**
 * useTrainingProfile — manages persistent user training profile in localStorage.
 *
 * Storage: plain JSON in localStorage (scores are not PII).
 * Keys:
 *   - antiscam-training-profile: UserProfile object
 *
 * Medie mobili: rolling average over last 10 sessions.
 */

import { useState, useCallback } from 'react';
import type {
  UserProfile,
  BehaviorScores,
  TrainingDimension,
  SessionSummary,
  UserPattern,
} from '@/types/training';
import type { AttackType } from '@/types/emergency';
import type { TrainingTarget } from '@/types/training';

const STORAGE_KEY = 'antiscam-training-profile';
const MAX_HISTORY = 20;
const ROLLING_WINDOW = 10;

const EMPTY_PROFILE: UserProfile = {
  sessionsCompleted: 0,
  averageScores: {
    activation: 50,
    impulsivity: 50,
    verification: 50,
    awareness: 50,
  },
  weakestDimension: null,
  patterns: [],
  sessionHistory: [],
};

function loadProfile(): UserProfile {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY_PROFILE;
    const parsed = JSON.parse(raw) as UserProfile;
    // Basic shape validation
    if (typeof parsed.sessionsCompleted !== 'number') return EMPTY_PROFILE;
    return parsed;
  } catch {
    return EMPTY_PROFILE;
  }
}

function saveProfile(profile: UserProfile): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
}

function computeWeakest(
  avg: Record<TrainingDimension, number>,
): TrainingDimension | null {
  // For activation/impulsivity: higher = worse
  // For verification/awareness: lower = worse
  // Normalize all to "weakness" score (0-100, higher = weaker)
  const weakness: Record<TrainingDimension, number> = {
    activation: avg.activation,
    impulsivity: avg.impulsivity,
    verification: 100 - avg.verification,
    awareness: 100 - avg.awareness,
  };

  let worst: TrainingDimension | null = null;
  let worstVal = -1;
  for (const [dim, val] of Object.entries(weakness) as [TrainingDimension, number][]) {
    if (val > worstVal) {
      worstVal = val;
      worst = dim;
    }
  }
  return worst;
}

function computeRollingAverage(
  history: readonly SessionSummary[],
  allScores: Record<TrainingDimension, number>[],
): Record<TrainingDimension, number> {
  const window = allScores.slice(-ROLLING_WINDOW);
  if (window.length === 0) return EMPTY_PROFILE.averageScores;

  const sum: Record<TrainingDimension, number> = {
    activation: 0,
    impulsivity: 0,
    verification: 0,
    awareness: 0,
  };
  for (const s of window) {
    sum.activation += s.activation;
    sum.impulsivity += s.impulsivity;
    sum.verification += s.verification;
    sum.awareness += s.awareness;
  }
  return {
    activation: Math.round(sum.activation / window.length),
    impulsivity: Math.round(sum.impulsivity / window.length),
    verification: Math.round(sum.verification / window.length),
    awareness: Math.round(sum.awareness / window.length),
  };
}

export interface UseTrainingProfileResult {
  profile: UserProfile;
  /** Save a completed session to the profile. */
  saveSession: (
    sessionId: string,
    attackType: AttackType,
    trainingTarget: TrainingTarget,
    finalScores: BehaviorScores,
    interruptedAtTurn: number | null,
    patterns?: readonly UserPattern[],
  ) => void;
  /** Get the weakest dimension for recommendations. */
  getRecommendedTarget: () => TrainingTarget | null;
  /** Reset the profile (for testing). */
  resetProfile: () => void;
}

/** Map dimensions to suggested training targets */
const DIMENSION_TO_TARGET: Record<TrainingDimension, TrainingTarget> = {
  activation: 'fear',
  impulsivity: 'urgency',
  verification: 'trust',
  awareness: 'authority',
};

export function useTrainingProfile(): UseTrainingProfileResult {
  const [profile, setProfile] = useState<UserProfile>(loadProfile);

  const saveSession = useCallback(
    (
      sessionId: string,
      attackType: AttackType,
      trainingTarget: TrainingTarget,
      finalScores: BehaviorScores,
      interruptedAtTurn: number | null,
      patterns?: readonly UserPattern[],
    ) => {
      setProfile((prev) => {
        const prevBest = prev.sessionHistory.find(
          (s) => s.attackType === attackType,
        );
        const improvement = prevBest
          ? prevBest.finalRiskScore - finalScores.riskScore
          : 0;

        const summary: SessionSummary = {
          sessionId,
          date: new Date().toISOString(),
          attackType,
          trainingTarget,
          finalRiskScore: finalScores.riskScore,
          interruptedAtTurn,
          improvement,
        };

        const newHistory = [summary, ...prev.sessionHistory].slice(
          0,
          MAX_HISTORY,
        );

        // Build scores array for rolling average from history
        // We store riskScore but need per-dimension scores. Use finalScores for latest,
        // and approximate from history. For simplicity, store dimension scores too.
        // Since we only have riskScore in SessionSummary, we'll track averages incrementally.
        const n = prev.sessionsCompleted + 1;
        const w = Math.min(n, ROLLING_WINDOW);
        const newAvg: Record<TrainingDimension, number> = {
          activation: Math.round(
            (prev.averageScores.activation * (w - 1) + finalScores.activation) / w,
          ),
          impulsivity: Math.round(
            (prev.averageScores.impulsivity * (w - 1) + finalScores.impulsivity) / w,
          ),
          verification: Math.round(
            (prev.averageScores.verification * (w - 1) + finalScores.verification) / w,
          ),
          awareness: Math.round(
            (prev.averageScores.awareness * (w - 1) + finalScores.awareness) / w,
          ),
        };

        const weakest = computeWeakest(newAvg);

        const mergedPatterns = patterns
          ? mergePatterns(prev.patterns, patterns)
          : prev.patterns;

        const updated: UserProfile = {
          sessionsCompleted: n,
          averageScores: newAvg,
          weakestDimension: weakest,
          patterns: mergedPatterns,
          sessionHistory: newHistory,
        };

        saveProfile(updated);
        return updated;
      });
    },
    [],
  );

  const getRecommendedTarget = useCallback((): TrainingTarget | null => {
    if (!profile.weakestDimension) return null;
    return DIMENSION_TO_TARGET[profile.weakestDimension];
  }, [profile.weakestDimension]);

  const resetProfile = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setProfile(EMPTY_PROFILE);
  }, []);

  return { profile, saveSession, getRecommendedTarget, resetProfile };
}

function mergePatterns(
  existing: readonly UserPattern[],
  incoming: readonly UserPattern[],
): UserPattern[] {
  const map = new Map(existing.map((p) => [p.patternId, { ...p }]));
  for (const p of incoming) {
    const prev = map.get(p.patternId);
    if (prev) {
      prev.frequency += 1;
      prev.lastSeen = p.lastSeen;
    } else {
      map.set(p.patternId, { ...p });
    }
  }
  return Array.from(map.values());
}
```

**Step 2: Verify build**

Run: `npx tsc --noEmit`
Expected: 0 errors

**Step 3: Commit**

```bash
git add src/hooks/useTrainingProfile.ts
git commit -m "feat(training): add useTrainingProfile hook for persistent user profiles"
```

---

## Task 2: TrainingSetup Component

**Files:**
- Create: `src/components/training/TrainingSetup.tsx`
- Create: `src/data/training-targets.ts`

**Step 1: Create training targets static data**

File: `src/data/training-targets.ts`

```typescript
/**
 * Training target metadata — static data for TargetSelector in TrainingSetup.
 */

import type { TrainingTarget } from '@/types/training';

export interface TrainingTargetMeta {
  readonly id: TrainingTarget;
  readonly label: string;
  readonly description: string;
  readonly icon: string;
}

export const TRAINING_TARGETS: readonly TrainingTargetMeta[] = [
  {
    id: 'urgency',
    label: 'Urgenza',
    description: 'Resisti alla pressione temporale',
    icon: 'Timer',
  },
  {
    id: 'responsibility',
    label: 'Responsabilita',
    description: 'Resisti al senso di colpa',
    icon: 'Scale',
  },
  {
    id: 'fear',
    label: 'Paura',
    description: 'Resisti alle minacce',
    icon: 'ShieldAlert',
  },
  {
    id: 'trust',
    label: 'Fiducia',
    description: 'Resisti alla fiducia rapida',
    icon: 'HandHeart',
  },
  {
    id: 'greed',
    label: 'Avidita',
    description: 'Resisti alle offerte irreali',
    icon: 'Gem',
  },
  {
    id: 'authority',
    label: 'Autorita',
    description: 'Resisti alla falsa autorita',
    icon: 'Crown',
  },
] as const;
```

**Step 2: Create TrainingSetup component**

File: `src/components/training/TrainingSetup.tsx`

```typescript
/**
 * TrainingSetup — scenario parameter selection before starting a session.
 *
 * Three selection steps:
 * 1. Attack type (reuses AttackTypeSelector)
 * 2. Difficulty (3 cards: facile/medio/difficile)
 * 3. Training target (6 cards with icons)
 *
 * If profile data exists, shows a recommendation based on weakest dimension.
 */

import { useState, useCallback } from 'react';
import * as m from 'motion/react-m';
import {
  Timer, Scale, ShieldAlert, HandHeart, Gem, Crown,
  Zap, ArrowLeft,
  type LucideIcon,
} from 'lucide-react';
import { AttackTypeSelector } from '@/components/emergency/AttackTypeSelector';
import { TRAINING_TARGETS, type TrainingTargetMeta } from '@/data/training-targets';
import type { AttackType } from '@/types/emergency';
import type { TrainingTarget, UserProfile } from '@/types/training';

const TARGET_ICON_MAP: Record<string, LucideIcon> = {
  Timer, Scale, ShieldAlert, HandHeart, Gem, Crown,
};

type Difficulty = 'easy' | 'medium' | 'hard';

interface DifficultyOption {
  readonly id: Difficulty;
  readonly label: string;
  readonly description: string;
}

const DIFFICULTIES: readonly DifficultyOption[] = [
  { id: 'easy', label: 'Facile', description: 'Segnali evidenti, pressione lieve' },
  { id: 'medium', label: 'Medio', description: 'Segnali sottili, urgenza moderata' },
  { id: 'hard', label: 'Difficile', description: 'Segnali ambigui, manipolazione intensa' },
];

interface TrainingSetupProps {
  readonly profile: UserProfile | null;
  readonly recommendedTarget: TrainingTarget | null;
  readonly isLoading: boolean;
  readonly onStart: (attackType: AttackType, difficulty: Difficulty, target: TrainingTarget) => void;
  readonly onBack: () => void;
}

export function TrainingSetup({
  profile,
  recommendedTarget,
  isLoading,
  onStart,
  onBack,
}: TrainingSetupProps) {
  const [attackType, setAttackType] = useState<AttackType | null>(null);
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [target, setTarget] = useState<TrainingTarget | null>(recommendedTarget);

  const canStart = attackType !== null && target !== null && !isLoading;

  const handleStart = useCallback(() => {
    if (!attackType || !target) return;
    onStart(attackType, difficulty, target);
  }, [attackType, difficulty, target, onStart]);

  return (
    <div className="flex flex-1 flex-col gap-6 overflow-y-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          className="flex size-9 items-center justify-center rounded-full
                     text-slate-400 transition-colors hover:bg-slate-800 hover:text-slate-200"
          aria-label="Torna indietro"
        >
          <ArrowLeft className="size-5" aria-hidden="true" />
        </button>
        <div>
          <h2 className="text-xl font-bold text-foreground">Configura sessione</h2>
          <p className="text-sm text-muted-foreground">Scegli i parametri del tuo allenamento</p>
        </div>
      </div>

      {/* Recommendation banner */}
      {profile && profile.sessionsCompleted > 0 && recommendedTarget && (
        <m.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start gap-2.5 rounded-2xl border border-cyan-brand/30 bg-cyan-brand/10 px-4 py-3"
        >
          <Zap className="mt-0.5 size-4 shrink-0 text-cyan-brand" aria-hidden="true" />
          <p className="text-sm leading-relaxed text-cyan-100">
            Consigliato: <strong>{TRAINING_TARGETS.find(t => t.id === recommendedTarget)?.label}</strong> — il tuo punto debole dopo {profile.sessionsCompleted} sessioni.
          </p>
        </m.div>
      )}

      {/* 1. Attack Type */}
      <section className="space-y-2">
        <h3 className="text-sm font-semibold text-slate-300">Tipo di attacco</h3>
        <AttackTypeSelector selected={attackType} onSelect={setAttackType} />
      </section>

      {/* 2. Difficulty */}
      <section className="space-y-2">
        <h3 className="text-sm font-semibold text-slate-300">Difficolta</h3>
        <div className="grid grid-cols-3 gap-3">
          {DIFFICULTIES.map((d) => (
            <button
              key={d.id}
              type="button"
              onClick={() => setDifficulty(d.id)}
              className={`rounded-2xl border-2 p-3 text-center transition-colors ${
                difficulty === d.id
                  ? 'border-cyan-brand bg-cyan-brand/10'
                  : 'border-white/10 bg-secondary/50 hover:border-cyan-brand/30'
              }`}
              style={{ minHeight: 44 }}
            >
              <span className={`block text-sm font-semibold ${
                difficulty === d.id ? 'text-foreground' : 'text-foreground/80'
              }`}>
                {d.label}
              </span>
              <span className="mt-1 block text-xs text-muted-foreground">
                {d.description}
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* 3. Training Target */}
      <section className="space-y-2">
        <h3 className="text-sm font-semibold text-slate-300">Leva psicologica</h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {TRAINING_TARGETS.map((t) => {
            const Icon = TARGET_ICON_MAP[t.icon] ?? Timer;
            const isSelected = target === t.id;
            const isRecommended = t.id === recommendedTarget;

            return (
              <m.button
                key={t.id}
                type="button"
                onClick={() => setTarget(t.id)}
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.97 }}
                className={`relative flex flex-col items-center gap-2 rounded-2xl border-2 p-4 text-center transition-colors ${
                  isSelected
                    ? 'border-cyan-brand bg-cyan-brand/10 shadow-lg shadow-cyan-brand/15'
                    : 'border-white/10 bg-secondary/50 hover:border-cyan-brand/30'
                }`}
                style={{ minHeight: 44 }}
              >
                {isRecommended && !isSelected && (
                  <span className="absolute -top-2 right-2 rounded-full bg-cyan-brand/20 px-2 py-0.5 text-[9px] font-bold uppercase text-cyan-300">
                    Suggerito
                  </span>
                )}
                <div className={`flex size-9 items-center justify-center rounded-xl ${
                  isSelected ? 'bg-cyan-brand/20 text-cyan-brand' : 'bg-white/5 text-muted-foreground'
                }`}>
                  <Icon className="size-4" aria-hidden="true" />
                </div>
                <span className={`text-sm font-semibold ${
                  isSelected ? 'text-foreground' : 'text-foreground/80'
                }`}>
                  {t.label}
                </span>
                <span className="text-xs text-muted-foreground">{t.description}</span>
              </m.button>
            );
          })}
        </div>
      </section>

      {/* Start button */}
      <div className="mt-auto pt-4">
        <button
          type="button"
          onClick={handleStart}
          disabled={!canStart}
          className="btn-primary w-full"
        >
          {isLoading ? 'Avvio in corso...' : 'Inizia sessione'}
        </button>
      </div>
    </div>
  );
}
```

**Step 3: Verify build**

Run: `npx tsc --noEmit`
Expected: 0 errors

**Step 4: Commit**

```bash
git add src/data/training-targets.ts src/components/training/TrainingSetup.tsx
git commit -m "feat(training): add TrainingSetup component with attack/difficulty/target selectors"
```

---

## Task 3: Integrate TrainingSetup into SimulationsPage

**Files:**
- Modify: `src/pages/SimulationsPage.tsx`

**Step 1: Replace hardcoded MVP setup with TrainingSetup**

Changes needed:
1. Import `TrainingSetup` and `useTrainingProfile`
2. Add `useTrainingProfile` hook call
3. Add a `setup` phase view before the existing conversation/reflection/summary views
4. Update `handleStartTraining` to show setup first, then start session with user-selected params
5. Wire `saveSession` call when training reaches `summary` phase

Key modifications to SimulationsPage.tsx:

- Add imports: `TrainingSetup`, `useTrainingProfile`
- Add hook: `const { profile, saveSession, getRecommendedTarget } = useTrainingProfile();`
- Change the Palestra Mentale card click to set phase to 'setup' instead of calling startSession directly
- Add a new `trainingState.phase === 'setup'` view that renders `<TrainingSetup>`
- Update `handleStartTraining` to accept params from TrainingSetup
- Add a `useEffect` to call `saveSession` when `trainingState.phase === 'summary'`

**Step 2: Verify build**

Run: `npx tsc --noEmit`
Expected: 0 errors

**Step 3: Commit**

```bash
git add src/pages/SimulationsPage.tsx
git commit -m "feat(training): integrate TrainingSetup and profile persistence into SimulationsPage"
```

---

## Task 4: Extend Reflection to R4

**Files:**
- Modify: `src/hooks/useTrainingSession.ts`
- Modify: `src/hooks/trainingReflectionQuestions.ts`

**Step 1: Update reflection step order to include R4**

In `useTrainingSession.ts`, change:
```typescript
// OLD
const stepOrder: ReflectionStep[] = ['R1', 'R2', 'R3'];

// NEW
const stepOrder: ReflectionStep[] = ['R1', 'R2', 'R3', 'R4'];
```

In `ReflectionView.tsx`, change:
```typescript
// OLD
const TOTAL_STEPS = 3;

// NEW
const TOTAL_STEPS = 4;
```

And add R4 to STEP_LABELS (already exists).

**Step 2: Verify build**

Run: `npx tsc --noEmit`
Expected: 0 errors

**Step 3: Commit**

```bash
git add src/hooks/useTrainingSession.ts src/components/training/ReflectionView.tsx
git commit -m "feat(training): extend reflection to R4 (pattern recognition)"
```

---

## Task 5: RadarChart SVG Component

**Files:**
- Create: `src/components/training/RadarChart.tsx`

**Step 1: Create lightweight SVG radar chart**

```typescript
/**
 * RadarChart — lightweight 4-axis SVG radar chart for training scores.
 *
 * No external dependencies. Pure SVG with optional Framer Motion animation.
 * Axes: Activation, Impulsivity, Verification, Awareness.
 *
 * For inverted axes (activation, impulsivity): displayed as 100-value
 * so that "outward = better" on all axes.
 */

import * as m from 'motion/react-m';
import type { BehaviorScores } from '@/types/training';

interface RadarChartProps {
  readonly scores: BehaviorScores;
  readonly previousScores?: BehaviorScores | null;
  readonly size?: number;
}

const AXES = [
  { key: 'activation' as const, label: 'Attivazione', inverted: true },
  { key: 'impulsivity' as const, label: 'Impulsivita', inverted: true },
  { key: 'verification' as const, label: 'Verifica', inverted: false },
  { key: 'awareness' as const, label: 'Consapevolezza', inverted: false },
];

function polarToCartesian(
  cx: number,
  cy: number,
  radius: number,
  angleDeg: number,
): { x: number; y: number } {
  const angleRad = ((angleDeg - 90) * Math.PI) / 180;
  return {
    x: cx + radius * Math.cos(angleRad),
    y: cy + radius * Math.sin(angleRad),
  };
}

function buildPolygonPoints(
  scores: BehaviorScores,
  cx: number,
  cy: number,
  maxRadius: number,
): string {
  return AXES.map((axis, i) => {
    const raw = scores[axis.key];
    const normalized = axis.inverted ? 100 - raw : raw;
    const radius = (normalized / 100) * maxRadius;
    const angle = (360 / AXES.length) * i;
    const { x, y } = polarToCartesian(cx, cy, radius, angle);
    return `${x},${y}`;
  }).join(' ');
}

export function RadarChart({
  scores,
  previousScores,
  size = 200,
}: RadarChartProps) {
  const cx = size / 2;
  const cy = size / 2;
  const maxRadius = size / 2 - 30;

  // Grid rings at 25%, 50%, 75%, 100%
  const rings = [0.25, 0.5, 0.75, 1];

  const currentPoints = buildPolygonPoints(scores, cx, cy, maxRadius);
  const prevPoints = previousScores
    ? buildPolygonPoints(previousScores, cx, cy, maxRadius)
    : null;

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      className="mx-auto"
      style={{ maxWidth: size, maxHeight: size }}
      role="img"
      aria-label="Grafico radar punteggi comportamentali"
    >
      {/* Grid rings */}
      {rings.map((pct) => (
        <polygon
          key={pct}
          points={AXES.map((_, i) => {
            const angle = (360 / AXES.length) * i;
            const { x, y } = polarToCartesian(cx, cy, maxRadius * pct, angle);
            return `${x},${y}`;
          }).join(' ')}
          fill="none"
          stroke="rgb(51 65 85 / 0.4)"
          strokeWidth={1}
        />
      ))}

      {/* Axis lines */}
      {AXES.map((_, i) => {
        const angle = (360 / AXES.length) * i;
        const end = polarToCartesian(cx, cy, maxRadius, angle);
        return (
          <line
            key={i}
            x1={cx}
            y1={cy}
            x2={end.x}
            y2={end.y}
            stroke="rgb(51 65 85 / 0.3)"
            strokeWidth={1}
          />
        );
      })}

      {/* Previous scores polygon (comparison) */}
      {prevPoints && (
        <polygon
          points={prevPoints}
          fill="rgb(251 191 36 / 0.1)"
          stroke="rgb(251 191 36 / 0.4)"
          strokeWidth={1}
          strokeDasharray="4 2"
        />
      )}

      {/* Current scores polygon */}
      <m.polygon
        points={currentPoints}
        fill="rgb(34 211 238 / 0.15)"
        stroke="rgb(34 211 238 / 0.8)"
        strokeWidth={2}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      />

      {/* Axis labels */}
      {AXES.map((axis, i) => {
        const angle = (360 / AXES.length) * i;
        const labelPos = polarToCartesian(cx, cy, maxRadius + 18, angle);
        return (
          <text
            key={axis.key}
            x={labelPos.x}
            y={labelPos.y}
            textAnchor="middle"
            dominantBaseline="middle"
            className="fill-slate-400 text-[10px]"
          >
            {axis.label}
          </text>
        );
      })}
    </svg>
  );
}
```

**Step 2: Verify build**

Run: `npx tsc --noEmit`
Expected: 0 errors

**Step 3: Commit**

```bash
git add src/components/training/RadarChart.tsx
git commit -m "feat(training): add RadarChart SVG component for 4-axis behavioral scores"
```

---

## Task 6: Enhance SessionReport with Radar + Comparison

**Files:**
- Modify: `src/components/training/SessionReport.tsx`

**Step 1: Add RadarChart and profile comparison to SessionReport**

Changes:
1. Import `RadarChart`
2. Add optional `previousAverageScores` prop to SessionReportProps
3. Render RadarChart between risk score summary and dimension bars
4. Show "vs la tua media" comparison text next to each ScoreBar
5. Add comparison legend if previous scores are provided

New props to add:
```typescript
interface SessionReportProps {
  readonly scores: BehaviorScores | null;
  readonly reflections: readonly ReflectionAnswer[];
  readonly previousAverageScores?: Record<TrainingDimension, number> | null;
  readonly onFinish: () => void;
  readonly onBack: () => void;
}
```

**Step 2: Verify build**

Run: `npx tsc --noEmit`
Expected: 0 errors

**Step 3: Commit**

```bash
git add src/components/training/SessionReport.tsx
git commit -m "feat(training): add RadarChart and profile comparison to SessionReport"
```

---

## Task 7: Welcome Message for Returning Users

**Files:**
- Modify: `src/pages/SimulationsPage.tsx`

**Step 1: Add personalized welcome in Palestra Mentale card**

When `profile.sessionsCompleted > 0`, show:
- "Bentornato! X sessioni completate" instead of generic description
- Last session score with delta arrow
- Weakest dimension hint

**Step 2: Verify build**

Run: `npx tsc --noEmit`
Expected: 0 errors

**Step 3: Commit**

```bash
git add src/pages/SimulationsPage.tsx
git commit -m "feat(training): add personalized welcome for returning users"
```

---

## Task 8: Final Build + Lint Verification

**Step 1: Full build**

Run: `npm run build`
Expected: 0 TypeScript errors, successful Vite build

**Step 2: Lint**

Run: `npm run lint`
Expected: 0 new errors (pre-existing errors in BankSection/TrustedContactRow are acceptable)

**Step 3: Verify backward compatibility**

Check that scripted simulations still work by verifying:
- `SimulationsPage` still renders simulation cards
- `ChatSimulator` import is unchanged
- No regressions in hub view

**Step 4: Final commit**

```bash
git add -A
git commit -m "chore(training): Phase 2 complete — profile, setup UI, R4, radar chart"
```
