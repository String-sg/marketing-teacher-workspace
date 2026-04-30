---
phase: 260501-a3u
reviewed: 2026-04-30T00:00:00Z
depth: standard
files_reviewed: 6
files_reviewed_list:
  - src/components/landing/audience-columns.tsx
  - src/components/landing/final-cta.tsx
  - src/components/landing/reveal-on-scroll.test.tsx
  - src/components/landing/reveal-on-scroll.tsx
  - src/components/landing/schools-today.tsx
  - vitest.setup.ts
findings:
  critical: 0
  warning: 4
  info: 5
  total: 9
status: issues_found
---

# Quick 260501-a3u: Code Review Report

**Reviewed:** 2026-04-30
**Depth:** standard
**Files Reviewed:** 6
**Status:** issues_found

## Summary

The shipped `RevealOnScroll` wrapper does what the plan asks for under happy-path, JS-enabled, post-hydration conditions. However, several defects were found that affect the correctness of the documented contracts — most importantly the **reduced-motion contract under SSR/hydration**, which is described as the most important hard requirement in CLAUDE.md ("`prefers-reduced-motion` is a hard requirement"). The current implementation can run a 600ms fade on the first paint after hydration for reduced-motion users, contradicting the "no animation/transition" guarantee in the plan and in the wrapper's own JSDoc.

There are also test-quality issues — the reduced-motion assertion is structured so it passes even when motion writes no inline style at all, which means it would not have caught the SSR bug above. The polymorphic `as` prop relies on an unsafe `Ref<never>` cast, and the `useInView` mock type signature drifts from the real motion API.

No critical security issues, secrets, or data-loss risks were found. The wrapper is GPU-friendly (transform/opacity only) and respects the additive-only constraint vs. locked files.

## Warnings

### WR-01: Reduced-motion contract is violated through SSR + hydration race

**File:** `src/components/landing/reveal-on-scroll.tsx:55-76`
**Issue:** The plan and wrapper JSDoc both promise "no animation/transition" for `prefers-reduced-motion: reduce`. The current implementation cannot guarantee this.

Trace through SSR + first hydration tick for a reduced-motion user:

1. Server render and first client render: `useReducedMotion()` returns `null` (per the project's documented precedent at `scroll-choreography.tsx:73`). Therefore `reduced = (null === true) = false`.
2. With `reduced = false`, `initial = { opacity: 0, y: 24 }` is rendered into the SSR HTML and into the first React tree on the client.
3. After `useEffect` runs, `useReducedMotion()` flips to `true`. The component re-renders with `reduced = true`, `initial = false`, `animate = { opacity: 1, y: 0 }`.
4. `transition={{ duration: 0.6, ease: EASE, delay }}` is unchanged. Motion now animates from the previously-rendered `opacity: 0, y: 24` to `opacity: 1, y: 0` over 600ms — exactly the animation reduced-motion users opted out of.

`initial={false}` only skips the *first* keyframe of a brand-new mount; it does not bypass `transition` on subsequent prop changes. So although the prop is conditionally set, the post-hydration state change still drives a transition.

**Fix:** Force `transition.duration = 0` (and `delay = 0`) when `reduced` is true, so the post-hydration state flip is instant rather than animated.

```tsx
transition={
  reduced
    ? { duration: 0 }
    : { duration: DEFAULT_DURATION, ease: EASE, delay: delay / 1000 }
}
```

A second-line defense is to skip `useInView` work entirely when reduced (cosmetic, not required for correctness).

---

### WR-02: Reduced-motion test passes trivially — does not actually verify the contract

**File:** `src/components/landing/reveal-on-scroll.test.tsx:31-54`
**Issue:** The test is structured so it passes whether or not the implementation honors the reduced-motion contract.

The two assertions are:

```tsx
expect(/opacity:\s*0(?!\.)/i.test(style)).toBe(false)
expect(/translateY\((?!0)/i.test(style)).toBe(false)
expect(/translate3d\(0px,\s*(?!0px)/i.test(style)).toBe(false)
```

These are all *negative* assertions on the inline `style` string. If `motion.div` under jsdom writes no style attribute at all (which is plausible since `initial={false}` is set and the animate target equals the natural rendered state), `style` becomes `""`, every regex returns `false`, every assertion succeeds. The test would pass even if the reduced-motion branch were deleted entirely and the component rendered with `opacity: 0` via initial state — as long as the inline `style` happens to be empty.

It also does not assert that `transition` is bypassed (the actual root-cause of WR-01). And `(?!\.)` allows `opacity: 0` to be missed if the value is `0px` or `0;` — fragile.

**Fix:** Test the *positive* observable instead. Either:
- Assert `wrapper.style.opacity === "1"` after render, OR
- Snapshot the resolved animate prop from a non-mocked `motion.div` test using `framer-motion`'s rendered output, OR
- Move to an integration-style test that asserts the motion `transition` prop ends up as `{ duration: 0 }` under reduced motion (e.g., by spying on a passthrough mock for `motion.div` that records its received props).

Example positive assertion:

```tsx
const wrapper = container.firstElementChild as HTMLElement
expect(wrapper.style.opacity === "" || wrapper.style.opacity === "1").toBe(true)
expect(wrapper.style.transform).not.toMatch(/translate(3d|Y)\(/)
// And explicitly assert the reduced branch was taken:
expect(mocks.useReducedMotion).toHaveBeenCalled()
```

---

### WR-03: `Ref<never>` cast hides type drift between `motion.div` / `motion.section` / `motion.article`

**File:** `src/components/landing/reveal-on-scroll.tsx:52,63`
**Issue:** `const ref = useRef<HTMLElement | null>(null)` is then forwarded as `ref={ref as Ref<never>}`. The cast bypasses TypeScript's check that the ref shape matches the chosen `motion[as]` element.

Today the wrapper does not read `ref.current` for anything beyond `useInView`, so the cast is benign at runtime — `useInView` only needs an `Element`, and `HTMLDivElement | HTMLElement | HTMLAnchorElement` all satisfy that. But:

1. `Ref<never>` is the most aggressive form of cast — it disables every future check, including unrelated ones.
2. The next contributor who adds `as="article"` then reads `ref.current.someDivOnlyProp` will get no compile error and a runtime undefined.
3. This is the most code-smell-y line in the new module; it suggests the API design (`as: "div" | "section" | "article"`) is fighting motion's element-specific types.

**Fix:** Either narrow the ref type (`useRef<HTMLDivElement | HTMLElement>(null)` and let TS widen via the union) and use a simpler cast that documents intent, or drop the polymorphism (a single `as="div"` covers every current call site — no consumer passes `as="section"` or `as="article"`):

```tsx
const ref = useRef<HTMLElement | null>(null)
// later:
ref={ref as React.RefObject<HTMLDivElement>}  // narrower, documents intent
```

If the polymorphism is kept, prefer `as React.Ref<HTMLElement>` over `Ref<never>` so type errors at the ref site still surface.

---

### WR-04: `useInView` mock signature drifts from the motion/react API

**File:** `src/components/landing/reveal-on-scroll.test.tsx:7-17`
**Issue:** The test declares `type InViewOptions = { once?: boolean; margin?: string; amount?: number | string }` and stubs `useInView: vi.fn((_ref: unknown, _options?: InViewOptions): boolean => false)`.

motion/react's actual `useInView` signature is `(ref: RefObject<Element>, options?: { once?, margin?, amount?: "some" | "all" | number, root?, initial? }): boolean`. Two issues:

1. The test's local `InViewOptions.amount` is `number | string`, but the real API is `"some" | "all" | number`. The wrapper passes `amount: 0.25`, which is fine for both, but the type drifts.
2. If motion ever renames or extends an option (root, initial), the local type lies and the test still claims to be "documenting the API contract" while diverging from it.

**Fix:** Import the real type from motion/react instead of redeclaring it locally:

```tsx
import type { useInView as RealUseInView } from "motion/react"
type InViewOptions = NonNullable<Parameters<typeof RealUseInView>[1]>
```

Or simpler: don't type the mock arguments — `vi.fn((..._args: unknown[]): boolean => false)` and inspect `mock.calls[0][1]` with type assertions in the assertion site, which signals "I am inspecting external behavior" more honestly.

## Info

### IN-01: `useInView` is called every render even when reduced-motion is on

**File:** `src/components/landing/reveal-on-scroll.tsx:55-56`
**Issue:** When `reduced === true`, the result of `useInView` is never used (`shouldAnimate = !reduced && inView` is always `false`). The hook still attaches an IntersectionObserver to every reveal target on the page for users who explicitly opted out of motion.

Not a bug (hook order rules forbid conditional calls), but slightly contrary to the spirit of "do less work for users with reduced-motion preferences." The IO overhead is real if the page has many revealing elements.

**Fix:** Either accept this and add a one-line comment explaining why the hook is unconditionally invoked, or split into two components (`<RevealOnScrollMotion>` + `<RevealOnScrollStatic>`) and choose at the parent level — but that is over-engineering for the current size. A comment is sufficient:

```tsx
// Note: useInView is called unconditionally (rules of hooks). Its result is
// ignored when `reduced` is true.
const inView = useInView(ref, IN_VIEW_OPTIONS)
```

---

### IN-02: `delay` prop accepts negative values and `NaN`

**File:** `src/components/landing/reveal-on-scroll.tsx:75`
**Issue:** `delay: delay / 1000` is computed without input validation. A caller passing `delay={-100}` or `delay={Number("oops")}` (NaN) yields a negative or NaN transition delay. motion handles NaN by treating it as 0, but a negative delay is silently treated as a no-op / scrub. Today no caller passes anything but `i * 80` or `i * 100`, but this is a future-trap.

**Fix:** Clamp at the API boundary:

```tsx
const safeDelay = Math.max(0, Number.isFinite(delay) ? delay : 0)
// ...
transition={{ ..., delay: safeDelay / 1000 }}
```

Or add a runtime assertion in dev mode.

---

### IN-03: `motion[as]` indexing has no fallback when `as` is malformed

**File:** `src/components/landing/reveal-on-scroll.tsx:58`
**Issue:** `const MotionTag = motion[as]` works because `as` is constrained by the union type — but the original PLAN.md task spec said "prefer `const MotionTag = motion[as]` over a switch — motion exposes element accessors directly … `motion[as] ?? motion.div  // polymorphic`". The shipped code dropped the `?? motion.div` fallback. With strict TypeScript the fallback is unreachable today, but this also means a user-supplied `as` (e.g., from a bug in TS suppression elsewhere, or from `as` being widened to `string` via spread props later) would crash with `MotionTag is undefined` instead of falling back gracefully.

**Fix:** Restore the fallback:

```tsx
const MotionTag = motion[as] ?? motion.div
```

Costs one character; preserves the runtime safety the plan specified.

---

### IN-04: `IntersectionObserver` stub does not capture the callback or invoke it

**File:** `vitest.setup.ts:41-61`
**Issue:** The stub is a no-op for all four IO methods, and importantly the constructor signature `(callback, options)` is implicit — neither is recorded. This means:

- Tests cannot drive a real "in view" event through motion's `useInView`. The only path to test the `inView=true` branch is the current vi.mock approach, which is fine, but the stub provides zero affordance for future tests.
- Real bugs in motion's IO subscription/teardown (e.g., a missed `disconnect`) cannot be detected here.

The setup file calls this stub "minimal", which is honest. Confirm the trade-off is acceptable: today, the wrapper's IO usage is delegated to motion's `useInView`, so it's reasonable to mock at the hook layer rather than the IO layer. Just be aware the stub does not pretend to be a faithful IO implementation.

**Fix (optional):** Capture the callback so future tests can fire intersections manually:

```tsx
class StubIntersectionObserver {
  callback: IntersectionObserverCallback
  constructor(cb: IntersectionObserverCallback) {
    this.callback = cb
  }
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
  takeRecords(): IntersectionObserverEntry[] { return [] }
}
```

This is two extra lines of code and unblocks downstream tests with no behavioral change today.

---

### IN-05: Inconsistent stagger semantics between siblings — heading + first card both fire at `delay=0`

**File:** `src/components/landing/schools-today.tsx:32,48`
**Issue:** The heading block is wrapped with no `delay` (defaults to 0), and the first case-study card is also `delay={0 * 80}` = 0. Both fire simultaneously, which the agent-browser pass at `260501-a3u-SUMMARY.md` confirms ("heading & card1 at delay 0 fire together").

This is consistent with the plan as written, but it slightly contradicts the user-approved Mercury-style cascade pattern: most production reveal sequences offset the heading from the list ("heading appears, then list cascades"). The current behavior makes the heading land at the same instant as card 1, which can read as cluttered if both are visible at the trigger boundary.

Not a bug — the plan explicitly says "delay 0" for the heading. Flag for design follow-up only: consider `delay={i * 80 + 80}` on the cards (heading first, then cards starting 80ms later) if the rhythm feels cluttered post-launch.

---

_Reviewed: 2026-04-30_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
