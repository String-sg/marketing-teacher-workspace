# Project Research Summary

**Project:** Teacher Workspace — Marketing Landing
**Domain:** Brownfield SaaS marketing landing with scroll-driven shared-element choreography (TanStack Start + React 19 + motion/react)
**Researched:** 2026-04-28
**Confidence:** HIGH

## Executive Summary

Brownfield landing-redesign milestone whose centerpiece is a 4-stage shared-element scroll choreography (Hero → Wow → Feature A → Feature B) on a stack that is already locked: TanStack Start 1.166, React 19.2, Tailwind v4.2, motion/react 12.38. Done = live on Vercel with reduced-motion and mobile static-stack fallbacks shipped alongside. The existing `paper-hero.tsx` already proves the load-bearing primitive (`useScroll` + `useTransform` + `useMotionValueEvent` against a sticky parent, with a `useReducedMotion` branch); this milestone generalizes that pattern from one zone to four under a single orchestrator.

The prescriptive architectural call across all four research files is unanimous and tight: **one tall sticky orchestrator + one persistent product-screen `motion.div` driven by a single shared `MotionValue` exposed via React context — no `layoutId`, no per-stage `useScroll`, no `useState` driven from scroll progress.** Stages are configured as data (a `StageDef[]` with windows + screen targets); copy lives in `src/content/landing.ts` keyed by `StageId`. Mobile and reduced-motion paths collapse to the same `<StaticChoreographyFallback>` reading the same `stages` array — one content tree, two render paths chosen at the orchestrator level. Build order falls out: types/data → context+orchestrator shell → static fallback → backdrop → product screen → copy track → wire-in/delete `paper-hero.tsx` → polish.

Top risks cluster in three buckets: **(1) SSR/hydration correctness** — `useScroll` returning 0 on first paint, `useReducedMotion` returning `null` on the server, and `matchMedia` being client-only must all be settled before stage code lands; mitigation is `layoutEffect: false` plus an SSR-safe `useIsDesktop` that defaults optimistic-desktop or wraps in `<ClientOnly>`. **(2) Stacking-context bugs from transforming a sticky parent** — already a real risk in the current codebase; the morphing screen and header must be siblings of (not descendants of) any transformed sticky child. **(3) Brittle keyframes + `useState`-on-scroll re-render storm** — both already present in `paper-hero.tsx` and explicitly flagged in `.planning/codebase/CONCERNS.md`; the migration is the right moment to fix both by introducing named `STAGES` constants and replacing `useState` setters with `useTransform` motion values. None block the milestone, but every one must be designed for in Phase 1 — going back later is a rewrite.

## Key Findings

### Recommended Stack

Stack is locked and complete — **no new dependencies needed**. motion 12.38 + React 19.2 + Tailwind v4.2 + TanStack Start 1.166 are the right tools and the existing `paper-hero.tsx` already uses the recommended primitives. Discipline to enforce: *which* motion APIs to use (and which to avoid).

**Core technologies (already installed):**
- **`motion@^12.38.0`** — `useScroll`, `useTransform`, `useMotionValueEvent`, `useReducedMotion`, `MotionConfig`. Native ScrollTimeline integration; full React 19 support.
- **`react@19.2.4`** + **`@tanstack/react-router`/Start `1.166`** — choreography is single-route, client-driven; SSR renders static end-state markup.
- **`tailwindcss@4.2.1`** — `sticky`, `h-svh`/`h-lvh`/`h-dvh`, `aspect-[…]`, `clip-path-[…]`, `@container`, `motion-safe:`/`motion-reduce:` variants. No plugins needed.
- **`web-vitals@5.1.0`** — already installed; wire it up to validate PERF-01 vs current prod baseline.

