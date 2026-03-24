# CYBERPEDIA ANTI-TRUFFA TOOL — PROMPT MASTER V3

## PRIMA DI TUTTO: METODOLOGIA DI LAVORO

Usa la skill /brainstorming per fare un'analisi critica di tutto 
ciò che stai per costruire prima di scrivere una riga di codice.
Usa la skill /writing-plans per strutturare il piano di sviluppo.
Usa la skill /using-superpowers per capire quali skill attivare 
in ogni fase. Usa la skill /verification-before-completion prima 
di dichiarare qualsiasi step completato.

---

## CONTESTO DEL PROGETTO

Stai costruendo l'**Anti-Truffa Tool** — una web app custom da 
integrare nel sito WordPress **cyberpedia.it** (sito di 
cybersecurity focalizzato sul fattore umano e la psicologia 
del crimine).

Il tool è una SPA a 4 step sequenziali, pensata per aiutare 
persone in stato emotivo alterato a gestire una truffa in corso 
senza agire impulsivamente.

**Riferimento reale**: VerificaTruffa.it ha ricevuto 10.000 
contenuti in 24h dopo un passaggio TV e poi è andato offline per 
attacchi DDoS. Questo tool DEVE reggere quel traffico. 
La scelta di una SPA statica su CDN è la risposta a quel problema.

---

## FASE 0 — BRAINSTORMING E ANALISI CRITICA

Usa /brainstorming ORA per rispondere a queste domande:

1. Rianalizza lo stack proposto (Vite + React 19 + TypeScript strict
   + Tailwind v4 + Cloudflare Pages) — è ancora la scelta migliore
   o c'è qualcosa di meglio per questo caso d'uso specifico?
2. localStorage + AES-256-GCM per dati sensibili — ci sono 
   alternative più sicure che non richiedano backend?
3. Per una persona in stato di panico, cosa è davvero prioritario 
   nella UX? (usa /interaction-design e /visual-design-foundations)
4. Quali sono i rischi tecnici principali di questo progetto?
5. C'è qualcosa nel design del progetto che non funziona e che 
   dovrei segnalarti prima di iniziare?

**Aspetta la mia risposta al brainstorming prima di procedere.**

---

## STACK TECNICO DEFINITIVO

| Layer | Tecnologia | Note |
|-------|-----------|------|
| Build | Vite 6.x | Output 100% statico, no server |
| UI | React 19 + TypeScript strict | |
| Routing | useState puro (NO React Router) | 4 step lineari |
| Styling | Tailwind CSS 4.x | |
| Componenti | shadcn/ui selettivi (solo se compatibili Tailwind v4) |
| Animazioni | Framer Motion ≥12.x | Verifica peer deps React 19 |
| Icone | Lucide React | Tree-shakeable |
| PWA | vite-plugin-pwa | Gold standard per Vite |
| Cifratura | Web Crypto API nativa | AES-256-GCM, zero dipendenze |
| Deploy | Cloudflare Pages | DDoS + CDN + SSL gratis |
| CI/CD | GitHub Actions | /github-actions-templates |

**Integrazione WordPress**:
[cyberpedia.it/antitruffa] → iframe → [antiscam.pages.dev]

text
- Shortcode WordPress custom [antiscam-tool]
- Content-Security-Policy: frame-ancestors 'self' https://cyberpedia.it
  (NON X-Frame-Options: ALLOW-FROM — deprecato, non funziona)
- postMessage per resize dinamico iframe
- PWA installa direttamente Cloudflare Pages URL

---

## STRUTTURA DEL TOOL — 4 STEP

### STEP 1 — Landing emotiva
- Headline anti-panico: "Fermati. Respira. Sei al sicuro qui."
- Sottotitolo: spiega in 1 frase cosa fa il tool
- Logo Cyberpedia (da fornire come asset)
- CTA singola grande
- Trust signal: "I tuoi dati restano solo sul tuo dispositivo"
- **Logica returning user**: se localStorage ha dati cifrati → 
  CTA diventa "Accedi ai tuoi dati" e porta direttamente allo Step 2 precompilato

