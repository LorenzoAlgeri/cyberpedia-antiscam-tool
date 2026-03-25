/**
 * TrainingSetup — configuration screen before starting a training session.
 *
 * Four selection sections:
 * 1. Attack type (reuses AttackTypeSelector)
 * 2. Difficulty (easy / medium / hard)
 * 3. Scammer gender presentation
 * 4. Psychological levers (multi-select, max 3)
 *
 * Plus a recommendation banner when the user has prior sessions.
 */

import { useState, useRef } from 'react';
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
import type { TrainingTarget, UserProfile, CustomScenario, ScammerGender } from '@/types/training';

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
// Recommended levers per attack type
// ---------------------------------------------------------------------------

/** Psychological levers recommended for each attack type */
const ATTACK_RECOMMENDED_LEVERS: Partial<Record<AttackType, TrainingTarget[]>> = {
  romance: ['trust', 'responsibility'],
  'fake-operator': ['authority', 'urgency', 'fear'],
  phishing: ['urgency', 'fear'],
  'fake-relative': ['responsibility', 'urgency'],
  financial: ['easy_gain', 'authority'],
  'social-engineering': ['trust', 'authority'],
};

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface TrainingSetupProps {
  readonly profile: UserProfile | null;
  readonly recommendedTarget: TrainingTarget | null;
  /** Pre-selected levers — used when navigating from "Allenati su questo" in SessionReport */
  readonly initialTargets?: readonly TrainingTarget[];
  readonly isLoading: boolean;
  readonly error: string | null;
  readonly customScenarios: readonly CustomScenario[];
  readonly onStart: (
    attackType: AttackType,
    difficulty: 'easy' | 'medium' | 'hard',
    targets: TrainingTarget[],
    customDescription?: string,
    customPersona?: { name: string; role: string; tone: string },
    gender?: ScammerGender,
  ) => void;
  readonly onCreateScenario: () => void;
  readonly onDeleteScenario: (id: string) => void;
  readonly onBack: () => void;
}

// ---------------------------------------------------------------------------
// Difficulty suggestion based on user profile
// ---------------------------------------------------------------------------

type Difficulty = 'easy' | 'medium' | 'hard';

