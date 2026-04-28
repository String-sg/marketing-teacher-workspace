---
phase: 01-foundation-types-static-fallback-ssr-contract
plan: 05
subsystem: static-fallback, landmarks, css, routing
tags: [react, a11y, ssr, tailwind, routing, testing]

# Dependency graph
requires:
  - phase: 01-04
    provides: "null stubs for footer/skip-link/static-choreography-fallback; FeatureSection; PaperHero migrated; ProofStrip + FinalCta migrated"
provides:
  - "StaticChoreographyFallback: real composition shell (PaperHero + FeatureSection x2 + ProofStrip + FinalCta)"
  - "SiteFooter: <footer> landmark with copyright + trust line + mailto (CONTENT-07, D-05)"
  - "SkipLink: sr-only-until-focused <a href='#main'> (A11Y-03, WCAG 2.4.1)"
  - "styles.css: .scroll-choreography-only mobile gate (@media max-width 1023px)"
  - "__root.tsx: SkipLink mounted as first body element (A11Y-03)"
  - "routes/index.tsx: <SiteHeader> + <main id='main'> + <StaticChoreographyFallback> + <SiteFooter> (D-16, D-17, A11Y-04)"
  - "product-section.tsx shim deleted (was Plan 04 transition shim)"
  - "All 7 Wave 0 test stubs green (29 tests)"
affects: [phase-02, phase-03, phase-04, phase-05]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "afterEach(cleanup) imported from vitest/testing-library in vitest.setup.ts — prevents DOM pollution when globals:false"
    - "sr-only + focus:not-sr-only Tailwind utilities for accessible skip-link (WCAG 2.4.1)"
    - "footerCopy.supportEmail rendered as href=mailto: — typesafe via footerCopy shape from Plan 03"

key-files:
  created:
    - src/components/landing/scroll-choreography/static-choreography-fallback.tsx
    - src/components/landing/footer.tsx
    - src/components/landing/skip-link.tsx
  modified:
    - src/styles.css
    - src/routes/__root.tsx
    - src/routes/index.tsx
    - vitest.setup.ts
  deleted:
    - src/components/landing/product-section.tsx

key-decisions:
  - "afterEach(cleanup) added to vitest.setup.ts — with globals:false @testing-library/react does not auto-wire DOM cleanup; multiple renders in one test file accumulate without it"
  - "product-section.tsx shim deleted as designed — Plan 04 created it as a bridge; Plan 05 index.tsx goes directly to StaticChoreographyFallback"
  - "SkipLink className is a single-line string — prettier-plugin-tailwindcss sorts classes consistently; no manual reformatting needed"

# Metrics
duration: 12min
completed: 2026-04-28
---

# Phase 01 Plan 05: Static Fallback Shell + Footer + SkipLink + Route Wire-in Summary