**APIs to AVOID (load-bearing anti-recommendations):**
- `layoutId` / `LayoutGroup` — documented bugs with `position: sticky` (motion #1535, #1580, #2006, #2111). Mount-driven (FLIP); scroll choreography needs progress-driven interpolation.
- Per-stage `useScroll` — drift, double-tracking, redundant observers. One source of truth, share via context.
- `useState` set from `useMotionValueEvent` for visual values — re-render storm at scroll-frame frequency. Use `useTransform` → `style={{ opacity: motionValue }}` instead.
- Animated `box-shadow` with scale; `backdrop-filter` on scroll-linked elements; smooth-scroll polyfills (Lenis, Locomotive); GSAP/ScrollTrigger; `AnimatePresence` for stage transitions.

**Tailwind/CSS patterns:**
- Outer `h-[~360–400vh]` + inner `sticky top-0 h-svh overflow-hidden`. Use `lvh` for outer length on iOS Safari, `svh` for inner viewport.
- Animate `transform`/`opacity`/`clip-path` only — never `width`/`height`/`top`/`left`.
- `z-0` video, `z-10` paper card, `z-20` morph overlay (extends existing `paper-hero.tsx` pattern).

See `.planning/research/STACK.md` for the full prescriptive list with version compatibility.

### Expected Features

Confidence HIGH for primitives and accessibility, MEDIUM for stage-level copy norms (synthesized from the Linear/Stripe/Apple/Notion/Loom/Vercel corpus).

**Must have (table stakes — P1):**
- 4-stage choreography (CHOREO-01..06): pinned scroll, transform/opacity only, single shared element morphing
- Reduced-motion fallback + mobile static stack (collapse to the same `<StaticChoreographyFallback>`)
- Stage-specific copy rewrite (CONTENT-01) — 5–10 word headlines, 3-bullet feature blocks, 200–300ms stagger
- Single primary CTA, centralized URL constant in `src/content/landing.ts` (eliminates the hardcoded-link concern from `.planning/codebase/CONCERNS.md`)
- Performance: no Lighthouse regression vs current prod, LCP ≤ 2.5s, CLS no worse than today
- A11y: skip-link, focus rings, semantic landmarks, h1/h2/h3 hierarchy, alt text on screenshot, no hover-only interactions, keyboard tab order matches reading order
- Footer with privacy/terms/support
- OG/meta tags using product UI image (≥1200×630), canonical URL
- Education-appropriate trust line ("Built with teachers, for teachers" / "Free for individual teachers") — no fabricated school logos

**Should have (differentiators — P2):**
- Subtle UI-region highlight tying bullets to product UI in stages 3–4
- Side-dot scroll progress indicator (relieves "am I stuck?" anxiety on pinned-scroll)
- Theme tone-shift across scroll (warm paper → cooler product) — only if it reinforces the beat
- Subtle parallax on hero illustration only
- Real teacher testimonial (P1 if one exists, P2 otherwise)

**Defer (v2+):**
- Email-capture submission backend (explicit Out of Scope in PROJECT.md)
- Analytics / A/B testing instrumentation (Out of Scope)
- Mobile pinned-scroll choreography (Out of Scope by design)
- Auto-loop product video at Stage 2 (P3 — only if a clip exists)
- Dark mode (no defined dark variant)

**Anti-features (commonly requested, actively harmful):**
- Auto-rotating hero carousel (the choreography *is* the rotation)
- Chatbot widget, exit-intent popup, time-delayed popup (trust violations for K-12)
- Multi-CTA hero / "Book a demo" / pricing table / cookie-banner full-screen overlay
- Sound design, cursor trails, full-page WebGL, typewriter/glitch effects
- Fabricated school-logo strips
- Aggressive scroll-jacking (>4 viewports of pin)

See `.planning/research/FEATURES.md` for the full priority matrix and competitor analysis.

### Architecture Approach

**Single sticky orchestrator + shared `MotionValue` context.** One component (`<ScrollChoreography>`) owns the tall sticky scroll container, the single product-screen DOM node, and the master `useScroll()` hook. Stage components are pure presentational subscribers to a `ScrollChoreographyContext` exposing `scrollYProgress: MotionValue<number>` plus a typed `StageDef[]`. Stages are **data, not branches** — components iterate, never `if (stageId === "hero")`. The product screen is **one absolutely-positioned `motion.div`** transformed by interpolated motion values — never unmounts, never gets a `layoutId`. Reduced-motion and mobile collapse to the same `<StaticChoreographyFallback>` reading the same data.

**Major components (under `src/components/landing/scroll-choreography/`):**

1. **`<ScrollChoreography>`** (`scroll-choreography.tsx`) — owner. Holds `useScroll()`, the `h-[~360vh]` outer + `sticky top-0 h-svh` inner shell, context provider. Switches between `"choreography"` and `"static"` mode via `useReducedMotion()` + `useIsDesktop()`.
2. **`<ProductScreen>`** (`product-screen.tsx`) — single shared `motion.div` containing the browser-frame screenshot. Subscribes to `scrollYProgress` + `stages`; computes scale/x/y/opacity/clip-path via `useTransform`. Never remounts.
3. **`<PaperBackdrop>`** (`paper-backdrop.tsx`) — extracted from current `paper-hero.tsx` body. Carries illustration, scroll-linked video, cloud parallax. Imperative `video.currentTime` updates via `useMotionValueEvent` (preserved verbatim) — gated to hero stage.
4. **`<StageCopyTrack>` + `<StageCopy>`** — per-stage copy panels. Each fades on its own scroll window via `useTransform`.
5. **`<StaticChoreographyFallback>`** — mobile + reduced-motion path. Renders each stage's end-state as a stacked section. Same content tree.
6. **`stages.ts`** + **`types.ts`** — `StageDef` (window + screen target + copyId), `StageId` string-literal union, `StageWindow` tuple, `ScreenTarget`. All `readonly`/`as const`.
7. **`src/content/landing.ts`** (reshaped) — `stages: StageCopyContent[]` keyed by `StageId`, `TEACHER_WORKSPACE_APP_URL` centralized.

**Data flow:** scroll progress flows down via context as a `MotionValue<number>` — never re-rendering React. `paper-hero.tsx`'s current `useState`-driven opacity values are eliminated and replaced with `useTransform`. Single rule: *no `useState` driven by scroll progress.*

**SSR boundaries:** `useScroll` is SSR-safe (defaults to 0 on server). `useReducedMotion` returns `null` server-side — render the animated tree as SSR baseline; opt out on client. `matchMedia` is client-only — gate `useIsDesktop` with `useHydrated()`, optimistic-desktop default, with a CSS `@media (max-width: 1023px)` backstop. No `'use client'` directives needed.

See `.planning/research/ARCHITECTURE.md` for component-by-component file paths, the typed stage data sketch, and the migration table from `paper-hero.tsx`.

### Critical Pitfalls

Top 5 (drawn from 12 in PITFALLS.md). Most must be designed for in Phase 1 or 2 — retrofitting is expensive.

1. **`useState` driven by scroll progress causes a re-render storm** *(already present in `paper-hero.tsx`)* — replace with `useTransform` → `style={{ opacity: motionValue }}`. Phase 2 fix.
2. **Brittle `useTransform` keyframes coupled to content height** *(already in `.planning/codebase/CONCERNS.md`)* — define stages as named `STAGES` constants, fixed-height blocks. Phase 2 establish.
3. **SSR/hydration correctness** — `useScroll` 0 on first paint (motion #2452 → `layoutEffect: false`); `useReducedMotion` `null` server-side; `matchMedia` client-only. All three settled in Phase 1.
4. **Sticky parent transforms break stacking context** — morphing screen and header must be siblings of any transformed sticky child, not descendants. Phase 2 verify.
5. **Reduced-motion fallback hides content (A11Y-01 violation)** — build static stacked layout *first* in Phase 1; choreography is the *enhancement* that overlays it.

Honorable mentions: video underneath an opaque overlay double-paints during stage 2 (gate `currentTime` writes); iOS Safari 100vh jank (`lvh`/`svh` + `min-width: 1024px` gate); full-resolution `profiles-screen.png` blocks LCP (responsive `srcset`, WebP/AVIF, `<link rel="preload" fetchpriority="high">`); scrubbing reveals broken-looking midstates (design 25%/50%/75% explicitly); keyboard tab order desync (DOM order = reading order; all content rendered always).

See `.planning/research/PITFALLS.md` for all 12 with phase mapping and recovery strategies.

## Implications for Roadmap

The four research files converge on a clean dependency-driven build order. Six phases fall out naturally — three foundational, two implementation, one ship.

### Phase 1: Foundation — Types, Static Fallback, SSR Contract

**Why first:** The typed `StageDef`/`StageCopyContent` data model is imported everywhere. The `<StaticChoreographyFallback>` is the foundation the choreography overlays — and it doubles as the reduced-motion + mobile fallback (one component, two consumers). The SSR/hydration contract must settle before stage code lands.

**Delivers:** `types.ts` (`StageId`, `StageDef`, `StageWindow`, `ScreenTarget`, context value), `stages.ts` (four `StageDef` objects with windows + screen targets), `src/content/landing.ts` reshaped (`stages` array keyed by `StageId`, `TEACHER_WORKSPACE_APP_URL` constant), `<StaticChoreographyFallback>` rendering all four stages stacked (page works end-to-end in static mode), `useIsDesktop` (SSR-safe, `useHydrated`-gated, optimistic-desktop default), `<ScrollChoreographyContext>` and `useScrollChoreography()` hook (provider not yet wired).

**Addresses:** Stage-specific copy structure, primary-CTA centralization, mobile static stack, reduced-motion content reachability, semantic landmarks/headings, footer scaffold.

**Avoids pitfalls:** 3 (SSR/`useReducedMotion` mismatch), 4 (reduced-motion content unreachable), 6 (brittle keyframes — established as `STAGES` constants on day 1).

### Phase 2: Orchestrator Shell + Backdrop Migration

**Why second:** Orchestrator and backdrop must land before `<ProductScreen>` or `<StageCopyTrack>` can subscribe to `scrollYProgress`. Splitting `paper-hero.tsx` is the riskiest mechanical change — landing it in its own phase isolates risk and is the right moment to pay down two known debts (`useState`-on-scroll, magic-number keyframes).

**Delivers:** `<ScrollChoreography>` orchestrator with sticky shell, `useScroll({ target, layoutEffect: false })`, mode switch, context provider wired. `<PaperBackdrop>` carrying illustration, video, cloud parallax — extracted from `paper-hero.tsx`, video gated to hero stage. `useState`-driven opacity converted to `useTransform`. Header verified visible above morph layer. Old `paper-hero.tsx` still imported by `routes/index.tsx` (kept as fallback; swap happens in Phase 5).

**Avoids pitfalls:** 1 (`useScroll` `0` flicker), 2 (sticky transform z-index break), 5 (iOS Safari `vh` jank), 12 (`useState` re-render storm), 11 (HMR/remount — verified on Vercel preview).

### Phase 3: Product Screen — The Single Shared Element

**Why third:** Centerpiece (CHOREO-01) but cannot land before orchestrator + backdrop expose `scrollYProgress` and `StageDef`s define screen targets. Tuning scale/x/y/origin/clip-path independently of copy lets the choreography read as a real product reveal even before feature copy lands. Resolves VISUAL-02 (canonical screenshot asset) and Pitfall 10 (LCP).

**Delivers:** `<ProductScreen>` — one persistent absolutely-positioned `motion.div` with browser-frame screenshot, transformed by stitched-keyframe `useTransform` from `stages.ts` (no `layoutId`, never remounted). Responsive `srcset` + WebP/AVIF, `<link rel="preload" fetchpriority="high">` for LCP candidate. Verified at all four targets: hero (tiny inside illustration), wow (centered ~100vw), feature A (docked one side), feature B (docked other side). Designed-and-reviewed midstates at 25%/50%/75%. `pointer-events-none` during transit; re-enabled at docked stages if interactive.

**Avoids pitfalls:** 8 (broken midstates), 10 (LCP regression).

### Phase 4: Stage Copy + Bullet Reveals + Trust Signals

**Why fourth:** Copy lands after screen targets are tuned because bullet stagger timing depends on bullet count (FEATURES.md: *"Stage copy must lock before stage timing"*). With screen choreography stable, copy track is timed against it without re-tuning twice. Closes table-stakes content debts: trust line, OG/meta, footer, centralized primary-CTA URL.

**Delivers:** `<StageCopyTrack>` + `<StageCopy>` rendering each stage's copy with its own opacity/y `useTransform` window. 200–300ms bullet stagger on stages 3–4. CONTENT-01: rewritten copy across all four stages. Education-appropriate trust line in proof strip. OG/meta tags (`og:image` showing product UI, ≥1200×630, with `og:image:alt`), canonical URL. Footer with privacy/terms/support. All hardcoded external CTAs consolidated into `TEACHER_WORKSPACE_APP_URL`.

**Avoids pitfalls:** 6 (keyframes still tied to `STAGES` constants), 8 (sequenced text fades), 9 (DOM order = reading order).

### Phase 5: Wire-In, Delete `paper-hero.tsx`, Switch Live Page

**Why fifth, separately:** By this point `<ScrollChoreography>` is feature-complete. Splitting cutover from polish lets the team verify production behavior on Vercel preview *before* tuning easings — catching any HMR/remount/`useScroll`-in-prod issue (Pitfall 11) on a clean cutover.

**Delivers:** `routes/index.tsx` swap (`<PaperHero/>` → `<ScrollChoreography/>` + existing `<ProofStrip/>` + `<FinalCta/>`). `paper-hero.tsx` deleted; `product-section.tsx` retired if FeatureA/B copy fully replaces it. Vercel preview deploy verified: scroll position on hard refresh, browser back/forward, deep-link to mid-page. SSR `view-source:` matches first-paint DOM (no React hydration warning, no console errors).

**Avoids pitfalls:** 11 (HMR/remount scroll reset), 1 (production-build `useScroll` flicker — verified post-deploy).

### Phase 6: Polish, Performance, A11y Audit, Ship

**Why last:** All content/behavior locked from Phase 5. Quality gate for SHIP-01 — PERF-01 and A11Y-01 formally measured and signed off against actual production behavior, not pre-cutover estimates.

**Delivers:** Lighthouse on Vercel preview vs current prod baseline — LCP ≤ 2.5s, CLS not regressing, performance score not regressing (PERF-01). `web-vitals` one-shot logger for real CLS/INP. Chrome DevTools Performance: no layout/paint events during scroll; video element no decode work during stage 2. React DevTools Profiler: ≤2 component re-renders per second of scroll. Manual QA: keyboard tab reaches every interactive element in reading order; axe-core 0 violations; screen-reader pass on all stages. Real-device iOS Safari test (no address-bar lurch). Reduced-motion toggle pass — every word and image of CHOREO-04/05 visible. High-zoom (200%) sanity check. Optional P2 polish if time permits: side-dot scroll progress indicator, UI-region highlight tied to bullets, hero illustration parallax.

**Avoids pitfalls:** 7 (GPU pressure during stage 2), 9 (a11y audit), 10 (LCP regression confirmed not regressing), 5 (iOS Safari verified on real device), 11 (Vercel preview parity confirmed).

### Phase Ordering Rationale

- **Phase 1 first** because reduced-motion = mobile fallback = the foundation, not an afterthought. Building animation first and retrofitting reduced-motion is a rebuild.
- **Phase 2 owns the `paper-hero.tsx` migration as one atomic unit** — splitting visual JSX and scroll wiring is the riskiest mechanical change. Right moment to pay down the two known debts.
- **Phase 3 (screen) before Phase 4 (copy)** because copy stagger timing depends on screen target tuning — but stage *targets* must lock before *both*.
- **Phase 5 cutover separated from Phase 6 polish** because Vercel-preview verification of Pitfalls 1 and 11 is a "production build only" finding — must be done on a clean cutover.
- **Phase 6 last for measurement integrity** — Lighthouse/web-vitals/Profiler runs only mean something against real production behavior with all content locked.
- **Parallelizable within phases:** ARCHITECTURE.md notes `<PaperBackdrop>` and `<ProductScreen>` can run in parallel after Phase 1 lands — Phase 2's backdrop and Phase 3's screen can overlap if two contributors are available.

### Research Flags

**Phases likely needing deeper research during planning:**
- **Phase 3 (Product Screen):** multi-stop `useTransform` stitching across four stage targets, the clip-path shape transition, and the responsive-image strategy for LCP all benefit from a `/gsd-research-phase` pass.
- **Phase 6 (Polish/Ship):** PERF-01 + A11Y-01 audit playbook deserves a dedicated research pass — what tools to run in what order, what thresholds count as "no regression," how to capture a baseline cleanly. Real-device iOS Safari behavior under-specified.

**Phases with standard patterns (skip phase research, use existing research as the spec):**
- **Phase 1:** STACK + ARCHITECTURE + PITFALLS together fully specify the SSR contract, `useIsDesktop`, `StageDef` shape, static-fallback design.
- **Phase 2:** ARCHITECTURE's `paper-hero.tsx` migration table is concrete field-by-field.
- **Phase 4:** FEATURES' stage-by-stage content patterns + 200–300ms stagger norm are concrete. Copy is creative work.
- **Phase 5:** mechanical cutover.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Context7-verified motion/react, TanStack Start, Tailwind v4. Cross-checked motion changelog and four GitHub issues for `layoutId`+sticky bugs. The brownfield reference (`paper-hero.tsx`) already proves the pattern in production. No version compatibility unknowns. |
| Features | HIGH for primitives & a11y, MEDIUM for stage-level copy norms | Table-stakes, anti-features, accessibility verified against canonical sources (WCAG, MDN, motion accessibility docs, OG protocol). Stage copy patterns (5–10 word headlines, 3-bullet, 200–300ms stagger) synthesized from the Linear/Stripe/Apple/Notion/Loom/Vercel corpus — widely-repeated norms but not single-canonical-source. |
| Architecture | HIGH | Context7-verified motion + TanStack Start docs, codebase mapped under `.planning/codebase/`. The recommended pattern is a generalization of working production code (`paper-hero.tsx`), not a speculative design. |
| Pitfalls | HIGH | Verified against motion.dev official docs, TanStack Start hydration guide, MDN, motion GitHub issues. Two top pitfalls (#6 brittle keyframes, #12 `useState` re-render storm) already in `paper-hero.tsx` and pre-flagged in `.planning/codebase/CONCERNS.md`. |

**Overall confidence:** HIGH

### Gaps to Address

- **Real iOS Safari address-bar behavior** described in PITFALLS.md but not verified on-device. Plan: dedicated real-device test in Phase 6 with `lvh`/`svh` outer/inner units and `min-width: 1024px` gate. If gate is honored, the gap closes by definition.
- **LCP candidate after the choreography lands is unknown** — current prod LCP is the hero illustration; adding a much larger product screenshot may shift LCP to it. Plan: Phase 3 ships responsive `srcset` + preload; Phase 6 verifies on Vercel preview vs current-prod baseline.
- **TanStack Start HMR/remount edge cases** — Pitfall 11 documented but not exhaustively verified. Plan: Phase 5 cutover is the verification gate.
- **Real teacher testimonials don't yet exist** for the proof strip evolution. Plan: until they exist, soft "early access" / "Built with teachers" trust line. Fabricated logos are an explicit anti-feature.
- **Stage-level copy is creative work, not research work.** Phase 4 lands the structure and reasonable first-pass copy; iterate post-ship via plain edits to `landing.ts`.

## Sources

### Primary (HIGH confidence)
- Context7: `/websites/motion_dev` — `useScroll`, `useTransform`, `useMotionValueEvent`, `useSpring`, `useReducedMotion`, `MotionConfig`, `layoutId`, `LayoutGroup`, `MotionValue` re-render semantics
- Context7: `/websites/tanstack_start` — `<ClientOnly>`, `useHydrated()`, hydration-mismatch anti-pattern
- motion.dev/changelog, /docs/react-use-scroll, /docs/react-layout-animations, /docs/react-accessibility, /docs/react-upgrade-guide, /docs/performance, /docs/react-motion-value, /troubleshooting/use-scroll-ref
- TanStack Start: hydration-errors guide
- MDN: Stacking context, prefers-reduced-motion; Open Graph protocol; WCAG 2.2 AA

### Secondary (MEDIUM confidence)
- GitHub motion issues #1535, #1580, #2006, #2111 (`layoutId` + sticky/fixed bugs)
- GitHub motion issues #2452, #2770, #1853, #1687 (`useScroll` edge cases)
- Brownfield reference: `src/components/landing/paper-hero.tsx`
- `.planning/codebase/CONCERNS.md`, `ARCHITECTURE.md`, `STRUCTURE.md`, `CONVENTIONS.md`

### Tertiary (LOW confidence — synthesized norms)
- SaaS landing-page convention articles
- EdTech audience research
- Microinteractions/scroll-progress UX articles

### Project context
- `.planning/PROJECT.md`
- `.planning/research/STACK.md`, `FEATURES.md`, `ARCHITECTURE.md`, `PITFALLS.md`

---

## Roadmapper Hand-off Summary

- **Suggested phases: 6** — Foundation, Orchestrator+Backdrop, Product Screen, Copy+Trust, Wire-In, Polish/Ship
- **Needs research-phase pass:** Phase 3 (multi-stop `useTransform` stitching, LCP responsive-image), Phase 6 (audit playbook, real-device iOS Safari)
- **Standard patterns (skip research):** Phases 1, 2, 4, 5
- **Overall confidence:** HIGH
- **Gaps for planning attention:** real-device iOS Safari, post-cutover LCP candidate, HMR/remount edge cases, real testimonials
