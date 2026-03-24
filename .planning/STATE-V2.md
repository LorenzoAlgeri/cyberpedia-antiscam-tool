# STATE — Piano Evoluzione v2

> Ultimo aggiornamento: 2026-03-24
> Piano: PIANO-EVOLUZIONE-V2.md

## Stato Fasi

| # | Fase | Stato | Note |
|---|------|-------|------|
| 1 | Security Hardening | COMPLETATA | 7 task completati |
| 2 | Landing Page Lead Capture | COMPLETATA | 4 task completati |
| 3 | UX Training: Setup Flow | COMPLETATA | 7 task completati |
| 4 | UX Training: Chat Realism | DA FARE | Dipende da Fase 3 |
| 5 | UX Training: Risultati | DA FARE | Dipende da Fase 4 |
| 6 | Post-Simulazione: Dossier | DA FARE | |
| 7 | Analytics Comportamentali | DA FARE | |
| 8 | Dark Web + Avanzate | DA FARE | |
| 9 | Deploy + Verifica | DA FARE | Ultima fase |

## Sessione Corrente

- Fase attiva: Fase 3 completata
- Task attivo: —
- Blockers: nessuno

## Log Completamenti

### Fase 1 — Security Hardening (2026-03-24)

**Task 1.1 — Sliding window rate limiter + global safety net**
- Riscritta `ratelimit.ts`: da fixed-window a sliding-window (weighted prev+current)
- Aggiunto rate limit globale per endpoint (protegge da attacchi distribuiti)
- Limiti globali: generate=500/h, training-start=300/h, training-msg=3000/h, training-ref=1500/h

**Task 1.2 — Input validation hardening**
- `userMessage` limite alzato a 2000 chars (era 500), aggiunto check empty/trimmed
- `userAnswer` limite alzato a 2000 chars, aggiunto check empty
- `triggerMessage` aggiunto max 2000 chars
- `customPersona` validazione tipo per ogni campo (name≤100, role≤200, tone≤200)
- `previousReflections` limitato a 10 entries max

**Task 1.3 — Security headers su worker**
- Aggiunto X-Frame-Options: DENY, X-Content-Type-Options: nosniff, X-XSS-Protection: 0
- Referrer-Policy: strict-origin-when-cross-origin, Permissions-Policy
- Headers applicati a tutte le risposte (anche 404/405)

**Task 1.4 — Secrets audit**
- `.dev.vars` aggiunto a entrambi i .gitignore
- Rimosso URL webhook N8N dai commenti in wrangler.toml
- Nessun segreto trovato nel codice committato

**Task 1.5 — PBKDF2 upgrade 100k→600k**
- `encryption.ts`: iterazioni portate a 600k (OWASP 2024)
- `deriveKey()` ora accetta parametro `iterations`
- `storage.ts`: nuova chiave localStorage `antiscam-meta` con conteggio iterazioni
- Migrazione trasparente: su load con old format, re-encrypta con 600k automaticamente
- Nessuna azione richiesta all'utente

**Task 1.6 — npm audit**
- Worker: 0 vulnerabilita (fix applicato con npm audit fix)
- Frontend: 4 high in serialize-javascript (via vite-plugin-pwa build chain, solo dev)
  - Fix richiederebbe downgrade breaking di vite-plugin-pwa — rischio basso, solo build-time
- flatted vulnerability fixata con npm audit fix

**Task 1.7 — Error handling hardened**
- Top-level try/catch nel Worker fetch handler con logging JSON strutturato
- SSE error events: messaggi generici in italiano, dettagli solo in console.error
- `mapN8NError`: non espone piu e.message nelle risposte al client
- Tutti i catch producono structured JSON logs per Cloudflare dashboard

### Fase 3 — UX Training: Setup Flow (2026-03-24)