**Null stubs replaced with real implementations; all 7 Wave 0 tests green; Phase 1 landmark structure final (SkipLink → SiteHeader → main#main → SiteFooter)**

## Performance

- **Duration:** ~12 min
- **Completed:** 2026-04-28
- **Tasks:** 3 completed (Task 4 is checkpoint:human-verify — pending user sign-off)
- **Files created:** 3 (static-choreography-fallback.tsx, footer.tsx, skip-link.tsx)
- **Files modified:** 4 (__root.tsx, index.tsx, styles.css, vitest.setup.ts)
- **Files deleted:** 1 (product-section.tsx shim)

## Accomplishments

### Task 1: StaticChoreographyFallback shell

Replaced the Plan 04 null stub (`return null`) with the real composition:
```
PaperHero → FeatureSection(feature-a) → FeatureSection(feature-b) → ProofStrip → FinalCta
```
Zero state, zero hooks, zero effects — pure compositional wrapper per D-02. Two consumers across the phase timeline: `routes/index.tsx` (Phase 1) and `<ScrollChoreography>` when `mode === "static"` (Phase 5). Phase 5's only edit is a one-line swap at the route.

**Wave 0 result:** `static-choreography-fallback.test.tsx` (3 tests) green.

### Task 2: SiteFooter + SkipLink + CSS backstop

- `footer.tsx`: `<footer>` landmark with `{footerCopy.copyright}`, `{footerCopy.trustLine}`, and `<a href="mailto:{footerCopy.supportEmail}">`. Paper design token styling — `--paper-rule`, `--paper-muted`, `--paper-card`.
- `skip-link.tsx`: `<a href="#main" className="sr-only focus:not-sr-only ...">Skip to main content</a>`. Single-line className; Tailwind `sr-only` + `focus:not-sr-only` utilities for accessible skip behavior (WCAG 2.4.1).
- `styles.css`: appended `@media (max-width: 1023px) { .scroll-choreography-only { display: none !important; } }` — inert in Phase 1 (no choreography subtree yet), active in Phase 2.

**Wave 0 result:** `footer.test.tsx` (3 tests) + `skip-link.test.tsx` (2 tests) green. All previously passing tests still pass.

### Task 3: Route composition wire-in + product-section.tsx deletion

- `__root.tsx`: Added `import { SkipLink }` + `<SkipLink />` as first child of `<body>` (A11Y-03 — first Tab stop on every route).
- `index.tsx`: Full replacement with landmark-correct composition: `<SiteHeader />` + `<main id="main" className="paper-page"><StaticChoreographyFallback /></main>` + `<SiteFooter />` wrapped in `<>`. Satisfies D-16, D-17, A11Y-04 (exactly one `<header>`, one `<main>`, one `<footer>` as siblings).
- `product-section.tsx`: Deleted via `git rm` — the Plan 04 shim was intentionally temporary; `routes/index.tsx` now reaches `FeatureSection` via `StaticChoreographyFallback` only.

**Wave 0 result:** `landmark-audit.test.tsx` (7 tests) green. Full suite: 7 test files, 29 tests.

## Wave 0 Test Status — All 7 Green

| Test file | Tests | Status |
|-----------|-------|--------|
| `scroll-choreography/types.test.ts` | 8 | green (Plan 02) |
| `scroll-choreography/stages.test.ts` | 5 | green (Plan 02) |
| `scroll-choreography/use-is-desktop.test.ts` | 1 | green (Plan 04) |
| `scroll-choreography/static-choreography-fallback.test.tsx` | 3 | green (Plan 05, Task 1) |
| `landing/footer.test.tsx` | 3 | green (Plan 05, Task 2) |
| `landing/skip-link.test.tsx` | 2 | green (Plan 05, Task 2) |
| `landing/landmark-audit.test.tsx` | 7 | green (Plan 05, Task 3) |
| **Total** | **29** | **all passing** |

## Verification Outputs

### pnpm typecheck
```
> tsc --noEmit
(exits 0)
```

### pnpm build
```
✓ built in 1.89s
```

### pnpm test --run (all 7 files)
```
Test Files  7 passed (7)
Tests  29 passed (29)
```

### Phase gate grep checks
```
grep -rn "teacherworkspace-alpha.vercel.app" src/components/ src/routes/ → 0 matches (PASS)
grep -rE "heroCopy|productCopy|\\bmodules\\b|proofPoints" src/components/ src/routes/ → 0 matches (PASS)
test -f src/components/landing/product-section.tsx → non-zero (PASS — deleted)
grep -F "PHASE-2-DEBT" src/components/landing/paper-hero.tsx → 1 match (PASS)
grep -F "PHASE-2 REQUIREMENT (FOUND-04)" scroll-choreography/scroll-choreography.tsx → 1 match (PASS)
grep -F "layoutEffect: false" scroll-choreography/scroll-choreography.tsx → 1 match (PASS)
```

## Task Commits

1. **Task 1: StaticChoreographyFallback shell** — `3534693` (feat)
2. **Task 2: SiteFooter + SkipLink + CSS backstop** — `c0132bd` (feat)
3. **Task 3: Route wire-in + product-section deletion** — `6f50f2f` (feat)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] DOM not cleaned up between tests — multiple elements accumulating in jsdom**
- **Found during:** Task 2 test run
- **Issue:** With `globals: false` in `vitest.config.ts`, `@testing-library/react` does not auto-wire `afterEach(cleanup)`. When footer.test.tsx and skip-link.test.tsx run together (both had multiple `it()` blocks), the second test saw DOM from the first render — triggering "Found multiple elements with the role/text" errors.
- **Fix:** Added `import { afterEach } from "vitest"` and `import { cleanup } from "@testing-library/react"` + `afterEach(cleanup)` call to `vitest.setup.ts`. This mirrors what `@testing-library/react` does internally when `globals: true`.
- **Files modified:** `vitest.setup.ts`
- **Commit:** `c0132bd`

