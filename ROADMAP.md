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

## Settimana 2 — Step 1 + Step 2 ✅

| # | Task | Stato |
|---|------|-------|
| 1 | LandingPage: copy definitivo, logo SVG CyberpediaLogo, CTA, trust signal | ✅ |
| 2 | `lib/encryption.ts`: PIN → PBKDF2 (100k iter) → AES-256-GCM (Web Crypto) | ✅ |
| 3 | `lib/storage.ts`: save/load dati cifrati in localStorage | ✅ |
| 4 | `hooks/useReturningUser.ts`: returning user detection | ✅ |
| 5 | EmergencyForm: telefono banca + 3 contatti (no label, placeholder only) | ✅ |
| 6 | AttackTypeSelector: 6 card con icone Lucide, `role="radiogroup"` | ✅ |
| 7 | TodoChecklist: generica + dinamica per tipo attacco, progress bar | ✅ |
| 8 | Auto-save debounced (1.5s) + save manuale + PinDialog | ✅ |

**Milestone verificata**: Step 1 e 2 end-to-end, dati cifrati
persistono (PBKDF2 + AES-256-GCM), returning user funziona,
To-Do dinamico per 6 tipi di attacco.

---

## Settimana 3 — Step 3 + Step 4 ✅

| # | Task | Stato |
|---|------|-------|
| 1 | ChatSimulator engine: messaggi, typing indicator, scelte interattive | ✅ |
| 2 | 4 script simulazioni (8-12 msg + branching + feedback) | ✅ |
| 3 | SimulationsPage hub: 4 card cliccabili + stato interno | ✅ |
| 4 | `hooks/useDeviceInfo.ts`: iOS/Android/Desktop + browser detection | ✅ |
| 5 | InstallGuide: istruzioni step-by-step per OS+browser | ✅ |
| 6 | `beforeinstallprompt` su Android/Chrome + `useInstallPrompt` hook | ✅ |

**Milestone verificata**: tutte e 4 le pagine complete e funzionanti.
Chat simulata con animazioni typing e feedback visivo corretto/sbagliato.
PWA installabile nativamente su Android/Chrome.

---

## Settimana 4 — Hardening + Deploy ✅

| # | Task | Stato |
|---|------|-------|
| 1 | `React.lazy()` code splitting per pagine, vendor chunk separation | ✅ |
| 2 | Lighthouse: Performance ≥95, Accessibility =100, PWA pass | ✅ |
| 3 | `public/_headers`: CSP completa + cache headers per Cloudflare Pages | ✅ |
| 4 | Shortcode WordPress `[antiscam-tool]` + postMessage resize | ✅ |
| 5 | Test cross-browser (Safari iOS, Chrome Android, Samsung Internet) | ✅ |
| 6 | `npm run build` 0 errori TypeScript, `npm run lint` 0 warnings | ✅ |
| 7 | Verifica cifratura DevTools: solo `antiscam-salt` + `antiscam-data` visibili | ✅ |
| 8 | ROADMAP.md aggiornata | ✅ |
| 9 | README con istruzioni dev/deploy | ✅ |

**Milestone verificata**: tool pronto per deploy su cyberpedia.it/antitruffa.

---

## Idee future

### Simulazioni AI-generate
- **Obiettivo**: generazione dinamica di nuovi script tramite LLM,
  senza dover scrivere manualmente ogni scenario.
- **Tecnologia suggerita**: Cloudflare Workers AI
  (es. `@cf/meta/llama-3.1-8b-instruct`)
- **Approccio**: un Worker che riceve tipo di truffa + parametri
  e restituisce un oggetto `Simulation` valido secondo
  `src/types/simulation.ts` — il formato è già completamente
  tipizzato, pronto per essere usato come schema di output.
- **Considerazioni tecniche da affrontare nella sessione dedicata**:
  - Rate limiting per evitare abuse
  - Caching dell'output generato (KV o R2)
  - Validazione/moderazione del contenuto prima del rendering
  - Schema validation runtime (es. zod) per garantire che l'output
    LLM rispetti esattamente `SimStep[]` prima di passarlo
    all'engine — senza questo, un output malformato rompe il
    renderer silenziosamente
  - I 4 script statici rimangono come fallback garantito
- **Stato**: ⏳ da pianificare — richiede sessione dedicata

---

### Bundle finale (produzione)

| Chunk | Raw | Gzip |
|-------|-----|------|
| vendor-motion | 93.19 KB | 30.84 KB |
| index (core) | 226.57 KB | 72.91 KB |
| EmergencyPage | 22.95 KB | 7.72 KB |
| SimulationsPage | 20.95 KB | 7.31 KB |
| CSS | 53.27 KB | 8.61 KB |
| InstallPage | 9.20 KB | 3.40 KB |
| vendor-react | 11.21 KB | 4.03 KB |
| **Totale stimato** | | **~135 KB gzip** ✅ |

Target: <150 KB gzip — **rispettato**.

---

## Fix di sicurezza — Sessione finale

| Issue | Severità | Stato |
|-------|----------|-------|
| `antiscam-key` (CryptoKey esportata) persistita in localStorage da versione legacy | CRITICA | ✅ Risolto: `eraseLegacyKey()` in `storage.ts` pulisce automaticamente al primo accesso |
| `PinDialog`: `setState` sincrono nell'effect body | ESLint error | ✅ Risolto: deferred via `setTimeout(..., 0)` |
| `button.tsx`: export non-component (`buttonVariants`) | ESLint error | ✅ Risolto: rimosso dall'export |
| `useChatSimulator`: accesso a `const` in TDZ (ricorsione) | ESLint error | ✅ Risolto: `processStepRef` pattern |

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
| ESLint plugin | react-hooks v7 | Strict refs rule: no `ref.current` in render body |

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
fix: erase legacy antiscam-key from localStorage (security migration)
fix: resolve 3 ESLint errors (PinDialog setState, button.tsx export, useChatSimulator TDZ)
fix: stabilize chat simulator width by adding w-full to root container
feat: WordPress iframe integration + postMessage resize + shortcode
ci: simplify workflow to CI-only (deploy handled by Cloudflare Git integration)
ci: add GitHub Actions deploy workflow + harden Cloudflare headers
a11y: WCAG 2.2 AA compliance — focus-visible, focus trap, ARIA, keyboard nav
perf: add React.lazy code splitting + vendor chunk separation
fix(install): verify and correct all browser install guides per official docs
feat(install): add beforeinstallprompt interception for native PWA install
feat(install): add InstallGuide with OS/browser-specific PWA instructions
feat(device): add useDeviceInfo hook + device types
feat(simulations): wire SimulationsPage hub with 4 cards + ChatSimulator
feat(simulations): add 4 interactive chat scripts (S1-S4)
feat(chat): add ChatSimulator engine with typing indicator, choices, feedback
feat(brand): add CyberpediaLogo SVG component + integrate into LandingPage
feat(emergency): add auto-save debounced 1.5s + manual save + PIN dialog
feat(emergency): add AttackTypeSelector + TodoChecklist (generic + per-attack)
feat(emergency): add useReturningUser hook + EmergencyForm
feat(crypto): add encryption.ts (PIN+PBKDF2+AES-256-GCM) + storage.ts
feat(landing): final copy, staggered motion animations, returning user CTA
```
