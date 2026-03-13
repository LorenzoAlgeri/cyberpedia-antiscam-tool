import { useState, useCallback, useEffect } from 'react';
import { ExternalLink, Save, ClipboardList, ShieldAlert } from 'lucide-react';
import { EmergencyForm } from '@/components/emergency/EmergencyForm';
import { AttackTypeSelector } from '@/components/emergency/AttackTypeSelector';
import { ChecklistSheet } from '@/components/emergency/ChecklistSheet';
import { PinDialog } from '@/components/emergency/PinDialog';
import { SaveStatusBadge } from '@/components/emergency/SaveStatusBadge';
import { useAutoSave } from '@/hooks/useAutoSave';
import { loadEmergencyData, hasStoredData } from '@/lib/storage';
import { trackAttackSelection } from '@/lib/analytics';
import type { AttackType, TrustedContact, EmergencyData } from '@/types/emergency';

interface EmergencyPageProps {
  readonly onNext: () => void;
  readonly onBack: () => void;
  /** Incremented on every app mount — used to reveal AttackTypeSelector from 2nd visit onward. */
  readonly visitCount: number;
  /** Persisted per-device answer; drives prevention vs intervention highlighting */
  readonly victimStatus?: 'yes' | 'no' | null;
  /** Called when the user selects a new answer for "Hai subito una truffa?" inline in the checklist */
  readonly onChangeVictimStatus?: (v: 'yes' | 'no') => void;
  /** Called after a successful unlock or first-save — lifts pin+data to App. */
  readonly onUnlock?: (pin: string, data: EmergencyData) => void;
}

