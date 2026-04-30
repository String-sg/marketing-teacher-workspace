---
phase: 03-product-screen-the-single-shared-element
plan: 04
subsystem: ui
tags: [phase-3, wave-1, lcp-preload, section-height, backdrop-cascade, react-19, tanstack-start, motion-12]

# Dependency graph
requires:
  - phase: 01-foundation-types-static-fallback-ssr-contract
    provides: index.head.test.tsx OQ-04 falsification scaffold (Plan 03-01 RED state)
  - phase: 03-product-screen-the-single-shared-element (Plan 02)
    provides: <ProductScreen> <picture> sizes contract "(min-width:1280px) 1280px, 100vw" + on-disk AVIF variants at /hero/profiles-screen-{640,960,1280,1600}.avif
  - phase: 03-product-screen-the-single-shared-element (Plan 03)
    provides: STAGES.wow.window[1] = 0.55 (retuned from 0.78); byId("wow").window[1] auto-tracking entry point
provides:
  - "Index route head() preload — one <link rel='preload' as='image' type='image/avif'> with React 19 camelCase (imageSrcSet, imageSizes, fetchPriority) — emitted via TanStack Start head() callback on the / route only"
  - "imageSizes byte-matches the <picture> sizes contract: '(min-width:1280px) 1280px, 100vw' (web.dev/preload-responsive-images contract enforced)"
  - "Scroll choreography section height retuned to h-[400lvh] (4× viewport for 4 stages — D-09); inner sticky h-svh preserved (D-18 / Pitfall #5)"
  - "PaperBackdrop intra-stage timing consts retuned to track new wow plateau: STAGE_OPACITY_FADE_START=0.45, STAGE_OPACITY_FADE_END=0.55, STAGE_SCALE_MID_PROGRESS=0.40 (D-20)"
  - "VIDEO_GATE_THRESHOLD auto-tracks 0.78→0.55 via byId('wow').window[1] reference — zero-edit cascade (D-21 in action)"
  - "OQ-04 falsification test (src/routes/index.head.test.tsx) flipped from RED 5/5 → GREEN 5/5"
affects:
  - phase 03-product-screen (Plan 05) — visual-review checkpoint will scrub through the 400lvh section and validate the retuned PaperBackdrop fade timing matches the new wow plateau
  - phase 06-audit — LCP measurement now reads the AVIF preload as the LCP-critical resource on AVIF-capable browsers (Lighthouse should see "Largest Contentful Paint element preloaded"); imageSizes/sizes drift would surface here as a "Preload key requests" warning

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "TanStack Start file-route head() callback emitting React 19 camelCase <link> props"
    - "web.dev preload-responsive-images contract: imageSizes on <link> byte-matches sizes on <picture>/<source>/<img>"
    - "D-21 zero-edit cascade: byId('wow').window[1] reference auto-tracks STAGES retunes — confirmed by paper-backdrop.test.tsx passing without test edits"

key-files:
  created: []
  modified:
    - src/routes/index.tsx
    - src/components/landing/scroll-choreography/scroll-choreography.tsx
    - src/components/landing/scroll-choreography/scroll-choreography.test.tsx
    - src/components/landing/scroll-choreography/paper-backdrop.tsx
    - .planning/phases/03-product-screen-the-single-shared-element/deferred-items.md

key-decisions:
  - "D-12 LCP preload landed via index-route head() (not __root.tsx) — future routes don't pay the cost"
  - "React 19 camelCase contract enforced (imageSrcSet/imageSizes/fetchPriority); OQ-04 falsification gate now GREEN"
  - "D-09 section height committed to 400lvh (4× viewport) — the FEATURES.md anti-feature threshold; D-17 visual checkpoint in Plan 05 may revisit"
  - "D-20 PaperBackdrop intra-stage retune used first-pass values: FADE_START=0.45, FADE_END=0.55, MID_PROGRESS=0.40 — tunable at Plan 05 visual review"
  - "D-21 confirmed in practice: paper-backdrop.test.tsx required zero edits because every threshold reference goes through byId('wow').window[1]"

patterns-established:
  - "Pattern: index-route-only head() preload — keeps marketing LCP fast-path scoped to /, no cost on other routes"
  - "Pattern: byte-matched imageSizes/sizes contract verified by literal-string assertion in both test 4 (head) and test 4 (picture) — drift caught by either gate"
  - "Pattern: D-21 zero-edit cascade reaffirmed — STAGES retunes propagate to consumers without source edits when consumers reference byId() instead of duplicating literals"

requirements-completed: [VISUAL-03]

# Metrics
duration: ~5min
completed: 2026-04-30
---

# Phase 3 Plan 04: Wave 1c — index head() preload + section-height + PaperBackdrop cascade Summary

