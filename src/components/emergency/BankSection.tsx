/**
 * Bank section of the emergency form.
 * C1: "Nome banca" field + explanatory text + label "Numero assistenza banca/carta"
 * C2: Country-code select (flag+prefix) separate from bare phone number
 * C3: Inline edit/view toggle — isBankEditing state is LOCAL (owned here).
 *     Auto-switches to view mode on mount when bankPhone already has a value.
 * C4: Green "[Allerta la banca]" CTA in view mode when phone is filled.
 *     Opens tel: link; on non-mobile shows window.confirm first.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { Check, Edit2, Phone } from 'lucide-react';
import * as m from 'motion/react-m';
import { AnimatePresence } from 'motion/react';

const COUNTRY_CODES = [
  { code: '+39', flag: '🇮🇹', label: 'IT' },
  { code: '+41', flag: '🇨🇭', label: 'CH' },
  { code: '+33', flag: '🇫🇷', label: 'FR' },
  { code: '+49', flag: '🇩🇪', label: 'DE' },
  { code: '+34', flag: '🇪🇸', label: 'ES' },
  { code: '+44', flag: '🇬🇧', label: 'GB' },
  { code: '+1',  flag: '🇺🇸', label: 'US' },
] as const;

/** True when the current device is likely a phone/tablet */
function isMobileDevice(): boolean {
  return /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

export interface BankSectionProps {
  readonly bankName: string;
  readonly bankCountryCode: string;
  readonly bankPhone: string;
  readonly onBankNameChange: (value: string) => void;
  readonly onBankCountryCodeChange: (value: string) => void;
  readonly onBankPhoneChange: (value: string) => void;
}

export function BankSection({
  bankName,
  bankCountryCode,
  bankPhone,
  onBankNameChange,
  onBankCountryCodeChange,
  onBankPhoneChange,
}: BankSectionProps) {
  // C3: Starts in view mode if bankPhone already has a value (returning user /
  // auto-loaded session). Starts in edit mode only when the field is empty (new user).
  const [isBankEditing, setIsBankEditing] = useState(() => bankPhone.trim() === '');
  const userTouched = useRef(false);

  // Auto-close only for async data load (returning user). Once user has typed, skip.
  useEffect(() => {
    if (!userTouched.current && bankPhone.trim() !== '') {
      setIsBankEditing(false);
    }
  }, [bankPhone]);

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

  return (
    <section>
      <AnimatePresence mode="wait">
        {isBankEditing ? (
          <m.div
            key="bank-edit"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="space-y-3"
          >
            <label htmlFor="bank-name" className="sr-only">Nome banca</label>
            <input
              id="bank-name"
              type="text"
              className="input-glass"
              placeholder="Nome banca (es. Intesa Sanpaolo)"
              value={bankName}
              onChange={(e) => { userTouched.current = true; onBankNameChange(e.target.value); }}
              autoComplete="organization"
            />
            <p className="px-2 text-sm text-muted-foreground">
              Inserisci il numero della tua banca per trovarlo subito
              disponibile in caso di emergenza.
            </p>
            <div className="flex items-stretch gap-2">
              <label htmlFor="bank-country-code" className="sr-only">Prefisso internazionale</label>
              <select
                id="bank-country-code"
                value={bankCountryCode}
                onChange={(e) => { userTouched.current = true; onBankCountryCodeChange(e.target.value); }}
                className="w-[5.5rem] shrink-0 cursor-pointer rounded-2xl border-2 border-white/10 bg-slate-900/60 px-2 text-sm font-medium text-foreground transition-colors duration-200 sm:w-24 sm:px-3 sm:text-base focus-visible:border-cyan-brand focus-visible:outline-none focus-visible:ring-4"
                style={{ minHeight: 44 }}
              >
                {COUNTRY_CODES.map(({ code, flag }) => (
                  <option key={code} value={code}>
                    {flag} {code}
                  </option>
                ))}
              </select>
              <label htmlFor="bank-phone" className="sr-only">Numero assistenza banca/carta</label>
              <input
                id="bank-phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel-national"
                className="input-glass min-w-0 flex-1"
                placeholder="Numero assistenza"
                value={bankPhone}
                onChange={(e) => { userTouched.current = true; onBankPhoneChange(e.target.value); }}
              />
            </div>
            {/* C3: Full-width confirm button — feels mandatory */}
            <button
              type="button"
              onClick={confirmBankEdit}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-success px-5 py-4 text-base font-semibold text-white shadow-lg shadow-success/25 transition-colors hover:opacity-90 active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-success"
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
          <m.div
            key="bank-view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            {/* Green CTA with integrated info + edit pencil */}
            <div
              className="flex overflow-hidden rounded-2xl bg-green-600"
              style={{ minHeight: 44 }}
            >
              <a
                href={`tel:${bankCountryCode}${bankPhone}`}
                onClick={handleCallBank}
                className="flex min-w-0 flex-1 items-center gap-3 px-5 py-4 text-white transition-colors hover:bg-green-500 active:scale-[0.98]"
                aria-label={`Chiama il numero antifrode: ${bankCountryCode} ${bankPhone}`}
              >
                <Phone className="h-5 w-5 shrink-0" strokeWidth={2} />
                <div className="min-w-0">
                  <p className="text-base font-semibold leading-tight">
                    Allerta {bankName || 'la banca'}
                  </p>
                  <p className="truncate text-sm font-medium text-white/70">
                    {bankCountryCode}&nbsp;{bankPhone}
                  </p>
                </div>
              </a>
              <button
                type="button"
                onClick={() => { userTouched.current = true; setIsBankEditing(true); }}
                className="flex w-12 shrink-0 items-center justify-center border-l border-white/20 text-white/70 transition-colors hover:bg-green-500 hover:text-white"
                aria-label="Modifica numero banca"
              >
                <Edit2 className="h-4 w-4" strokeWidth={1.5} />
              </button>
            </div>
          </m.div>
        )}
      </AnimatePresence>
    </section>
  );
}