/** Step 2 — Emergency data + To-Do + encrypted auto-save (1.5s debounce). */
export function EmergencyPage({ onNext, onBack, visitCount, victimStatus = null, onChangeVictimStatus, onUnlock }: EmergencyPageProps) {
  const [bankName, setBankName] = useState('');
  const [bankCountryCode, setBankCountryCode] = useState('+39');
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
  const [showChecklist, setShowChecklist] = useState(false);

  /**
   * C6 FIX — Navigation guard for unsaved data.
   *
   * When the user clicks "Avanti" with no PIN set (never saved),
   * we intercept navigation, open the PIN-create dialog, and deferred-
   * navigate only after a successful first save.
   *
   * pendingNavigation = true  → execute onNext() after next successful save
   */
  const [pendingNavigation, setPendingNavigation] = useState(false);

  /** True if the user has entered any data worth saving */
  const hasUnsavedData =
    bankPhone.trim() !== '' ||
    bankName.trim() !== '' ||
    contacts.some((c) => c.name.trim() !== '' || c.phone.trim() !== '');

  const getData = useCallback(
    (): EmergencyData => ({
      bankName,
      bankCountryCode,
      bankPhone,
      contacts,
      selectedAttack,
      completedGenericTodos,
      completedAttackTodos,
      lastSaved: '',
    }),
    [bankName, bankCountryCode, bankPhone, contacts, selectedAttack, completedGenericTodos, completedAttackTodos],
  );

  const { status: saveStatus, scheduleAutoSave, triggerSave, saveWithPin } =
    useAutoSave(getData, pin);

  // E4 extension — implicit default scenario tracking on first visit.
  // Provides a baseline even for users who never interact with the selector.
  useEffect(() => {
    if (visitCount === 1 && selectedAttack === null) {
      trackAttackSelection('implicit-default');
    }
  }, [visitCount, selectedAttack]);

  useEffect(() => {
    scheduleAutoSave();
  }, [bankName, bankCountryCode, bankPhone, contacts, selectedAttack, completedGenericTodos, completedAttackTodos, scheduleAutoSave]);

  const handlePinSubmit = useCallback(
    async (enteredPin: string) => {
      if (pinMode === 'unlock') {
        try {
          const data = await loadEmergencyData(enteredPin);
          if (data) {
            setBankName(data.bankName ?? '');
            setBankCountryCode(data.bankCountryCode ?? '+39');
            setBankPhone(data.bankPhone);
            setContacts(
              data.contacts.length > 0 ? data.contacts : [{ name: '', phone: '' }],
            );
            setSelectedAttack(data.selectedAttack);
            setCompletedGenericTodos(data.completedGenericTodos);
            setCompletedAttackTodos(data.completedAttackTodos);
            // Lift unlocked state to App so NeedModePage can reuse it
            onUnlock?.(enteredPin, data);
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

        // Lift newly created PIN to App (no pre-existing data yet)
        onUnlock?.(enteredPin, getData());

        // C6 FIX: if navigation was deferred waiting for this save, execute it now
        if (pendingNavigation) {
          setPendingNavigation(false);
          onNext();
        }
      }
    },
    [pinMode, saveWithPin, pendingNavigation, onNext, onUnlock, getData],
  );

  const handlePinCancel = useCallback(() => {
    setShowPinDialog(false);
    // C6 FIX: discard deferred navigation if user cancels PIN creation
    setPendingNavigation(false);
  }, []);

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
    trackAttackSelection(type);
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

  /**
   * C6 FIX — Guarded "Avanti" handler.
   *
   * If pin is already set: auto-save fires anyway (via scheduleAutoSave),
   * navigate immediately.
   * If pin is not set AND there is unsaved data: intercept → PIN create dialog
   * → save → navigate. The `pendingNavigation` flag triggers onNext() inside
   * handlePinSubmit after the save completes.
   * If pin is not set AND no data entered: navigate freely (nothing to save).
   */
  const handleNext = useCallback(() => {
    if (!pin && hasUnsavedData) {
      setPendingNavigation(true);
      setPinMode('create');
      setShowPinDialog(true);
    } else {
      onNext();
    }
  }, [pin, hasUnsavedData, onNext]);

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-8">
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
        <SaveStatusBadge status={saveStatus} />
      </div>

      {/* Emergency contacts form */}
      <div className="glass-card p-6 sm:p-8">
        <EmergencyForm
          bankName={bankName}
          bankCountryCode={bankCountryCode}
          bankPhone={bankPhone}
          contacts={contacts}
          onBankNameChange={setBankName}
          onBankCountryCodeChange={setBankCountryCode}
          onBankPhoneChange={setBankPhone}
          onContactChange={handleContactChange}
          onAddContact={handleAddContact}
          onRemoveContact={handleRemoveContact}
        />
      </div>

      {/* C5: Polizia Postale — static, always visible */}
      <div className="flex items-center justify-between rounded-2xl border border-blue-500/20 bg-blue-500/5 px-4 py-3">
        <div className="flex items-center gap-2.5">
          <ShieldAlert
            className="h-5 w-5 shrink-0 text-blue-400"
            strokeWidth={1.5}
            aria-hidden="true"
          />
          <div>
            <p className="text-sm font-semibold text-blue-300">
              Polizia Postale
            </p>
            <a
              href="tel:800288883"
              className="font-mono text-base font-medium text-foreground transition-colors hover:text-blue-300"
              aria-label="Chiama Polizia Postale: 800 288 883"
            >
              800 288 883
            </a>
          </div>
        </div>
        <a
          href="https://www.commissariatodips.it"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-sm text-blue-400 underline-offset-2 transition-colors hover:text-blue-300 hover:underline"
          aria-label="Denuncia online su commissariatodips.it (apre in nuova tab)"
        >
          Denuncia online
          <ExternalLink className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        </a>
      </div>

      {/* Attack type selector — hidden on first visit to reduce cognitive load */}
      {visitCount >= 2 && (
        <>
          {visitCount === 2 && (
            <p className="px-1 text-sm text-muted-foreground">
              Seleziona il tipo di truffa per una checklist più mirata.
            </p>
          )}
          <AttackTypeSelector selected={selectedAttack} onSelect={handleAttackSelect} />
        </>
      )}

      {/* Checklist trigger — visible without scrolling (Planning B3) */}
      <button
        type="button"
        onClick={() => setShowChecklist(true)}
        className="flex w-full items-center justify-between rounded-2xl border border-slate-700/50
                   bg-white/5 px-5 py-4 text-left transition-colors hover:bg-white/10"
        style={{ minHeight: 44 }}
        aria-label="Apri checklist azioni anti-truffa"
      >
        <div className="flex items-center gap-3">
          <ClipboardList
            className="h-5 w-5 shrink-0 text-cyan-brand"
            aria-hidden="true"
          />
          <div>
            <p className="text-base font-medium text-foreground">
              Checklist azioni
            </p>
            <p className="text-sm text-muted-foreground">
              {completedGenericTodos.length + completedAttackTodos.length > 0
                ? `${completedGenericTodos.length + completedAttackTodos.length} azioni completate`
                : 'Cosa fare adesso, passo per passo'}
            </p>
          </div>
        </div>
        <span className="text-xs text-muted-foreground">Apri →</span>
      </button>

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
          onClick={handleNext}
          className="btn-primary flex-1"
        >
          Avanti
        </button>
      </div>

      {/* Checklist bottom sheet (Planning B3) */}
      <ChecklistSheet
        open={showChecklist}
        onClose={() => setShowChecklist(false)}
        selectedAttack={selectedAttack}
        completedGeneric={completedGenericTodos}
        completedAttack={completedAttackTodos}
        onToggleGeneric={handleToggleGeneric}
        onToggleAttack={handleToggleAttack}
        victimStatus={victimStatus}
        {...(onChangeVictimStatus !== undefined ? { onIncidentChange: onChangeVictimStatus } : {})}
        bankPhone={bankPhone}
        bankCountryCode={bankCountryCode}
        bankName={bankName}
      />

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
