# Phase 2: Orchestrator Shell + Backdrop Migration - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-29
**Phase:** 2-orchestrator-shell-backdrop-migration
**Areas discussed:** Routes wiring & SC #1 verification, PaperBackdrop scope & hero-copy ownership, Phase 2 product-screen scope, Video pause/gating strategy (CHOREO-08)

---

## Routes wiring & SC #1 verification

### Q1: Where does the routes/index.tsx swap happen — Phase 2 or Phase 5?

| Option | Description | Selected |
|--------|-------------|----------|
| Phase 2 swaps; ScrollChoreography branches mode | routes/index.tsx swaps in Phase 2; orchestrator internally renders <StaticChoreographyFallback/> when mode='static'. SC #1 verifiable on prod from end of Phase 2. | ✓ |
| Phase 5 owns the swap; Phase 2 builds offstage | routes/index.tsx still renders StaticChoreographyFallback at end of Phase 2; ScrollChoreography unwired in production. SC #1 verified via dev mode + a test harness route. Honors Phase 1 D-03 strictly. | |
| Phase 2 swaps unconditionally; ScrollChoreography always renders choreography | Phase 2 swaps the route AND ScrollChoreography doesn't branch — always tries to render the choreography tree. Mobile/reduced-motion users gated separately. Riskiest. | |

**User's choice:** Phase 2 swaps; ScrollChoreography branches mode internally.
**Notes:** Resolves the Phase 1 D-03 vs Phase 2 SC #1 conflict. Phase 1 D-03 is hereby revised by Phase 2.

### Q2: How should <ScrollChoreography> determine mode and branch?

| Option | Description | Selected |
|--------|-------------|----------|
| Inline hooks; render fallback directly | ScrollChoreography calls useIsDesktop() + useReducedMotion() at top, computes mode, early-returns StaticChoreographyFallback when static. useScroll only runs in choreography branch. | ✓ |
| Context Provider sets mode; ScrollChoreography is a pure consumer | New ChoreographyProvider wraps ScrollChoreography in routes/index.tsx; calls hooks; provides value. Cleaner separation but adds extra layer for one hook call. | |
| useScroll always runs; CSS .scroll-choreography-only gates visibility | ScrollChoreography always renders choreography tree; existing CSS rule hides on mobile; reduced-motion CSS backstop. Two trees in DOM, only one visible. Doubles DOM work. | |

**User's choice:** Inline hooks; render fallback directly (Recommended).
**Notes:** Mirrors PaperHero's existing branch pattern. The existing context's `mode` field becomes a real value rather than hardcoded 'static'.

### Q3: When does the StaticChoreographyFallback → PaperHero dependency break?

| Option | Description | Selected |
|--------|-------------|----------|
| Phase 5 owns the static-hero refactor | Phase 2 leaves StaticChoreographyFallback using PaperHero. Phase 5's MIGRATE-05 task replaces PaperHero in fallback (with HeroStageStatic or inlined PaperBackdrop reduced branch), THEN deletes paper-hero.tsx. | ✓ |
| Phase 2 also refactors StaticChoreographyFallback to use PaperBackdrop | Phase 2 extracts PaperBackdrop AND refactors fallback. paper-hero.tsx unused at end of Phase 2 (file remains). Phase 5 just deletes file. PaperBackdrop must support 'static' rendering mode from day one. | |
| Phase 2 builds <HeroStageStatic/> alongside PaperBackdrop | Small dedicated <HeroStageStatic/> in Phase 2; StaticChoreographyFallback swaps to it. PaperBackdrop stays choreography-only. paper-hero.tsx unused at end of Phase 2. | |

**User's choice:** Phase 5 owns the static-hero refactor (Recommended).
**Notes:** Keeps Phase 2 scope tight; the static-side refactor is part of the cutover anyway.

---

## PaperBackdrop scope & hero-copy ownership

### Q1: Where does the hero copy (h1 + subline + CTA) live in Phase 2?

