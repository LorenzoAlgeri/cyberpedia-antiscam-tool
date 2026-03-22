import { ExternalLink, ShieldAlert } from 'lucide-react';

/** Static blue card displaying Polizia Postale phone number and online report link. */
export function PoliziaPostaleCard() {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-blue-500/20 bg-blue-500/5 px-4 py-3">
      <div className="flex items-center gap-2.5">
        <ShieldAlert
          className="h-5 w-5 shrink-0 text-blue-400"
          strokeWidth={1.5}
          aria-hidden="true"
        />
        <div>
          <p className="text-base font-semibold text-blue-300">
            Polizia Postale
          </p>
          <a
            href="tel:800288883"
            className="font-mono text-base font-medium text-foreground transition-colors hover:text-blue-300"
            aria-label="Chiama Polizia Postale: 800 288 883"
          >
            800 288 883
          </a>
        </div>
      </div>
      <a
        href="https://www.commissariatodips.it"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1 text-base text-blue-400 underline-offset-2 transition-colors hover:text-blue-300 hover:underline"
        aria-label="Denuncia online su commissariatodips.it (apre in nuova tab)"
      >
        Denuncia online
        <ExternalLink className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      </a>
    </div>
  );
}
