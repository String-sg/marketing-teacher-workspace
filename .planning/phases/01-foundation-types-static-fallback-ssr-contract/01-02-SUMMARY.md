---
phase: 01-foundation-types-static-fallback-ssr-contract
plan: 02
subsystem: ui
tags: [typescript, motion, scroll-choreography, types, vitest]

# Dependency graph
requires:
  - phase: 01-01
    provides: "vitest config and test stubs (created locally as Rule 3 deviation since Wave 0 ran in parallel)"
provides:
  - "StageId, StageWindow, ScreenTarget, ScreenTargetRect, StageDef, StageCopyContent, ScrollChoreographyMode, ScrollChoreographyContextValue type module at scroll-choreography/types.ts"
  - "STAGES readonly StageDef[] (4 entries, hero/wow/feature-a/feature-b) + byId() helper + SCREEN_TARGETS type-only declaration at scroll-choreography/stages.ts"
affects: [01-03, 01-04, 01-05, phase-02, phase-03, phase-04]

# Tech tracking
tech-stack:
  added: [vitest/config, vite-tsconfig-paths (test), @vitejs/plugin-react (test)]
  patterns:
    - "verbatimModuleSyntax import type discipline for all type-only imports"
    - "as const satisfies readonly StageDef[] for compile-time exhaustive readonly array"
    - "declare const for type-only Phase 1 contract that Phase 3 fills at runtime"
    - "Discriminated union by id with exact-tuple bullet enforcement (D-07)"

key-files:
  created:
    - src/components/landing/scroll-choreography/types.ts
    - src/components/landing/scroll-choreography/stages.ts
    - src/components/landing/scroll-choreography/types.test.ts
    - src/components/landing/scroll-choreography/stages.test.ts
    - vitest.config.ts
    - vitest.setup.ts
  modified: []

key-decisions:
  - "STAGES ships as readonly StageDef[] + byId() helper (OQ-1 Option B) — iteration-first API, single source of order truth"
  - "SCREEN_TARGETS is declare const in Phase 1 — zero runtime export; Phase 3 fills values after ProductScreen can be visually verified"
  - "StageCopyContent discriminated union by id enforces exact-3-bullets tuple at compile time (D-07)"
  - "Overlapping windows [0,0.25]/[0.2,0.55]/[0.5,0.78]/[0.75,1.0] are first-pass and intentional per D-12 (cross-fade design)"

patterns-established:
  - "Type module pattern: pure types.ts with import type only, no runtime values"
  - "Data module pattern: stages.ts exports const + function, no React imports"
  - "Test stub pattern: types.test.ts uses expectTypeOf for compile-time type assertions"

requirements-completed: [FOUND-01, FOUND-02]

# Metrics
duration: 15min
completed: 2026-04-28
---

# Phase 01 Plan 02: Types and Stages Data Module Summary

**Typed choreography data model — 8 types in types.ts + STAGES/byId/SCREEN_TARGETS in stages.ts — zero runtime UI, ready for Plans 03/04 consumption**

## Performance

- **Duration:** ~15 min
- **Started:** 2026-04-28T14:55:00Z
- **Completed:** 2026-04-28T15:10:00Z
- **Tasks:** 2
- **Files modified:** 6 (2 source + 2 test stubs + 2 vitest config)

## Accomplishments

- 8 exported types in `types.ts`: StageId, StageWindow, ScreenTarget, ScreenTargetRect, StageDef, StageCopyContent (discriminated union with exact-3-bullets), ScrollChoreographyMode, ScrollChoreographyContextValue
- STAGES readonly array (4 entries, ordered hero/wow/feature-a/feature-b) + byId() helper (throws on unknown) + SCREEN_TARGETS type-only declaration
- Both Wave 0 test stubs (types.test.ts: 8 assertions, stages.test.ts: 5 assertions) pass; `pnpm typecheck` exits 0; `pnpm build` exits 0

## First-pass STAGES Window Values

These are the contract surface for Phase 2/3 tuning (per D-12 — not magic constants):

| Stage | Window | Screen Target |
|-------|--------|---------------|
| hero | [0.0, 0.25] | tiny |
| wow | [0.2, 0.55] | centered |
| feature-a | [0.5, 0.78] | docked-left |
| feature-b | [0.75, 1.0] | docked-right |

