# Cyberpedia Anti-Truffa Tool

SPA statica a 4 step per aiutare persone vittime di truffa a gestire la situazione senza agire impulsivamente. Integrata in [cyberpedia.it](https://cyberpedia.it) via iframe.

## Stack

| Layer | Tecnologia |
|-------|-----------|
| Build | Vite 7 + React 19 + TypeScript 5.9 (strict) |
| Styling | Tailwind CSS 4 + design system OKLCH custom |
| Animazioni | motion 12 (AnimatePresence) |
| Icone | Lucide React |
| Cifratura | Web Crypto API — PIN + PBKDF2 + AES-256-GCM |
| PWA | vite-plugin-pwa |
| Deploy | Cloudflare Pages (CDN globale, DDoS protection) |
| CI | GitHub Actions (lint + type check + build) |

---

## Sviluppo locale

```bash
npm install
npm run dev       # http://localhost:5173
```

```bash
npm run build     # build di produzione in dist/
npm run lint      # ESLint (deve terminare con 0 errori)
npm run preview   # preview del build su http://localhost:4173
```

---

## Deploy

Il deploy è **completamente automatico** tramite Cloudflare Pages Git integration.

1. Ogni push su `master` triggera il CI GitHub Actions (lint + build)
2. Cloudflare Pages rileva il push e deploya automaticamente `dist/`
3. Nessun token o segreto richiesto nel repo per il deploy

**URL di produzione:** `https://cyberpedia-antiscam-tool.pages.dev`

### Headers Cloudflare (`public/_headers`)

Il file `public/_headers` viene copiato da Vite in `dist/` e applicato da Cloudflare Pages all'edge:

- **CSP**: `frame-ancestors 'self' https://cyberpedia.it` — solo cyberpedia.it può embeddare il tool via iframe
- **HSTS**, **X-Content-Type-Options**, **Referrer-Policy**, **Permissions-Policy** già configurati
- `Cache-Control: immutable` per tutti gli asset con hash content-based
- `Cache-Control: no-store` per `sw.js` (aggiornamenti PWA istantanei)

---

## Integrazione WordPress

### 1. Installa il plugin shortcode

Copia `wordpress/antiscam-shortcode.php` nella cartella `/wp-content/plugins/` del sito WordPress e attivalo dal pannello Admin → Plugin.

### 2. Inserisci lo shortcode nella pagina

```
[antiscam-tool]
```

Parametri opzionali:

```
[antiscam-tool url="https://cyberpedia-antiscam-tool.pages.dev" min_height="600"]
```

Il plugin crea un iframe responsivo che:
- Si ridimensiona automaticamente all'altezza del contenuto via `postMessage`
- Non mostra scrollbar interne
- È compatibile con tutti i browser moderni

### 3. Aggiorna la CSP (se necessario)

Se il dominio WordPress è diverso da `cyberpedia.it`, aggiorna `public/_headers`:

```
frame-ancestors 'self' https://tuodominio.it
```

---

## Architettura sicurezza

I dati dell'utente non escono **mai** dal dispositivo.

```
PIN (4-6 cifre, mai persistito)
  └─ PBKDF2 (100.000 iterazioni, SHA-256) + salt (16 byte random)
       └─ CryptoKey AES-256-GCM (non-extractable, solo in memoria)
            └─ encrypt(JSON) → base64(IV ‖ ciphertext+authTag)
                 └─ localStorage["antiscam-data"]
```

**localStorage contiene solo:**
- `antiscam-salt` — salt PBKDF2 in base64 (non sensibile)
- `antiscam-data` — ciphertext AES-256-GCM in base64 (illeggibile senza PIN)

La CryptoKey non viene mai esportata né persistita. Se il browser è chiuso, la chiave è persa: all'apertura successiva l'utente inserisce di nuovo il PIN e la chiave viene riderivata da PIN + salt.

---

## Struttura repository

```
src/
├── components/
│   ├── chat/          # ChatSimulator, ChatBubble, ChatChoices, ChatTyping
│   ├── emergency/     # EmergencyForm, AttackTypeSelector, TodoChecklist,
│   │                  # PinDialog, SaveStatusBadge
│   ├── install/       # InstallGuide
│   ├── layout/        # WizardShell, StepIndicator, CyberpediaLogo
│   └── ui/            # Button (shadcn/ui base)
├── data/
│   ├── simulations/   # 4 script simulazioni (romance, loan, bank, relative)
│   ├── attack-types.ts
│   ├── install-guides.ts
│   ├── todo-by-attack.ts
│   └── todo-generic.ts
├── hooks/
│   ├── useAutoSave.ts
│   ├── useChatSimulator.ts
│   ├── useDeviceInfo.ts
│   ├── useFocusTrap.ts
│   ├── useHashRouter.ts
│   ├── useIframeResize.ts
│   ├── useInstallPrompt.ts
│   └── useReturningUser.ts
├── lib/
│   ├── encryption.ts  # PBKDF2 + AES-256-GCM (Web Crypto API)
│   ├── storage.ts     # save/load cifrati + cleanup legacy key
│   └── utils.ts
├── pages/             # LandingPage, EmergencyPage, SimulationsPage, InstallPage
├── types/             # emergency, simulation, device, todo, steps
└── styles/            # design-system.css, components.css
wordpress/
└── antiscam-shortcode.php
public/
├── _headers           # Cloudflare Pages security headers
└── icons/             # PWA icons
```

---

## Checklist pre-lancio

- [x] `npm run build` — 0 errori TypeScript
- [x] `npm run lint` — 0 errori ESLint
- [x] Bundle totale < 150 KB gzip (~135 KB)
- [x] PWA installabile (manifest + service worker)
- [x] CSP `frame-ancestors` configurata per cyberpedia.it
- [x] Dati cifrati: DevTools mostra solo `antiscam-salt` e `antiscam-data`
- [x] Returning user: CTA diventa "Accedi ai tuoi dati" se esistono dati salvati
- [x] WCAG 2.2 AA: focus-visible, focus trap, ARIA roles, keyboard nav
- [ ] Test su iPhone Safari (manuale)
- [ ] Test su Android Chrome (manuale)
- [ ] Test su Samsung Internet (manuale)
- [ ] Shortcode WordPress attivo su cyberpedia.it/antitruffa
