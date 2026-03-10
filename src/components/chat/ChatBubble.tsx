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

import { motion } from 'motion/react';
import { CheckCircle, XCircle } from 'lucide-react';
import type { ChatEntry } from '@/types/simulation';

interface ChatBubbleProps {
  entry: ChatEntry;
}

export function ChatBubble({ entry }: ChatBubbleProps) {
  const { sender, text, correct } = entry;

  // Feedback bubble
  if (sender === 'feedback') {
    const isCorrect = correct === true;
    const Icon = isCorrect ? CheckCircle : XCircle;

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className={`mx-auto max-w-[85%] rounded-2xl border p-4 text-sm ${
          isCorrect
            ? 'border-emerald-500/40 bg-emerald-950/40 text-emerald-200'
            : 'border-amber-500/40 bg-amber-950/40 text-amber-200'
        }`}
        role="status"
        aria-live="polite"
      >
        <div className="mb-1 flex items-center gap-2 font-semibold">
          <Icon className="size-4 shrink-0" aria-hidden="true" />
          <span>{isCorrect ? 'Corretto!' : 'Attenzione!'}</span>
        </div>
        <p>{text}</p>
      </motion.div>
    );
  }

  // System message
  if (sender === 'system') {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.25 }}
        className="mx-auto max-w-[70%] text-center text-xs text-slate-400"
        role="status"
      >
        {text}
      </motion.div>
    );
  }

  // User or scammer bubble
  const isUser = sender === 'user';

  return (
    <motion.div
      initial={{ opacity: 0, x: isUser ? 20 : -20, y: 4 }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
    >
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
          isUser
            ? 'rounded-br-md bg-cyan-600/30 text-cyan-50'
            : 'rounded-bl-md bg-slate-800/80 text-slate-200'
        }`}
      >
        {text}
      </div>
    </motion.div>
  );
}
