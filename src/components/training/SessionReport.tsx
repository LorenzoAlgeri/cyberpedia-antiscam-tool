/**
 * SessionReport — final score display after training session.
 *
 * Shows 4 behavioral dimensions as horizontal bars:
 * - Activation (lower = better)
 * - Impulsivity (lower = better)
 * - Verification (higher = better)
 * - Awareness (higher = better)
 *
 * Also includes:
 * - Global risk interpretation (5.4)
 * - Per-dimension score interpretation with range texts (5.3)
 * - "Allenati su questo" button for red-zone dimensions (5.5)
 * - HelpCircle tooltips on dimension names (5.2)
 * - "Come funziona la valutazione" accordion (5.8)
 */

import { useState } from 'react';
import * as m from 'motion/react-m';
import {
  BarChart3,
  ArrowLeft,
  TrendingDown,
  TrendingUp,
  HelpCircle,
  Dumbbell,
  ChevronDown,
  ChevronUp,
  Info,
} from 'lucide-react';
import { RadarChart } from './RadarChart';
import type { BehaviorScores, ReflectionAnswer, TrainingDimension } from '@/types/training';
import {
  getDimensionInterpretation,
  getGlobalRiskDescription,
  DIMENSION_TOOLTIPS,
} from '@/data/score-interpretations';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface SessionReportProps {
  readonly scores: BehaviorScores | null;
  readonly reflections: readonly ReflectionAnswer[];
  /** Average scores from user profile for comparison (null = first session) */
  readonly previousAverageScores?: Record<TrainingDimension, number> | null;
  readonly onFinish: () => void;
  readonly onBack: () => void;
  /** Called when user wants to continue chatting after seeing results. */
  readonly onContinueChat?: (() => void) | undefined;
  /** Called when user clicks "Allenati su questo" on a weak dimension. */
  readonly onTrainOnDimension?: ((dim: TrainingDimension) => void) | undefined;
}

// ---------------------------------------------------------------------------
// ScoreBar
// ---------------------------------------------------------------------------

interface ScoreBarProps {
  readonly label: string;
  readonly value: number;
  /** true = lower raw value is better (activation, impulsivity) */
  readonly inverted?: boolean;
  readonly delay: number;
  readonly previousAvg?: number | undefined;
  /** Short tooltip text for HelpCircle icon */
  readonly description?: string | undefined;
  /** Dimension key — enables interpretation text and "Allenati" button */
  readonly dimension?: TrainingDimension | undefined;
  readonly onTrainOnDimension?: ((dim: TrainingDimension) => void) | undefined;
}

