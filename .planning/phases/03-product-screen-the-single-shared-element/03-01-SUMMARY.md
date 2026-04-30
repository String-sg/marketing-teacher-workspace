---
phase: 03-product-screen-the-single-shared-element
plan: 01
subsystem: infra
tags: [phase-3, wave-0, image-pipeline, lcp, sharp, avif, webp, tanstack-head, oq-04]

# Dependency graph
requires:
  - phase: 02-orchestrator-shell-backdrop-migration
    provides: ProductScreen Phase-2 stub, scroll-choreography subtree, head-config absent on /
  - phase: 01-foundation-types-static-fallback-ssr-contract
    provides: SCREEN_TARGETS type contract, STAGES first-pass windows
provides:
  - sharp@0.34.5 devDep for build-time image variant generation
  - "scripts/gen-hero-images.mjs idempotent variant generator (mtime gate)"
  - 12 responsive image variants in public/hero/ (4 widths × 3 formats)
  - "pnpm gen:hero-images package script"
  - "OQ-04 falsification scaffold (src/routes/index.head.test.tsx, RED)"
  - "Bootstrap conventions for scripts/ dir + .head.test.tsx pattern"
affects:
  - 03-02-PLAN (ProductScreen <picture> rewire — consumes the 12 variants)
  - 03-04-PLAN (head() preload landing — turns the falsification test GREEN)
  - 03-05-PLAN (LCP smoke check — needs the variants on disk + preload wired)

# Tech tracking
tech-stack:
  added: [sharp@0.34.5]
  patterns:
    - "Build-time image-variant generation script (sharp + mtime idempotency)"
    - "TanStack head() route-config introspection test (Route.options.head?.())"
    - "HeadShape type-erasure helper (keeps typecheck green when head undefined)"
    - "Per-format quality settings: AVIF q=60 effort=4, WebP q=78 effort=4, PNG compressionLevel=9"

key-files:
  created:
    - scripts/gen-hero-images.mjs
    - public/hero/profiles-screen-640.avif
    - public/hero/profiles-screen-640.webp
    - public/hero/profiles-screen-640.png
    - public/hero/profiles-screen-960.avif
    - public/hero/profiles-screen-960.webp
    - public/hero/profiles-screen-960.png
    - public/hero/profiles-screen-1280.avif
    - public/hero/profiles-screen-1280.webp
    - public/hero/profiles-screen-1280.png
    - public/hero/profiles-screen-1600.avif
    - public/hero/profiles-screen-1600.webp
    - public/hero/profiles-screen-1600.png
    - src/routes/index.head.test.tsx
  modified:
    - package.json
    - pnpm-lock.yaml

key-decisions:
  - "Type-erasure helper (HeadShape) added to head test — TanStack head signature trips strict typecheck on .head?.() with 0 args; documented inline (Rule 3)"
  - "AVIF effort=4 (not 6/9) — q=60 effort=4 hits ~26KB at 1280w (5× smaller than PNG); higher effort = longer build for marginal gains"
  - "Test asserts contract via Route.options.head?.() introspection (no router/render harness)"

patterns-established:
  - "scripts/{name}.mjs pattern for build-time Node tooling (.mjs explicit, double quotes, no semicolons, top-level await, top-of-file comment block with usage)"
  - ".head.test.tsx suffix convention (disambiguates from future index.test.tsx integration test)"
  - "EXPECTED_SIZES const + literal-repeat assertion (catches accidental const-only edits silently changing public contract)"

requirements-completed: [VISUAL-03]

# Metrics
duration: 4min
completed: 2026-04-30
---

# Phase 3 Plan 01: Wave 0 Infrastructure Summary

**sharp@0.34.5 devDep + idempotent variant generator + 12 committed image variants in public/hero/ + OQ-04 falsification test (RED) — unblocks Plans 02/03/04**

## Performance

- **Duration:** ~4 min
- **Started:** 2026-04-30T05:29:26Z
- **Completed:** 2026-04-30T05:33:25Z
- **Tasks:** 3 / 3 complete
- **Files created:** 14 (1 script + 12 image variants + 1 test)
- **Files modified:** 2 (package.json + pnpm-lock.yaml)

## Accomplishments

