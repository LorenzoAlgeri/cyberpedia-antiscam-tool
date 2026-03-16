/**
 * TodoProgressBar — visual progress indicator for the todo checklist.
 * Shows a labelled fraction ("X/N completati") and an animated fill bar.
 */

import * as m from 'motion/react-m';

export interface TodoProgressBarProps {
  completed: number;
  total: number;
  label: string;
}

export function TodoProgressBar({
  completed,
  total,
  label,
}: TodoProgressBarProps) {
  const pct = total > 0 ? (completed / total) * 100 : 0;

  return (
    <div className="mb-4">
      <div className="mb-1 flex items-center justify-between text-sm">
        <span className="font-medium text-foreground">{label}</span>
        <span className="text-muted-foreground">
          {completed}/{total} completati
        </span>
      </div>
      <div
        className="h-2 overflow-hidden rounded-full bg-white/10"
        role="progressbar"
        aria-valuenow={completed}
        aria-valuemin={0}
        aria-valuemax={total}
        aria-label={`${label}: ${completed} di ${total} completati`}
      >
        <m.div
          className="h-full rounded-full bg-gradient-to-r from-cyan-brand to-cyan-brand-light"
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        />
      </div>
    </div>
  );
}