LCP preload wired on the / route via TanStack Start head() with React 19 camelCase, choreography section retuned to 4× viewport (400lvh), and PaperBackdrop intra-stage timing retuned to track the new wow plateau end at 0.55 — all three edits coherent, every gate green, zero new lint or typecheck errors.

## What Was Built

Three coordinated, independent edits across three files (Wave 1c of Phase 3):

### 1. `src/routes/index.tsx` — head() preload (D-12, VISUAL-03)
Added a `head: () => ({ links: [...] })` config to `createFileRoute("/")` that emits exactly one `<link rel="preload" as="image" type="image/avif">` with React 19 camelCase keys (`imageSrcSet`, `imageSizes`, `fetchPriority`). The `imageSrcSet` enumerates all 4 AVIF widths (640/960/1280/1600); `imageSizes` is the literal `"(min-width:1280px) 1280px, 100vw"` byte-matched to the `<picture>` `sizes` attribute that Plan 03-02 landed.

### 2. `src/components/landing/scroll-choreography/scroll-choreography.tsx` — section height (D-09)
Outer scroll container className: `h-[280lvh]` → `h-[400lvh]` (4× viewport for the 4-stage choreography). Inner sticky child stays `h-svh` (D-18 / Pitfall #5). File-header docstring updated to note the Phase 3 retune. Companion test `scroll-choreography.test.tsx` regex assertion updated to match.

### 3. `src/components/landing/scroll-choreography/paper-backdrop.tsx` — intra-stage cascade (D-20, D-21)
Three named consts retuned to track the new wow plateau end:
- `STAGE_SCALE_MID_PROGRESS`: `0.6` → `0.4` (tracks new wow midpoint)
- `STAGE_OPACITY_FADE_START`: `0.6` → `0.45`
- `STAGE_OPACITY_FADE_END`: `0.78` → `0.55` (paper card finishes fading exactly when wow plateau ends)

`STAGE_SCALE_MID_VALUE` (2.4) and `STAGE_SCALE_END_VALUE` (5.2) preserved (vertical-axis values, not stage-window-bound).

`VIDEO_GATE_THRESHOLD = byId("wow").window[1]` is **unchanged** in source — it auto-tracked the underlying STAGES retune from 0.78 → 0.55 with zero edits, confirming the D-21 zero-edit-cascade pattern in practice. `paper-backdrop.test.tsx` passed without modification because every threshold reference inside the test goes through `byId("wow").window[1]` rather than a literal `0.78`.

## Verification Results

| Gate | Pre-plan | Post-plan |
|------|----------|-----------|
| `pnpm test src/routes/index.head.test.tsx` | RED 5/5 | **GREEN 5/5** |
| `pnpm test src/components/landing/scroll-choreography/scroll-choreography.test.tsx` | GREEN 6/6 | GREEN 6/6 |
| `pnpm test src/components/landing/scroll-choreography/paper-backdrop.test.tsx` | GREEN 6/6 | GREEN 6/6 |
| `pnpm test src/components/landing/scroll-choreography/migrate-03-keyframe-binding.test.ts` | GREEN 3/3 | GREEN 3/3 |
| `pnpm test src/components/landing/scroll-choreography` (full sweep) | 11 files / 61 tests pass | **11 files / 61 tests pass** |
| `pnpm typecheck` | exit 0 | exit 0 |
| `grep -rn "h-\[280lvh\]" src/` | 2 occurrences | **0 occurrences** |
| `pnpm lint` (whole project) | 41 errors (pre-existing) | 41 errors (pre-existing — see deferred-items.md) |

## Commits

| Hash | Type | Subject |
|------|------|---------|
| `a1ac81f` | feat | feat(03-04): add LCP preload to / route head() (D-12, VISUAL-03) |
| `0c8e15d` | feat | feat(03-04): retune choreography section height to h-[400lvh] (D-09) |
| `2810c28` | feat | feat(03-04): retune PaperBackdrop intra-stage cascade (D-20, D-21) |

## Decisions Made

- **D-12 enacted**: LCP preload lives on the / route head() (not __root.tsx). Marketing-only fast-path for AVIF-capable browsers; `<picture>` handles fallback for the rest.
- **React 19 contract enforced at the wire**: `imageSrcSet`/`imageSizes`/`fetchPriority` props are camelCase. The OQ-04 falsification test (`index.head.test.tsx`) is the structural gate; lowercase-prop regression would now fail loudly.
- **D-09 section height**: 400lvh is exactly the FEATURES.md anti-feature threshold (4 viewports for 4 stages). Plan 05's visual-review checkpoint is the empirical mitigation if it feels stuck.
- **D-20 first-pass values**: Used the simplest cascade — `STAGE_OPACITY_FADE_END = wow.window[1] = 0.55` so the paper-card opacity ends exactly when the wow plateau ends. `STAGE_SCALE_MID_PROGRESS = 0.4` (rounded from the wow midpoint 0.375). All tunable at the D-17 visual checkpoint in Plan 05.
- **D-21 zero-edit-cascade verified in practice**: `paper-backdrop.test.tsx` did NOT need any edits despite the threshold dropping from 0.78 to 0.55. Every assertion either uses `byId("wow").window[1]` directly or probes a value (0.3, 0.5) that lives inside both the old and new wow windows.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Removed lingering `h-[280lvh]` literal from docstring**

- **Found during:** Task 2 acceptance check
- **Issue:** The plan's suggested docstring rewrite kept the literal `h-[280lvh]` inside the comment ("Phase 2's h-[280lvh]"), but the acceptance criteria explicitly required `grep -c "h-\[280lvh\]" ... | grep -q "^0$"` — zero occurrences anywhere in the file *including in docstring*. The two contracts conflicted; acceptance criteria win because `grep -rn "h-\[280lvh\]" src/` is the explicit verification gate.
- **Fix:** Reworded the docstring from "Phase 2's h-[280lvh]" to "Phase 2's 280lvh" — preserves the migration history note while satisfying the zero-occurrence acceptance gate.
- **Files modified:** `src/components/landing/scroll-choreography/scroll-choreography.tsx`
- **Commit:** Folded into `0c8e15d` (the same commit that made the className edit)

### Auth Gates

None.

### Out-of-Scope Observations (Logged to deferred-items.md)

`pnpm lint` reports **41 errors total before AND after this plan's three commits** — i.e. zero new lint errors introduced. Plan 03-04's three modified source files are lint-clean at the touched lines:

- `src/routes/index.tsx` — zero lint errors
- `paper-backdrop.tsx` — pre-existing errors at lines 42 (import order) and 113 (no-unnecessary-condition); both untouched by this plan
- `scroll-choreography.tsx` — pre-existing errors at lines 32, 47, 93; all untouched by this plan

Per SCOPE BOUNDARY rule, these pre-existing errors are out of scope. The deferred-items.md file already tracks them from Plan 03-02; updated with a Plan 03-04 re-verification note.

## Threat Mitigation Status

| Threat ID | Status | Evidence |
|-----------|--------|----------|
| T-03-14 (Lowercase prop-name regression in head()) | **mitigated** | `index.head.test.tsx` test 3 asserts `link.imageSrcSet`, `link.imageSizes`, `link.fetchPriority` — all camelCase. Lowercase keys would fail. |
| T-03-15 (Preload reveals AVIF URLs) | **accepted** | Marketing assets are intentionally public per VISUAL-02. |
| T-03-16 (imageSizes ↔ sizes drift) | **mitigated** | `index.head.test.tsx` test 4 asserts the literal `"(min-width:1280px) 1280px, 100vw"`; Plan 03-02's `<picture>` test asserts the same literal. Either side drifting trips a test. |
| T-03-17 (400lvh feels stuck on low-precision setups) | **accepted** | Mitigation deferred to Plan 05 D-17 visual scrub-through checkpoint. |
| T-03-18 (Future edit reintroduces hardcoded 0.78 in PaperBackdrop) | **mitigated** | MIGRATE-03 AST walker test still GREEN (3/3) — every `useTransform` keyframe is `0`/`1`/Identifier/MemberExpression. A literal `0.78` would fail the walker. |

## Known Stubs

None. Wave 1c finalizes the head() preload, the section height, and the PaperBackdrop cascade — no placeholder values remain in the touched files.

## TDD Gate Compliance

Plan 03-04's frontmatter lists `type: execute` (not `type: tdd`), but Tasks 1, 2, 3 each carry `tdd="true"` per task-level config. The RED→GREEN gate for Task 1 is the existing `index.head.test.tsx` (RED scaffold landed by Plan 03-01, turned GREEN here by `feat(03-04)` commit `a1ac81f`). Tasks 2 and 3 are retunes that update existing GREEN tests to track new constants — their commits are `feat` because they are runtime behavior changes, not pure test additions.

## Self-Check: PASSED

Verified that all claimed artifacts exist on disk and all claimed commits are reachable from HEAD.

- FOUND: src/routes/index.tsx (modified — head() preload landed)
- FOUND: src/components/landing/scroll-choreography/scroll-choreography.tsx (h-[400lvh] on line 131; docstring updated)
- FOUND: src/components/landing/scroll-choreography/scroll-choreography.test.tsx (regex updated to /h-\[400lvh\]/)
- FOUND: src/components/landing/scroll-choreography/paper-backdrop.tsx (3 consts retuned + docstring extended)
- FOUND: .planning/phases/03-product-screen-the-single-shared-element/deferred-items.md (lint re-verification note appended)
- FOUND commit a1ac81f (feat: add LCP preload)
- FOUND commit 0c8e15d (feat: section height retune)
- FOUND commit 2810c28 (feat: PaperBackdrop cascade retune)
