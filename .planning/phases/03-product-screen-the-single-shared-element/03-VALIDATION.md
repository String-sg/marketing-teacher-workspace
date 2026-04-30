---
phase: 3
slug: product-screen-the-single-shared-element
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-30
---

# Phase 3 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 3.2.4 + @testing-library/react 16.3.2 + jsdom 27.4.0 |
| **Config file** | `vitest.config.ts` (Phase 1 reuse) |
| **Setup file** | `vitest.setup.ts` (Phase 1 reuse — matchMedia shim) |
| **Quick run command** | `pnpm test src/components/landing/scroll-choreography/` |
| **Full suite command** | `pnpm test && pnpm typecheck && pnpm lint` |
| **Single-file run** | `pnpm test src/components/landing/scroll-choreography/product-screen.test.tsx` |
| **Estimated runtime** | ~5 seconds (warm cache, choreography subdir only); ~15s full suite |

---

## Sampling Rate

- **After every task commit:** `pnpm test src/components/landing/scroll-choreography/`
- **After every plan wave:** `pnpm test && pnpm typecheck && pnpm lint`
- **Before `/gsd-verify-work`:** Full suite green + `checkpoint:human-verify` (D-17) signed off + LCP smoke check via `pnpm preview`
- **Max feedback latency:** 5 seconds (subdir test run)

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 03-01-01 | 01 | 0 | infra | — | N/A | scaffold | `pnpm add -D sharp@latest` | ✅ package.json exists | ⬜ pending |
| 03-01-02 | 01 | 0 | infra | — | N/A | scaffold | `node scripts/gen-hero-images.mjs && ls public/hero/profiles-screen-*.{avif,webp,png} \| wc -l` (expect 12) | ❌ W0 (script + variants new) | ⬜ pending |
| 03-01-03 | 01 | 0 | OQ-04 falsify | — | N/A | smoke | `pnpm test src/routes/index.head.test.tsx` (assert preload link in Route.options.head()) | ❌ W0 (NEW file) | ⬜ pending |
| 03-01-04 | 01 | 0 | test stubs | — | N/A | scaffold | `pnpm test src/components/landing/scroll-choreography/ --run --reporter=default` (red OK at W0) | ✅ existing | ⬜ pending |
| 03-02-01 | 02 | 1 | CHOREO-03/04/05, VISUAL-01/02 | — | N/A | unit | `pnpm test product-screen.test.tsx` | ✅ existing (rewrite) | ⬜ pending |
| 03-02-02 | 02 | 1 | A11Y-05 | — | spec-verbatim alt reaches a11y tree | unit | `pnpm test product-screen.test.tsx -t "A11Y-05"` | ✅ existing | ⬜ pending |
| 03-02-03 | 02 | 1 | VISUAL-03 | — | `<picture>` renders 3 sources | unit | `pnpm test product-screen.test.tsx -t "VISUAL-03"` | ✅ existing | ⬜ pending |
| 03-03-01 | 03 | 1 | infra | — | data-driven `SCREEN_TARGETS` map | unit | `pnpm test stages.test.ts` (asserts SCREEN_TARGETS shape + STAGES retune) | ✅ existing | ⬜ pending |
| 03-04-01 | 04 | 1 | VISUAL-03 (preload) | — | LCP candidate preloads correct AVIF variant | unit | `pnpm test src/routes/index.head.test.tsx` | ❌ W0 NEW | ⬜ pending |
| 03-04-02 | 04 | 1 | CHOREO-03 cascade | — | section-height retune | unit | `pnpm test scroll-choreography.test.tsx -t "h-\\[400lvh\\]"` | ✅ existing (1-line update) | ⬜ pending |
| 03-04-03 | 04 | 1 | CHOREO-08 cascade | — | video-gate auto-tracks new wow.window[1] | unit | `pnpm test paper-backdrop.test.tsx` | ✅ existing | ⬜ pending |
| 03-05-01 | 05 | 2 | VISUAL-04 | — | 25/50/75 midstates intentional | manual | `checkpoint:human-verify` (scrub via `pnpm dev` + arrow-key scroll through 3 morph zones; user signs off) | ✅ checkpoint protocol | ⬜ pending |
| 03-05-02 | 05 | 2 | VISUAL-03 smoke | — | LCP candidate is the AVIF, not video poster | manual | `pnpm build && pnpm preview` → Chrome DevTools Network panel: assert `profiles-screen-*.avif` Priority=High; Performance Insights: LCP element = `<img>` | ✅ smoke protocol | ⬜ pending |
| 03-05-03 | 05 | 2 | regression | — | full suite green | smoke | `pnpm test && pnpm typecheck && pnpm lint` | ✅ existing | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `pnpm add -D sharp@latest` (currently absent from devDependencies)
- [ ] `scripts/gen-hero-images.mjs` (NEW) — sharp-based variant generator; produces 12 files in `public/hero/`
- [ ] Run script once, commit 12 variants alongside source `profiles-screen.png`
- [ ] `src/routes/index.head.test.tsx` (NEW) — falsifies OQ-04 (TanStack Start head() camelCase vs lowercase preload props)
- [ ] Test stubs / red-state baselines for the test files that will be rewritten in Wave 1:
  - `product-screen.test.tsx` — Phase 2 hero→wow assertions stay until Wave 1; Wave 0 may add new failing stubs for CHOREO-04/05 + VISUAL-03
  - `stages.test.ts` — assert SCREEN_TARGETS not yet defined (red-state stub)

