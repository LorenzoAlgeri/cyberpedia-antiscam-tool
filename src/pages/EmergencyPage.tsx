interface EmergencyPageProps {
  readonly onNext: () => void;
  readonly onBack: () => void;
}

/**
 * Step 2 — Emergency data + To-Do checklist.
 * TODO (Week 2): EmergencyForm, AttackTypeSelector, TodoChecklist
 */
export function EmergencyPage({ onNext, onBack }: EmergencyPageProps) {
  return (
    <div className="flex flex-col gap-6 px-4 py-8">
      <h2 className="text-3xl font-bold text-foreground">
        Dati di emergenza
      </h2>
      <p className="text-muted-foreground">
        Salva i contatti importanti e segui la checklist anti-truffa.
      </p>

      {/* Placeholder card */}
      <div className="glass-card p-8 text-center text-muted-foreground">
        <p className="text-lg">
          Form emergenza + To-Do list
        </p>
        <p className="mt-2 text-sm">
          In arrivo nella Settimana 2
        </p>
      </div>

      <div className="flex gap-4">
        <button
          type="button"
          onClick={onBack}
          className="flex-1 rounded-2xl border border-white/10 bg-secondary px-6 py-4 text-lg font-medium text-secondary-foreground transition-colors hover:bg-secondary/80"
          style={{ minHeight: 44 }}
        >
          Indietro
        </button>
        <button
          type="button"
          onClick={onNext}
          className="btn-primary flex-1"
        >
          Avanti
        </button>
      </div>
    </div>
  );
}
