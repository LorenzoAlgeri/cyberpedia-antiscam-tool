/**
 * Emergency contacts form — bank section + trusted contacts.
 *
 * C1: "Nome banca" field + explanatory text + label "Numero assistenza banca/carta"
 * C2: Country-code select (flag+prefix) separate from bare phone number
 * C3: Bank section has inline edit/view toggle (pencil → edit, check → view)
 *     State is LOCAL — no standalone "Salva" button for this section.
 *     Auto-switches to view mode the first time props arrive with saved data.
 * C4: Green "[Allerta la banca]" CTA appears in view mode when phone is filled.
 *     Opens tel: link; on non-mobile shows window.confirm first.
 */

import { useCallback, useState } from 'react';
import { BookUser, Check, Edit2, Phone, Plus, Trash2 } from 'lucide-react';
import * as m from 'motion/react-m';
import { AnimatePresence } from 'motion/react';
import { useContactPicker } from '@/hooks/useContactPicker';
import type { TrustedContact } from '@/types/emergency';
import { MAX_CONTACTS } from '@/types/emergency';

// ---------------------------------------------------------------------------
// Country codes
// ---------------------------------------------------------------------------

const COUNTRY_CODES = [
  { code: '+39', flag: '🇮🇹', label: 'IT' },
  { code: '+41', flag: '🇨🇭', label: 'CH' },
  { code: '+33', flag: '🇫🇷', label: 'FR' },
  { code: '+49', flag: '🇩🇪', label: 'DE' },
  { code: '+34', flag: '🇪🇸', label: 'ES' },
  { code: '+44', flag: '🇬🇧', label: 'GB' },
  { code: '+1',  flag: '🇺🇸', label: 'US' },
] as const;

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface EmergencyFormProps {
  readonly bankName: string;
  readonly bankCountryCode: string;
  readonly bankPhone: string;
  readonly contacts: readonly TrustedContact[];
  readonly onBankNameChange: (value: string) => void;
  readonly onBankCountryCodeChange: (value: string) => void;
  readonly onBankPhoneChange: (value: string) => void;
  readonly onContactChange: (
    index: number,
    field: keyof TrustedContact,
    value: string,
  ) => void;
  readonly onAddContact: () => void;
  readonly onRemoveContact: (index: number) => void;
}

// ---------------------------------------------------------------------------
// Animation variants
// ---------------------------------------------------------------------------

