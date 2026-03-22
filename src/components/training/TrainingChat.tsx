/**
 * TrainingChat — container for AI-driven training conversation.
 *
 * Reuses ChatBubble and ChatTyping from the scripted simulation components.
 * Adds:
 * - Free-text ChatInput
 * - RiskIndicator bar
 * - Progressive wait message after 5s
 * - Header with scammer name
 */

import { useRef, useEffect } from 'react';
import * as m from 'motion/react-m';
import { AnimatePresence } from 'motion/react';
import { ArrowLeft, Shield } from 'lucide-react';
import { ChatBubble } from '@/components/chat/ChatBubble';
import { ChatTyping } from '@/components/chat/ChatTyping';
import { ChatInput } from './ChatInput';
import { RiskIndicator } from './RiskIndicator';
import type { ConversationTurn, BehaviorScores } from '@/types/training';
import type { ChatEntry } from '@/types/simulation';

interface TrainingChatProps {
  readonly scammerName: string;
  readonly turns: readonly ConversationTurn[];
  readonly latestScores: BehaviorScores | null;
  readonly isLoading: boolean;
  readonly waitSeconds: number;
  readonly error: string | null;
  readonly onSendMessage: (text: string) => void;
  readonly onBack: () => void;
}

/** Convert a ConversationTurn to a ChatEntry for ChatBubble rendering. */
function turnToEntry(turn: ConversationTurn): ChatEntry {
  return {
    id: turn.id,
    sender: turn.role === 'scammer' ? 'scammer' : turn.role === 'user' ? 'user' : 'system',
    text: turn.content,
  };
}

export function TrainingChat({
  scammerName,
  turns,
  latestScores,
  isLoading,
  waitSeconds,
  error,
  onSendMessage,
  onBack,
}: TrainingChatProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      requestAnimationFrame(() => {
        scrollRef.current?.scrollTo({
          top: scrollRef.current.scrollHeight,
          behavior: 'smooth',
        });
      });
    }
  }, [turns.length, isLoading]);

  return (
    <div className="flex h-[100dvh] flex-col overflow-hidden">
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
          <div className="flex size-8 items-center justify-center rounded-full bg-slate-700">
            <Shield className="size-4 text-cyan-400" aria-hidden="true" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-200">{scammerName}</p>
            {isLoading && (
              <p className="text-xs text-cyan-400">sta scrivendo...</p>
            )}
          </div>
        </div>
      </div>

      {/* Risk indicator */}
      <RiskIndicator scores={latestScores} />

      {/* Chat thread */}
      <div
        ref={scrollRef}
        className="flex flex-1 flex-col gap-3 overflow-y-auto px-4 py-4"
        role="log"
        aria-label="Conversazione di allenamento"
        aria-live="polite"
      >
        {turns.map((turn) => (
          <ChatBubble key={turn.id} entry={turnToEntry(turn)} />
        ))}

        {/* Typing indicator */}
        <AnimatePresence>
          {isLoading && (
            <m.div
              key="typing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <ChatTyping />
              {/* Progressive wait message after 5s */}
              {waitSeconds >= 5 && (
                <m.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mt-2 text-center text-xs text-slate-500"
                >
                  Il nostro esperto sta analizzando la situazione...
                </m.p>
              )}
            </m.div>
          )}
        </AnimatePresence>

        {/* Error message */}
        {error && (
          <m.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mx-auto flex flex-col items-center gap-2 rounded-xl border border-red-500/30 bg-red-950/30 px-4 py-3 text-center text-sm text-red-300"
            role="alert"
          >
            <p>{error}</p>
            <p className="text-xs text-red-400/70">Rinvia il messaggio per riprovare</p>
          </m.div>
        )}
      </div>

      {/* Input */}
      <ChatInput
        onSend={onSendMessage}
        disabled={isLoading}
        placeholder="Rispondi al messaggio..."
      />
    </div>
  );
}
