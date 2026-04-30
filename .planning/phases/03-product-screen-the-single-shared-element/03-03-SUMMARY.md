---
phase: 03-product-screen-the-single-shared-element
plan: 03
subsystem: ui
tags: [scroll-choreography, motion, stages, screen-targets, react-19, motion-12, typescript]

# Dependency graph
requires:
  - phase: 01-foundation-types-static-fallback-ssr-contract
    provides: ScreenTarget enum, ScreenTargetRect type, StageDef shape (D-11), ScreenTargetsMap type-only placeholder
  - phase: 02-orchestrator-shell-backdrop-migration
    provides: STAGES first-pass overlapping windows, byId() helper, MIGRATE-03 endpoint-only keyframe binding contract (D-12), VIDEO_GATE_THRESHOLD = byId("wow").window[1] auto-tracking pattern (D-15/D-21)
provides:
  - "STAGES retuned to D-02 monotonic non-overlapping windows: hero[0,0.10] / wow[0.20,0.55] / fA[0.65,0.78] / fB[0.85,1.0]"
  - "SCREEN_TARGETS runtime const (Record<ScreenTarget, ScreenTargetRect>) — replaces Phase 1 type-alias placeholder"
  - "Locked dock geometry: tiny(0.55, 0, opacity 0) / centered(1.00, 0, opacity 1) / docked-left(0.5, -28vw, opacity 1) / docked-right(0.5, +28vw, opacity 1)"
  - "Test invariant: monotonic non-overlapping windows asserted across adjacent STAGES pairs"
affects:
  - phase 03-product-screen — Plan 02 (<ProductScreen> 4-stage data-driven morph) imports SCREEN_TARGETS + retuned STAGES
  - phase 03-product-screen — Plan 04 (PaperBackdrop intra-stage retune) reads byId("wow").window[1]=0.55 via VIDEO_GATE_THRESHOLD auto-tracking (D-21)
  - phase 04-content-copy-bullets — bullet stagger budget depends on docked-stage 13–15% windows
  - phase 06-audit — LCP/Lighthouse measurements interpret the retuned 400lvh section relative to the new windows

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Runtime as-const Record map for typed enum→data lookup (SCREEN_TARGETS pattern)"
    - "Retune-by-data: changing STAGES windows + a one-source-of-truth map auto-cascades to all downstream useTransform consumers via byId()"

key-files:
  created: []
  modified:
    - src/components/landing/scroll-choreography/stages.ts
    - src/components/landing/scroll-choreography/stages.test.ts

key-decisions:
  - "D-02 wow-emphasis 35% plateau (0.20→0.55) committed as the centerpiece reveal"
  - "D-04/D-08 SCREEN_TARGETS as runtime const (not type alias); single source of truth for <ProductScreen> consumption"
  - "Phase 1 ScreenTargetsMap type alias removed entirely — no consumer wired up; D-11 anticipated this swap"

patterns-established:
  - "Pattern: monotonic non-overlapping STAGES windows with explicit hold + morph zones; tested via adjacent-pair invariant"
  - "Pattern: SCREEN_TARGETS as Record<ScreenTarget, ScreenTargetRect> using `as const` — covers all 4 named keys, x values are CSS strings (vw units), opacity scalar 0/1"

requirements-completed: [CHOREO-03, CHOREO-04, CHOREO-05]

# Metrics
duration: ~5min
completed: 2026-04-30
---

# Phase 3 Plan 03: STAGES retune + runtime SCREEN_TARGETS const Summary

**Retuned the 4 choreography stages to D-02 monotonic non-overlapping windows and replaced the Phase 1 ScreenTargetsMap type-alias placeholder with the runtime SCREEN_TARGETS Record const that Plan 02's `<ProductScreen>` consumes for its 4-stage data-driven morph.**

## Performance

- **Duration:** ~5 min
- **Started:** 2026-04-30T05:36:51Z
- **Completed:** 2026-04-30T05:38:46Z
- **Tasks:** 2 (single combined commit per plan instruction)
- **Files modified:** 2

## Accomplishments
- STAGES windows retuned to D-02 schedule: hero[0,0.10], wow[0.20,0.55], feature-a[0.65,0.78], feature-b[0.85,1.0]
- SCREEN_TARGETS runtime const exported with all 4 ScreenTarget keys (tiny/centered/docked-left/docked-right) and exact D-08 values
- Phase 1 `export type ScreenTargetsMap` alias removed (no consumer was wired up)
- stages.test.ts grew from 6 → 14 tests: window endpoint matchers, monotonic non-overlapping invariant, SCREEN_TARGETS shape + each target's values + mirror-symmetry assertion
- All 55 choreography tests remain GREEN — the codebase honored MIGRATE-03 endpoint-only binding (D-12) better than the plan anticipated, so paper-backdrop and product-screen auto-tracked the retune via `byId(...).window[]`

## Task Commits

1. **Task 1+2: Retune STAGES + add SCREEN_TARGETS const + update tests** — `d2478e8` (feat)

(Plan instructed a single combined commit covering both source + test updates.)

**Plan metadata:** Pending (separate `docs(03-03)` commit follows after STATE/ROADMAP updates.)

