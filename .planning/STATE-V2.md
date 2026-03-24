# STATE — Piano Evoluzione v2

> Ultimo aggiornamento: 2026-03-24
> Piano: PIANO-EVOLUZIONE-V2.md

## Stato Fasi

| # | Fase | Stato | Note |
|---|------|-------|------|
| 1 | Security Hardening | COMPLETATA | 7 task completati |
| 2 | Landing Page Lead Capture | COMPLETATA | 4 task completati |
| 3 | UX Training: Setup Flow | COMPLETATA | 7 task completati |
| 4 | UX Training: Chat Realism | COMPLETATA | 6 task completati |
| 5 | UX Training: Risultati | COMPLETATA | 8 task completati |
| 6 | Post-Simulazione: Dossier | COMPLETATA | 4 task completati |
| 7 | Analytics Comportamentali | COMPLETATA | 3 task completati |
| 8 | Dark Web + Avanzate | DA FARE | |
| 9 | Deploy + Verifica | DA FARE | Ultima fase |

## Sessione Corrente

- Fase attiva: Fase 7 completata → prossima Fase 8
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

### Fase 4 — UX Training: Chat Realism (2026-03-24)

**Task 4.1 — Velocità risposta realistica**
- `useTrainingSession.ts`: aggiunto delay calcolato prima di `AI_STREAM_DONE`
- Formula: `min(800 + msgLen * 20, 4000)ms` con varianza ±20%
- Il typing indicator persiste per tutto il delay — UX realistica simile a WhatsApp
- Implementato con variabile locale `accumulatedMessage` nel callback `onToken`

**Task 4.2 — Chatbot più insistente**
- `training-prompt.ts` (`buildScammerMessageSystemPrompt`): aggiunta sezione escalation
- Truffa amorosa: love bombing, senso di colpa, dichiarazioni emotive intense
- Altre truffe: urgenza, evocazione conseguenze, insistenza dopo prima obiezione

**Task 4.3 — Richiesta dati in fase P3**
- `training-prompt.ts`: sezione condizionale per `nextPhase === 'P3'`
- Chiede dati credibili in base alla leva attiva: IBAN (urgency), telefono (trust), CF (authority)
- Safety preamble intatto — richiesta resta psicologica, non operativa

**Task 4.4 — Varietà frasi riflessione**
- `training-prompt.ts` (`buildReflectionSystemPrompt`): aggiunta sezione STILE LINGUISTICO
- Istruzione esplicita di non ripetere strutture di frase (es. "È utile notare come...")
- Variare angolazione, ritmo e punto di vista tra le 4 risposte

**Task 4.5 — Rimozione "ottimo lavoro"**
- `SimulationsPage.tsx`: sostituito "Simulazione completata — ottimo lavoro! Passiamo alla riflessione." con "Sessione completata. Passiamo alla riflessione."

**Task 4.6 — Continua la chat post-risultati**
- `useTrainingSession.ts`: aggiunto action `CONTINUE_CONVERSATION` e callback `continueChat`
- `SessionReport.tsx`: aggiunta prop opzionale `onContinueChat`, UI con testo esplicativo e pulsante
- `SimulationsPage.tsx`: passato `onContinueChat={training.continueChat}` a SessionReport

---

### Fase 5 — UX Training: Risultati + Profilo (2026-03-24)

**Task 5.1 — RadarChart centrato e più grande**
- `RadarChart` size aumentata da 220 a 280px nel SessionReport
- Container wrappato con `flex justify-center` per centrare l'SVG a larghezza fissa

**Task 5.2 — Tooltip sulle 4 dimensioni (HelpCircle)**
- Aggiunto `HelpCircle` icon next a ogni label in `ScoreBar`
- Popover on click con definizione breve per ogni dimensione
- Testi da `DIMENSION_TOOLTIPS` in `score-interpretations.ts`

**Task 5.3 — Interpretazione punteggio per range (ULTRATHINK)**
- Creato `src/data/score-interpretations.ts` con testi psicologicamente fondati
- 4 dimensioni × 3 range (low/medium/high based on displayValue) = 12 testi
- Mostrati sotto ogni barra nel `ScoreBar` component
- Range basato su displayValue (normalizzato: sempre più alto = meglio)

**Task 5.4 — Descrizione globale per rischio (ULTRATHINK)**
- 3 fasce: basso (0-35), medio (36-65), alto (66-100)
- Paragrafo psicologicamente accurato per ogni fascia
- Mostrato in SessionReport tra radar chart e barre dimensioni

**Task 5.5 — Bottone "Allenati su questo" per punteggi bassi**
- Appare per ogni dimensione in zona rossa (displayValue < 40)
- Mappa dimension → TrainingTarget: activation→fear, impulsivity→urgency, verification→trust, awareness→authority
- Click apre TrainingSetup con leva pre-selezionata
- Modificati: SessionReport.tsx, TrainingSetup.tsx (initialTargets prop), SimulationsPage.tsx (handler + state)

**Task 5.6 — Sottotitolo "Punto forte"/"Punto debole" in TrainingDashboard**
- "Punto forte": subtitle "La dimensione in cui sei più resistente"
- "Punto debole": subtitle "Dove concentrare l'allenamento"

**Task 5.7 — Streak tooltip + messaggio se streak=0**
- HelpCircle icon con title tooltip: "Giorni consecutivi con almeno una sessione..."
- Streak=0 mostra "—" invece di "0" + label "Inizia oggi"

