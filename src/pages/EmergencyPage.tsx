import { useState, useCallback, useEffect } from 'react';
import { Save } from 'lucide-react';
import { EmergencyForm } from '@/components/emergency/EmergencyForm';
import { AttackTypeSelector } from '@/components/emergency/AttackTypeSelector';
import { TodoChecklist } from '@/components/emergency/TodoChecklist';
import { PinDialog } from '@/components/emergency/PinDialog';
import { SaveStatusBadge } from '@/components/emergency/SaveStatusBadge';
import { useAutoSave } from '@/hooks/useAutoSave';
import { loadEmergencyData, hasStoredData } from '@/lib/storage';
import type { AttackType, TrustedContact, EmergencyData } from '@/types/emergency';

interface EmergencyPageProps {
  readonly onNext: () => void;
  readonly onBack: () => void;
}

/** Step 2 — Emergency data + To-Do + encrypted auto-save (1.5s debounce). */
export function EmergencyPage({ onNext, onBack }: EmergencyPageProps) {
  const [bankPhone, setBankPhone] = useState('');
  const [contacts, setContacts] = useState<TrustedContact[]>([
    { name: '', phone: '' },
  ]);
  const [selectedAttack, setSelectedAttack] = useState<AttackType | null>(null);
  const [completedGenericTodos, setCompletedGenericTodos] = useState<string[]>([]);
  const [completedAttackTodos, setCompletedAttackTodos] = useState<string[]>([]);
  const [pin, setPin] = useState<string | null>(null);
  const [showPinDialog, setShowPinDialog] = useState(() => hasStoredData());
  const [pinMode, setPinMode] = useState<'create' | 'unlock'>(
    () => (hasStoredData() ? 'unlock' : 'create'),
  );
  const [pinError, setPinError] = useState<string | null>(null);

  const getData = useCallback(
    (): EmergencyData => ({
      bankPhone,
      contacts,
      selectedAttack,
      completedGenericTodos,
      completedAttackTodos,
      lastSaved: '',
    }),
    [bankPhone, contacts, selectedAttack, completedGenericTodos, completedAttackTodos],
  );

  const { status: saveStatus, lastSaved, scheduleAutoSave, triggerSave, saveWithPin } =
    useAutoSave(getData, pin);

  useEffect(() => {
    scheduleAutoSave();
  }, [bankPhone, contacts, selectedAttack, completedGenericTodos, completedAttackTodos, scheduleAutoSave]);

  const handlePinSubmit = useCallback(
    async (enteredPin: string) => {
      if (pinMode === 'unlock') {
        try {
          const data = await loadEmergencyData(enteredPin);
          if (data) {
            setBankPhone(data.bankPhone);
            setContacts(
              data.contacts.length > 0 ? data.contacts : [{ name: '', phone: '' }],
            );
            setSelectedAttack(data.selectedAttack);
            setCompletedGenericTodos(data.completedGenericTodos);
            setCompletedAttackTodos(data.completedAttackTodos);
          }
          setPin(enteredPin);
          setShowPinDialog(false);
          setPinError(null);
        } catch {
          setPinError('PIN errato. Riprova.');
        }
      } else {
        // Create mode: set PIN + immediate first save
        setPin(enteredPin);
        setShowPinDialog(false);
        setPinError(null);
        await saveWithPin(enteredPin);
      }
    },
    [pinMode, saveWithPin],
  );

  const handlePinCancel = useCallback(() => setShowPinDialog(false), []);

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

  const handleAttackSelect = useCallback((type: AttackType) => {
    setSelectedAttack(type);
    setCompletedAttackTodos([]);
  }, []);

  const toggleTodo = useCallback(
    (id: string, setter: React.Dispatch<React.SetStateAction<string[]>>) => {
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

  const handleManualSave = useCallback(() => {
    if (!pin) {
      setPinMode('create');
      setShowPinDialog(true);
    } else {
      void triggerSave();
    }
  }, [pin, triggerSave]);

  return (
    <div className="flex flex-col gap-6 px-4 py-8">
      {/* Header + save status */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-foreground">
            Dati di emergenza
          </h2>
          <p className="mt-2 text-muted-foreground">
            Salva i contatti importanti. Saranno cifrati sul tuo dispositivo.
          </p>
        </div>
        <SaveStatusBadge status={saveStatus} lastSaved={lastSaved} />
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

      {/* Attack type selector */}
      <AttackTypeSelector selected={selectedAttack} onSelect={handleAttackSelect} />

      {/* Prioritised to-do checklist */}
      <TodoChecklist
        selectedAttack={selectedAttack}
        completedGeneric={completedGenericTodos}
        completedAttack={completedAttackTodos}
        onToggleGeneric={handleToggleGeneric}
        onToggleAttack={handleToggleAttack}
      />

      {/* Navigation + Save */}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={onBack}
          className="btn-secondary flex-1"
        >
          Indietro
        </button>
        <button
          type="button"
          onClick={handleManualSave}
          className="flex items-center justify-center gap-2 rounded-2xl border border-primary/30 bg-primary/10 px-5 py-4 text-lg font-medium text-primary transition-colors hover:bg-primary/20"
          style={{ minHeight: 44 }}
          aria-label="Salva dati cifrati"
        >
          <Save className="h-5 w-5" />
          Salva
        </button>
        <button
          type="button"
          onClick={onNext}
          className="btn-primary flex-1"
        >
          Avanti
        </button>
      </div>

      {/* PIN dialog (modal) */}
      <PinDialog
        open={showPinDialog}
        mode={pinMode}
        error={pinError}
        onSubmit={handlePinSubmit}
        onCancel={handlePinCancel}
      />
    </div>
  );
}
