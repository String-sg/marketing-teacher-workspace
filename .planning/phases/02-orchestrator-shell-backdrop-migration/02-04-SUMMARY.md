---
phase: 02-orchestrator-shell-backdrop-migration
plan: 04
subsystem: ui
tags: [react, motion, scroll-choreography, orchestrator, mode-switch, stages-retune, choreo-06, choreo-07, migrate-03, migrate-04, perf-04]

# Dependency graph
requires:
  - phase: 02-orchestrator-shell-backdrop-migration
    provides: Wave-0 fail-loudly stubs (scroll-choreography.test.tsx, header-stacking.test.tsx, choreography-rerender-budget.test.tsx, migrate-03 + migrate-perf-04 AST tests, stages D-14 retune assertion), <PaperBackdrop> (Wave 1 / Plan 02), <ProductScreen> (Wave 1 / Plan 03), useIsDesktop, ScrollChoreographyContext + useScrollChoreography hook, STAGES + byId, StaticChoreographyFallback, TEACHER_WORKSPACE_APP_URL + finalCtaCopy + stages content
provides:
  - ScrollChoreography orchestrator (mode switch + early-return for static)
  - Private ChoreographyTree component (useScroll consumer + ScrollChoreographyContext.Provider mount)
  - Hero copy block rendered inline as PaperBackdrop's children with useTransform-driven copyOpacity + copyY
  - Tall sticky shell — outer <section className="scroll-choreography-only relative h-[280lvh]"> + inner sticky <div className="sticky top-0 flex h-svh items-stretch overflow-hidden p-3">
  - useScroll wired with `{ target: sectionRef, offset: ['start start', 'end end'], layoutEffect: false }` (FOUND-04 contract)
  - STAGES.wow.window retuned to [0.2, 0.78] (D-14 first-pass)
affects: [phase-02-05 route swap + production-build verification, phase-03 docking transforms (consumes provider), phase-04 stage-copy track (consumes provider), phase-05 paper-hero deletion + static-fallback refactor]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Two-component orchestrator split (RESEARCH Pattern 1) — outer mode switch + inner useScroll consumer; hooks never called conditionally"
    - "Provider value built inline (RESEARCH Pattern 4 / Pitfall 6) — Phase 2 has no consumers reading mode/reducedMotion; useMemo deferred to Phase 4"
    - "useScroll layoutEffect:false passed via Parameters<typeof useScroll>[0] cast (FOUND-04 / OQ-1) — runtime spread is harmless if motion@12.38 ignores the option"
    - ".scroll-choreography-only class as defense-in-depth alongside the JS branch (CSS rule already shipped at styles.css:226-230 by Phase 1)"
    - "Hero copy useTransform replaces paper-hero.tsx:64-78 useState/useMotionValueEvent storm (D-10 + CHOREO-06)"
    - "Intra-stage timing as named local consts (D-13) — HERO_COPY_FADE_OUT_START / HERO_COPY_FADE_OUT_END / HERO_COPY_LIFT_PROGRESS / HERO_COPY_LIFT_TRAVEL_PX"

key-files:
  created: []
  modified:
    - src/components/landing/scroll-choreography/scroll-choreography.tsx
    - src/components/landing/scroll-choreography/stages.ts

