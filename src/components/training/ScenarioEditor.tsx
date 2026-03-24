/**
 * ScenarioEditor — form for creating/editing custom training scenarios.
 *
 * Mobile-first, dark glassmorphism design consistent with the app.
 * All data stays local (assembled into CustomScenario on save).
 */

import { useState } from 'react';
import * as m from 'motion/react-m';
import {
  ArrowLeft,
  Save,
  User,
  FileText,
  Target,
  Timer,
  Scale,
  ShieldAlert,
  HandHeart,
  Gem,
  Crown,
  Zap,
  type LucideIcon,
} from 'lucide-react';

import { TRAINING_TARGETS } from '@/data/training-targets';
import type { CustomScenario, TrainingTarget } from '@/types/training';

// ---------------------------------------------------------------------------
// Icon map (same as TrainingSetup)
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
}

const DIFFICULTIES: readonly DifficultyOption[] = [
  { value: 'easy', label: 'Facile' },
  { value: 'medium', label: 'Medio' },
  { value: 'hard', label: 'Difficile' },
] as const;

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface ScenarioEditorProps {
  readonly onSave: (scenario: Omit<CustomScenario, 'id' | 'createdAt'>) => void;
  readonly onCancel: () => void;
  /** Optional: pre-fill for editing an existing scenario */
  readonly initial?: CustomScenario;
}

// ---------------------------------------------------------------------------
// Shared input styles
// ---------------------------------------------------------------------------

