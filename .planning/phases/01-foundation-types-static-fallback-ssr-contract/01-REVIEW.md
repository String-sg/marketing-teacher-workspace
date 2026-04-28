---
phase: 01-foundation-types-static-fallback-ssr-contract
reviewed: 2026-04-28T00:00:00Z
depth: standard
files_reviewed: 28
files_reviewed_list:
  - src/components/landing/email-capture.tsx
  - src/components/landing/feature-section.tsx
  - src/components/landing/final-cta.tsx
  - src/components/landing/footer.test.tsx
  - src/components/landing/footer.tsx
  - src/components/landing/landmark-audit.test.tsx
  - src/components/landing/paper-hero.tsx
  - src/components/landing/proof-strip.tsx
  - src/components/landing/scroll-choreography/context.tsx
  - src/components/landing/scroll-choreography/scroll-choreography.tsx
  - src/components/landing/scroll-choreography/stages.test.ts
  - src/components/landing/scroll-choreography/stages.ts
  - src/components/landing/scroll-choreography/static-choreography-fallback.test.tsx
  - src/components/landing/scroll-choreography/static-choreography-fallback.tsx
  - src/components/landing/scroll-choreography/types.test.ts
  - src/components/landing/scroll-choreography/types.ts
  - src/components/landing/scroll-choreography/use-is-desktop.test.ts
  - src/components/landing/scroll-choreography/use-is-desktop.ts
  - src/components/landing/site-header.tsx
  - src/components/landing/skip-link.test.tsx
  - src/components/landing/skip-link.tsx
  - src/content/landing.ts
  - src/routes/__root.tsx
  - src/routes/index.tsx
  - src/styles.css
  - vitest.config.ts
  - vitest.setup.ts
findings:
  blocker: 0
  warning: 7
  info: 6
  total: 13
status: issues_found
---

# Phase 01: Code Review Report

**Reviewed:** 2026-04-28
**Depth:** standard
**Files Reviewed:** 28
**Status:** issues_found

## Summary

Phase 1 ships the typed contract, static fallback, and SSR scaffolding cleanly. The `scroll-choreography/` types module, `STAGES` table, `byId()` helper, and the discriminated-union `StageCopyContent` shape all line up with the documented intent. FOUND-04 (`layoutEffect: false`) is encoded as a code-comment requirement in `scroll-choreography.tsx` as expected, FOUND-06 (single source of truth for the app URL) holds — every external CTA resolves through `TEACHER_WORKSPACE_APP_URL` and no other call site hardcodes the host. Landmark structure (`<header>` / `<main id="main">` / `<footer>` siblings, single `<h1>`, sr-only skip-link first in tab order) is correct in `routes/index.tsx` + `routes/__root.tsx`.

No security vulnerabilities, secrets, dangerous APIs, or correctness-breaking bugs found. Findings are concentrated in three areas:

1. **Mobile static-fallback contract leakage** — `<PaperHero>` runs its own `useScroll`-driven 280vh sticky choreography that is gated only by `prefers-reduced-motion`, not by `useIsDesktop`. Mobile users without reduced-motion will see desktop scroll choreography inside the hero, contradicting the project-level "Mobile: Static fallback only" constraint and the static-fallback module's own docstring promise of a "stacked, normal-scroll layout."
2. **Test fidelity** — the `useIsDesktop` test claims to verify the SSR contract but only exercises a single fully-hydrated jsdom path with a `matches: true` mock. The "returns false on mobile" branch is untested.
3. **Quality** — `site-header.tsx` has visibly inconsistent JSX indentation that Prettier should fix; `vitest.setup.ts` includes deprecated `addListener`/`removeListener` shims; a few minor robustness/comment-accuracy items.

## Warnings

### WR-01: PaperHero scroll choreography runs on mobile, violating the static-fallback contract

**File:** `src/components/landing/paper-hero.tsx:84-213`
**Issue:** `PaperHero` selects between its scroll-driven branch and a static branch using only `useReducedMotion()`. There is no `useIsDesktop()` gate. The non-reduced branch sets the section to `h-[280vh]` with a `sticky top-0 h-svh` inner container, runs `useScroll` + `useMotionValueEvent` + a video-scrubbing handler, and renders an absolute-positioned overlay (`<div ... style={{ opacity: screenOpacity }}>`) on top.

