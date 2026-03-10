/**
 * useInstallPrompt — captures the `beforeinstallprompt` event
 * and exposes a one-click native install function.
 *
 * /modern-javascript-patterns: global event listener with cleanup.
 * /react-patterns: useRef to persist the event across renders
 *   without triggering re-renders; useState only for the boolean
 *   flag that affects rendering.
 * /mobile-android-design: Chrome/Edge on Android fire this event
 *   once when the PWA meets installability criteria. We must
 *   capture it immediately and store it for later use.
 *
 * Lifecycle:
 * 1. Browser fires `beforeinstallprompt` → we preventDefault() and
 *    store the event in a ref → set isInstallReady = true.
 * 2. User clicks "Installa" → we call event.prompt() → browser
 *    shows the native install dialog.
 * 3. After user accepts/dismisses → we read event.userChoice and
 *    set isInstalled accordingly.
 *
 * On iOS / Firefox Desktop this event never fires, so the hook
 * simply returns { isInstallReady: false }.
 */

import { useCallback, useEffect, useRef, useState } from 'react';

// ---------------------------------------------------------------------------
// BeforeInstallPromptEvent type (not in standard lib.dom.d.ts)
// ---------------------------------------------------------------------------

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: readonly string[];
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
  prompt(): Promise<void>;
}

// ---------------------------------------------------------------------------
// Hook return type
// ---------------------------------------------------------------------------

export interface InstallPromptState {
  /** True when the native install prompt is available */
  readonly isInstallReady: boolean;
  /** True after the user accepted the install */
  readonly isInstalled: boolean;
  /** Call this to show the native install dialog */
  readonly promptInstall: () => Promise<void>;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useInstallPrompt(): InstallPromptState {
  const eventRef = useRef<BeforeInstallPromptEvent | undefined>(undefined);
  const [isInstallReady, setIsInstallReady] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      eventRef.current = e as BeforeInstallPromptEvent;
      setIsInstallReady(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // Also detect if the app was installed during this session
    const installedHandler = () => {
      setIsInstalled(true);
      setIsInstallReady(false);
    };
    window.addEventListener('appinstalled', installedHandler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      window.removeEventListener('appinstalled', installedHandler);
    };
  }, []);

  const promptInstall = useCallback(async () => {
    const event = eventRef.current;
    if (event == null) return;

    await event.prompt();

    const { outcome } = await event.userChoice;
    if (outcome === 'accepted') {
      setIsInstalled(true);
      setIsInstallReady(false);
    }

    // The event can only be used once
    eventRef.current = undefined;
  }, []);

  return { isInstallReady, isInstalled, promptInstall };
}