const INPUT_CLASS =
  'w-full rounded-2xl bg-slate-800/60 border border-slate-700/30 px-4 py-3 text-foreground placeholder:text-muted-foreground/60 focus:border-cyan-brand focus:ring-2 focus:ring-cyan-brand/30 focus:outline-none transition-colors';

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ScenarioEditor({ onSave, onCancel, initial }: ScenarioEditorProps) {
  // Form state — pre-filled from `initial` when editing
  const [name, setName] = useState(initial?.name ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [attackDescription, setAttackDescription] = useState(
    initial?.attackDescription ?? '',
  );
  const [personaName, setPersonaName] = useState(initial?.scammerPersona.name ?? '');
  const [personaRole, setPersonaRole] = useState(initial?.scammerPersona.role ?? '');
  const [personaTone, setPersonaTone] = useState(initial?.scammerPersona.tone ?? '');
  const [target, setTarget] = useState<TrainingTarget | null>(
    initial?.trainingTarget ?? null,
  );
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>(
    initial?.difficulty ?? 'medium',
  );

  // Validation
  const canSave =
    name.trim().length > 0 &&
    description.trim().length > 0 &&
    attackDescription.trim().length > 0 &&
    target !== null;

  function handleSave() {
    if (!canSave || target === null) return;

    onSave({
      name: name.trim(),
      description: description.trim(),
      attackDescription: attackDescription.trim(),
      scammerPersona: {
        name: personaName.trim(),
        role: personaRole.trim(),
        tone: personaTone.trim(),
      },
      trainingTarget: target,
      difficulty,
    });
  }

  return (
    <div className="flex h-full flex-col">
      {/* --------------------------------------------------------------- */}
      {/* Header                                                          */}
      {/* --------------------------------------------------------------- */}
      <div className="flex items-center gap-3 pb-4">
        <m.button
          type="button"
          onClick={onCancel}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="flex h-11 w-11 items-center justify-center rounded-xl border-2 border-white/10 bg-secondary/50 text-muted-foreground transition-colors hover:border-cyan-brand/30 hover:text-foreground"
          aria-label="Torna indietro"
        >
          <ArrowLeft className="h-5 w-5" strokeWidth={2} />
        </m.button>
        <h2 className="text-xl font-bold text-foreground sm:text-2xl">
          {initial ? 'Modifica scenario' : 'Crea scenario'}
        </h2>
      </div>

      {/* --------------------------------------------------------------- */}
      {/* Scrollable form content                                         */}
      {/* --------------------------------------------------------------- */}
      <div className="flex-1 space-y-5 overflow-y-auto pb-28 sm:space-y-6">
        {/* ----- Nome scenario ----- */}
        <fieldset className="flex flex-col gap-2">
          <label htmlFor="scenario-name" className="flex items-center gap-2 text-base font-medium text-slate-300">
            <FileText className="h-4 w-4 text-cyan-brand" strokeWidth={2} aria-hidden="true" />
            Nome scenario <span className="text-red-400">*</span>
          </label>
          <input
            id="scenario-name"
            type="text"
            maxLength={50}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Es: Truffa bonifico CEO"
            className={INPUT_CLASS}
            style={{ fontSize: '16px' }}
          />
          <span className="text-right text-xs text-muted-foreground">
            {name.length}/50
          </span>
        </fieldset>

        {/* ----- Descrizione breve ----- */}
        <fieldset className="flex flex-col gap-2">
          <label htmlFor="scenario-desc" className="flex items-center gap-2 text-base font-medium text-slate-300">
            <FileText className="h-4 w-4 text-cyan-brand" strokeWidth={2} aria-hidden="true" />
            Descrizione breve <span className="text-red-400">*</span>
          </label>
          <input
            id="scenario-desc"
            type="text"
            maxLength={100}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Es: Il truffatore si finge il CEO e chiede un bonifico urgente"
            className={INPUT_CLASS}
            style={{ fontSize: '16px' }}
          />
          <span className="text-right text-xs text-muted-foreground">
            {description.length}/100
          </span>
        </fieldset>

        {/* ----- Descrizione dettagliata dell'attacco ----- */}
        <fieldset className="flex flex-col gap-2">
          <label htmlFor="scenario-attack" className="flex items-center gap-2 text-base font-medium text-slate-300">
            <Target className="h-4 w-4 text-cyan-brand" strokeWidth={2} aria-hidden="true" />
            Descrizione dettagliata dell&apos;attacco <span className="text-red-400">*</span>
          </label>
          <textarea
            id="scenario-attack"
            maxLength={500}
            rows={4}
            value={attackDescription}
            onChange={(e) => setAttackDescription(e.target.value)}
            placeholder="Descrivi in dettaglio come funziona la truffa, il contesto, e le tecniche di manipolazione usate..."
            className={`${INPUT_CLASS} resize-none`}
            style={{ fontSize: '16px' }}
          />
          <span className="text-right text-xs text-muted-foreground">
            {attackDescription.length}/500
          </span>
        </fieldset>

        {/* ----- Persona del truffatore ----- */}
        <fieldset className="flex flex-col gap-2">
          <legend className="flex items-center gap-2 text-base font-medium text-slate-300">
            <User className="h-4 w-4 text-cyan-brand" strokeWidth={2} aria-hidden="true" />
            Persona del truffatore
          </legend>
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            <input
              type="text"
              value={personaName}
              onChange={(e) => setPersonaName(e.target.value)}
              placeholder="Mario Rossi"
              className={INPUT_CLASS}
              style={{ fontSize: '16px' }}
              aria-label="Nome del truffatore"
            />
            <input
              type="text"
              value={personaRole}
              onChange={(e) => setPersonaRole(e.target.value)}
              placeholder="Direttore finanziario"
              className={INPUT_CLASS}
              style={{ fontSize: '16px' }}
              aria-label="Ruolo del truffatore"
            />
            <input
              type="text"
              value={personaTone}
              onChange={(e) => setPersonaTone(e.target.value)}
              placeholder="autoritario, urgente"
              className={INPUT_CLASS}
              style={{ fontSize: '16px' }}
              aria-label="Tono del truffatore"
            />
          </div>
        </fieldset>

        {/* ----- Leva psicologica ----- */}
        <fieldset className="flex flex-col gap-2">
          <legend className="flex items-center gap-2 text-base font-medium text-slate-300">
            <Target className="h-4 w-4 text-cyan-brand" strokeWidth={2} aria-hidden="true" />
            Leva psicologica <span className="text-red-400">*</span>
          </legend>
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            {TRAINING_TARGETS.map((t) => {
              const Icon = TARGET_ICON_MAP[t.icon] ?? Zap;
              const isSelected = target === t.id;

              return (
                <m.button
                  key={t.id}
                  type="button"
                  onClick={() => setTarget(t.id)}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className={`flex items-center gap-2 rounded-2xl border-2 px-3 py-2.5 text-left transition-colors sm:px-4 sm:py-3 ${
                    isSelected
                      ? 'border-cyan-brand bg-cyan-brand/10 shadow-lg shadow-cyan-brand/15'
                      : 'border-white/10 bg-secondary/50 hover:border-cyan-brand/30 hover:bg-secondary'
                  }`}
                  style={{ minHeight: 44 }}
                  aria-pressed={isSelected}
                >
                  <Icon
                    className={`h-4 w-4 shrink-0 ${
                      isSelected ? 'text-cyan-brand' : 'text-muted-foreground'
                    }`}
                    strokeWidth={2}
                    aria-hidden="true"
                  />
                  <span
                    className={`text-sm font-medium leading-tight sm:text-base ${
                      isSelected ? 'text-foreground' : 'text-foreground/80'
                    }`}
                  >
                    {t.label}
                  </span>
                </m.button>
              );
            })}
          </div>
        </fieldset>

        {/* ----- Difficolta ----- */}
        <fieldset className="flex flex-col gap-2">
          <legend className="text-base font-medium text-slate-300">
            Difficolta
          </legend>
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            {DIFFICULTIES.map((d) => {
              const isSelected = difficulty === d.value;
              return (
                <m.button
                  key={d.value}
                  type="button"
                  onClick={() => setDifficulty(d.value)}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className={`rounded-2xl border-2 px-4 py-3 text-center font-semibold transition-colors ${
                    isSelected
                      ? 'border-cyan-brand bg-cyan-brand/10 text-foreground shadow-lg shadow-cyan-brand/15'
                      : 'border-white/10 bg-secondary/50 text-foreground/80 hover:border-cyan-brand/30 hover:bg-secondary'
                  }`}
                  style={{ minHeight: 44 }}
                  aria-pressed={isSelected}
                >
                  {d.label}
                </m.button>
              );
            })}
          </div>
        </fieldset>
      </div>

      {/* --------------------------------------------------------------- */}
      {/* Fixed bottom action buttons                                      */}
      {/* --------------------------------------------------------------- */}
      <div className="fixed inset-x-0 bottom-0 border-t border-slate-700/50 bg-background/80 px-4 py-4 backdrop-blur-xl sm:px-8">
        <div className="mx-auto flex max-w-2xl gap-3 lg:max-w-4xl">
          {/* Cancel */}
          <m.button
            type="button"
            onClick={onCancel}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex flex-1 items-center justify-center gap-2 rounded-2xl border-2 border-white/10 bg-secondary/50 px-4 py-3.5 text-base font-semibold text-muted-foreground transition-colors hover:border-cyan-brand/30 hover:text-foreground"
            style={{ minHeight: 44 }}
          >
            Annulla
          </m.button>

          {/* Save */}
          <m.button
            type="button"
            onClick={handleSave}
            disabled={!canSave}
            whileHover={canSave ? { scale: 1.02 } : {}}
            whileTap={canSave ? { scale: 0.98 } : {}}
            className={`flex flex-[2] items-center justify-center gap-2 rounded-2xl px-6 py-3.5 text-base font-bold shadow-xl transition-colors ${
              canSave
                ? 'bg-gradient-to-r from-cyan-500 to-cyan-400 text-slate-900 shadow-cyan-500/25 hover:from-cyan-400 hover:to-cyan-300'
                : 'cursor-not-allowed bg-secondary/50 text-muted-foreground'
            }`}
            style={{ minHeight: 44 }}
          >
            <Save className="h-5 w-5" strokeWidth={2} aria-hidden="true" />
            Salva scenario
          </m.button>
        </div>
      </div>
    </div>
  );
}