key-decisions:
  - "Two-component split: <ScrollChoreography> (mode switch + early-return for static) + <ChoreographyTree> (useScroll consumer + provider mount). The split is mandated by React's rules-of-hooks because CONTEXT D-02 requires useScroll to NOT run on the static branch — moving useScroll into a child that only mounts when mode === 'choreography' is the structural fix."
  - "useScroll(`layoutEffect: false`) cast through Parameters<typeof useScroll>[0] (RESEARCH OQ-1 advice) — avoids @ts-expect-error and lets motion's `...options` spread accept the value at runtime even if its public type does not list the field. Plan 05's pnpm preview will determine whether the option is honored."
  - "Provider value object built inline (no useMemo) per RESEARCH Pattern 4 / Pitfall 6 — Phase 2 has no consumers reading mode/reducedMotion; PaperBackdrop and ProductScreen consume scrollYProgress only (a stable MotionValue ref captured on mount). Phase 4 may add useMemo when copy-track consumers land."
  - "Hero copy block (h1 + subline p + Button asChild) lives INSIDE PaperBackdrop's children slot (D-06 + D-07) — nests between cloud divs and video container in DOM order, scales with stageScale exactly as paper-hero.tsx today. Class strings copied verbatim from paper-hero.tsx:148-168."
  - "STAGES.wow.window retuned [0.2, 0.55] -> [0.2, 0.78] (D-14 first-pass). feature-a / feature-b windows untouched per RESEARCH Pitfall 7 — Phase 3 retunes them when SCREEN_TARGETS rect values land."
  - "Outer <section> tagged `scroll-choreography-only relative h-[280lvh]` (D-18 / CHOREO-07 + Claude's-discretion defense-in-depth) — pairs with the styles.css:226-230 mobile gate so mobile users never see a one-frame flash of the desktop choreography during hydration."
  - "paper-hero.tsx, routes/index.tsx, and static-choreography-fallback.tsx UNCHANGED. Plan 05 owns the route swap; Phase 5's MIGRATE-05 owns the static-fallback refactor + paper-hero deletion (CONTEXT D-01 + D-03)."

patterns-established:
  - "Two-component orchestrator split as the canonical pattern for any future scroll-choreography consumer needing mode-switched hooks. Documented inline in scroll-choreography.tsx file header docstring."
  - "`as Parameters<typeof useScroll>[0]` as the recommended TypeScript escape hatch for motion options not in the public type (vs. @ts-expect-error / @ts-ignore)."

requirements-completed:
  - CHOREO-06
  - CHOREO-07
  - MIGRATE-03
  - MIGRATE-04
  - PERF-04

# Metrics
duration: 8min
completed: 2026-04-29
---

# Phase 2 Plan 04: Fill ScrollChoreography Orchestrator + STAGES Retune Summary

Filled the body of `src/components/landing/scroll-choreography/scroll-choreography.tsx` with the real orchestrator (replacing the Phase 1 `return null` stub) and retuned `STAGES.wow.window` to `[0.2, 0.78]` per CONTEXT D-14. Activates the choreography path that Phase 2 has been building piece by piece — after this plan the orchestrator is functionally complete; Plan 05 wires it into the route and runs the production-build verification.

## (a) Two-Component Split Confirmation

**File:** `src/components/landing/scroll-choreography/scroll-choreography.tsx`
**Line count:** 160 lines (well under the 200-line ceiling).

**Components present:**
- `export function ScrollChoreography()` (line 53) — outer wrapper. Calls `useIsDesktop()` + `useReducedMotion()`, computes `reduced = prefersReducedMotion === true || !isDesktop`, early-returns `<StaticChoreographyFallback />` when reduced, otherwise mounts `<ChoreographyTree sectionRef={sectionRef} />`. **useScroll is NOT called in this component** — it cannot be conditional.
- `function ChoreographyTree({ sectionRef })` (line 67) — private inner component. Calls `useScroll({ target: sectionRef, offset: ["start start", "end end"], layoutEffect: false } as Parameters<typeof useScroll>[0])`, looks up hero copy via discriminated-union narrow on `stages.find(s => s.id === "hero")`, builds two `useTransform` MotionValues (`copyOpacity`, `copyY`) using D-13 named local consts, mounts `<ScrollChoreographyContext.Provider value={...}>` with the live `scrollYProgress`, and renders the tall sticky shell with `<PaperBackdrop>{hero copy block}</PaperBackdrop>` + sibling `<ProductScreen />`.

**Hooks rules-of-hooks compliance:** verified by structure — `ScrollChoreography` is the conditional decision point (early-return), and all conditionally-needed hooks live inside `ChoreographyTree` which only mounts when the orchestrator commits to the choreography branch. There is no `if (...) { useFoo() }` pattern anywhere.

## (b) Test Outcomes

**Full suite (`pnpm test --run`):** 14 files / **59 tests passed / 0 failed**. Duration ~5.7s.

Specific verification of the Wave-0 stubs touching this plan:

| Test File | Tests | Status | Coverage |
|-----------|-------|--------|----------|
| `scroll-choreography.test.tsx` | 6 | GREEN | Mode-switch matrix (4 cases: desktop+motion -> choreography; the other 3 -> static), useScroll signature spy with `layoutEffect: false`, outer container className `scroll-choreography-only` + `h-[280lvh]` + inner sticky `h-svh` |
| `header-stacking.test.tsx` | 4 | GREEN | SiteHeader is NOT a descendant of any element with inline `style.transform`; header is NOT inside `<main>`; landmark count preserved (1 banner + 1 main + 1 contentinfo); `<main>` non-empty after Wave 2 |
| `choreography-rerender-budget.test.tsx` | 1 | GREEN | `<CountingChoreo>` re-renders ≤ 2 times across 100 `mockProgress.set(...)` updates — verifies CHOREO-06 / SC #2 (no useState-on-scroll storm); also asserts `section.scroll-choreography-only` is non-null in the test render |
| `migrate-03-keyframe-binding.test.ts` | 3 | GREEN | All 3 files (paper-backdrop.tsx, product-screen.tsx, scroll-choreography.tsx) — every `useTransform` keyframe entry is `0`, `1`, a `byId(...).window[N]` MemberExpression, or a named-const Identifier |
| `migrate-perf-04.test.ts` | 3 | GREEN | All 3 files animate transform/opacity only — no `width`/`height`/`top`/`left`/`box-shadow` motion-value bindings |
| `stages.test.ts` | 6 | GREEN | Includes the D-14 retune assertion `expect(byId("wow").window[1]).toBeCloseTo(0.78, 2)` — RED before Task 1, GREEN after |

Phase 1's 31 tests all still pass (skip-link, footer, static-choreography-fallback, landmark-audit, use-is-desktop, types, stages baseline). Phase 2 Wave-1's paper-backdrop.test.tsx (6) and product-screen.test.tsx (4) still GREEN.

**Typecheck:** `pnpm typecheck` exits 0 — the `as Parameters<typeof useScroll>[0]` cast satisfies strict mode without any `@ts-expect-error` comment.

**Production build:** `pnpm build` exits 0 in 3.19s with the new orchestrator. No bundling errors. Output emitted to `.output/`.

## (c) Untouched Files

`git diff` against the plan-start base shows ONLY two files modified across both Task 1 and Task 2 commits:

```
M src/components/landing/scroll-choreography/scroll-choreography.tsx
M src/components/landing/scroll-choreography/stages.ts
```

