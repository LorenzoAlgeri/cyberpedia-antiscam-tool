import { useState, useCallback, useEffect, useRef } from 'react';
import { Plus, Trash2, Save, FileDown, Loader2, CheckCircle2 } from 'lucide-react';
import type { DossierData, DossierScreenshot, ScammerContact } from '@/types/dossier';
import { createEmptyDossier } from '@/types/dossier';
import { saveDossierData, loadDossierData, hasDossierData } from '@/lib/dossier-storage';
import { ScreenshotUpload } from './ScreenshotUpload';

const CONTACT_TYPES = [
  { value: 'phone' as const, label: 'Telefono' },
  { value: 'email' as const, label: 'Email' },
  { value: 'social' as const, label: 'Social' },
  { value: 'other' as const, label: 'Altro' },
];

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

interface DossierFormProps {
  readonly pin: string;
  /** Called when PDF export is requested */
  readonly onExport?: (data: DossierData) => void;
}

export function DossierForm({ pin, onExport }: DossierFormProps) {
  const [data, setData] = useState<DossierData>(createEmptyDossier);
  const [isLoading, setIsLoading] = useState(() => hasDossierData());
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [loadError, setLoadError] = useState<string | null>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load existing dossier on mount
  useEffect(() => {
    if (!hasDossierData()) {
      queueMicrotask(() => setIsLoading(false));
      return;
    }
    void loadDossierData(pin)
      .then((loaded) => {
        if (loaded) setData(loaded);
      })
      .catch(() => {
        setLoadError('Impossibile decriptare il dossier. Controlla il PIN.');
      })
      .finally(() => setIsLoading(false));
  }, [pin]);

  // Auto-save with 2s debounce
  const scheduleAutoSave = useCallback(() => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      void saveDossierData(data, pin)
        .then(() => {
          setSaveStatus('saved');
          setTimeout(() => setSaveStatus('idle'), 2000);
        })
        .catch(() => setSaveStatus('error'));
    }, 2000);
  }, [data, pin]);

  // Trigger auto-save on data changes (skip initial load)
  const didLoadRef = useRef(false);
  useEffect(() => {
    if (isLoading) return;
    if (!didLoadRef.current) { didLoadRef.current = true; return; }
    queueMicrotask(() => setSaveStatus('saving'));
    scheduleAutoSave();
    return () => { if (saveTimerRef.current) clearTimeout(saveTimerRef.current); };
  }, [data, isLoading, scheduleAutoSave]);

  const handleManualSave = useCallback(async () => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    setSaveStatus('saving');
    try {
      await saveDossierData(data, pin);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch {
      setSaveStatus('error');
    }
  }, [data, pin]);

  // --- Field updaters ---
  const updateField = useCallback(<K extends keyof DossierData>(key: K, value: DossierData[K]) => {
    setData((prev) => ({ ...prev, [key]: value }));
  }, []);

  const addContact = useCallback(() => {
    setData((prev) => ({
      ...prev,
      scammerContacts: [...prev.scammerContacts, { type: 'phone', value: '', label: '' }],
    }));
  }, []);

  const updateContact = useCallback((index: number, field: keyof ScammerContact, value: string) => {
    setData((prev) => ({
      ...prev,
      scammerContacts: prev.scammerContacts.map((c, i) =>
        i === index ? { ...c, [field]: value } : c,
      ),
    }));
  }, []);

  const removeContact = useCallback((index: number) => {
    setData((prev) => ({
      ...prev,
      scammerContacts: prev.scammerContacts.filter((_, i) => i !== index),
    }));
  }, []);

  const addScreenshot = useCallback((screenshot: DossierScreenshot) => {
    setData((prev) => ({
      ...prev,
      screenshots: [...prev.screenshots, screenshot],
    }));
  }, []);

  const removeScreenshot = useCallback((index: number) => {
    setData((prev) => ({
      ...prev,
      screenshots: prev.screenshots.filter((_, i) => i !== index),
    }));
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-cyan-brand" />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-base text-red-300">
        {loadError}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Save status indicator */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">Dossier Truffa</h3>
        <div className="flex items-center gap-2 text-sm">
          {saveStatus === 'saving' && (
            <span className="flex items-center gap-1 text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Salvataggio...
            </span>
          )}
          {saveStatus === 'saved' && (
            <span className="flex items-center gap-1 text-emerald-400">
              <CheckCircle2 className="h-3.5 w-3.5" /> Salvato
            </span>
          )}
          {saveStatus === 'error' && (
            <span className="text-red-400">Errore salvataggio</span>
          )}
        </div>
      </div>

      {/* Scammer identity */}
      <div className="space-y-3">
        <label className="text-base font-medium text-foreground">
          Nome / nickname del truffatore
        </label>
        <input
          type="text"
          value={data.scammerName}
          onChange={(e) => updateField('scammerName', e.target.value)}
          placeholder="Es. Marco_Roma88, Maria, numero sconosciuto..."
          maxLength={200}
          className="w-full rounded-2xl border-2 border-slate-800 bg-slate-900/60 p-4 text-base text-foreground placeholder:text-muted-foreground/50 focus:border-cyan-400 focus:outline-none focus:ring-4 focus:ring-cyan-400/30"
        />
      </div>

      {/* Scammer contacts */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-base font-medium text-foreground">
            Contatti del truffatore
          </label>
          <button
            type="button"
            onClick={addContact}
            className="flex items-center gap-1 rounded-xl bg-slate-800 px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-slate-700"
          >
            <Plus className="h-3.5 w-3.5" /> Aggiungi
          </button>
        </div>
        {data.scammerContacts.length === 0 && (
          <p className="text-sm text-muted-foreground/60">
            Nessun contatto aggiunto. Clicca &quot;Aggiungi&quot; per inserire telefono, email o profilo social.
          </p>
        )}
        {data.scammerContacts.map((contact, i) => (
          <div key={i} className="flex gap-2">
            <select
              value={contact.type}
              onChange={(e) => updateContact(i, 'type', e.target.value)}
              className="w-28 shrink-0 rounded-xl border-2 border-slate-800 bg-slate-900/60 px-3 py-3 text-base text-foreground focus:border-cyan-400 focus:outline-none"
            >
              {CONTACT_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
            <input
              type="text"
              value={contact.value}
              onChange={(e) => updateContact(i, 'value', e.target.value)}
              placeholder="Valore (numero, email, @username...)"
              maxLength={300}
              className="min-w-0 flex-1 rounded-xl border-2 border-slate-800 bg-slate-900/60 px-3 py-3 text-base text-foreground placeholder:text-muted-foreground/50 focus:border-cyan-400 focus:outline-none"
            />
            <button
              type="button"
              onClick={() => removeContact(i)}
              className="flex h-[50px] w-[50px] shrink-0 items-center justify-center rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 transition-colors hover:bg-red-500/20"
              aria-label="Rimuovi contatto"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>

      {/* Screenshots */}
      <ScreenshotUpload
        screenshots={data.screenshots}
        onAdd={addScreenshot}
        onRemove={removeScreenshot}
      />

      {/* Notes */}
      <div className="space-y-3">
        <label className="text-base font-medium text-foreground">
          Note e conversazioni sospette
        </label>
        <textarea
          value={data.notes}
          onChange={(e) => updateField('notes', e.target.value)}
          placeholder="Descrivi cosa e successo, copia messaggi sospetti, annotazioni utili per la denuncia..."
          rows={4}
          maxLength={5000}
          className="w-full rounded-2xl border-2 border-slate-800 bg-slate-900/60 p-4 text-base text-foreground placeholder:text-muted-foreground/50 focus:border-cyan-400 focus:outline-none focus:ring-4 focus:ring-cyan-400/30"
        />
      </div>

      {/* Dates */}
      <div className="space-y-3">
        <label className="text-base font-medium text-foreground">
          Date importanti
        </label>
        <textarea
          value={data.dates}
          onChange={(e) => updateField('dates', e.target.value)}
          placeholder="Es: 10 marzo — primo contatto via WhatsApp&#10;15 marzo — richiesta di denaro&#10;18 marzo — secondo bonifico"
          rows={3}
          maxLength={2000}
          className="w-full rounded-2xl border-2 border-slate-800 bg-slate-900/60 p-4 text-base text-foreground placeholder:text-muted-foreground/50 focus:border-cyan-400 focus:outline-none focus:ring-4 focus:ring-cyan-400/30"
        />
      </div>

      {/* Amounts */}
      <div className="space-y-3">
        <label className="text-base font-medium text-foreground">
          Importi coinvolti
        </label>
        <textarea
          value={data.amounts}
          onChange={(e) => updateField('amounts', e.target.value)}
          placeholder="Es: 500 EUR — bonifico del 15 marzo&#10;200 EUR — ricarica telefonica"
          rows={2}
          maxLength={2000}
          className="w-full rounded-2xl border-2 border-slate-800 bg-slate-900/60 p-4 text-base text-foreground placeholder:text-muted-foreground/50 focus:border-cyan-400 focus:outline-none focus:ring-4 focus:ring-cyan-400/30"
        />
      </div>

      {/* Action buttons */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => void handleManualSave()}
          className="flex items-center justify-center gap-2 rounded-2xl border border-slate-700/50 bg-slate-800 px-5 py-3.5 text-base font-medium text-foreground transition-colors hover:bg-slate-700"
          style={{ minHeight: 44 }}
        >
          <Save className="h-4.5 w-4.5" />
          Salva dossier
        </button>
        <button
          type="button"
          onClick={() => onExport?.(data)}
          disabled={!data.scammerName.trim() && data.scammerContacts.length === 0 && !data.notes.trim()}
          className="btn-primary flex items-center justify-center gap-2 disabled:opacity-50"
          style={{ minHeight: 44 }}
        >
          <FileDown className="h-4.5 w-4.5" />
          Prepara per denuncia
        </button>
      </div>

      <p className="text-center text-sm text-muted-foreground/60">
        Tutti i dati restano cifrati sul tuo dispositivo. Nulla viene inviato online.
      </p>
    </div>
  );
}
