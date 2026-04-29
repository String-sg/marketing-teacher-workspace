---
phase: 02-orchestrator-shell-backdrop-migration
plan: 02
subsystem: ui
tags: [react, motion-react, scroll-choreography, paper-backdrop, useTransform, useMotionValueEvent, video-gate]

# Dependency graph
requires:
  - phase: 01-foundation-types-static-fallback-ssr-contract
    provides: ScrollChoreographyContext + useScrollChoreography hook, STAGES + byId, ScrollChoreographyMode type, paper-backdrop.test.tsx Wave-0 stub, migrate-03 / migrate-perf-04 / rerender-budget AST gates
  - phase: 02-orchestrator-shell-backdrop-migration
    provides: 02-01 (Wave-0 RED tests + plan dependency contract — note this plan is itself in Phase 2 wave 1)
provides:
  - "<PaperBackdrop> context-subscribing presentational component (paper-card frame + 2 cloud parallax layers + scroll-linked hero <video> + CHOREO-08 video gate + loadedmetadata effect + children slot)"
  - "Canonical pattern for `useTransform` direct-into-style with named local timing constants and STAGES-bound endpoints (the analog Plans 03 & 04 follow)"
  - "Eliminates the useState-on-scroll re-render storm for the backdrop's three visual values (stageScale, stageOpacity, cloudY*)"
affects:
  - "02-03 (ProductScreen) — same context-subscribing API + endpoint-only keyframe binding pattern"
  - "02-04 (ScrollChoreography orchestrator) — must mount PaperBackdrop inside its sticky container and pass the hero copy block as children (D-06)"
  - "Phase 4 StageCopy — same 'pure presentational subscriber' pattern; will replace the inline children block once it exists"
  - "Phase 5 paper-hero.tsx deletion — PaperBackdrop is the replacement for paper-hero.tsx:112-194 + 85-95"

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Pure presentational subscriber: consumes scrollYProgress via useScrollChoreography(); calls own useTransform; returns motion.div tree"
    - "Endpoint-only MIGRATE-03 binding: stage-aligned keyframes use byId('wow').window[1]; intra-stage timing uses named local consts (D-13)"
    - "Imperative DOM side effects via useMotionValueEvent — exception to CHOREO-06's useState ban (video.currentTime / video.pause() are not visual props)"

key-files:
  created:
    - "src/components/landing/scroll-choreography/paper-backdrop.tsx (166 lines)"
  modified: []

key-decisions:
  - "Used a dedicated STAGE_OPACITY_FADE_END=0.78 named const (not VIDEO_GATE_THRESHOLD) for the stageOpacity fade endpoint, preserving paper-hero.tsx:69's monotonic [0.6, 0.78] fade range. Reusing VIDEO_GATE_THRESHOLD as written in the plan would have produced a non-monotonic [0.6, 0.55] keyframe array because stages.ts still has wow.window=[0.2, 0.55] (the D-14 retune to [0.20, 0.78] is a separate-plan concern). See Deviations below."
  - "Kept transformOrigin: '50% 92%' inline as a static string (not a magic-number keyframe — it's a visual-design tuning value per CONTEXT.md § Specifics, outside MIGRATE-03 scope)"
  - "loadedmetadata effect dep array is [] (not [reduced]) because PaperBackdrop only renders in choreography mode — the [reduced] semantic from paper-hero.tsx:85 is preserved by construction (D-17)"

patterns-established:
  - "Context-subscribing presentational subscriber: Phase 3's expanded ProductScreen and Phase 4's StageCopy follow this exact shape — useScrollChoreography() at the top, own useTransform calls, motion.div tree with style={{ ...motionValues }}"
  - "Endpoint-only keyframe binding: stage-window endpoints come from byId(); intra-stage timing constants live as named local consts in the component file (zero anonymous numeric tuples)"
  - "useMotionValueEvent reserved for imperative DOM side effects only (D-15) — not for setState-on-scroll"

requirements-completed:
  - MIGRATE-01
  - MIGRATE-02
  - MIGRATE-03
  - CHOREO-02
  - CHOREO-06
  - CHOREO-08
  - PERF-04