The project-level constraint in `CLAUDE.md` states: "Mobile: Static fallback only — no engineering effort spent on mobile pinned scroll." `static-choreography-fallback.tsx`'s docstring also promises a "stacked, normal-scroll layout (per CONTEXT.md D-01/D-02)." A mobile user without `prefers-reduced-motion` currently gets a 280vh pinned-scroll hero with scroll-scrubbed video — which is desktop choreography, not a stacked static layout.

This is the same component invoked unconditionally from `<StaticChoreographyFallback>`, so the static-fallback path itself is leaking a desktop-only behavior into mobile.

**Fix:** Gate the choreography branch on both `useIsDesktop()` AND `useReducedMotion()`:
```tsx
import { useIsDesktop } from "@/components/landing/scroll-choreography/use-is-desktop"

const prefersReducedMotion = useReducedMotion()
const isDesktop = useIsDesktop()
const reduced = prefersReducedMotion === true || !isDesktop
```
This pattern matches the orchestrator-mode contract documented for Phase 2 (`mode === "static"` when mobile OR reduced-motion). If a Phase 2 redesign will fold PaperHero's scroll into the master `scrollYProgress`, document the deferral explicitly here so the leak is intentional and tracked.

### WR-02: useIsDesktop test does not verify the contract it claims to verify

**File:** `src/components/landing/scroll-choreography/use-is-desktop.test.ts:7-13`
**Issue:** The single test case is labeled `"returns the optimistic-desktop default (true) on first render"` and the comment cites the SSR contract — but the test runs in jsdom where `useHydrated()` from TanStack Router returns `true` synchronously on the first render (its `useSyncExternalStore` `getSnapshot` is `() => true`). The effect then runs and reads the `vitest.setup.ts` `window.matchMedia` shim, which returns `matches: true` unconditionally. So the test passes whether the optimistic default is `true` or `false`, and whether the effect runs or not.

There is no test for: (a) the fallback path returning `true` while `hydrated` is `false`, (b) the effect updating `isDesktop` to `false` when `matchMedia.matches` is `false`, (c) the listener being subscribed and unsubscribed, or (d) media-query change events triggering re-render.

**Fix:** Add at minimum a "returns false after hydration when matchMedia reports mobile" case that overrides the global stub for one test:
```ts
import { vi } from "vitest"

it("returns false after the effect when matchMedia reports mobile", async () => {
  const original = window.matchMedia
  window.matchMedia = vi.fn().mockReturnValue({
    matches: false,
    media: "(min-width: 1024px)",
    addEventListener: () => {},
    removeEventListener: () => {},
  }) as unknown as typeof window.matchMedia
  try {
    const { result } = renderHook(() => useIsDesktop())
    // initial optimistic-desktop default
    expect(result.current).toBe(true)
    // after effect commits
    await waitFor(() => expect(result.current).toBe(false))
  } finally {
    window.matchMedia = original
  }
})
```
Also add a test that asserts `removeEventListener` is called on unmount (the unsubscribe path is currently unobserved).

### WR-03: site-header.tsx has inconsistent JSX indentation that breaks the project format contract

**File:** `src/components/landing/site-header.tsx:17-56`
**Issue:** The two top-level children of `<nav>` (`<a>` at line 17 and `<div>` at line 33) are indented at 10 spaces, but their direct parent is at 6 spaces — the expected child indent under Prettier's 2-space tabWidth is 8. Line 56 closes the line-33 `<div>` at 8 spaces, which is correct, leaving the open/close indent mismatched within the same element. This is the kind of formatting drift that landed because Prettier wasn't run before commit.

**Fix:** Run `pnpm prettier --write src/components/landing/site-header.tsx`. Verify with `pnpm prettier --check`.

### WR-04: vitest.setup.ts matchMedia shim ships deprecated `addListener` / `removeListener`

**File:** `vitest.setup.ts:18-30`
**Issue:** The shim returns both modern (`addEventListener` / `removeEventListener`) and deprecated (`addListener` / `removeListener`) handlers. The deprecated handlers were removed by some browsers and are not used by `useIsDesktop` (which uses `addEventListener("change", ...)`). Including them encourages future tests to take a deprecated dependency on them.

More importantly: the shim returns a NEW object every call to `matchMedia`. Code that relies on calling `mq.removeEventListener(handler)` with the same `handler` reference works because no-op functions are interchangeable, but tests that *want* to assert the unsubscribe path was taken cannot do so against this shim — there is nothing to spy on.

