/**
 * Emergency contacts form — bank anti-fraud number + up to 3 trusted contacts.
 *
 * Design rules (CLAUDE.md):
 * - NO labels above inputs — placeholder + helper text below only
 * - input-glass utility class for styling
 * - Touch targets min 44px
 * - inputMode="tel" for phone fields (mobile numeric keyboard)
 *
 * Form CRO principles:
 * - Start with 1 contact row, "Aggiungi contatto" to reveal more
 * - Inline helper text for guidance
 * - No submit button here — data flows up via onChange callback
 */

import { Plus, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import type { TrustedContact } from '@/types/emergency';
import { MAX_CONTACTS } from '@/types/emergency';

interface EmergencyFormProps {
  /** Current bank anti-fraud phone number */
  readonly bankPhone: string;
  /** Current list of trusted contacts */
  readonly contacts: readonly TrustedContact[];
  /** Called on every field change */
  readonly onBankPhoneChange: (value: string) => void;
  /** Called when a contact field changes */
  readonly onContactChange: (
    index: number,
    field: keyof TrustedContact,
    value: string,
  ) => void;
  /** Called to add a new empty contact row */
  readonly onAddContact: () => void;
  /** Called to remove a contact at the given index */
  readonly onRemoveContact: (index: number) => void;
}

/** Fade-slide animation for appearing/disappearing contact rows */
const contactVariants = {
  initial: { opacity: 0, height: 0, marginTop: 0 },
  animate: { opacity: 1, height: 'auto', marginTop: 16 },
  exit: { opacity: 0, height: 0, marginTop: 0 },
} as const;

export function EmergencyForm({
  bankPhone,
  contacts,
  onBankPhoneChange,
  onContactChange,
  onAddContact,
  onRemoveContact,
}: EmergencyFormProps) {
  const canAddMore = contacts.length < MAX_CONTACTS;

  return (
    <div className="space-y-8">
      {/* ── Bank anti-fraud phone ── */}
      <section>
        <input
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          className="input-glass"
          placeholder="Numero antifrode della tua banca"
          value={bankPhone}
          onChange={(e) => onBankPhoneChange(e.target.value)}
          aria-label="Numero antifrode della tua banca"
        />
        <p className="mt-2 px-2 text-sm text-muted-foreground">
          Lo trovi sul retro della carta o sull'app della banca
        </p>
      </section>

      {/* ── Trusted contacts ── */}
      <section>
        <h3 className="mb-4 text-lg font-semibold text-foreground">
          Contatti di fiducia
        </h3>
        <p className="mb-4 text-sm text-muted-foreground">
          Persone che puoi chiamare prima di agire. Max {MAX_CONTACTS}.
        </p>

        <AnimatePresence initial={false}>
          {contacts.map((contact, index) => (
            <motion.div
              key={index}
              variants={contactVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="overflow-hidden"
            >
              <div className="flex items-start gap-3">
                {/* Contact fields */}
                <div className="flex flex-1 flex-col gap-3 sm:flex-row">
                  <input
                    type="text"
                    className="input-glass flex-1"
                    placeholder={`Nome contatto ${index + 1}`}
                    value={contact.name}
                    onChange={(e) =>
                      onContactChange(index, 'name', e.target.value)
                    }
                    aria-label={`Nome contatto ${index + 1}`}
                  />
                  <input
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    className="input-glass flex-1"
                    placeholder="Numero di telefono"
                    value={contact.phone}
                    onChange={(e) =>
                      onContactChange(index, 'phone', e.target.value)
                    }
                    aria-label={`Telefono contatto ${index + 1}`}
                  />
                </div>

                {/* Remove button */}
                <button
                  type="button"
                  onClick={() => onRemoveContact(index)}
                  className="mt-3 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-secondary text-muted-foreground transition-colors hover:border-destructive/50 hover:text-destructive"
                  aria-label={`Rimuovi contatto ${index + 1}`}
                >
                  <Trash2 className="h-5 w-5" strokeWidth={1.5} />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Add contact button */}
        {canAddMore && (
          <motion.button
            type="button"
            onClick={onAddContact}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-white/15 bg-secondary/50 px-6 py-4 text-base font-medium text-muted-foreground transition-colors hover:border-cyan-brand/40 hover:text-foreground"
            style={{ minHeight: 44 }}
          >
            <Plus className="h-5 w-5" strokeWidth={1.5} />
            Aggiungi contatto
          </motion.button>
        )}
      </section>
    </div>
  );
}