# Metrics
duration: ~10min
completed: 2026-04-29
---

# Phase 02 Plan 02: PaperBackdrop Subscriber Summary

**Extracted the paper-card stage frame, cloud parallax, scroll-linked hero `<video>`, `loadedmetadata` effect, and the new CHOREO-08 video gate from `paper-hero.tsx:112–194` + `:85–95` into a context-subscribing presentational component at `src/components/landing/scroll-choreography/paper-backdrop.tsx` — eliminating the `useState`-on-scroll re-render storm for three visual values and replacing magic-number keyframes with `byId("wow").window[1]` + named local constants.**

## Performance

- **Duration:** ~10 min
- **Started:** 2026-04-29T03:37:00Z (approx — agent start)
- **Completed:** 2026-04-29T03:47:07Z
- **Tasks:** 1 (single-task plan)
- **Files created:** 1
- **Files modified:** 0

## Accomplishments

- Created `paper-backdrop.tsx` — 166 lines, named-export `PaperBackdrop({ children })`, subscribes to `scrollYProgress` via `useScrollChoreography()`.
- Replaced the `useState`+`useMotionValueEvent` block (paper-hero.tsx:64–78) with `useTransform`-driven `MotionValue`s consumed directly via `style={{ scale, opacity, y }}` — MIGRATE-02 / CHOREO-06.
- Replaced anonymous numeric tuples like `[0, 0.6, 1]`, `[0, 1]` with named local constants (`STAGE_SCALE_MID_PROGRESS`, `STAGE_OPACITY_FADE_START`, `STAGE_OPACITY_FADE_END`, `CLOUD_LEFT_TRAVEL_PX`, `CLOUD_RIGHT_TRAVEL_PX`) and the STAGES-bound `VIDEO_GATE_THRESHOLD = byId("wow").window[1]` — MIGRATE-03 / D-12 / D-13.
- Implemented the CHOREO-08 video gate: `useMotionValueEvent(scrollYProgress, "change", …)` skips `video.currentTime` writes and calls `video.pause()` when `p >= byId("wow").window[1]`; resumes the scrub below threshold (no hysteresis per D-16 first-pass).
- Children slot at the same DOM position as paper-hero.tsx:147–170 (between cloud layers and the video container) — D-06.
- All `style` bindings are transform/opacity-only (`scale`, `opacity`, `y`) — no `width`/`height`/`top`/`left`/`boxShadow` motion-value bindings — PERF-04.
- paper-hero.tsx is UNCHANGED — Phase 5 owns its deletion.

## Task Commits

1. **Task 1: Create paper-backdrop.tsx — paper-card frame + clouds + video, with useTransform-driven stageScale + cloudYLeft + cloudYRight + stageOpacity** — `4c4cff8` (feat)

_Note: This plan has a single task (no TDD RED/GREEN cycle — paper-backdrop.test.tsx was already written in 02-01 as a Wave-0 RED stub, and this plan turns it GREEN by landing the source file. The single feat commit IS the GREEN gate for that test file.)_

## Test Outcomes

### `paper-backdrop.test.tsx` — GREEN (6/6 passed)

All 6 assertions from the Wave-0 stub flipped from RED to GREEN:

1. `renders the scroll-linked video element with the locked src and poster` ✓
2. `renders both cloud images (left + right) using cloud-halftone.png` ✓
3. `pauses video when scrollYProgress crosses byId('wow').window[1]` ✓ (CHOREO-08 gate verified)
4. `writes currentTime when scrollYProgress is below the gate threshold` ✓
5. `removes the loadedmetadata listener on unmount` ✓
6. `renders the paper-card root with motion-value-driven inline style` ✓ (MIGRATE-02 smoke)

### `migrate-03-keyframe-binding.test.ts` — GREEN for `paper-backdrop.tsx`

`paper-backdrop.tsx` test passes (every `useTransform` keyframe is `0`/`1`, `byId(…).window[N]` MemberExpression, or a named-const Identifier). Still RED for `product-screen.tsx` (Plan 03 lands it) and PASS for `scroll-choreography.tsx` (which currently has zero `useTransform` calls — Plan 04 fills the body).

