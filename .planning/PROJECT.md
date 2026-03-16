# Cyberpedia Anti-Truffa Tool — Hardening Milestone

## What This Is

A quality hardening pass on the existing cyberpedia-antiscam-tool SPA. The tool is a 5-step wizard that helps scam victims manage emergency actions (bank contacts, to-do checklists, chat simulations, PWA install). It's production-ready with zero TS errors and zero lint warnings. This milestone focuses on finding hidden issues, splitting oversized components, stress-testing encryption, eliminating dead code, and verifying everything end-to-end.

## Core Value

Every component and utility must be auditable, secure, and maintainable — no hidden debt, no unused code shipping, no oversized files masking complexity.

## Requirements

### Validated

- Validated TypeScript strict mode (zero errors) — existing
- Validated AES-256-GCM + PBKDF2 encryption — existing
- Validated ESLint zero warnings — existing
- Validated code-splitting with React.lazy — existing
- Validated WCAG 2.2 AA compliance — existing

### Active

- [ ] Deep code audit: find dead code, unused exports, unreachable branches
- [ ] Refactor oversized components (TodoChecklist 497L, ChatSimulator 456L, EmergencyPage 421L, EmergencyForm 385L)
- [ ] Security stress-test: encryption edge cases, PIN caching, storage layer robustness
- [ ] TypeScript strictness beyond compiler: runtime type guards, exhaustive switches, branded types where useful
- [ ] Bundle analysis: identify tree-shaking gaps, unnecessary vendor code, lazy-loading opportunities
- [ ] End-to-end verification: all changes preserve existing functionality

### Out of Scope

- New features — this is purely quality/hardening
- UI/UX redesign — visual layer stays unchanged
- Backend/API integration — tool remains 100% static SPA
- Dependency upgrades — versions are current and compatible

## Context

The tool is deployed on Cloudflare Pages, embedded via iframe in cyberpedia.it. It received significant traffic after media coverage (VerificaTruffa.it reference: 10k requests in 24h). The static SPA architecture was chosen specifically for DDoS resilience.

Key technical facts:
- 53 TypeScript/TSX files, ~407 KB source
- Build output: 552 KB uncompressed, ~150 KB gzipped
- Largest files: TodoChecklist (497L), useChatSimulator (456L), EmergencyPage (421L), EmergencyForm (385L)
- Dependencies: React 19, Motion 12, Tailwind 4, Vite 7
- Encryption: Web Crypto API native (no external crypto deps)

## Constraints

- **No regressions**: Every refactor must preserve identical behavior
- **Bundle budget**: Total gzipped must stay <=150 KB
- **Zero new dependencies**: Use only what's already in package.json
- **Static SPA**: No server-side code, no API calls (except optional AI worker)

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| One skill per phase | Forces focused, verifiable work per phase | -- Pending |
| 5-6 phases, coarse to fine | Audit first, then fix, then verify | -- Pending |
| No new features | Hardening only, don't mix concerns | -- Pending |

---
*Last updated: 2026-03-16 after initialization*
