# Requirements: Teacher Workspace — Marketing Landing

**Defined:** 2026-04-28
**Core Value:** A single scroll-driven choreography that introduces the product UI as a shared element morphing through the page — emerging from the hand-drawn paper world, scaling to a full reveal, then docking to the side as features explain themselves.

## v1 Requirements

### Foundation

- [ ] **FOUND-01**: Typed `StageDef[]` data model defines all four stages (id, scroll window, screen target, copy ref) — single source of truth in `src/components/landing/scroll-choreography/stages.ts`
- [ ] **FOUND-02**: `ScrollChoreographyContext` exposes a single shared `MotionValue<number>` `scrollYProgress` consumed by all stage subscribers
- [ ] **FOUND-03**: SSR-safe `useIsDesktop` hook gates the choreography vs static path; defaults optimistic-desktop with a CSS `@media (max-width: 1023px)` backstop
- [ ] **FOUND-04**: `useScroll` is called with `layoutEffect: false` (production-build correctness fix per motion #2452)
- [ ] **FOUND-05**: `src/content/landing.ts` is reshaped to expose `stages: StageCopyContent[]` keyed by `StageId`
- [ ] **FOUND-06**: Single `TEACHER_WORKSPACE_APP_URL` constant centralizes the live-app destination — no hardcoded external CTA URLs remain in components

### Static Fallback

- [ ] **STATIC-01**: `<StaticChoreographyFallback>` renders all four stages as a stacked, normal-scroll layout reading from the same `stages` data
- [ ] **STATIC-02**: Mobile viewport (< 1024px) renders the static fallback by default
- [ ] **STATIC-03**: Reduced-motion users (`prefers-reduced-motion: reduce`) render the static fallback regardless of viewport
- [ ] **STATIC-04**: Static fallback contains every word and image present in the choreography path — no content gated behind animation

### Choreography

- [ ] **CHOREO-01**: A single product-screen `motion.div` is shared across all four stages; it never unmounts and is not assigned a `layoutId`
- [ ] **CHOREO-02**: Stage 1 (Hero) — product screen sits tiny inside the existing illustration; current scroll-linked hero video continues to play underneath
- [ ] **CHOREO-03**: Stage 2 (Wow) — product screen scales to a centered, near-full-viewport reveal as the user enters the second scroll zone
- [ ] **CHOREO-04**: Stage 3 (Feature A) — product screen docks to one side; "every signal" feature copy and bullets fade in alongside
- [ ] **CHOREO-05**: Stage 4 (Feature B) — product screen docks to the other side (or shifts position); "trends / notes" feature copy and bullets fade in
- [ ] **CHOREO-06**: All scroll-driven visual values use `useTransform` directly into `style` — no `useState` is driven from `useMotionValueEvent` for visual properties
- [ ] **CHOREO-07**: Tall outer container uses `lvh` units, inner sticky container uses `svh` units (iOS Safari address-bar safety)
- [ ] **CHOREO-08**: Existing scroll-linked hero video continues to scrub during Stage 1 only; `currentTime` updates are gated/paused once Stage 2 fully covers it (GPU pressure fix)

### Backdrop Migration

- [ ] **MIGRATE-01**: `paper-hero.tsx`'s illustration, video, and cloud parallax are extracted into a `<PaperBackdrop>` component
- [ ] **MIGRATE-02**: `paper-hero.tsx`'s `useState`-driven opacity values are replaced with `useTransform` motion values (re-render-storm fix)
- [ ] **MIGRATE-03**: Hardcoded magic-number `useTransform` keyframes are replaced with named `STAGES` constants tied to the `StageDef` data model
- [ ] **MIGRATE-04**: Site header remains visible above the morphing product-screen layer at every scroll position (stacking-context regression check)
- [ ] **MIGRATE-05**: After cutover, `paper-hero.tsx` is deleted; `routes/index.tsx` imports `<ScrollChoreography>` directly

### Content

- [ ] **CONTENT-01**: Hero stage has a 5–10 word headline and a sub-line; copy stored in `landing.ts` under `stages.hero`
- [ ] **CONTENT-02**: Wow stage has a short caption (or none) — the product screen does the work; copy stored under `stages.wow`
- [ ] **CONTENT-03**: Feature A stage has a section heading, supporting paragraph, and exactly 3 bullets
- [ ] **CONTENT-04**: Feature B stage has a section heading, supporting paragraph, and exactly 3 bullets
- [ ] **CONTENT-05**: Bullet stagger reveals at 200–300ms between bullets in the choreography path; bullets render together in the static path
- [ ] **CONTENT-06**: Education-appropriate trust line in proof strip ("Built with teachers, for teachers" or equivalent) — no fabricated school logos
- [ ] **CONTENT-07**: Footer with privacy / terms / support links present on every render path
- [ ] **CONTENT-08**: Single primary CTA per stage; final CTA links to `TEACHER_WORKSPACE_APP_URL`

### Visual System

- [ ] **VISUAL-01**: Tonal contrast between paper-sketch world and photorealistic UI is preserved — UI screen is not flattened to match paper aesthetic
- [ ] **VISUAL-02**: Browser-frame screenshot of the Student Insights view (or a refreshed variant) is the canonical product-UI asset
- [ ] **VISUAL-03**: Product-UI image is delivered with responsive `srcset` + WebP/AVIF; LCP candidate is preloaded with `<link rel="preload" fetchpriority="high">`
- [ ] **VISUAL-04**: 25%, 50%, 75% midstates of every stage transition are intentionally designed (no broken-looking scrub points)

### SEO / Meta

- [ ] **SEO-01**: `og:image` (≥ 1200×630) shows the product UI; `og:image:alt` describes it
- [ ] **SEO-02**: Canonical URL meta tag set on the landing route
- [ ] **SEO-03**: `<title>` and `<meta description>` reflect the new positioning

### Performance

- [ ] **PERF-01**: Lighthouse performance score does not regress versus the current production landing
- [ ] **PERF-02**: LCP ≤ 2.5s on a Vercel preview build
- [ ] **PERF-03**: CLS does not regress versus the current production landing
- [ ] **PERF-04**: No animated `width`/`height`/`top`/`left`/`box-shadow` on scroll-driven elements — `transform`/`opacity`/`clip-path` only
- [ ] **PERF-05**: React DevTools Profiler shows ≤ 2 component re-renders per second of continuous scroll

### Accessibility

- [ ] **A11Y-01**: All choreography content is fully reachable for `prefers-reduced-motion: reduce` users via the static fallback
- [ ] **A11Y-02**: Keyboard tab order matches reading order; every stage's interactive elements (CTA, links) reachable in sequence
- [ ] **A11Y-03**: Skip-link to main content present and visible on focus
- [ ] **A11Y-04**: Semantic landmarks (`<header>`, `<main>`, `<footer>`) and one `<h1>` only; per-stage headings use `<h2>`/`<h3>` consistently
- [ ] **A11Y-05**: Product-UI screenshot has descriptive `alt` text
- [ ] **A11Y-06**: axe-core reports 0 violations on the deployed page
- [ ] **A11Y-07**: No hover-only interactions; focus rings visible on all interactive elements

### Ship

- [ ] **SHIP-01**: Page deploys to production (Vercel) on `/`
- [ ] **SHIP-02**: SSR view-source matches first client-paint DOM (no React hydration warnings, no console errors)
- [ ] **SHIP-03**: Real-device iOS Safari smoke test passes (no address-bar lurch, mobile static fallback renders correctly)
- [ ] **SHIP-04**: Reduced-motion smoke test passes (every word and image of CHOREO-04/05 visible)

## v2 Requirements

Deferred — not in current roadmap, but acknowledged.

### Differentiating Polish

- **POLISH-01**: Side-dot scroll progress indicator
- **POLISH-02**: Subtle UI-region highlight tying bullets to specific zones of the product UI in stages 3–4
- **POLISH-03**: Theme tone-shift across scroll (warm paper → cooler product)
- **POLISH-04**: Subtle parallax on hero illustration cloud assets
- **POLISH-05**: Auto-loop product video at Stage 2 (only if a clip becomes available)

### Real Testimonials

- **PROOF-V2-01**: Replace soft "Built with teachers" trust line with a real teacher quote (with permission)
- **PROOF-V2-02**: Add 1–3 additional testimonials in proof strip

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Email-capture submission backend | UI-only this milestone; CRM/webhook wiring is a separate concern |
| Mobile pinned-scroll choreography | Static fallback by design; mobile pinned scroll is engineering cost we won't pay |
| Auto-rotating hero carousel | The choreography *is* the rotation — anti-feature for this caliber of page |
| Marketing chatbot widget / exit-intent popup / time-delayed popup | Trust violations for K-12 teacher audience |
| Multi-CTA hero / "Book a demo" CTA / pricing table | Single primary CTA per stage; no procurement funnel needed |
| Fabricated school-logo strips | Credibility / legal risk; only real, permissioned signals |
| Sound design, cursor trails, full-page WebGL, typewriter/glitch effects | AI-slop patterns; harmful for a polished caliber |
| Cookie banner / full-screen consent overlay | Marketing site collects no PII at this point |
| Dark mode / theme toggle | Paper aesthetic has no defined dark variant |
| Internationalization | Single English landing for now |
| Auth / sign-up flows on the marketing site | Live app handles all auth; marketing only links out |
| Replacing or restyling the paper illustration | Illustration stays; only choreography around it changes |
| Replacing the hero video | Video remains underneath the morphing screen |
| Analytics / A/B testing / conversion instrumentation | Not part of this milestone |
| CMS / content-driven copy | Copy stays inline in `src/content/landing.ts` |
| Adding new product features | Marketing-site milestone only; live app untouched |
| GSAP / ScrollTrigger / Lenis / Locomotive | Stack already has motion/react; second animation library unjustified |
| `layoutId`-based shared element transitions | Documented bugs with `position: sticky`; mount-driven not progress-driven |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| FOUND-01 | Phase 1 | Pending |
| FOUND-02 | Phase 1 | Pending |
| FOUND-03 | Phase 1 | Pending |
| FOUND-04 | Phase 1 | Pending |
| FOUND-05 | Phase 1 | Pending |
| FOUND-06 | Phase 1 | Pending |
| STATIC-01 | Phase 1 | Pending |
| STATIC-02 | Phase 1 | Pending |
| STATIC-03 | Phase 1 | Pending |
| STATIC-04 | Phase 1 | Pending |
| CHOREO-01 | Phase 2 | Pending |
| CHOREO-02 | Phase 2 | Pending |
| CHOREO-03 | Phase 3 | Pending |
| CHOREO-04 | Phase 3 | Pending |
| CHOREO-05 | Phase 3 | Pending |
| CHOREO-06 | Phase 2 | Pending |
| CHOREO-07 | Phase 2 | Pending |
| CHOREO-08 | Phase 2 | Pending |
| MIGRATE-01 | Phase 2 | Pending |
| MIGRATE-02 | Phase 2 | Pending |
| MIGRATE-03 | Phase 2 | Pending |
| MIGRATE-04 | Phase 2 | Pending |
| MIGRATE-05 | Phase 5 | Pending |
| CONTENT-01 | Phase 4 | Pending |
| CONTENT-02 | Phase 4 | Pending |
| CONTENT-03 | Phase 4 | Pending |
| CONTENT-04 | Phase 4 | Pending |
| CONTENT-05 | Phase 4 | Pending |
| CONTENT-06 | Phase 4 | Pending |
| CONTENT-07 | Phase 1 | Pending |
| CONTENT-08 | Phase 4 | Pending |
| VISUAL-01 | Phase 3 | Pending |
| VISUAL-02 | Phase 3 | Pending |
| VISUAL-03 | Phase 3 | Pending |
| VISUAL-04 | Phase 3 | Pending |
| SEO-01 | Phase 4 | Pending |
| SEO-02 | Phase 4 | Pending |
| SEO-03 | Phase 4 | Pending |
| PERF-01 | Phase 6 | Pending |
| PERF-02 | Phase 6 | Pending |
| PERF-03 | Phase 6 | Pending |
| PERF-04 | Phase 2 | Pending |
| PERF-05 | Phase 6 | Pending |
| A11Y-01 | Phase 1 | Pending |
| A11Y-02 | Phase 6 | Pending |
| A11Y-03 | Phase 1 | Pending |
| A11Y-04 | Phase 1 | Pending |
| A11Y-05 | Phase 3 | Pending |
| A11Y-06 | Phase 6 | Pending |
| A11Y-07 | Phase 1 | Pending |
| SHIP-01 | Phase 5 | Pending |
| SHIP-02 | Phase 5 | Pending |
| SHIP-03 | Phase 6 | Pending |
| SHIP-04 | Phase 6 | Pending |

**Coverage:**
- v1 requirements: 53 total
- Mapped to phases: 53
- Unmapped: 0 ✓

> Authoritative mapping derived from `.planning/ROADMAP.md`. All 53 v1 requirements map to exactly one phase. Phase 1 establishes the foundation (types + static fallback + SSR contract); Phase 2 owns the orchestrator + `paper-hero.tsx` migration; Phase 3 lands the shared product-screen and visual asset; Phase 4 lands copy, trust, and meta; Phase 5 cuts over to production; Phase 6 audits and signs off.

---
*Requirements defined: 2026-04-28*
*Last updated: 2026-04-28 — traceability rewritten authoritatively by roadmapper from ROADMAP.md*