### `migrate-perf-04.test.ts` — GREEN for `paper-backdrop.tsx`

`paper-backdrop.tsx` test passes (no forbidden `width`/`height`/`top`/`left`/`boxShadow` motion-value bindings). Still RED for `product-screen.tsx` (Plan 03) and PASS for `scroll-choreography.tsx` (no animated style props yet).

### `choreography-rerender-budget.test.tsx` — still RED (expected)

Test renders `<ScrollChoreography />`, which is still the Phase 1 `return null` stub — Plan 04 fills the orchestrator body and turns this GREEN. This plan does not touch `scroll-choreography.tsx`.

### Regression sweep on previously-GREEN tests

- `types.test.ts`: 8/8 ✓
- `use-is-desktop.test.ts`: 3/3 ✓
- `static-choreography-fallback.test.tsx`: 3/3 ✓

### Typecheck

`pnpm typecheck` produces zero errors involving `paper-backdrop.tsx`. The only TS2307 error in the suite is `product-screen.test.tsx → './product-screen'`, which is Plan 03's responsibility (RED contract — file does not yet exist).

## Threshold Value at Write Time (traceability for D-16)

At the moment this plan landed, `stages.ts` had:

```ts
{ id: "wow", window: [0.2, 0.55] as const, screen: "centered" },
```

so `VIDEO_GATE_THRESHOLD = byId("wow").window[1] = 0.55`. This is recorded here per the plan's `<output>` clause so any future Phase 2 retune of the wow window (CONTEXT.md D-14 — first-pass target `[0.20, 0.78]`) automatically propagates to the gate without code changes in `paper-backdrop.tsx` (the binding is `byId("wow").window[1]`, not the numeric literal).

## Confirmation: paper-hero.tsx is UNCHANGED

`git status` shows only one new file (`src/components/landing/scroll-choreography/paper-backdrop.tsx`); `git diff src/components/landing/paper-hero.tsx` is empty. Phase 5 owns the deletion of `paper-hero.tsx` per Phase 1 D-13 + Phase 2 D-03.

## Requirements Traceability

| Requirement | How this plan satisfies it |
|------------|----------------------------|
| **MIGRATE-01** | The paper-card frame, both clouds, the hero `<video>`, the loadedmetadata effect, and the cloud parallax all extracted from `paper-hero.tsx:112–194 + 85–95` into `paper-backdrop.tsx`. |
| **MIGRATE-02** | All three visual values that paper-hero.tsx held in `useState` (stageOpacity, screenOpacity[³], copyOpacity[³]) — for PaperBackdrop's slice (stageOpacity), this plan converts to a `useTransform`-derived `MotionValue<number>` consumed via `style={{ opacity }}`. (³screenOpacity is Plan 03; copyOpacity is Plan 04 when StageCopy / orchestrator-side hero copy lands.) |
| **MIGRATE-03** | Every `useTransform` keyframe in `paper-backdrop.tsx` is `0`, `1`, `byId("wow").window[1]`, or a named local const — verified by the `migrate-03-keyframe-binding.test.ts` AST gate (PASS for paper-backdrop.tsx). |
| **CHOREO-02** | The scroll-linked hero video and the existing illustration assets (`/hero/teacher-working.mp4` poster `/hero/teacher-illustration.png`, `/hero/cloud-halftone.png` × 2) are preserved verbatim — class strings ported character-for-character from paper-hero.tsx, no visual change to Stage 1's render. |
| **CHOREO-06** | Zero `useState` calls in paper-backdrop.tsx (verified by grep — strict, comments excluded). The single `useMotionValueEvent` call writes only to `video.currentTime` / calls `video.pause()` (imperative DOM side effects, allowed per D-15). |
| **CHOREO-08** | New video gate: when `scrollYProgress >= byId("wow").window[1]`, callback calls `video.pause()` and skips the `currentTime` write. When `p` drops back below threshold, `currentTime` writes resume. Verified by paper-backdrop.test.tsx tests 3 + 4. |
| **PERF-04** | No motion-value bindings to `width` / `height` / `top` / `left` / `boxShadow`. Only `scale`, `opacity`, `y` (transform-only). Verified by `migrate-perf-04.test.ts` AST gate (PASS for paper-backdrop.tsx). |

