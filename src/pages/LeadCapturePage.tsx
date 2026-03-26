import { lazy, Suspense } from 'react';
import * as m from 'motion/react-m';
import {
  ShieldCheck,
  Eye,
  Target,
  Lock,
  AlertTriangle,
  Dumbbell,
  Pause,
  LifeBuoy,
  GraduationCap,
  Briefcase,
  Shield,
  Heart,
  Users,
  ArrowRight,
} from 'lucide-react';
import { CyberpediaLogo } from '@/components/layout/CyberpediaLogo';
import { LeadCaptureForm } from '@/components/lead/LeadCaptureForm';

const QrCodeBeta = lazy(() =>
  import('@/components/layout/QrCodeBeta').then((m) => ({ default: m.QrCodeBeta })),
);

/* ── Static data ───────────────────────────────────────────── */

const VANTAGGI = [
  {
    icon: Eye,
    title: 'Riconosci',
    desc: 'Impara a identificare i segnali di una truffa prima che sia troppo tardi.',
  },
  {
    icon: Target,
    title: 'Allenati',
    desc: 'Simulazioni AI interattive che replicano le tecniche dei truffatori reali.',
  },
  {
    icon: Lock,
    title: 'Proteggi',
    desc: 'Strumenti pratici per proteggere te e le persone a cui tieni.',
  },
] as const;

const COSA_FA = [
  {
    icon: AlertTriangle,
    title: 'Riconoscere i segnali',
    desc: 'Checklist basate su fonti autorevoli (Polizia Postale, ENISA, FBI) per identificare ogni tipo di truffa.',
  },
  {
    icon: Dumbbell,
    title: 'Allenarsi con l\u2019AI',
    desc: 'Chat simulate con un truffatore AI che usa le stesse leve psicologiche dei criminali reali.',
  },
  {
    icon: Pause,
    title: 'Fermarsi in tempo',
    desc: 'Contatti di emergenza, numeri antifrode e azioni prioritizzate per bloccare la truffa.',
  },
  {
    icon: LifeBuoy,
    title: 'Recuperare dopo un attacco',
    desc: 'Guida passo-passo su cosa fare se hai gi\u00e0 fornito dati, soldi o accesso.',
  },
] as const;

const PER_CHI = [
  { icon: Users, text: 'Chiunque abbia ricevuto un messaggio sospetto' },
  { icon: Heart, text: 'Familiari anziani o poco esperti di tecnologia' },
  { icon: GraduationCap, text: 'Studenti e giovani (target crescente)' },
  { icon: Briefcase, text: 'Professionisti e aziende sotto attacco' },
  { icon: Shield, text: 'Formatori e forze dell\u2019ordine' },
] as const;

/* ── Animation variants ────────────────────────────────────── */
const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-40px' },
  transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const },
};

/* ── Page ──────────────────────────────────────────────────── */

interface LeadCapturePageProps {
  /** Called after beta access is granted — transitions to main app */
  onBetaGranted?: () => void;
}

