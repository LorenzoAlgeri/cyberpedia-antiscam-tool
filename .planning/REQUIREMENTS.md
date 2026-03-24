# Requirements: Cyberpedia Anti-Truffa Tool — Hardening

**Defined:** 2026-03-16
**Core Value:** Every component and utility must be auditable, secure, and maintainable — no hidden debt, no unused code shipping, no oversized files masking complexity.

## v1 Requirements

Requirements for this hardening milestone. Each maps to a roadmap phase with a single designated skill.

### Dead Code & Bundle

- [x] **AUDIT-01**: Find and remove unused exports across all 53 source files
- [x] **AUDIT-02**: Find and remove unreachable code branches and orphan files
- [x] **AUDIT-03**: Audit tree-shaking effectiveness for vendor imports (motion, lucide-react, @base-ui/react)
- [x] **AUDIT-04**: Verify total gzipped bundle stays <=150KB after all changes

### Component Refactoring

- [x] **REFAC-01**: Split TodoChecklist.tsx (497L) into sub-components (tabs, severity banner, progress tracker)
- [x] **REFAC-02**: Split ChatSimulator.tsx + useChatSimulator.ts (456L each) into focused modules
- [x] **REFAC-03**: Split EmergencyPage.tsx (421L) into orchestration + sub-sections
- [x] **REFAC-04**: Split EmergencyForm.tsx (385L) into bank section + contacts section

### Security Hardening

- [x] **SEC-01**: Stress-test encryption with edge cases (empty data, corrupt storage, wrong PIN, missing salt)
- [x] **SEC-02**: Audit PIN session caching in sessionStorage (TTL enforcement, tab-scope isolation, clearance)
- [x] **SEC-03**: Verify legacy migration path securely erases old insecure key storage
- [x] **SEC-04**: Audit Content-Security-Policy headers for iframe embed on cyberpedia.it

### TypeScript Strictness

- [x] **TS-01**: Add runtime type guards at localStorage read boundaries (corrupted data, schema changes)
- [x] **TS-02**: Add exhaustive switch statements with `never` assertions on all discriminated unions

### AI Simulation Audit

- [x] **SIM-01**: Audit all simulation scenarios against useAISimulation.ts validator contract
- [x] **SIM-02**: Verify each scenario has exactly 2 correct options per choice point

### Accessibility

- [x] **A11Y-01**: Run full WCAG 2.2 AA audit focused on elderly/vulnerable user needs
- [x] **A11Y-02**: Verify screen reader compatibility for all interactive elements
- [x] **A11Y-03**: Verify touch targets (44x44px min) and font sizes (16px min on mobile)

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Performance

- **PERF-01**: Lazy-load simulation data files individually
- **PERF-02**: Preload critical CSS for landing page

### Testing

- **TEST-01**: Unit tests for encryption.ts and storage.ts
- **TEST-02**: Integration tests for full wizard flow

## Out of Scope

| Feature | Reason |
|---------|--------|
| New features | This is purely quality/hardening |
| UI/UX redesign | Visual layer stays unchanged |
| Dependency upgrades | All versions are current and compatible |
| Backend/API integration | Tool remains 100% static SPA |
| Branded types | Adds complexity without clear value for this codebase size |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| AUDIT-01 | Phase 1: Dead Code & Bundle | Complete |
| AUDIT-02 | Phase 1: Dead Code & Bundle | Complete |
| AUDIT-03 | Phase 1: Dead Code & Bundle | Complete |
| AUDIT-04 | Phase 1: Dead Code & Bundle | Complete |
| REFAC-01 | Phase 2: Component Refactoring | Complete |
| REFAC-02 | Phase 2: Component Refactoring | Complete |
| REFAC-03 | Phase 2: Component Refactoring | Complete |
| REFAC-04 | Phase 2: Component Refactoring | Complete |
| SEC-01 | Phase 3: Security Hardening | Complete |
| SEC-02 | Phase 3: Security Hardening | Complete |
| SEC-03 | Phase 3: Security Hardening | Complete |
| SEC-04 | Phase 3: Security Hardening | Complete |
| TS-01 | Phase 4: TypeScript Strictness | Complete |
| TS-02 | Phase 4: TypeScript Strictness | Complete |
| SIM-01 | Phase 5: AI Simulation Audit | Complete |
| SIM-02 | Phase 5: AI Simulation Audit | Complete |
| A11Y-01 | Phase 6: Accessibility | Complete |
| A11Y-02 | Phase 6: Accessibility | Complete |
| A11Y-03 | Phase 6: Accessibility | Complete |

**Coverage:**
- v1 requirements: 19 total
- Mapped to phases: 19
- Unmapped: 0

---
*Requirements defined: 2026-03-16*
*Last updated: 2026-03-16 after roadmap creation*