**Fix:** Drop `addListener` / `removeListener` and switch to `vi.fn()` so tests can assert (un)subscription:
```ts
import { vi } from "vitest"
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn((query: string) => ({
    matches: true,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(() => false),
  })),
})
```

### WR-05: useIsDesktop docstring contradicts the actual useHydrated semantics

**File:** `src/components/landing/scroll-choreography/use-is-desktop.ts:7-12`
**Issue:** The comment says "Returns `true` on the server and during the first client render so SSR markup matches the first hydrated render (no 'did not match' warnings)." But `useHydrated()` from `@tanstack/react-router` is implemented as `useSyncExternalStore(subscribe, () => true, () => false)` — its server snapshot is `false`, its client `getSnapshot` is `true`. During hydration React uses the server snapshot (`false`) on the first render to keep markup in sync, then transitions to `true`.

That means on SSR `useHydrated()` is `false` → the hook returns the literal `true` from the `hydrated ? isDesktop : true` branch. On the first client (hydrating) render, `useHydrated()` is also `false` (server snapshot) → hook returns `true`. Both return `true`, which matches the docstring's *outcome* — but the docstring's mechanism description ("returns true on the server and during the first client render") inverts the truth: `useHydrated` itself is FALSE during both, and the optimistic-desktop default is provided by the outer `hydrated ? isDesktop : true` ternary, not by `useHydrated`. A future maintainer reading this comment will be misled when they look at `useHydrated`'s implementation.

**Fix:** Reword the docstring to match the actual mechanism:
```ts
/**
 * Optimistic-desktop SSR hook.
 *
 * - During SSR and the hydrating first client render `useHydrated()` returns
 *   `false`; in that window we short-circuit the ternary to `true` so server
 *   and client agree on the desktop layout (no hydration mismatch).
 * - After hydration completes, `useHydrated()` flips to `true` and the
 *   `useState` value (driven by `matchMedia`) becomes authoritative.
 * ...
 */
```

### WR-06: PaperHero video-metadata effect doesn't depend on prefersReducedMotion

**File:** `src/components/landing/paper-hero.tsx:73-82`
**Issue:** The effect that wires `loadedmetadata` reads `videoRef.current` once at mount with `[]` deps. If `prefersReducedMotion` changes after mount (e.g. user toggles OS-level reduce-motion preference), the rendered tree swaps from `<video>` to `<img>` (or vice versa), but the effect never re-runs. In the reduce-motion → no-reduce-motion direction, the new `<video>` is mounted but the effect that captures its duration never re-runs, so `videoDurationRef.current` stays at `0`, and the scroll-driven video scrubbing in `useMotionValueEvent` (line 68-70) silently no-ops because `duration > 0` is false.

This is rare in practice but is a documented correctness hole given `useReducedMotion` is meant to be reactive.

**Fix:** Add `prefersReducedMotion` to the effect's dep list, or guard with `if (reduced) return` and re-run when the boolean flips:
```ts
useEffect(() => {
  if (reduced) return
  const video = videoRef.current
  if (!video) return
  ...
}, [reduced])
```

### WR-07: stages.ts `SCREEN_TARGETS` uses `declare const` but imports won't actually fail loudly

**File:** `src/components/landing/scroll-choreography/stages.ts:42`
**Issue:** The intent (per the comment) is "Phase 1 code MUST NOT import the value `SCREEN_TARGETS` — only the type." But `declare const` participates in normal value-namespace imports — TypeScript will type-check `import { SCREEN_TARGETS } from "./stages"` as legal, and at runtime the import will silently resolve to `undefined` (because there is no real export). A consumer would only see the failure when they actually use the value (e.g. `SCREEN_TARGETS["tiny"]` → `Cannot read properties of undefined`). This is fragile for a phase-gating contract.

**Fix:** Either (a) export the type alone via `export type ScreenTargetsMap = Record<ScreenTarget, ScreenTargetRect>` and remove the `declare const` entirely, so any value-import is a TypeScript error; or (b) export a real const with a Phase-1 placeholder value (e.g. `{} as Record<...>`) and document that Phase 3 fills it. Option (a) is more honest about Phase 1's contract.

## Info

### IN-01: PaperHero error message references the wrong identifier shape

