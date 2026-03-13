import { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Lock, ShieldCheck, X } from 'lucide-react';
import { CyberpediaLogo } from '@/components/layout/CyberpediaLogo';
import { useFocusTrap } from '@/hooks/useFocusTrap';

interface LandingPageProps {
  readonly onNext: () => void;
  /** True if returning user has encrypted data in localStorage */
  readonly isReturningUser?: boolean;
}

/**
 * Step 1 — Emotional landing page.
 *
 * UX goal: de-escalate panic. The user may be scared, confused,
 * or pressured by a scammer RIGHT NOW. Every element must calm.
 *
 * Copy rules (CLAUDE.md voice):
 * - "Fermati", "Respira", "Sei al sicuro qui"
 * - NEVER "Attenzione!", "Pericolo!", urgency language
 * - Professional, reassuring, warm
 *
 * Returning user: if encrypted data exists in localStorage,
 * CTA changes to "Accedi ai tuoi dati" → skip to Step 2.
 */
// ---------------------------------------------------------------------------
// Privacy detail dialog (A4) — inline, no new routes
// ---------------------------------------------------------------------------

const PRIVACY_ITEMS = [
  {
    icon: '🔒',
    title: 'I tuoi contatti di emergenza',
    desc: 'Il numero della tua banca e i contatti di fiducia che inserisci, protetti da un PIN che solo tu conosci.',
  },
  {
    icon: '📋',
    title: 'Le tue preferenze',
    desc: 'La risposta a «Hai subito una truffa?» e il tipo di truffa selezionato, per mostrarti le azioni più utili.',
  },
  {
    icon: '📊',
    title: 'Statistiche anonime locali',
    desc: "Un contatore anonimo del tipo di truffa selezionato, salvato solo sul tuo dispositivo per migliorare l'app.",
  },
] as const;

function PrivacyDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const dialogRef = useRef<HTMLDivElement>(null);
  useFocusTrap(dialogRef, open, onClose);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 py-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Dialog card */}
          <motion.div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="privacy-dialog-title"
            className="glass-card relative z-10 w-full max-w-lg p-6 text-left sm:p-8"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          >
            {/* Header */}
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2
                  id="privacy-dialog-title"
                  className="text-xl font-bold text-foreground"
                >
                  Cosa salviamo sul tuo dispositivo
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Nessun dato viene inviato a server esterni. Tutto rimane nel
                  browser, sul tuo dispositivo.
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Chiudi"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full
                           text-muted-foreground transition-colors hover:bg-white/10
                           hover:text-foreground focus-visible:outline focus-visible:outline-2
                           focus-visible:outline-cyan-brand"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>

            {/* Plain-language privacy items */}
            <ul className="space-y-3">
              {PRIVACY_ITEMS.map(({ icon, title, desc }) => (
                <li
                  key={title}
                  className="flex items-start gap-3 rounded-2xl border border-white/5 bg-white/5 px-4 py-3"
                >
                  <span className="mt-0.5 text-xl leading-none" aria-hidden="true">
                    {icon}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {title}
                    </p>
                    <p className="mt-0.5 text-sm leading-relaxed text-muted-foreground">
                      {desc}
                    </p>
                  </div>
                </li>
              ))}
            </ul>

            {/* Close CTA */}
            <button
              type="button"
              onClick={onClose}
              className="btn-primary mt-6 w-full"
            >
              Capito
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ---------------------------------------------------------------------------
// LandingPage
// ---------------------------------------------------------------------------

export function LandingPage({
  onNext,
  isReturningUser = false,
}: LandingPageProps) {
  const [showPrivacy, setShowPrivacy] = useState(false);

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-10 py-12 text-center">
      {/* Cyberpedia brand logo */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-col items-center gap-5"
      >
        <CyberpediaLogo width={220} showTagline className="sm:w-[280px]" />

        {/* Shield icon with glow */}
        <div className="relative flex h-16 w-16 items-center justify-center">
          <span
            className="absolute inset-0 rounded-full opacity-30 blur-xl"
            style={{ background: 'oklch(0.82 0.09 200 / 40%)' }}
            aria-hidden="true"
          />
          <div className="relative flex h-16 w-16 items-center justify-center rounded-full border border-cyan-brand/20 bg-cyan-brand/10">
            <ShieldCheck
              className="h-8 w-8 text-cyan-brand"
              strokeWidth={1.5}
              aria-hidden="true"
            />
          </div>
        </div>
      </motion.div>

      {/* Headline — staggered entrance */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
        className="space-y-5"
      >
        <h1 className="text-4xl font-bold leading-tight tracking-tight text-foreground sm:text-5xl md:text-6xl">
          Fermati. Respira.
          <br />
          <span className="font-normal">
            Prima{' '}
            <strong className="font-bold text-cyan-brand">verifica</strong>
            . Poi decidi.
          </span>
        </h1>

        <p className="mx-auto max-w-lg text-lg leading-relaxed text-muted-foreground md:text-xl">
          Ti aiutiamo a vedere i segnali e fare la prossima mossa giusta,
          prima che il danno diventi reale.
        </p>
      </motion.div>

      {/* CTA — single large button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
      >
        <motion.button
          type="button"
          onClick={onNext}
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.98 }}
          transition={{ type: 'spring', stiffness: 400, damping: 17 }}
          className="btn-primary text-xl"
        >
          {isReturningUser ? 'Apri la tua difesa' : 'Inizia il check (60 sec)'}
        </motion.button>
      </motion.div>

      {/* Trust signal — NO emoji, Lucide Lock icon */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.5 }}
        className="flex items-center gap-2 text-sm text-muted-foreground"
      >
        <Lock className="h-4 w-4 shrink-0" strokeWidth={1.5} aria-hidden="true" />
        <span>
          Privacy: tutto resta sul tuo telefono.{' '}
          <button
            type="button"
            className="underline underline-offset-2 transition-colors hover:text-foreground"
            onClick={() => setShowPrivacy(true)}
          >
            (Dettagli)
          </button>
        </span>
      </motion.div>

      {/* Returning user hint */}
      {isReturningUser && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.6 }}
          className="text-sm text-cyan-brand/70"
        >
          Bentornato — i tuoi dati salvati sono al sicuro.
        </motion.p>
      )}

      {/* A4 — Privacy detail dialog */}
      <PrivacyDialog open={showPrivacy} onClose={() => setShowPrivacy(false)} />
    </div>
  );
}
