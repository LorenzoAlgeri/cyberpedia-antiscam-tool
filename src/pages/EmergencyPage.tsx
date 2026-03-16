import { useState, useCallback, useEffect } from 'react';
import { EmergencyForm } from '@/components/emergency/EmergencyForm';
import { AttackTypeSelector } from '@/components/emergency/AttackTypeSelector';
import { ChecklistSheet } from '@/components/emergency/ChecklistSheet';
import { PinDialog } from '@/components/emergency/PinDialog';
import { EmergencyPageHeader } from '@/components/emergency/EmergencyPageHeader';
import { PoliziaPostaleCard } from '@/components/emergency/PoliziaPostaleCard';
import { ChecklistTrigger } from '@/components/emergency/ChecklistTrigger';
import { EmergencyPageActions } from '@/components/emergency/EmergencyPageActions';
import { useAutoSave } from '@/hooks/useAutoSave';
import { loadEmergencyData, hasStoredData, cachePin, getCachedPin, clearPinCache } from '@/lib/storage';
import { trackAttackSelection } from '@/lib/analytics';
import type { AttackType, TrustedContact, EmergencyData } from '@/types/emergency';

interface EmergencyPageProps {
  readonly onNext: () => void;
  readonly onBack: () => void;
  readonly visitCount: number;
  readonly victimStatus?: 'yes' | 'no' | null;
  readonly onChangeVictimStatus?: (v: 'yes' | 'no') => void;
  readonly onUnlock?: (pin: string, data: EmergencyData) => void;
}

