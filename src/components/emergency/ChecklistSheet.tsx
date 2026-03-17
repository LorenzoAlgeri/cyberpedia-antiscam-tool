/**
 * ChecklistSheet — bottom-sheet modal that surfaces the TodoChecklist
 * from the first visible area of EmergencyPage. (Planning B3)
 *
 * UX goals:
 * - User opens checklist without scrolling down
 * - Slides up from bottom (mobile-native feel)
 * - Dismissible via X button or backdrop tap
 * - Max height 88dvh with internal scroll so checklist is never clipped
 *
 * /interaction-design: spring entrance, backdrop fade
 * /accessibility-compliance: focus trap, aria-modal, role="dialog"
 */

import { useCallback, useEffect, useRef } from 'react';
import * as m from 'motion/react-m';
import { AnimatePresence } from 'motion/react';
import { X, ClipboardList } from 'lucide-react';
import { useFocusTrap } from '@/hooks/useFocusTrap';
import { TodoChecklist } from '@/components/emergency/TodoChecklist';
import type { AttackType } from '@/types/emergency';

interface ChecklistSheetProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly selectedAttack: AttackType | null;
  readonly completedGeneric: readonly string[];
  readonly completedAttack: readonly string[];
  readonly onToggleGeneric: (id: string) => void;
  readonly onToggleAttack: (id: string) => void;
  /** Optional persisted answer from the returning-user gate */
  readonly victimStatus?: 'yes' | 'no' | null;
  /** Called when user changes "Hai subito una truffa?" inline — propagates to App state + localStorage */
  readonly onIncidentChange?: (v: 'yes' | 'no') => void;
  /** Bank contact info — forwarded to TodoChecklist for the severe-action banner */
  readonly bankPhone?: string;
  readonly bankCountryCode?: string;
  readonly bankName?: string;
}

export function ChecklistSheet({
  open,
  onClose,
  selectedAttack,
  completedGeneric,
  completedAttack,
  onToggleGeneric,
  onToggleAttack,
  victimStatus = null,
  onIncidentChange,
}: ChecklistSheetProps) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);

  const stableClose = useCallback(() => onClose(), [onClose]);
  useFocusTrap(sheetRef, open, stableClose);

  // Lock body scroll while open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = ''; };
    }
  }, [open]);

  const doneGeneric = completedGeneric.length;
  const doneAttack = completedAttack.length;
  const totalDone = doneGeneric + doneAttack;

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <m.div
            key="backdrop"
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Sheet panel */}
          <m.div
            ref={sheetRef}
            key="sheet"
            role="dialog"
            aria-modal="true"
            aria-label="Checklist azioni anti-truffa"
            className="fixed bottom-0 left-1/2 z-50 w-full max-w-2xl -translate-x-1/2
                       flex max-h-[88dvh] flex-col
                       rounded-t-3xl bg-slate-900 shadow-2xl shadow-black/50
                       border border-slate-700/50"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 380, damping: 38 }}
          >
            {/* Sheet header */}
            <div className="flex items-center justify-between border-b border-slate-700/50 px-5 py-4 shrink-0">
              <div className="flex items-center gap-2.5">
                <ClipboardList
                  className="h-5 w-5 text-cyan-brand"
                  aria-hidden="true"
                />
                <h2 className="text-lg font-semibold text-foreground">
                  Checklist azioni
                </h2>
                {totalDone > 0 && (
                  <span className="rounded-full bg-success/20 px-2 py-0.5 text-sm font-medium text-success">
                    {totalDone} fatte
                  </span>
                )}
              </div>
              <button
                ref={closeRef}
                type="button"
                onClick={onClose}
                className="flex h-11 w-11 items-center justify-center rounded-full
                           text-muted-foreground transition-colors hover:bg-white/10
                           hover:text-foreground focus-visible:outline focus-visible:outline-2
                           focus-visible:outline-cyan-brand"
                aria-label="Chiudi checklist"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>

            {/* Scrollable checklist */}
            <div className="overflow-y-auto px-4 py-4">
              <TodoChecklist
                selectedAttack={selectedAttack}
                completedGeneric={completedGeneric}
                completedAttack={completedAttack}
                onToggleGeneric={onToggleGeneric}
                onToggleAttack={onToggleAttack}
                incidentStatus={victimStatus === 'yes' ? 'yes' : 'no'}
                showIncidentToggle={true}
                {...(onIncidentChange !== undefined ? { onIncidentChange } : {})}
              />
            </div>
          </m.div>
        </>
      )}
    </AnimatePresence>
  );
}