## Checkpoint Status

**Task 4 (checkpoint:human-verify) is pending user sign-off.**

Manual verifications required (per VALIDATION.md):
- Visual regression check in browser (pnpm dev, http://localhost:3000)
- Keyboard tab order: SkipLink → SiteHeader → CTAs → EmailCapture → footer mailto
- Reduced-motion emulation in DevTools (PaperHero shows static branch)
- Mobile viewport 768px (static fallback renders, no layout breakage)
- Production hydration parity (`pnpm build && pnpm preview`, zero console warnings)
- URL grep: `grep -rn "teacherworkspace-alpha.vercel.app" src/components/ src/routes/` → 0 matches

See 01-05-PLAN.md Task 4 for exact step-by-step instructions.

## Phase 1 Status

**Phase 1 implementation COMPLETE (pending Task 4 user sign-off).**

All 15 phase requirement IDs addressed (FOUND-01..06, STATIC-01..04, CONTENT-07, A11Y-01, A11Y-03, A11Y-04, A11Y-07) across Plans 01–05.

All 19 CONTEXT.md decisions (D-01..D-19) honored:
- D-01/D-02/D-03: StaticChoreographyFallback thin shell, reusing existing sections, wired immediately.
- D-04: File paths correct (scroll-choreography/, footer.tsx, skip-link.tsx flat in landing/).
- D-05: Minimal footer (copyright + trust line + mailto only).
- D-06..D-09: landing.ts reshape complete (Plans 03/04).
- D-10..D-12: StageDef + STAGES (Plans 01/02).
- D-13..D-15: PaperHero data swap + hero subline as separate `<p>` (Plan 04).
- D-16: SiteHeader extracted from PaperHero, mounted at route level in index.tsx.
- D-17: SiteFooter as sibling of `<main>`, not inside StaticChoreographyFallback.
- D-18: proofCopy.subheading + finalCtaCopy.kicker added (Plan 03/04).
- D-19: footerCopy.supportEmail = "support@teacherworkspace.app".

Next: **Phase 2 — Orchestrator Shell + Backdrop Migration** (ROADMAP.md). Phase 5 cutover: swap `<StaticChoreographyFallback />` for `<ScrollChoreography />` in `routes/index.tsx` — landmark structure is final and needs no change.

## Threat Flags

None — this plan modifies React components, CSS, and routing configuration only. No new network endpoints, auth paths, file access patterns, or schema changes.

## Known Stubs

None — all Plan 04 null stubs replaced with real implementations. The remaining stubs from Plans 01–04 (scroll-choreography.tsx returning null, SCREEN_TARGETS declared but not filled) are Phase 2/3 responsibilities and are not stubs that prevent Phase 1 goals.

## Self-Check

### Created files
- `src/components/landing/scroll-choreography/static-choreography-fallback.tsx` — present, real implementation
- `src/components/landing/footer.tsx` — present, real implementation
- `src/components/landing/skip-link.tsx` — present, real implementation

### Modified files
- `src/styles.css` — .scroll-choreography-only rule added
- `src/routes/__root.tsx` — SkipLink import + mount
- `src/routes/index.tsx` — full composition swap
- `vitest.setup.ts` — afterEach(cleanup) added

### Deleted files
- `src/components/landing/product-section.tsx` — confirmed deleted

### Commits
- `3534693` — present
- `c0132bd` — present
- `6f50f2f` — present

## Self-Check: PASSED
