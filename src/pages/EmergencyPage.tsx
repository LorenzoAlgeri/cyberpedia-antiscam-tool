import { useState, useCallback, useEffect } from 'react';
import { EmergencyForm } from '@/components/emergency/EmergencyForm';
import { PinDialog } from '@/components/emergency/PinDialog';
import { EmergencyPageHeader } from '@/components/emergency/EmergencyPageHeader';
import { PoliziaPostaleCard } from '@/components/emergency/PoliziaPostaleCard';
import { CyberpediaContactCard } from '@/components/emergency/CyberpediaContactCard';
import { EmergencyPageActions } from '@/components/emergency/EmergencyPageActions';
import { useAutoSave } from '@/hooks/useAutoSave';
import { useBruteForceGuard } from '@/hooks/useBruteForceGuard';
import { loadEmergencyData, hasStoredData, cachePin, getCachedPin, clearPinCache, clearStoredData, StorageCorruptionError } from '@/lib/storage';
import { isCryptoAvailable } from '@/lib/crypto-support';
import { AlertTriangle } from 'lucide-react';
import type { AttackType, TrustedContact, EmergencyData } from '@/types/emergency';

interface EmergencyPageProps {
  readonly onNext: () => void;
  readonly onBack?: () => void;
  readonly onUnlock?: (pin: string, data: EmergencyData) => void;
  readonly onProfileSaved?: () => void;
}