## Files Created/Modified
- `src/components/landing/scroll-choreography/stages.ts` — Retuned STAGES window literals (4 entries) to D-02 schedule; replaced `export type ScreenTargetsMap` alias with `export const SCREEN_TARGETS: Record<ScreenTarget, ScreenTargetRect>` runtime const containing all 4 target rects per D-08; byId() unchanged
- `src/components/landing/scroll-choreography/stages.test.ts` — Imports SCREEN_TARGETS, replaces wow.window[1]=0.78 assertion with 0.55, adds monotonic non-overlapping invariant + exact endpoint matchers + new `SCREEN_TARGETS map (D-04 / D-08)` describe block (6 it-blocks covering all 4 keys, sign convention, mirror symmetry)

## Decisions Made
- Followed plan as specified — D-02 windows, D-08 SCREEN_TARGETS values, D-05 tiny.opacity=0, D-07 dock signs, all locked in CONTEXT.md prior to execution.
- Removed `export type ScreenTargetsMap` outright (rather than re-exporting as `typeof SCREEN_TARGETS`) — `grep -rn ScreenTargetsMap src/` confirmed zero non-self consumers; the type alias was a Phase 1 placeholder explicitly meant to be superseded by the runtime const per Phase 1 D-11 docstring.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Plan acceptance criterion bug] PLAN's grep check for absence of `0.78` in stages.test.ts is impossible to satisfy**
- **Found during:** Verification of Task 2 acceptance criteria
- **Issue:** Plan acceptance criterion in Task 2 reads:
  > File no longer asserts the OLD `0.78` Phase 2 value: `grep -c "0\.78" stages.test.ts | grep -q "^0$"` (must be 0 — only Phase 3 retune values appear)

  But `0.78` IS a Phase 3 retune value — feature-a's window is `[0.65, 0.78]` per D-02. The PLAN's own `<action>` block contains `expect(byId("feature-a").window).toEqual([0.65, 0.78])`. The grep check is internally inconsistent with the plan's own assertion list.
- **Fix:** Followed the plan's explicit `<action>` template (which correctly includes 0.78 in the feature-a assertion) over the inconsistent grep check. The new test correctly asserts feature-a.window[1]=0.78 (a Phase 3 D-02 value, not a Phase 2 leftover).
- **Files modified:** No code change — discrepancy is in the plan acceptance criterion, not the implementation.
- **Verification:** Final test contains `0.78` twice (in `[0.65, 0.78]` for feature-a window assertion and in the morph-zone documentation comment for `feature-a.window[1] < feature-b.window[0]`). The OLD Phase 2 value was `wow.window[1]=0.78`; that assertion is correctly replaced with 0.55.
- **Committed in:** d2478e8 (test code matches plan's `<action>` template verbatim)

---

**Total deviations:** 1 (plan acceptance-criterion inconsistency, no code change)
**Impact on plan:** None — implementation matches plan's explicit code template; only the secondary grep check was inconsistent. Recommend Plan 04+ tooling: synthesize grep checks from `<action>` template AST to avoid this drift.

## Issues Encountered

- **Plan predicted some choreography tests would go RED on the retune.** They did not. All 55 choreography tests are GREEN. This is because paper-backdrop.tsx and product-screen.tsx already honor MIGRATE-03 (D-12) endpoint-only binding via `byId(...).window[N]` rather than hardcoded numeric literals — so the source-level wow.window[1] retune from 0.78→0.55 auto-cascaded to those consumers. This is good news: Plans 02 and 04 may have less mistuning to fix than the planner anticipated. Plan 04 should still review intra-stage const magnitudes (`STAGE_OPACITY_FADE_*`, `STAGE_SCALE_*`) per D-20 to confirm visual feel, but no test breakage forces the issue.

## User Setup Required

None — pure data edit, no external service configuration.

## Next Phase Readiness

- Plan 02 (`<ProductScreen>` 4-stage data-driven rewrite) can now `import { STAGES, SCREEN_TARGETS } from "./stages"` — both exports resolve.
- Plan 04 (PaperBackdrop intra-stage const retune per D-20) can proceed; VIDEO_GATE_THRESHOLD now resolves to 0.55 automatically (D-21).
- Wave 1 dependency satisfied: subsequent waves depending on retuned STAGES values + SCREEN_TARGETS runtime const are unblocked.

## Self-Check: PASSED

Verified post-write:

- `[x]` `src/components/landing/scroll-choreography/stages.ts` exists and contains `export const SCREEN_TARGETS`
- `[x]` `src/components/landing/scroll-choreography/stages.test.ts` exists and contains 14 it-blocks across 2 describe blocks
- `[x]` Commit `d2478e8` exists in `git log`
- `[x]` `pnpm test stages.test.ts` exits 0 with 14/14 passing
- `[x]` `pnpm typecheck` exits 0
- `[x]` `pnpm test migrate-03-keyframe-binding.test.ts` exits 0 with 3/3 passing
- `[x]` `grep -c "export type ScreenTargetsMap" stages.ts` returns 0
- `[x]` All STAGES window grep acceptance checks return 1 match each (hero, wow, feature-a, feature-b)

---
*Phase: 03-product-screen-the-single-shared-element*
*Plan: 03 — STAGES retune + runtime SCREEN_TARGETS*
*Completed: 2026-04-30*
