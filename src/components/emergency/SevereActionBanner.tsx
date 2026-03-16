/**
 * SevereActionBanner — inline micro-action box shown when a severe todo item is checked.
 * Provides a call-to-action to contact the bank or Polizia Postale.
 */

import { useState } from 'react';
import * as m from 'motion/react-m';
import { X, Phone } from 'lucide-react';

export interface SevereActionBannerProps {
  bankName?: string;
  bankPhone?: string;
  bankCountryCode?: string;
  onDismiss: () => void;
}

export function SevereActionBanner({
  bankName,
  bankPhone,
  bankCountryCode = '+39',
  onDismiss,
}: SevereActionBannerProps) {
  const [copied, setCopied] = useState(false);
  const hasBankPhone = !!bankPhone?.trim();
  const telHref = hasBankPhone
    ? `tel:${bankCountryCode}${bankPhone!.replace(/\s/g, '')}`
    : 'tel:800288883';
  const ctaLabel = hasBankPhone ? `Chiama ${bankName || 'la banca'}` : 'Chiama Polizia Postale';

  const handleCopy = async () => {
    const number = hasBankPhone
      ? `${bankCountryCode}${bankPhone!.replace(/\s/g, '')}`
      : '800288883';
    try {
      await navigator.clipboard.writeText(number);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard not available (e.g. HTTP)
    }
  };

  return (
    <m.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
      className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4"
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <p className="text-sm font-semibold text-amber-300">
          {hasBankPhone
            ? `Chiama subito ${bankName || 'la tua banca'} per bloccare eventuali operazioni.`
            : 'Contatta subito la tua banca o la Polizia Postale.'}
        </p>
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Chiudi avviso"
          className="shrink-0 rounded-full p-1 text-muted-foreground transition-colors hover:text-foreground"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        <a
          href={telHref}
          className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500/20 px-4 py-2 text-sm font-semibold text-amber-300 transition-colors hover:bg-amber-500/30"
          style={{ minHeight: 44 }}
        >
          <Phone className="h-4 w-4" aria-hidden="true" />
          {ctaLabel}
        </a>
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex items-center rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          style={{ minHeight: 44 }}
        >
          {copied ? 'Copiato!' : 'Copia numero'}
        </button>
      </div>
    </m.div>
  );
}