Confirmed UNCHANGED:
- `src/components/landing/paper-hero.tsx` — Phase 5 owns deletion per CONTEXT D-03.
- `src/routes/index.tsx` — Plan 05 owns the `<StaticChoreographyFallback/>` -> `<ScrollChoreography/>` swap per CONTEXT D-01.
- `src/components/landing/scroll-choreography/static-choreography-fallback.tsx` — Phase 5's MIGRATE-05 owns the PaperHero-removal refactor per CONTEXT D-03.
- `src/styles.css` — the `.scroll-choreography-only` rule (lines 226-230) was already shipped by Phase 1; Phase 2 only adds a consumer (the orchestrator's outer `<section>` className), no CSS edit required.

## (d) OQ-1 Verdict Reservation

**RESEARCH OQ-1 / FOUND-04** asks whether `useScroll({ ..., layoutEffect: false })` is honored by motion@12.38, or whether the option is silently dropped. Plan 04 passes the option as the FOUND-04 contract requires (encoded in code at `scroll-choreography.tsx:80`, not just the docstring). The Parameters-cast lets motion's source spread `...options` through the call without a type error.

**Plan 05's `pnpm preview` smoke-test will determine the verdict:**
- If the production-build first-paint flicker (motion#2452) does NOT reproduce after a hard-refresh mid-page, motion@12.38 either honors `layoutEffect: false` or the upstream issue has been fixed internally.
- If the flicker DOES reproduce, a follow-up phase needs to remove the now-vestigial option (since it isn't doing its job) and add a different mitigation (likely a viewport-height stabilization trick).

The verdict outcome and any follow-up are tracked in STATE.md after Plan 05 completes.

## (e) Requirements Traceability

| Requirement | How Plan 04 Satisfies It |
|---|---|
| **CHOREO-06** (no useState on scroll for visual properties) | `grep -c useState scroll-choreography.tsx` returns 0 actual hook calls (only a comment reference inside a docstring describing the *paper-hero.tsx debt being paid down*). Hero copy `copyOpacity` + `copyY` are `useTransform`-derived MotionValues consumed via `style={{ opacity, y }}` directly. choreography-rerender-budget.test.tsx asserts ≤ 2 re-renders / 100 motion-value updates. |
| **CHOREO-07** (lvh outer + svh inner; no vh) | Outer `<section className="scroll-choreography-only relative h-[280lvh]">` (line 127); inner `<div className="sticky top-0 flex h-svh items-stretch overflow-hidden p-3">` (line 130). No `vh` units used. scroll-choreography.test.tsx Test 3 asserts these classNames present. |
| **MIGRATE-03** (endpoint-only keyframe binding) | All `useTransform` calls in scroll-choreography.tsx (copyOpacity + copyY) use named local consts (`HERO_COPY_FADE_OUT_START`, `HERO_COPY_FADE_OUT_END`, `HERO_COPY_LIFT_PROGRESS`, `HERO_COPY_LIFT_TRAVEL_PX`) plus `0`/`1` sentinels — zero anonymous numeric literals in keyframe positions. migrate-03-keyframe-binding.test.ts AST gate flips GREEN for the third and final source file (paper-backdrop.tsx and product-screen.tsx already passed in Wave 1). D-14 retune lands the `wow.window[1]` value in `stages.ts` as the single source of truth. |
| **MIGRATE-04** (header stacking-context preserved) | Outer `<section>` carries no inline `style.transform` (verified by scroll-choreography.test.tsx and header-stacking.test.tsx). SiteHeader remains a sibling of `<main>` at the route level (Phase 1 D-16 — still true; routes/index.tsx untouched). header-stacking.test.tsx mounts the full HomePageFixture with `<ScrollChoreography/>` inside `<main>` and verifies the banner is NOT a descendant of any transformed element + NOT inside `<main>`. |
| **PERF-04** (transform/opacity only) | scroll-choreography.tsx animates `opacity` and `y` only (on the inline hero-copy `<motion.div>`); no `width`/`height`/`top`/`left`/`box-shadow` motion-value bindings. migrate-perf-04.test.ts AST gate flips GREEN for the third and final source file. |

## Deviations from Plan

None — both tasks executed exactly as written. No Rule 1/2/3 auto-fixes applied. No Rule 4 architectural escalations. No authentication gates. CLAUDE.md project constraints honored: stack locked (motion/react @ 12.38, no GSAP), Tailwind v4, paper design tokens, performance-friendly transforms only, mobile-static-fallback respected via the early-return path, accessibility (`prefers-reduced-motion` -> static branch), live app at `teacherworkspace-alpha.vercel.app/students` untouched.

## Self-Check: PASSED

**Created/modified files exist:**
- FOUND: `src/components/landing/scroll-choreography/scroll-choreography.tsx` (160 lines)
- FOUND: `src/components/landing/scroll-choreography/stages.ts` (wow.window now `[0.2, 0.78]`)

**Commits exist:**
- FOUND: `ebb12d2` — `refactor(02-04): retune STAGES.wow.window to [0.2, 0.78] (D-14 first-pass)`
- FOUND: `790b065` — `feat(02-04): fill ScrollChoreography orchestrator (two-component split)`

**Final verification commands (post-execution):**
- `pnpm test --run` -> 59 passed / 0 failed (14 files)
- `pnpm typecheck` -> exit 0
- `pnpm build` -> exit 0 (built in 3.19s)
- `git diff src/components/landing/paper-hero.tsx src/routes/index.tsx src/components/landing/scroll-choreography/static-choreography-fallback.tsx` -> empty
- `wc -l src/components/landing/scroll-choreography/scroll-choreography.tsx` -> 160
