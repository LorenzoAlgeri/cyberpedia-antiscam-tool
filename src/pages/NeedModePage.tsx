import { useCallback, useMemo, useState } from 'react';
import * as m from 'motion/react-m';
import { FileText, Phone } from 'lucide-react';
import { PinDialog } from '@/components/emergency/PinDialog';
import { TodoChecklist } from '@/components/emergency/TodoChecklist';
import { ATTACK_TYPES } from '@/data/attack-types';
import { hasStoredData, loadEmergencyData, StorageCorruptionError } from '@/lib/storage';
import type { EmergencyData } from '@/types/emergency';

interface NeedModePageProps {
  readonly onBack: () => void;
  /** PIN already entered in EmergencyPage — skip unlock dialog when provided. */
  readonly pin?: string | null;
  /** Decrypted data from EmergencyPage — pre-populate state when provided. */
  readonly unlockedData?: EmergencyData | null;
  /** Called after local unlock so App can persist the pin+data globally. */
  readonly onUnlock?: (pin: string, data: EmergencyData) => void;
}

type NeedTab = 'base' | 'scenario';

function sanitizeTel(value: string): string {
  return value.replace(/[^\d+]/g, '');
}

function buildReport(data: EmergencyData): string {
  const lines: string[] = [];
  lines.push('CYBERPEDIA — Report rapido (Modalità al bisogno)');
  lines.push(`Creato: ${new Date().toISOString()}`);
  lines.push('');
  lines.push('--- Contatti ---');
  if (data.bankPhone.trim()) {
    lines.push(`Banca: ${data.bankName || '(non indicata)'}`);
    lines.push(`Numero banca: ${data.bankCountryCode}${data.bankPhone}`);
  } else {
    lines.push('Numero banca: (non salvato)');
  }
  if (data.contacts.length) {
    lines.push('Contatti fiducia:');
    data.contacts.forEach((c, idx) => {
      lines.push(`- ${idx + 1}. ${c.name || '(nome)'} — ${c.phone || '(telefono)'}`);
    });
  } else {
    lines.push('Contatti fiducia: (non salvati)');
  }
  lines.push('');
  lines.push('--- Scenario ---');
  lines.push(`Tipo truffa: ${data.selectedAttack ?? '(non selezionato)'}`);
  lines.push('');
  lines.push('--- Stato checklist ---');
  lines.push(`Base completate: ${data.completedGenericTodos.length}/5`);
  lines.push(`Mirate completate: ${data.completedAttackTodos.length}`);
  return lines.join('\n');
}

