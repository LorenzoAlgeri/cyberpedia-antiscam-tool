/**
 * ChatSimulator — WhatsApp-style interactive chat simulation container.
 *
 * Combines ChatBubble, ChatTyping, ChatChoices with the
 * useChatSimulator engine. Auto-scrolls on new messages.
 */

import { useEffect, useRef } from 'react';
import * as m from 'motion/react-m';
import { AnimatePresence } from 'motion/react';
import { ArrowLeft, CircleCheck, MessageCircle } from 'lucide-react';
import { useChatSimulator } from '@/hooks/useChatSimulator';
import { ChatBubble } from '@/components/chat/ChatBubble';
import { ChatTyping } from '@/components/chat/ChatTyping';
import { ChatChoices } from '@/components/chat/ChatChoices';
import type { Simulation } from '@/types/simulation';

interface ChatSimulatorProps {
  simulation: Simulation;
  onBack: () => void;
  /** True on the very first simulation — only correct options are shown */
  isFirstSimulation?: boolean;
  /** Called once when the simulation reaches the 'complete' phase */
  onComplete?: () => void;
}

export function ChatSimulator({ simulation, onBack, isFirstSimulation = false, onComplete }: ChatSimulatorProps) {
  const { phase, entries, currentChoices, score, start, selectChoice, reset } =
    useChatSimulator(simulation, isFirstSimulation);

  const scrollRef = useRef<HTMLDivElement | undefined>(undefined);

  // Auto-start simulation on mount
  useEffect(() => {
    start();
    return () => reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [simulation.id]);

  // Auto-scroll to bottom on new entries or phase change
  useEffect(() => {
    const el = scrollRef.current;
    if (el) {
      requestAnimationFrame(() => {
        el.scrollTop = el.scrollHeight;
      });
    }
  }, [entries.length, phase]);

  // Notify parent when simulation completes
  useEffect(() => {
    if (phase === 'complete') onComplete?.();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  return (
    <div className="mx-auto flex h-full w-full max-w-2xl flex-col">
      {/* Header bar */}
      <div className="flex items-center gap-3 border-b border-slate-700/50 px-4 py-3">
        <button
          onClick={onBack}
          className="flex size-10 shrink-0 cursor-pointer items-center justify-center
                     rounded-full transition-colors hover:bg-slate-800"
          aria-label="Torna alle simulazioni"
          type="button"
        >
          <ArrowLeft className="size-5 text-slate-300" />
        </button>

        <div className="flex items-center gap-2.5 overflow-hidden">
          <div
            className="flex size-9 shrink-0 items-center justify-center
                        rounded-full bg-slate-700/60"
          >
            <MessageCircle className="size-4 text-cyan-400" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-100">
              {simulation.scammerName}
            </p>
            <AnimatePresence mode="wait">
              {phase === 'typing' && (
                <m.p
                  key="typing-label"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-sm text-cyan-400"
                >
                  sta scrivendo...
                </m.p>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Chat thread */}
      <div
        ref={scrollRef as React.RefObject<HTMLDivElement>}
        className="flex flex-1 flex-col gap-3 overflow-y-auto px-4 py-4"
        aria-live="polite"
        aria-relevant="additions"
      >
        {entries.map((entry) => (
          <ChatBubble key={entry.id} entry={entry} />
        ))}

        <AnimatePresence>
          {phase === 'typing' && <ChatTyping />}
        </AnimatePresence>

        {phase === 'choice' && currentChoices.length > 0 && (
          <ChatChoices options={currentChoices} onSelect={selectChoice} />
        )}

        {/* Completion + score */}
        {phase === 'complete' && score !== null && (
          <m.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center gap-3 py-6 text-center"
          >
            <div className="flex items-center gap-2 text-cyan-400">
              <CircleCheck className="size-5" aria-hidden="true" />
              <p className="text-sm font-semibold">Simulazione completata</p>
            </div>
            <p className="max-w-xs text-sm leading-relaxed text-slate-300">
              {score.totalAttempts === score.correctAnswers
                ? 'Hai risposto correttamente al primo tentativo tutte le volte.'
                : `Hai risposto correttamente al primo tentativo ${score.correctAnswers} volt${score.correctAnswers === 1 ? 'a' : 'e'} su ${score.totalAttempts}.`}
            </p>
          </m.div>
        )}
      </div>
    </div>
  );
}
