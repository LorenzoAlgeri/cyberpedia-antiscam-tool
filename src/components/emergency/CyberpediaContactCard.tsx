import { ExternalLink, HeartHandshake } from 'lucide-react';

/** Prominent glass card inviting users to request psychological or legal support from Cyberpedia. */
export function CyberpediaContactCard() {
  return (
    <div className="glass-card flex flex-col items-center gap-4 p-6 text-center sm:p-8">
      <HeartHandshake
        className="h-10 w-10 text-cyan-400"
        strokeWidth={1.5}
        aria-hidden="true"
      />
      <div className="space-y-1.5">
        <h3 className="text-lg font-semibold text-foreground">
          Hai bisogno di aiuto psicologico o legale?
        </h3>
        <p className="text-sm text-slate-400">
          Non devi affrontare questa situazione da solo. Il nostro team
          è pronto ad ascoltarti e orientarti.
        </p>
      </div>
      <a
        href="https://cyberpedia.it/contatti/"
        target="_blank"
        rel="noopener noreferrer"
        className="mt-1 inline-flex min-h-[44px] items-center gap-2 rounded-2xl border border-cyan-500/30 bg-cyan-500/10 px-6 py-3 text-sm font-semibold text-cyan-300 transition-all hover:bg-cyan-500/20 hover:text-cyan-200 hover:shadow-lg hover:shadow-cyan-500/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/70"
        aria-label="Richiedi un primo incontro con Cyberpedia (apre in nuova tab)"
      >
        Richiedi un primo incontro
        <ExternalLink className="h-4 w-4 shrink-0" aria-hidden="true" />
      </a>
    </div>
  );
}