*If Wave 0 reveals OQ-04 false (lowercase props work), capture finding in DECISIONS section of CONTEXT.md and proceed with the simpler form. If OQ-04 true (camelCase required), Wave 1 implements with React 19 prop names — no rework cost.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| 25/50/75 midstates feel intentional (no broken layout, no half-cropped UI, no orphan box-shadow seams) | VISUAL-04 | Visual judgment — automated DOM tests can verify the keyframe values exist but not whether the resulting transform reads as "intentional" at scrub | Run `pnpm dev`. Scroll through 3 morph zones via arrow keys: `[0.10, 0.20]` (hero→wow), `[0.55, 0.65]` (wow→fA), `[0.78, 0.85]` (fA→fB). At 25%, 50%, 75% of each morph, screenshot or pause. User judges intentionality. Sign off in CHECKPOINT.md. |
| LCP candidate is the AVIF, not the hero video poster | VISUAL-03 | Lighthouse / Performance Insights interpretation depends on rendering context | `pnpm build && pnpm preview`. Chrome DevTools → Performance Insights → reload page. Expect: LCP element annotation points to `<img>` inside `<picture>`. Network panel: `profiles-screen-1280.avif` (or `1600.avif` on retina) loaded with Priority: High BEFORE main JS bundle. Initiator: `<link rel="preload">` from `index.html`. |
| Tonal contrast preserved at every stage (paper world vs photorealistic UI) | VISUAL-01 | Visual judgment | `pnpm dev`. Scroll through all 4 stages. At each stage, the screenshot should retain its photorealistic styling (rounded-2xl + black/10 border + 30px shadow + bg-white URL bar with `[#f7f7f5]` chrome). NOT flattened to match paper-ink/paper-card aesthetic. |
| Reduced-motion + mobile static fallback still shows the same alt text and image asset (cross-mode parity) | A11Y-05 (static parity) | Phase 5 owns the static-fallback refactor; Phase 3 confirms via VoiceOver/NVDA spot-check | Toggle `prefers-reduced-motion: reduce` in DevTools or shrink viewport <1024px. PaperHero's reduced branch still renders `profiles-screen.png` with descriptive alt. (Phase 5 MIGRATE-05 lands `<picture>` parity in static fallback; Phase 3 only verifies the choreography path.) |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify (the 3 manual checkpoints in Wave 2 are bookended by automated tests in Wave 1 — continuity holds)
- [ ] Wave 0 covers all MISSING references: sharp devDep, gen-hero-images.mjs, 12 variant files, NEW index.head.test.tsx, OQ-04 falsification
- [ ] No watch-mode flags (`pnpm test` runs in single-shot mode by Vitest default)
- [ ] Feedback latency < 5s (subdir test run; ~15s full suite)
- [ ] `nyquist_compliant: true` set in frontmatter — DEFERRED until Wave 0 complete

**Approval:** pending
