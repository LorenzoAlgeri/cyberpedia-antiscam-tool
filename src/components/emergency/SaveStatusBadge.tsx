/**
 * Inline save-status indicator with animated transitions.
 *
 * Displays contextual feedback (/interaction-design):
 * - idle + lastSaved → faded timestamp
 * - saving           → spinning Loader2
 * - saved            → green Check with scale-in
 * - error            → amber AlertCircle
 *
 * Uses AnimatePresence mode="wait" for smooth cross-fade.
 */

import { motion, AnimatePresence } from 'motion/react';
import { Loader2, Check, AlertCircle } from 'lucide-react';
import type { SaveStatus } from '@/hooks/useAutoSave';

interface SaveStatusBadgeProps {
  readonly status: SaveStatus;
  readonly lastSaved: string | null;
}

export function SaveStatusBadge({ status, lastSaved }: SaveStatusBadgeProps) {
  return (
    <div className="flex min-h-[24px] items-center" aria-live="polite">
      <AnimatePresence mode="wait">
        {status === 'saving' && (
          <motion.span
            key="saving"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            Salvataggio…
          </motion.span>
        )}

        {status === 'saved' && (
          <motion.span
            key="saved"
            className="inline-flex items-center gap-1.5 text-sm text-primary"
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <Check className="h-4 w-4" aria-hidden="true" />
            Salvato
          </motion.span>
        )}

        {status === 'error' && (
          <motion.span
            key="error"
            className="inline-flex items-center gap-1.5 text-sm text-destructive"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <AlertCircle className="h-4 w-4" aria-hidden="true" />
            Errore
          </motion.span>
        )}

        {status === 'idle' && lastSaved != null && (
          <motion.span
            key="idle"
            className="text-xs text-muted-foreground/60"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.6 }}
            exit={{ opacity: 0 }}
          >
            Ultimo salvataggio:{' '}
            {new Date(lastSaved).toLocaleTimeString('it-IT')}
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  );
}
