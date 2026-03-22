/**
 * RiskIndicator — visual risk score bar for training sessions.
 *
 * Shows the current risk level (0-100) with a color gradient:
 * - 0-40: green (safe)
 * - 40-65: yellow (caution)
 * - 65-100: red (high risk / approaching interruption)
 *
 * Updates with Framer Motion spring animation.
 */

import * as m from 'motion/react-m';
import type { BehaviorScores } from '@/types/training';

interface RiskIndicatorProps {
  readonly scores: BehaviorScores | null;
}

function getRiskColor(score: number): string {
  if (score < 40) return 'bg-emerald-500';
  if (score < 65) return 'bg-amber-500';
  return 'bg-red-500';
}

function getRiskLabel(score: number): string {
  if (score < 40) return 'Basso';
  if (score < 65) return 'Medio';
  return 'Alto';
}

export function RiskIndicator({ scores }: RiskIndicatorProps) {
  if (!scores) return null;

  const { riskScore } = scores;
  const color = getRiskColor(riskScore);
  const label = getRiskLabel(riskScore);

  return (
    <div
      className="sticky top-0 z-10 flex items-center gap-3 border-b border-slate-700/30 bg-slate-900/90 px-4 py-2 backdrop-blur-sm"
      role="meter"
      aria-label={`Livello di rischio: ${riskScore} su 100`}
      aria-valuenow={riskScore}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <span className="text-xs font-medium text-slate-400">Rischio</span>
      <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-slate-800">
        <m.div
          className={`absolute inset-y-0 left-0 rounded-full ${color}`}
          initial={{ width: 0 }}
          animate={{ width: `${riskScore}%` }}
          transition={{ type: 'spring', stiffness: 200, damping: 30 }}
        />
      </div>
      <span className={`min-w-[3.5rem] text-right text-xs font-bold ${
        riskScore >= 65 ? 'text-red-400' : riskScore >= 40 ? 'text-amber-400' : 'text-emerald-400'
      }`}>
        {label} ({riskScore})
      </span>
    </div>
  );
}
