/**
 * TrustedContactRow — single contact with edit/view toggle + call CTA.
 *
 * Mirrors BankSection pattern:
 * - Edit mode: name + country-code select + phone + confirm button
 * - View mode: compact card (name + phone) + edit + delete buttons
 * - Green "Chiama [name]" CTA when phone is saved
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { BookUser, Check, Edit2, Phone, Trash2 } from 'lucide-react';
import * as m from 'motion/react-m';
import { AnimatePresence } from 'motion/react';
import type { TrustedContact } from '@/types/emergency';
import { useContactPicker } from '@/hooks/useContactPicker';

const COUNTRY_CODES = [
  { code: '+39', flag: '🇮🇹' },
  { code: '+41', flag: '🇨🇭' },
  { code: '+33', flag: '🇫🇷' },
  { code: '+49', flag: '🇩🇪' },
  { code: '+34', flag: '🇪🇸' },
  { code: '+44', flag: '🇬🇧' },
  { code: '+1',  flag: '🇺🇸' },
] as const;

function isMobileDevice(): boolean {
  return /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

interface TrustedContactRowProps {
  readonly index: number;
  readonly contact: TrustedContact;
  readonly onChange: (field: keyof TrustedContact, value: string) => void;
  readonly onRemove: () => void;
}

export function TrustedContactRow({
  index,
  contact,
  onChange,
  onRemove,
}: TrustedContactRowProps) {
  const [isEditing, setIsEditing] = useState(() => contact.phone.trim() === '');
  const { isSupported: hasContactPicker, pickContact } = useContactPicker();
  const [isPicking, setIsPicking] = useState(false);
  // Tracks whether the user has typed/interacted. Once true, auto-close is disabled.
  const userTouched = useRef(false);

  useEffect(() => {
    // Auto-close only for async data load (returning user): phone goes from '' to a value
    // without user having typed anything. Once the user interacts, this is permanently disabled.
    if (!userTouched.current && contact.phone.trim() !== '') {
      queueMicrotask(() => setIsEditing(false));
    }
  }, [contact.phone]);

  const confirm = useCallback(() => setIsEditing(false), []);

  const handlePick = useCallback(async () => {
    setIsPicking(true);
    const picked = await pickContact();
    setIsPicking(false);
    if (!picked) return;
    if (picked.name) onChange('name', picked.name);
    if (picked.phone) onChange('phone', picked.phone);
  }, [pickContact, onChange]);

  const handleCall = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>) => {
      if (!isMobileDevice()) {
        e.preventDefault();
        const display = `${contact.countryCode} ${contact.phone}`;
        if (window.confirm(`Vuoi chiamare ${contact.name || 'il contatto'} al numero ${display}?`)) {
          window.location.href = `tel:${contact.countryCode}${contact.phone}`;
        }
      }
    },
    [contact],
  );

  const displayName = contact.name || `Contatto ${index + 1}`;

  return (
    <AnimatePresence mode="wait">
      {isEditing ? (
        <m.div
          key={`edit-${index}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="space-y-3"
        >
          <div className="flex items-start gap-2">
            {hasContactPicker && (
              <button
                type="button"
                onClick={() => void handlePick()}
                disabled={isPicking}
                className="mt-1 flex h-11 w-11 shrink-0 items-center justify-center
                           rounded-xl border border-white/10 bg-secondary
                           text-muted-foreground transition-colors
                           hover:border-cyan-brand/30 hover:text-cyan-brand
                           disabled:cursor-not-allowed disabled:opacity-40"
                aria-label={`Importa contatto ${index + 1} dalla rubrica`}
              >
                <BookUser className="h-5 w-5" strokeWidth={1.5} />
              </button>
            )}
            <div className="min-w-0 flex-1">
              <label htmlFor={`contact-name-${index}`} className="sr-only">
                {`Nome contatto ${index + 1}`}
              </label>
              <input
                id={`contact-name-${index}`}
                type="text"
                className="input-glass"
                placeholder={`Nome contatto ${index + 1}`}
                value={contact.name}
                onChange={(e) => { userTouched.current = true; onChange('name', e.target.value); }}
                autoComplete="name"
              />
            </div>
            <button
              type="button"
              onClick={onRemove}
              className="mt-1 flex h-11 w-11 shrink-0 items-center justify-center
                         rounded-xl border border-white/10 bg-secondary
                         text-muted-foreground transition-colors
                         hover:border-destructive/50 hover:text-destructive"
              aria-label={`Rimuovi contatto ${index + 1}`}
            >
              <Trash2 className="h-5 w-5" strokeWidth={1.5} />
            </button>
          </div>

          <div className="flex items-stretch gap-2">
            <label htmlFor={`contact-cc-${index}`} className="sr-only">
              Prefisso internazionale
            </label>
            <select
              id={`contact-cc-${index}`}
              value={contact.countryCode}
              onChange={(e) => { userTouched.current = true; onChange('countryCode', e.target.value); }}
              className="w-[5.5rem] shrink-0 cursor-pointer rounded-2xl border-2 border-white/10
                         bg-slate-900/60 px-2 text-base font-medium text-foreground
                         transition-colors duration-200 sm:w-24 sm:px-3 sm:text-lg
                         focus-visible:border-cyan-brand focus-visible:outline-none focus-visible:ring-4"
              style={{ minHeight: 44 }}
            >
              {COUNTRY_CODES.map(({ code, flag }) => (
                <option key={code} value={code}>
                  {flag} {code}
                </option>
              ))}
            </select>
            <label htmlFor={`contact-phone-${index}`} className="sr-only">
              {`Telefono contatto ${index + 1}`}
            </label>
            <input
              id={`contact-phone-${index}`}
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              className="input-glass min-w-0 flex-1"
              placeholder="Numero di telefono"
              value={contact.phone}
              onChange={(e) => { userTouched.current = true; onChange('phone', e.target.value); }}
            />
          </div>

          <button
            type="button"
            onClick={confirm}
            className="flex w-full items-center justify-center gap-2 rounded-2xl
                       bg-success px-5 py-4 text-base font-semibold text-white
                       shadow-lg shadow-success/25 transition-colors hover:opacity-90
                       active:scale-[0.98] focus-visible:outline focus-visible:outline-2
                       focus-visible:outline-success"
            style={{ minHeight: 44 }}
          >
            <Check className="h-5 w-5 shrink-0" strokeWidth={2.5} />
            Conferma contatto
          </button>
        </m.div>
      ) : (
        <m.div
          key={`view-${index}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          {/* Green CTA with info + edit pencil — delete outside */}
          <div className="flex gap-2" style={{ minHeight: 44 }}>
            <div
              className="flex min-w-0 flex-1 overflow-hidden rounded-2xl bg-green-600"
            >
              <a
                href={`tel:${contact.countryCode}${contact.phone}`}
                onClick={handleCall}
                className="flex min-w-0 flex-1 items-center gap-3 px-5 py-4 text-white transition-colors hover:bg-green-500 active:scale-[0.98]"
                aria-label={`Chiama ${displayName}: ${contact.countryCode} ${contact.phone}`}
              >
                <Phone className="h-5 w-5 shrink-0" strokeWidth={2} />
                <div className="min-w-0">
                  <p className="text-base font-semibold leading-tight">
                    Chiama {displayName}
                  </p>
                  <p className="truncate text-base font-medium text-white/70">
                    {contact.countryCode}&nbsp;{contact.phone}
                  </p>
                </div>
              </a>
              <button
                type="button"
                onClick={() => { userTouched.current = true; setIsEditing(true); }}
                className="flex w-12 shrink-0 items-center justify-center border-l border-white/20 text-white/70 transition-colors hover:bg-green-500 hover:text-white"
                aria-label={`Modifica contatto ${displayName}`}
              >
                <Edit2 className="h-4 w-4" strokeWidth={1.5} />
              </button>
            </div>
            <button
              type="button"
              onClick={onRemove}
              className="flex w-11 shrink-0 items-center justify-center rounded-xl
                         border border-white/10 bg-secondary text-muted-foreground
                         transition-colors hover:border-destructive/50 hover:text-destructive"
              aria-label={`Rimuovi contatto ${displayName}`}
            >
              <Trash2 className="h-4 w-4" strokeWidth={1.5} />
            </button>
          </div>
        </m.div>
      )}
    </AnimatePresence>
  );
}
