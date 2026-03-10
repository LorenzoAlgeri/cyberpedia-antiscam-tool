import { useState, useCallback } from 'react';
import { EmergencyForm } from '@/components/emergency/EmergencyForm';
import { AttackTypeSelector } from '@/components/emergency/AttackTypeSelector';
import { TodoChecklist } from '@/components/emergency/TodoChecklist';
import type { AttackType, TrustedContact } from '@/types/emergency';

interface EmergencyPageProps {
  readonly onNext: () => void;
  readonly onBack: () => void;
}

/**
 * Step 2 — Emergency data + To-Do checklist.
 *
 * State managed locally with useState:
 * - bankPhone, contacts → EmergencyForm
 * - selectedAttack → AttackTypeSelector
 * - completedGenericTodos, completedAttackTodos → TodoChecklist
 *
 * TODO (Week 2 point 8): auto-save debounced + manual save
 */
export function EmergencyPage({ onNext, onBack }: EmergencyPageProps) {
  const [bankPhone, setBankPhone] = useState('');
  const [contacts, setContacts] = useState<TrustedContact[]>([
    { name: '', phone: '' },
  ]);

  // Attack type + checklist state
  const [selectedAttack, setSelectedAttack] = useState<AttackType | null>(null);
  const [completedGenericTodos, setCompletedGenericTodos] = useState<string[]>(
    [],
  );
  const [completedAttackTodos, setCompletedAttackTodos] = useState<string[]>(
    [],
  );

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

  /** Reset attack-specific todos when the user switches attack type. */
  const handleAttackSelect = useCallback((type: AttackType) => {
    setSelectedAttack(type);
    setCompletedAttackTodos([]);
  }, []);

  /** Toggle a todo ID in a completed set (add if missing, remove if present). */
  const toggleTodo = useCallback(
    (
      id: string,
      setter: React.Dispatch<React.SetStateAction<string[]>>,
    ) => {
      setter((prev) =>
        prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id],
      );
    },
    [],
  );

  const handleToggleGeneric = useCallback(
    (id: string) => toggleTodo(id, setCompletedGenericTodos),
    [toggleTodo],
  );

  const handleToggleAttack = useCallback(
    (id: string) => toggleTodo(id, setCompletedAttackTodos),
    [toggleTodo],
  );

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

      {/* Attack type selector — 6-card grid */}
      <AttackTypeSelector
        selected={selectedAttack}
        onSelect={handleAttackSelect}
      />

      {/* Prioritised to-do checklist */}
      <TodoChecklist
        selectedAttack={selectedAttack}
        completedGeneric={completedGenericTodos}
        completedAttack={completedAttackTodos}
        onToggleGeneric={handleToggleGeneric}
        onToggleAttack={handleToggleAttack}
      />

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
