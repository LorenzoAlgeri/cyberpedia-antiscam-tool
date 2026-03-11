/**
 * Contact Picker API type declarations.
 *
 * ContactsManager is not included in TypeScript's lib.dom.d.ts.
 * This file extends the global Navigator interface via declaration merging.
 * Only the subset of the spec used by this app is declared.
 *
 * Spec: https://w3c.github.io/contact-api/spec/
 * Support: Android Chrome ≥80, Samsung Internet ≥11. Not on Firefox or iOS Safari.
 */

interface ContactInfo {
  readonly name?: readonly string[];
  readonly tel?: readonly string[];
}

type ContactProperty = 'name' | 'tel';

interface ContactsManager {
  select(
    properties: ContactProperty[],
    options?: { readonly multiple?: boolean },
  ): Promise<ContactInfo[]>;
}

declare global {
  interface Navigator {
    readonly contacts?: ContactsManager;
  }
}

// export {} turns this into a module, required for declare global
export {};