| Option | Description | Selected |
|--------|-------------|----------|
| Inline in <ScrollChoreography> body | Hero copy renders directly inside orchestrator's sticky container, alongside PaperBackdrop, with own useTransform-driven opacity/y. Phase 4 later refactors into StageCopy id='hero'. | ✓ |
| Build <HeroCopy/> standalone in Phase 2 | Small <HeroCopy/> component subscribing to context. Phase 4 generalizes into StageCopy id='hero' (rename + parameterize). Throwaway naming risk. | |
| PaperBackdrop carries the hero copy | PaperBackdrop owns illustration + video + clouds AND hero copy. Cleanest mechanical extraction. Phase 4 later splits. Front-loads merging then re-splitting. | |
| Build <StageCopy id='hero'/> + <StageCopyTrack/> early | Anticipate Phase 4 architecture. Cleaner end state but expands Phase 2 work. | |

**User's choice:** Inline in <ScrollChoreography> body (Recommended).
**Notes:** Simplest unit of work; no throwaway component.

### Q2: How does <PaperBackdrop/> consume scrollYProgress?

| Option | Description | Selected |
|--------|-------------|----------|
| Read from context via useScrollChoreography() | PaperBackdrop calls useScrollChoreography() to get { scrollYProgress, stages }, runs own useTransform. Matches research/ARCHITECTURE.md 'pure presentational subscribers' pattern. | ✓ |
| Receive scrollYProgress as a prop | ScrollChoreography passes scrollYProgress as prop. Easier to test in isolation. Diverges from 'context subscriber' pattern. | |
| ScrollChoreography computes useTransform; PaperBackdrop receives plain motion values as props | Centralizes keyframe logic but PaperBackdrop's prop list grows. | |

**User's choice:** Read from context via useScrollChoreography() (Recommended).
**Notes:** Phase 3 ProductScreen + Phase 4 StageCopy follow the same shape — zero variance across consumers.

### Q3: How should PaperBackdrop accommodate hero copy nested inside paper-card?

| Option | Description | Selected |
|--------|-------------|----------|
| PaperBackdrop accepts children; hero copy passes through | PaperBackdrop renders paper-card frame + clouds + illustration/video, accepts children prop. ScrollChoreography passes hero copy as children. Visual behavior preserved 1:1. | ✓ |
| PaperBackdrop is self-contained; hero copy as sibling outside paper-card | PaperBackdrop purely visual. Hero copy moves OUT of paper-card frame. Visual change — hero copy no longer scales with stage. | |
| PaperBackdrop = only clouds + illustration/video; ScrollChoreography owns paper-card | Pull paper-card out of PaperBackdrop; keep in ScrollChoreography. Bigger refactor. | |

**User's choice:** PaperBackdrop accepts children; hero copy passes through (Recommended).
**Notes:** Preserves "hero copy IS in the paper world" storytelling exactly.

### Q4: How strictly do useTransform keyframes resolve through STAGES (MIGRATE-03)?

| Option | Description | Selected |
|--------|-------------|----------|
| Endpoint-only binding; intra-stage timing as named local constants | Stage-aligned keyframes use STAGES[i].window[j]; intra-stage timing values like 0.14 become named constants in component file. Satisfies SC #5 without bloating StageDef. | ✓ |
| Strict binding; every keyframe routes through STAGES | Add fields to StageDef (copyLiftProgress, screenFadeStart) so all timing in stages.ts. Maximizes single-source-of-truth but bloats StageDef. | |
| Helpers like windowOf('hero')[0], stageEnd('wow'), stageStart('feature-a') | Build keyframes.ts helper module. More readable but adds another file. | |

**User's choice:** Endpoint-only binding; intra-stage timing stays as named local constants (Recommended).
**Notes:** ROADMAP SC #5 requires "zero inline magic-number tuples in component code" — named local constants satisfy that.

---

## Phase 2 product-screen scope

### Q1: What does Phase 2 ship for the shared product-screen motion.div?

