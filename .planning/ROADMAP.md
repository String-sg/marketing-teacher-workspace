# Roadmap: Teacher Workspace — Marketing Landing

## Overview

Six-phase delivery of a 4-stage shared-element scroll choreography (Hero → Wow → Feature A → Feature B) on the existing TanStack Start landing site. Build order is dependency-driven: types and the static stacked fallback land first as the foundation that the choreography overlays; the orchestrator + paper-backdrop migration land second as one atomic refactor of `paper-hero.tsx`; the shared product-screen element lands third (the centerpiece); copy, trust, OG, and footer wire-in land fourth; cutover to production swaps the live page in fifth; performance, accessibility, and real-device audits ship last. Granularity is **standard** (5–8 phases, 3–5 plans each); parallelization is **enabled** — Phase 2 (backdrop) and Phase 3 (product-screen) can run concurrently after Phase 1 lands the shared types and fallback.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Foundation — Types, Static Fallback, SSR Contract** - Typed `StageDef[]` data model, `<StaticChoreographyFallback>`, SSR-safe `useIsDesktop`, content reshaped, footer + skip-link landmarks
- [x] **Phase 2: Orchestrator Shell + Backdrop Migration** - `<ScrollChoreography>` owns `useScroll`, `<PaperBackdrop>` extracted from `paper-hero.tsx`, `useState` re-render storm eliminated (completed 2026-04-29)
- [ ] **Phase 3: Product Screen — The Single Shared Element** - One persistent `motion.div` morphs across four stage targets (tiny → centered → docked → docked); responsive `srcset` + LCP preload
- [ ] **Phase 4: Stage Copy, Bullet Reveals, Trust Signals, Meta** - Stage copy rewritten, 200–300ms bullet stagger, OG/canonical meta, primary-CTA URL centralized, education trust line
- [ ] **Phase 5: Wire-In, Delete `paper-hero.tsx`, Ship to Production** - `routes/index.tsx` swap, old hero deleted, deploy verified on Vercel — SSR view-source matches first-paint DOM
- [ ] **Phase 6: Performance, A11y Audit, Real-Device, Sign-Off** - Lighthouse no-regression vs current prod, axe-core 0 violations, real iOS Safari smoke, reduced-motion smoke

## Phase Details

### Phase 1: Foundation — Types, Static Fallback, SSR Contract
**Goal**: The page works end-to-end as a static stacked layout reading from a single typed source of truth, with the SSR/hydration contract settled before any animation code lands.
**Depends on**: Nothing (first phase)
**Requirements**: FOUND-01, FOUND-02, FOUND-03, FOUND-04, FOUND-05, FOUND-06, STATIC-01, STATIC-02, STATIC-03, STATIC-04, CONTENT-07, A11Y-01, A11Y-03, A11Y-04, A11Y-07
**Success Criteria** (what must be TRUE):
  1. With JS disabled or `prefers-reduced-motion: reduce`, every word and image of the four stages is reachable as a normal stacked layout — no missing content, no animation artifacts, no hydration warnings in console.
  2. `import type { StageDef, StageId, StageWindow, ScreenTarget }` resolves and the four stages live as `as const`-typed data in `scroll-choreography/stages.ts`; `src/content/landing.ts` exposes `stages: StageCopyContent[]` keyed by `StageId` and a single `TEACHER_WORKSPACE_APP_URL` constant.
  3. Mobile viewport (< 1024px) renders the static fallback by default; the choreography tree is never instantiated on mobile (no orphan `useScroll` observers).
  4. A keyboard user can Tab from the address bar through the entire page in reading order, hit a visible "skip to main content" focusable as the first stop, and see focus rings on every interactive element.
  5. Semantic landmarks (`<header>`, `<main>`, `<footer>`) exist with one `<h1>` and consistent `<h2>`/`<h3>` per stage; a footer with privacy / terms / support links renders on every render path.
