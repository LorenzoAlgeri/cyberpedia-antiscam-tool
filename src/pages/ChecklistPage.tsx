import { useState, useCallback, useEffect, useRef } from 'react';
import { AttackTypeSelector } from '@/components/emergency/AttackTypeSelector';
import { ChecklistSheet } from '@/components/emergency/ChecklistSheet';
import { useAutoSave } from '@/hooks/useAutoSave';
import { loadEmergencyData, hasStoredData, getCachedPin } from '@/lib/storage';
import { trackAttackSelection } from '@/lib/analytics';
import type { AttackType, TrustedContact, EmergencyData } from '@/types/emergency';

interface ChecklistPageProps {
  readonly onNext: () => void;
  readonly onBack: () => void;
  readonly pin: string | null;
  readonly victimStatus?: 'yes' | 'no' | null;
  readonly onChangeVictimStatus?: (v: 'yes' | 'no') => void;
}

/**
 * Step 3 — Attack type selector + checklist.
 * Loads full EmergencyData from encrypted storage so that saves
 * preserve bank/contact fields written by EmergencyPage.
 */
export function ChecklistPage({
  onNext,
  onBack,
  pin: propPin,
  victimStatus = null,
  onChangeVictimStatus,
}: ChecklistPageProps) {
  /* ── Full EmergencyData state (loaded from storage) ───────── */
  const [bankName, setBankName] = useState('');
  const [bankCountryCode, setBankCountryCode] = useState('+39');
  const [bankPhone, setBankPhone] = useState('');
  const [contacts, setContacts] = useState<TrustedContact[]>([]);

  /* ── Checklist-specific state (actively managed) ──────────── */
  const [selectedAttack, setSelectedAttack] = useState<AttackType | null>(null);
  const [completedGenericTodos, setCompletedGenericTodos] = useState<string[]>([]);
  const [completedAttackTodos, setCompletedAttackTodos] = useState<string[]>([]);

  const [showChecklist, setShowChecklist] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const attackSelectorRef = useRef<HTMLDivElement>(null);

  const effectivePin = propPin ?? getCachedPin();

  /* ── Load data from encrypted storage on mount ────────────── */
  useEffect(() => {
    if (!effectivePin || !hasStoredData()) {
      setIsLoading(false);
      return;
    }
    void loadEmergencyData(effectivePin)
      .then((data) => {
        if (data) {
          setBankName(data.bankName ?? '');
          setBankCountryCode(data.bankCountryCode ?? '+39');
          setBankPhone(data.bankPhone);
          setContacts(data.contacts);
          setSelectedAttack(data.selectedAttack);
          setCompletedGenericTodos(data.completedGenericTodos);
          setCompletedAttackTodos(data.completedAttackTodos);
        }
      })
      .catch(() => { /* use defaults */ })
      .finally(() => setIsLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── Auto-save (full blob so bank data is preserved) ──────── */
  const getData = useCallback(
    (): EmergencyData => ({
      bankName, bankCountryCode, bankPhone, contacts,
      selectedAttack, completedGenericTodos, completedAttackTodos,
      lastSaved: '',
    }),
    [bankName, bankCountryCode, bankPhone, contacts, selectedAttack, completedGenericTodos, completedAttackTodos],
  );

  const { scheduleAutoSave, triggerSave } = useAutoSave(getData, effectivePin);

  useEffect(() => {
    if (isLoading) return;
    scheduleAutoSave();
  }, [selectedAttack, completedGenericTodos, completedAttackTodos, scheduleAutoSave, isLoading]);

  /* ── Handlers ─────────────────────────────────────────────── */
  const handleAttackSelect = useCallback((type: AttackType) => {
    const isNewType = type !== selectedAttack;
    setSelectedAttack(type);
    if (isNewType) setCompletedAttackTodos([]);
    trackAttackSelection(type);
    setShowChecklist(true);
  }, [selectedAttack]);

  const toggleTodo = useCallback(
    (id: string, setter: React.Dispatch<React.SetStateAction<string[]>>) =>
      setter((prev) => (prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id])),
    [],
  );

  const handleToggleGeneric = useCallback((id: string) => toggleTodo(id, setCompletedGenericTodos), [toggleTodo]);
  const handleToggleAttack = useCallback((id: string) => toggleTodo(id, setCompletedAttackTodos), [toggleTodo]);

  const handleRequestAttackSelect = useCallback(() => {
    setShowChecklist(false);
    setTimeout(() => {
      attackSelectorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 350);
  }, []);

  const handleNext = useCallback(async () => {
    if (effectivePin) await triggerSave();
    onNext();
  }, [effectivePin, triggerSave, onNext]);

  const handleBack = useCallback(async () => {
    if (effectivePin) await triggerSave();
    onBack();
  }, [effectivePin, triggerSave, onBack]);

  /* ── Loading state ────────────────────────────────────────── */
  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center" role="status" aria-label="Caricamento in corso">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent" aria-hidden="true" />
      </div>
    );
  }

  /* ── Render ────────────────────────────────────────────────── */
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-8">
      <div>
        <h2 className="text-2xl font-bold text-foreground" data-step-heading>
          Cosa sta succedendo?
        </h2>
        <p className="mt-2 text-base text-muted-foreground">
          Hai l'impressione che ti stiano truffando? Seleziona il tipo di attacco.
        </p>
      </div>

      <div ref={attackSelectorRef}>
        <AttackTypeSelector selected={selectedAttack} onSelect={handleAttackSelect} />
      </div>

      <div className="flex gap-3">
        <button type="button" onClick={handleBack} className="btn-ghost">
          Indietro
        </button>
        <button type="button" onClick={handleNext} className="btn-primary flex-1">
          Avanti
        </button>
      </div>

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
        onRequestAttackSelect={handleRequestAttackSelect}
      />
    </div>
  );
}
