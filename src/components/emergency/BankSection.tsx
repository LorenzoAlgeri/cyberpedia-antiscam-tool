/**
 * Bank section of the emergency form.
 * C1: "Nome banca" field + explanatory text + label "Numero assistenza banca/carta"
 * C2: Country-code select (flag+prefix) separate from bare phone number
 * C3: Inline edit/view toggle — isBankEditing state is LOCAL (owned here).
 *     Auto-switches to view mode on mount when bankPhone already has a value.
 * C4: Green "[Allerta la banca]" CTA in view mode when phone is filled.
 *     Opens tel: link; on non-mobile shows window.confirm first.
 */

import { useCallback, useState } from 'react';
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

  const phoneHasSavedValue = bankPhone.trim() !== '';

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
              onChange={(e) => onBankNameChange(e.target.value)}
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
                onChange={(e) => onBankCountryCodeChange(e.target.value)}
                className="w-24 shrink-0 cursor-pointer rounded-2xl border-2 border-white/10 bg-slate-900/60 px-3 font-medium text-foreground transition-colors duration-200 focus-visible:border-cyan-brand focus-visible:outline-none focus-visible:ring-4"
                style={{ minHeight: 44 }}
              >
                {COUNTRY_CODES.map(({ code, flag, label }) => (
                  <option key={code} value={code}>
                    {flag} {code} {label}
                  </option>
                ))}
              </select>
              <label htmlFor="bank-phone" className="sr-only">Numero assistenza banca/carta</label>
              <input
                id="bank-phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel-national"
                className="input-glass flex-1"
                placeholder="Numero assistenza banca/carta"
                value={bankPhone}
                onChange={(e) => onBankPhoneChange(e.target.value)}
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
            className="space-y-3"
          >
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
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-secondary text-muted-foreground transition-colors hover:border-cyan-brand/30 hover:text-cyan-brand focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-brand"
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
                    className="flex w-full items-center justify-center gap-2.5 rounded-2xl bg-green-600 px-5 py-4 text-base font-semibold text-white shadow-lg shadow-green-600/25 transition-colors hover:bg-green-500 active:scale-[0.98]"
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
  );
}
