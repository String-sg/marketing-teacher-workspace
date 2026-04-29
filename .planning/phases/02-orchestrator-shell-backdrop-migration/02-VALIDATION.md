---
phase: 2
slug: orchestrator-shell-backdrop-migration
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-29
---

# Phase 2 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest 3.2.4 + @testing-library/react 16.3.2 + jsdom 27.4.0 |
| **Config file** | `vitest.config.ts` (Phase 1 — no Phase 2 changes needed) |
| **Setup file** | `vitest.setup.ts` (Phase 1 — `matchMedia` shim + `afterEach(cleanup)`) |
| **Quick run command** | `pnpm test --run` |
| **Full suite command** | `pnpm test --run && pnpm typecheck && pnpm build` |
| **Estimated runtime** | ~5 seconds (Phase 1's 31 tests run ~3s; Phase 2 adds 10–15) |

---

## Sampling Rate

- **After every task commit:** Run `pnpm test --run`
- **After every plan wave:** Run `pnpm test --run && pnpm typecheck && pnpm build`
- **Before `/gsd-verify-work`:** Full suite must be green AND `pnpm preview` smoke for FOUND-04 / OQ-1
- **Max feedback latency:** 5 seconds (quick); 15 seconds (full suite + build)

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 02-01-01 | 01 | 0 | (Wave 0 stubs — all req IDs covered) | — | N/A | unit (fail-loudly) | `pnpm test --run` | ❌ W0 | ⬜ pending |
| 02-02-01 | 02 | 1 | MIGRATE-01, CHOREO-02 | — | N/A | unit | `pnpm test --run -- paper-backdrop.test.tsx` | ❌ W0 | ⬜ pending |
| 02-02-02 | 02 | 1 | CHOREO-08 | — | N/A | unit (motion-value mock) | `pnpm test --run -- paper-backdrop.test.tsx` | ❌ W0 | ⬜ pending |
| 02-02-03 | 02 | 1 | MIGRATE-02 (clouds + stage opacity → useTransform) | — | N/A | unit | `pnpm test --run -- choreography-rerender-budget.test.tsx` | ❌ W0 | ⬜ pending |
| 02-03-01 | 03 | 1 | CHOREO-01 | — | N/A | unit (mount-counter) | `pnpm test --run -- product-screen.test.tsx` | ❌ W0 | ⬜ pending |
| 02-03-02 | 03 | 1 | MIGRATE-02 (screenOpacity → useTransform) | — | N/A | unit | `pnpm test --run -- product-screen.test.tsx` | ❌ W0 | ⬜ pending |
| 02-04-01 | 04 | 2 | CHOREO-07, MIGRATE-04 | — | N/A | unit (className + landmark) | `pnpm test --run -- scroll-choreography.test.tsx && pnpm test --run -- header-stacking.test.tsx` | ❌ W0 | ⬜ pending |
| 02-04-02 | 04 | 2 | CHOREO-06 (orchestrator mode-switch) + FOUND-04 contract | — | N/A | unit (mode matrix + call-signature) | `pnpm test --run -- scroll-choreography.test.tsx` | ❌ W0 | ⬜ pending |
| 02-04-03 | 04 | 2 | MIGRATE-03 (no inline magic-number tuples) | — | N/A | static-analysis (AST) | `pnpm test --run -- migrate-03-keyframe-binding.test.ts` | ❌ W0 | ⬜ pending |
| 02-04-04 | 04 | 2 | PERF-04 (no forbidden animated properties) | — | N/A | static-analysis (AST) | `pnpm test --run -- migrate-perf-04.test.ts` | ❌ W0 | ⬜ pending |
| 02-05-01 | 05 | 3 | (Routes swap) | — | N/A | integration (route render) | `pnpm test --run -- routes-index.test.tsx` (or covered by existing landmark-audit.test.tsx) | ✅ existing | ⬜ pending |
| 02-05-02 | 05 | 3 | FOUND-04 / OQ-1 verification | — | N/A | manual smoke | `pnpm build && pnpm preview` + hard-refresh mid-page | manual | ⬜ pending |
| 02-05-03 | 05 | 3 | STAGES.wow.window retune | — | N/A | unit (stages.test.ts updated) | `pnpm test --run -- stages.test.ts` | ✅ existing | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

> Task IDs are illustrative — final IDs come from PLAN.md frontmatter once plans are written.

---

## Wave 0 Requirements

- [ ] `src/components/landing/scroll-choreography/scroll-choreography.test.tsx` — covers CHOREO-07 (className), 4-case mode switch (D-21), `useScroll` `layoutEffect: false` call signature assertion (OQ-1 contract), `.scroll-choreography-only` className assertion
- [ ] `src/components/landing/scroll-choreography/paper-backdrop.test.tsx` — covers MIGRATE-01 (renders illustration + video + clouds), CHOREO-02 (video element present, screen overlay sibling), CHOREO-08 (video gate threshold cross — fires `change` events at `byId("wow").window[1] - 0.01` and `+0.01`, asserts `currentTime` written then `pause()` called), `loadedmetadata` effect lifecycle, useTransform-driven opacity (no `useState` for visual props)
- [ ] `src/components/landing/scroll-choreography/product-screen.test.tsx` — covers CHOREO-01 (mount-counter assertion: same DOM node across 5 simulated scrollYProgress updates), useTransform shape (no `useState` for visual props), Phase 2 hero→wow ramp only (no docking transforms)
- [ ] `src/components/landing/scroll-choreography/header-stacking.test.tsx` — covers MIGRATE-04 (renders `<><SiteHeader/><ScrollChoreography/></>`, asserts `<header>` is NOT a descendant of any element with `transform !== "none"`)
- [ ] `src/components/landing/scroll-choreography/choreography-rerender-budget.test.tsx` — covers CHOREO-06 / SC #2 (mocks scrollYProgress, fires 100 `change` events, asserts ≤ 2 re-renders for `<ScrollChoreography>` and `<PaperBackdrop>`) + MIGRATE-02
- [ ] `src/components/landing/scroll-choreography/migrate-03-keyframe-binding.test.ts` — AST-walk via `@typescript-eslint/parser` over `paper-backdrop.tsx` and `product-screen.tsx`; for every `useTransform(scrollYProgress, [keyframes], [...])` call, assert all keyframe values come from `STAGES`/`byId()` references OR named local constants (no inline numeric literals like `[0, 0.6, 1]`)
- [ ] `src/components/landing/scroll-choreography/migrate-perf-04.test.ts` — AST-walk; assert no `useTransform` call animates `width` / `height` / `top` / `left` / `box-shadow`. Allowed targets: `transform` properties (scale, x, y), `opacity`, `clipPath`
- [ ] `src/components/landing/scroll-choreography/stages.test.ts` (existing — updated) — assert retuned `STAGES.wow.window[1]` value matches the documented retune (D-14 → first-pass `[0.20, 0.78]`)

*If `@typescript-eslint/parser` is not yet a dependency, Wave 0 installs it.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Production-build first-paint flicker on hard refresh mid-page | FOUND-04 / OQ-1 / SC #3 | `useScroll` first-paint timing only reproduces in production build (vite preview); jsdom can't simulate the layout-vs-paint race | `pnpm build && pnpm preview`. Open at `/`. Scroll to ~50%. Hard-refresh (`Cmd+Shift+R`). Observe: page should NOT flash a stage-1-final layout for 1 frame before settling. Capture DevTools-Performance baseline. Document outcome — if no flicker, motion@12.38 fixed it internally; if flicker reproduces, escalate. |
| React DevTools Profiler "0–2 re-renders / sec of continuous scroll" | CHOREO-06 / SC #2 | DevTools Profiler is a manual instrument (no headless equivalent in vitest) | Open page in dev mode. Open React DevTools → Profiler tab. Click record. Smooth-scroll from top to bottom over ~1 second. Stop record. Inspect `<ScrollChoreography>` subtree — assert ≤ 2 re-renders. The `choreography-rerender-budget.test.tsx` is the falsifiable gate; this is the human cross-check. |
| Desktop viewport-resize mid-scroll lurch | CHOREO-07 / SC #4 | jsdom doesn't reflect real browser layout-engine behavior on resize | Open page on desktop. Scroll to mid-stage (e.g., wow). Resize browser window narrower then wider. Observe: no scroll jump, no stage misalignment. |
| Site header visible above choreography at every scroll position | MIGRATE-04 / SC #3 | Visual confirmation of stacking-context behavior in real browsers (jsdom can't simulate `position: sticky` interaction with `transform`) | Open page on desktop. Scroll through all four stages. At every position, click on a header nav link. Assert the click registers and visual focus ring shows. Header should never be hidden behind the morphing screen. |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references (8 test files listed above)
- [ ] No watch-mode flags (`pnpm test --run` is single-pass; never `pnpm test`)
- [ ] Feedback latency < 5s per quick run, < 15s per full suite + build
- [ ] `nyquist_compliant: true` set in frontmatter once plans pass plan-checker

**Approval:** pending