export function NeedModePage({ onBack, pin: pinProp = null, unlockedData = null, onUnlock }: NeedModePageProps) {
  const [tab, setTab] = useState<NeedTab>('base');
  // Seed local data from App-level unlocked data (avoids second PIN prompt).
  const [data, setData] = useState<EmergencyData | null>(unlockedData);
  const [pinError, setPinError] = useState<string | null>(null);
  // Only show the dialog if no pin was passed from App AND storage exists.
  const [showPinDialog, setShowPinDialog] = useState(() => pinProp === null && hasStoredData());

  const selectedAttack = data?.selectedAttack ?? null;
  const bankTel = useMemo(() => {
    if (!data) return null;
    const raw = `${data.bankCountryCode}${data.bankPhone}`;
    const cleaned = sanitizeTel(raw);
    return cleaned.length > 0 ? cleaned : null;
  }, [data]);

  const handlePinSubmit = useCallback(async (enteredPin: string) => {
    try {
      const loaded = await loadEmergencyData(enteredPin);
      if (loaded) {
        setData(loaded);
        onUnlock?.(enteredPin, loaded);
      }
      setPinError(null);
      setShowPinDialog(false);
    } catch (err) {
      if (err instanceof StorageCorruptionError) {
        setPinError('I tuoi dati salvati sono danneggiati. Torna alla pagina principale per resettare.');
      } else {
        setPinError('PIN errato. Riprova.');
      }
    }
  }, [onUnlock]);

  const handleCreateReport = useCallback(() => {
    if (!data) return;
    const content = buildReport(data);
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'cyberpedia-report.txt';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }, [data]);

  const attackMetaLabel = useMemo(() => {
    if (!selectedAttack) return null;
    return ATTACK_TYPES.find((t) => t.id === selectedAttack)?.label ?? selectedAttack;
  }, [selectedAttack]);

  return (
    <div className="flex flex-1 flex-col gap-6 px-4 py-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Modalità al bisogno</h2>
          <p className="mt-2 text-muted-foreground">
            Azioni rapide e report. Nessun dato viene inviato online.
          </p>
          {attackMetaLabel && (
            <p className="mt-2 text-sm text-muted-foreground/70">
              Scenario: {attackMetaLabel}
            </p>
          )}
        </div>
        <button type="button" onClick={onBack} className="btn-secondary px-4">
          Indietro
        </button>
      </div>

      {/* Tabs (Base / Mirato) */}
      <div className="flex rounded-2xl bg-white/5 p-1" role="tablist" aria-label="Sezioni modalità al bisogno">
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'base'}
          onClick={() => setTab('base')}
          className={`flex flex-1 items-center justify-center rounded-xl py-2.5 text-sm font-medium transition-colors ${
            tab === 'base' ? 'bg-white/10 text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Base
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'scenario'}
          onClick={() => setTab('scenario')}
          className={`flex flex-1 items-center justify-center rounded-xl py-2.5 text-sm font-medium transition-colors ${
            tab === 'scenario'
              ? 'bg-cyan-brand/15 text-cyan-brand shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Mirato
        </button>
      </div>

      {/* Checklist content */}
      <div className="glass-card p-4 sm:p-6">
        <TodoChecklist
          selectedAttack={selectedAttack}
          completedGeneric={data?.completedGenericTodos ?? []}
          completedAttack={data?.completedAttackTodos ?? []}
          activeTab={tab}
          showTabs={false}
          showIncidentToggle={false}
          onToggleGeneric={(id) =>
            setData((prev) =>
              prev
                ? {
                    ...prev,
                    completedGenericTodos: prev.completedGenericTodos.includes(id)
                      ? prev.completedGenericTodos.filter((t) => t !== id)
                      : [...prev.completedGenericTodos, id],
                  }
                : prev,
            )
          }
          onToggleAttack={(id) =>
            setData((prev) =>
              prev
                ? {
                    ...prev,
                    completedAttackTodos: prev.completedAttackTodos.includes(id)
                      ? prev.completedAttackTodos.filter((t) => t !== id)
                      : [...prev.completedAttackTodos, id],
                  }
                : prev,
            )
          }
        />
      </div>

      {/* CTAs */}
      <div className="mt-auto grid grid-cols-1 gap-3 sm:grid-cols-2">
        <m.button
          type="button"
          onClick={handleCreateReport}
          disabled={!data}
          whileHover={!data ? {} : { scale: 1.01, y: -1 }}
          whileTap={!data ? {} : { scale: 0.99 }}
          className="btn-primary flex items-center justify-center gap-2 disabled:opacity-60"
          style={{ minHeight: 44 }}
        >
          <FileText className="h-5 w-5" aria-hidden="true" />
          Crea report
        </m.button>

        {bankTel ? (
          <a
            href={`tel:${bankTel}`}
            className="btn-secondary flex items-center justify-center gap-2"
            style={{ minHeight: 44 }}
            aria-label="Chiama la banca al numero salvato"
          >
            <Phone className="h-5 w-5" aria-hidden="true" />
            Chiama banca
          </a>
        ) : null}
      </div>

      {/* PIN dialog (unlock) */}
      <PinDialog
        open={showPinDialog}
        mode="unlock"
        error={pinError}
        onSubmit={handlePinSubmit}
        onCancel={() => setShowPinDialog(false)}
      />

      {/* If there's no stored data, show a gentle empty state */}
      {!hasStoredData() && (
        <p className="text-center text-sm text-muted-foreground">
          Non ci sono dati salvati. Torna indietro e salva prima i tuoi contatti.
        </p>
      )}
    </div>
  );
}

