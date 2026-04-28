---
phase: 01-foundation-types-static-fallback-ssr-contract
fixed_at: 2026-04-28T23:44:00Z
review_path: .planning/phases/01-foundation-types-static-fallback-ssr-contract/01-REVIEW.md
iteration: 1
findings_in_scope: 7
fixed: 7
skipped: 0
status: all_fixed
---

# Phase 01: Code Review Fix Report

**Fixed at:** 2026-04-28T23:44:00Z
**Source review:** .planning/phases/01-foundation-types-static-fallback-ssr-contract/01-REVIEW.md
**Iteration:** 1

**Summary:**
- Findings in scope: 7 (all warnings; no blockers)
- Fixed: 7
- Skipped: 0

Post-fix verification:
- `pnpm typecheck`: exit 0
- `pnpm test --run`: 7 files / 31 tests passing (baseline 29; +2 from WR-02 coverage)
- `pnpm build`: exit 0

## Fixed Issues

### WR-01: PaperHero scroll choreography runs on mobile, violating the static-fallback contract

**Files modified:** `src/components/landing/paper-hero.tsx`
**Commit:** fd2556f
**Applied fix:** Imported `useIsDesktop` and combined `prefersReducedMotion === true || !isDesktop` into the existing `reduced` flag so the static branch wins on mobile, matching the Phase 2 orchestrator-mode contract documented in CONTEXT.md (`mode === "static"` when mobile OR reduced-motion).

### WR-02: useIsDesktop test does not verify the contract it claims to verify

**Files modified:** `src/components/landing/scroll-choreography/use-is-desktop.test.ts`
**Commit:** 78226fc
**Applied fix:** Kept the existing optimistic-default case (still passes per the user's guard rail) and added two new cases:
1. "returns false after the effect when matchMedia reports mobile" — overrides the global `vi.fn()` shim and uses `waitFor` to confirm the post-hydration mobile branch.
2. "subscribes on mount and unsubscribes on unmount" — captures the handler from `addEventListener.mock.calls[0]` and asserts the same handler is passed to `removeEventListener` on `unmount()`.

Test count: 1 → 3 in this file; total project tests: 29 → 31 passing.

### WR-03: site-header.tsx has inconsistent JSX indentation that breaks the project format contract

**Files modified:** `src/components/landing/site-header.tsx`
**Commit:** 3e55d76
**Applied fix:** Ran `pnpm prettier --write src/components/landing/site-header.tsx`. Confirmed with `pnpm prettier --check`. Two `<nav>` children that were at 10-space indent are now at the expected 8 spaces (parent at 6).

### WR-04: vitest.setup.ts matchMedia shim ships deprecated `addListener` / `removeListener`

**Files modified:** `vitest.setup.ts`
**Commit:** 9f90711
**Applied fix:** Imported `vi` from vitest, wrapped the shim factory and each event-handler in `vi.fn()`, and removed the deprecated `addListener` / `removeListener` keys. Updated the surrounding comment to point future tests at the per-test `window.matchMedia` reassignment pattern (the same pattern WR-02's new tests now use).

### WR-05: useIsDesktop docstring contradicts the actual useHydrated semantics

**Files modified:** `src/components/landing/scroll-choreography/use-is-desktop.ts`
**Commit:** 28fc775
**Applied fix:** Replaced the misleading "returns true on the server and during the first client render" wording with a Mechanism block that names the real source of optimistic-true (the outer `hydrated ? isDesktop : true` ternary) and explains that `useHydrated()` itself is `false` during SSR + the hydrating render, then transitions to `true`.

### WR-06: PaperHero video-metadata effect doesn't depend on prefersReducedMotion

**Files modified:** `src/components/landing/paper-hero.tsx`
**Commit:** 10d6582
**Applied fix:** Hoisted the `reduced` derivation above the effect block, added `if (reduced) return` early-out (so the static branch doesn't pointlessly attach a listener), and added `[reduced]` to the dep array so a `prefersReducedMotion` toggle (or `isDesktop` viewport-resize toggle) re-runs the effect against the freshly-mounted `<video>`. Adjacent comment explains the silent-no-op failure mode the original empty-deps array allowed. Re-formatted with Prettier.

### WR-07: stages.ts SCREEN_TARGETS uses `declare const` but imports won't actually fail loudly

**Files modified:** `src/components/landing/scroll-choreography/stages.ts`
**Commit:** e537e67
**Applied fix:** Took the reviewer's Option (a) — and the option the user explicitly preferred ("prefer keeping the type-only contract"): replaced `export declare const SCREEN_TARGETS: Record<...>` with `export type ScreenTargetsMap = Record<...>`. Any future Phase 1 attempt to value-import `SCREEN_TARGETS` is now a hard `tsc` error rather than a silent `undefined` at runtime. Verified no consumers reference the old symbol via `grep` before the change. Phase 3 will replace this type alias with a real `export const SCREEN_TARGETS` of the same shape — comment makes this contract explicit. Plan 02 `stages.test.ts` does not reference `SCREEN_TARGETS` and continues to pass (5 tests).

## Skipped Issues

None — all 7 in-scope warnings were applied cleanly.

## Out-of-scope (not fixed this iteration)

The following Info-severity findings are out of the default `critical_warning` scope. They remain documented in `01-REVIEW.md` for a future `fix_scope: all` pass:

- IN-01: PaperHero error message references the wrong identifier shape
- IN-02: feature-section.tsx duplicates the same redundant guard
- IN-03: footer.tsx supportEmail is marked `[CONFIRM]` in content but ships hardcoded
- IN-04: scroll-choreography mobile gate class is defined but unused
- IN-05: landmark-audit.test.tsx fixture doesn't include the SkipLink mount point used in production
- IN-06: __root.tsx mounts SkipLink before HeadContent's children but HeadContent itself only emits head tags

---

_Fixed: 2026-04-28T23:44:00Z_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 1_
