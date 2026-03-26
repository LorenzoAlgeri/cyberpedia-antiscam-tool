/**
 * SuggestedResponses — animated chip buttons for reflection answers.
 *
 * Displays 3 AI-generated suggested responses above the chat input.
 * Tapping a chip fills the input (via callback) so the user can
 * edit before sending, or just tap send.
 *
 * Shows skeleton loading state while suggestions are being fetched.
 */

import * as m from 'motion/react-m';
import { AnimatePresence } from 'motion/react';
import { Sparkles } from 'lucide-react';

interface SuggestedResponsesProps {
  readonly suggestions: readonly string[];
  readonly isLoading: boolean;
  readonly disabled: boolean;
  readonly onSelect: (text: string) => void;
}

function SkeletonChip({ width }: { width: string }) {
  return (
    <div
      className="h-10 animate-pulse rounded-full bg-slate-700/50"
      style={{ width }}
    />
  );
}

export function SuggestedResponses({
  suggestions,
  isLoading,
  disabled,
  onSelect,
}: SuggestedResponsesProps) {
  if (!isLoading && suggestions.length === 0) return null;

  return (
    <div className="border-t border-slate-700/30 px-3 pb-1 pt-2">
      {/* Label */}
      <div className="mb-2 flex items-center gap-1.5">
        <Sparkles className="size-3.5 text-cyan-400/70" aria-hidden="true" />
        <span className="text-xs font-medium text-slate-500">
          {isLoading ? 'Sto pensando...' : 'Risposte suggerite'}
        </span>
      </div>

      {/* Chips */}
      <div className="flex flex-wrap gap-2">
        <AnimatePresence mode="wait">
          {isLoading ? (
            <m.div
              key="skeleton"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-wrap gap-2"
            >
              <SkeletonChip width="140px" />
              <SkeletonChip width="180px" />
              <SkeletonChip width="160px" />
            </m.div>
          ) : (
            suggestions.map((text, i) => (
              <m.button
                key={`${text}-${i}`}
                type="button"
                initial={{ opacity: 0, y: 8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.2, delay: i * 0.08 }}
                onClick={() => onSelect(text)}
                disabled={disabled}
                className="rounded-full border border-cyan-500/20 bg-cyan-500/10
                           px-4 py-2 text-left text-sm leading-snug text-cyan-300
                           transition-colors
                           hover:border-cyan-400/40 hover:bg-cyan-500/20
                           active:scale-[0.97]
                           disabled:opacity-40 disabled:active:scale-100"
              >
                {text}
              </m.button>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
