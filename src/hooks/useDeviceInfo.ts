/**
 * useDeviceInfo — detects OS, browser, and PWA capabilities.
 *
 * /mobile-ios-design: iOS Safari has no install prompt → manual instructions.
 * /mobile-android-design: Chrome supports beforeinstallprompt.
 *
 * Detection strategy:
 * - navigator.userAgent for OS and browser (best-effort, no perfect solution)
 * - navigator.standalone / matchMedia('display-mode: standalone') for PWA mode
 * - Chrome/Edge on Android/Desktop → supportsInstallPrompt = true
 *
 * Runs once on mount (SSR-safe: defaults to desktop/other).
 */

import { useMemo } from 'react';
import type { Browser, DeviceInfo, OperatingSystem } from '@/types/device';

// ---------------------------------------------------------------------------
// Detection helpers (pure functions, no side effects)
// ---------------------------------------------------------------------------

function detectOS(ua: string): OperatingSystem {
  // iOS: iPhone, iPad, iPod — also iPad on iOS 13+ reports as Mac
  if (/iphone|ipad|ipod/i.test(ua)) return 'ios';
  // iPad with desktop UA (iOS 13+)
  if (/macintosh/i.test(ua) && navigator.maxTouchPoints > 1) return 'ios';
  if (/android/i.test(ua)) return 'android';
  return 'desktop';
}

function detectBrowser(ua: string): Browser {
  // Order matters — more specific checks first

  // Samsung Internet
  if (/samsungbrowser/i.test(ua)) return 'samsung';
  // Edge (Chromium-based)
  if (/edg\//i.test(ua)) return 'edge';
  // Firefox
  if (/firefox|fxios/i.test(ua)) return 'firefox';
  // Chrome (must check after Edge and Samsung which include "Chrome")
  if (/chrome|crios/i.test(ua)) return 'chrome';
  // Safari (must check after Chrome which also includes "Safari")
  if (/safari/i.test(ua)) return 'safari';

  return 'other';
}

function detectStandalone(): boolean {
  // iOS Safari standalone mode
  if ('standalone' in navigator) {
    return (navigator as { standalone?: boolean }).standalone === true;
  }
  // Standard display-mode media query
  if (typeof window.matchMedia === 'function') {
    return window.matchMedia('(display-mode: standalone)').matches;
  }
  return false;
}

/** Chrome and Edge on Android/Desktop support beforeinstallprompt */
function canShowInstallPrompt(os: OperatingSystem, browser: Browser): boolean {
  if (os === 'ios') return false; // iOS never fires beforeinstallprompt
  return browser === 'chrome' || browser === 'edge';
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useDeviceInfo(): DeviceInfo {
  return useMemo(() => {
    if (typeof navigator === 'undefined') {
      // SSR fallback
      return {
        os: 'desktop' as const,
        browser: 'other' as const,
        isStandalone: false,
        supportsInstallPrompt: false,
      };
    }

    const ua = navigator.userAgent;
    const os = detectOS(ua);
    const browser = detectBrowser(ua);
    const isStandalone = detectStandalone();
    const supportsInstallPrompt = canShowInstallPrompt(os, browser);

    return { os, browser, isStandalone, supportsInstallPrompt };
  }, []);
}