const contactVariants = {
  initial: { opacity: 0, height: 0, marginTop: 0 },
  animate: { opacity: 1, height: 'auto', marginTop: 16 },
  exit: { opacity: 0, height: 0, marginTop: 0 },
} as const;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** True when the current device is likely a phone/tablet */
function isMobileDevice(): boolean {
  return /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function EmergencyForm({
  bankName,
  bankCountryCode,
  bankPhone,
  contacts,
  onBankNameChange,
  onBankCountryCodeChange,
  onBankPhoneChange,
  onContactChange,
  onAddContact,
  onRemoveContact,
}: EmergencyFormProps) {
  const canAddMore = contacts.length < MAX_CONTACTS;
  const { isSupported, pickContact } = useContactPicker();
  const [pickingIndex, setPickingIndex] = useState<number | null>(null);

  // C3: local edit/view toggle for the bank section.
  // Starts in view mode if bankPhone already has a value (returning user /
  // auto-loaded session) so the confirm button doesn't re-appear on remount.
  // Starts in edit mode only when the field is empty (new user).
  const [isBankEditing, setIsBankEditing] = useState(() => bankPhone.trim() === '');

  const confirmBankEdit = useCallback(() => {
    setIsBankEditing(false);
  }, []);

  // C4: call the bank — confirm on desktop, direct dial on mobile
  const handleCallBank = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>) => {
      if (!isMobileDevice()) {
        e.preventDefault();
        const displayNumber = `${bankCountryCode} ${bankPhone}`;
        if (window.confirm(`Vuoi chiamare il numero ${displayNumber}?`)) {
          window.location.href = `tel:${bankCountryCode}${bankPhone}`;
        }
      }
    },
    [bankCountryCode, bankPhone],
  );

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

  const phoneHasSavedValue = bankPhone.trim() !== '';

  return (
    <div className="space-y-8">
      {/* ── Bank section (C1 + C2 + C3 + C4) ── */}
      <section>
        <AnimatePresence mode="wait">
          {isBankEditing ? (
            /* ── EDIT MODE ── */
            <m.div
              key="bank-edit"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="space-y-3"
            >
              {/* Bank name */}
              <input
                type="text"
                className="input-glass"
                placeholder="Nome banca (es. Intesa Sanpaolo)"
                value={bankName}
                onChange={(e) => onBankNameChange(e.target.value)}
                aria-label="Nome banca"
                autoComplete="organization"
              />

              {/* Context text */}
              <p className="px-2 text-sm text-muted-foreground">
                Inserisci il numero della tua banca per trovarlo subito
                disponibile in caso di emergenza.
              </p>

              {/* Country code + phone */}
              <div className="flex items-stretch gap-2">
                <select
                  value={bankCountryCode}
                  onChange={(e) => onBankCountryCodeChange(e.target.value)}
                  aria-label="Prefisso internazionale"
                  className="w-24 shrink-0 cursor-pointer rounded-2xl border-2 border-white/10
                             bg-slate-900/60 px-3 font-medium text-foreground
                             transition-colors duration-200
                             focus-visible:border-cyan-brand focus-visible:outline-none
                             focus-visible:ring-4"
                  style={{ minHeight: 44 }}
                >
                  {COUNTRY_CODES.map(({ code, flag, label }) => (
                    <option key={code} value={code}>
                      {flag} {code} {label}
                    </option>
                  ))}
                </select>

                <input
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel-national"
                  className="input-glass flex-1"
                  placeholder="Numero assistenza banca/carta"
                  value={bankPhone}
                  onChange={(e) => onBankPhoneChange(e.target.value)}
                  aria-label="Numero assistenza banca/carta"
                />
              </div>

              {/* C3: Full-width confirm button — feels mandatory */}
              <button
                type="button"
                onClick={confirmBankEdit}
                className="flex w-full items-center justify-center gap-2
                           rounded-2xl bg-success px-5 py-4
                           text-base font-semibold text-white shadow-lg
                           shadow-success/25 transition-colors
                           hover:opacity-90 active:scale-[0.98]
                           focus-visible:outline focus-visible:outline-2
                           focus-visible:outline-success"
                style={{ minHeight: 44 }}
                aria-label="Conferma numero banca"
              >
                <Check className="h-5 w-5 shrink-0" strokeWidth={2.5} />
                Conferma numero banca
              </button>

              <p className="px-2 text-sm text-muted-foreground">
                Lo trovi sul retro della carta o sull&apos;app della banca.
              </p>
            </m.div>
          ) : (
            /* ── VIEW MODE ── */
            <m.div
              key="bank-view"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="space-y-3"
            >
              {/* Saved data display + edit button */}
              <div className="flex items-start justify-between gap-3 rounded-2xl
                              border border-white/10 bg-white/5 px-4 py-3">
                <div className="min-w-0 space-y-0.5">
                  {bankName && (
                    <p className="text-sm font-medium text-foreground">
                      {bankName}
                    </p>
                  )}
                  <p className={`font-mono text-base ${bankName ? 'text-muted-foreground' : 'text-foreground font-medium'}`}>
                    {bankCountryCode}&nbsp;{bankPhone || '—'}
                  </p>
                </div>

                {/* C3: Edit (pencil) icon */}
                <button
                  type="button"
                  onClick={() => setIsBankEditing(true)}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl
                             border border-white/10 bg-secondary text-muted-foreground
                             transition-colors hover:border-cyan-brand/30 hover:text-cyan-brand
                             focus-visible:outline focus-visible:outline-2
                             focus-visible:outline-cyan-brand"
                  aria-label="Modifica numero banca"
                >
                  <Edit2 className="h-4 w-4" strokeWidth={1.5} />
                </button>
              </div>

              {/* C4: Green CTA — only when phone is saved */}
              <AnimatePresence>
                {phoneHasSavedValue && (
                  <m.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.2 }}
                  >
                    <a
                      href={`tel:${bankCountryCode}${bankPhone}`}
                      onClick={handleCallBank}
                      className="flex w-full items-center justify-center gap-2.5
                                 rounded-2xl bg-green-600 px-5 py-4
                                 text-base font-semibold text-white shadow-lg
                                 shadow-green-600/25 transition-colors
                                 hover:bg-green-500 active:scale-[0.98]"
                      style={{ minHeight: 44 }}
                      aria-label={`Chiama il numero antifrode: ${bankCountryCode} ${bankPhone}`}
                    >
                      <Phone className="h-5 w-5 shrink-0" strokeWidth={2} />
                      Allerta la banca
                    </a>
                  </m.div>
                )}
              </AnimatePresence>
            </m.div>
          )}
        </AnimatePresence>
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
    </div>
  );
}
