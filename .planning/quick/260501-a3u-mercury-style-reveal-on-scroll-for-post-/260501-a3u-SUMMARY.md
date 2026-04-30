---
phase: 260501-a3u
plan: 01
status: complete
date: 2026-05-01
description: Mercury-style reveal-on-scroll polish for post-hero sections (SchoolsToday, AudienceColumns, FinalCta)
---

# Quick Task 260501-a3u — Summary

## What shipped

A reusable `<RevealOnScroll>` wrapper that fades + lifts content into view as the user scrolls past ~85% of viewport entry, applied to every post-hero section. The wrapper closes the cohesion gap between the existing 3-stage hero choreography and the previously flat-rendering Schools Today / Audience Columns / Final CTA sections, so the whole page now reads as a single deliberate scroll experience — the Mercury pattern the user asked for.

## Implementation

| File | Change |
|---|---|
| `src/components/landing/reveal-on-scroll.tsx` | **NEW** (81 lines) — wrapper around `motion/react`'s `useInView` + `useReducedMotion`. Polymorphic `as` prop (`div` / `section` / `article`), `delay` prop in ms. |
| `src/components/landing/reveal-on-scroll.test.tsx` | **NEW** (87 lines) — vitest + @testing-library covering 3 contracts: reduced-motion final-state path, once-only contract via `useInView`, children-rendered-from-mount. |
| `src/components/landing/schools-today.tsx` | Wrap heading (delay 0) + 3 cards (delay = i*80ms). |
| `src/components/landing/audience-columns.tsx` | Wrap each of 3 columns (delay = i*100ms). |
| `src/components/landing/final-cta.tsx` | Single composed reveal around the paper card. No inner stagger. |
| `vitest.setup.ts` | Add minimal `IntersectionObserver` stub (jsdom doesn't ship one) — mirrors the existing `matchMedia` stub pattern. |

**Defaults match the user-approved plan exactly**: `y: 24px`, `duration: 600ms`, `ease: cubicBezier(0.4, 0, 0.2, 1)`, `useInView({ once: true, margin: "0px 0px -15% 0px", amount: 0.25 })`.

## Locked files — confirmed untouched

- `src/components/landing/scroll-choreography/**` (entire directory)
- `src/components/landing/paper-hero.tsx`
- `src/components/landing/feature-section.tsx`
- `src/styles.css`
- `src/content/landing.ts`
- `src/routes/index.tsx`

Verified via `git diff --stat 418c3d3..cbf4249`: 6 files changed, +254/-49 lines, zero locked-file paths.

## Verification — agent-browser pass

Driven against `pnpm dev` (port 3000). Screenshots in `/tmp/teacher-validate/`.

| Check | Status | Evidence |
|---|---|---|
| **A1** Schools reveal-in (1440×900) | PASS | Initial state at scrollY=0: heading + 3 cards all `opacity 0`, `transform: matrix(1,0,0,1,0,24)`. After scrollIntoView, opacity ramps 0.00 → 1.00 over ~600ms. |
| **A1** Schools stagger (heading + i*80ms) | PASS | rAF sample: heading & card1 at delay 0 fire together (0.07 → 0.07 at t=108); card2 trails ~80ms (0.03 at t=158 vs heading 0.20); card3 trails ~160ms (0.05 at t=258 vs heading 0.62). |
| **A2** Audiences reveal + 100ms stagger | PASS | rAF sample: c1 at 0.45 / c2 at 0.08 / c3 at 0.00 at t=208ms; c2 starts ~100ms later, c3 ~200ms later. All reach 1.00 by t=808ms. |
| **A3** FinalCta single composed reveal | PASS | rAF sample: 0.00 → 0.14 → 0.41 → 0.67 → 0.91 → 1.00 by t=602ms. No inner stagger. |
| **A4** Once-only on scroll-back-up | PASS | After scrolling past schools and back, heading + all 3 cards remain at `opacity 1, transform none`. |
| **A5** Console clean | PASS | Only `[vite] connecting/connected` and React DevTools recommendation. No React warnings, no IntersectionObserver errors, no motion warnings. |
| **B** Reduced-motion path | PASS | With `set media reduced-motion`: at scrollY=0 (before any element in view), all 7 reveal targets render at `opacity 1, transform none`. No animation observed during scroll. |
| **C** Mobile static-fallback (390×844) | PASS | Reveals fire correctly in stacked layout. All 3 schools cards, 3 audience cols, and pricing each reach `opacity 1.00` as scrolled into view. |
| **D** Mid-page reload (SSR + IO hand-off) | PASS | Reload at scrollY=2808 (vh=900): sections above viewport (schools cards, audience cols) at `opacity 1, transform none`; pricing (still ~10% in trigger zone) at `opacity 0, translateY(24)`; pricing reaches 1.00 after scrolling 200px more. |
| **E** Choreography integrity | PASS | Hero scroll p0 → p30 → p50 → p85 produces distinct screenshots (301kb / 140kb / 140kb / 758kb file sizes) — the morph still resolves through hero → wow → docked. No reveal-layer interference. |

Static checks: `pnpm tsc --noEmit` clean, `pnpm test --run` 16 files / 74 tests pass, `pnpm build` 2.98s.

## Notable decisions

- **Re-declared `cubicBezier(0.4, 0, 0.2, 1)` locally** rather than extracting to a shared `eases.ts` — keeps the reveal layer self-contained per the user-approved plan's "additive only" directive.
- **`useReducedMotion() === true`** explicit equality — mirrors `scroll-choreography.tsx:76`. Guards against the SSR-`null` truthy-coercion trap that would erroneously skip the animation path during hydration.
- **`initial={false}` under reduced motion** — skips the first keyframe entirely so reduced-motion users never see the lift.
- **`IntersectionObserver` stub in `vitest.setup.ts`** — jsdom does not ship one. Added a minimal no-op observer (with `disconnect`, `observe`, `unobserve`, `takeRecords`) so the existing 74 tests continue to render the post-hero sections without throwing. Pattern mirrors the existing `matchMedia` stub.

## Files

- Plan: `.planning/quick/260501-a3u-mercury-style-reveal-on-scroll-for-post-/260501-a3u-PLAN.md`
- Wrapper: `src/components/landing/reveal-on-scroll.tsx`
- Wrapper test: `src/components/landing/reveal-on-scroll.test.tsx`
- Sections: `src/components/landing/{schools-today,audience-columns,final-cta}.tsx`
- Test polyfill: `vitest.setup.ts`
- Validation screenshots: `/tmp/teacher-validate/` (A1–E, ~19 PNGs)

## Commits

| Hash | Subject |
|---|---|
| `8dcf1bc` | test(260501-a3u-01): add failing test for RevealOnScroll wrapper |
| `a8b9ec1` | feat(260501-a3u-01): implement RevealOnScroll wrapper |
| `cbf4249` | feat(260501-a3u-02): apply RevealOnScroll to post-hero sections |
| `3f21945` | chore: merge quick task 260501-a3u worktree |