**Plans**: 5 plans
  - [x] 01-01-PLAN.md — Wave 0: vitest scaffold + 7 fail-loudly test stubs
  - [x] 01-02-PLAN.md — Wave 1: typed StageDef data model (types.ts + stages.ts)
  - [x] 01-03-PLAN.md — Wave 2: src/content/landing.ts reshape (delete legacy + add stages/proofCopy/finalCtaCopy/footerCopy/TEACHER_WORKSPACE_APP_URL)
  - [x] 01-04-PLAN.md — Wave 3: SSR primitives (useIsDesktop, ScrollChoreographyContext stub, ScrollChoreography stub) + consumer migrations (paper-hero data swap, feature-section, proof-strip, final-cta, email-capture, site-header)
  - [x] 01-05-PLAN.md — Wave 4: StaticChoreographyFallback shell + SiteFooter + SkipLink + CSS backstop + routes wire-in + product-section.tsx shim deletion
**UI hint**: yes

### Phase 2: Orchestrator Shell + Backdrop Migration
**Goal**: A single `<ScrollChoreography>` owns the tall sticky shell and the master `useScroll`, with `<PaperBackdrop>` (illustration + scroll-linked video + cloud parallax) extracted cleanly from `paper-hero.tsx` — and the two known debts (`useState` on scroll, magic-number keyframes) paid down on the way through.
**Depends on**: Phase 1
**Requirements**: CHOREO-01, CHOREO-02, CHOREO-06, CHOREO-07, CHOREO-08, MIGRATE-01, MIGRATE-02, MIGRATE-03, MIGRATE-04, PERF-04
**Success Criteria** (what must be TRUE):
  1. On the desktop landing, the existing hero scroll-linked video continues to scrub during Stage 1 underneath a single shared product-screen `motion.div` that never unmounts; once Stage 2 fully covers it, `video.currentTime` writes are gated off (no GPU work for hidden frames).
  2. React DevTools Profiler shows the choreography tree re-rendering 0–2 times across a one-second continuous scroll — no `useState`-driven opacity values remain in the codebase, all visual values flow through `useTransform → style={{ … : motionValue }}`.
  3. The site header stays visible above the morphing product-screen layer at every scroll position (sticky-parent stacking-context regression check); `useScroll` is called with `layoutEffect: false` and a production (`vite preview`) build shows no first-paint flicker on hard refresh mid-page.
  4. Outer container uses `lvh` and inner sticky container uses `svh`; on a desktop viewport-resize there is no mid-scroll lurch, and no scroll-driven element animates `width`/`height`/`top`/`left`/`box-shadow` (transform/opacity/clip-path only).
  5. All `useTransform` keyframes for stage thresholds resolve through named `STAGES` constants tied to `StageDef.window` — zero inline magic-number tuples remain in component code.
**Plans**: 5 plans
  - [x] 02-01-PLAN.md — Wave 0: vitest scaffold (Phase 1 reuse) + 7 fail-loudly test stubs + stages.test.ts retune assertion + @typescript-eslint/parser devDep
  - [x] 02-02-PLAN.md — Wave 1: PaperBackdrop extraction (paper-card frame + clouds + video + CHOREO-08 video gate; useState→useTransform for stageOpacity/cloudY*; STAGES-bound keyframes)
  - [x] 02-03-PLAN.md — Wave 1: ProductScreen Phase-2 stub (browser frame + screenshot; useTransform screenScale + screenOpacity; hero→wow only; never unmounts; no layoutId)
  - [x] 02-04-PLAN.md — Wave 2: ScrollChoreography orchestrator fill (two-component split per hooks-rules; useScroll w/ layoutEffect:false; provider mount; sticky shell; hero copy children) + STAGES.wow.window retune to [0.20, 0.78]
  - [x] 02-05-PLAN.md — Wave 3: routes/index.tsx swap to <ScrollChoreography> + checkpoint:human-verify for FOUND-04/OQ-1 production smoke + checkpoint:human-verify for STAGES retune visual review
**UI hint**: yes

