import { useState, useCallback, useRef } from 'react';
import * as m from 'motion/react-m';
import { Send, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

const WORKER_BASE =
  'https://antiscam-worker.lorenzo-algeri.workers.dev';

const VALID_ROLES = [
  { value: 'docente', label: 'Docente / Formatore' },
  { value: 'studente', label: 'Studente' },
  { value: 'professionista-it', label: 'Professionista IT / Cybersecurity' },
  { value: 'forze-ordine', label: 'Forze dell\u2019ordine' },
  { value: 'altro', label: 'Altro' },
] as const;

type FormStatus = 'idle' | 'submitting' | 'success' | 'error';

interface FormData {
  name: string;
  email: string;
  role: string;
  note: string;
  consent: boolean;
}

const INITIAL: FormData = { name: '', email: '', role: '', note: '', consent: false };

export function LeadCaptureForm() {
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
        setErrorMsg('Devi acconsentire al trattamento dei dati.');
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

        setStatus('success');
      } catch (err) {
        setErrorMsg(err instanceof Error ? err.message : 'Errore imprevisto.');
        setStatus('error');
      }
    },
    [form, status],
  );

  if (status === 'success') {
    return (
      <m.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card flex flex-col items-center gap-4 p-8 text-center"
      >
        <CheckCircle2 className="h-12 w-12 text-success" strokeWidth={1.5} />
        <h3 className="text-2xl font-bold text-foreground">Iscrizione completata</h3>
        <p className="text-base text-muted-foreground">
          Ti contatteremo con aggiornamenti sul progetto. Grazie per il tuo interesse!
        </p>
      </m.div>
    );
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="glass-card space-y-5 p-6 sm:p-8" noValidate>
      <h3 className="text-xl font-bold text-foreground">Resta aggiornato</h3>
      <p className="text-base text-muted-foreground">
        Lascia i tuoi dati per ricevere aggiornamenti sul lancio e accesso anticipato.
      </p>

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

      {/* Role */}
      <select
        required
        value={form.role}
        onChange={(e) => update('role', e.target.value)}
        className="input-glass cursor-pointer appearance-none"
        aria-label="Il tuo ruolo"
      >
        <option value="" disabled>Seleziona il tuo ruolo</option>
        {VALID_ROLES.map((r) => (
          <option key={r.value} value={r.value}>{r.label}</option>
        ))}
      </select>

      {/* Note (optional) */}
      <textarea
        placeholder="Note o commenti (facoltativo)"
        maxLength={500}
        rows={3}
        value={form.note}
        onChange={(e) => update('note', e.target.value)}
        className="input-glass resize-none"
      />

      {/* GDPR Consent */}
      <label className="flex cursor-pointer items-start gap-3 text-sm text-muted-foreground">
        <input
          type="checkbox"
          checked={form.consent}
          onChange={(e) => update('consent', e.target.checked)}
          className="mt-0.5 h-5 w-5 shrink-0 cursor-pointer rounded border-white/20 bg-slate-900/60 accent-cyan-brand"
          required
        />
        <span>
          Acconsento al trattamento dei miei dati personali (nome, email, ruolo) per
          ricevere aggiornamenti sul progetto Cyberpedia Anti-Truffa.
          I dati sono conservati in modo sicuro e non saranno ceduti a terzi.{' '}
          <a
            href="https://cyberpedia.it/privacy-policy"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 transition-colors hover:text-foreground"
          >
            Informativa privacy
          </a>
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
          <>
            <Send className="h-5 w-5" />
            Iscriviti
          </>
        )}
      </button>
    </form>
  );
}
