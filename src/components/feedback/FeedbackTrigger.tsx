/**
 * FeedbackTrigger — floating circular button that opens the feedback drawer.
 *
 * Fixed bottom-right, 48px, gradient cyan with Framer Motion hover/tap.
 */

import * as m from 'motion/react-m';
import { MessageCircle } from 'lucide-react';

interface FeedbackTriggerProps {
  readonly onClick: () => void;
}

export function FeedbackTrigger({ onClick }: FeedbackTriggerProps) {
  return (
    <m.button
      type="button"
      onClick={onClick}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className="fixed bottom-6 right-6 z-30 flex h-12 w-12 items-center justify-center
                 rounded-full bg-gradient-to-r from-cyan-500 to-cyan-400
                 shadow-xl shadow-cyan-500/25 text-white
                 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2
                 focus-visible:outline-cyan-brand"
      aria-label="Inviaci un feedback"
    >
      <MessageCircle className="h-5 w-5" aria-hidden="true" />
    </m.button>
  );
}
