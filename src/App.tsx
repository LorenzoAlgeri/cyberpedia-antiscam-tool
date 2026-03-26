import { lazy, Suspense, useState, useCallback, useEffect } from 'react';
import { LazyMotion, domAnimation } from 'motion/react';
import { useHashRouter } from '@/hooks/useHashRouter';
import { useIframeResize } from '@/hooks/useIframeResize';
import { useReturningUser } from '@/hooks/useReturningUser';
import { initAnalytics } from '@/lib/event-analytics';
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
const ChecklistPage = lazy(() =>
  import('@/pages/ChecklistPage').then((m) => ({ default: m.ChecklistPage })),
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
const LeadCapturePage = lazy(() =>
  import('@/pages/LeadCapturePage').then((m) => ({ default: m.LeadCapturePage })),
);

/* ── Beta gate constants ──────────────────────────────── */

const BETA_TOKEN_KEY = 'cyberpedia-beta-access';
const ADMIN_TOKEN_KEY = 'cyberpedia-admin';
const BETA_OPEN = import.meta.env.VITE_BETA_OPEN === 'true';
const ADMIN_KEY = import.meta.env.VITE_ADMIN_KEY ?? '';
const ACCESS_PREFIX = '#access-';

/**
 * Detect admin bypass URL (#access-{secret}) and persist admin flag.
 * Returns true if admin access is granted (either fresh or persisted).
 */
function useAdminBypass(): boolean {
  const [isAdmin] = useState(() => {
    if (localStorage.getItem(ADMIN_TOKEN_KEY)) return true;
    const hash = window.location.hash;
    if (ADMIN_KEY && hash.startsWith(ACCESS_PREFIX)) {
      const key = hash.slice(ACCESS_PREFIX.length);
      if (key === ADMIN_KEY) {
        localStorage.setItem(ADMIN_TOKEN_KEY, Date.now().toString());
        return true;
      }
    }
    return false;
  });

  // Redirect away from admin hash after detection
  useEffect(() => {
    if (isAdmin && window.location.hash.startsWith(ACCESS_PREFIX)) {
      window.location.hash = '#landing';
    }
  }, [isAdmin]);

  return isAdmin;
}

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
 *
 * Flow:
 * - First visit (no saved profile): Landing → Emergency (profile setup) → Simulations → Install
 * - Return visit (has profile):     Landing → Checklist (what scam?) → Emergency → Simulations → Install
 *
 * Checklist (step 1) is skipped on first visit.
 */
function App() {
  const { currentStep, direction, goTo, goNext, goBack } = useHashRouter();

  // Beta gate: admin bypass + registered user check
  const isAdmin = useAdminBypass();
  const [hasBetaToken, setHasBetaToken] = useState(
    () => Boolean(localStorage.getItem(BETA_TOKEN_KEY)),
  );
  const canAccess = isAdmin || (hasBetaToken && BETA_OPEN);
  const handleBetaGranted = useCallback(() => {
    setHasBetaToken(true);
    window.location.hash = '#landing';
  }, []);
  const { isReturningUser } = useReturningUser();
  const [victimStatus, setVictimStatus] = useState<VictimStatus | null>(() => {
    try {
      return readVictimStatus();
    } catch {
      return null;
    }
  });
  const [showVictimModal, setShowVictimModal] = useState(false);
  const [pendingNext, setPendingNext] = useState(false);

  // Lifted PIN + decrypted data — shared across EmergencyPage, ChecklistPage, NeedModePage
  const [globalPin, setGlobalPin] = useState<string | null>(null);
  const [unlockedData, setUnlockedData] = useState<EmergencyData | null>(null);

  // Track if profile was just saved in this session (upgrade first-visit → returning)
  const [profileSavedThisSession, setProfileSavedThisSession] = useState(false);

  // Notify parent iframe (cyberpedia.it) of height changes
  useIframeResize();

  // Initialize privacy-first analytics (UTM capture, periodic flush)
  useEffect(() => { initAnalytics(); }, []);

  /** Whether checklist should be shown (returning user or just saved profile) */
  const showChecklist = isReturningUser || profileSavedThisSession;

  /** Navigate from landing — skip checklist on first visit */
  const handleLandingNext = useCallback(() => {
    if (showChecklist) {
      if (victimStatus === null) {
        setPendingNext(true);
        setShowVictimModal(true);
        return;
      }
      goNext(); // → step 1 (checklist)
    } else {
      // First visit: skip checklist, go to emergency (step 2)
      goTo(2);
    }
  }, [showChecklist, victimStatus, goNext, goTo]);

  /** Render the active step page, lazy pages wrapped in Suspense */
  function renderStep() {
    switch (currentStep) {
      case 0:
        return (
          <>
            <LandingPage
              onNext={handleLandingNext}
              isReturningUser={showChecklist}
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
        // Checklist — if first visit, redirect to emergency
        if (!showChecklist) {
          goTo(2);
          return <StepFallback />;
        }
        return (
          <Suspense fallback={<StepFallback />}>
            <ChecklistPage
              onNext={goNext}
              onBack={goBack}
              pin={globalPin}
              victimStatus={victimStatus}
              onChangeVictimStatus={(v) => {
                setVictimStatus(v);
                writeVictimStatus(v);
              }}
            />
          </Suspense>
        );
      case 2:
        return (
          <Suspense fallback={<StepFallback />}>
            <EmergencyPage
              onNext={goNext}
              onBack={showChecklist ? goBack : () => goTo(0)}
              onUnlock={(pin, data) => {
                setGlobalPin(pin);
                setUnlockedData(data);
              }}
              onProfileSaved={() => setProfileSavedThisSession(true)}
            />
          </Suspense>
        );
      case 3:
        return (
          <Suspense fallback={<StepFallback />}>
            <SimulationsPage onNext={goNext} onBack={goBack} />
          </Suspense>
        );
      case 4:
        return (
          <Suspense fallback={<StepFallback />}>
            <InstallPage onNext={goNext} onBack={goBack} />
          </Suspense>
        );
      case 5:
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
              victimStatus={victimStatus}
            />
          </Suspense>
        );
      default:
        return assertNever(currentStep);
    }
  }

  // Beta gate: no access → show registration page (blocks all routes)
  if (!canAccess) {
    return (
      <LazyMotion features={domAnimation} strict>
        <Suspense fallback={<StepFallback />}>
          <LeadCapturePage onBetaGranted={BETA_OPEN ? handleBetaGranted : undefined} />
        </Suspense>
      </LazyMotion>
    );
  }

  // User has access (admin or registered+open) → show wizard
  return (
    <LazyMotion features={domAnimation} strict>
      <WizardShell
        currentStep={currentStep}
        direction={direction}
        onStepClick={goTo}
        hiddenSteps={showChecklist ? [] : [1]}
      >
        {renderStep()}
      </WizardShell>
    </LazyMotion>
  );
}

export default App;
