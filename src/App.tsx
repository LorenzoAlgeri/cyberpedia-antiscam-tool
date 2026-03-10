import { useHashRouter } from '@/hooks/useHashRouter';
import { WizardShell } from '@/components/layout/WizardShell';
import { LandingPage } from '@/pages/LandingPage';
import { EmergencyPage } from '@/pages/EmergencyPage';
import { SimulationsPage } from '@/pages/SimulationsPage';
import { InstallPage } from '@/pages/InstallPage';

/**
 * Root application component.
 * Renders the 4-step wizard with hash-based routing
 * and animated transitions via AnimatePresence.
 */
function App() {
  const { currentStep, direction, goTo, goNext, goBack } = useHashRouter();

  /** Render the active step page */
  function renderStep() {
    switch (currentStep) {
      case 0:
        return <LandingPage onNext={goNext} />;
      case 1:
        return <EmergencyPage onNext={goNext} onBack={goBack} />;
      case 2:
        return <SimulationsPage onNext={goNext} onBack={goBack} />;
      case 3:
        return <InstallPage onBack={goBack} />;
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
