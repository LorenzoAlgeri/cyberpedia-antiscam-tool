import { lazy, Suspense, useState } from 'react';
import { LazyMotion, domAnimation } from 'motion/react';
import { useHashRouter } from '@/hooks/useHashRouter';
import { useIframeResize } from '@/hooks/useIframeResize';
import { useReturningUser } from '@/hooks/useReturningUser';
import { useVisitCount } from '@/hooks/useVisitCount';
import { WizardShell } from '@/components/layout/WizardShell';
import { LandingPage } from '@/pages/LandingPage';
import { VictimStatusModal } from '@/components/layout/VictimStatusModal';
import { readVictimStatus, writeVictimStatus, type VictimStatus } from '@/lib/victimStatus';
import type { EmergencyData } from '@/types/emergency';
import { assertNever } from '@/lib/guards';

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
const NeedModePage = lazy(() =>
  import('@/pages/NeedModePage').then((m) => ({ default: m.NeedModePage })),
);

/** Minimal loading spinner matching design system. */
function StepFallback() {
  return (
    <div
      className="flex flex-1 items-center justify-center"
      role="status"
      aria-label="Caricamento in corso"
    >
      <div
        className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent"
        aria-hidden="true"
      />
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
  const { visitCount } = useVisitCount();
  const [victimStatus, setVictimStatus] = useState<VictimStatus | null>(() => {
    try {
      return readVictimStatus();
    } catch {
      return null;
    }
  });
  const [showVictimModal, setShowVictimModal] = useState(false);
  const [pendingNext, setPendingNext] = useState(false);

  // Lifted PIN + decrypted data — shared across EmergencyPage and NeedModePage
  // so NeedModePage skips the PIN dialog if already unlocked in EmergencyPage.
  const [globalPin, setGlobalPin] = useState<string | null>(null);
  const [unlockedData, setUnlockedData] = useState<EmergencyData | null>(null);

  // Notify parent iframe (cyberpedia.it) of height changes
  useIframeResize();

  /** Render the active step page, lazy pages wrapped in Suspense */
  function renderStep() {
    switch (currentStep) {
      case 0:
        return (
          <>
            <LandingPage
              onNext={() => {
                if (isReturningUser && victimStatus === null) {
                  setPendingNext(true);
                  setShowVictimModal(true);
                  return;
                }
                goNext();
              }}
              isReturningUser={isReturningUser}
            />
            <VictimStatusModal
              open={showVictimModal}
              onSelect={(v) => {
                setVictimStatus(v);
                writeVictimStatus(v);
                setShowVictimModal(false);
                if (pendingNext) {
                  setPendingNext(false);
                  goNext();
                }
              }}
              onClose={() => {
                setShowVictimModal(false);
                setPendingNext(false);
              }}
            />
          </>
        );
      case 1:
        return (
          <Suspense fallback={<StepFallback />}>
            <EmergencyPage
              onNext={goNext}
              onBack={goBack}
              visitCount={visitCount}
              victimStatus={victimStatus}
              onChangeVictimStatus={(v) => {
                setVictimStatus(v);
                writeVictimStatus(v);
              }}
              onUnlock={(pin, data) => {
                setGlobalPin(pin);
                setUnlockedData(data);
              }}
            />
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
            <InstallPage onNext={goNext} onBack={goBack} />
          </Suspense>
        );
      case 4:
        return (
          <Suspense fallback={<StepFallback />}>
            <NeedModePage
              onBack={goBack}
              pin={globalPin}
              unlockedData={unlockedData}
              onUnlock={(pin, data) => {
                setGlobalPin(pin);
                setUnlockedData(data);
              }}
            />
          </Suspense>
        );
      default:
        return assertNever(currentStep);
    }
  }

  return (
    <LazyMotion features={domAnimation} strict>
      <WizardShell
        currentStep={currentStep}
        direction={direction}
        onStepClick={goTo}
      >
        {renderStep()}
      </WizardShell>
    </LazyMotion>
  );
}

export default App;
