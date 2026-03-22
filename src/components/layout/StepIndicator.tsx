import { STEPS, type StepIndex } from '@/types/steps';

interface StepIndicatorProps {
  readonly currentStep: StepIndex;
  readonly onStepClick: (step: StepIndex) => void;
  /** Step indices to hide (e.g. [1] to hide Checklist on first visit) */
  readonly hiddenSteps?: readonly number[];
}

/**
 * Step progress indicator — dots with label under active dot.
 * Accessible: semantic <nav> with aria-current="step".
 * Touch targets: min 44x44px per dot.
 */
export function StepIndicator({
  currentStep,
  onStepClick,
  hiddenSteps = [],
}: StepIndicatorProps) {
  const visibleSteps = STEPS.filter((s) => !hiddenSteps.includes(s.index));

  return (
    <nav
      aria-label="Progresso del wizard"
      className="flex items-start justify-center gap-3 px-4 py-4"
    >
      {visibleSteps.map((step) => {
        const isActive = currentStep === step.index;
        const isCompleted = currentStep > step.index;

        return (
          <button
            key={step.hash}
            type="button"
            aria-current={isActive ? 'step' : undefined}
            aria-label={step.ariaLabel}
            onClick={() => onStepClick(step.index)}
            className="flex flex-col items-center gap-1.5"
            style={{ minWidth: 44, minHeight: 44 }}
          >
            <span
              aria-hidden="true"
              className={[
                'flex rounded-full transition-all duration-300',
                isActive
                  ? 'h-3.5 w-3.5 bg-cyan-brand shadow-[0_0_12px_oklch(0.82_0.09_200/40%)]'
                  : isCompleted
                    ? 'h-2.5 w-2.5 bg-cyan-brand/50'
                    : 'h-2.5 w-2.5 bg-white/15',
              ].join(' ')}
            />
            {isActive && (
              <span className="text-xs font-medium text-cyan-brand whitespace-nowrap">
                {step.label}
              </span>
            )}
          </button>
        );
      })}
    </nav>
  );
}