Overlap between hero/wow (0.2–0.25) and feature-a/feature-b (0.75–0.78) is intentional for cross-fading neighbors.

## pnpm build Outcome

`pnpm build` exits 0 — confirms `declare const SCREEN_TARGETS` is fully stripped by the bundler and does not produce a runtime `undefined` export that would break tree-shaking.

## Task Commits

Each task was committed atomically:

1. **Task 1: Create types.ts** - `8bf32fc` (feat) — types module + vitest config bootstrap
2. **Task 2: Create stages.ts** - `075d5d2` (feat) — stages data module + stages test stub

## Files Created/Modified

- `src/components/landing/scroll-choreography/types.ts` — 8 exported types, MotionValue import type, all fields readonly, discriminated union StageCopyContent
- `src/components/landing/scroll-choreography/stages.ts` — STAGES as const satisfies, byId helper, SCREEN_TARGETS declare const
- `src/components/landing/scroll-choreography/types.test.ts` — 8 expectTypeOf assertions covering all exported types
- `src/components/landing/scroll-choreography/stages.test.ts` — 5 runtime assertions covering STAGES order, window bounds, screen targets, byId behavior
- `vitest.config.ts` — jsdom env, vite-tsconfig-paths, @vitejs/plugin-react, globals: false
- `vitest.setup.ts` — minimal no-op setup file

## Decisions Made

- STAGES is `readonly StageDef[]` + `byId()` (OQ-1 Option B): iteration-first, single source of order truth, no risk of STAGE_ORDER/STAGES drift
- `declare const SCREEN_TARGETS` deferred to Phase 3: values require visual verification against the actual ProductScreen render
- Overlapping scroll windows are by design (D-12): hero/wow overlap at 0.2–0.25 enables cross-fade; Phase 2/3 will tune

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Created vitest.config.ts and vitest.setup.ts locally**
- **Found during:** Task 1 pre-verification
- **Issue:** Plan 01 (Wave 0, parallel worktree) creates vitest infrastructure but had not yet committed when Plan 02 began execution. The worktree was reset to 4a163e8 which predates Wave 0. Without vitest.config.ts, `pnpm test` fails with "vitest: command not found".
- **Fix:** Created vitest.config.ts and vitest.setup.ts matching the exact content prescribed by Plan 01's action block. Wave 0 content was confirmed by reading the other worktree's already-created files.
- **Files modified:** vitest.config.ts, vitest.setup.ts
- **Verification:** `pnpm typecheck` passes; `pnpm test` runs
- **Committed in:** 8bf32fc (Task 1 commit)

**2. [Rule 3 - Blocking] Created types.test.ts and stages.test.ts locally**
- **Found during:** Task 1 and Task 2 pre-verification
- **Issue:** Same parallel-wave issue — Wave 0 test stubs were not yet available in this worktree.
- **Fix:** Created types.test.ts and stages.test.ts matching the exact content from Plan 01's action block.
- **Files modified:** types.test.ts, stages.test.ts
- **Verification:** Both stubs pass (8 + 5 assertions)
- **Committed in:** 8bf32fc (types.test.ts), 075d5d2 (stages.test.ts)

---

**Total deviations:** 2 auto-fixed (both Rule 3 — blocking, same root cause: parallel Wave 0 not yet merged)
**Impact on plan:** Both fixes are identical to what Wave 0 will produce. No divergence from plan spec. When the orchestrator merges Wave 0 and Wave 1, git will see clean identical content — no conflicts.

## Issues Encountered

- types.test.ts uses `import type { ... }` which means the test "passes" even without types.ts due to type erasure at runtime. The real RED gate is `pnpm typecheck` which correctly emits TS2307 "Cannot find module './types'" until types.ts is created. This is correct behavior for a pure-type test file.

## Next Phase Readiness

- **Plan 03 (content reshape):** Can now `import type { StageCopyContent, StageId } from "@/components/landing/scroll-choreography/types"` to reshape `src/content/landing.ts`
- **Plan 04 (component migrations):** Can consume `STAGES` + `byId` from `stages.ts` for PaperHero data swap and FeatureSection content lookup
- **Phase 3:** SCREEN_TARGETS type contract in place — Phase 3 fills `Record<ScreenTarget, ScreenTargetRect>` values after ProductScreen is visually verified

---
*Phase: 01-foundation-types-static-fallback-ssr-contract*
*Completed: 2026-04-28*
