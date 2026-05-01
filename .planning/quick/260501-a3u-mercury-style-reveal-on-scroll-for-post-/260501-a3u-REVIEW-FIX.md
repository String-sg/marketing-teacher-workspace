---
phase: 260501-a3u
fixed_at: 2026-05-01T00:13:44Z
review_path: .planning/quick/260501-a3u-mercury-style-reveal-on-scroll-for-post-/260501-a3u-REVIEW.md
iteration: 1
findings_in_scope: 4
fixed: 4
skipped: 0
status: all_fixed
---

# Quick 260501-a3u: Code Review Fix Report

**Fixed at:** 2026-05-01T00:13:44Z
**Source review:** .planning/quick/260501-a3u-mercury-style-reveal-on-scroll-for-post-/260501-a3u-REVIEW.md
**Iteration:** 1

**Summary:**
- Findings in scope: 4 (Critical: 0, Warning: 4)
- Fixed: 4
- Skipped: 0
- Info findings: 5 (out of scope, deferred)

**Verification baseline (every fix):** `pnpm tsc --noEmit` clean, `pnpm test --run` 74/74 tests pass.

## Fixed Issues

### WR-01: Reduced-motion contract is violated through SSR + hydration race

**Files modified:** `src/components/landing/reveal-on-scroll.tsx`
**Commit:** `a1356fe`
**Applied fix:** Made the `transition` prop conditional on `reduced`. When `useReducedMotion()` is true, `transition` becomes `{ duration: 0 }` so the post-hydration state flip is instant, even though motion still fires a state change as `useReducedMotion()` resolves from `null` to `true`. The previous code always passed `{ duration: 0.6, ease, delay }`, which would animate the post-hydration flip from `(opacity: 0, y: 24)` to `(opacity: 1, y: 0)` over 600ms — exactly the animation reduced-motion users had opted out of. Restores the wrapper's documented contract from CLAUDE.md and the wrapper's JSDoc.

### WR-02: Reduced-motion test passes trivially

**Files modified:** `src/components/landing/reveal-on-scroll.test.tsx`
**Commit:** `341389b`
**Applied fix:** Replaced three negative regex assertions on the inline `style` string (which trivially pass when motion writes no inline style at all) with positive observables: `wrapper.style.opacity` must be `""` or `"1"` (not `"0"`), and `wrapper.style.transform` must not include any `translate` substring. Added an explicit `expect(mocks.useReducedMotion).toHaveBeenCalled()` so the test fails if the reduced-motion branch is removed or the call site disappears. Also added `delay={120}` on the `RevealOnScroll` under test so the WR-01 fix's collapse of `delay` to 0 is exercised by this same case.

### WR-03: `Ref<never>` cast hides type drift between motion element types

**Files modified:** `src/components/landing/reveal-on-scroll.tsx`
**Commit:** `7ef75e8`
**Applied fix:** Dropped the polymorphic `as: "div" | "section" | "article"` prop entirely (review's option b — confirmed via `grep` that no consumer in `final-cta.tsx`, `audience-columns.tsx`, `schools-today.tsx`, or the test passes `as`). Render `motion.div` directly and type the ref as `RefObject<HTMLDivElement | null>`. Removes the `Ref<never>` cast — and with it the API design that was fighting motion's element-specific types. Confirmed during the fix attempt that the alternative cast `Ref<HTMLElement>` does NOT compile against `motion.div`'s prop type (`Ref<HTMLDivElement>`), validating the review's diagnosis. JSDoc updated to document why polymorphism was dropped.

### WR-04: `useInView` mock signature drifts from motion/react API

**Files modified:** `src/components/landing/reveal-on-scroll.test.tsx`
**Commit:** `0637a7f`
**Applied fix:** Replaced the hand-written local `InViewOptions = { once?, margin?, amount?: number | string }` type with a derivation from motion/react's real exported type: `type InViewOptions = NonNullable<Parameters<typeof RealUseInView>[1]>`. The local type was lying about `amount` (real signature is `"some" | "all" | number`, not `number | string`) and would not pick up future option additions like `root` or `initial`. Now the mock signature cannot drift silently if motion extends or renames an option.

## Skipped Issues

None — all four in-scope warnings were fixed.

## Out-of-Scope (Info findings)

Per `fix_scope: critical_warning`, the 5 Info findings (IN-01 through IN-05) were intentionally not addressed. They remain in the source REVIEW.md for follow-up if desired:

- IN-01: `useInView` called every render even when reduced-motion is on (perf nit, hooks-of-rules forbid conditional)
- IN-02: `delay` prop accepts negative/NaN values (no current caller passes anything but `i * 80`/`i * 100`, future-trap)
- IN-03: `motion[as]` has no `?? motion.div` fallback — note: this finding is partly resolved by WR-03's removal of the `as` prop entirely (no more dynamic indexing)
- IN-04: `IntersectionObserver` stub does not capture the callback (test ergonomics, current mock-at-hook approach is adequate)
- IN-05: Heading + first card both fire at delay 0 in `schools-today.tsx` (design follow-up flag, not a bug)

## Verification Notes

- All four fix commits passed `pnpm tsc --noEmit` and `pnpm test --run` (74/74 tests) before commit.
- WR-01 is a logic/correctness regression. Recommend a brief manual smoke under `prefers-reduced-motion` (DevTools → Rendering → Emulate CSS media feature `prefers-reduced-motion: reduce`) to confirm the post-hydration flip is now instant rather than animated.
- WR-03 changes the public API of `RevealOnScroll` (removes the `as` prop). All in-tree call sites were verified clean before commit.
- Locked files (`scroll-choreography/**`, `paper-hero.tsx`, `feature-section.tsx`, `styles.css`, `content/landing.ts`, `routes/index.tsx`) were not touched.

---

_Fixed: 2026-05-01T00:13:44Z_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 1_