**Task 5.8 — "Come funziona la valutazione" accordion**
- Accordion in SessionReport con 4 sezioni: dimensioni, formula rischio, interruzione, profilo nel tempo
- `useState` toggle, nessuna libreria aggiuntiva

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

---

### Fase 6 — Post-Simulazione: Dossier (2026-03-24)

**Task 6.1 — Flusso dossier da victim status**
- `NeedModePage.tsx`: aggiunto tab "Dossier" (con icona FolderLock) visibile quando victimStatus='yes' o dossier esistente
- `App.tsx`: passa `victimStatus` a NeedModePage
- Tab Dossier default quando victim mode attivo
- Prompt PIN se non gia sbloccato, altrimenti mostra DossierForm direttamente

**Task 6.2 — Dossier cifrato in localStorage**
- Creato `src/types/dossier.ts`: DossierData, ScammerContact, DossierScreenshot, MAX_SCREENSHOTS=5
- Creato `src/lib/dossier-storage.ts`: saveDossierData/loadDossierData/clearDossierData/hasDossierData
  - Riusa salt+PIN di emergency data — stessa chiave AES-256-GCM
  - Storage key: `antiscam-dossier`
  - Validazione runtime completa (validateDossierData)
- Creato `src/lib/image-compression.ts`: compressImage via OffscreenCanvas
  - Max 1920px, JPEG quality 0.7→0.3 progressivo
  - Limite ~400KB per screenshot (base64 data URI)
  - `estimateStorageUsage()` e `wouldExceedStorageQuota()` per safety
- Creato `src/components/dossier/ScreenshotUpload.tsx`: upload file + drag&drop, thumbnails, delete
- Creato `src/components/dossier/DossierForm.tsx`: form completo con auto-save 2s debounce
  - Campi: scammerName, scammerContacts (tipo+valore, dynamic add/remove), screenshots, notes, dates, amounts
  - Status indicator: saving/saved/error
  - Lazy-loaded via React.lazy in NeedModePage

**Task 6.3 — Export PDF per Polizia Postale**
- Installato `jspdf` — lazy-loaded via dynamic import (~386KB solo quando serve)
- Creato `src/lib/dossier-export.ts`: `exportDossierPdf(dossier)`
  - PDF A4 con header, sezioni identita/dettagli/prove/istruzioni
  - Screenshot embedded nel PDF
  - 6 istruzioni pratiche per la denuncia
  - Link commissariatodips.it
  - Footer: "Nessun dato trasmesso online"
- Bottone "Prepara per denuncia" nel DossierForm (disabilitato se dossier vuoto)

**Task 6.4 — Ordinamento scenari per frequenza**
- `SimulationsPage.tsx`: stato `scenarioClicks` da localStorage key `antiscam-scenario-clicks`
- Incremento automatico al click su scenario card
- `sortedSimulations` via useMemo: ordina per click count decrescente, fallback ordine default
- Nessun dato personale tracciato — solo conteggio click per scenario ID

---

### Fase 7 — Analytics Comportamentali Privacy-First (2026-03-24)

**Task 7.1 — Frontend event-analytics module**
- Creato `src/lib/event-analytics.ts`: modulo analytics privacy-first
- 8 tipi evento: session_start, session_complete, session_dropout, lever_effectiveness, response_time, feature_usage, utm_capture, error
- Buffer in-memory (max 50 eventi), flush ogni 30s o su visibilitychange/pagehide
- `sendBeacon` per flush affidabile su page unload, fallback fetch keepalive
- Helper di bucketing: responseTimeBucket, riskBand, turnsBucket, durationBucket
- Zero PII: solo contatori aggregati, nessun dato personale
- UTM capture automatico da query string al primo caricamento
- Convenience helpers tipizzati per ogni evento

**Task 7.2 — Worker POST /api/analytics/batch endpoint**
- Creato `antiscam-worker/src/analytics-handler.ts`: handler batch analytics
- Validazione eventi: tipo, timestamp, data values (max 100 chars, no PII)
- Max 50 eventi per batch, rate limit 10 batch/h per IP
- Aggregazione in KV: `analytics:{YYYY-MM-DD}:{event_type}` → `{ total, breakdown }`
- Breakdown keys costruiti per tipo evento (scenario:difficulty, phase, lever, bucket, feature, source:medium, error_type)
- TTL 180 giorni per auto-cleanup
- Aggiunto `ANTISCAM_ANALYTICS` KV namespace in wrangler.toml e Env type
- Route aggiunta in index.ts con method check POST-only

**Task 7.3 — Integrazione analytics nel frontend**
- `App.tsx`: `initAnalytics()` su mount (UTM capture + flush timer)
- `useTrainingSession.ts`: tracking completo ciclo sessione
  - `trackSessionStart` dopo SESSION_STARTED (scenario, difficulty, targets)
  - `trackResponseTime` su onScores (tempo da messaggio utente a risposta AI)
  - `trackLeverEffectiveness` su interruzione (quale scenario+leva ha triggerato)
  - `trackSessionComplete` su finish (scenario, turns bucket, duration bucket, risk band)
  - `trackSessionDropout` su reset durante sessione attiva (fase di abbandono)
  - `trackError` su errori send_message
- `SimulationsPage.tsx`: `trackFeatureUsage('palestra_mentale')` su apertura setup
- `NeedModePage.tsx`: `trackFeatureUsage('pdf_export')` su export dossier PDF
