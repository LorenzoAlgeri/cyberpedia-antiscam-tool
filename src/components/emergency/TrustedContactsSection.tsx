/**
 * Trusted contacts section — up to MAX_CONTACTS with edit/view toggle + call CTAs.
 *
 * Each contact mirrors the BankSection pattern:
 * - Edit mode: name + country-code + phone + confirm
 * - View mode: compact card + edit/delete + green call CTA
 */

import * as m from 'motion/react-m';
import { AnimatePresence } from 'motion/react';
import { Plus, Save } from 'lucide-react';
import type { TrustedContact } from '@/types/emergency';
import { MAX_CONTACTS } from '@/types/emergency';
import { TrustedContactRow } from './TrustedContactRow';

const contactVariants = {
  initial: { opacity: 0, height: 0, marginTop: 0 },
  animate: { opacity: 1, height: 'auto', marginTop: 16 },
  exit: { opacity: 0, height: 0, marginTop: 0 },
} as const;

interface TrustedContactsSectionProps {
  readonly contacts: readonly TrustedContact[];
  readonly onContactChange: (index: number, field: keyof TrustedContact, value: string) => void;
  readonly onAddContact: () => void;
  readonly onRemoveContact: (index: number) => void;
  readonly onSave: () => void;
}

export function TrustedContactsSection({
  contacts,
  onContactChange,
  onAddContact,
  onRemoveContact,
  onSave,
}: TrustedContactsSectionProps) {
  const canAddMore = contacts.length < MAX_CONTACTS;

  return (
    <section>
      <h3 className="mb-4 text-lg font-semibold text-foreground">
        Contatti di fiducia
      </h3>
      <p className="mb-4 text-base text-muted-foreground">
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
            <TrustedContactRow
              index={index}
              contact={contact}
              onChange={(field, value) => onContactChange(index, field, value)}
              onRemove={() => onRemoveContact(index)}
            />
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

      <m.button
        type="button"
        onClick={onSave}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.98 }}
        className="btn-outline-accent mt-4 flex w-full items-center justify-center gap-2"
        aria-label="Salva dati cifrati"
      >
        <Save className="h-5 w-5" />
        Salva
      </m.button>
    </section>
  );
}
