/**
 * FeedbackTrigger — side-tab button anchored to the right edge of the screen.
 *
 * Mobile: compact vertical tab at mid-right with short text.
 * Desktop: wider horizontal tab with full CTA text.
 * Left side rounded, right side flush with screen edge.
 */

import * as m from 'motion/react-m';

interface FeedbackTriggerProps {
  readonly onClick: () => void;
}

export function FeedbackTrigger({ onClick }: FeedbackTriggerProps) {
  return (
    <m.button
      type="button"
      onClick={onClick}
      whileHover={{ x: -4 }}
      whileTap={{ scale: 0.97 }}
      className="fixed right-0 z-30 flex items-center gap-2
                 rounded-l-2xl bg-gradient-to-r from-cyan-500 to-cyan-400
                 shadow-lg shadow-cyan-500/25 text-white font-semibold
                 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2
                 focus-visible:outline-cyan-brand
                 top-1/2 -translate-y-1/2 px-3 py-4 text-sm
                 sm:top-auto sm:translate-y-0 sm:bottom-8 sm:px-5 sm:py-3.5 sm:text-base"
      style={{ minHeight: 44, writingMode: undefined }}
      aria-label="Segnala un problema o inviaci un feedback"
    >
      {/* Mobile: vertical text */}
      <span className="[writing-mode:vertical-lr] rotate-180 tracking-wide sm:hidden">
        Segnala
      </span>
      {/* Desktop: horizontal text */}
      <span className="hidden sm:inline">
        Segnalaci qualcosa
      </span>
    </m.button>
  );
}