### STEP 2 — Dati di emergenza + To-Do
**Dati salvati cifrati in localStorage (AES-256-GCM)**:
- Numero antifrode della propria banca
- Fino a 3 contatti di fiducia (nome + telefono)

**To-Do list** curata da fonti autorevoli (Polizia Postale, 
ENISA, FBI IC3):
- Lista generica anti-truffa (10 item prioritizzati)
- Selettore tipo attacco (6 tipi con icone):
  - Truffa finanziaria
  - Truffa sentimentale (romance scam)
  - Finto operatore bancario / supporto tecnico
  - Phishing / Smishing
  - Finto parente ("Ciao mamma, ho cambiato numero")
  - Ingegneria sociale
- To-Do specifico e prioritizzato per tipo selezionato
- Auto-save debounced (1.5s) + save manuale
- Counter progresso "X/10 completati"

### STEP 3 — Simulazioni interattive (NO salvataggio dati)
4 simulazioni in formato **chat a bolle WhatsApp** con 
**2-3 scelte interattive** per simulazione (branching leggero):
- S1: Truffa amorosa via chat
- S2: Richiesta prestito urgente da conoscente
- S3: Finto operatore bancario
- S4: Finto parente WhatsApp ("Ciao mamma, ho perso il telefono")

Ogni simulazione: 8-12 messaggi, animazione "sta scrivendo...", 
feedback visivo corretto/sbagliato + spiegazione dopo ogni scelta.

### STEP 4 — Installa sulla Home Screen
- Rilevamento automatico OS (iOS / Android / Desktop)
- Istruzioni step-by-step per Safari, Chrome, Firefox
- Su Android/Chrome: intercetta beforeinstallprompt per 
  installazione nativa con un click
- Copy: "In caso di truffa, lo aprirai in 2 secondi"

---

## DESIGN SYSTEM — CYBERPEDIA BRAND

Usa /ui-ux-pro-max come skill primaria per TUTTO il design.
Usa /brand-guidelines per il brand Cyberpedia.
Usa /tailwind-design-system per i token CSS.
Usa /design-system-patterns per l'architettura del design system.

**Prima cosa da fare per il design**:
python3 ~/.claude/skills/ui-ux-pro-max/scripts/search.py
"cybersecurity emergency tool dark futuristic glassmorphism mobile-first"
--design-system --persist -p "Cyberpedia AntiTruffa" --stack react

text

**Vincoli brand**:
- Primary: #78D5E3 (cyan Cyberpedia)
- Tono: rassicurante, professionale, mai allarmistico
- Voce: "Fermati", "Respira", "Non sei solo"
- Stile visivo: dark mode, glassmorphism, futuristico

**Regole UI NON negoziabili** (usa /responsive-design + /interaction-design):
- Layout: `max-w-2xl lg:max-w-4xl mx-auto px-4 md:px-8 lg:px-12`
- Card: `rounded-3xl bg-gradient-to-br from-slate-900/80 backdrop-blur-xl 
  border border-slate-700/50 shadow-2xl hover:shadow-cyan-500/25`
- Input: `p-5 rounded-2xl bg-slate-900/60 border-2 border-slate-800 
  focus:border-cyan-400 focus:ring-4 focus:ring-cyan-400/30 
  text-xl font-medium` — ZERO label sopra, solo placeholder + helper text sotto
- Bottoni: `bg-gradient-to-r from-cyan-500 to-cyan-400 
  shadow-xl shadow-cyan-500/25 active:scale-[0.98]`
- Touch target minimo: 44x44px (CRITICO su mobile)
- Font size minimo body: 16px su mobile
- Animazioni: 150-300ms, usa transform/opacity not width/height
- Usa /wcag-audit-patterns per contrasto (minimo 4.5:1)
- Usa /accessibility-compliance per a11y

Usa /shadcn-ui per i componenti (solo se compatibili Tailwind v4 — 
verifica prima di includere).
Usa /tailwind-css-patterns per le utility classes.
Usa /visual-design-foundations per shadow, spacing, hierarchy.
Usa /web-design-guidelines per le best practice generali.

---

## SICUREZZA E PRIVACY

Usa /gdpr-data-handling per la compliance GDPR.
Usa /security-requirement-extraction per identificare tutti 
i requisiti di sicurezza.

