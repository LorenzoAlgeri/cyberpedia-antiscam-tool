/**
 * PIN entry dialog — modal overlay for creating or unlocking a PIN.
 *
 * Two modes:
 * - 'create': user sets a new 4–6 digit PIN (first save)
 * - 'unlock': user enters existing PIN to decrypt stored data
 *
 * UX notes (/form-cro + /interaction-design):
 * - Single input, no confirm step (user may be in panic)
 * - inputMode="numeric" for mobile number pad
 * - Auto-focus on open, spring entrance animation
 * - Error state for wrong PIN with AlertCircle icon
 * - Touch target ≥ 44px on all interactive elements
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import * as m from 'motion/react-m';
import { AnimatePresence } from 'motion/react';
import { Lock, AlertCircle, KeyRound } from 'lucide-react';
import { isValidPin } from '@/lib/encryption';
import { useFocusTrap } from '@/hooks/useFocusTrap';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type PinMode = 'create' | 'unlock';

interface PinDialogProps {
  readonly open: boolean;
  readonly mode: PinMode;
  readonly error: string | null;
  readonly onSubmit: (pin: string) => void;
  readonly onCancel: () => void;
}

// ---------------------------------------------------------------------------
// Copy (Italian)
// ---------------------------------------------------------------------------

const COPY: Record<PinMode, { title: string; description: string; cta: string }> = {
  create: {
    title: 'Crea un PIN di sicurezza',
    description:
      'Scegli un PIN da 4 a 6 cifre per proteggere i tuoi dati. Ricordalo: servirà per accedere di nuovo.',
    cta: 'Salva PIN',
  },
  unlock: {
    title: 'Inserisci il tuo PIN',
    description: 'Inserisci il PIN per sbloccare i tuoi dati salvati.',
    cta: 'Sblocca',
  },
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function PinDialog({ open, mode, error, onSubmit, onCancel }: PinDialogProps) {
  const [pin, setPin] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  // Reset + auto-focus when dialog opens
  // setPin deferred to avoid synchronous setState inside effect body
  useEffect(() => {
    if (open) {
      const tPin   = setTimeout(() => setPin(''), 0);
      const tFocus = setTimeout(() => inputRef.current?.focus(), 120);
      return () => {
        clearTimeout(tPin);
        clearTimeout(tFocus);
      };
    }
  }, [open]);

  // Focus trap: keep Tab within dialog + Escape to close
  const stableCancel = useCallback(() => onCancel(), [onCancel]);
  useFocusTrap(dialogRef, open, stableCancel);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isValidPin(pin)) onSubmit(pin);
  };

  const { title, description, cta } = COPY[mode];

  return (
    <AnimatePresence>
      {open && (
        <m.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {/* Backdrop */}
          <m.div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onCancel}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* Dialog card */}
          <m.div
            ref={dialogRef}
            className="glass-card relative z-10 w-full max-w-sm p-6 sm:p-8"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="pin-dialog-title"
          >
            {/* Icon + heading */}
            <div className="mb-6 flex flex-col items-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
                {mode === 'create' ? (
                  <KeyRound className="h-7 w-7 text-primary" aria-hidden="true" />
                ) : (
                  <Lock className="h-7 w-7 text-primary" aria-hidden="true" />
                )}
              </div>
              <h3
                id="pin-dialog-title"
                className="text-xl font-bold text-foreground"
              >
                {title}
              </h3>
              <p className="text-center text-sm text-muted-foreground">
                {description}
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <input
                  ref={inputRef}
                  type="password"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  minLength={4}
                  maxLength={6}
                  value={pin}
                  onChange={(e) => {
                    const v = e.target.value.replace(/\D/g, '').slice(0, 6);
                    setPin(v);
                  }}
                  className="input-glass w-full text-center text-2xl tracking-[0.5em]"
                  placeholder="• • • •"
                  aria-label="PIN di sicurezza"
                  autoComplete="off"
                />
                {error && (
                  <m.p
                    className="mt-2 flex items-center gap-1.5 text-sm text-destructive"
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
                    {error}
                  </m.p>
                )}
              </div>

              <button
                type="submit"
                disabled={!isValidPin(pin)}
                className="btn-primary disabled:cursor-not-allowed disabled:opacity-50"
              >
                {cta}
              </button>

              <button
                type="button"
                onClick={onCancel}
                className="rounded-2xl px-4 py-3 text-sm text-muted-foreground transition-colors hover:text-foreground"
                style={{ minHeight: 44 }}
              >
                Annulla
              </button>
            </form>
          </m.div>
        </m.div>
      )}
    </AnimatePresence>
  );
}
