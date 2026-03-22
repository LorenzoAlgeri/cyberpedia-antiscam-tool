/**
 * TrainingSetup — configuration screen before starting a training session.
 *
 * Three selection sections:
 * 1. Attack type (reuses AttackTypeSelector)
 * 2. Difficulty (easy / medium / hard)
 * 3. Psychological lever (training target)
 *
 * Plus a recommendation banner when the user has prior sessions.
 */

import { useState } from 'react';
import * as m from 'motion/react-m';
import {
  Timer,
  Scale,
  ShieldAlert,
  HandHeart,
  Gem,
  Crown,
  Zap,
  ArrowLeft,
  type LucideIcon,
} from 'lucide-react';

import { AttackTypeSelector } from '@/components/emergency/AttackTypeSelector';
import { TRAINING_TARGETS } from '@/data/training-targets';
import type { AttackType } from '@/types/emergency';
import type { TrainingTarget, UserProfile } from '@/types/training';

// ---------------------------------------------------------------------------
// Icon map for training targets
// ---------------------------------------------------------------------------

const TARGET_ICON_MAP: Record<string, LucideIcon> = {
  Timer,
  Scale,
  ShieldAlert,
  HandHeart,
  Gem,
  Crown,
};

// ---------------------------------------------------------------------------
// Difficulty options
// ---------------------------------------------------------------------------

interface DifficultyOption {
  readonly value: 'easy' | 'medium' | 'hard';
  readonly label: string;
  readonly description: string;
}

