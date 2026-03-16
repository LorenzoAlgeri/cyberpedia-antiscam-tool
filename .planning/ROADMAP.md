# Roadmap: Cyberpedia Anti-Truffa Tool — Hardening

## Overview

This milestone hardens the existing cyberpedia-antiscam-tool SPA through six focused phases. We start by auditing and removing dead code (so we only refactor what matters), then split oversized components, stress-test security, tighten TypeScript boundaries, audit AI simulations, and finish with an accessibility pass. Each phase uses a single designated skill and produces observable, verifiable outcomes. No new features — just making the existing tool auditable, secure, and maintainable.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Dead Code & Bundle** - Audit all 53 source files, remove unused code, verify bundle stays under 150KB gzipped (completed 2026-03-16)
- [ ] **Phase 2: Component Refactoring** - Split four oversized components (TodoChecklist, ChatSimulator, EmergencyPage, EmergencyForm) into focused modules
- [ ] **Phase 3: Security Hardening** - Stress-test encryption edge cases, audit PIN caching, verify legacy migration and CSP headers
- [ ] **Phase 4: TypeScript Strictness** - Add runtime type guards at storage boundaries and exhaustive switch assertions on all unions
- [ ] **Phase 5: AI Simulation Audit** - Verify all simulation scenarios match the validator contract and have correct choice-point structure
- [ ] **Phase 6: Accessibility** - Full WCAG 2.2 AA audit for elderly/vulnerable users, screen reader verification, touch target compliance

## Phase Details

### Phase 1: Dead Code & Bundle
**Goal**: The codebase ships zero unused code and the bundle stays within budget
**Skill**: /simplify
**Depends on**: Nothing (first phase)
**Requirements**: AUDIT-01, AUDIT-02, AUDIT-03, AUDIT-04
**Success Criteria** (what must be TRUE):
  1. Running a dead-code analysis tool reports zero unused exports across all source files
  2. No orphan files exist (every file is reachable from an entry point)
  3. Vendor imports (motion, lucide-react, @base-ui/react) only pull in symbols actually used — no full-library bundles
  4. `npm run build` produces a bundle at or below 150KB gzipped, confirmed by size report
**Plans**: 2 plans

Plans:
- [ ] 01-01-PLAN.md — Install knip and remove dead files, exports, and dependencies
- [ ] 01-02-PLAN.md — LazyMotion migration, vendor tree-shaking audit, and bundle verification

### Phase 2: Component Refactoring
**Goal**: Every component file is under 200 lines and has a single clear responsibility
**Skill**: /react-patterns
**Depends on**: Phase 1
**Requirements**: REFAC-01, REFAC-02, REFAC-03, REFAC-04
**Success Criteria** (what must be TRUE):
  1. TodoChecklist.tsx is split into sub-components (tabs, severity banner, progress tracker) with no file exceeding 200 lines
  2. ChatSimulator.tsx and useChatSimulator.ts are split into focused modules (engine, UI, types) with no file exceeding 200 lines
  3. EmergencyPage.tsx is split into an orchestrator plus sub-section components with no file exceeding 200 lines
  4. EmergencyForm.tsx is split into bank section and contacts section components with no file exceeding 200 lines
  5. The tool behaves identically before and after refactoring — all user flows produce the same results
**Plans**: 4 plans

Plans:
- [ ] 02-01-PLAN.md — Split TodoChecklist.tsx into SevereActionBanner, TodoRow, TodoProgressBar sub-components
- [ ] 02-02-PLAN.md — Split EmergencyForm.tsx into BankSection and TrustedContactsSection
- [ ] 02-03-PLAN.md — Split useChatSimulator.ts into types, reducer, and hook-only modules
- [ ] 02-04-PLAN.md — Split EmergencyPage.tsx into orchestrator plus four display sub-components

### Phase 3: Security Hardening
**Goal**: The encryption layer handles every edge case gracefully and the embed security is verified
**Skill**: /systematic-debugging
**Depends on**: Phase 2
**Requirements**: SEC-01, SEC-02, SEC-03, SEC-04
**Success Criteria** (what must be TRUE):
  1. Encryption handles empty data, corrupt storage, wrong PIN, and missing salt without crashing — each case produces a clear user-facing error or safe fallback
  2. PIN session cache in sessionStorage enforces TTL expiration, is scoped to the current tab, and clears on logout/close
  3. Legacy migration path securely erases old insecure key storage after migrating — old keys are not recoverable from localStorage
  4. Content-Security-Policy headers correctly restrict iframe embedding to cyberpedia.it only, verified by attempting embed from unauthorized origin
**Plans**: TBD

Plans:
- [ ] 03-01: TBD

### Phase 4: TypeScript Strictness
**Goal**: Runtime boundaries validate data shape so corrupted storage or schema changes never cause silent failures
**Skill**: /typescript-advanced-types
**Depends on**: Phase 3
**Requirements**: TS-01, TS-02
**Success Criteria** (what must be TRUE):
  1. Every localStorage read passes through a runtime type guard that rejects corrupted data or unexpected schema — invalid data triggers a clear recovery path, not a crash
  2. All discriminated unions in the codebase use exhaustive switch statements with `never` assertions — adding a new union member causes a compile-time error if any switch is not updated
**Plans**: TBD

Plans:
- [ ] 04-01: TBD

### Phase 5: AI Simulation Audit
**Goal**: Every simulation scenario is structurally valid and delivers the intended learning experience
**Skill**: /javascript-testing-patterns
**Depends on**: Phase 4
**Requirements**: SIM-01, SIM-02
**Success Criteria** (what must be TRUE):
  1. Every simulation scenario passes validation against the useAISimulation.ts validator contract — no missing fields, no type mismatches, no orphan branches
  2. Each choice point in every scenario has exactly 2 correct options, verified by automated check or manual audit of all scenario data files
**Plans**: TBD

Plans:
- [ ] 05-01: TBD

### Phase 6: Accessibility
**Goal**: The tool is fully usable by elderly and vulnerable users regardless of assistive technology
**Skill**: /wcag-audit-patterns
**Depends on**: Phase 5
**Requirements**: A11Y-01, A11Y-02, A11Y-03
**Success Criteria** (what must be TRUE):
  1. A full WCAG 2.2 AA audit passes with zero critical or major violations, with specific attention to patterns used by elderly/vulnerable users (large text, clear labels, forgiving inputs)
  2. All interactive elements (buttons, form fields, checkboxes, simulation choices) are fully operable via screen reader — each has an accessible name, role, and state
  3. Every touch target measures at least 44x44px and body font size is at least 16px on mobile viewports (375px+)
**Plans**: TBD

Plans:
- [ ] 06-01: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5 → 6

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Dead Code & Bundle | 2/2 | Complete   | 2026-03-16 |
| 2. Component Refactoring | 1/4 | In Progress|  |
| 3. Security Hardening | 0/0 | Not started | - |
| 4. TypeScript Strictness | 0/0 | Not started | - |
| 5. AI Simulation Audit | 0/0 | Not started | - |
| 6. Accessibility | 0/0 | Not started | - |