### Phase 3: Product Screen — The Single Shared Element
**Goal**: The centerpiece — one persistent product-screen `motion.div` morphs convincingly across all four stage targets (Hero tiny → Wow centered → Feature A docked → Feature B docked), with intentional 25%/50%/75% midstates and an LCP-safe responsive image strategy.
**Depends on**: Phase 2
**Requirements**: CHOREO-03, CHOREO-04, CHOREO-05, VISUAL-01, VISUAL-02, VISUAL-03, VISUAL-04, A11Y-05
**Success Criteria** (what must be TRUE):
  1. On a desktop scroll-through, the same DOM node carries the product-UI screenshot from "tiny inside the illustration" (Stage 1) → "centered, near-full-viewport reveal" (Stage 2) → "docked one side" (Stage 3) → "docked other side" (Stage 4) — the element is never unmounted, no `layoutId`, no `AnimatePresence`.
  2. Scrubbing forward and backward at 0.25, 0.50, 0.75 of every stage transition shows an intentionally-designed midstate — no broken-looking layouts, no half-cropped UI, no orphan box-shadow seams.
  3. Tonal contrast between the paper-sketch world and the photorealistic UI is preserved at every stage (the screen is not flattened to match the paper aesthetic), and the canonical browser-frame screenshot of the Student Insights view is the asset rendered.
  4. The product-UI image ships with responsive `srcset` plus WebP/AVIF variants and is preloaded as the LCP candidate via `<link rel="preload" as="image" fetchpriority="high">`; the network panel shows the right variant for the viewport.
  5. The product-screen `<img>` carries descriptive alt text ("Teacher Workspace student view showing attendance, behavior notes, and family messages") that is reachable to screen readers in both choreography and static-fallback render paths.
**Plans**: 5 plans
  - [x] 03-01-PLAN.md — Wave 0: sharp devDep + gen-hero-images.mjs + 12 variants + OQ-04 falsification (NEW index.head.test.tsx)
  - [x] 03-02-PLAN.md — Wave 1a: ProductScreen 4-stage data-driven morph + per-segment ease + scale dip + <picture> + D-13 alt text
  - [x] 03-03-PLAN.md — Wave 1b: stages.ts retune (D-02 STAGES) + runtime SCREEN_TARGETS const + tests
  - [ ] 03-04-PLAN.md — Wave 1c: routes/index.tsx head() preload + h-[400lvh] retune + PaperBackdrop intra-stage const cascade
  - [ ] 03-05-PLAN.md — Wave 2: full suite green-up + D-17 visual-review checkpoint + VISUAL-03 LCP smoke + final commit
**UI hint**: yes
**Research flag**: yes — multi-stop `useTransform` stitching across four stage targets, the clip-path shape transition, and the responsive-image strategy for LCP all benefit from a `/gsd-research-phase` pass before planning.

### Phase 4: Stage Copy, Bullet Reveals, Trust Signals, Meta
**Goal**: The choreography reads as a story — copy lands per stage with the right beat, the proof strip carries an education-appropriate trust line, OG/canonical meta uses the product UI, and every external CTA points to the centralized live-app URL.
**Depends on**: Phase 3
**Requirements**: CONTENT-01, CONTENT-02, CONTENT-03, CONTENT-04, CONTENT-05, CONTENT-06, CONTENT-08, SEO-01, SEO-02, SEO-03
**Success Criteria** (what must be TRUE):
  1. Each stage's copy renders per the locked structure: Hero (5–10 word headline + sub-line), Wow (short caption or none), Feature A (kicker + heading + paragraph + 3 bullets), Feature B (kicker + heading + paragraph + 3 bullets) — all sourced from `landing.ts` `stages` keyed by `StageId`.
  2. On desktop scroll, bullet reveals on stages 3–4 stagger at 200–300ms between bullets; on the static fallback (mobile or reduced-motion), bullets render together immediately — no scroll-gated content is ever invisible to assistive tech.
  3. The proof strip carries an education-appropriate trust line (e.g., "Built with teachers, for teachers") with no fabricated school logos; a single primary CTA per stage points to `TEACHER_WORKSPACE_APP_URL` and the final-CTA section terminates the page after the choreography releases.
  4. Sharing the page in a link preview surfaces the product-UI image as `og:image` (≥ 1200×630) with descriptive `og:image:alt`, the canonical URL meta tag is set, and `<title>`/`<meta description>` reflect the new positioning.
  5. A `grep` of `src/components/landing/` for the live-app hostname returns zero matches outside `src/content/landing.ts` — every external CTA resolves through the centralized constant.
**Plans**: TBD
**UI hint**: yes