export function LeadCapturePage({ onBetaGranted }: LeadCapturePageProps = {}) {
  return (
    <div className="mx-auto flex min-h-dvh max-w-2xl flex-col gap-16 px-4 py-12 md:px-8 lg:max-w-4xl lg:px-12">
      {/* ── HERO ──────────────────────────────────────────── */}
      <m.section {...fadeUp} className="flex flex-col items-center gap-6 text-center">
        <CyberpediaLogo width={200} showTagline className="sm:w-[260px]" />

        <div className="relative flex h-14 w-14 items-center justify-center">
          <span
            className="absolute inset-0 rounded-full opacity-30 blur-xl"
            style={{ background: 'oklch(0.82 0.09 200 / 40%)' }}
            aria-hidden="true"
          />
          <div className="relative flex h-14 w-14 items-center justify-center rounded-full border border-cyan-brand/20 bg-cyan-brand/10">
            <ShieldCheck className="h-7 w-7 text-cyan-brand" strokeWidth={1.5} aria-hidden="true" />
          </div>
        </div>

        <h1 className="text-3xl font-bold leading-tight tracking-tight text-foreground sm:text-4xl md:text-5xl">
          Fermati prima del passo
          <br />
          <span className="text-cyan-brand">irreversibile.</span>
        </h1>

        <p className="mx-auto max-w-lg text-lg leading-relaxed text-muted-foreground">
          La prima palestra mentale anti-truffa italiana. Allenati a riconoscere
          le manipolazioni psicologiche con simulazioni AI realistiche.
        </p>

        <a
          href="#lead-form"
          className="btn-primary inline-flex items-center gap-2 text-lg"
          onClick={(e) => {
            e.preventDefault();
            document.getElementById('lead-form')?.scrollIntoView({ behavior: 'smooth' });
          }}
        >
          Accedi in anteprima
          <ArrowRight className="h-5 w-5" />
        </a>
      </m.section>

      {/* ── 3 VANTAGGI ────────────────────────────────────── */}
      <m.section {...fadeUp} className="grid gap-5 sm:grid-cols-3">
        {VANTAGGI.map(({ icon: Icon, title, desc }) => (
          <div key={title} className="glass-card flex flex-col items-center gap-3 p-6 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-brand/10">
              <Icon className="h-6 w-6 text-cyan-brand" strokeWidth={1.5} />
            </div>
            <h3 className="text-lg font-bold text-foreground">{title}</h3>
            <p className="text-sm leading-relaxed text-muted-foreground">{desc}</p>
          </div>
        ))}
      </m.section>

      {/* ── COSA FA ───────────────────────────────────────── */}
      <m.section {...fadeUp} className="space-y-6">
        <h2 className="text-center text-2xl font-bold text-foreground sm:text-3xl">
          Cosa fa questo strumento
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {COSA_FA.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="glass-card flex gap-4 p-5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-brand/10">
                <Icon className="h-5 w-5 text-cyan-brand" strokeWidth={1.5} />
              </div>
              <div>
                <h3 className="text-base font-bold text-foreground">{title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </m.section>

      {/* ── PER CHI ───────────────────────────────────────── */}
      <m.section {...fadeUp} className="space-y-6">
        <h2 className="text-center text-2xl font-bold text-foreground sm:text-3xl">
          Per chi è pensato
        </h2>
        <ul className="space-y-3">
          {PER_CHI.map(({ icon: Icon, text }) => (
            <li key={text} className="flex items-center gap-3 rounded-2xl border border-white/5 bg-white/5 px-5 py-3">
              <Icon className="h-5 w-5 shrink-0 text-cyan-brand" strokeWidth={1.5} />
              <span className="text-base text-foreground">{text}</span>
            </li>
          ))}
        </ul>
      </m.section>

      {/* ── MESSAGGIO IDENTITARIO ─────────────────────────── */}
      <m.section
        {...fadeUp}
        className="glass-card flex flex-col items-center gap-4 p-8 text-center"
      >
        <h2 className="text-2xl font-bold text-foreground sm:text-3xl">
          Dalla prevenzione passiva
          <br />
          alla prevenzione <span className="text-cyan-brand">attiva</span>.
        </h2>
        <p className="max-w-md text-base leading-relaxed text-muted-foreground">
          Non basta sapere che le truffe esistono. Serve allenarsi a riconoscerle
          quando colpiscono le emozioni. Questo strumento trasforma la consapevolezza
          in competenza pratica.
        </p>
      </m.section>

      {/* ── FORM + QR ─────────────────────────────────────── */}
      <section id="lead-form" className="grid gap-8 lg:grid-cols-[1fr_auto]">
        <LeadCaptureForm onBetaGranted={onBetaGranted} />

        <div className="flex flex-col items-center gap-3 self-start">
          <Suspense fallback={null}>
            <QrCodeBeta width={180} />
          </Suspense>
          <p className="text-center text-xs text-muted-foreground">
            Scansiona per aprire<br />questa pagina
          </p>
        </div>
      </section>

      {/* ── FOOTER ────────────────────────────────────────── */}
      <footer className="border-t border-white/10 pt-6 text-center text-sm text-muted-foreground">
        <p>
          <a
            href="https://cyberpedia.it"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 transition-colors hover:text-foreground"
          >
            cyberpedia.it
          </a>{' '}
          &mdash; Cybersecurity per il fattore umano
        </p>
      </footer>
    </div>
  );
}
