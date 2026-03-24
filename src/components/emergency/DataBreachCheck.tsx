import { useState } from 'react';
import * as m from 'motion/react-m';
import { AnimatePresence } from 'motion/react';
import {
  ExternalLink,
  ShieldCheck,
  KeyRound,
  AlertTriangle,
  ChevronDown,
  CheckCircle2,
} from 'lucide-react';

const HOW_TO_STEPS = [
  'Vai su haveibeenpwned.com cliccando il pulsante sopra',
  'Inserisci il tuo indirizzo email nella barra di ricerca',
  "Clicca 'pwned?' per verificare",
  "Se il risultato è verde ('Good news') — i tuoi dati non risultano compromessi",
  "Se il risultato è rosso ('Oh no — pwned!') — cambia immediatamente le password degli account indicati",
] as const;

const REMEDIATION_STEPS = [
  "Cambia immediatamente la password dell'account compromesso",
  "Attiva l'autenticazione a due fattori (2FA) dove possibile",
  'Controlla movimenti sospetti su conti bancari collegati',
  'Non usare la stessa password su più siti',
  "Considera l'uso di un password manager (es. Bitwarden, 1Password)",
] as const;

/** Collapsible section with animated expand/collapse. */
function CollapsibleSection({
  title,
  icon: Icon,
  children,
  defaultOpen = false,
}: {
  readonly title: string;
  readonly icon: React.ComponentType<{ className?: string }>;
  readonly children: React.ReactNode;
  readonly defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="glass-card overflow-hidden p-4 sm:p-5">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 text-left"
        style={{ minHeight: 44 }}
        aria-expanded={open}
      >
        <span className="flex items-center gap-2.5 text-lg font-semibold text-foreground">
          <Icon className="h-5 w-5 text-amber-400" />
          {title}
        </span>
        <m.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown className="h-5 w-5 text-muted-foreground" />
        </m.span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <m.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="pt-4">{children}</div>
          </m.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/** Numbered step badge. */
function StepBadge({ n }: { readonly n: number }) {
  return (
    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber-500/20 text-sm font-bold text-amber-300">
      {n}
    </span>
  );
}

export function DataBreachCheck() {
  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex flex-col gap-1.5">
        <h3 className="flex items-center gap-2 text-xl font-bold text-foreground">
          <ShieldCheck className="h-6 w-6 text-amber-400" />
          Verifica se i tuoi dati sono stati compromessi
        </h3>
        <p className="text-base text-muted-foreground">
          Controlla se il tuo indirizzo email o telefono compare in violazioni di dati note
        </p>
      </div>

      {/* HIBP main link card */}
      <div className="glass-card flex flex-col gap-4 p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <ExternalLink className="mt-0.5 h-5 w-5 shrink-0 text-cyan-400" />
          <div>
            <p className="text-lg font-semibold text-foreground">Have I Been Pwned</p>
            <p className="mt-1 text-base text-muted-foreground">
              Servizio gratuito e sicuro creato da Troy Hunt, esperto di sicurezza
            </p>
          </div>
        </div>
        <a
          href="https://haveibeenpwned.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="btn-primary flex items-center justify-center gap-2 text-base"
          style={{ minHeight: 48 }}
        >
          <ExternalLink className="h-5 w-5" aria-hidden="true" />
          Verifica su haveibeenpwned.com
        </a>
        <p className="flex items-center gap-1.5 text-sm text-muted-foreground/70">
          <CheckCircle2 className="h-4 w-4 text-green-400" />
          Il sito non salva le tue ricerche
        </p>
      </div>

      {/* How-to steps (collapsible) */}
      <CollapsibleSection title="Come controllare" icon={ShieldCheck} defaultOpen={false}>
        <ol className="flex flex-col gap-3">
          {HOW_TO_STEPS.map((step, i) => (
            <li key={i} className="flex items-start gap-3 text-base text-muted-foreground">
              <StepBadge n={i + 1} />
              <span className="pt-0.5">{step}</span>
            </li>
          ))}
        </ol>
      </CollapsibleSection>

      {/* Password check card */}
      <div className="glass-card flex flex-col gap-3 p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <KeyRound className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" />
          <div>
            <p className="text-lg font-semibold text-foreground">
              Verifica anche le tue password
            </p>
            <p className="mt-1 text-base text-muted-foreground">
              Controlla se le tue password sono apparse in violazioni note. Il sito usa un sistema
              sicuro (k-Anonymity) che non rivela mai la tua password.
            </p>
          </div>
        </div>
        <a
          href="https://haveibeenpwned.com/Passwords"
          target="_blank"
          rel="noopener noreferrer"
          className="btn-secondary flex items-center justify-center gap-2 text-base"
          style={{ minHeight: 44 }}
        >
          <ExternalLink className="h-5 w-5" aria-hidden="true" />
          Verifica password
        </a>
      </div>

      {/* Remediation (collapsible) */}
      <CollapsibleSection
        title="Cosa fare se i tuoi dati sono stati compromessi"
        icon={AlertTriangle}
      >
        <ol className="flex flex-col gap-3">
          {REMEDIATION_STEPS.map((step, i) => (
            <li key={i} className="flex items-start gap-3 text-base text-muted-foreground">
              <StepBadge n={i + 1} />
              <span className="pt-0.5">{step}</span>
            </li>
          ))}
        </ol>
      </CollapsibleSection>

      {/* Privacy notice */}
      <p className="text-center text-sm text-muted-foreground/60">
        Questa pagina non raccoglie né trasmette alcun dato. Le verifiche avvengono direttamente
        sul sito esterno.
      </p>
    </div>
  );
}
