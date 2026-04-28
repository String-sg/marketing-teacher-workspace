---
phase: 01-foundation-types-static-fallback-ssr-contract
plan: 04
subsystem: ssr-primitives, component-migrations, content
tags: [typescript, ssr, hooks, context, react, a11y, content-migration]

# Dependency graph
requires:
  - phase: 01-03
    provides: "stages, TEACHER_WORKSPACE_APP_URL, proofCopy, finalCtaCopy, navItems from landing.ts"
provides:
  - "useIsDesktop(): boolean — SSR-safe optimistic-desktop hook"
  - "ScrollChoreographyContext stub (scrollYProgress: motionValue(0))"
  - "ScrollChoreography Phase 1 null stub + PHASE-2 REQUIREMENT (FOUND-04) comment"
  - "FeatureSection({ stage: 'feature-a' | 'feature-b' }) — generic feature section"
  - "PaperHero migrated: hero.headline + hero.subline (D-15), TEACHER_WORKSPACE_APP_URL, finalCtaCopy.cta"
  - "product-section.tsx shim delegating to FeatureSection (Plan 05 deletes)"
  - "ProofStrip: proofCopy.heading/subheading/points"
  - "FinalCta: finalCtaCopy.kicker/headline/body"
  - "EmailCapture: finalCtaCopy.emailPlaceholder/cta + focus ring fix (A11Y-07)"
  - "SiteHeader: TEACHER_WORKSPACE_APP_URL + finalCtaCopy.cta"
  - "footer.tsx, skip-link.tsx, static-choreography-fallback.tsx Phase 1 null stubs (typecheck gate)"
  - "vitest.setup.ts: window.matchMedia mock for jsdom compatibility"
affects: [01-05, phase-02, phase-03, phase-04]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "useHydrated() from @tanstack/react-router + useState(true) optimistic-desktop SSR pattern"
    - "motionValue(0) module-level stub for Phase 1 ScrollChoreographyContext default"
    - "Extract<StageId, 'feature-a' | 'feature-b'> for FeatureSection stage constraint"
    - "TEACHER_WORKSPACE_APP_URL.replace('https://', '') for browser chrome display spans"
    - "PHASE-2 REQUIREMENT comment as encoded contract for Phase 2 executor"

key-files:
  created:
    - src/components/landing/scroll-choreography/use-is-desktop.ts
    - src/components/landing/scroll-choreography/context.tsx
    - src/components/landing/scroll-choreography/scroll-choreography.tsx
    - src/components/landing/scroll-choreography/static-choreography-fallback.tsx
    - src/components/landing/feature-section.tsx
    - src/components/landing/footer.tsx
    - src/components/landing/skip-link.tsx
  modified:
    - src/components/landing/paper-hero.tsx
    - src/components/landing/product-section.tsx
    - src/components/landing/proof-strip.tsx
    - src/components/landing/final-cta.tsx
    - src/components/landing/email-capture.tsx
    - src/components/landing/site-header.tsx
    - vitest.setup.ts

key-decisions:
  - "Browser chrome URL display spans use TEACHER_WORKSPACE_APP_URL.replace('https://', '') — FOUND-06 requires 0 literal URL strings outside landing.ts, including decorative display spans"
  - "Phase 1 stubs for footer, skip-link, static-choreography-fallback created to satisfy typecheck — Wave 0 test stubs reference these Plan 05 modules; plan's typecheck=0 gate required them"
  - "vitest.setup.ts matchMedia mock returns matches:true (desktop) — useHydrated() returns true immediately in jsdom, triggering the effect; mock keeps isDesktop=true so the test's initial-render assertion holds"
  - "ScrollChoreography returns null (not StaticChoreographyFallback) — avoids Plan 04 to Plan 05 import dependency; Phase 2 fills the body"
  - "SiteHeader removed from PaperHero (D-16) — Plan 05 mounts at route level"

# Metrics
duration: 8min
completed: 2026-04-28
---

# Phase 01 Plan 04: SSR Primitives + Consumer Migrations Summary

**SSR-safe useIsDesktop, ScrollChoreographyContext stub, FeatureSection, and 5-file data migration restoring pnpm typecheck + build to green**

## Performance

- **Duration:** ~8 min
- **Completed:** 2026-04-28
- **Tasks:** 3
- **Files created:** 7 (4 new primitives + 3 Phase 1 stubs)
- **Files modified:** 7 (paper-hero, product-section, proof-strip, final-cta, email-capture, site-header, vitest.setup.ts)

## Accomplishments

### Task 1: Create scroll-choreography primitives and feature-section

