/**
 * Trusted contacts section of the emergency form.
 *
 * Renders up to MAX_CONTACTS contact rows with name + phone inputs.
 * Supports native Contact Picker API via useContactPicker (Android Chrome only).
 * pickingIndex local state tracks which row is awaiting a picker result.
 */

import { useCallback, useState } from 'react';
import { BookUser, Plus, Trash2 } from 'lucide-react';
import * as m from 'motion/react-m';
import { AnimatePresence } from 'motion/react';
import { useContactPicker } from '@/hooks/useContactPicker';
import type { TrustedContact } from '@/types/emergency';
import { MAX_CONTACTS } from '@/types/emergency';

// ---------------------------------------------------------------------------
// Animation variants
// ---------------------------------------------------------------------------

const contactVariants = {
  initial: { opacity: 0, height: 0, marginTop: 0 },
  animate: { opacity: 1, height: 'auto', marginTop: 16 },
  exit: { opacity: 0, height: 0, marginTop: 0 },
} as const;

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface TrustedContactsSectionProps {
  readonly contacts: readonly TrustedContact[];
  readonly onContactChange: (index: number, field: keyof TrustedContact, value: string) => void;
  readonly onAddContact: () => void;
  readonly onRemoveContact: (index: number) => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function TrustedContactsSection({
  contacts,
  onContactChange,
  onAddContact,
  onRemoveContact,
}: TrustedContactsSectionProps) {
  const canAddMore = contacts.length < MAX_CONTACTS;
  const { isSupported, pickContact } = useContactPicker();
  const [pickingIndex, setPickingIndex] = useState<number | null>(null);

  const handlePickContact = useCallback(
    async (index: number) => {
      setPickingIndex(index);
      const picked = await pickContact();
      setPickingIndex(null);
      if (!picked) return;
      if (picked.name) onContactChange(index, 'name', picked.name);
      if (picked.phone) onContactChange(index, 'phone', picked.phone);
    },
    [pickContact, onContactChange],
  );

  return (
    <section>
      <h3 className="mb-4 text-lg font-semibold text-foreground">
        Contatti di fiducia
      </h3>
      <p className="mb-4 text-sm text-muted-foreground">
        Persone che puoi chiamare prima di agire. Max {MAX_CONTACTS}.
      </p>

      <AnimatePresence initial={false}>
        {contacts.map((contact, index) => (
          <m.div
            key={index}
            variants={contactVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div className="flex items-start gap-3">
              {isSupported && (
                <button
                  type="button"
                  onClick={() => void handlePickContact(index)}
                  disabled={pickingIndex !== null}
                  className="mt-3 flex h-11 w-11 shrink-0 items-center justify-center
                             rounded-xl border border-white/10 bg-secondary
                             text-muted-foreground transition-colors
                             hover:border-cyan-brand/30 hover:text-cyan-brand
                             disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label={`Importa contatto ${index + 1} dalla rubrica`}
                >
                  <BookUser className="h-5 w-5" strokeWidth={1.5} />
                </button>
              )}

              <div className="flex flex-1 flex-col gap-3 sm:flex-row">
                <label htmlFor={`contact-name-${index}`} className="sr-only">{`Nome contatto ${index + 1}`}</label>
                <input
                  id={`contact-name-${index}`}
                  type="text"
                  className="input-glass flex-1"
                  placeholder={`Nome contatto ${index + 1}`}
                  value={contact.name}
                  onChange={(e) =>
                    onContactChange(index, 'name', e.target.value)
                  }
                />
                <label htmlFor={`contact-phone-${index}`} className="sr-only">{`Telefono contatto ${index + 1}`}</label>
                <input
                  id={`contact-phone-${index}`}
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  className="input-glass flex-1"
                  placeholder="Numero di telefono"
                  value={contact.phone}
                  onChange={(e) =>
                    onContactChange(index, 'phone', e.target.value)
                  }
                />
              </div>

              <button
                type="button"
                onClick={() => onRemoveContact(index)}
                className="mt-3 flex h-11 w-11 shrink-0 items-center justify-center
                           rounded-xl border border-white/10 bg-secondary
                           text-muted-foreground transition-colors
                           hover:border-destructive/50 hover:text-destructive"
                aria-label={`Rimuovi contatto ${index + 1}`}
              >
                <Trash2 className="h-5 w-5" strokeWidth={1.5} />
              </button>
            </div>
          </m.div>
        ))}
      </AnimatePresence>

      {canAddMore && (
        <m.button
          type="button"
          onClick={onAddContact}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl
                     border-2 border-dashed border-white/15 bg-secondary/50 px-6 py-4
                     text-base font-medium text-muted-foreground transition-colors
                     hover:border-cyan-brand/40 hover:text-foreground"
          style={{ minHeight: 44 }}
        >
          <Plus className="h-5 w-5" strokeWidth={1.5} />
          Aggiungi contatto
        </m.button>
      )}
    </section>
  );
}
