/**
 * SessionReport — final score display after training session.
 *
 * Shows 4 behavioral dimensions as horizontal bars:
 * - Activation (lower = better)
 * - Impulsivity (lower = better)
 * - Verification (higher = better)
 * - Awareness (higher = better)
 *
 * Plus a summary and "back to simulations" button.
 */

import * as m from 'motion/react-m';
import { BarChart3, ArrowLeft, TrendingDown, TrendingUp } from 'lucide-react';
import { RadarChart } from './RadarChart';
import type { BehaviorScores, ReflectionAnswer, TrainingDimension } from '@/types/training';

interface SessionReportProps {
  readonly scores: BehaviorScores | null;
  readonly reflections: readonly ReflectionAnswer[];
  /** Average scores from user profile for comparison (null = first session) */
  readonly previousAverageScores?: Record<TrainingDimension, number> | null;
  readonly onFinish: () => void;
  readonly onBack: () => void;
}

interface ScoreBarProps {
  readonly label: string;
  readonly value: number;
  readonly inverted?: boolean; // true = lower is better
  readonly delay: number;
  /** Previous average for this dimension (for comparison) */
  readonly previousAvg?: number | undefined;
}

function ScoreBar({ label, value, inverted = false, delay, previousAvg }: ScoreBarProps) {
  // For inverted axes, visual "goodness" is 100 - value
  const displayValue = inverted ? 100 - value : value;
  const color = displayValue >= 70
    ? 'bg-emerald-500'
    : displayValue >= 40
      ? 'bg-amber-500'
      : 'bg-red-500';

  // Delta vs average: positive = improved
  const delta = previousAvg != null
    ? inverted
      ? previousAvg - value   // for inverted, lower is better → positive delta = improved
      : value - previousAvg   // for normal, higher is better → positive delta = improved
    : null;

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-sm text-slate-300">{label}</span>
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-slate-200">{value}/100</span>
          {delta !== null && delta !== 0 && (
            <span className={`flex items-center gap-0.5 text-xs font-medium ${
              delta > 0 ? 'text-emerald-400' : 'text-red-400'
            }`}>
              {delta > 0 ? (
                <TrendingUp className="size-3" aria-hidden="true" />
              ) : (
                <TrendingDown className="size-3" aria-hidden="true" />
              )}
              {delta > 0 ? '+' : ''}{delta}
            </span>
          )}
        </div>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-slate-800">
        <m.div
          className={`h-full rounded-full ${color}`}
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ type: 'spring', stiffness: 100, damping: 20, delay }}
        />
      </div>
      <p className="text-xs text-slate-500">
        {inverted ? '(piu basso = meglio)' : '(piu alto = meglio)'}
      </p>
    </div>
  );
}

export function SessionReport({
  scores,
  reflections,
  previousAverageScores,
  onFinish,
  onBack,
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
          <span className="text-sm font-semibold text-slate-200">Risultato sessione</span>
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
            <p className="mb-2 text-sm text-slate-400">Punteggio di rischio</p>
            <p className={`text-5xl font-bold ${
              scores.riskScore >= 65
                ? 'text-red-400'
                : scores.riskScore >= 40
                  ? 'text-amber-400'
                  : 'text-emerald-400'
            }`}>
              {scores.riskScore}
            </p>
            <p className="mt-1 text-sm text-slate-500">su 100</p>
          </m.div>
        )}

        {/* Radar chart */}
        {scores && (
          <m.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="rounded-2xl border border-slate-700/50 bg-slate-800/40 p-4"
          >
            <h3 className="mb-2 text-center text-sm font-semibold text-slate-300">Profilo comportamentale</h3>
            <RadarChart scores={scores} previousScores={prevScoresForRadar} size={220} />
            {previousAverageScores && (
              <div className="mt-2 flex items-center justify-center gap-4 text-[10px] text-slate-500">
                <span className="flex items-center gap-1">
                  <span className="inline-block size-2 rounded-full bg-cyan-400/60" /> Questa sessione
                </span>
                <span className="flex items-center gap-1">
                  <span className="inline-block size-2 rounded-full bg-amber-400/40" /> La tua media
                </span>
              </div>
            )}
          </m.div>
        )}

        {/* Dimension bars */}
        {scores && (
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-300">Dettaglio per dimensione</h3>
            <ScoreBar label="Attivazione emotiva" value={scores.activation} inverted delay={0.1} previousAvg={previousAverageScores?.activation} />
            <ScoreBar label="Impulsivita" value={scores.impulsivity} inverted delay={0.2} previousAvg={previousAverageScores?.impulsivity} />
            <ScoreBar label="Verifica" value={scores.verification} delay={0.3} previousAvg={previousAverageScores?.verification} />
            <ScoreBar label="Consapevolezza" value={scores.awareness} delay={0.4} previousAvg={previousAverageScores?.awareness} />
          </div>
        )}

        {/* Reflection insights */}
        {reflections.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-slate-300">Le tue riflessioni</h3>
            {reflections.map((r) => (
              <div
                key={r.step}
                className="rounded-xl border border-slate-700/30 bg-slate-800/30 p-3"
              >
                <p className="mb-1 text-xs font-medium text-cyan-400">{r.question}</p>
                <p className="text-sm italic text-slate-400">"{r.userAnswer}"</p>
                <p className="mt-2 text-sm leading-relaxed text-slate-300">{r.aiAnalysis}</p>
              </div>
            ))}
          </div>
        )}

        {/* Action button */}
        <div className="mt-auto pt-4">
          <button
            type="button"
            onClick={onFinish}
            className="btn-primary w-full"
          >
            Torna alle simulazioni
          </button>
        </div>
      </div>
    </div>
  );
}