function ScoreBar({
  label,
  value,
  inverted = false,
  delay,
  previousAvg,
  description,
  dimension,
  onTrainOnDimension,
}: ScoreBarProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  // Normalize: displayValue is always higher = better
  const displayValue = inverted ? 100 - value : value;
  const color =
    displayValue >= 70
      ? 'bg-emerald-500'
      : displayValue >= 40
        ? 'bg-amber-500'
        : 'bg-red-500';

  // Delta vs average: positive = improved
  const delta =
    previousAvg != null
      ? inverted
        ? previousAvg - value   // inverted: lower is better → lower value = improved
        : value - previousAvg   // normal: higher is better → higher value = improved
      : null;

  // Interpretation from data file (task 5.3)
  const interpretation =
    dimension != null
      ? getDimensionInterpretation(dimension, value, inverted)
      : null;

  // "Allenati su questo" appears only in red zone (task 5.5)
  const showTrainButton =
    displayValue < 40 && dimension != null && onTrainOnDimension != null;

  return (
    <div className="space-y-1.5">
      {/* Label row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="text-base text-slate-300">{label}</span>

          {/* HelpCircle tooltip (task 5.2) */}
          {description != null && (
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowTooltip((v) => !v)}
                onBlur={() => setShowTooltip(false)}
                className="flex items-center justify-center text-slate-500 transition-colors hover:text-slate-300"
                aria-label={`Definizione di ${label}`}
                aria-expanded={showTooltip}
              >
                <HelpCircle className="size-3.5" aria-hidden="true" />
              </button>
              {showTooltip && (
                <div
                  className="absolute bottom-full left-0 z-20 mb-2 w-56 rounded-xl
                             border border-slate-600/50 bg-slate-800 px-3 py-2
                             text-[11px] leading-relaxed text-slate-300 shadow-xl"
                  role="tooltip"
                >
                  {description}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-base font-bold text-slate-200">{value}/100</span>
          {delta !== null && delta !== 0 && (
            <span
              className={`flex items-center gap-0.5 text-sm font-medium ${
                delta > 0 ? 'text-emerald-400' : 'text-red-400'
              }`}
            >
              {delta > 0 ? (
                <TrendingUp className="size-3" aria-hidden="true" />
              ) : (
                <TrendingDown className="size-3" aria-hidden="true" />
              )}
              {delta > 0 ? '+' : ''}
              {delta}
            </span>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-3 overflow-hidden rounded-full bg-slate-800">
        <m.div
          className={`h-full rounded-full ${color}`}
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ type: 'spring', stiffness: 100, damping: 20, delay }}
        />
      </div>

      <p className="text-sm text-slate-500">
        {inverted ? '(piu basso = meglio)' : '(piu alto = meglio)'}
      </p>

      {/* Interpretation text (task 5.3) */}
      {interpretation != null && (
        <div className="rounded-lg bg-slate-800/40 px-3 py-2">
          <p className="mb-0.5 text-[11px] font-medium text-slate-400">
            {interpretation.label}
          </p>
          <p className="text-[11px] leading-relaxed text-slate-500">
            {interpretation.text}
          </p>
        </div>
      )}

      {/* "Allenati su questo" button — only in red zone (task 5.5) */}
      {showTrainButton && (
        <button
          type="button"
          onClick={() => onTrainOnDimension?.(dimension!)}
          className="flex w-full items-center justify-center gap-1.5 rounded-lg
                     border border-amber-500/30 bg-amber-500/10 py-2
                     text-[11px] font-medium text-amber-300 transition-colors
                     hover:bg-amber-500/20 hover:text-amber-200"
        >
          <Dumbbell className="size-3" aria-hidden="true" />
          Allenati su questo
        </button>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// EvalInfoAccordion — "Come funziona la valutazione" (task 5.8)
// ---------------------------------------------------------------------------

function EvalInfoAccordion() {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-2xl border border-slate-700/30 bg-slate-800/20">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-4 py-3
                   text-sm font-medium text-slate-400 transition-colors
                   hover:text-slate-300"
        aria-expanded={open}
      >
        <div className="flex items-center gap-2">
          <Info className="size-4 text-cyan-400/60" aria-hidden="true" />
          <span>Come funziona la valutazione</span>
        </div>
        {open ? (
          <ChevronUp className="size-4 shrink-0" aria-hidden="true" />
        ) : (
          <ChevronDown className="size-4 shrink-0" aria-hidden="true" />
        )}
      </button>

      {open && (
        <div className="space-y-3 border-t border-slate-700/30 px-4 pb-4 pt-3 text-[11px] leading-relaxed text-slate-500">
          <div>
            <p className="mb-1 font-medium text-slate-400">Le 4 dimensioni comportamentali</p>
            <p>
              Ogni sessione analizza 4 aspetti del tuo comportamento. Attivazione emotiva e
              impulsività sono assi di vulnerabilità (punteggi bassi = meglio). Verifica e
              consapevolezza sono assi protettivi (punteggi alti = meglio).
            </p>
          </div>
          <div>
            <p className="mb-1 font-medium text-slate-400">Il punteggio di rischio</p>
            <p>
              È una media ponderata delle 4 dimensioni: attivazione (35%) + impulsività (30%) +
              mancata verifica (20%) + mancata consapevolezza (15%). Un punteggio basso indica
              un profilo difensivo solido.
            </p>
          </div>
          <div>
            <p className="mb-1 font-medium text-slate-400">L&apos;interruzione della sessione</p>
            <p>
              La sessione si interrompe quando il punteggio di rischio supera la soglia, oppure
              al raggiungimento del numero massimo di turni. È un momento pedagogico: ti ferma
              prima che tu faccia qualcosa di irreversibile, per analizzare la situazione a mente fredda.
            </p>
          </div>
          <div>
            <p className="mb-1 font-medium text-slate-400">Il profilo nel tempo</p>
            <p>
              Le sessioni successive costruiscono un profilo comportamentale che alimenta il
              raccomandatore di leve. Più sessioni completi, più precisa diventa la mappa delle
              tue vulnerabilità e dei tuoi punti di forza.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function SessionReport({
  scores,
  reflections,
  previousAverageScores,
  onFinish,
  onBack,
  onContinueChat,
  onTrainOnDimension,
}: SessionReportProps) {
  // Build a BehaviorScores object from previousAverageScores for RadarChart
  const prevScoresForRadar: BehaviorScores | null = previousAverageScores
    ? {
        activation: previousAverageScores.activation,
        impulsivity: previousAverageScores.impulsivity,
        verification: previousAverageScores.verification,
        awareness: previousAverageScores.awareness,
        riskScore: 0, // not used in radar
      }
    : null;

  // Global risk description (task 5.4)
  const globalDesc =
    scores != null ? getGlobalRiskDescription(scores.riskScore) : null;

  return (
    <div className="flex flex-1 flex-col overflow-y-auto">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-slate-700/50 bg-slate-900/80 px-4 py-3">
        <button
          type="button"
          onClick={onBack}
          className="flex size-9 items-center justify-center rounded-full
                     text-slate-400 transition-colors hover:bg-slate-800 hover:text-slate-200"
          aria-label="Torna indietro"
        >
          <ArrowLeft className="size-5" aria-hidden="true" />
        </button>
        <div className="flex items-center gap-2">
          <BarChart3 className="size-4 text-cyan-400" aria-hidden="true" />
          <span className="text-base font-semibold text-slate-200">Risultato sessione</span>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-6 px-4 py-6">
        {/* Risk score summary */}
        {scores && (
          <m.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-slate-700/50 bg-slate-800/40 p-6 text-center"
          >
            <p className="mb-2 text-base text-slate-400">Punteggio di rischio</p>
            <p
              className={`text-5xl font-bold ${
                scores.riskScore >= 65
                  ? 'text-red-400'
                  : scores.riskScore >= 40
                    ? 'text-amber-400'
                    : 'text-emerald-400'
              }`}
            >
              {scores.riskScore}
            </p>
            <p className="mt-1 text-base text-slate-500">su 100</p>
          </m.div>
        )}

        {/* Radar chart — task 5.1: centered + bigger */}
        {scores && (
          <m.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="rounded-2xl border border-slate-700/50 bg-slate-800/40 p-4"
          >
            <h3 className="mb-3 text-center text-base font-semibold text-slate-300">
              Profilo comportamentale
            </h3>
            {/* flex justify-center to center the fixed-size SVG */}
            <div className="flex justify-center">
              <RadarChart scores={scores} previousScores={prevScoresForRadar} size={280} />
            </div>
            {previousAverageScores && (
              <div className="mt-2 flex items-center justify-center gap-4 text-[10px] text-slate-500">
                <span className="flex items-center gap-1">
                  <span className="inline-block size-2 rounded-full bg-cyan-400/60" />
                  Questa sessione
                </span>
                <span className="flex items-center gap-1">
                  <span className="inline-block size-2 rounded-full bg-amber-400/40" />
                  La tua media
                </span>
              </div>
            )}
          </m.div>
        )}

        {/* Global risk description — task 5.4 */}
        {scores && globalDesc && (
          <m.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className={`rounded-2xl border px-4 py-4 ${
              scores.riskScore >= 65
                ? 'border-red-500/20 bg-red-950/20'
                : scores.riskScore >= 40
                  ? 'border-amber-500/20 bg-amber-950/20'
                  : 'border-emerald-500/20 bg-emerald-950/20'
            }`}
          >
            <p
              className={`mb-1.5 text-sm font-semibold ${
                scores.riskScore >= 65
                  ? 'text-red-300'
                  : scores.riskScore >= 40
                    ? 'text-amber-300'
                    : 'text-emerald-300'
              }`}
            >
              {globalDesc.title}
            </p>
            <p className="text-sm leading-relaxed text-slate-400">{globalDesc.text}</p>
          </m.div>
        )}

        {/* Dimension bars — tasks 5.2, 5.3, 5.5 */}
        {scores && (
          <div className="space-y-5">
            <h3 className="text-base font-semibold text-slate-300">Dettaglio per dimensione</h3>
            <ScoreBar
              label="Attivazione emotiva"
              value={scores.activation}
              inverted
              delay={0.1}
              previousAvg={previousAverageScores?.activation}
              description={DIMENSION_TOOLTIPS.activation}
              dimension="activation"
              onTrainOnDimension={onTrainOnDimension}
            />
            <ScoreBar
              label="Impulsivita"
              value={scores.impulsivity}
              inverted
              delay={0.2}
              previousAvg={previousAverageScores?.impulsivity}
              description={DIMENSION_TOOLTIPS.impulsivity}
              dimension="impulsivity"
              onTrainOnDimension={onTrainOnDimension}
            />
            <ScoreBar
              label="Verifica"
              value={scores.verification}
              delay={0.3}
              previousAvg={previousAverageScores?.verification}
              description={DIMENSION_TOOLTIPS.verification}
              dimension="verification"
              onTrainOnDimension={onTrainOnDimension}
            />
            <ScoreBar
              label="Consapevolezza"
              value={scores.awareness}
              delay={0.4}
              previousAvg={previousAverageScores?.awareness}
              description={DIMENSION_TOOLTIPS.awareness}
              dimension="awareness"
              onTrainOnDimension={onTrainOnDimension}
            />
          </div>
        )}

        {/* Reflection insights */}
        {reflections.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-base font-semibold text-slate-300">Le tue riflessioni</h3>
            {reflections.map((r) => (
              <div
                key={r.step}
                className="rounded-xl border border-slate-700/30 bg-slate-800/30 p-3"
              >
                <p className="mb-1 text-sm font-medium text-cyan-400">{r.question}</p>
                <p className="text-base italic text-slate-400">"{r.userAnswer}"</p>
                <p className="mt-2 text-base leading-relaxed text-slate-300">{r.aiAnalysis}</p>
              </div>
            ))}
          </div>
        )}

        {/* "Come funziona la valutazione" accordion — task 5.8 */}
        <EvalInfoAccordion />

        {/* Action buttons */}
        <div className="mt-auto pt-4">
          <button type="button" onClick={onFinish} className="btn-primary w-full">
            Torna alle simulazioni
          </button>
          {onContinueChat && (
            <div className="mt-3 text-center">
              <p className="mb-2 text-sm text-slate-500">
                Vuoi approfondire? Puoi continuare la conversazione con il truffatore.
              </p>
              <button
                type="button"
                onClick={onContinueChat}
                className="w-full rounded-2xl border border-slate-700/50 bg-slate-800/40 py-3
                           text-base font-medium text-slate-300 transition-colors
                           hover:bg-slate-700/50 hover:text-slate-100"
              >
                Continua la chat
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