## Files Created/Modified

- `src/components/landing/scroll-choreography/paper-backdrop.tsx` (CREATED, 166 lines) — PaperBackdrop component (paper-card frame + cloud parallax × 2 + scroll-linked video + CHOREO-08 video gate + loadedmetadata effect + children slot).

## Decisions Made

1. **stageOpacity fade endpoint = `STAGE_OPACITY_FADE_END = 0.78` (named local const), not `VIDEO_GATE_THRESHOLD`.** The plan's `<action>` block reused `VIDEO_GATE_THRESHOLD = byId("wow").window[1] = 0.55` as the fade-end keyframe, which would have produced the non-monotonic `[0.6, 0.55]` keyframe array because stages.ts still ships `wow.window = [0.2, 0.55]` (the D-14 retune to `[0.20, 0.78]` is a separate-plan concern not in this plan's `files_modified`). Using a named const for the fade endpoint preserves paper-hero.tsx:69's `1 - (p - 0.6) / 0.18` fade semantics (range `[0.6, 0.78]`), keeps the keyframe array monotonic (a `useTransform` correctness contract), and still satisfies MIGRATE-03 (every keyframe is `0`/`1`/MemberExpression/Identifier — the AST gate PASSES).
2. **`transformOrigin: "50% 92%"` kept inline as a static string** — visual-design tuning value, NOT a stage-window number. Per CONTEXT.md § Specifics: outside MIGRATE-03 scope.
3. **`loadedmetadata` effect dep array = `[]`** — PaperBackdrop only renders in choreography mode (D-02/D-17 — orchestrator early-returns the static fallback under reduced/mobile), so the `[reduced]` dep from paper-hero.tsx:85 is preserved by construction.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 — Bug] stageOpacity keyframe ordering corrected to monotonic `[0.6, 0.78]`**
- **Found during:** Task 1 (writing paper-backdrop.tsx)
- **Issue:** Plan's `<action>` block specified `useTransform(scrollYProgress, [STAGE_OPACITY_FADE_START, VIDEO_GATE_THRESHOLD], [1, 0])` where `STAGE_OPACITY_FADE_START = 0.6` and `VIDEO_GATE_THRESHOLD = byId("wow").window[1] = 0.55`. That produces the keyframe array `[0.6, 0.55]`, which is non-monotonic — `useTransform` requires strictly-increasing input keyframes. Behavior on non-monotonic input is undefined per motion docs; in practice it can clamp to the first or last value rather than interpolating, which would make the stage-opacity fade misbehave once the orchestrator wires up real scroll. The original paper-hero.tsx:69 logic is `setStageOpacity(p < 0.6 ? 1 : clamp01(1 - (p - 0.6) / 0.18))` — i.e., a fade from `1 → 0` over the range `[0.6, 0.78]`. The plan's `VIDEO_GATE_THRESHOLD` reuse would have been correct ONLY if `stages.ts` had already been retuned to `wow.window = [0.20, 0.78]` per CONTEXT.md D-14 — but D-14's retune is not in this plan's `files_modified` list and `stages.ts` still ships `wow.window = [0.2, 0.55]` at write time.
- **Fix:** Added a second named local const `STAGE_OPACITY_FADE_END = 0.78` and used it as the fade-end keyframe. Result: `useTransform(scrollYProgress, [STAGE_OPACITY_FADE_START, STAGE_OPACITY_FADE_END], [1, 0])` — keyframes `[0.6, 0.78]` are monotonic, the fade range matches paper-hero.tsx:69 verbatim, and every keyframe entry is still a named-const Identifier (MIGRATE-03 AST gate PASSES).
- **Files modified:** `src/components/landing/scroll-choreography/paper-backdrop.tsx`
- **Verification:** `paper-backdrop.test.tsx` 6/6 PASS; `migrate-03-keyframe-binding.test.ts` for `paper-backdrop.tsx` PASS; visual fade semantics match paper-hero.tsx:69's clamped linear ramp from `1 → 0` over `[0.6, 0.78]`. The CHOREO-08 video gate is unchanged — it still uses `VIDEO_GATE_THRESHOLD = byId("wow").window[1]` per D-16, so a future D-14 retune of `wow.window` automatically updates the gate threshold (no `paper-backdrop.tsx` edit needed for the gate).
- **Committed in:** `4c4cff8`

