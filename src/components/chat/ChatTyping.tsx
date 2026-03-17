/**
 * ChatTyping — "sta scrivendo..." typing indicator.
 *
 * Three animated dots with staggered bounce.
 * Interaction-design timing: 150ms stagger, 600ms loop.
 */

import * as m from 'motion/react-m';
import { useReducedMotion } from 'motion/react';

const DOT_VARIANTS = {
  initial: { y: 0 },
  animate: { y: [0, -4, 0] },
};

export function ChatTyping() {
  const shouldReduce = useReducedMotion();

  if (shouldReduce) {
    return (
      <div className="flex justify-start" role="status" aria-label="Sta scrivendo...">
        <div className="rounded-2xl rounded-bl-md bg-slate-800/80 px-4 py-2.5 text-sm text-slate-400">
          Sta scrivendo...
        </div>
      </div>
    );
  }

  return (
    <m.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -12 }}
      transition={{ duration: 0.2 }}
      className="flex justify-start"
      role="status"
      aria-label="Sta scrivendo..."
    >
      <div className="flex items-center gap-1 rounded-2xl rounded-bl-md bg-slate-800/80 px-4 py-3">
        {[0, 1, 2].map((i) => (
          <m.span
            key={i}
            variants={DOT_VARIANTS}
            initial="initial"
            animate="animate"
            transition={{
              duration: 0.6,
              repeat: Infinity,
              repeatDelay: 0.2,
              delay: i * 0.15,
              ease: 'easeInOut',
            }}
            className="inline-block size-2 rounded-full bg-slate-400"
          />
        ))}
      </div>
    </m.div>
  );
}
