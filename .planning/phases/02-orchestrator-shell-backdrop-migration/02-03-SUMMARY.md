---
phase: 02-orchestrator-shell-backdrop-migration
plan: 03
subsystem: ui
tags: [react, motion, scroll-choreography, product-screen, choreo-01, migrate-02, migrate-03, perf-04]

# Dependency graph
requires:
  - phase: 02-orchestrator-shell-backdrop-migration
    provides: Wave-0 fail-loudly stubs (product-screen.test.tsx, migrate-03-keyframe-binding.test.ts, migrate-perf-04.test.ts), STAGES + byId helper, ScrollChoreographyContext + useScrollChoreography hook, TEACHER_WORKSPACE_APP_URL constant
provides:
  - ProductScreen Phase-2 stub (browser-frame chrome + product-UI screenshot inside an absolute-inset overlay)
  - Stage-aligned screenScale + screenOpacity via useTransform (no React state for visual props)
  - The canonical never-unmounts shared motion.div (CHOREO-01) — Phase 4 mounts it inside the orchestrator
  - product-screen slice of MIGRATE-03 / PERF-04 AST gates flipped GREEN
affects: [phase-02-04 orchestrator wire-up, phase-03 docking transforms, phase-03 screen-targets runtime, phase-05 paper-hero deletion]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Pure presentational subscriber: useScrollChoreography() -> useTransform -> style (D-05)"
    - "Endpoint-only MIGRATE-03 keyframe binding via byId('wow').window[N] (D-12)"
    - "Intra-stage timing as named local consts (D-13)"
    - "Never-unmounts shared element with NO layout-id attribute (CHOREO-01)"
    - "useState -> useTransform migration for scroll-driven opacity (MIGRATE-02 / CHOREO-06)"

key-files:
  created:
    - src/components/landing/scroll-choreography/product-screen.tsx
  modified: []

key-decisions:
  - "ProductScreen subscribes to scrollYProgress via useScrollChoreography() — same pattern as PaperBackdrop will use (D-05)."
  - "Outer wrapper became a motion.div (paper-hero.tsx had a plain div) so its style.opacity can take a MotionValue directly (replaces useState pattern)."
  - "screenScale keyframes: [0, byId('wow').window[0], byId('wow').window[1], 1] — D-12 endpoint-aligned with 0/1 sentinels for scroll-progress bounds."
  - "screenScale outputs use named local consts SCREEN_SCALE_HERO / SCREEN_SCALE_WOW_PEAK / SCREEN_SCALE_OVERSHOOT (D-13 intra-stage tuning, not a stage window)."
  - "screenOpacity keyframes: [byId('wow').window[0], byId('wow').window[1]] -> [0, 1] — pure stage-aligned ramp, no intra-stage const needed."
  - "pointer-events disabled always-on per RESEARCH.md OQ-3 (Phase-2 stub is decorative; the live app at TEACHER_WORKSPACE_APP_URL is the conversion target)."
  - "aria-hidden retained on the outer wrapper as in paper-hero.tsx:198 — Phase 3 / A11Y-05 will revisit when the screen becomes interactive."

patterns-established:
  - "Per-component named local consts for intra-stage timing (D-13) — first concrete consumer of the pattern after Phase 1."
  - "MotionValue<number> directly into style={{ opacity }} on a motion.div (no plain div with computed number)."
  - "AST static-analysis tests gate semantic intent; per-file grep counts are heuristic only."

requirements-completed:
  - CHOREO-01
  - CHOREO-06
  - MIGRATE-02
  - MIGRATE-03
  - PERF-04

# Metrics
duration: 4min
completed: 2026-04-29
---

# Phase 2 Plan 03: Extract ProductScreen Phase-2 Stub Summary

**Ports the screen-overlay JSX from paper-hero.tsx:196-220 into a new `ProductScreen` shared element that owns `screenScale` + `screenOpacity` as scroll-derived motion values bound to `byId('wow').window[N]`, with no layout-id attribute, no React state for visual props, and zero docking transforms (Phase 3 territory).**

## Performance

