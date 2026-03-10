import { Shield } from 'lucide-react';

interface LandingPageProps {
  readonly onNext: () => void;
}

/**
 * Step 1 — Emotional landing page.
 * Copy: reassuring, anti-panic. Single large CTA.
 * TODO: returning user detection, logo asset, final copy
 */
export function LandingPage({ onNext }: LandingPageProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-8 px-4 py-12 text-center">
      {/* Shield icon — placeholder for Cyberpedia logo */}
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-cyan-brand/10">
        <Shield className="h-10 w-10 text-cyan-brand" strokeWidth={1.5} />
      </div>

      <div className="space-y-4">
        <h1 className="text-4xl font-bold tracking-tight text-foreground md:text-5xl">
          Fermati. Respira.
          <br />
          <span className="text-cyan-brand">Sei al sicuro qui.</span>
        </h1>

        <p className="mx-auto max-w-md text-lg text-muted-foreground">
          Questo strumento ti aiuta a gestire una possibile truffa senza
          agire d&apos;impulso.
        </p>
      </div>

      <button
        type="button"
        onClick={onNext}
        className="btn-primary text-xl"
      >
        Inizia ora
      </button>

      {/* Trust signal */}
      <p className="text-sm text-muted-foreground">
        🔒 I tuoi dati restano solo sul tuo dispositivo
      </p>
    </div>
  );
}