- `use-is-desktop.ts`: `useHydrated()` from `@tanstack/react-router` + `useState(true)` optimistic-desktop SSR hook. Returns `true` on server and first client render, corrects to real `matchMedia` value post-hydration.
- `context.tsx`: `ScrollChoreographyContext` with `motionValue(0)` stub, `STAGES` from Plan 02, `mode: "static"`. Phase 2 swaps the stub for real `useScroll().scrollYProgress`.
- `scroll-choreography.tsx`: Phase 1 null stub with the load-bearing `PHASE-2 REQUIREMENT (FOUND-04): layoutEffect: false` comment. Returns `null` (not `<StaticChoreographyFallback />`) to avoid a cross-plan import dependency — Plan 05 wires the fallback directly into `routes/index.tsx`.
- `feature-section.tsx`: Generic `FeatureSection({ stage: Extract<StageId, "feature-a" | "feature-b"> })` replacing `ProductSection`. Looks up stage entry in `stages`, renders kicker/heading/paragraph/bullets. Section IDs: `feature-a → "features"`, `feature-b → "testimonials"` (matching `navItems` hrefs).
- `vitest.setup.ts`: Added `window.matchMedia` mock returning `matches: true` — jsdom lacks `matchMedia`; `useHydrated()` returns `true` immediately in jsdom, triggering the effect before assertion.

**Wave 0 test result:** `use-is-desktop.test.ts` passes. ✓

### Task 2: paper-hero.tsx data swap + product-section.tsx shim

- Replaced `import { heroCopy }` with `import { finalCtaCopy, stages, TEACHER_WORKSPACE_APP_URL }`.
- Added `heroEntry` guard at top of function body.
- Added PHASE-2-DEBT comment block above `useTransform` keyframes (D-14 contract).
- D-15: `<h1>{hero.headline}</h1>` + separate `<p className="...text-[color:var(--paper-muted)]...">{hero.subline}</p>`.
- CTA: `href={TEACHER_WORKSPACE_APP_URL}` + `{finalCtaCopy.cta}`.
- D-16: `<SiteHeader />` removed from PaperHero (Plan 05 mounts at route level).
- `product-section.tsx` replaced with 10-line shim: `export function ProductSection() { return <FeatureSection stage="feature-a" /> }`. Plan 05 deletes the shim and wires `<StaticChoreographyFallback />` into `routes/index.tsx`.

**D-14 honored:** `useState`, `useMotionValueEvent`, `useTransform`, `useScroll`, `useReducedMotion` internals untouched (diff is 39 lines, under 60 limit).

### Task 3: Consumer migrations + typecheck gate

- `proof-strip.tsx`: `proofPoints` → `proofCopy.heading`, `proofCopy.subheading`, `proofCopy.points.map(...)`.
- `final-cta.tsx`: hardcoded strings → `finalCtaCopy.kicker`, `finalCtaCopy.headline`, `finalCtaCopy.body`.
- `email-capture.tsx`: `heroCopy` → `finalCtaCopy.emailPlaceholder`, `finalCtaCopy.cta`. Focus ring fixed: `focus-visible:border-primary focus-visible:ring-3 focus-visible:ring-primary/40` (A11Y-07).
- `site-header.tsx`: `heroCopy` → `TEACHER_WORKSPACE_APP_URL`, `finalCtaCopy.cta` (FOUND-06 + OQ-6 shared label).
- FOUND-06: browser chrome display spans in `paper-hero.tsx` and `feature-section.tsx` changed from literal URL strings to `{TEACHER_WORKSPACE_APP_URL.replace("https://", "")}`.
- **Typecheck gate:** Wave 0 test stubs (`footer.test.tsx`, `landmark-audit.test.tsx`, `static-choreography-fallback.test.tsx`, `skip-link.test.tsx`) import Plan 05 modules that don't exist yet. Created null-stub files (`footer.tsx`, `skip-link.tsx`, `static-choreography-fallback.tsx`) so typecheck exits 0. Plan 05 replaces the stubs with real implementations.

## Verification Outputs

### pnpm typecheck
```
> tsc --noEmit
(exits 0 — project-wide green)
```

### pnpm build
```
✓ built in 2.06s
```

### Legacy export grep (D-06/FOUND-05)
```
grep -rE "heroCopy|productCopy|\bmodules\b|proofPoints" src/components/ src/routes/
(0 matches — PASS)
```

### URL centralization (FOUND-06)
```
grep -rF "teacherworkspace-alpha.vercel.app" src/components/ src/routes/
(0 matches — PASS)
```

### Wave 0 test results
```
✓ types.test.ts (8 tests)
✓ stages.test.ts (5 tests)
✓ use-is-desktop.test.ts (1 test)
✗ footer.test.tsx (3 failed — Plan 05)
✗ skip-link.test.tsx (2 failed — Plan 05)
✗ static-choreography-fallback.test.tsx (3 failed — Plan 05)
✗ landmark-audit.test.tsx (7 failed — Plan 05)
```

3 of 7 Wave 0 tests green per plan target. 4 failing tests depend on Plan 05 real implementations.

## Task Commits

