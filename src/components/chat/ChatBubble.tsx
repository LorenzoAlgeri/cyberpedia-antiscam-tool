/**
 * ChatBubble — WhatsApp-style message bubble.
 *
 * - scammer: left-aligned, darker glass
 * - user:    right-aligned, cyan accent
 * - system:  centered, muted
 * - feedback: centered, green/amber based on correct
 *
 * Motion: slides in from left/right with fade.
 */

import { useState } from 'react';
import * as m from 'motion/react-m';
import { AnimatePresence } from 'motion/react';
import { CheckCircle, ChevronDown, XCircle } from 'lucide-react';
import type { ChatEntry } from '@/types/simulation';

/** Feedback bubble with short text + optional "Approfondisci" collapsible */
function FeedbackBubble({ entry }: { entry: ChatEntry }) {
  const [open, setOpen] = useState(false);
  const isCorrect = entry.correct === true;
  const Icon = isCorrect ? CheckCircle : XCircle;

  return (
    <m.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={`mx-auto w-full max-w-[85%] rounded-2xl border p-4 text-base ${
        isCorrect
          ? 'border-emerald-500/40 bg-emerald-950/40 text-emerald-200'
          : 'border-amber-500/40 bg-amber-950/40 text-amber-200'
      }`}
    >
      {/* Title */}
      <div className="mb-2 flex items-center gap-2 font-bold">
        <Icon className="size-4 shrink-0" aria-hidden="true" />
        <span>{isCorrect ? 'Corretto.' : 'Stop. Questa è la trappola.'}</span>
      </div>

      {/* Short text — max 2 lines */}
      <p className="leading-snug">{entry.text}</p>

      {/* Approfondisci collapsible */}
      {entry.detail && (
        <div className="mt-3">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className={`flex items-center gap-1 text-base font-medium underline-offset-2 hover:underline ${
              isCorrect ? 'text-emerald-300' : 'text-amber-300'
            }`}
            aria-expanded={open}
          >
            <ChevronDown
              className={`size-3.5 transition-transform ${open ? 'rotate-180' : ''}`}
              aria-hidden="true"
            />
            {open ? 'Chiudi' : 'Approfondisci'}
          </button>
          <AnimatePresence>
            {open && (
              <m.p
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className={`mt-2 overflow-hidden text-base leading-relaxed ${
                  isCorrect ? 'text-emerald-300/80' : 'text-amber-300/80'
                }`}
              >
                {entry.detail}
              </m.p>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* CTA label */}
      <p className={`mt-3 text-base font-semibold ${isCorrect ? 'text-emerald-300' : 'text-amber-300'}`}>
        {isCorrect ? 'Avanti →' : 'Riprova'}
      </p>
    </m.div>
  );
}

interface ChatBubbleProps {
  entry: ChatEntry;
}

export function ChatBubble({ entry }: ChatBubbleProps) {
  const { sender, text } = entry;

  // Feedback bubble
  if (sender === 'feedback') {
    return <FeedbackBubble entry={entry} />;
  }

  // System message
  if (sender === 'system') {
    return (
      <m.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.25 }}
        className="mx-auto max-w-[70%] text-center text-base text-slate-400"
        role="status"
      >
        {text}
      </m.div>
    );
  }

  // User or scammer bubble
  const isUser = sender === 'user';

  return (
    <m.div
      initial={{ opacity: 0, x: isUser ? 20 : -20, y: 4 }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
    >
      <div
        className={`max-w-[85%] rounded-2xl px-5 py-3.5 leading-relaxed ${
          isUser
            ? 'rounded-br-md bg-cyan-600/30 text-cyan-50'
            : 'rounded-bl-md bg-slate-800/80 text-slate-200'
        }`}
        style={{ fontSize: '20px' }}
      >
        <span className="sr-only">{isUser ? 'Tu: ' : 'Truffatore: '}</span>
        {text}
      </div>
    </m.div>
  );
}
