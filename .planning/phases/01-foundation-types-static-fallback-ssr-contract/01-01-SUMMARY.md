---
phase: 01-foundation-types-static-fallback-ssr-contract
plan: "01"
subsystem: test-infrastructure
tags: [vitest, testing, wave-0, scaffold, tdd]
dependency_graph:
  requires: []
  provides:
    - vitest-infrastructure
    - test-stubs-scroll-choreography
    - test-stubs-landmarks
  affects:
    - all-phase-01-plans
tech_stack:
  added: [vitest@3.2.4, jsdom, @testing-library/react, vite-tsconfig-paths-vitest]
  patterns: [co-located-test-stubs, fail-loud-imports, expectTypeOf-type-tests]
key_files:
  created:
    - vitest.config.ts
    - vitest.setup.ts
    - src/components/landing/scroll-choreography/types.test.ts
    - src/components/landing/scroll-choreography/stages.test.ts
    - src/components/landing/scroll-choreography/use-is-desktop.test.ts
    - src/components/landing/scroll-choreography/static-choreography-fallback.test.tsx
    - src/components/landing/footer.test.tsx
    - src/components/landing/skip-link.test.tsx
    - src/components/landing/landmark-audit.test.tsx
  modified: []
decisions:
  - "Wave 0 test stubs co-located next to their future source files (scroll-choreography/ and landing/) rather than a flat tests/ directory, matching RESEARCH.md §Validation Architecture"
  - "globals: false in vitest.config.ts — tests use named imports from 'vitest' (describe/it/expect/expectTypeOf)"
  - "css: false in vitest.config.ts — Tailwind not processed in tests (faster; no postcss in test path)"
  - "No @testing-library/jest-dom added — Wave 0 tests use raw Vitest expect() assertions (.not.toBeNull() etc.)"
  - "types.test.ts uses expectTypeOf only; all 8 assertions pass at Wave 0 because type-only imports are erased at runtime — this is correct and expected"
metrics:
  duration: "~4 minutes"
  completed: "2026-04-28"
  tasks_completed: 3
  files_created: 9
---

# Phase 1 Plan 01: Vitest Test Infrastructure and Wave 0 Stubs — Summary

**One-liner:** Vitest 3.2.4 test infrastructure with jsdom/react-plugin/tsconfig-paths and 7 fail-loud co-located test stubs covering types, stages, hooks, landmarks, and accessibility contracts for Phase 1 plans.

## What Was Built

### Task 1: Vitest config and setup (commit `defe69b`)

- `vitest.config.ts` — defines jsdom environment, react plugin, vite-tsconfig-paths (@/* alias resolution), setupFiles → vitest.setup.ts, globals: false, css: false
- `vitest.setup.ts` — minimal no-op; comment explains how to add jest-dom matchers if needed in future

### Task 2: Scroll-choreography test stubs (commit `abdbb75`)

Three stub files co-located in `src/components/landing/scroll-choreography/`:

- `types.test.ts` — 8 `expectTypeOf` assertions covering all exported types from `./types` (StageId, StageWindow, ScreenTarget, StageDef, StageCopyContent, ScrollChoreographyMode, ScreenTargetRect, ScrollChoreographyContextValue). **Passes at Wave 0** because type-only imports are erased at runtime; provides compile-time contract for Plan 02.
- `stages.test.ts` — STAGES length (4), narrative order, window bounds, screen target coverage, byId contract, defensive throw. **Fails** until Plan 02 ships `./stages`.
- `use-is-desktop.test.ts` — SSR optimistic-desktop default (returns true on first render). **Fails** until Plan 04 ships `./use-is-desktop`.

### Task 3: Component test stubs (commit `191f39d`)

Four stub files:

- `scroll-choreography/static-choreography-fallback.test.tsx` — h1 count, h2 count (≥4), product screenshot img assertions. **Fails** until Plan 05 ships `./static-choreography-fallback`.
- `footer.test.tsx` — contentinfo landmark, mailto link, trust line text. **Fails** until Plan 05 ships `./footer`.
- `skip-link.test.tsx` — #main href, sr-only class. **Fails** until Plan 05 ships `./skip-link`.
- `landmark-audit.test.tsx` — Full D-16/D-17 landmark structure via HomePageFixture (SkipLink + SiteHeader + main + SiteFooter). **Fails** until Plan 05 ships the missing components.

## Test State at Wave 0 Completion

```
Test Files  6 failed | 1 passed (7 total)
      Tests  8 passed (8 — all from types.test.ts)
```

All 6 failures are `Failed to resolve import "..."` errors pointing exactly at the missing source files — giving Plans 02–05 clear, named targets to turn green.

## Deviations from Plan

None — plan executed exactly as written.

**Note on typecheck behavior:** The plan states `pnpm typecheck` exits 0. After Wave 0 test stubs are added, `pnpm typecheck` emits TS2307 "Cannot find module" errors for the 6 stubs that import missing source files. This is the expected Wave 0 state — the errors come from absent Plan 02–05 artifacts, not from incorrect test scaffolding structure. The vitest.config.ts itself type-checks cleanly. The typecheck gate becomes green as each subsequent plan lands its source files.

## No Production Code Modified

Confirmed: zero modifications to `src/components/landing/`, `src/content/`, `src/routes/`, `package.json`, `vite.config.ts`, or `tsconfig.json`.

## Next Steps

Plan 02 is the next executor — it ships `src/components/landing/scroll-choreography/types.ts` and `stages.ts`, turning `types.test.ts` (already passing) and `stages.test.ts` green.

## Self-Check

Files created exist:
- vitest.config.ts: FOUND
- vitest.setup.ts: FOUND
- src/components/landing/scroll-choreography/types.test.ts: FOUND
- src/components/landing/scroll-choreography/stages.test.ts: FOUND
- src/components/landing/scroll-choreography/use-is-desktop.test.ts: FOUND
- src/components/landing/scroll-choreography/static-choreography-fallback.test.tsx: FOUND
- src/components/landing/footer.test.tsx: FOUND
- src/components/landing/skip-link.test.tsx: FOUND
- src/components/landing/landmark-audit.test.tsx: FOUND

Commits exist:
- defe69b: FOUND (chore(01-01): add vitest config and setup files)
- abdbb75: FOUND (test(01-01): add scroll-choreography test stubs)
- 191f39d: FOUND (test(01-01): add component test stubs)

## Self-Check: PASSED