### Phase 5: Wire-In, Delete `paper-hero.tsx`, Ship to Production
**Goal**: The live `/` route renders `<ScrollChoreography>` instead of `<PaperHero>`, the old component is deleted, and the cutover is verified on a Vercel production deploy with clean SSR/hydration parity.
**Depends on**: Phase 4
**Requirements**: MIGRATE-05, SHIP-01, SHIP-02
**Success Criteria** (what must be TRUE):
  1. `routes/index.tsx` imports `<ScrollChoreography>` directly; `paper-hero.tsx` is deleted from the repository and the build still succeeds.
  2. The Vercel production deploy at `/` renders the new choreography on desktop and the static fallback on mobile / reduced-motion — no regressions visible vs the staging preview.
  3. `view-source:` of the deployed page contains the stage content; the first-paint DOM matches post-hydration DOM with no React hydration warnings and no console errors (production build, not just dev).
  4. Browser back/forward and hard-refresh mid-page restore scroll position and the choreography reads at the right stage — no production-only `useScroll`-returns-0 flicker (the `layoutEffect: false` fix is verified in production, not just dev).
**Plans**: TBD
**UI hint**: yes

### Phase 6: Performance, A11y Audit, Real-Device, Sign-Off
**Goal**: The deployed page is formally measured against the current-prod baseline — Lighthouse and Core Web Vitals do not regress, axe-core reports 0 violations, real iOS Safari behaves cleanly, and reduced-motion content parity is signed off.
**Depends on**: Phase 5
**Requirements**: PERF-01, PERF-02, PERF-03, PERF-05, A11Y-02, A11Y-06, SHIP-03, SHIP-04
**Success Criteria** (what must be TRUE):
  1. Lighthouse run on the Vercel production URL shows performance score not regressing vs the captured current-prod baseline; LCP ≤ 2.5s and CLS does not regress on a Vercel preview build.
  2. React DevTools Profiler over a one-second continuous scroll shows ≤ 2 component re-renders for the choreography subtree; Chrome DevTools Performance shows no layout/paint events on scroll-driven elements and the video element does no decode work during Stage 2.
  3. axe-core / Lighthouse a11y audit reports 0 violations on the deployed page; a keyboard-only walk-through reaches every CTA, link, and form in reading order with visible focus rings throughout.
  4. Real-device iOS Safari smoke test passes — no address-bar lurch on the static fallback at < 1024px, no rendering glitches during portrait/landscape rotation; the desktop choreography is gated off on the device by viewport.
  5. Reduced-motion smoke test passes: with `prefers-reduced-motion: reduce` set, every word and image of CHOREO-04/05 is visible, no animation artifacts, and the page reads as a coherent stacked layout.
**Plans**: TBD
**Research flag**: yes — PERF-01 + A11Y-01 audit playbook (what tools to run in what order, what thresholds count as "no regression," how to capture a baseline cleanly) and real-device iOS Safari behavior under-specified — likely benefits from `/gsd-research-phase` before planning.

## Parallelization Notes

Granularity = **standard**, parallelization = **true**. Build order is dependency-driven, but two opportunities exist for concurrent work:

- **After Phase 1 lands** (types + static fallback + SSR contract): `<PaperBackdrop>` extraction (Phase 2) and `<ProductScreen>` shape work (Phase 3 prep) can run in parallel — both subscribe to `scrollYProgress` from the orchestrator context but touch independent DOM. Per ARCHITECTURE.md: *"Phase 2's backdrop and Phase 3's screen can overlap if two contributors are available."*
- **Within Phase 4**: copy authoring (CONTENT-01..06,08), CTA-URL centralization (CONTENT-08 cleanup), proof-strip trust line (CONTENT-06), and OG/meta tag work (SEO-01..03) are independent edits with no shared files outside `landing.ts` and the route head — these four streams can run in parallel.

Phase 5 (cutover) and Phase 6 (audit) must be sequential to each other and to Phases 1–4 — they are pure verification gates.

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5 → 6

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation — Types, Static Fallback, SSR Contract | 0/5 | Not started | - |
| 2. Orchestrator Shell + Backdrop Migration | 5/5 | Complete    | 2026-04-29 |
| 3. Product Screen — The Single Shared Element | 0/5 | Not started | - |
| 4. Stage Copy, Bullet Reveals, Trust Signals, Meta | 0/TBD | Not started | - |
| 5. Wire-In, Delete `paper-hero.tsx`, Ship to Production | 0/TBD | Not started | - |
| 6. Performance, A11y Audit, Real-Device, Sign-Off | 0/TBD | Not started | - |

---
*Roadmap created: 2026-04-28*