const DIFFICULTIES: readonly DifficultyOption[] = [
  { value: 'easy', label: 'Facile', description: 'Segnali evidenti' },
  { value: 'medium', label: 'Medio', description: 'Segnali sottili' },
  { value: 'hard', label: 'Difficile', description: 'Molto realistico' },
] as const;

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface TrainingSetupProps {
  readonly profile: UserProfile | null;
  readonly recommendedTarget: TrainingTarget | null;
  readonly isLoading: boolean;
  readonly onStart: (
    attackType: AttackType,
    difficulty: 'easy' | 'medium' | 'hard',
    target: TrainingTarget,
  ) => void;
  readonly onBack: () => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function TrainingSetup({
  profile,
  recommendedTarget,
  isLoading,
  onStart,
  onBack,
}: TrainingSetupProps) {
  const [attackType, setAttackType] = useState<AttackType | null>(null);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [target, setTarget] = useState<TrainingTarget | null>(null);

  const canStart = attackType !== null && target !== null;
  const showRecommendation =
    profile !== null &&
    profile.sessionsCompleted > 0 &&
    recommendedTarget !== null;

  function handleStart() {
    if (attackType !== null && target !== null) {
      onStart(attackType, difficulty, target);
    }
  }

  return (
    <div className="flex flex-col gap-6 sm:gap-8">
      {/* ----------------------------------------------------------------- */}
      {/* Header                                                            */}
      {/* ----------------------------------------------------------------- */}
      <div className="flex items-center gap-3">
        <m.button
          type="button"
          onClick={onBack}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="flex h-11 w-11 items-center justify-center rounded-xl border-2 border-white/10 bg-secondary/50 text-muted-foreground transition-colors hover:border-cyan-brand/30 hover:text-foreground"
          aria-label="Torna indietro"
        >
          <ArrowLeft className="h-5 w-5" strokeWidth={2} />
        </m.button>
        <h2 className="text-xl font-bold text-foreground sm:text-2xl">
          Configura sessione
        </h2>
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* Recommendation banner                                             */}
      {/* ----------------------------------------------------------------- */}
      {showRecommendation && (
        <m.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 rounded-2xl border-2 border-cyan-brand/30 bg-cyan-brand/10 p-4 backdrop-blur-sm"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-brand/20 text-cyan-brand">
            <Zap className="h-5 w-5" strokeWidth={2} aria-hidden="true" />
          </div>
          <p className="text-sm text-foreground/90 sm:text-base">
            <span className="font-semibold text-cyan-brand">Suggerimento:</span>{' '}
            in base alle tue sessioni precedenti, ti consigliamo di allenarti su{' '}
            <span className="font-semibold">
              {TRAINING_TARGETS.find((t) => t.id === recommendedTarget)?.label ??
                recommendedTarget}
            </span>
            .
          </p>
        </m.div>
      )}

      {/* ----------------------------------------------------------------- */}
      {/* Section 1: Attack type                                            */}
      {/* ----------------------------------------------------------------- */}
      <section className="flex flex-col gap-3">
        <h3 className="text-base font-semibold text-foreground sm:text-lg">
          Tipo di attacco
        </h3>
        <AttackTypeSelector selected={attackType} onSelect={setAttackType} />
      </section>

      {/* ----------------------------------------------------------------- */}
      {/* Section 2: Difficulty                                             */}
      {/* ----------------------------------------------------------------- */}
      <section className="flex flex-col gap-3">
        <h3 className="text-base font-semibold text-foreground sm:text-lg">
          Difficolta
        </h3>
        <div className="grid grid-cols-3 gap-3">
          {DIFFICULTIES.map((d) => {
            const isSelected = difficulty === d.value;
            return (
              <m.button
                key={d.value}
                type="button"
                onClick={() => setDifficulty(d.value)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                className={`flex flex-col items-center justify-center gap-1 rounded-2xl border-2 p-4 text-center transition-colors ${
                  isSelected
                    ? 'border-cyan-brand bg-cyan-brand/10 shadow-lg shadow-cyan-brand/15'
                    : 'border-white/10 bg-secondary/50 hover:border-cyan-brand/30 hover:bg-secondary'
                }`}
                style={{ minHeight: 44 }}
                aria-pressed={isSelected}
              >
                <span
                  className={`text-sm font-semibold sm:text-base ${
                    isSelected ? 'text-foreground' : 'text-foreground/80'
                  }`}
                >
                  {d.label}
                </span>
                <span className="text-xs text-muted-foreground sm:text-sm">
                  {d.description}
                </span>
              </m.button>
            );
          })}
        </div>
      </section>

      {/* ----------------------------------------------------------------- */}
      {/* Section 3: Training target                                        */}
      {/* ----------------------------------------------------------------- */}
      <section className="flex flex-col gap-3">
        <h3 className="text-base font-semibold text-foreground sm:text-lg">
          Leva psicologica
        </h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {TRAINING_TARGETS.map((t) => {
            const Icon = TARGET_ICON_MAP[t.icon] ?? Zap;
            const isSelected = target === t.id;
            const isRecommended = recommendedTarget === t.id;

            return (
              <m.button
                key={t.id}
                type="button"
                onClick={() => setTarget(t.id)}
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.97 }}
                transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                className={`relative flex flex-col items-center justify-center gap-2 rounded-2xl border-2 p-4 text-center transition-colors sm:gap-3 sm:p-5 ${
                  isSelected
                    ? 'border-cyan-brand bg-cyan-brand/10 shadow-lg shadow-cyan-brand/15'
                    : 'border-white/10 bg-secondary/50 hover:border-cyan-brand/30 hover:bg-secondary'
                }`}
                style={{ minHeight: 44 }}
                aria-pressed={isSelected}
              >
                {/* Suggerito badge */}
                {isRecommended && (
                  <span className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-full border border-cyan-brand/30 bg-cyan-brand/15 px-2 py-0.5 text-[10px] font-semibold text-cyan-brand">
                    <Zap className="h-2.5 w-2.5" strokeWidth={2} aria-hidden="true" />
                    Suggerito
                  </span>
                )}

                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-xl sm:h-12 sm:w-12 ${
                    isSelected
                      ? 'bg-cyan-brand/20 text-cyan-brand'
                      : 'bg-white/5 text-muted-foreground'
                  }`}
                >
                  <Icon
                    className="h-5 w-5 sm:h-6 sm:w-6"
                    strokeWidth={1.5}
                    aria-hidden="true"
                  />
                </div>

                <div>
                  <span
                    className={`block text-sm font-semibold leading-tight sm:text-base ${
                      isSelected ? 'text-foreground' : 'text-foreground/80'
                    }`}
                  >
                    {t.label}
                  </span>
                  <span className="mt-1 block text-xs text-muted-foreground sm:text-sm">
                    {t.description}
                  </span>
                </div>
              </m.button>
            );
          })}
        </div>
      </section>

      {/* ----------------------------------------------------------------- */}
      {/* Start button                                                      */}
      {/* ----------------------------------------------------------------- */}
      <m.button
        type="button"
        onClick={handleStart}
        disabled={!canStart || isLoading}
        whileHover={canStart && !isLoading ? { scale: 1.02 } : {}}
        whileTap={canStart && !isLoading ? { scale: 0.98 } : {}}
        className={`mt-2 flex w-full items-center justify-center gap-2 rounded-2xl px-6 py-4 text-base font-bold shadow-xl transition-colors sm:text-lg ${
          canStart && !isLoading
            ? 'bg-gradient-to-r from-cyan-500 to-cyan-400 text-slate-900 shadow-cyan-500/25 hover:from-cyan-400 hover:to-cyan-300'
            : 'cursor-not-allowed bg-secondary/50 text-muted-foreground'
        }`}
        style={{ minHeight: 44 }}
      >
        {isLoading ? (
          <>
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
            Preparazione...
          </>
        ) : (
          <>
            <Zap className="h-5 w-5" strokeWidth={2} aria-hidden="true" />
            Inizia sessione
          </>
        )}
      </m.button>
    </div>
  );
}