function getSuggestedDifficulty(profile: UserProfile | null): Difficulty | null {
  if (!profile || profile.sessionHistory.length < 3) return null;

  // Average riskScore of last 3 sessions
  const recent = profile.sessionHistory.slice(0, 3);
  const avgRisk = recent.reduce((sum, s) => sum + s.finalRiskScore, 0) / recent.length;

  if (avgRisk > 70) return 'easy';   // struggling -> suggest easier
  if (avgRisk < 40) return 'hard';   // doing well -> suggest harder
  return null; // medium is fine
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function TrainingSetup({
  profile,
  recommendedTarget,
  initialTargets,
  isLoading,
  error,
  customScenarios,
  onStart,
  onCreateScenario,
  onDeleteScenario,
  onBack,
}: TrainingSetupProps) {
  const suggestedDifficulty = getSuggestedDifficulty(profile);

  const [attackType, setAttackType] = useState<AttackType | null>(null);
  const [difficulty, setDifficulty] = useState<Difficulty>(suggestedDifficulty ?? 'medium');
  // initialTargets allows pre-seeding levers from "Allenati su questo" in SessionReport
  const [targets, setTargets] = useState<TrainingTarget[]>(
    initialTargets != null ? [...initialTargets] : [],
  );
  const [scammerGender, setScammerGender] = useState<ScammerGender>('unspecified');
  const [selectedCustom, setSelectedCustom] = useState<CustomScenario | null>(null);

  const difficultySectionRef = useRef<HTMLElement>(null);

  // Can start if either: standard (attackType + at least one target) or custom scenario selected
  const canStart = selectedCustom !== null || (attackType !== null && targets.length > 0);
  const showRecommendation =
    profile !== null &&
    profile.sessionsCompleted > 0 &&
    recommendedTarget !== null;

  function handleSelectCustom(scenario: CustomScenario) {
    setSelectedCustom(scenario);
    setAttackType(null); // deselect standard attack type
    setTargets([scenario.trainingTarget]);
    setDifficulty(scenario.difficulty);
  }

  function handleSelectStandardAttack(type: AttackType) {
    setAttackType(type);
    setSelectedCustom(null); // deselect custom
    // Pre-select recommended levers
    const recommended = ATTACK_RECOMMENDED_LEVERS[type] ?? [];
    setTargets(recommended.slice(0, 2));
    // Auto-scroll to difficulty section
    setTimeout(() => {
      difficultySectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 50);
  }

  function handleToggleTarget(id: TrainingTarget) {
    setTargets((prev) => {
      if (prev.includes(id)) return prev.filter((t) => t !== id);
      if (prev.length >= 3) return prev;
      return [...prev, id];
    });
  }

  function handleStart() {
    if (selectedCustom) {
      onStart(
        'financial', // base type (won't be used by Gemini when customDescription is present)
        selectedCustom.difficulty,
        [selectedCustom.trainingTarget],
        selectedCustom.attackDescription,
        selectedCustom.scammerPersona,
      );
    } else if (attackType !== null && targets.length > 0) {
      onStart(attackType, difficulty, targets, undefined, undefined, scammerGender);
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
          <p className="text-base text-foreground/90 sm:text-lg">
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
      {/* Custom scenarios section                                          */}
      {/* ----------------------------------------------------------------- */}
      <section className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-foreground sm:text-lg">
              I tuoi scenari
            </h3>
            <button
              type="button"
              onClick={onCreateScenario}
              className="rounded-xl bg-cyan-brand/15 px-3 py-1.5 text-sm font-medium text-cyan-300 transition-colors hover:bg-cyan-brand/25"
              style={{ minHeight: 36 }}
            >
              + Crea nuovo
            </button>
          </div>
          {customScenarios.length === 0 ? (
            <p className="text-base text-muted-foreground">
              Nessuno scenario personalizzato. Crea il tuo primo scenario!
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {customScenarios.map((cs) => (
                <m.div
                  key={cs.id}
                  whileTap={{ scale: 0.98 }}
                  className={`flex items-center gap-3 rounded-2xl border-2 p-3 transition-colors cursor-pointer ${
                    selectedCustom?.id === cs.id
                      ? 'border-cyan-brand bg-cyan-brand/10'
                      : 'border-white/10 bg-secondary/50 hover:border-cyan-brand/30'
                  }`}
                  style={{ minHeight: 44 }}
                  onClick={() => handleSelectCustom(cs)}
                >
                  <div className="flex-1">
                    <p className={`text-base font-semibold ${
                      selectedCustom?.id === cs.id ? 'text-foreground' : 'text-foreground/80'
                    }`}>
                      {cs.name}
                    </p>
                    <p className="text-sm text-muted-foreground">{cs.description}</p>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); onDeleteScenario(cs.id); }}
                    className="shrink-0 rounded-lg p-2 text-slate-500 transition-colors hover:bg-red-500/10 hover:text-red-400"
                    aria-label={`Elimina ${cs.name}`}
                    style={{ minHeight: 36, minWidth: 36 }}
                  >
                    ×
                  </button>
                </m.div>
              ))}
            </div>
          )}
      </section>

      {/* ----------------------------------------------------------------- */}
      {/* Section 1: Attack type (standard)                                 */}
      {/* ----------------------------------------------------------------- */}
      {!selectedCustom && (
      <section className="flex flex-col gap-3">
        <h3 className="text-base font-semibold text-foreground sm:text-lg">
          Tipo di attacco
        </h3>
        <AttackTypeSelector selected={attackType} onSelect={handleSelectStandardAttack} />
      </section>
      )}

      {/* ----------------------------------------------------------------- */}
      {/* Section 2: Difficulty (hidden when custom scenario selected)      */}
      {/* ----------------------------------------------------------------- */}
      {!selectedCustom && (
      <section ref={difficultySectionRef} className="flex flex-col gap-3">
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
                  className={`text-base font-semibold sm:text-lg ${
                    isSelected ? 'text-foreground' : 'text-foreground/80'
                  }`}
                >
                  {d.label}
                </span>
                <span className="text-sm text-muted-foreground sm:text-base">
                  {d.description}
                </span>
                {suggestedDifficulty === d.value && (
                  <span className="mt-1 block text-[10px] font-medium text-cyan-300">
                    Consigliato per te
                  </span>
                )}
              </m.button>
            );
          })}
        </div>
      </section>
      )}

      {/* ----------------------------------------------------------------- */}
      {/* Section 3: Scammer gender (hidden when custom scenario selected)  */}
      {/* ----------------------------------------------------------------- */}
      {!selectedCustom && (
        <section className="flex flex-col gap-3">
          <h3 className="text-base font-semibold text-foreground sm:text-lg">
            Come vuoi che il truffatore si presenti?
          </h3>
          <div className="grid grid-cols-3 gap-3">
            {([
              { value: 'male' as ScammerGender, label: 'Uomo' },
              { value: 'female' as ScammerGender, label: 'Donna' },
              { value: 'unspecified' as ScammerGender, label: 'Non specificare' },
            ] as const).map((g) => {
              const isSelected = scammerGender === g.value;
              return (
                <m.button
                  key={g.value}
                  type="button"
                  onClick={() => setScammerGender(g.value)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  className={`flex items-center justify-center rounded-2xl border-2 p-3 text-center transition-colors ${
                    isSelected
                      ? 'border-cyan-brand bg-cyan-brand/10 shadow-lg shadow-cyan-brand/15'
                      : 'border-white/10 bg-secondary/50 hover:border-cyan-brand/30 hover:bg-secondary'
                  }`}
                  style={{ minHeight: 44 }}
                  aria-pressed={isSelected}
                >
                  <span className={`text-base font-semibold ${isSelected ? 'text-foreground' : 'text-foreground/80'}`}>
                    {g.label}
                  </span>
                </m.button>
              );
            })}
          </div>
        </section>
      )}

      {/* ----------------------------------------------------------------- */}
      {/* Section 4: Training targets (hidden when custom scenario selected)*/}
      {/* ----------------------------------------------------------------- */}
      {!selectedCustom && (
      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-foreground sm:text-lg">
            Leva psicologica
          </h3>
          <span className="text-sm text-muted-foreground">
            {targets.length}/3 selezionate
          </span>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {TRAINING_TARGETS.map((t) => {
            const Icon = TARGET_ICON_MAP[t.icon] ?? Zap;
            const isSelected = targets.includes(t.id);
            const isRecommended = recommendedTarget === t.id;
            const recommendedForAttack = attackType ? (ATTACK_RECOMMENDED_LEVERS[attackType] ?? []) : [];
            const isFrequent = recommendedForAttack.includes(t.id);

            return (
              <m.button
                key={t.id}
                type="button"
                onClick={() => handleToggleTarget(t.id)}
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
                    className={`block text-base font-semibold leading-tight sm:text-lg ${
                      isSelected ? 'text-foreground' : 'text-foreground/80'
                    }`}
                  >
                    {t.label}
                  </span>
                  <span className="mt-1 block text-sm text-muted-foreground sm:text-base">
                    {t.description}
                  </span>
                  {/* Frequente badge — shown when attack type recommends this lever and it is not already marked Suggerito */}
                  {isFrequent && !isRecommended && (
                    <span className="mt-0.5 block text-[10px] font-medium text-amber-400">
                      Frequente
                    </span>
                  )}
                  {/* Tooltip — shown inline when target is selected and has a tooltip */}
                  {isSelected && t.tooltip && (
                    <span className="mt-1 block text-[10px] leading-relaxed text-slate-400 italic text-left">
                      {t.tooltip}
                    </span>
                  )}
                </div>
              </m.button>
            );
          })}
        </div>
      </section>
      )}

      {/* Selected custom scenario info */}
      {selectedCustom && (
        <div className="rounded-2xl border border-cyan-brand/30 bg-cyan-brand/5 p-4">
          <p className="text-base font-semibold text-cyan-300">{selectedCustom.name}</p>
          <p className="mt-1 text-sm text-slate-400">{selectedCustom.description}</p>
          <p className="mt-2 text-sm text-slate-500">
            Difficoltà: {selectedCustom.difficulty} · Leva: {TRAINING_TARGETS.find(t => t.id === selectedCustom.trainingTarget)?.label}
          </p>
          <button
            type="button"
            onClick={() => setSelectedCustom(null)}
            className="mt-2 text-sm text-cyan-400 hover:text-cyan-300"
          >
            Cambia selezione
          </button>
        </div>
      )}

      {/* Error message */}
      {error && (
        <p className="text-center text-base text-red-400" role="alert">
          {error}
        </p>
      )}

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
