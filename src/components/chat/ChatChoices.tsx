/**
 * ChatChoices — 2-3 interactive response buttons.
 *
 * Rendered at the bottom of the chat when the engine
 * enters the 'choice' phase. Motion stagger entrance.
 * Touch target ≥ 44px.
 */

import { motion } from 'motion/react';
import type { ChoiceOption } from '@/types/simulation';

interface ChatChoicesProps {
  options: readonly ChoiceOption[];
  onSelect: (optionId: string) => void;
}

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.2 },
  },
};

const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 },
};

export function ChatChoices({ options, onSelect }: ChatChoicesProps) {
  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="flex flex-col gap-2 pt-2"
      role="group"
      aria-label="Scegli una risposta"
    >
      {options.map((option) => (
        <motion.button
          key={option.id}
          variants={item}
          whileTap={{ scale: 0.97 }}
          onClick={() => onSelect(option.id)}
          className="min-h-[44px] cursor-pointer rounded-2xl border border-cyan-500/30
                     bg-cyan-950/30 px-4 py-3 text-left text-sm font-medium
                     text-cyan-100 transition-colors hover:border-cyan-400/50
                     hover:bg-cyan-900/40 focus-visible:outline-none
                     focus-visible:ring-2 focus-visible:ring-cyan-400"
          type="button"
        >
          {option.text}
        </motion.button>
      ))}
    </motion.div>
  );
}