**File:** `src/components/landing/paper-hero.tsx:20-22`
**Issue:** The check is `stages.find((s) => s.id === "hero")` followed by `if (!heroEntry || heroEntry.id !== "hero")`. The second clause is unreachable — `find` only returns an element where the predicate is true, so `heroEntry.id === "hero"` is guaranteed when `heroEntry` is truthy. This is harmless type-narrowing belt-and-braces, but it makes the error message ("hero stage missing from content/landing stages") confusing because the actual failure can only be the missing-entry case, not an id mismatch.
**Fix:** Drop the redundant clause: `if (!heroEntry) throw new Error(...)`. TypeScript will still narrow the discriminated union via `s.id === "hero"` in the predicate.

### IN-02: feature-section.tsx duplicates the same redundant guard

**File:** `src/components/landing/feature-section.tsx:16-19`
**Issue:** Same pattern as IN-01. The `entry.id !== "feature-a" && entry.id !== "feature-b"` clause is unreachable because `entry` came from `find((s) => s.id === stage)` and `stage: FeatureStageId` is constrained to `"feature-a" | "feature-b"`. TypeScript would narrow `entry.copy` to the union without it; the redundant check exists only to satisfy the `extends` narrowing.
**Fix:** Replace with a single guard plus an explicit narrowing via the discriminated union, e.g.:
```ts
const entry = stages.find(
  (s): s is Extract<StageCopyContent, { id: FeatureStageId }> => s.id === stage
)
if (!entry) throw new Error(`FeatureSection: unknown stage "${stage}"`)
```

### IN-03: footer.tsx supportEmail is marked `[CONFIRM]` in content but ships hardcoded

**File:** `src/content/landing.ts:105-111`
**Issue:** The comment `[CONFIRM] supportEmail = "support@teacherworkspace.app" per D-19` indicates this email address is unconfirmed. If `support@teacherworkspace.app` is not a real mailbox, the `mailto:` link in the footer (a publicly-shippable artifact) would silently bounce. Worth confirming before public deploy.
**Fix:** Confirm with stakeholder, drop the `[CONFIRM]` marker once the mailbox is real, or replace with a contact form/route until a real address exists.

### IN-04: scroll-choreography mobile gate class is defined but unused

**File:** `src/styles.css:226-230`, `src/components/landing/use-is-desktop.ts:14-15`
**Issue:** `.scroll-choreography-only` is defined in `styles.css` and referenced in the `useIsDesktop` docstring, but no Phase 1 component applies the class. This is intentional per the comment ("Phase 2 will tag the choreography subtree with this class"), but it means the CSS rule ships dead and can drift from its planned consumer. A future search-and-replace or rename would pass tests because no JS references it.
**Fix:** Add a short JSX comment in `scroll-choreography.tsx`'s stub pointing future Phase 2 implementers at the class name, or co-locate the CSS as a CSS module/comment near `scroll-choreography.tsx` so the contract is one grep away.

### IN-05: landmark-audit.test.tsx fixture doesn't include the SkipLink mount point used in production

**File:** `src/components/landing/landmark-audit.test.tsx:15-26`
**Issue:** The fixture mounts `<SkipLink />` as a sibling of `<SiteHeader>` inside the test's component, but in production `<SkipLink />` is mounted by `routes/__root.tsx` inside `<body>`, NOT by `routes/index.tsx`. The fixture comment says "Mirrors the routes/index.tsx HomePage composition" — which is technically incorrect, since `routes/index.tsx` does NOT render `<SkipLink />`. If a future change moves `<SkipLink />` out of `__root.tsx`, this test continues to pass, hiding the regression.
**Fix:** Either update the comment to "Mirrors the rendered tree at `/` (root + index combined)" so the dependency on `__root.tsx` is explicit, or restructure the fixture to render through the actual router so any divergence between root and index is caught.

### IN-06: __root.tsx mounts SkipLink before HeadContent's children but HeadContent itself only emits head tags

**File:** `src/routes/__root.tsx:42-53`
**Issue:** Cosmetic. The `<body>` ordering is `<SkipLink/>` → `{children}` → `<Scripts/>`. Fine functionally, but if a future contributor wraps `<SkipLink/>` and `{children}` in a layout div, the skip-link is no longer the first focusable element on the page (WCAG 2.4.1 / A11Y-03). Worth a code comment locking the ordering invariant in place.
**Fix:** Add a one-line comment above `<SkipLink/>`:
```tsx
{/* MUST be first child of <body> — A11Y-03: first Tab stop. */}
<SkipLink />
```

---

_Reviewed: 2026-04-28_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
