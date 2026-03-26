# Cyberpedia Anti-Truffa Tool

## What This Is

A 5-step wizard SPA that helps scam victims manage emergency actions — bank contacts, prioritized to-do checklists by attack type, interactive chat simulations, and PWA installation. Deployed on Cloudflare Pages, embedded via iframe in cyberpedia.it. After v1.0 Hardening: zero dead code, all components under 200 lines, hardened encryption with brute-force protection, runtime type guards, validated AI simulations, and full WCAG 2.2 AA accessibility.

## Core Value

Every component and utility must be auditable, secure, and maintainable — no hidden debt, no unused code shipping, no oversized files masking complexity.

## Requirements

### Validated

- ✓ TypeScript strict mode (zero errors) — existing
- ✓ AES-256-GCM + PBKDF2 encryption — existing
- ✓ ESLint zero warnings — existing
- ✓ Code-splitting with React.lazy — existing
- ✓ WCAG 2.2 AA compliance — existing
- ✓ Dead code elimination (knip zero issues) — v1.0
- ✓ All components under 200 lines — v1.0
- ✓ Encryption edge case handling (corruption, wrong PIN, missing salt) — v1.0
- ✓ Brute-force PIN protection with progressive delay — v1.0
- ✓ CSP headers hardened for iframe embed — v1.0
- ✓ Runtime type guards at storage boundaries — v1.0
- ✓ Exhaustive switch assertions on all unions — v1.0
- ✓ AI simulation structural validation (9 rules, 30 tests) — v1.0
- ✓ Screen reader compatibility with ARIA landmarks — v1.0
- ✓ Touch targets 44x44px, font sizes 16px min — v1.0

### Active

- [ ] Lazy-load simulation data files individually
- [ ] Preload critical CSS for landing page
- [ ] Unit tests for encryption.ts and storage.ts
- [ ] Integration tests for full wizard flow
- [ ] PBKDF2 iteration count upgrade (100k → 600k per OWASP)

### Out of Scope

- New features — tool is feature-complete for current needs
- UI/UX redesign — visual layer is stable and accessible
- Backend/API integration — tool remains 100% static SPA
- Mobile native app — PWA covers mobile use case

## Context

Shipped v1.0 Hardening with 8,037 LOC (TypeScript/TSX/CSS).
Tech stack: React 19, Vite 6, Tailwind 4, Motion 12, Web Crypto API.
Bundle: 137.63KB gzipped. 66 commits over 7 days.
Deployed on Cloudflare Pages with DDoS protection.

## Constraints

- **No regressions**: Every change must preserve identical behavior
- **Bundle budget**: Total gzipped must stay <=150 KB
- **Static SPA**: No server-side code, no API calls (except optional AI worker)
- **Accessibility**: WCAG 2.2 AA minimum for elderly/vulnerable users

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| One skill per phase | Forces focused, verifiable work per phase | ✓ Good — clean phase boundaries |
| 6 phases, coarse to fine | Audit first, then fix, then verify | ✓ Good — dependency chain worked |
| No new features | Hardening only, don't mix concerns | ✓ Good — stayed focused |
| @public JSDoc over knip-ignore | knip v5 uses tag-based suppression | ✓ Good — cleaner than comments |
| LazyMotion + domAnimation | Sync load, smaller chunk | ✓ Good — 3.1KB saved |
| PBKDF2 100k iterations | Quick ship, OWASP 600k deferred | ⚠️ Revisit in v2 |
| exactOptionalPropertyTypes spread | Avoids undefined assignability errors | ✓ Good — pattern established |
| Ref-based DOM updates for a11y | Satisfies react-hooks lint rule | ✓ Good |

---
*Last updated: 2026-03-17 after v1.0 milestone*