**Storage cifrato**:
- Chiave AES-256-GCM salvata in localStorage come JWK
- IV 96-bit prepeso al ciphertext
- Struttura: { "antiscam-key": JWK, "antiscam-data": IV+ciphertext }
- I dati NON escono mai dal dispositivo → zero GDPR → 
  nessuna informativa necessaria

**Integrazione WordPress sicura**:
- Content-Security-Policy: frame-ancestors 'self' https://cyberpedia.it
- HTTPS obbligatorio
- Nessuna dipendenza da cookie di terze parti

---

## ARCHITETTURA CODICE

Usa /react-patterns per i pattern React.
Usa /react-state-management per la gestione stato (useState, 
no Redux — overkill per 4 step).
Usa /typescript-advanced-types per TypeScript strict.
Usa /modern-javascript-patterns per JS/TS moderno.

**Regole assolute per il codice**:
- TypeScript strict mode ovunque
- Ogni file sotto 200 righe — se supera, proponi split
- Componenti modulari e riutilizzabili
- Codice commentato in inglese, copy in italiano
- Cartella `data/` separata per tutti i contenuti statici
  (to-do list, script simulazioni, guide installazione)

**Struttura repository**:
cyberpedia-antiscam-tool/
├── .github/workflows/deploy.yml # /github-actions-templates
├── public/icons/ # PWA icons (192, 512)
├── src/
│ ├── components/
│ │ ├── layout/ # WizardShell, StepIndicator, PageTransition
│ │ ├── chat/ # ChatSimulator, ChatBubble, ChatChoices, ChatTyping
│ │ ├── emergency/ # EmergencyForm, AttackTypeSelector, TodoChecklist
│ │ ├── install/ # OsDetector, InstallGuide, BrowserGuide
│ │ └── ui/ # shadcn/ui selettivi
│ ├── pages/ # LandingPage, EmergencyPage, SimulationsPage, InstallPage
│ ├── data/ # todo-generic, todo-by-attack, simulations/, install-guides
│ ├── lib/ # encryption.ts, storage.ts, device.ts
│ ├── hooks/ # useEncryptedStorage, useDeviceInfo, useReturningUser
│ ├── styles/ # design-system.css, globals.css
│ └── types/ # emergency.ts, simulation.ts, device.ts
├── ROADMAP.md
├── BRAND-GUIDELINES.md
└── CLAUDE.md

text

---

## PIANO DI SVILUPPO — 4 SETTIMANE

Usa /writing-plans per strutturare il piano.
Usa /executing-plans per ogni settimana di lavoro.
Usa /context-driven-development per mantenere contesto tra sessioni.

### SETTIMANA 1 — Setup + Scheletro

Usa /systematic-debugging per identificare dipendenze problematiche.

1. Init repository con Vite + React + TypeScript strict
2. **Verifica IMMEDIATA** compatibilità:
   - Framer Motion ≥12.x con React 19 (peer warnings?)
   - shadcn/ui con Tailwind v4 (componente per componente)
   - Se incompatibile: proponi alternativa prima di procedere
3. Design system: tokens CSS custom properties (colori, spacing, 
   tipografia, breakpoints) — usa /tailwind-design-system
4. WizardShell: useState<0|1|2|3> per navigazione 4 step
5. AnimatePresence Framer Motion per transizioni tra step
6. StepIndicator: pallini 1/4
7. 4 pagine placeholder con layout base
8. vite-plugin-pwa configurato
9. BRAND-GUIDELINES.md creato con output di /ui-ux-pro-max 
   `--design-system --persist`
10. ROADMAP.md + primo commit

**Milestone**: npm run dev funziona, navigazione 4 step con transizioni, 
design system applicato.

---

### SETTIMANA 2 — Step 1 + Step 2

Usa /frontend-design per le decisioni di layout.
Usa /form-cro per ottimizzare il form (conversione = completamento).
Usa /interaction-design per hover states e micro-interazioni.