/** Step 2 — Emergency data + To-Do + encrypted auto-save (1.5s debounce). */
export function EmergencyPage({ onNext, onBack, visitCount, victimStatus = null, onChangeVictimStatus, onUnlock }: EmergencyPageProps) {
  const [bankName, setBankName] = useState('');
  const [bankCountryCode, setBankCountryCode] = useState('+39');
  const [bankPhone, setBankPhone] = useState('');
  const [contacts, setContacts] = useState<TrustedContact[]>([{ name: '', phone: '' }]);
  const [selectedAttack, setSelectedAttack] = useState<AttackType | null>(null);
  const [completedGenericTodos, setCompletedGenericTodos] = useState<string[]>([]);
  const [completedAttackTodos, setCompletedAttackTodos] = useState<string[]>([]);
  const [pin, setPin] = useState<string | null>(() => getCachedPin());
  const [showPinDialog, setShowPinDialog] = useState(() => hasStoredData() && getCachedPin() === null);
  const [pinMode, setPinMode] = useState<'create' | 'unlock'>(() => (hasStoredData() ? 'unlock' : 'create'));
  const [pinError, setPinError] = useState<string | null>(null);
  const [isAutoLoading, setIsAutoLoading] = useState(() => hasStoredData() && getCachedPin() !== null);
  const [showChecklist, setShowChecklist] = useState(false);
  // C6: set true to execute onNext() after first save completes.
  const [pendingNavigation, setPendingNavigation] = useState(false);

  // Silent auto-load when a valid PIN session cache exists (≤1h window).
  useEffect(() => {
    const cachedPin = getCachedPin();
    if (!cachedPin || !hasStoredData()) { setIsAutoLoading(false); return; }
    void loadEmergencyData(cachedPin)
      .then((data) => {
        if (data) {
          setBankName(data.bankName ?? '');
          setBankCountryCode(data.bankCountryCode ?? '+39');
          setBankPhone(data.bankPhone);
          setContacts(data.contacts.length > 0 ? data.contacts : [{ name: '', phone: '' }]);
          setSelectedAttack(data.selectedAttack);
          setCompletedGenericTodos(data.completedGenericTodos);
          setCompletedAttackTodos(data.completedAttackTodos);
          onUnlock?.(cachedPin, data);
        }
      })
      .catch(() => { clearPinCache(); setPin(null); setShowPinDialog(hasStoredData()); })
      .finally(() => { setIsAutoLoading(false); });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const hasUnsavedData =
    bankPhone.trim() !== '' || bankName.trim() !== '' ||
    contacts.some((c) => c.name.trim() !== '' || c.phone.trim() !== '');

  const getData = useCallback(
    (): EmergencyData => ({ bankName, bankCountryCode, bankPhone, contacts, selectedAttack, completedGenericTodos, completedAttackTodos, lastSaved: '' }),
    [bankName, bankCountryCode, bankPhone, contacts, selectedAttack, completedGenericTodos, completedAttackTodos],
  );

  const { status: saveStatus, scheduleAutoSave, triggerSave, saveWithPin } = useAutoSave(getData, pin);

  // E4: implicit default scenario tracking on first visit.
  useEffect(() => {
    if (visitCount === 1 && selectedAttack === null) trackAttackSelection('implicit-default');
  }, [visitCount, selectedAttack]);

  useEffect(() => {
    if (isAutoLoading) return;
    scheduleAutoSave();
  }, [bankName, bankCountryCode, bankPhone, contacts, selectedAttack, completedGenericTodos, completedAttackTodos, scheduleAutoSave, isAutoLoading]);

  const handlePinSubmit = useCallback(async (enteredPin: string) => {
    if (pinMode === 'unlock') {
      try {
        const data = await loadEmergencyData(enteredPin);
        if (data) {
          setBankName(data.bankName ?? '');
          setBankCountryCode(data.bankCountryCode ?? '+39');
          setBankPhone(data.bankPhone);
          setContacts(data.contacts.length > 0 ? data.contacts : [{ name: '', phone: '' }]);
          setSelectedAttack(data.selectedAttack);
          setCompletedGenericTodos(data.completedGenericTodos);
          setCompletedAttackTodos(data.completedAttackTodos);
          onUnlock?.(enteredPin, data);
        }
        setPin(enteredPin); cachePin(enteredPin); setShowPinDialog(false); setPinError(null);
      } catch { setPinError('PIN errato. Riprova.'); }
    } else {
      setPin(enteredPin); cachePin(enteredPin); setShowPinDialog(false); setPinError(null);
      await saveWithPin(enteredPin);
      onUnlock?.(enteredPin, getData());
      if (pendingNavigation) { setPendingNavigation(false); onNext(); }
    }
  }, [pinMode, saveWithPin, pendingNavigation, onNext, onUnlock, getData]);

  const handlePinCancel = useCallback(() => { setShowPinDialog(false); setPendingNavigation(false); }, []);

  const handleContactChange = useCallback(
    (index: number, field: keyof TrustedContact, value: string) =>
      setContacts((prev) => prev.map((c, i) => (i === index ? { ...c, [field]: value } : c))),
    [],
  );

  const handleAddContact = useCallback(() => setContacts((prev) => [...prev, { name: '', phone: '' }]), []);
  const handleRemoveContact = useCallback((index: number) => setContacts((prev) => prev.filter((_, i) => i !== index)), []);

  const handleAttackSelect = useCallback((type: AttackType) => {
    setSelectedAttack(type); setCompletedAttackTodos([]); trackAttackSelection(type);
  }, []);

  const toggleTodo = useCallback(
    (id: string, setter: React.Dispatch<React.SetStateAction<string[]>>) =>
      setter((prev) => prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]),
    [],
  );

  const handleToggleGeneric = useCallback((id: string) => toggleTodo(id, setCompletedGenericTodos), [toggleTodo]);
  const handleToggleAttack = useCallback((id: string) => toggleTodo(id, setCompletedAttackTodos), [toggleTodo]);

  const handleManualSave = useCallback(() => {
    if (!pin) { setPinMode('create'); setShowPinDialog(true); } else { void triggerSave(); }
  }, [pin, triggerSave]);

  // C6: guard — if no PIN and data exists, defer navigation until after first save.
  const handleNext = useCallback(() => {
    if (!pin && hasUnsavedData) { setPendingNavigation(true); setPinMode('create'); setShowPinDialog(true); }
    else { onNext(); }
  }, [pin, hasUnsavedData, onNext]);

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-8">
      <EmergencyPageHeader saveStatus={saveStatus} />
      <div className="glass-card p-6 sm:p-8">
        <EmergencyForm
          bankName={bankName} bankCountryCode={bankCountryCode} bankPhone={bankPhone} contacts={contacts}
          onBankNameChange={setBankName} onBankCountryCodeChange={setBankCountryCode} onBankPhoneChange={setBankPhone}
          onContactChange={handleContactChange} onAddContact={handleAddContact} onRemoveContact={handleRemoveContact}
        />
      </div>
      <PoliziaPostaleCard />
      {visitCount >= 2 && (
        <>
          {visitCount === 2 && <p className="px-1 text-sm text-muted-foreground">Seleziona il tipo di truffa per una checklist più mirata.</p>}
          <AttackTypeSelector selected={selectedAttack} onSelect={handleAttackSelect} />
        </>
      )}
      <ChecklistTrigger completedCount={completedGenericTodos.length + completedAttackTodos.length} onClick={() => setShowChecklist(true)} />
      <EmergencyPageActions onBack={onBack} onSave={handleManualSave} onNext={handleNext} />
      <ChecklistSheet
        open={showChecklist} onClose={() => setShowChecklist(false)}
        selectedAttack={selectedAttack} completedGeneric={completedGenericTodos} completedAttack={completedAttackTodos}
        onToggleGeneric={handleToggleGeneric} onToggleAttack={handleToggleAttack}
        victimStatus={victimStatus} {...(onChangeVictimStatus !== undefined ? { onIncidentChange: onChangeVictimStatus } : {})}
        bankPhone={bankPhone} bankCountryCode={bankCountryCode} bankName={bankName}
      />
      <PinDialog open={showPinDialog} mode={pinMode} error={pinError} onSubmit={handlePinSubmit} onCancel={handlePinCancel} />
    </div>
  );
}
