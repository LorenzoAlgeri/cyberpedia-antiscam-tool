import { Download } from 'lucide-react';

interface InstallPageProps {
  readonly onBack: () => void;
}

/**
 * Step 4 — PWA install guide (optional / skippable).
 * TODO (Week 3): OS detection, browser-specific instructions,
 *   beforeinstallprompt interception
 */
export function InstallPage({ onBack }: InstallPageProps) {
  return (
    <div className="flex flex-col items-center gap-6 px-4 py-8 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-cyan-brand/10">
        <Download className="h-8 w-8 text-cyan-brand" strokeWidth={1.5} />
      </div>

      <h2 className="text-3xl font-bold text-foreground">
        Installa sulla Home Screen
      </h2>
      <p className="max-w-md text-muted-foreground">
        In caso di truffa, lo aprirai in 2 secondi.
      </p>

      {/* Placeholder install guide */}
      <div className="glass-card w-full max-w-md p-8">
        <p className="text-lg text-muted-foreground">
          Guida di installazione per il tuo dispositivo
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          In arrivo nella Settimana 3
        </p>
      </div>

      <button
        type="button"
        onClick={onBack}
        className="rounded-2xl border border-white/10 bg-secondary px-8 py-4 text-lg font-medium text-secondary-foreground transition-colors hover:bg-secondary/80"
        style={{ minHeight: 44 }}
      >
        Torna indietro
      </button>
    </div>
  );
}
