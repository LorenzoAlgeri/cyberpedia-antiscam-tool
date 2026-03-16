import { Save } from 'lucide-react';

interface EmergencyPageActionsProps {
  onBack: () => void;
  onSave: () => void;
  onNext: () => void;
}

/** Navigation buttons row: Indietro / Salva / Avanti. */
export function EmergencyPageActions({ onBack, onSave, onNext }: EmergencyPageActionsProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      <button
        type="button"
        onClick={onBack}
        className="btn-ghost sm:order-first"
      >
        Indietro
      </button>
      <button
        type="button"
        onClick={onSave}
        className="btn-outline-accent flex-1"
        aria-label="Salva dati cifrati"
      >
        <Save className="h-5 w-5" />
        Salva
      </button>
      <button
        type="button"
        onClick={onNext}
        className="btn-primary flex-1"
      >
        Avanti
      </button>
    </div>
  );
}