---

**Total deviations:** 1 auto-fixed (1 bug — non-monotonic useTransform keyframes that would have caused stage-opacity misbehavior under the live scroll subscription)
**Impact on plan:** No scope creep. Single named-const addition (`STAGE_OPACITY_FADE_END = 0.78`) preserves the original visual fade semantics from paper-hero.tsx:69 verbatim. The fix is a strictly-additive `const` declaration; the plan's `<acceptance_criteria>` and `<success_criteria>` are all satisfied (zero useState, all keyframes named/STAGES-bound, file <200 lines, all 6 paper-backdrop tests GREEN).

## Issues Encountered

None — single-task plan; the keyframe-monotonicity issue surfaced during initial code-write and was corrected before commit (Rule 1 auto-fix above).

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- **Plan 02-03 (ProductScreen) ready:** PaperBackdrop is the canonical analog for "context-subscribing presentational subscriber." Plan 03 follows the same shape — `useScrollChoreography()` at top, own `useTransform` calls, motion.div tree with `style={{ scale, opacity }}`, endpoint-only MIGRATE-03 keyframe binding.
- **Plan 02-04 (ScrollChoreography orchestrator) ready:** orchestrator can now mount `<PaperBackdrop>` inside its sticky container and pass the hero copy block (h1 + subline + CTA) as `children` (D-06). The children slot's DOM position matches paper-hero.tsx:147–170 verbatim, so storytelling ("hero copy is in the paper world, scales with the stage") is preserved 1:1.
- **Phase 5 (cutover) prepared:** PaperBackdrop is the replacement for paper-hero.tsx:112–194 + 85–95. Phase 5's MIGRATE-05 task can now confidently delete `paper-hero.tsx` once the orchestrator (Plan 04) is wired and the static fallback (Plan 05 of phase 5) replaces its consumer-side `<PaperHero/>` reference.
- **D-14 retune carry-forward:** `byId("wow").window[1]` is currently `0.55`. CONTEXT.md D-14 anticipates a Phase 2 retune to `~0.78`. The `VIDEO_GATE_THRESHOLD` in `paper-backdrop.tsx` is `byId("wow").window[1]` (a binding, not a literal), so any future retune in `stages.ts` automatically updates the gate without touching `paper-backdrop.tsx`. The `STAGE_OPACITY_FADE_END = 0.78` named const, however, IS a literal — if D-14's retune lands and the stage-opacity fade should also align with the new `wow.window[1]`, that's a separate edit (likely re-binding to `byId("wow").window[1]` once stages are retuned monotonically). Flagged here for traceability.

## Self-Check: PASSED

- File `src/components/landing/scroll-choreography/paper-backdrop.tsx` exists ✓
- Commit `4c4cff8` exists in `git log --oneline` ✓
- `paper-backdrop.test.tsx`: 6/6 PASS ✓
- `migrate-03-keyframe-binding.test.ts` (paper-backdrop.tsx slice): PASS ✓
- `migrate-perf-04.test.ts` (paper-backdrop.tsx slice): PASS ✓
- `pnpm typecheck`: zero errors involving `paper-backdrop.tsx` ✓
- Phase 1 GREEN tests still PASS (no regression): types, use-is-desktop, static-choreography-fallback ✓
- `paper-hero.tsx` is unchanged ✓
- File line count: 166 (< 200 split threshold) ✓

---
*Phase: 02-orchestrator-shell-backdrop-migration*
*Completed: 2026-04-29*
