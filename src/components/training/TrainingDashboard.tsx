/**
 * TrainingDashboard — progress stats for returning users.
 *
 * Rendered inside SimulationsPage when profile.sessionsCompleted > 0.
 * Shows session count, average risk, streak, sparkline, strengths/weaknesses,
 * and recurring behavioral patterns.
 */

import * as m from 'motion/react-m';
import {
  Target,
  ShieldCheck,
  Flame,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  HelpCircle,
} from 'lucide-react';
import type { UserProfile, TrainingDimension } from '@/types/training';

interface TrainingDashboardProps {
  readonly profile: UserProfile;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const DIMENSION_LABELS: Record<TrainingDimension, string> = {
  activation: 'Attivazione',
  impulsivity: 'Impulsivita',
  verification: 'Verifica',
  awareness: 'Consapevolezza',
};

/** For activation/impulsivity lower is better; for verification/awareness higher is better. */
const INVERTED_DIMENSIONS: ReadonlySet<TrainingDimension> = new Set<TrainingDimension>([
  'activation',
  'impulsivity',
]);

function computeAverageRisk(profile: UserProfile): number {
  const history = profile.sessionHistory;
  if (history.length === 0) return 0;
  const last5 = history.slice(0, 5); // newest-first, take first 5
  const sum = last5.reduce((acc, s) => acc + s.finalRiskScore, 0);
  return Math.round(sum / last5.length);
}

function riskColor(risk: number): string {
  if (risk < 40) return 'text-emerald-400';
  if (risk <= 65) return 'text-amber-400';
  return 'text-red-400';
}

function riskBorderColor(risk: number): string {
  if (risk < 40) return 'border-emerald-500/30';
  if (risk <= 65) return 'border-amber-500/30';
  return 'border-red-500/30';
}

/**
 * Compute streak of consecutive days with at least one session,
 * counted backwards from today.
 */
function computeStreak(profile: UserProfile): number {
  if (profile.sessionHistory.length === 0) return 0;

  // Build a set of unique date strings (YYYY-MM-DD)
  const dateDays = new Set(
    profile.sessionHistory.map((s) => s.date.slice(0, 10)),
  );

  let streak = 0;
  const day = new Date();
  // Normalize to start of day in local timezone
  day.setHours(0, 0, 0, 0);

  for (;;) {
    const key = day.toISOString().slice(0, 10);
    if (!dateDays.has(key)) break;
    streak++;
    day.setDate(day.getDate() - 1);
  }
  return streak;
}

/**
 * Find the strongest dimension based on average scores.
 * For activation/impulsivity: lowest score = strongest.
 * For verification/awareness: highest score = strongest.
 */
function findStrongestDimension(
  averageScores: Record<TrainingDimension, number>,
): { dimension: TrainingDimension; score: number } {
  const dimensions = Object.keys(averageScores) as TrainingDimension[];
  let best: TrainingDimension = dimensions[0] ?? 'awareness';
  let bestNormalized = -Infinity;

  for (const dim of dimensions) {
    const raw = averageScores[dim] ?? 0;
    // Normalize so that higher = better for comparison
    const normalized = INVERTED_DIMENSIONS.has(dim) ? 100 - raw : raw;
    if (normalized > bestNormalized) {
      bestNormalized = normalized;
      best = dim;
    }
  }

  return { dimension: best, score: averageScores[best] ?? 0 };
}

// ---------------------------------------------------------------------------
// Sparkline sub-component
// ---------------------------------------------------------------------------

function Sparkline({ profile }: { readonly profile: UserProfile }) {
  if (profile.sessionHistory.length < 2) return null;

  // sessionHistory is newest-first; reverse to chronological, take last 10
  const chronological = [...profile.sessionHistory].reverse().slice(-10);
  const scores = chronological.map((s) => s.finalRiskScore);
  const count = scores.length;

  const width = 200;
  const height = 60;
  const padding = 10;
  const plotW = width - padding * 2;
  const plotH = height - padding * 2;

  const maxVal = Math.max(...scores, 1);
  const minVal = Math.min(...scores, 0);
  const range = Math.max(maxVal - minVal, 1);

  const points = scores.map((v, i) => {
    const x = padding + (count > 1 ? (i / (count - 1)) * plotW : plotW / 2);
    const y = padding + plotH - ((v - minVal) / range) * plotH;
    return { x, y };
  });

  const polylinePoints = points.map((p) => `${p.x},${p.y}`).join(' ');

  return (
    <m.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="rounded-xl border border-slate-700/30 bg-slate-800/30 p-3"
    >
      <p className="mb-2 text-sm font-medium text-slate-400">
        Andamento rischio (ultime {count} sessioni)
      </p>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full"
        style={{ maxHeight: '50px' }}
        aria-label="Sparkline del rischio nelle ultime sessioni"
      >
        <polyline
          points={polylinePoints}
          fill="none"
          stroke="#22d3ee"
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {points.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r={3}
            fill="#22d3ee"
            stroke="#0f172a"
            strokeWidth="1"
          />
        ))}
      </svg>
      <div className="mt-1 flex justify-between text-[10px] text-slate-500">
        <span>Prima</span>
        <span>Ultima</span>
      </div>
    </m.div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function TrainingDashboard({ profile }: TrainingDashboardProps) {
  const avgRisk = computeAverageRisk(profile);
  const streak = computeStreak(profile);
  const strongest = findStrongestDimension(profile.averageScores);

  // Top 3 patterns sorted by frequency descending
  const topPatterns = [...profile.patterns]
    .sort((a, b) => b.frequency - a.frequency)
    .slice(0, 3);

  return (
    <m.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-3"
    >
      {/* Section 1: Stats row */}
      <div className="grid grid-cols-3 gap-2">
        <m.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="rounded-xl border border-slate-700/30 bg-slate-800/30 p-3 text-center"
        >
          <Target className="mx-auto mb-1 h-4 w-4 text-cyan-400" />
          <p className="text-lg font-bold text-slate-100">
            {profile.sessionsCompleted}
          </p>
          <p className="text-xs text-slate-400">Sessioni</p>
        </m.div>

        <m.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className={`rounded-xl border bg-slate-800/30 p-3 text-center ${riskBorderColor(avgRisk)}`}
        >
          <ShieldCheck className={`mx-auto mb-1 h-4 w-4 ${riskColor(avgRisk)}`} />
          <p className={`text-lg font-bold ${riskColor(avgRisk)}`}>
            {avgRisk}
          </p>
          <p className="text-xs text-slate-400">Rischio medio</p>
        </m.div>

        <m.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="rounded-xl border border-slate-700/30 bg-slate-800/30 p-3 text-center"
        >
          <Flame className="mx-auto mb-1 h-4 w-4 text-orange-400" />
          <p className="text-lg font-bold text-slate-100">
            {streak > 0 ? streak : '—'}
            {streak >= 3 ? ' \ud83d\udd25' : ''}
          </p>
          <div className="flex items-center justify-center gap-0.5">
            <p className="text-xs text-slate-400">Streak</p>
            <button
              type="button"
              title="Giorni consecutivi con almeno una sessione completata. Mantieni l'allenamento quotidiano per costruire resistenza duratura."
              className="text-slate-600 hover:text-slate-400 transition-colors"
              aria-label="Cos'è lo streak"
            >
              <HelpCircle className="size-3" aria-hidden="true" />
            </button>
          </div>
          {streak === 0 && (
            <p className="mt-0.5 text-[9px] leading-tight text-slate-500">Inizia oggi</p>
          )}
        </m.div>
      </div>

      {/* Section 2: Sparkline */}
      <Sparkline profile={profile} />

      {/* Section 3: Strongest / Weakest dimension */}
      <m.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="grid grid-cols-2 gap-2"
      >
        {/* Strongest */}
        <div className="flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-slate-800/30 p-3">
          <TrendingUp className="h-4 w-4 shrink-0 text-emerald-400" />
          <div className="min-w-0">
            <p className="text-xs text-slate-400">Punto forte</p>
            <p className="truncate text-sm font-semibold text-emerald-300">
              {DIMENSION_LABELS[strongest.dimension]}
            </p>
            <p className="text-[10px] text-slate-500 leading-tight">La dimensione in cui sei più resistente</p>
          </div>
        </div>

        {/* Weakest */}
        <div className="flex items-center gap-2 rounded-xl border border-amber-500/20 bg-slate-800/30 p-3">
          {profile.weakestDimension != null ? (
            <>
              <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400" />
              <div className="min-w-0">
                <p className="text-xs text-slate-400">Punto debole</p>
                <p className="truncate text-sm font-semibold text-amber-300">
                  {DIMENSION_LABELS[profile.weakestDimension]}
                </p>
                <p className="text-[10px] text-slate-500 leading-tight">Dove concentrare l'allenamento</p>
              </div>
            </>
          ) : (
            <>
              <TrendingDown className="h-4 w-4 shrink-0 text-slate-500" />
              <div className="min-w-0">
                <p className="text-xs text-slate-400">Punto debole</p>
                <p className="text-base text-slate-500">N/D</p>
              </div>
            </>
          )}
        </div>
      </m.div>

      {/* Section 4: Recurring patterns */}
      {topPatterns.length > 0 && (
        <m.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="rounded-xl border border-slate-700/30 bg-slate-800/30 p-3"
        >
          <p className="mb-2 text-sm font-medium text-slate-400">
            Pattern frequenti
          </p>
          <ul className="space-y-1.5">
            {topPatterns.map((p) => (
              <li
                key={p.patternId}
                className="flex items-start justify-between gap-2 text-sm"
              >
                <span className="text-slate-300">{p.description}</span>
                <span className="shrink-0 rounded-full bg-slate-700/50 px-2 py-0.5 text-[10px] text-slate-400">
                  {p.frequency}x
                </span>
              </li>
            ))}
          </ul>
        </m.div>
      )}
    </m.div>
  );
}
