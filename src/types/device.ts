/**
 * Device detection types for the install guide (Step 4).
 *
 * /typescript-advanced-types: string literal unions for
 * OS and browser, plus a combined DeviceInfo interface.
 */

// ---------------------------------------------------------------------------
// Operating system
// ---------------------------------------------------------------------------

export type OperatingSystem = 'ios' | 'android' | 'desktop';

// ---------------------------------------------------------------------------
// Browser
// ---------------------------------------------------------------------------

export type Browser =
  | 'safari'
  | 'chrome'
  | 'firefox'
  | 'samsung'
  | 'edge'
  | 'other';

// ---------------------------------------------------------------------------
// Combined device info
// ---------------------------------------------------------------------------

export interface DeviceInfo {
  /** Detected operating system */
  readonly os: OperatingSystem;
  /** Detected browser */
  readonly browser: Browser;
  /** True if the app is already running in standalone/PWA mode */
  readonly isStandalone: boolean;
  /** True if the browser supports the native install prompt (Chrome/Edge) */
  readonly supportsInstallPrompt: boolean;
}
