import { useState, useCallback } from 'react';
import { EmergencyForm } from '@/components/emergency/EmergencyForm';
import type { TrustedContact } from '@/types/emergency';

interface EmergencyPageProps {
  readonly onNext: () => void;
  readonly onBack: () => void;
}

/**
 * Step 2 — Emergency data + To-Do checklist.
 *
 * State managed locally with useState:
 * - bankPhone: string
 * - contacts: TrustedContact[]
 *
 * TODO (Week 2 points 6-8): AttackTypeSelector, TodoChecklist, auto-save
 */
export function EmergencyPage({ onNext, onBack }: EmergencyPageProps) {
  const [bankPhone, setBankPhone] = useState('');
  const [contacts, setContacts] = useState<TrustedContact[]>([
    { name: '', phone: '' },
  ]);

  const handleContactChange = useCallback(
    (index: number, field: keyof TrustedContact, value: string) => {
      setContacts((prev) =>
        prev.map((c, i) => (i === index ? { ...c, [field]: value } : c)),
      );
    },
    [],
  );

  const handleAddContact = useCallback(() => {
    setContacts((prev) => [...prev, { name: '', phone: '' }]);
  }, []);

  const handleRemoveContact = useCallback((index: number) => {
    setContacts((prev) => prev.filter((_, i) => i !== index));
  }, []);

  return (
    <div className="flex flex-col gap-6 px-4 py-8">
      <div>
        <h2 className="text-3xl font-bold text-foreground">
          Dati di emergenza
        </h2>
        <p className="mt-2 text-muted-foreground">
          Salva i contatti importanti. Saranno cifrati sul tuo dispositivo.
        </p>
      </div>

      {/* Emergency contacts form */}
      <div className="glass-card p-6 sm:p-8">
        <EmergencyForm
          bankPhone={bankPhone}
          contacts={contacts}
          onBankPhoneChange={setBankPhone}
          onContactChange={handleContactChange}
          onAddContact={handleAddContact}
          onRemoveContact={handleRemoveContact}
        />
      </div>

      {/* TODO: AttackTypeSelector goes here (point 6) */}
      {/* TODO: TodoChecklist goes here (point 7) */}

      {/* Navigation */}
      <div className="flex gap-4">
        <button
          type="button"
          onClick={onBack}
          className="flex-1 rounded-2xl border border-white/10 bg-secondary px-6 py-4 text-lg font-medium text-secondary-foreground transition-colors hover:bg-secondary/80"
          style={{ minHeight: 44 }}
        >
          Indietro
        </button>
        <button
          type="button"
          onClick={onNext}
          className="btn-primary flex-1"
        >
          Avanti
        </button>
      </div>
    </div>
  );
}
