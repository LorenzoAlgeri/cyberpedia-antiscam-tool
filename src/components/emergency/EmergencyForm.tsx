/**
 * Emergency contacts form — thin compositor.
 * Bank section and trusted contacts are extracted to dedicated files.
 *
 * C1: "Nome banca" field + explanatory text + label "Numero assistenza banca/carta"
 * C2: Country-code select (flag+prefix) separate from bare phone number
 * C3: Bank section has inline edit/view toggle — state owned by BankSection
 * C4: Green "[Allerta la banca]" CTA in view mode when phone is filled — in BankSection
 */

import type { TrustedContact } from '@/types/emergency';
import { BankSection } from './BankSection';
import { TrustedContactsSection } from './TrustedContactsSection';

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
  return (
    <div className="space-y-8">
      <BankSection
        bankName={bankName}
        bankCountryCode={bankCountryCode}
        bankPhone={bankPhone}
        onBankNameChange={onBankNameChange}
        onBankCountryCodeChange={onBankCountryCodeChange}
        onBankPhoneChange={onBankPhoneChange}
      />
      <TrustedContactsSection
        contacts={contacts}
        onContactChange={onContactChange}
        onAddContact={onAddContact}
        onRemoveContact={onRemoveContact}
      />
    </div>
  );
}
