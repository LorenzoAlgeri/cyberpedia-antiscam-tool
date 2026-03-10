import { lazy, Suspense } from 'react';
import { useHashRouter } from '@/hooks/useHashRouter';
import { useReturningUser } from '@/hooks/useReturningUser';
import { WizardShell } from '@/components/layout/WizardShell';
import { LandingPage } from '@/pages/LandingPage';

/* ── Lazy-loaded pages (code-split chunks) ──────────── */
const EmergencyPage = lazy(() =>
  import('@/pages/EmergencyPage').then((m) => ({ default: m.EmergencyPage })),
);
const SimulationsPage = lazy(() =>
  import('@/pages/SimulationsPage').then((m) => ({
    default: m.SimulationsPage,
  })),
);
const InstallPage = lazy(() =>
  import('@/pages/InstallPage').then((m) => ({ default: m.InstallPage })),
);

/** Minimal loading spinner matching design system. */
function StepFallback() {
  return (
    <div className="flex flex-1 items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent" />
    </div>
  );
}

/**
 * Root application component.
 * Renders the 4-step wizard with hash-based routing
 * and animated transitions via AnimatePresence.
 *
 * Pages 1-3 are lazy-loaded via React.lazy() for
 * smaller initial bundle — LandingPage stays eager
 * as it's the first thing users see.
 */
function App() {
  const { currentStep, direction, goTo, goNext, goBack } = useHashRouter();
  const { isReturningUser } = useReturningUser();

  /** Render the active step page, lazy pages wrapped in Suspense */
  function renderStep() {
    switch (currentStep) {
      case 0:
        return (
          <LandingPage onNext={goNext} isReturningUser={isReturningUser} />
        );
      case 1:
        return (
          <Suspense fallback={<StepFallback />}>
            <EmergencyPage onNext={goNext} onBack={goBack} />
          </Suspense>
        );
      case 2:
        return (
          <Suspense fallback={<StepFallback />}>
            <SimulationsPage onNext={goNext} onBack={goBack} />
          </Suspense>
        );
      case 3:
        return (
          <Suspense fallback={<StepFallback />}>
            <InstallPage onBack={goBack} />
          </Suspense>
        );
    }
  }

  return (
    <WizardShell
      currentStep={currentStep}
      direction={direction}
      onStepClick={goTo}
    >
      {renderStep()}
    </WizardShell>
  );
}

export default App;