- **sharp@0.34.5 added as devDep** (`pnpm add -D sharp@^0.34.5`); native binary loads cleanly via prebuilt artifacts (no `pnpm approve-builds` step needed in CI).
- **Idempotent variant generator at `scripts/gen-hero-images.mjs`** — first run wrote all 12 variants in ~3s; second run skipped all 12 via mtime gate. Source `profiles-screen.png` (136802 bytes) preserved unchanged.
- **12 responsive variants committed** in `public/hero/`: 4 widths (640/960/1280/1600) × 3 formats (avif/webp/png). At 1280w the AVIF is ~26KB vs PNG's ~140KB — the LCP win Plan 04 will measure.
- **`pnpm gen:hero-images` package script** added; existing 7 scripts byte-unchanged.
- **OQ-04 falsification scaffold** at `src/routes/index.head.test.tsx`: 5 assertions on `Route.options.head?.()` shape (camelCase keys, AVIF widths, byte-matched `imageSizes` per web.dev). Currently RED (head() not yet implemented) — Plan 04 turns it GREEN.
- **Existing 47 choreography tests stay GREEN** post-Wave 0; **`pnpm typecheck` exits 0**.

## Task Commits

1. **Task 1: Add sharp devDep + gen:hero-images package script** — `749ae32` (chore)
2. **Task 2: Write scripts/gen-hero-images.mjs and run it once** — `f2d8c0e` (feat)
3. **Task 3: Write src/routes/index.head.test.tsx (OQ-04 falsification scaffold)** — `855a2fe` (test)

## Files Created/Modified

**Created:**
- `scripts/gen-hero-images.mjs` — sharp-based variant generator; reads `public/hero/profiles-screen.png`, writes 12 variants with sRGB metadata preserved; mtime-gated idempotency.
- `public/hero/profiles-screen-{640,960,1280,1600}.{avif,webp,png}` — 12 generated assets (4 widths × 3 formats); committed alongside source PNG per CONTEXT.md D-10.
- `src/routes/index.head.test.tsx` — 5-assertion fail-loudly test for the head() preload contract. RED at Wave 0; Plan 04 (Wave 1c) lands the head() body and turns it GREEN.

**Modified:**
- `package.json` — added `"gen:hero-images": "node scripts/gen-hero-images.mjs"` script (after `typecheck`); added `"sharp": "^0.34.5"` to devDependencies. 7 existing scripts unchanged byte-for-byte.
- `pnpm-lock.yaml` — sharp's transitive dep tree (~3s install on first run, cached after).

## Decisions Made

- **AVIF q=60 effort=4** chosen over higher effort levels (effort 6/9 raise build time without proportional size gain at marketing-asset scale). RESEARCH.md Pattern 2 verified.
- **WebP effort=4** (the sharp default is 4; explicitly stated for parity with AVIF effort).
- **PNG `compressionLevel: 9`** (max compression, no quality loss — PNG is the universal fallback).
- **Idempotency strategy: mtime comparison, not hash** — script is run rarely + manually; mtime is sufficient and avoids re-encoding cost on every CI run if the script ever joins a hook later.
- **OQ-04 test approach: route-config introspection** (`Route.options.head?.()`) rather than full router-render harness. Documented inline — TanStack Start's head() callback is a pure function returning a plain object, so introspection is the cheapest assertion surface.
- **HeadShape type-erasure helper added** (Rule 3 deviation; see below) — keeps typecheck green at Wave 0 (head undefined) and after Plan 04 lands head() (synchronous return). Documented in the test file's docstring.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Type-erasure helper added to OQ-04 test for typecheck compatibility**

- **Found during:** Task 3 (`src/routes/index.head.test.tsx`)
- **Issue:** TanStack Start's installed `head` signature is `head: (ctx: HeadContext) => Awaitable<HeadContent>`. Calling it as `Route.options.head?.()` (the plan's literal example) trips two strict-mode TS errors per usage:
  1. **TS2554** — "Expected 1 arguments, but got 0" (head() requires the ctx arg).
  2. **TS2339** — "Property 'links' does not exist on type Awaitable<...>" (return type is a Promise union, hiding `.links` behind `Awaited<>`).

  The plan's overall verification spec requires `pnpm typecheck` to exit 0; a literal copy of the plan's skeleton would have failed typecheck (5 errors).