| Option | Description | Selected |
|--------|-------------|----------|
| Port existing overlay as-is into <ProductScreen/> stub | Lift paper-hero.tsx:196-220 verbatim into new product-screen.tsx. Wires screen motion values through context. Phase 3 expands to all 4 targets + adds responsive srcset + LCP preload. SC #1 satisfied. | ✓ |
| Inline screen motion.div directly in <ScrollChoreography/> body | No <ProductScreen/> file in Phase 2. Phase 3 extracts. Smaller Phase 2 surface; refactor handoff in Phase 3. | |
| Build minimal <ProductScreen/> shell (no visual chrome) | Barebones <motion.div/> with screenScale + opacity, no browser-frame, no profiles-screen.png. DOM node exists; renders nothing visually. | |
| Build full <ProductScreen/> with all 4 stage targets | Anticipate Phase 3 — ship full multi-stop transforms; fill SCREEN_TARGETS map. Bleeds Phase 3 scope. | |

**User's choice:** Port existing overlay as-is into <ProductScreen/> stub (Recommended).
**Notes:** SC #1 satisfied without bleeding Phase 3 work.

### Q2: What does Phase 2 do with SCREEN_TARGETS?

| Option | Description | Selected |
|--------|-------------|----------|
| Defer SCREEN_TARGETS to Phase 3 entirely | Phase 2 ProductScreen hardcodes existing screenScale/screenOpacity inline (using STAGES windows for endpoints). Type alias stays Phase 3 contract. | ✓ |
| Phase 2 partially populates SCREEN_TARGETS with tiny + centered values | Promotes SCREEN_TARGETS from type to runtime const with 2 keys filled. Requires Partial<> or null-allowing shape, weakening types. | |
| Phase 2 ships full SCREEN_TARGETS with first-pass values for all 4 targets | Full map filled; ProductScreen still only animates hero→wow this phase. Bleeds visual-design from Phase 3. | |

**User's choice:** Defer SCREEN_TARGETS to Phase 3 entirely (Recommended).
**Notes:** Cleanest phase boundary.

---

## Video pause/gating strategy (CHOREO-08)

### Q1: When does Phase 2 stop GPU work on the hero video?

| Option | Description | Selected |
|--------|-------------|----------|
| Threshold + video.pause() bound to STAGES.wow.window[1] | useMotionValueEvent on scrollYProgress. When p >= STAGES.wow.window[1], skip currentTime write AND call video.pause(). Resume on scroll-back. Threshold named (MIGRATE-03). Releases decoder. | ✓ |
| Threshold-only, no pause() — just stop currentTime writes | Skip currentTime writes when p crosses threshold; don't call pause(). Browser keeps decoding. Less GPU win. | |
| Tie gating to ProductScreen opacity reaching 1 | Subscribe to ProductScreen's opacity motion value; gate when it reaches 1. Most precise visually but couples PaperBackdrop to ProductScreen state. | |
| IntersectionObserver on a sentinel element | Visibility-driven, decoupled from scroll progress. Adds separate API outside motion/react flow. | |

**User's choice:** Threshold + video.pause() bound to STAGES.wow.window[1] = 0.55 (Recommended, but see Q3 retuning).
**Notes:** Threshold is named (STAGES.wow.window[1]) so MIGRATE-03 is honored. video.pause() is defensive (idempotent on non-autoplay scrub video).

### Q2: Where does the video gate logic live?

| Option | Description | Selected |
|--------|-------------|----------|
| Inside <PaperBackdrop/> | PaperBackdrop owns video element, ref, loadedmetadata effect. Gate logic colocates with what it controls. Subscribes via useScrollChoreography(); useMotionValueEvent for imperative DOM side effects. | ✓ |
| Split into a child <BackdropVideo/> component | PaperBackdrop renders <BackdropVideo/>. Smaller component surfaces; easier to test in isolation. Adds another file; PaperBackdrop becomes near-empty shell. | |
| ScrollChoreography owns the videoRef and gate; PaperBackdrop renders <video> only | ScrollChoreography passes videoRef into PaperBackdrop, runs useMotionValueEvent in orchestrator. Couples orchestrator to video DOM element — conflicts with subscriber pattern. | |

**User's choice:** Inside <PaperBackdrop/> (Recommended).
**Notes:** useMotionValueEvent for imperative DOM side effects (not visual properties) is consistent with CHOREO-06.

### Q3: What's the threshold for "Stage 2 fully covers it"?

