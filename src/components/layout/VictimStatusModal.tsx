import { useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldCheck, AlertTriangle } from 'lucide-react';
import type { VictimStatus } from '@/lib/victimStatus';

interface VictimStatusModalProps {
  readonly open: boolean;
  readonly onSelect: (value: VictimStatus) => void;
  readonly onClose?: () => void;
}

export function VictimStatusModal({ open, onSelect, onClose }: VictimStatusModalProps) {
  const firstBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => firstBtnRef.current?.focus(), 120);
    return () => clearTimeout(t);
  }, [open]);

  const handleBackdrop = useCallback(() => {
    onClose?.();
  }, [onClose]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="backdrop"
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={handleBackdrop}
            aria-hidden="true"
          />

          <motion.div
            key="panel"
            role="dialog"
            aria-modal="true"
            aria-label="Hai subito una truffa?"
            className="fixed left-1/2 top-1/2 z-[60] w-[92vw] max-w-md -translate-x-1/2 -translate-y-1/2
                       rounded-3xl border border-slate-700/50 bg-slate-900/90 p-6 shadow-2xl backdrop-blur-xl"
            initial={{ opacity: 0, scale: 0.96, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: 10 }}
            transition={{ type: 'spring', stiffness: 420, damping: 34 }}
          >
            <div className="flex items-start gap-3">
              <div className="mt-1 flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-brand/10">
                <AlertTriangle className="h-5 w-5 text-cyan-brand" aria-hidden="true" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-foreground">
                  Hai subito una truffa?
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Scegli la modalità giusta: prevenzione o intervento.
                </p>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <button
                ref={firstBtnRef}
                type="button"
                onClick={() => onSelect('no')}
                className="flex items-center justify-center gap-2 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-5 py-4
                           text-lg font-medium text-emerald-200 transition-colors hover:bg-emerald-500/15"
                style={{ minHeight: 44 }}
              >
                <ShieldCheck className="h-5 w-5" aria-hidden="true" />
                No
              </button>
              <button
                type="button"
                onClick={() => onSelect('yes')}
                className="flex items-center justify-center gap-2 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-5 py-4
                           text-lg font-medium text-rose-200 transition-colors hover:bg-rose-500/15"
                style={{ minHeight: 44 }}
              >
                <AlertTriangle className="h-5 w-5" aria-hidden="true" />
                Sì
              </button>
            </div>

            <p className="mt-4 text-xs text-muted-foreground/70">
              Puoi cambiare risposta in seguito.
            </p>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

