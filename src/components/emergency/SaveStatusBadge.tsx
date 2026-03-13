/**
 * Inline save-status indicator with animated transitions.
 *
 * Displays contextual feedback (/interaction-design):
 * - saving → spinning Loader2
 * - saved  → green Check with scale-in
 * - error  → amber AlertCircle
 * - idle   → nothing shown (intentional — clean header)
 *
 * Uses AnimatePresence mode="wait" for smooth cross-fade.
 */

import { motion, AnimatePresence } from 'motion/react';
import { Loader2, Check, AlertCircle } from 'lucide-react';
import type { SaveStatus } from '@/hooks/useAutoSave';

interface SaveStatusBadgeProps {
  readonly status: SaveStatus;
}

export function SaveStatusBadge({ status }: SaveStatusBadgeProps) {
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


      </AnimatePresence>
    </div>
  );
}
