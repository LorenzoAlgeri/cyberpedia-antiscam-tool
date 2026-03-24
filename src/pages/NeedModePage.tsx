import { lazy, Suspense, useCallback, useMemo, useState } from 'react';
import * as m from 'motion/react-m';
import { FileText, FolderLock, Phone, ShieldCheck } from 'lucide-react';
import { PinDialog } from '@/components/emergency/PinDialog';
import { TodoChecklist } from '@/components/emergency/TodoChecklist';
import { ATTACK_TYPES } from '@/data/attack-types';
import { hasStoredData, loadEmergencyData, StorageCorruptionError } from '@/lib/storage';
import { hasDossierData } from '@/lib/dossier-storage';
import { trackFeatureUsage } from '@/lib/event-analytics';
// dossier-export is lazily imported to avoid bundling jspdf (~300KB) in this chunk
import type { EmergencyData } from '@/types/emergency';
import type { VictimStatus } from '@/lib/victimStatus';
import type { DossierData } from '@/types/dossier';

const DossierForm = lazy(() =>
  import('@/components/dossier/DossierForm').then((m) => ({ default: m.DossierForm })),
);

const DataBreachCheck = lazy(() =>
  import('@/components/emergency/DataBreachCheck').then((m) => ({ default: m.DataBreachCheck })),
);

interface NeedModePageProps {
  readonly onBack: () => void;
  /** PIN already entered in EmergencyPage — skip unlock dialog when provided. */
  readonly pin?: string | null;
  /** Decrypted data from EmergencyPage — pre-populate state when provided. */
  readonly unlockedData?: EmergencyData | null;
  /** Called after local unlock so App can persist the pin+data globally. */
  readonly onUnlock?: (pin: string, data: EmergencyData) => void;
  /** Victim status — shows dossier tab when 'yes' */
  readonly victimStatus?: VictimStatus | null;
}

type NeedTab = 'base' | 'scenario' | 'dossier' | 'verifica';

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

export function NeedModePage({ onBack, pin: pinProp = null, unlockedData = null, onUnlock, victimStatus }: NeedModePageProps) {
  // Show dossier tab when victimStatus is 'yes' or dossier data already exists
  const showDossierTab = victimStatus === 'yes' || hasDossierData();
  const [tab, setTab] = useState<NeedTab>(showDossierTab ? 'dossier' : 'base');
  // Seed local data from App-level unlocked data (avoids second PIN prompt).
  const [data, setData] = useState<EmergencyData | null>(unlockedData);
  const [localPin, setLocalPin] = useState<string | null>(pinProp);
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
      setLocalPin(enteredPin);
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

  const handleExportDossier = useCallback(async (dossier: DossierData) => {
    trackFeatureUsage('pdf_export');
    const { exportDossierPdf } = await import('@/lib/dossier-export');
    await exportDossierPdf(dossier);
  }, []);

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
            <p className="mt-2 text-base text-muted-foreground/70">
              Scenario: {attackMetaLabel}
            </p>
          )}
        </div>
        <button type="button" onClick={onBack} className="btn-secondary px-4">
          Indietro
        </button>
      </div>

      {/* Tabs */}
      <div className="flex rounded-2xl bg-white/5 p-1" role="tablist" aria-label="Sezioni modalità al bisogno">
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'base'}
          onClick={() => setTab('base')}
          className={`flex flex-1 items-center justify-center rounded-xl py-2.5 text-base font-medium transition-colors ${
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
          className={`flex flex-1 items-center justify-center rounded-xl py-2.5 text-base font-medium transition-colors ${
            tab === 'scenario'
              ? 'bg-cyan-brand/15 text-cyan-brand shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Mirato
        </button>
        {showDossierTab && (
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'dossier'}
            onClick={() => setTab('dossier')}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2.5 text-base font-medium transition-colors ${
              tab === 'dossier'
                ? 'bg-rose-500/15 text-rose-300 shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <FolderLock className="h-4 w-4" />
            Dossier
          </button>
        )}
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'verifica'}
          onClick={() => setTab('verifica')}
          className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2.5 text-base font-medium transition-colors ${
            tab === 'verifica'
              ? 'bg-amber-500/15 text-amber-300 shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <ShieldCheck className="h-4 w-4" />
          Verifica
        </button>
      </div>

      {/* Tab content */}
      {tab === 'verifica' ? (
        <Suspense fallback={
          <div className="flex items-center justify-center py-12">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-amber-400 border-t-transparent" />
          </div>
        }>
          <DataBreachCheck />
        </Suspense>
      ) : tab === 'dossier' ? (
        localPin ? (
          <div className="glass-card p-4 sm:p-6">
            <Suspense fallback={
              <div className="flex items-center justify-center py-12">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent" />
              </div>
            }>
              <DossierForm pin={localPin} onExport={handleExportDossier} />
            </Suspense>
          </div>
        ) : (
          <div className="glass-card flex flex-col items-center gap-4 p-8 text-center">
            <FolderLock className="h-10 w-10 text-rose-400" />
            <p className="text-base text-muted-foreground">
              Per accedere al dossier, inserisci il tuo PIN.
            </p>
            <button
              type="button"
              onClick={() => setShowPinDialog(true)}
              className="btn-primary"
            >
              Inserisci PIN
            </button>
          </div>
        )
      ) : (
        <>
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
        </>
      )}

      {/* PIN dialog (unlock) */}
      <PinDialog
        open={showPinDialog}
        mode="unlock"
        error={pinError}
        onSubmit={handlePinSubmit}
        onCancel={() => setShowPinDialog(false)}
      />

      {/* If there's no stored data, show a gentle empty state */}
      {!hasStoredData() && tab !== 'dossier' && tab !== 'verifica' && (
        <p className="text-center text-base text-muted-foreground">
          Non ci sono dati salvati. Torna indietro e salva prima i tuoi contatti.
        </p>
      )}
    </div>
  );
}
