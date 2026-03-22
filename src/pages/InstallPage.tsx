import * as m from 'motion/react-m';
import { CheckCircle, Download, Zap } from 'lucide-react';
import { useDeviceInfo } from '@/hooks/useDeviceInfo';
import { useInstallPrompt } from '@/hooks/useInstallPrompt';
import { getInstallGuide } from '@/data/install-guides';
import { InstallGuide } from '@/components/install/InstallGuide';

interface InstallPageProps {
  readonly onNext: () => void;
  readonly onBack: () => void;
}

/**
 * Step 4 — PWA install guide with OS/browser auto-detection.
 *
 * /mobile-ios-design: Safari share-sheet instructions for iOS.
 * /mobile-android-design: Chrome native install prompt for Android.
 * /interaction-design: stagger entrance, success/installed states.
 *
 * Three states:
 * 1. Standalone → already installed, show success
 * 2. Native prompt available → one-click install button
 * 3. Fallback → step-by-step manual guide
 */
export function InstallPage({ onNext, onBack }: InstallPageProps) {
  const device = useDeviceInfo();
  const { isInstallReady, isInstalled, promptInstall } = useInstallPrompt();
  const guide = getInstallGuide(device.os, device.browser);

  const showSuccess = device.isStandalone || isInstalled;

  return (
    <div className="flex flex-col items-center gap-8 px-4 py-8 text-center">
      {/* Header icon */}
      <m.div
        className="flex h-16 w-16 items-center justify-center rounded-full bg-cyan-brand/10"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        {showSuccess ? (
          <CheckCircle className="h-8 w-8 text-[var(--success)]" strokeWidth={1.5} />
        ) : (
          <Download className="h-8 w-8 text-cyan-brand" strokeWidth={1.5} />
        )}
      </m.div>

      {/* Title + subtitle */}
      <m.div
        className="flex flex-col gap-2"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.05 }}
      >
        <h2 className="text-3xl font-bold text-foreground">
          {showSuccess ? 'App installata!' : 'Installa sulla Home Screen'}
        </h2>
        <p className="max-w-md text-muted-foreground">
          {showSuccess
            ? 'Hai già accesso rapido al tool dal tuo dispositivo.'
            : 'In caso di truffa, lo aprirai in 2 secondi.'}
        </p>
      </m.div>

      {/* Native install button (Chrome/Edge on Android/Desktop) */}
      {isInstallReady && !showSuccess && (
        <m.button
          type="button"
          onClick={() => void promptInstall()}
          className="flex items-center gap-3 rounded-2xl bg-gradient-to-r from-cyan-500 to-cyan-400 px-8 py-4 text-lg font-semibold text-primary-foreground shadow-xl shadow-cyan-500/25 transition-transform active:scale-[0.98]"
          style={{ minHeight: 44 }}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <Zap className="h-5 w-5" strokeWidth={2} />
          Installa con un click
        </m.button>
      )}

      {/* Install guide or success card */}
      <m.div
        className="glass-card w-full max-w-md p-6"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.12 }}
      >
        {showSuccess ? (
          <p className="text-base text-muted-foreground">
            {isInstalled
              ? 'Installazione completata! Troverai l\u2019app nella tua Home Screen.'
              : 'Stai già usando l\u2019app in modalità standalone.'}
          </p>
        ) : (
          <>
            {isInstallReady && (
              <p className="mb-4 text-base text-muted-foreground">
                Oppure segui la guida manuale:
              </p>
            )}
            <InstallGuide guide={guide} />
          </>
        )}
      </m.div>

      {/* Device info badge */}
      {!showSuccess && (
        <m.p
          className="text-base text-muted-foreground/60"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          Rilevato: {guide.title}
        </m.p>
      )}

      {/* Back button */}
      <div className="flex w-full max-w-md gap-3">
        <m.button
          type="button"
          onClick={onBack}
          className="btn-secondary flex-1"
          style={{ minHeight: 44 }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          Indietro
        </m.button>
        <m.button
          type="button"
          onClick={onNext}
          className="btn-primary flex-1"
          style={{ minHeight: 44 }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.22 }}
        >
          Modalità al bisogno
        </m.button>
      </div>
    </div>
  );
}