- **Fix:** Introduced a single `HeadShape` type + `getHeadLinks()` helper that casts `Route` via `as unknown as HeadShape` to a minimal synchronous-call shape, then each test reads `getHeadLinks()` instead of `Route.options.head?.()` directly. The cast is documented in the file header docstring.
- **Files modified:** `src/routes/index.head.test.tsx` only.
- **Verification:** `pnpm typecheck` exits 0; `pnpm test src/routes/index.head.test.tsx` still RED with 5 failing assertions (preserves OQ-04 falsification semantics — test fails on missing head() body, not on type errors).
- **Committed in:** `855a2fe` (Task 3 commit).

---

**Total deviations:** 1 auto-fixed (1 blocking — Rule 3)
**Impact on plan:** Necessary to satisfy plan's own `<verification>` clause (`pnpm typecheck` exit 0). The fix preserves all 5 assertion criteria and the RED-state semantics; only the calling shape was adjusted. No scope creep.

## Issues Encountered

- **pnpm `Ignored build scripts` warning during sharp install** — pnpm v10 defaults to ignoring native build scripts (esbuild, msw, sharp, unrs-resolver). Sharp ships prebuilt binaries for darwin-arm64 (this dev machine), so `node -e "require('sharp')"` succeeds without `pnpm approve-builds`. **Watch:** if CI runs on a less-common arch (e.g., Vercel build → linux-x64), sharp's postinstall normally fetches a prebuilt; if CI fails on `Ignored build scripts`, run `pnpm approve-builds` once locally and commit the resulting `.npmrc` / `pnpm-workspace.yaml` change. No action needed at Wave 0.

## User Setup Required

None — no external service configuration required. All Wave 0 artifacts are local devDeps + committed assets + a local test scaffold.

## Next Phase Readiness

- **Plans 02 (ProductScreen `<picture>` rewire)** — UNBLOCKED. The 12 variants are at the exact paths Plan 02 references in its `<picture>`/`<source>`/`<img>` `srcSet` attributes.
- **Plan 03 (stages.ts SCREEN_TARGETS retune)** — independent of Wave 0; was already unblocked.
- **Plan 04 (head() preload landing + h-[400lvh])** — UNBLOCKED. The OQ-04 falsification test is in place; Plan 04 implements the head() body referenced by the test. The `imageSizes` value is byte-locked to `(min-width:1280px) 1280px, 100vw` (asserted twice — via the const and the literal-repeat assertion).
- **Plan 05 (visual-review checkpoint + LCP smoke)** — UNBLOCKED. The variants are committed; `pnpm preview` after Plans 02/04 can verify the AVIF is the LCP candidate.

**Concerns / watch-items for downstream:**
- Plan 04 implementer should remove or adapt the `HeadShape` type-erasure helper *only if* it conflicts with the GREEN state. The helper is a `as unknown as HeadShape` cast that survives any TanStack Start signature evolution; safest to keep it.
- Phase 3 wave 0 does NOT add a `pnpm prebuild` hook — variants are checked-in artifacts (D-10 default). If contributors edit `profiles-screen.png` and forget to re-run `pnpm gen:hero-images`, the mtime gate ensures the next run regenerates exactly the changed-source variants.

## Self-Check: PASSED

**Files claimed created — verified on disk:**
- `scripts/gen-hero-images.mjs` — FOUND
- `public/hero/profiles-screen-640.avif` — FOUND
- `public/hero/profiles-screen-640.webp` — FOUND
- `public/hero/profiles-screen-640.png` — FOUND
- `public/hero/profiles-screen-960.avif` — FOUND
- `public/hero/profiles-screen-960.webp` — FOUND
- `public/hero/profiles-screen-960.png` — FOUND
- `public/hero/profiles-screen-1280.avif` — FOUND
- `public/hero/profiles-screen-1280.webp` — FOUND
- `public/hero/profiles-screen-1280.png` — FOUND
- `public/hero/profiles-screen-1600.avif` — FOUND
- `public/hero/profiles-screen-1600.webp` — FOUND
- `public/hero/profiles-screen-1600.png` — FOUND
- `src/routes/index.head.test.tsx` — FOUND

**Commit hashes claimed — verified in git log:**
- `749ae32` (Task 1) — FOUND
- `f2d8c0e` (Task 2) — FOUND
- `855a2fe` (Task 3) — FOUND

---

*Phase: 03-product-screen-the-single-shared-element*
*Completed: 2026-04-30*
