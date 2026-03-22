interface EmergencyPageActionsProps {
  onNext: () => void;
  onBack?: (() => void) | undefined;
}

/** Navigation buttons for Emergency page. */
export function EmergencyPageActions({ onNext, onBack }: EmergencyPageActionsProps) {
  return (
    <div className="flex gap-3">
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          className="btn-ghost"
        >
          Indietro
        </button>
      )}
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