1. Step 1: copy definitivo, logo, CTA, trust signal
2. lib/encryption.ts: AES-256-GCM con Web Crypto API
3. lib/storage.ts: saveEmergencyData/loadEmergencyData cifrato
4. hooks/useReturningUser.ts: returning user detection
5. EmergencyForm: telefono banca + 3 contatti (NO label sopra!)
6. AttackTypeSelector: 6 card con icone Lucide + colori
7. TodoChecklist: generica + dinamica per tipo attacco
8. Auto-save debounced + save manuale

**Milestone**: Step 1 e 2 end-to-end, dati cifrati persistono, 
returning user funziona, To-Do dinamico.

---

### SETTIMANA 3 — Step 3 + Step 4

Usa /interaction-design per le animazioni della chat simulata.
Usa /mobile-ios-design e /mobile-android-design per Step 4.
Usa /wcag-audit-patterns per accessibilità simulazioni.

1. ChatSimulator engine: messaggi con delay progressivo, 
   "sta scrivendo...", 2-3 scelte per simulazione
2. 4 script simulazioni in src/data/simulations/ 
   (8-12 messaggi + punti decisionali + feedback)
3. SimulationsPage hub: 4 card, click → stato interno, 
   NO React Router
4. hooks/useDeviceInfo.ts: iOS/Android/Desktop + browser detection
5. InstallGuide: step-by-step per ogni OS+browser combo
6. Intercetta beforeinstallprompt su Android/Chrome

**Milestone**: tutte e 4 le pagine complete e funzionanti.

---

### SETTIMANA 4 — Hardening + Deploy + WordPress

Usa /deployment-pipeline-design per la pipeline di deploy.
Usa /github-actions-templates per il CI/CD automatico.
Usa /security-requirement-extraction per il security review finale.
Usa /accessibility-compliance per l'audit finale.
Usa /finishing-a-development-branch per finalizzare.

1. React.lazy() per code splitting, audit bundle size
2. Lighthouse target: Performance ≥95, Accessibility =100, PWA=pass
3. Cloudflare Pages: deploy automatico da GitHub, headers CSP
4. Shortcode WordPress: iframe responsivo + postMessage resize
5. Test su iPhone Safari + Android Chrome + Samsung Internet
6. npm run build senza errori TypeScript
7. npm run lint senza warnings
8. Verifica cifratura in DevTools (dati non leggibili)
9. ROADMAP.md aggiornata
10. README con istruzioni dev/deploy

**Milestone**: tool live su cyberpedia.it/antitruffa, pronto per 
lancio stampa.

---

## CHECKLIST PRE-CONSEGNA

Usa /verification-before-completion per ogni step.
Usa /code-review-excellence per la review finale.

**Visual**:
- [ ] Nessuna emoji come icona (solo Lucide SVG)
- [ ] Hover states su OGNI elemento interattivo
- [ ] Layout scala correttamente da 375px a 1440px
- [ ] Nessun horizontal scroll su mobile
- [ ] Contrasto testo ≥4.5:1 (WCAG AA)

**Funzionale**:
- [ ] Card simulazioni cliccabili con animazioni
- [ ] Dati localStorage non leggibili in chiaro da DevTools
- [ ] Returning user porta direttamente allo Step 2 precompilato
- [ ] PWA installabile su iOS Safari e Android Chrome
- [ ] Iframe funziona su cyberpedia.it senza errori CSP

**Tecnico**:
- [ ] npm run build: 0 errori TypeScript
- [ ] npm run lint: 0 warnings
- [ ] Bundle totale <150KB gzipped
- [ ] Lighthouse Performance ≥95

---

## MODO DI LAVORO

1. Inizia con /brainstorming — rianalizza tutto prima di codificare
2. Una milestone alla volta — aspetta il mio OK prima di avanzare
3. Per ogni componente UI: usa /ui-ux-pro-max come riferimento
4. Se identifichi un rischio tecnico o di sicurezza, 
   segnalalo immediatamente
5. Usa /systematic-debugging se qualcosa non funziona
6. Commit atomici con messaggi descrittivi
7. Aggiorna ROADMAP.md dopo ogni milestone

**Parola d'ordine**: mostrami screenshot di localhost DOPO ogni 
milestone, non prima di averla verificata con 
/verification-before-completion.

**Il progetto si chiama**: cyberpedia-antiscam-tool

Sei pronto? Inizia con /brainstorming.