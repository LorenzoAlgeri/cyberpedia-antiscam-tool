import { useCallback, useEffect, useRef, useState } from 'react';
import { STEP_HASHES, type StepIndex } from '@/types/steps';

/**
 * Custom hash-based router for the 4-step wizard.
 *
 * Uses window.location.hash to enable:
 * - Browser back/forward navigation
 * - Deep linking (#emergency, #simulations, etc.)
 * - Analytics-friendly URL changes
 *
 * Falls back to #landing if hash is unknown or empty.
 */
export function useHashRouter() {
  const resolveHash = useCallback((): StepIndex => {
    const hash = window.location.hash || '';
    const index = STEP_HASHES.indexOf(hash as (typeof STEP_HASHES)[number]);
    return (index >= 0 ? index : 0) as StepIndex;
  }, []);

  const [currentStep, setCurrentStep] = useState<StepIndex>(resolveHash);
  const [direction, setDirection] = useState<1 | -1>(1);
  const prevStepRef = useRef<StepIndex>(currentStep);

  // Single hashchange listener — updates step + direction
  useEffect(() => {
    function onHashChange() {
      const newStep = resolveHash();
      const prev = prevStepRef.current;
      setDirection(newStep >= prev ? 1 : -1);
      setCurrentStep(newStep);
      prevStepRef.current = newStep;
    }

    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, [resolveHash]);

  // Set initial hash if none present
  useEffect(() => {
    if (!window.location.hash) {
      window.history.replaceState(null, '', STEP_HASHES[0]);
    }
  }, []);

  /** Navigate to a specific step */
  const goTo = useCallback((step: StepIndex) => {
    window.location.hash = STEP_HASHES[step];
  }, []);

  /** Navigate to next step (clamped) */
  const goNext = useCallback(() => {
    const next = Math.min(prevStepRef.current + 1, 3) as StepIndex;
    window.location.hash = STEP_HASHES[next];
  }, []);

  /** Navigate to previous step (clamped) */
  const goBack = useCallback(() => {
    const next = Math.max(prevStepRef.current - 1, 0) as StepIndex;
    window.location.hash = STEP_HASHES[next];
  }, []);

  return {
    currentStep,
    direction,
    goTo,
    goNext,
    goBack,
    isFirst: currentStep === 0,
    isLast: currentStep === 3,
  } as const;
}
