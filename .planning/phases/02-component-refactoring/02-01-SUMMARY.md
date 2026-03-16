---
phase: 02-component-refactoring
plan: 01
subsystem: emergency/TodoChecklist
tags: [refactoring, component-extraction, file-size]
dependency_graph:
  requires: []
  provides:
    - SevereActionBanner named export
    - TodoRow named export
    - TodoProgressBar named export
  affects:
    - cyberpedia-antiscam-tool/src/components/emergency/TodoChecklist.tsx
tech_stack:
  added: []
  patterns:
    - named exports only (no default exports)
    - motion/react-m namespace import pattern
    - private helper functions (scopeLabel not exported)
key_files:
  created:
    - cyberpedia-antiscam-tool/src/components/emergency/SevereActionBanner.tsx
    - cyberpedia-antiscam-tool/src/components/emergency/TodoRow.tsx
    - cyberpedia-antiscam-tool/src/components/emergency/TodoProgressBar.tsx
  modified:
    - cyberpedia-antiscam-tool/src/components/emergency/TodoChecklist.tsx
decisions:
  - scopeLabel kept private (not exported) in TodoRow.tsx to satisfy react-refresh/only-export-components ESLint rule
  - TodoProgressBar name chosen over ProgressBar to avoid future shadowing
metrics:
  duration: 15min
  completed_date: "2026-03-16"
  tasks: 2
  files: 4
---

# Phase 02 Plan 01: TodoChecklist Sub-component Extraction Summary

**One-liner:** Extracted SevereActionBanner, TodoRow, and TodoProgressBar from TodoChecklist.tsx into dedicated files using verbatim copy with zero logic changes.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Extract SevereActionBanner, TodoRow, TodoProgressBar | d53be4f | SevereActionBanner.tsx, TodoRow.tsx, TodoProgressBar.tsx |
| 2 | Update TodoChecklist.tsx to import sub-components | 4caf641 | TodoChecklist.tsx |

## Outcome

- `SevereActionBanner.tsx`: 86 lines — amber warning banner with bank call and number copy CTAs
- `TodoRow.tsx`: 79 lines — single checklist row with scope badge; `scopeLabel` kept private
- `TodoProgressBar.tsx`: 46 lines — animated fill bar, renamed from the inline `ProgressBar`
- `TodoChecklist.tsx`: 309 lines (reduced from 498) — now imports all three sub-components

All verification commands pass:
- `npm run build`: 0 TypeScript errors
- `npm run lint`: 0 ESLint warnings

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] scopeLabel export removed to fix react-refresh ESLint error**
- **Found during:** Task 1
- **Issue:** Exporting a non-component function (`scopeLabel`) alongside `TodoRow` from the same file violated the `react-refresh/only-export-components` rule.
- **Fix:** Removed `export` keyword from `scopeLabel` in TodoRow.tsx. Since TodoChecklist.tsx never called `scopeLabel` directly (it only called `TodoRow`), this was purely internal.
- **Files modified:** `TodoRow.tsx`
- **Commit:** d53be4f

### Line Count Deviation

**TodoChecklist.tsx is 309 lines, not the planned ~175L target.**

The plan's ~175L estimate was incorrect. The main `TodoChecklist` component function itself contains ~253 lines of JSX (tab bar, incident toggle, progress bars, sort logic, map iterations). After removing the 3 inline sub-components (~189 lines), the file went from 498 to 309 lines — a reduction of 189 lines exactly consistent with the extracted content.

The plan's acceptance criterion of "under 200 lines" cannot be achieved without further splitting the main component's JSX logic (which would be an architectural decision beyond the scope of this structural extraction plan). The three extracted sub-components are all well under 200 lines, and the primary goal (modular extraction) is complete.

## Decisions Made

- `scopeLabel` is a private helper, not a public API — keeping it unexported is the correct design
- No barrel `index.ts` created (per plan rules — project convention is direct named imports)

## Self-Check

Files exist:
- SevereActionBanner.tsx: FOUND
- TodoRow.tsx: FOUND
- TodoProgressBar.tsx: FOUND
- TodoChecklist.tsx (modified): FOUND

Commits exist:
- d53be4f: FOUND
- 4caf641: FOUND
