import { motion } from 'motion/react';
import { CheckCircle, Download } from 'lucide-react';
import { useDeviceInfo } from '@/hooks/useDeviceInfo';
import { getInstallGuide } from '@/data/install-guides';
import { InstallGuide } from '@/components/install/InstallGuide';

interface InstallPageProps {
  readonly onBack: () => void;
}

/**
 * Step 4 — PWA install guide with OS/browser auto-detection.
 *
 * /mobile-ios-design: shows Safari share-sheet instructions for iOS.
 * /mobile-android-design: shows Chrome/Samsung install steps for Android.
 * /interaction-design: stagger entrance, success state for standalone.
 *
 * If the app is already installed (standalone mode), shows a success
 * message instead of the install guide.
 */
export function InstallPage({ onBack }: InstallPageProps) {
  const device = useDeviceInfo();
  const guide = getInstallGuide(device.os, device.browser);

  return (
    <div className="flex flex-col items-center gap-8 px-4 py-8 text-center">
      {/* Header icon */}
      <motion.div
        className="flex h-16 w-16 items-center justify-center rounded-full bg-cyan-brand/10"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        {device.isStandalone ? (
          <CheckCircle className="h-8 w-8 text-[var(--success)]" strokeWidth={1.5} />
        ) : (
          <Download className="h-8 w-8 text-cyan-brand" strokeWidth={1.5} />
        )}
      </motion.div>

      {/* Title + subtitle */}
      <motion.div
        className="flex flex-col gap-2"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.05 }}
      >
        <h2 className="text-3xl font-bold text-foreground">
          {device.isStandalone
            ? 'App già installata!'
            : 'Installa sulla Home Screen'}
        </h2>
        <p className="max-w-md text-muted-foreground">
          {device.isStandalone
            ? 'Hai già accesso rapido al tool dal tuo dispositivo.'
            : 'In caso di truffa, lo aprirai in 2 secondi.'}
        </p>
      </motion.div>

      {/* Install guide or success card */}
      <motion.div
        className="glass-card w-full max-w-md p-6"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.12 }}
      >
        {device.isStandalone ? (
          <p className="text-base text-muted-foreground">
            Stai già usando l&apos;app in modalità standalone.
            Puoi trovarla nella tua Home Screen.
          </p>
        ) : (
          <InstallGuide guide={guide} />
        )}
      </motion.div>

      {/* Device info badge (subtle) */}
      {!device.isStandalone && (
        <motion.p
          className="text-xs text-muted-foreground/60"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          Rilevato: {guide.title}
        </motion.p>
      )}

      {/* Back button */}
      <motion.button
        type="button"
        onClick={onBack}
        className="rounded-2xl border border-white/10 bg-secondary px-8 py-4 text-lg font-medium text-secondary-foreground transition-colors hover:bg-secondary/80"
        style={{ minHeight: 44 }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        Torna indietro
      </motion.button>
    </div>
  );
}