**Task 3.1 — Selezione genere truffatore**
- Aggiunto tipo `ScammerGender = 'male' | 'female' | 'unspecified'` in frontend e worker
- Sezione UI "Come vuoi che il truffatore si presenti?" in TrainingSetup (3 bottoni)
- Propagato al worker via `StartSessionRequest.scammerGender`
- `training-prompt.ts`: genera persona coerente col genere selezionato

**Task 3.2 — Auto-scroll a sezione Difficoltà**
- `difficultySectionRef` aggiunto alla sezione Difficoltà
- `handleSelectStandardAttack` fa `scrollIntoView({ behavior: 'smooth' })` dopo selezione tipo attacco

**Task 3.3 — Multi-select levers (max 3)**
- `target: TrainingTarget` → `targets: TrainingTarget[]` in frontend e worker
- Toggle logic con limite max 3
- Counter "X/3 selezionate" nell'header sezione
- Worker: `trainingTargets: TrainingTarget[]` in `StartSessionRequest` e `ScenarioConfig`
- Mantenuto `trainingTarget` in `ScenarioConfig` per backward compat

**Task 3.4 — Rinomina Avidita → Guadagno facile**
- Key `greed` → `easy_gain` in tutti i file (frontend e worker)
- Label `Avidita` → `Guadagno facile`

**Task 3.5 — Leve raccomandate per tipo attacco**
- Mapping `ATTACK_RECOMMENDED_LEVERS` in TrainingSetup
- Pre-selezione automatica prime 2 leve raccomandate al click su tipo attacco
- Badge "Frequente" (ambra) sulle leve raccomandate per il tipo selezionato

**Task 3.6 — Accento su Responsabilità**
- Campo `tooltip?: string` aggiunto a `TrainingTargetMeta`
- Tooltip esteso per `responsibility`
- Mostrato inline quando il target è selezionato

**Task 3.7 — Sfondo diverso per Palestra Mentale**
- Card Palestra Mentale: palette viola/indigo vs cyan delle simulazioni statiche
- Bordo `violet-500/40`, sfondo gradient `from-violet-950/60 via-slate-900/80 to-indigo-950/60`
- Icona e badge in violet

---

### Fase 2 — Landing Page Lead Capture (2026-03-24)

**Task 2.1 — LeadCapturePage.tsx + #beta route**
- Creata `src/pages/LeadCapturePage.tsx` con 7 sezioni: Hero, 3 Vantaggi, Cosa Fa, Per Chi, Messaggio Identitario, Form, QR Code
- Creata `src/components/lead/LeadCaptureForm.tsx` con validazione, submit, stati loading/success/error
- Route `#beta` gestita in `App.tsx` tramite `useSyncExternalStore` — standalone fuori dal wizard
- Design: glassmorphism dark mode, coerente con il brand Cyberpedia
- Testi italiani dal piano FASE 2

**Task 2.2 — Worker /api/lead endpoint**
- Decisione architetturale: Opzione B (worker endpoint) — infrastruttura gia esistente
- Creato `antiscam-worker/src/lead-handler.ts`: POST /api/lead con validazione completa
- Validazione: name (1-100), email (regex+254), role (5 valori), note (opt 500), consent (required)
- Storage: KV key `lead:{timestamp}:{sha256(email)}` con TTL 90 giorni
- Rate limit: 10/h per IP via sliding window esistente
- Aggiunto `ANTISCAM_LEADS` KV binding in `wrangler.toml` e `Env` type
- Routing aggiunto in `index.ts` con method check

**Task 2.3 — QR Code SVG statico**
- Creato `src/components/layout/QrCodeBeta.tsx` con SVG inline generato da qrcode library
- QR punta a `https://antiscam.pages.dev/#beta`
- Moduli in cyan #78D5E3 su sfondo bianco, scannerizzabile
- Accetta props width/height, aria-label per accessibilita

**Task 2.4 — GDPR consent + privacy**
- Checkbox consent obbligatorio nel form con testo completo
- Link a privacy policy cyberpedia.it
- Validazione lato client (checkbox required) + lato worker (consent must be true)
- Nessun dato sensibile raccolto (solo nome, email, ruolo)
