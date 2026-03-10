interface SimulationsPageProps {
  readonly onNext: () => void;
  readonly onBack: () => void;
}

/**
 * Step 3 — Interactive chat simulations hub.
 * TODO (Week 3): ChatSimulator, 4 simulation scripts
 */
export function SimulationsPage({ onNext, onBack }: SimulationsPageProps) {
  return (
    <div className="flex flex-col gap-6 px-4 py-8">
      <h2 className="text-3xl font-bold text-foreground">
        Simulazioni interattive
      </h2>
      <p className="text-muted-foreground">
        Mettiti alla prova con 4 scenari realistici di truffa.
      </p>

      {/* Placeholder grid for 4 simulation cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {(['Truffa amorosa', 'Prestito urgente', 'Finto operatore', 'Finto parente'] as const).map(
          (title) => (
            <div
              key={title}
              className="glass-card flex items-center justify-center p-8 text-center"
            >
              <p className="text-lg text-muted-foreground">{title}</p>
            </div>
          ),
        )}
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
