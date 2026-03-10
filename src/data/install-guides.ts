/**
 * Install guide data — step-by-step PWA install instructions
 * for each OS + browser combination.
 *
 * /mobile-ios-design: Safari share-sheet flow (no native prompt).
 * /mobile-android-design: Chrome banner + Samsung Internet menu.
 *
 * Copy in Italian. Each guide has a title, an icon key for Lucide,
 * and ordered steps with optional emphasis text.
 */

import type { Browser, OperatingSystem } from '@/types/device';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface InstallStep {
  /** Step instruction text (Italian) */
  readonly text: string;
  /** Optional emphasis/clarification shown below */
  readonly hint?: string;
}

export interface InstallGuideData {
  /** Guide title, e.g. "Safari su iPhone" */
  readonly title: string;
  /** Lucide icon key */
  readonly icon: string;
  /** Ordered installation steps */
  readonly steps: readonly InstallStep[];
}

// ---------------------------------------------------------------------------
// Guide definitions
// ---------------------------------------------------------------------------

const iosSafari: InstallGuideData = {
  title: 'Safari su iPhone / iPad',
  icon: 'Smartphone',
  steps: [
    { text: 'Tocca l\'icona di condivisione in basso', hint: 'Il quadrato con la freccia verso l\'alto' },
    { text: 'Scorri e tocca "Aggiungi alla schermata Home"' },
    { text: 'Conferma toccando "Aggiungi" in alto a destra' },
    { text: 'L\'app apparirà nella tua Home Screen', hint: 'Puoi spostarla come qualsiasi altra app' },
  ],
};

const iosChrome: InstallGuideData = {
  title: 'Chrome su iPhone / iPad',
  icon: 'Smartphone',
  steps: [
    { text: 'Chrome su iOS non supporta l\'installazione diretta' },
    { text: 'Apri questa pagina in Safari', hint: 'Tocca i tre puntini ⋯ → "Apri in Safari"' },
    { text: 'In Safari, tocca l\'icona di condivisione' },
    { text: 'Tocca "Aggiungi alla schermata Home"' },
  ],
};

const androidChrome: InstallGuideData = {
  title: 'Chrome su Android',
  icon: 'Smartphone',
  steps: [
    { text: 'Tocca "Installa" nel banner che appare', hint: 'Se il banner non appare, usa il passo successivo' },
    { text: 'In alternativa: tocca i tre puntini ⋮ in alto' },
    { text: 'Seleziona "Installa app" o "Aggiungi a schermata Home"' },
    { text: 'Conferma toccando "Installa"', hint: 'L\'app apparirà nel cassetto applicazioni' },
  ],
};

const androidSamsung: InstallGuideData = {
  title: 'Samsung Internet',
  icon: 'Smartphone',
  steps: [
    { text: 'Tocca il menu ☰ in basso a destra' },
    { text: 'Seleziona "Aggiungi pagina a" → "Schermata Home"' },
    { text: 'Conferma toccando "Aggiungi"' },
    { text: 'L\'icona apparirà nella tua Home Screen' },
  ],
};

const androidFirefox: InstallGuideData = {
  title: 'Firefox su Android',
  icon: 'Smartphone',
  steps: [
    { text: 'Tocca i tre puntini ⋮ in alto a destra' },
    { text: 'Seleziona "Installa"', hint: 'Se non vedi "Installa", cerca "Aggiungi alla schermata Home"' },
    { text: 'Conferma l\'installazione' },
  ],
};

const desktopChrome: InstallGuideData = {
  title: 'Chrome su Desktop',
  icon: 'Monitor',
  steps: [
    { text: 'Clicca i tre puntini ⋮ in alto a destra' },
    { text: 'Seleziona "Trasmetti, salva e condividi"' },
    { text: 'Clicca "Installa pagina come app..."' },
    { text: 'Conferma cliccando "Installa"', hint: 'L\'app si aprirà in una finestra dedicata' },
  ],
};

const desktopEdge: InstallGuideData = {
  title: 'Edge su Desktop',
  icon: 'Monitor',
  steps: [
    { text: 'Clicca l\'icona di installazione nella barra degli indirizzi' },
    { text: 'In alternativa: menu ⋯ → "App" → "Installa questo sito come app"' },
    { text: 'Conferma cliccando "Installa"' },
  ],
};

const desktopFirefox: InstallGuideData = {
  title: 'Firefox su Desktop',
  icon: 'Monitor',
  steps: [
    { text: 'Firefox Desktop non supporta l\'installazione PWA nativa' },
    { text: 'Puoi aggiungere questa pagina ai segnalibri', hint: 'Premi Ctrl+D (o ⌘+D su Mac)' },
    { text: 'Oppure apri questa pagina in Chrome o Edge per installarla' },
  ],
};

const genericDesktop: InstallGuideData = {
  title: 'Desktop',
  icon: 'Monitor',
  steps: [
    { text: 'Apri questa pagina in Chrome o Edge' },
    { text: 'Clicca l\'icona di installazione nella barra degli indirizzi' },
    { text: 'Conferma cliccando "Installa"' },
  ],
};

// ---------------------------------------------------------------------------
// Guide resolver
// ---------------------------------------------------------------------------

/** Returns the best matching install guide for the detected OS + browser */
export function getInstallGuide(
  os: OperatingSystem,
  browser: Browser,
): InstallGuideData {
  if (os === 'ios') {
    if (browser === 'chrome') return iosChrome;
    // Safari is the default for iOS (Firefox/others redirect to Safari)
    return iosSafari;
  }

  if (os === 'android') {
    if (browser === 'samsung') return androidSamsung;
    if (browser === 'firefox') return androidFirefox;
    // Chrome is default for Android
    return androidChrome;
  }

  // Desktop
  if (browser === 'chrome') return desktopChrome;
  if (browser === 'edge') return desktopEdge;
  if (browser === 'firefox') return desktopFirefox;
  return genericDesktop;
}
