import { AnimatePresence, motion } from 'motion/react';
import type { ReactNode } from 'react';
import type { StepIndex } from '@/types/steps';
import { StepIndicator } from './StepIndicator';

interface WizardShellProps {
  readonly currentStep: StepIndex;
  readonly direction: 1 | -1;
  readonly onStepClick: (step: StepIndex) => void;
  readonly children: ReactNode;
}

/**
 * Main wizard shell — wraps step content with StepIndicator
 * and AnimatePresence for animated transitions between steps.
 *
 * Uses horizontal slide + fade transitions:
 * - Forward (direction=1): slide from right
 * - Backward (direction=-1): slide from left
 * - Duration: 250ms (within 150-300ms CLAUDE.md constraint)
 */
export function WizardShell({
  currentStep,
  direction,
  onStepClick,
  children,
}: WizardShellProps) {
  return (
    <div className="mx-auto flex min-h-dvh max-w-2xl flex-col px-4 md:px-8 lg:max-w-4xl lg:px-12">
      {/* Step indicator — hidden on landing (step 0) */}
      {currentStep > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          <StepIndicator
            currentStep={currentStep}
            onStepClick={onStepClick}
          />
        </motion.div>
      )}

      {/* Step content with animated transitions. overflow-hidden clips the ±60px
          horizontal slide so it never triggers a viewport-level scrollbar. */}
      <main className="relative flex flex-1 flex-col overflow-hidden">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentStep}
            custom={direction}
            initial="enter"
            animate="center"
            exit="exit"
            variants={slideVariants}
            transition={{
              duration: 0.25,
              ease: [0.25, 0.1, 0.25, 1], // cubic-bezier — smooth
            }}
            className="flex flex-1 flex-col"
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}

/**
 * Slide variants for AnimatePresence.
 * Uses transform + opacity (GPU-accelerated, per CLAUDE.md).
 * `custom` parameter = direction (1 or -1).
 */
const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 60 : -60,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction > 0 ? -60 : 60,
    opacity: 0,
  }),
};
