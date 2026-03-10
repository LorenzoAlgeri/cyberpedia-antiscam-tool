import { STEPS, type StepIndex } from '@/types/steps';

interface StepIndicatorProps {
  readonly currentStep: StepIndex;
  readonly onStepClick: (step: StepIndex) => void;
}

/**
 * Step progress indicator — 4 dots with labels.
 * Accessible: semantic <nav> with aria-current="step".
 * Touch targets: min 44x44px per dot.
 */
export function StepIndicator({
  currentStep,
  onStepClick,
}: StepIndicatorProps) {
  return (
    <nav
      aria-label="Progresso del wizard"
      className="step-indicator flex items-center justify-center gap-2 px-4 py-4"
    >
      {STEPS.map((step) => {
        const isActive = currentStep === step.index;
        const isCompleted = currentStep > step.index;

        return (
          <button
            key={step.hash}
            type="button"
            aria-current={isActive ? 'step' : undefined}
            aria-label={step.ariaLabel}
            onClick={() => onStepClick(step.index)}
            className="group flex flex-col items-center gap-1.5"
            style={{ minWidth: 44, minHeight: 44 }}
          >
            {/* Dot */}
            <span
              aria-hidden="true"
              className={[
                'flex h-3 w-3 rounded-full transition-all duration-300',
                isActive
                  ? 'scale-125 bg-cyan-brand shadow-[0_0_12px_oklch(0.82_0.09_200/40%)]'
                  : isCompleted
                    ? 'bg-cyan-brand/50'
                    : 'bg-white/15',
              ].join(' ')}
            />

            {/* Label — visible on md+ */}
            <span
              className={[
                'hidden text-xs font-medium transition-colors duration-200 md:block',
                isActive
                  ? 'text-cyan-brand'
                  : isCompleted
                    ? 'text-muted-foreground'
                    : 'text-muted-foreground/50',
              ].join(' ')}
            >
              {step.label}
            </span>
          </button>
        );
      })}

      {/* Connecting line between dots */}
      <style>{`
        .step-indicator {
          position: relative;
        }
        .step-indicator::before {
          content: '';
          position: absolute;
          top: calc(1rem + 6px);
          left: 25%;
          right: 25%;
          height: 1px;
          background: oklch(1 0 0 / 10%);
          z-index: 0;
        }
        .step-indicator button {
          position: relative;
          z-index: 1;
        }
      `}</style>
    </nav>
  );
}
