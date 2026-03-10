import { motion } from 'motion/react';
import { Lock, ShieldCheck } from 'lucide-react';
import { CyberpediaLogo } from '@/components/layout/CyberpediaLogo';

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
export function LandingPage({
  onNext,
  isReturningUser = false,
}: LandingPageProps) {
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
          <span className="text-cyan-brand">Sei al sicuro qui.</span>
        </h1>

        <p className="mx-auto max-w-lg text-lg leading-relaxed text-muted-foreground md:text-xl">
          Ti guideremo passo dopo passo per proteggerti
          da una possibile truffa, senza fretta.
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
          {isReturningUser ? 'Accedi ai tuoi dati' : 'Inizia ora'}
        </motion.button>
      </motion.div>

      {/* Trust signal — NO emoji, Lucide Lock icon */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.5 }}
        className="flex items-center gap-2 text-sm text-muted-foreground"
      >
        <Lock className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" />
        <span>I tuoi dati restano solo sul tuo dispositivo</span>
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
    </div>
  );
}