- **Duration:** ~4 min (executor wall time including dependency install)
- **Started:** 2026-04-29T03:43:50Z
- **Completed:** 2026-04-29T03:47:44Z
- **Tasks:** 1 (TDD: RED already in place from Plan 01, this plan's commit ships the GREEN implementation)
- **Files created:** 1
- **Files modified:** 0

## Accomplishments

- New `src/components/landing/scroll-choreography/product-screen.tsx` (99 lines) — exports `ProductScreen()`.
- The morphing motion.div maintains identity stability across simulated scroll updates (CHOREO-01 contract verified by Test 1 — `expect(currentNode).toBe(initialNode)` after 5 scrollYProgress updates).
- `screenOpacity` migrated from `useState` (paper-hero.tsx:65) to `useTransform` flowing direct into `style={{ opacity }}` (MIGRATE-02 / CHOREO-06).
- Both `useTransform` keyframe arrays bind to `byId('wow').window[0]` / `[1]` for stage-aligned endpoints (MIGRATE-03 / D-12).
- Phase-2 stub scope honored: hero -> wow ramp only; zero docking transforms; zero `feature-a` / `feature-b` markers (D-09).
- `paper-hero.tsx` UNCHANGED (Phase 5 owns its deletion; verified by `git status`).
- `product-screen.test.tsx` flips RED -> GREEN: all 4 tests pass (mount-stability, useTransform shape, Phase-2 stage scope, no-layoutId).
- `migrate-03-keyframe-binding.test.ts` product-screen slice: GREEN. `migrate-perf-04.test.ts` product-screen slice: GREEN.
- Typecheck: zero errors related to product-screen.tsx (the only remaining TS error is in paper-backdrop.test.tsx, owned by concurrent Plan 02).

## Task Commits

1. **Task 1: Create product-screen.tsx — browser-frame chrome + product-UI screenshot, with useTransform-driven screenScale + screenOpacity (hero->wow only)** — `fd8cd01` (feat)

_TDD note:_ The RED test (`product-screen.test.tsx`) was committed in Plan 01 (Wave 0 fail-loudly stubs). This plan ships the GREEN implementation as a single `feat(...)` commit, since the test file already exists in the worktree base.

## Files Created/Modified

- `src/components/landing/scroll-choreography/product-screen.tsx` (NEW, 99 lines) — Phase-2 stub of the shared morphing product screen. Exports `ProductScreen()`. Subscribes to scrollYProgress via `useScrollChoreography()`. Renders an absolute `inset-0 z-20` overlay containing a browser-frame chrome (3 traffic-light dots + URL strip showing `TEACHER_WORKSPACE_APP_URL.replace("https://", "")`) and the `/hero/profiles-screen.png` screenshot. Two `useTransform` calls: `screenScale` (4 keyframes including 0/1 sentinels and stage-aligned endpoints, with named local-const outputs) and `screenOpacity` (2 stage-aligned endpoints, [0,1] outputs). No layout-id attribute. No React state. No `useMotionValueEvent`. No `clamp01` helper.

## Decisions Made

- **Outer wrapper as `motion.div` (vs plain `div` in paper-hero.tsx:198):** required because `style.opacity` now takes a MotionValue<number> directly. paper-hero.tsx's plain div worked because its `screenOpacity` was a plain number from useState; ours is a MotionValue.
- **Docstring rephrased** to avoid token-level mentions of forbidden patterns (`useState`, `useMotionValueEvent`, `layoutId`, `clamp01`, `docked`) so per-token grep heuristics see them only in code (not in docs). Semantic content preserved 1:1 with the plan's prescribed docstring; the AST tests (`migrate-03-keyframe-binding.test.ts`, `migrate-perf-04.test.ts`) remain the authoritative gate on intent. See **Deviations** for the one grep-count tension that could not be eliminated without weakening the imports.
- **No checkpoints needed.** Single auto task with deterministic verification (test, typecheck, grep gates). All four `product-screen.test.tsx` assertions pass on first run after the implementation.

## Deviations from Plan

### Auto-fixed issues

**1. [Rule 1 - Acceptance-criteria self-conflict] Docstring rephrased to satisfy token-grep counts**

- **Found during:** Task 1 final acceptance-criteria gate.
- **Issue:** The plan's `<action>` block prescribes a docstring containing the literal tokens `useState`, `useMotionValueEvent`, `layoutId`, `clamp01`, and `docked`, while the `<acceptance_criteria>` block requires `grep -c <token> ... returns 0` for each of these. The two prescriptions are mutually exclusive when applied verbatim because grep is unaware of comment/code context.
- **Fix:** Kept all five forbidden tokens out of the file body by rephrasing the docstring with semantically-equivalent paraphrases ("React state updated by an imperative event handler" instead of "useState ... useMotionValueEvent"; "shared-element layout-id attribute" instead of "layoutId"; "manual clamp" instead of "clamp01"; "dock-left and dock-right end positions" instead of "docked-left, docked-right"). Semantic intent is preserved 1:1; the AST tests (`migrate-03-keyframe-binding.test.ts`, `migrate-perf-04.test.ts`) remain the authoritative gate on the actual code shape and both pass for product-screen.tsx.
- **Files modified:** `src/components/landing/scroll-choreography/product-screen.tsx` (docstring only — code body matches the plan verbatim).
- **Verification:** All five forbidden-token grep counts return 0; all 4 `product-screen.test.tsx` tests pass; both AST tests pass for the product-screen.tsx slice.
- **Committed in:** fd8cd01 (Task 1 commit).

**2. [Rule 1 - Acceptance-criteria self-conflict] `useTransform` grep count is 3, not 2**

- **Found during:** Task 1 final acceptance-criteria gate.
- **Issue:** The plan's `<acceptance_criteria>` says `grep -c "useTransform" ... returns 2` (one for screenScale, one for screenOpacity), but the plan's prescribed `<action>` imports include `import { motion, useTransform } from "motion/react"`. The import itself is a third occurrence on line 30. There is no way to satisfy both without removing the import (which would break the file).
- **Fix:** Accepted the count of 3 (1 import + 2 `useTransform` *calls*). The semantic intent — exactly two `useTransform` invocations, one per scroll-derived motion value — is fully verified by the AST `migrate-03-keyframe-binding.test.ts` walk over `CallExpression`s with `callee.name === "useTransform"`, which passes for product-screen.tsx.
- **Files modified:** None (no fix possible without semantic regression).
- **Verification:** Two `useTransform(...)` call sites at lines 54 and 67; AST test passes; `pnpm test --run product-screen.test.tsx` passes (4/4).
- **Committed in:** fd8cd01 (Task 1 commit).

---

**Total deviations:** 2 auto-fixed (both Rule 1 — internal acceptance-criteria self-conflicts in the plan).
**Impact on plan:** Zero. Semantic intent of all acceptance criteria is fully met; only the grep-count *heuristics* were adjusted. The AST tests (which are the ground-truth semantic gate on MIGRATE-03 / PERF-04 / CHOREO-01) all pass for product-screen.tsx.

## Issues Encountered

- `node_modules` not present in the fresh worktree on first `pnpm test` invocation. Resolved by running `pnpm install --prefer-offline` (took ~3s using the existing pnpm store). Standard worktree bootstrap; not a code defect.

## Test Outcomes — `product-screen.test.tsx` (4/4 GREEN)

| # | Description | Verifies | Outcome |
|---|---|---|---|
| 1 | The morphing element instance is the same node across 5 scroll updates | CHOREO-01 (mount-stability) / D-21 | PASS |
| 2 | Renders inline style carrying motion-value-driven opacity and scale transform | MIGRATE-02 / CHOREO-06 / D-10 | PASS |
| 3 | Renders the product screenshot and does not yet emit feature-a/feature-b stage markers | D-09 (Phase-2 stub scope) | PASS |
| 4 | Contains no layoutId attribute on any rendered element | CHOREO-01 (no layoutId) | PASS |

## Test Outcomes — AST gates

- `migrate-03-keyframe-binding.test.ts` (D-12 / D-13): `product-screen.tsx — every useTransform keyframe entry is a STAGES ref, named const, or 0/1` -> PASS.
- `migrate-perf-04.test.ts` (PERF-04): `product-screen.tsx — does not animate forbidden CSS properties via motion values` -> PASS.
- `paper-backdrop.tsx` and `scroll-choreography.tsx` slices of these AST tests remain RED — owned by concurrent Plan 02 and downstream Plan 04 respectively. Not this plan's scope.

## Mount Stability (CHOREO-01) — explicit confirmation

`product-screen.test.tsx` Test 1 grabs the `parentElement` of `img[src='/hero/profiles-screen.png']` after `render()`, then drives the mocked `scrollYProgress.set(...)` through values `[0.1, 0.3, 0.5, 0.7, 0.95]`, then re-queries the same DOM node. Assertion `expect(currentNode).toBe(initialNode)` is reference-equality (strict `===` via `Object.is`), so the test would fail if React unmounted/remounted the morphing element for any reason. The test passes -> the Phase-2 contract holds: ProductScreen's morphing motion.div has stable identity across scroll updates without using `layoutId`.

## paper-hero.tsx — UNCHANGED confirmation

`git diff --stat src/components/landing/paper-hero.tsx` against the worktree base returned empty output. paper-hero.tsx was read for reference only; Phase 5's `MIGRATE-05` task owns its deletion. The screen overlay at paper-hero.tsx:196-220 remains in place to back the `<PaperHero />` render still consumed by `static-choreography-fallback.tsx` (Phase 1 D-03 / Phase 2 D-03 carry-forward).

## Requirements Traceability

| Requirement | How satisfied |
|---|---|
| **CHOREO-01** | Single `motion.div` carrying the product-UI screenshot; never unmounts (verified by Test 1 mount-counter); zero `layoutId` attribute (verified by Test 4). |
| **CHOREO-06** | Visual props (`opacity`, `scale`) flow through `useTransform`-derived MotionValues directly into `style`. Zero `useState` calls; zero `useMotionValueEvent`. |
| **MIGRATE-02** | `screenOpacity` migrated from `useState` (paper-hero.tsx:65) + `useMotionValueEvent` (paper-hero.tsx:70) to a single `useTransform` call consumed via `style={{ opacity: screenOpacity }}`. |
| **MIGRATE-03** | Both `useTransform` calls bind keyframe endpoints to `byId("wow").window[0]` and `byId("wow").window[1]` (D-12). The four scale outputs are named local consts (D-13). Zero anonymous numeric tuples — verified by `migrate-03-keyframe-binding.test.ts` AST walk. |
| **PERF-04** | Only `opacity` and `scale` (= transform) are bound to motion values. No `width`, `height`, `top`, `left`, or `boxShadow` motion-value bindings — verified by `migrate-perf-04.test.ts` AST walk. |

## Threat Flags

None — file introduces no new network endpoints, auth surface, file access, or schema. The only string transform (`TEACHER_WORKSPACE_APP_URL.replace("https://", "")`) is rendered as React text content (not innerHTML) and the URL is the public live-app conversion target per CLAUDE.md. Threat register T-02-03-01 / T-02-03-02 / T-02-03-03 from the plan are unchanged in disposition.

## Next Phase Readiness

- ProductScreen is ready for Plan 04's orchestrator wire-up (`<ScrollChoreography>` will mount `<PaperBackdrop />` and `<ProductScreen />` as siblings inside the sticky container).
- Plan 02's PaperBackdrop and this plan's ProductScreen run in parallel; on Plan 02's merge the AST-test slices for `paper-backdrop.tsx` will also flip GREEN, leaving `scroll-choreography.tsx` as the only Wave-0 RED in those files (filled in Plan 04).
- No SCREEN_TARGETS runtime promotion (D-11): the type alias in `stages.ts` is unchanged; Phase 3 owns its runtime values once the docking transforms are designed against the actual screen render.

## Self-Check: PASSED

- `src/components/landing/scroll-choreography/product-screen.tsx` exists (99 lines).
- Commit `fd8cd01` exists in `git log --oneline` of this worktree branch.
- `paper-hero.tsx` is UNCHANGED (`git status --short` shows only the new product-screen.tsx).
- All 4 `product-screen.test.tsx` tests pass.
- `migrate-03-keyframe-binding.test.ts` product-screen slice: GREEN.
- `migrate-perf-04.test.ts` product-screen slice: GREEN.
- Typecheck: no errors in product-screen.tsx.

---
*Phase: 02-orchestrator-shell-backdrop-migration*
*Plan: 03 — Extract ProductScreen Phase-2 stub*
*Completed: 2026-04-29*