| Option | Description | Selected |
|--------|-------------|----------|
| Retune STAGES.wow.window[1] to align with screen-fully-covers | Phase 2 retunes first-pass STAGES windows. wow.window: [0.20, 0.78]. 'Stage 2 fully covers' = 'wow stage complete'. Single source of truth in stages.ts. | ✓ |
| Keep STAGES.wow.window[1] = 0.55, retune screenOpacity to reach 1.0 at p=0.55 | Visual change — screen covers faster than today. May feel rushed. | |
| Define a separate VIDEO_COVERAGE_PROGRESS constant in PaperBackdrop | Don't retune. Two thresholds (wow.window[1] for stage transitions, VIDEO_COVERAGE_PROGRESS for video gate) coexist. Stage 2 fully covers loses tight binding to STAGES. | |

**User's choice:** Retune STAGES.wow.window[1] to align with screen-fully-covers (Recommended).
**Notes:** Phase 1 D-12 explicitly invited Phase 2 retuning. Visually equivalent to today — only the data labels change.

### Q4: Scroll-back behavior?

| Option | Description | Selected |
|--------|-------------|----------|
| Resume currentTime writes (scrub re-engages); video stays muted+playsInline | Resume currentTime writes when p drops back below threshold. Video is muted+playsInline (no autoplay attribute today) — 'play' isn't really happening; scroll-driven scrubber. video.pause() defensive (idempotent on non-playing video). | ✓ |
| Resume currentTime writes AND call video.play() | Defensive in case future work adds autoplay. Adds Promise-handling concern. | |
| Keep video paused; show poster image until scroll-back past threshold completes (debounce) | Adds a debounce mechanism. Probably over-engineering for the scrub use case. | |

**User's choice:** Resume currentTime writes (scrub re-engages) (Recommended).
**Notes:** Symmetric with current scrub behavior. No hysteresis — rapid scroll IS the expected user behavior.

---

## Claude's Discretion

- The exact retuned values for `STAGES.wow.window` (and any cascading adjustments to `feature-a.window` to maintain overlap) — first-pass `[0.20, 0.78]` is a starting point.
- File naming: whether to introduce a `<BackdropVideo/>` child of `<PaperBackdrop/>` or keep video element inline — default to inline unless PaperBackdrop grows past ~200 lines.
- Test file organization (one `paper-backdrop.test.tsx` vs split per concern) — follow Phase 1 conventions.
- Whether to add a `.scroll-choreography-only` class to the choreography subtree as defense-in-depth alongside the JS branch (Phase 1 IN-04). Recommended: yes.
- Exact debounce/hysteresis behavior on the video gate if rapid pause/play during scrub turns out to thrash in practice — first-pass: no hysteresis; revisit only if Profiler / DevTools shows a problem.

## Deferred Ideas

- Multi-target `<ProductScreen/>` (docked-left, docked-right targets, stitched useTransform across all 4 stage windows). → Phase 3.
- Responsive `srcset` + WebP/AVIF + `<link rel="preload" fetchpriority="high">` on the product screenshot. → Phase 3 (VISUAL-03).
- 25%/50%/75% midstate design across stage transitions. → Phase 3 (VISUAL-04).
- `<StageCopyTrack/>` + `<StageCopy/>` extraction; per-stage copy fades for wow/feature-a/feature-b; 200–300ms bullet stagger. → Phase 4 (CONTENT-01..05, 08).
- OG/canonical/title meta + education trust line + footer privacy/terms. → Phase 4 (meta) + project-level (real testimonials).
- `<StaticChoreographyFallback/>` refactor away from `<PaperHero/>` + `paper-hero.tsx` deletion. → Phase 5 (MIGRATE-05).
- Lighthouse no-regression + axe-core 0 violations + iOS Safari real-device smoke + reduced-motion smoke. → Phase 6.
- `SCREEN_TARGETS` runtime values for all 4 targets. → Phase 3.
- Hysteresis / debounce on the video gate. → Revisit only if Profiler/DevTools shows pause/play thrash.
- Per-stage easing curves for the product-screen docking transforms. → Phase 3.