1. **Task 1: Create primitives + feature-section** — `fbe660c` (feat)
2. **Task 2: Migrate paper-hero + product-section shim** — `de6b09e` (feat)
3. **Task 3: Migrate consumers + typecheck gate** — `630d4ab` (feat)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] window.matchMedia not available in jsdom**
- **Found during:** Task 1 test run
- **Issue:** `useHydrated()` returns `true` immediately in jsdom, causing the `useEffect` to fire and call `window.matchMedia`, which throws `TypeError: window.matchMedia is not a function`. The initial `useState(true)` was correct, but the effect fired before the test could observe the initial value.
- **Fix:** Added `window.matchMedia` mock to `vitest.setup.ts` returning `matches: true` (desktop). This preserves the optimistic-desktop default behavior in tests.
- **Files modified:** `vitest.setup.ts`
- **Commit:** `fbe660c`

**2. [Rule 2 - Missing Critical Functionality] Wave 0 test stubs caused typecheck failures**
- **Found during:** Task 3 typecheck verification
- **Issue:** `footer.test.tsx`, `landmark-audit.test.tsx`, `static-choreography-fallback.test.tsx`, `skip-link.test.tsx` import modules that don't exist until Plan 05. These were pre-existing failures (present at the base commit 872d542), but the plan's success criteria require `pnpm typecheck` to exit 0.
- **Fix:** Created minimal null-stub files: `footer.tsx` (exports `SiteFooter`), `skip-link.tsx` (exports `SkipLink`), `static-choreography-fallback.tsx` (exports `StaticChoreographyFallback`). Each contains a `return null` stub with a doc-comment pointing to Plan 05.
- **Files modified:** 3 new files created
- **Commit:** `630d4ab`

**3. [Rule 2 - FOUND-06] Browser chrome URL display spans used literal URL strings**
- **Found during:** Task 3 acceptance criteria check
- **Issue:** `paper-hero.tsx` (2 instances) and `feature-section.tsx` (1 instance) had `teacherworkspace-alpha.vercel.app/students` as literal display strings inside decorative browser chrome `<span>` elements. The plan's acceptance criteria requires 0 grep matches.
- **Fix:** Replaced with `{TEACHER_WORKSPACE_APP_URL.replace("https://", "")}` expression — same visual output, no literal URL string in component files.
- **Files modified:** `paper-hero.tsx`, `feature-section.tsx`
- **Commit:** `630d4ab`

## Known Stubs

- `src/components/landing/footer.tsx` — `SiteFooter` returns `null`. Plan 05 implements the real footer with `footerCopy` (D-05, CONTENT-07).
- `src/components/landing/skip-link.tsx` — `SkipLink` returns `null`. Plan 05 implements the real skip-link (A11Y-01).
- `src/components/landing/scroll-choreography/static-choreography-fallback.tsx` — `StaticChoreographyFallback` returns `null`. Plan 05 implements the composition shell.
- `src/components/landing/product-section.tsx` — Shim delegating to `FeatureSection stage="feature-a"`. Plan 05 deletes this shim when `routes/index.tsx` is updated.
- `src/components/landing/scroll-choreography/scroll-choreography.tsx` — Returns `null`. Phase 2 fills with `useScroll`-driven orchestrator. Intentional: avoids Plan 04 ↔ Plan 05 import dependency.

These stubs do not prevent this plan's goal (typecheck + build green, legacy exports gone) from being achieved.

## paper-hero.tsx D-14 Verification

The `useState`, `useMotionValueEvent`, `useTransform`, `useScroll`, `useReducedMotion` internals were left untouched per D-14. Git diff for paper-hero.tsx is 39 lines (under the 60-line envelope). Animation internals on lines 26-54 are unchanged.

## Threat Flags

None — this plan modifies only React components, hook files, and a vitest setup file. No new network endpoints, auth paths, or DB schema changes.

## Next Phase Readiness

**Plan 05 (static fallback shell + footer + skip-link + route wire-in):**
- Reads `footerCopy` from `@/content/landing` for `SiteFooter`.
- Replaces the null stubs for `SiteFooter`, `SkipLink`, `StaticChoreographyFallback`.
- Updates `routes/index.tsx` to wire `<StaticChoreographyFallback />` + delete `product-section.tsx` shim.
- Mounts `<SiteHeader />` at route level per D-16.

## Self-Check

### Created files
- `src/components/landing/scroll-choreography/use-is-desktop.ts` — present ✓
- `src/components/landing/scroll-choreography/context.tsx` — present ✓
- `src/components/landing/scroll-choreography/scroll-choreography.tsx` — present ✓
- `src/components/landing/scroll-choreography/static-choreography-fallback.tsx` — present ✓
- `src/components/landing/feature-section.tsx` — present ✓
- `src/components/landing/footer.tsx` — present ✓
- `src/components/landing/skip-link.tsx` — present ✓

### Modified files
- `src/components/landing/paper-hero.tsx` — modified ✓
- `src/components/landing/product-section.tsx` — shim ✓
- `src/components/landing/proof-strip.tsx` — migrated ✓
- `src/components/landing/final-cta.tsx` — migrated ✓
- `src/components/landing/email-capture.tsx` — migrated + A11Y-07 ✓
- `src/components/landing/site-header.tsx` — migrated ✓
- `vitest.setup.ts` — matchMedia mock ✓

### Commits
- `fbe660c` — present ✓
- `de6b09e` — present ✓
- `630d4ab` — present ✓
