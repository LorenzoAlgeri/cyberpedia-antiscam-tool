# CYBERPEDIA ANTI-TRUFFA TOOL — Roadmap

## Progetto

**Anti-Truffa Tool** per [cyberpedia.it](https://cyberpedia.it)  
SPA statica su Cloudflare Pages, integrata via iframe in WordPress.

---

## Settimana 1 — Setup + Scheletro ✅

| # | Task | Stato |
|---|------|-------|
| 1 | Init Vite 7 + React 19 + TypeScript 5.9 strict | ✅ |
| 2 | Verifica compatibilità: motion 12, shadcn/ui 4, Tailwind v4 | ✅ |
| 3 | Design system: OKLCH tokens, glassmorphism, dark-only theme | ✅ |
| 4 | WizardShell con hash router (`useHashRouter`) | ✅ |
| 5 | AnimatePresence per transizioni step (slide + fade, 250ms) | ✅ |
| 6 | StepIndicator: 4 pallini con glow cyan, `role="tablist"` | ✅ |
| 7 | 4 pagine placeholder (Landing, Emergency, Simulations, Install) | ✅ |
| 8 | vite-plugin-pwa: manifest, service worker, icone SVG placeholder | ✅ |
| 9 | BRAND-GUIDELINES.md completo | ✅ |
| 10 | ROADMAP.md | ✅ |

**Milestone verificata**: `npm run build` passa (0 errori TS),
navigazione 4 step con transizioni, design system applicato,
PWA configurata. Bundle: JS ~105KB gzip, CSS ~5.7KB gzip.

---

## Settimana 2 — Step 1 + Step 2 ⬜

| # | Task | Stato |
|---|------|-------|
| 1 | LandingPage: copy definitivo, logo, CTA, trust signal | ⬜ |
| 2 | `lib/encryption.ts`: PIN → PBKDF2 → AES-256-GCM (Web Crypto) | ⬜ |
| 3 | `lib/storage.ts`: save/load dati cifrati in localStorage | ⬜ |
| 4 | `hooks/useReturningUser.ts`: returning user detection | ⬜ |
| 5 | EmergencyForm: telefono banca + 3 contatti (no label) | ⬜ |
| 6 | AttackTypeSelector: 6 card con icone Lucide | ⬜ |
| 7 | TodoChecklist: generica + dinamica per tipo attacco | ⬜ |
| 8 | Auto-save debounced (1.5s) + save manuale | ⬜ |

**Milestone target**: Step 1 e 2 end-to-end, dati cifrati
persistono, returning user funziona, To-Do dinamico.

---

## Settimana 3 — Step 3 + Step 4 ⬜

| # | Task | Stato |
|---|------|-------|
| 1 | ChatSimulator engine: messaggi, "sta scrivendo...", scelte | ⬜ |
| 2 | 4 script simulazioni (8-12 msg + branching + feedback) | ⬜ |
| 3 | SimulationsPage hub: 4 card cliccabili | ⬜ |
| 4 | `hooks/useDeviceInfo.ts`: iOS/Android/Desktop detection | ⬜ |
| 5 | InstallGuide: istruzioni per OS+browser | ⬜ |
| 6 | `beforeinstallprompt` su Android/Chrome | ⬜ |

**Milestone target**: tutte e 4 le pagine complete e funzionanti.

---

## Settimana 4 — Hardening + Deploy ⬜

| # | Task | Stato |
|---|------|-------|
| 1 | `React.lazy()` code splitting, audit bundle (<150KB gzip) | ⬜ |
| 2 | Lighthouse: Performance ≥95, Accessibility =100, PWA pass | ⬜ |
| 3 | Cloudflare Pages deploy + CSP headers | ⬜ |
| 4 | Shortcode WordPress `[antiscam-tool]` + postMessage resize | ⬜ |
| 5 | Test cross-browser (Safari iOS, Chrome Android, Samsung) | ⬜ |
| 6 | `npm run build` 0 errori, `npm run lint` 0 warnings | ⬜ |
| 7 | Verifica cifratura in DevTools | ⬜ |
| 8 | ROADMAP.md aggiornata | ⬜ |
| 9 | README con istruzioni dev/deploy | ⬜ |

**Milestone target**: tool live su cyberpedia.it/antitruffa.

---

## Decisioni Architetturali

| Decisione | Scelta | Motivazione |
|-----------|--------|-------------|
| Encryption | PIN + PBKDF2 → AES-256-GCM | Chiave mai persistita, sicurezza reale vs security theater |
| Routing | Hash router custom | Back button, deep links, analytics, zero dipendenze |
| Glassmorphism | Leggero (blur-sm 4-8px) | Prestazioni mobile, leggibilità |
| Step 4 PWA | Opzionale/skippabile | Non bloccare il flusso principale |
| Colori feedback | Amber warnings, NO rosso | Rosso scatena panico in utenti stressati |
| Animation lib | motion (ex framer-motion) | Import da `motion/react`, compatibile React 19 |

---

## Stack Tecnologico

| Layer | Versione |
|-------|----------|
| Vite | 7.3.1 |
| React | 19.2.4 |
| TypeScript | 5.9.3 (strict) |
| Tailwind CSS | 4.2.1 |
| motion | 12.35.2 |
| shadcn/ui | 4.0.3 |
| lucide-react | 0.577.0 |
| vite-plugin-pwa | 1.2.0 |
| Deploy | Cloudflare Pages |

---

## Git Log

```
c51af50 feat: configure vite-plugin-pwa + BRAND-GUIDELINES.md + Cloudflare _headers
e890513 feat: add WizardShell with hash router + AnimatePresence + StepIndicator + 4 pages
11ecc6d feat: add Cyberpedia brand design system tokens (dark-only, cyan, glassmorphism)
f0379a6 feat: add Tailwind v4 + motion + lucide-react + vite-plugin-pwa + shadcn/ui
78c4cc1 chore: add strict TS flags + path aliases
c05ebed chore: init project with Vite 7 + React 19 + TypeScript 5.9
```