/** Step 2 — Emergency contacts + bank data with encrypted auto-save (1.5s debounce). */
export function EmergencyPage({ onNext, onBack, onUnlock, onProfileSaved }: EmergencyPageProps) {
  /* ── Bank & contacts state (actively managed) ─────────────── */
  const [bankName, setBankName] = useState('');
  const [bankCountryCode, setBankCountryCode] = useState('+39');
  const [bankPhone, setBankPhone] = useState('');
  const [contacts, setContacts] = useState<TrustedContact[]>([{ name: '', phone: '', countryCode: '+39' }]);

  /* ── Checklist state (passthrough — loaded from storage, preserved in saves) */
  const [selectedAttack, setSelectedAttack] = useState<AttackType | null>(null);
  const [completedGenericTodos, setCompletedGenericTodos] = useState<string[]>([]);
  const [completedAttackTodos, setCompletedAttackTodos] = useState<string[]>([]);

  /* ── PIN & save state ─────────────────────────────────────── */
  const [pin, setPin] = useState<string | null>(() => getCachedPin());
  const [showPinDialog, setShowPinDialog] = useState(() => hasStoredData() && getCachedPin() === null);
  const [pinMode, setPinMode] = useState<'create' | 'unlock'>(() => (hasStoredData() ? 'unlock' : 'create'));
  const [pinError, setPinError] = useState<string | null>(null);
  const [isAutoLoading, setIsAutoLoading] = useState(() => hasStoredData() && getCachedPin() !== null);
  const [corruptionDetected, setCorruptionDetected] = useState(false);
  const bruteForce = useBruteForceGuard();
  const [pendingNavigation, setPendingNavigation] = useState(false);

  /* ── Silent auto-load when a valid PIN session cache exists ── */
  useEffect(() => {
    const cachedPin = getCachedPin();
    if (!cachedPin || !hasStoredData()) { setIsAutoLoading(false); return; }
    void loadEmergencyData(cachedPin)
      .then((data) => {
        if (data) {
          setBankName(data.bankName ?? '');
          setBankCountryCode(data.bankCountryCode ?? '+39');
          setBankPhone(data.bankPhone);
          setContacts(data.contacts.length > 0 ? data.contacts : [{ name: '', phone: '', countryCode: '+39' }]);
          setSelectedAttack(data.selectedAttack);
          setCompletedGenericTodos(data.completedGenericTodos);
          setCompletedAttackTodos(data.completedAttackTodos);
          onUnlock?.(cachedPin, data);
        }
      })
      .catch((err) => {
        clearPinCache();
        setPin(null);
        if (err instanceof StorageCorruptionError) {
          setCorruptionDetected(true);
          setShowPinDialog(true);
        } else {
          setShowPinDialog(hasStoredData());
        }
      })
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

  useEffect(() => {
    if (isAutoLoading) return;
    scheduleAutoSave();
  }, [bankName, bankCountryCode, bankPhone, contacts, selectedAttack, completedGenericTodos, completedAttackTodos, scheduleAutoSave, isAutoLoading]);

  /* ── PIN handlers ─────────────────────────────────────────── */
  const handlePinSubmit = useCallback(async (enteredPin: string) => {
    if (pinMode === 'unlock') {
      try {
        const data = await loadEmergencyData(enteredPin);
        if (data) {
          setBankName(data.bankName ?? '');
          setBankCountryCode(data.bankCountryCode ?? '+39');
          setBankPhone(data.bankPhone);
          setContacts(data.contacts.length > 0 ? data.contacts : [{ name: '', phone: '', countryCode: '+39' }]);
          setSelectedAttack(data.selectedAttack);
          setCompletedGenericTodos(data.completedGenericTodos);
          setCompletedAttackTodos(data.completedAttackTodos);
          onUnlock?.(enteredPin, data);
        }
        setPin(enteredPin); cachePin(enteredPin); setShowPinDialog(false); setPinError(null);
        bruteForce.resetOnSuccess();
      } catch (err) {
        if (err instanceof StorageCorruptionError) {
          setCorruptionDetected(true);
        } else {
          setPinError('PIN errato. Riprova.');
          bruteForce.recordFailure();
        }
      }
    } else {
      setPin(enteredPin); cachePin(enteredPin); setShowPinDialog(false); setPinError(null);
      await saveWithPin(enteredPin);
      onProfileSaved?.();
      onUnlock?.(enteredPin, getData());
      if (pendingNavigation) { setPendingNavigation(false); onNext(); }
    }
  }, [pinMode, saveWithPin, pendingNavigation, onNext, onUnlock, onProfileSaved, getData, bruteForce]);

  const handlePinCancel = useCallback(() => { setShowPinDialog(false); setPendingNavigation(false); }, []);

  const handleResetData = useCallback(() => {
    clearStoredData();
    setCorruptionDetected(false);
    setShowPinDialog(false);
    setPinMode('create');
    setPin(null);
    setPinError(null);
    setBankName(''); setBankCountryCode('+39'); setBankPhone('');
    setContacts([{ name: '', phone: '', countryCode: '+39' }]);
    setSelectedAttack(null);
    setCompletedGenericTodos([]); setCompletedAttackTodos([]);
  }, []);

  /* ── Contact handlers ─────────────────────────────────────── */
  const handleContactChange = useCallback(
    (index: number, field: keyof TrustedContact, value: string) =>
      setContacts((prev) => prev.map((c, i) => (i === index ? { ...c, [field]: value } : c))),
    [],
  );

  const handleAddContact = useCallback(() => setContacts((prev) => [...prev, { name: '', phone: '', countryCode: '+39' }]), []);
  const handleRemoveContact = useCallback((index: number) => setContacts((prev) => prev.filter((_, i) => i !== index)), []);

  const handleManualSave = useCallback(() => {
    if (!pin) { setPinMode('create'); setShowPinDialog(true); } else { void triggerSave(); }
  }, [pin, triggerSave]);

  /* ── Navigation — trigger immediate save before advancing ── */
  const handleNext = useCallback(async () => {
    if (!pin && hasUnsavedData) {
      setPendingNavigation(true);
      setPinMode('create');
      setShowPinDialog(true);
    } else {
      if (pin) await triggerSave();
      onNext();
    }
  }, [pin, hasUnsavedData, onNext, triggerSave]);

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-8">
      {!isCryptoAvailable() && (
        <div
          className="mb-4 flex items-center gap-2 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-base text-amber-300"
          role="alert"
        >
          <AlertTriangle className="h-5 w-5 shrink-0" aria-hidden="true" />
          <span>Il tuo browser non supporta la cifratura — i tuoi dati non sono protetti.</span>
        </div>
      )}
      <EmergencyPageHeader saveStatus={saveStatus} />
      <div className="glass-card p-6 sm:p-8">
        <EmergencyForm
          bankName={bankName} bankCountryCode={bankCountryCode} bankPhone={bankPhone} contacts={contacts}
          onBankNameChange={setBankName} onBankCountryCodeChange={setBankCountryCode} onBankPhoneChange={setBankPhone}
          onContactChange={handleContactChange} onAddContact={handleAddContact} onRemoveContact={handleRemoveContact}
          onSave={handleManualSave}
        />
      </div>
      <PoliziaPostaleCard />
      <CyberpediaContactCard />
      <EmergencyPageActions onNext={handleNext} onBack={onBack} />
      <PinDialog
        open={showPinDialog} mode={pinMode} error={pinError}
        onSubmit={handlePinSubmit} onCancel={handlePinCancel}
        isLocked={bruteForce.isLocked} remainingMs={bruteForce.remainingMs}
        showHint={bruteForce.showHint} onResetData={handleResetData}
        corruptionDetected={corruptionDetected}
      />
    </div>
  );
}
