---
phase: 03-security-hardening
plan: 02
subsystem: security
tags: [brute-force, pin-protection, csp, corruption-detection, progressive-delay]

# Dependency graph
requires:
  - phase: 03-security-hardening
    plan: 01
    provides: StorageCorruptionError, brute-force counter helpers, isCryptoAvailable, plaintext fallback
provides:
  - useBruteForceGuard hook with progressive delay state machine
  - PinDialog brute-force delay UI with countdown timer and reset hint
  - PinDialog corruption detection view with Italian message
  - EmergencyPage StorageCorruptionError handling and brute-force guard integration
  - EmergencyPage persistent crypto warning banner
  - NeedModePage StorageCorruptionError handling
  - Hardened CSP headers with object-src, worker-src, connect-src
affects: []

# Tech tracking
tech-stack:
  added: []
  patterns: [progressive-delay-state-machine, corruption-alert-extraction, exactOptionalPropertyTypes-spread-for-inline-components]

key-files:
  created:
    - cyberpedia-antiscam-tool/src/hooks/useBruteForceGuard.ts
  modified:
    - cyberpedia-antiscam-tool/src/components/emergency/PinDialog.tsx
    - cyberpedia-antiscam-tool/src/pages/EmergencyPage.tsx
    - cyberpedia-antiscam-tool/src/pages/NeedModePage.tsx
    - cyberpedia-antiscam-tool/public/_headers

key-decisions:
  - "PinDialog at 256 lines exceeds 200-line guideline due to required security additions (brute-force delay, corruption view, reset hint); CorruptionAlert extracted as inline component"
  - "EmergencyPage at 222 lines exceeds 200-line guideline by 22 lines due to security additions (crypto banner, corruption handling, brute-force, reset callback)"
  - "exactOptionalPropertyTypes spread pattern applied to CorruptionAlert onReset prop (consistent with Phase 02 pattern)"

patterns-established:
  - "Progressive delay hook pattern: constant curve array indexed by attempt count, countdown via setTimeout chain"
  - "CorruptionAlert inline extraction pattern: separate component in same file for conditional rendering"

requirements-completed: [SEC-02, SEC-04]

# Metrics
duration: 8min
completed: 2026-03-16
---

# Phase 3 Plan 2: Brute-Force PIN Protection & CSP Hardening Summary

**Progressive delay brute-force guard (0/0/0/5s/15s/30s/60s) with countdown UI, corruption detection view, crypto warning banner, and hardened CSP headers with object-src/worker-src/connect-src**

## Performance

- **Duration:** 8 min
- **Started:** 2026-03-16T16:28:30Z
- **Completed:** 2026-03-16T16:36:45Z
- **Tasks:** 3
- **Files modified:** 5

## Accomplishments
- Created useBruteForceGuard hook with progressive delay state machine, localStorage-persisted attempt counter, and countdown timer
- Updated PinDialog with countdown display, disabled input during lockout, "forgot PIN?" hint after 3 failures with reset action, and corruption detection view
- Integrated brute-force guard into EmergencyPage (recordFailure on wrong PIN, resetOnSuccess on correct unlock)
- Added StorageCorruptionError handling in EmergencyPage and NeedModePage with Italian user-facing messages
- Added persistent crypto warning banner in EmergencyPage when Web Crypto API is unavailable
- Hardened CSP headers: object-src 'none', worker-src 'self', connect-src with AI Worker domain

## Task Commits

Each task was committed atomically:

1. **Task 1: Create useBruteForceGuard hook with progressive delay state machine** - `5a7eaf0` (feat)
2. **Task 2: Update PinDialog with brute-force delay UI, corruption handling, and crypto warning banner** - `0611d54` (feat)
3. **Task 3: Audit and harden CSP headers in _headers file** - `af54565` (feat)

Additional fix commit:
4. **Fix: exactOptionalPropertyTypes spread for CorruptionAlert onReset prop** - `139c3df` (fix)

## Files Created/Modified
- `src/hooks/useBruteForceGuard.ts` - New hook: progressive delay state machine with countdown, localStorage persistence, hint threshold
- `src/components/emergency/PinDialog.tsx` - Added brute-force delay UI (countdown, disabled input), corruption view (CorruptionAlert), reset hint
- `src/pages/EmergencyPage.tsx` - Integrated brute-force guard, StorageCorruptionError handling, crypto warning banner, handleResetData
- `src/pages/NeedModePage.tsx` - Added StorageCorruptionError handling with redirect message
- `public/_headers` - Hardened CSP: object-src 'none', worker-src 'self', connect-src with AI Worker domain

## Decisions Made
- PinDialog exceeds 200-line guideline (256 lines) due to brute-force delay, corruption view, and reset hint additions. CorruptionAlert extracted as inline component per plan instruction.
- EmergencyPage exceeds 200-line guideline (222 lines) by 22 lines due to required security additions (crypto banner, corruption handling, brute-force guard, reset callback). Splitting further would fragment the page orchestrator.
- exactOptionalPropertyTypes spread pattern used for CorruptionAlert's onReset prop, consistent with Phase 02 established pattern.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed exactOptionalPropertyTypes error in CorruptionAlert**
- **Found during:** Task 2 verification (build check)
- **Issue:** `onResetData` is `(() => void) | undefined` but CorruptionAlert's `onReset?` prop under exactOptionalPropertyTypes rejects undefined assignment
- **Fix:** Applied established spread pattern: `{...(onResetData !== undefined ? { onReset: onResetData } : {})}`
- **Files modified:** src/components/emergency/PinDialog.tsx
- **Verification:** `npx tsc --noEmit` and `npm run build` pass
- **Committed in:** `139c3df`

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Auto-fix necessary for TypeScript strict mode correctness. No scope creep.

## Issues Encountered
None - all tasks executed as planned.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- All Phase 03 security hardening complete (Plans 01 + 02)
- StorageCorruptionError flows from storage.ts through PinDialog to user-facing Italian messages
- Brute-force guard fully integrated with EmergencyPage PIN unlock flow
- CSP headers fully hardened for production deployment
- TypeScript compiles, lint passes, build succeeds

## Self-Check: PASSED

- [x] useBruteForceGuard.ts exists with all exports
- [x] PinDialog.tsx contains brute-force delay UI, corruption view, reset hint
- [x] EmergencyPage.tsx contains brute-force guard, corruption handling, crypto banner
- [x] NeedModePage.tsx contains StorageCorruptionError handling
- [x] _headers contains object-src, worker-src, connect-src additions
- [x] SUMMARY.md created
- [x] Commit 5a7eaf0 found (Task 1)
- [x] Commit 0611d54 found (Task 2)
- [x] Commit af54565 found (Task 3)
- [x] Commit 139c3df found (Fix)
- [x] TypeScript compiles clean
- [x] Lint passes clean
- [x] Build succeeds

---
*Phase: 03-security-hardening*
*Completed: 2026-03-16*
