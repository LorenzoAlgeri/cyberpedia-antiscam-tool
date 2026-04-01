import { useState, useCallback, useRef, useEffect } from 'react';
import * as m from 'motion/react-m';
import { CheckCircle2, AlertCircle, Loader2, ArrowRight } from 'lucide-react';

const WORKER_BASE =
  'https://antiscam-worker.lorenzo-algeri.workers.dev';

type FormStatus = 'idle' | 'submitting' | 'success' | 'error';

interface FormData {
  name: string;
  email: string;
  note: string;
  consent: boolean;
  consentMarketing: boolean;
}

const INITIAL: FormData = {
  name: '',
  email: '',
  note: '',
  consent: false,
  consentMarketing: false,
};

const BETA_TOKEN_KEY = 'cyberpedia-beta-access';

interface LeadCaptureFormProps {
  /** Called after beta token is saved — triggers app unlock */
  onBetaGranted?: () => void;
}

export function LeadCaptureForm({ onBetaGranted }: LeadCaptureFormProps = {}) {
  const [form, setForm] = useState<FormData>(INITIAL);
  const [status, setStatus] = useState<FormStatus>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const formRef = useRef<HTMLFormElement>(null);

  const update = useCallback(
    <K extends keyof FormData>(key: K, value: FormData[K]) =>
      setForm((prev) => ({ ...prev, [key]: value })),
    [],
  );

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (status === 'submitting') return;

      if (!form.consent) {
        setErrorMsg('Devi dichiarare di aver letto e accettato l\'Informativa Privacy.');
        setStatus('error');
        return;
      }

      setStatus('submitting');
      setErrorMsg('');

      try {
        const res = await fetch(`${WORKER_BASE}/api/lead`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        });

        if (!res.ok) {
          const body = await res.json().catch(() => ({ error: 'Errore di rete.' }));
          throw new Error((body as { error?: string }).error ?? `HTTP ${res.status}`);
        }

        const data = await res.json() as { success: boolean; betaToken?: string };
        if (data.betaToken) {
          localStorage.setItem(BETA_TOKEN_KEY, data.betaToken);
        }

        setStatus('success');
      } catch (err) {
        setErrorMsg(err instanceof Error ? err.message : 'Errore imprevisto.');
        setStatus('error');
      }
    },
    [form, status],
  );

  // Auto-unlock after 3s if callback provided
  useEffect(() => {
    if (status === 'success' && onBetaGranted) {
      const timer = setTimeout(onBetaGranted, 3000);
      return () => clearTimeout(timer);
    }
  }, [status, onBetaGranted]);

  if (status === 'success') {
    return (
      <m.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card flex flex-col items-center gap-4 p-8 text-center"
      >
        <CheckCircle2 className="h-12 w-12 text-success" strokeWidth={1.5} />
        <h3 className="text-2xl font-bold text-foreground">Richiesta inviata</h3>
        {onBetaGranted ? (
          <>
            <p className="text-base text-muted-foreground">
              Grazie per il tuo interesse! Accedi ora al tool.
            </p>
            <button
              type="button"
              onClick={onBetaGranted}
              className="btn-primary mt-2 inline-flex items-center gap-2"
            >
              Entra nel tool
              <ArrowRight className="h-5 w-5" />
            </button>
          </>
        ) : (
          <p className="text-base text-muted-foreground">
            Sei nella lista prioritaria! Ti contatteremo con le prossime
            informazioni sul progetto. Grazie per il tuo interesse.
          </p>
        )}
      </m.div>
    );
  }

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      className="glass-card space-y-5 p-6 sm:p-8"
      noValidate
    >
      {/* Header */}
      <div className="space-y-2">
        <h3 className="text-xl font-bold text-foreground">
          Richiedi accesso prioritario
        </h3>
        <p className="text-base text-muted-foreground">
          Stiamo aprendo i primi 100 accessi alla beta privata.
          Lascia i tuoi dati per entrare nella lista prioritaria e ricevere
          le prossime informazioni sul progetto.
        </p>
      </div>

      {/* Name */}
      <input
        type="text"
        placeholder="Nome e cognome"
        required
        maxLength={100}
        value={form.name}
        onChange={(e) => update('name', e.target.value)}
        className="input-glass"
        autoComplete="name"
      />

      {/* Email */}
      <input
        type="email"
        placeholder="Email"
        required
        maxLength={254}
        value={form.email}
        onChange={(e) => update('email', e.target.value)}
        className="input-glass"
        autoComplete="email"
      />

      {/* Risk interest (optional) */}
      <div className="space-y-1">
        <p className="text-sm text-muted-foreground">
          Quale tipo di rischio ti interessa di più?{' '}
          <span className="text-muted-foreground/60">(facoltativo)</span>
        </p>
        <textarea
          placeholder="Truffe sentimentali, phishing, finti operatori bancari, marketplace, altro…"
          maxLength={500}
          rows={3}
          value={form.note}
          onChange={(e) => update('note', e.target.value)}
          className="input-glass resize-none"
        />
      </div>

      {/* Privacy notice */}
      <div className="rounded-2xl border border-white/5 bg-white/5 px-4 py-3 text-sm leading-relaxed text-muted-foreground">
        <p className="mb-1 font-semibold text-foreground">Informativa breve</p>
        <p>
          I dati che inserisci saranno utilizzati per gestire la tua richiesta
          di accesso prioritario, ricontattarti in merito al progetto e
          organizzare l&apos;eventuale accesso alla beta. Per maggiori
          informazioni sul trattamento dei dati personali, consulta l&apos;
          <a
            href="https://cyberpedia.it/privacy-policy/"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 transition-colors hover:text-foreground"
          >
            Informativa Privacy
          </a>
          .
        </p>
      </div>

      {/* Consent — mandatory */}
      <label className="flex cursor-pointer items-start gap-3 text-sm text-muted-foreground">
        <input
          type="checkbox"
          checked={form.consent}
          onChange={(e) => update('consent', e.target.checked)}
          className="mt-0.5 h-5 w-5 shrink-0 cursor-pointer rounded border-white/20 bg-slate-900/60 accent-cyan-brand"
          required
        />
        <span>
          Dichiaro di aver letto l&apos;
          <a
            href="https://cyberpedia.it/privacy-policy/"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 transition-colors hover:text-foreground"
          >
            Informativa Privacy
          </a>
          {' '}e acconsento al trattamento dei miei dati per la gestione
          della richiesta di accesso prioritario.{' '}
          <span className="text-destructive">*</span>
        </span>
      </label>

      {/* Consent marketing — optional */}
      <label className="flex cursor-pointer items-start gap-3 text-sm text-muted-foreground">
        <input
          type="checkbox"
          checked={form.consentMarketing}
          onChange={(e) => update('consentMarketing', e.target.checked)}
          className="mt-0.5 h-5 w-5 shrink-0 cursor-pointer rounded border-white/20 bg-slate-900/60 accent-cyan-brand"
        />
        <span>
          Acconsento a ricevere aggiornamenti, novità sul progetto e
          comunicazioni informative da Cyberpedia.
        </span>
      </label>

      {/* Error */}
      {status === 'error' && errorMsg && (
        <div className="flex items-center gap-2 text-sm text-destructive" role="alert">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={status === 'submitting'}
        className="btn-primary flex w-full items-center justify-center gap-2"
      >
        {status === 'submitting' ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            Invio in corso...
          </>
        ) : (
          'Richiedi accesso prioritario'
        )}
      </button>

      {/* Scarcity note */}
      <p className="text-center text-sm text-muted-foreground/60">
        Accesso iniziale riservato ai primi 100 partecipanti selezionati.
      </p>
    </form>
  );
}
