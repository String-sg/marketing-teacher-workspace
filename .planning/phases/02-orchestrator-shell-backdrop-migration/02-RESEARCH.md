# Phase 2: Orchestrator Shell + Backdrop Migration — Research

**Researched:** 2026-04-29
**Domain:** Filling the `<ScrollChoreography>` orchestrator stub + extracting `<PaperBackdrop>` and `<ProductScreen>` from `paper-hero.tsx` (motion 12.38 + React 19.2 + TanStack Start 1.168 + Tailwind v4.2)
**Confidence:** HIGH for stack APIs, paper-hero extraction surface, test pattern; **MEDIUM** for STAGES retuning (visual-design first-pass values); **LOW** for the FOUND-04 `layoutEffect: false` contract Phase 1 encoded — see § Critical Verification Finding.

## Summary

Phase 2 fills `scroll-choreography.tsx`'s `return null` body with a real orchestrator that calls `useScroll`, mounts a real provider, and branches mode internally so `routes/index.tsx` can swap from `<StaticChoreographyFallback>` to `<ScrollChoreography>` (CONTEXT.md D-01 revises Phase 1 D-03). It extracts the paper-card frame + clouds + scroll-linked video from `paper-hero.tsx:112–194` into `<PaperBackdrop>` and the screen overlay from `paper-hero.tsx:196–220` into `<ProductScreen>`. The `useState`-on-scroll re-render storm (`paper-hero.tsx:64–78`) and inline magic-number `useTransform` keyframes (`paper-hero.tsx:50–62`) are paid down on the way through. CHOREO-08's video gate becomes a `useMotionValueEvent`-driven imperative call gated on `STAGES.wow.window[1]`. CONTEXT.md D-12 hands Phase 2 a license to retune `STAGES.wow.window[1]` once visual review is possible.

**Primary recommendation:** Implement `<ScrollChoreography>` as a single ~150-line file that does mode-switch first (early-return for static) then renders provider + sticky shell + `<PaperBackdrop>`-with-children-hero-copy + `<ProductScreen>`. Drive every visual prop through `useTransform` and reserve `useMotionValueEvent` strictly for `video.currentTime` writes and `video.pause()`. Tag the orchestrator's tall outer container with `className="scroll-choreography-only"` (defense-in-depth alongside the JS branch). **Critical:** before writing the `useScroll` call, surface OQ-1 below — the FOUND-04 `layoutEffect: false` contract appears not to map to a real option in motion 12.38; verify on a `vite preview` build whether the production-flicker bug still reproduces, and adjust the contract if it does not.

## User Constraints (from CONTEXT.md)

### Locked Decisions

**Routes wiring & mode switch (revising Phase 1 D-03)**
- **D-01:** `routes/index.tsx` swaps `<StaticChoreographyFallback/>` → `<ScrollChoreography/>` in Phase 2. Orchestrator internally renders `<StaticChoreographyFallback/>` when `mode === "static"`. Phase 5's route edit collapses to optional import-path tightening + removing the now-unused direct `<StaticChoreographyFallback/>` import. Phase 1 D-03 is hereby revised by Phase 2.
- **D-02:** `<ScrollChoreography>` calls `useIsDesktop()` + `useReducedMotion()` inline at top, computes `mode = (isDesktop && !prefersReducedMotion) ? "choreography" : "static"`, early-returns `<StaticChoreographyFallback/>` when static. `useScroll({ target, offset, layoutEffect: false })` only runs in the choreography branch.
- **D-03:** Phase 2 does NOT touch `<StaticChoreographyFallback/>`. It still renders `<PaperHero/>` for its Stage 1 rendering. Phase 5's MIGRATE-05 owns the PaperHero refactor + paper-hero.tsx deletion.

**`<PaperBackdrop/>` component contract**
- **D-04:** `<PaperBackdrop/>` lives at `src/components/landing/scroll-choreography/paper-backdrop.tsx`.
- **D-05:** `<PaperBackdrop/>` consumes `scrollYProgress` via `useScrollChoreography()`; calls its own `useTransform` for `stageScale` / `cloudYLeft` / `cloudYRight` plus `useMotionValueEvent` for the imperative video gate. Phase 3 `<ProductScreen/>` and Phase 4 `<StageCopy/>` follow the same context-subscribing API.
- **D-06:** `<PaperBackdrop/>` renders the paper-card stage frame (with `stageScale` + `transformOrigin: "50% 92%"`) + clouds + illustration/video. Accepts a `children` prop nested inside the paper-card frame. Orchestrator passes the hero copy block as `children`.
- **D-07:** Hero copy renders inline in `<ScrollChoreography/>`'s body, with its own `useTransform`-driven `copyOpacity` + `copyY`. Phase 4 refactors into `<StageCopy id="hero">` without changing visuals.

**`<ProductScreen/>` Phase-2 stub scope**
- **D-08:** `<ProductScreen/>` lives at `src/components/landing/scroll-choreography/product-screen.tsx`. Phase 2 ports `paper-hero.tsx:196–220` verbatim. Renders as sibling of `<PaperBackdrop/>` inside the orchestrator's sticky container, absolute-positioned `inset-0 z-20`. Subscribes to `scrollYProgress` via `useScrollChoreography()`.
- **D-09:** Phase 2's `<ProductScreen/>` only animates the **hero → wow** transition (`screenScale` + `screenOpacity`). Does NOT dock to feature-a or feature-b. Phase 3 expands to all 4 stage targets.
- **D-10:** `screenOpacity` becomes a `useTransform`-derived `MotionValue<number>`. Same migration applies to `stageOpacity` and `copyOpacity`. This is the MIGRATE-02 / CHOREO-06 fix.
- **D-11:** `SCREEN_TARGETS` stays a type alias only. `<ProductScreen/>` hardcodes its `screenScale` + `screenOpacity` inline using `STAGES[i].window[j]` for stage-aligned endpoints.

**MIGRATE-03 keyframe resolution (endpoint-only binding)**
- **D-12:** Stage-aligned keyframes reference `STAGES[i].window[j]` or `byId("stage").window[j]` directly — no helper module. Example: `useTransform(p, [byId("hero").window[0], byId("wow").window[1]], [...])`.
- **D-13:** Intra-stage timing values live as named local constants in the component file:
  ```ts
  const HERO_COPY_LIFT_PROGRESS = 0.14
  const STAGE_SCALE_MID = 0.6
  ```
- **D-14:** `STAGES.wow.window[1]` is **retuned in Phase 2** (extending Phase 1 D-12's "first-pass, tunable" license). First-pass target: `wow.window: [0.20, 0.78]`; `feature-a.window` adjusts to overlap. Exact retuning happens during execution against visual review.

**CHOREO-08 video gate**
- **D-15:** Gate logic lives **inside `<PaperBackdrop/>`**. `useMotionValueEvent` for the imperative gate is consistent with CHOREO-06: setting `video.currentTime` is not a visual prop.
- **D-16:** Gate threshold = `STAGES.wow.window[1]`. When `p >= threshold`: skip `currentTime` write AND call `video.pause()` (defensive — idempotent on muted non-autoplay scrub video). When `p` drops below: resume `currentTime` writes. **No hysteresis.**
- **D-17:** The `loadedmetadata` effect moves into `<PaperBackdrop/>` with dep array `[]` (mount/unmount only — `reduced` doesn't exist in PaperBackdrop's world).

**Stacking & stickying (CHOREO-07, MIGRATE-04)**
- **D-18:** Outer tall container uses `lvh` (`h-[280lvh]` first-pass — exact value tunable). Inner sticky container uses `svh` (`h-svh`). No `vh` units anywhere in the choreography subtree.
- **D-19:** SiteHeader renders OUTSIDE the choreography subtree and naturally stacks above. Phase 2 adds a smoke test asserting `<header>` is reachable / clickable above the morph layer at every scroll position. **Verification, not modification.**

**`useScroll` configuration**
- **D-20:** `useScroll({ target: sectionRef, offset: ["start start", "end end"], layoutEffect: false })`. Same `target` + `offset` shape as current paper-hero.tsx. No `container` parameter (default = window scroll).

**Testing strategy**
- **D-21:** Phase 2 ships unit tests for the orchestrator's mode switch (4 cases), a "never unmounts" assertion for `<ProductScreen/>`, and a `useScroll` `layoutEffect: false` call-signature assertion. The CHOREO-06 / SC #2 "0–2 re-renders/sec" check happens via React DevTools Profiler smoke during a `checkpoint:human-verify` gate.

### Claude's Discretion

- The exact retuned values for `STAGES.wow.window` (and any cascading adjustments to `feature-a.window` to maintain overlap) — first-pass `[0.20, 0.78]` is a starting point. Planner / executor can adjust during visual review.
- File naming: whether to introduce a `<BackdropVideo/>` child of `<PaperBackdrop/>` or keep video element inline — default to inline unless PaperBackdrop grows past ~200 lines.
- Test file organization (one `paper-backdrop.test.tsx` vs split per concern) — follow Phase 1 conventions (one test file per source file).
- Whether to add a `.scroll-choreography-only` class to the choreography subtree as defense-in-depth alongside the JS branch (Phase 1 styles.css:226–230 already has the rule waiting for a consumer — IN-04 in Phase 1 REVIEW). **Recommended: yes, add the class to the orchestrator's tall outer container.**
- Exact debounce/hysteresis behavior on the video gate if rapid pause/play during scrub thrashes in practice — first-pass: no hysteresis; revisit only if Profiler / DevTools shows a problem.

### Deferred Ideas (OUT OF SCOPE)

- Multi-target `<ProductScreen/>` (docked-left, docked-right; stitched useTransform across all 4 stage windows) — Phase 3.
- Responsive `srcset` + WebP/AVIF + `<link rel="preload" fetchpriority="high">` on the product screenshot — Phase 3 (VISUAL-03).
- 25%/50%/75% midstate design across stage transitions — Phase 3 (VISUAL-04).
- `<StageCopyTrack/>` + `<StageCopy/>` extraction; per-stage copy fades for wow/feature-a/feature-b; 200–300ms bullet stagger — Phase 4 (CONTENT-01..05, 08).
- OG/canonical/title meta + education trust line + footer privacy/terms — Phase 4.
- `<StaticChoreographyFallback/>` refactor away from `<PaperHero/>` + `paper-hero.tsx` deletion — Phase 5 (MIGRATE-05).
- Lighthouse no-regression + axe-core 0 violations + iOS Safari real-device smoke + reduced-motion smoke — Phase 6.
- `SCREEN_TARGETS` runtime values — Phase 3.
- Hysteresis / debounce on the video gate — revisit only if Profiler shows pause/play thrash.
- Per-stage easing curves for the product-screen docking transforms — Phase 3.

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| CHOREO-01 | A single product-screen `motion.div` is shared across all four stages; never unmounts; not assigned a `layoutId` | § ProductScreen Mount Stability — D-08 ports the existing `motion.div`; the never-unmount property is Wave 0 verified by mount-counter test |
| CHOREO-02 | Stage 1 (Hero) — product screen sits tiny inside the existing illustration; current scroll-linked hero video continues to play underneath | § PaperBackdrop Extraction — paper-hero.tsx:112–194 carries the illustration/video; ProductScreen overlay renders at `inset-0 z-20` (current paper-hero.tsx pattern) |
| CHOREO-06 | All scroll-driven visual values use `useTransform` directly into `style` — no `useState` is driven from `useMotionValueEvent` for visual properties | § useState→useTransform Migration — three values (`stageOpacity`, `screenOpacity`, `copyOpacity`) get the conversion; D-15 explicitly carves out `video.currentTime` as the only legitimate `useMotionValueEvent` use |
| CHOREO-07 | Tall outer container uses `lvh`, inner sticky container uses `svh` | § Sticky Shell — D-18 + Tailwind v4 `h-svh` first-class utility, `h-[280lvh]` arbitrary value for outer |
| CHOREO-08 | Existing scroll-linked hero video continues to scrub during Stage 1 only; `currentTime` updates are gated/paused once Stage 2 fully covers it (GPU pressure fix) | § Video Gate — D-15/D-16/D-17 inside PaperBackdrop |
| MIGRATE-01 | `paper-hero.tsx`'s illustration, video, cloud parallax extracted into `<PaperBackdrop>` | § PaperBackdrop Extraction — line-by-line port table |
| MIGRATE-02 | `paper-hero.tsx`'s `useState`-driven opacity values replaced with `useTransform` motion values | § useState→useTransform Migration |
| MIGRATE-03 | Hardcoded magic-number `useTransform` keyframes replaced with named `STAGES` constants tied to `StageDef` data model | § Keyframe Resolution — endpoint-only binding via `STAGES[i].window[j]`; intra-stage values as named local consts |
| MIGRATE-04 | Site header remains visible above the morphing product-screen layer at every scroll position | § Stacking Context — D-19 verification approach |
| PERF-04 | No animated `width/height/top/left/box-shadow` on scroll-driven elements — `transform/opacity/clip-path` only | § Stack Audit — paper-hero.tsx already conforms; PaperBackdrop / ProductScreen extraction preserves the discipline |

## Project Constraints (from CLAUDE.md)

| Directive | Source | Enforcement in Phase 2 |
|-----------|--------|------------------------|
| Stack locked: React 19 + TanStack Start + Tailwind v4 + motion/react — no GSAP, no second animation library | CLAUDE.md "Constraints" | No new runtime dependencies. `pnpm list motion` confirms `motion@12.38.0` `[VERIFIED: pnpm list]`. |
| Paper design tokens (`--paper-*`) and `/public/hero/` illustration locked — don't restyle | CLAUDE.md "Constraints" | PaperBackdrop ports paper-card class strings verbatim. No new tokens; no `<img>` swaps. |
| Lighthouse no-regress | CLAUDE.md "Constraints" | Phase 2 ships zero new assets. The `useState`→`useTransform` migration is a perf improvement (eliminates re-render storm). Phase 6 audits formally. |
| `prefers-reduced-motion` is a hard requirement — all content reachable without scroll-driven animation | CLAUDE.md "Constraints" | D-02: orchestrator early-returns `<StaticChoreographyFallback/>` when reduced. PaperBackdrop never instantiated under reduced. |
| Mobile is static-fallback only — no engineering on pinned scroll | CLAUDE.md "Constraints" | D-02: orchestrator early-returns `<StaticChoreographyFallback/>` when `!isDesktop`. CSS backstop via `.scroll-choreography-only` class. |
| Live app at `teacherworkspace-alpha.vercel.app/students` is the conversion target and must not be modified | CLAUDE.md "Constraints" | Phase 2 only references via `TEACHER_WORKSPACE_APP_URL`. No live-app deploy changes. |
| Marketing-site-only milestone — live app is untouched | CLAUDE.md + PROJECT.md | All Phase 2 changes inside `src/components/landing/`, `src/routes/index.tsx`, `src/styles.css`. |
| TanStack Start does NOT use `'use client'` — guard `window`/`document`/`matchMedia` with `useEffect` or `useHydrated` | ARCHITECTURE.md | useIsDesktop already does this; Phase 2 reuses verbatim. The `loadedmetadata` effect inside PaperBackdrop runs in `useEffect` (DOM-only API). |
| `verbatimModuleSyntax: true` in tsconfig.json | tsconfig.json + CONVENTIONS.md | All type imports use `import type { ... }` (e.g., `import type { MotionValue } from "motion/react"`). |
| Named exports only, no barrel files | CONVENTIONS.md | Each new file (`paper-backdrop.tsx`, `product-screen.tsx`) exports its own primitive directly. |
| Prettier: no semicolons, double quotes, 2-space indent, 80-char width | CONVENTIONS.md + .prettierrc | All new files conform. |

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Mode detection (desktop + reduced-motion) | Browser (`useIsDesktop`, `useReducedMotion`) | SSR (optimistic-desktop default + `null` for reduced) | Same pattern Phase 1 established; orchestrator runs them inline at top |
| Master scroll source (`useScroll`) | Browser (motion's ScrollTimeline / fallback) | SSR (returns 0 stub on server; hydrates on client) | Single source of truth; provider exposes `MotionValue<number>` to subscribers |
| Visual property derivation (`useTransform`) | Browser (motion renderer, post-React) | — | Drives DOM directly via motion's optimised renderer; no React re-renders |
| Imperative video scrub + pause | Browser (`useMotionValueEvent` callback writing to `videoRef.current`) | — | DOM-only; only legitimate `useMotionValueEvent` use after CHOREO-06 |
| `loadedmetadata` listener | Browser (`useEffect` attaching to `videoRef.current`) | — | DOM-only API |
| Sticky pinning | Browser (CSS `position: sticky`) | SSR (renders the markup) | Pure CSS; no JS |
| Stacking context (header above morph) | SSR (DOM order: header sibling of main) | Browser (CSS `z-index` + `relative`) | header NOT a descendant of any transformed sticky parent — already structured this way per Phase 1 D-16 |
| Mode-mismatch defense (CSS class on outer) | SSR (renders class) | Browser (CSS `@media (max-width: 1023px)`) | Pure CSS; defense-in-depth alongside JS branch |

## Standard Stack

### Core (already installed — verified)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `motion` | `12.38.0` | Scroll-linked motion values, useTransform, useMotionValueEvent, useReducedMotion | Stack lock; Phase 1 already wired. `pnpm view motion version` returns `12.38.0` (no upgrades). `[VERIFIED: pnpm list 2026-04-29]` |
| `react` | `19.2.5` | UI runtime | Stack lock. `[VERIFIED: pnpm list]` (CLAUDE.md says 19.2.4 — minor patch drift; locked-stack contract unchanged) |
| `@tanstack/react-router` | `1.168.23` | `useHydrated()` for the SSR guard inside `useIsDesktop` | Already wired in Phase 1. `[VERIFIED: pnpm list]` (CLAUDE.md says 1.166–1.167 — drift within stack lock) |
| `tailwindcss` | `4.2.4` | Sticky/lvh/svh utilities, arbitrary values | Stack lock. v4 ships `h-svh` / `h-lvh` / `h-dvh` as first-class utilities `[CITED: tailwindcss.com/docs/height — fetched 2026-04-29]` |

### Supporting (already installed — keep)

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `vitest` | `3.2.4` | Phase 2 unit tests (mode switch, video gate, mount-stability) | Test infrastructure already configured; Phase 1 ships vitest.config.ts + vitest.setup.ts |
| `@testing-library/react` | `16.3.2` | render / renderHook / screen utilities | Phase 1 already uses; Phase 2 reuses |
| `jsdom` | `27.4.0` | DOM environment for vitest | Phase 1 already wired |

### Alternatives Considered (and rejected)

| Instead of | Could Use | Tradeoff | Decision |
|------------|-----------|----------|----------|
| Inline `useScroll` in `<ScrollChoreography>` | Custom `useChoreographyScroll()` hook wrapping it | Indirection; one consumer; not worth abstraction | Inline. Match Phase 1's stub-comment contract verbatim. |
| `useMotionValueEvent` for opacity | `useTransform` direct into `style` | useMotionValueEvent forces re-render via setState (already CHOREO-06's anti-pattern) | useTransform — locked by D-10/CHOREO-06 |
| `useSpring` smoothing on scrollYProgress before useTransform | Raw `scrollYProgress` | Spring smoothing introduces lag between scroll and morph; user feels the screen "drift" | Raw scrollYProgress (per STACK.md). Spring only for ambient parallax (clouds) if useful — Phase 2 keeps clouds linear (matches today). |
| `<MotionConfig reducedMotion="user">` wrapping the whole landing | Per-component `useReducedMotion()` | MotionConfig disables transforms only — keeps the `h-[280lvh]` outer container; reduced-motion users still scroll dead space | Per-component branch (D-02). Optional MotionConfig as belt-and-braces is Claude's discretion. |
| Two parallel orchestrator children (motion + static) | Single tree gated by mode | Mounts useScroll on mobile → wasted observer subscriptions | Mode switch (D-02 — `useScroll` only runs in choreography branch) |

**Installation:** No new dependencies. Verify with:
```bash
pnpm list motion react @tanstack/react-router tailwindcss --depth=0
# Expected: motion 12.38.0, react 19.2.5, @tanstack/react-router 1.168.x, tailwindcss 4.2.4
```

## Architecture Patterns

### System Architecture Diagram

```
                                Browser scroll event
                                        │
                                        ▼
       ┌─────────────────────────────────────────────────────┐
       │ <ScrollChoreography>  (orchestrator, fills stub)     │
       │                                                      │
       │   useIsDesktop() ────────┐                           │
       │   useReducedMotion() ────┤                           │
       │                          ▼                           │
       │   mode = (desktop && !reduced) ? "choreo" : "static" │
       │                          │                           │
       │   ┌──── if static ───────┴──── if choreo ────────┐   │
       │   ▼                                              ▼   │
       │ early-return                  useScroll({ target,    │
       │ <StaticChoreography                        offset,   │
       │  Fallback/>                  layoutEffect: false })  │
       │                                              │       │
       │                                  scrollYProgress     │
       │                                  : MotionValue<n>    │
       │                                              │       │
       │                              <Provider value={...}>  │
       │                              ┌───────────────────────┤
       │                              │                       │
       │                              ▼                       │
       │   <section ref className="scroll-choreography-only   │
       │            relative h-[280lvh]">                     │
       │     <div className="sticky top-0 h-svh ...">         │
       │       <PaperBackdrop>                                │
       │         {hero copy block — useTransform copyOpacity  │
       │          + copyY inline; passed via children}        │
       │       </PaperBackdrop>                               │
       │       <ProductScreen/>     ← THE shared element      │
       │     </div>                                           │
       │   </section>                                         │
       └──────────────────────────────────────────────────────┘
                                │  context: scrollYProgress
                                ▼
       ┌──────────────────────────────────────────────────────┐
       │ Subscribers (each calls useScrollChoreography(),     │
       │              never their own useScroll)               │
       ├──────────────────────────────────────────────────────┤
       │ <PaperBackdrop>   useTransform: stageScale, cloudY*, │
       │                   stageOpacity (was useState)        │
       │                   useTransform: copyOpacity, copyY   │
       │                                       (children prop)│
       │                   useMotionValueEvent: video.        │
       │                     currentTime + .pause() at        │
       │                     STAGES.wow.window[1]             │
       │                                                      │
       │ <ProductScreen>   useTransform: screenScale,         │
       │                   screenOpacity (was useState)       │
       │                   — Phase 2: hero→wow ramp only;     │
       │                     Phase 3 expands to 4 targets     │
       └──────────────────────────────────────────────────────┘
```

### Recommended Project Structure

```
src/components/landing/scroll-choreography/
├── scroll-choreography.tsx        # FILLED IN — orchestrator body (was Phase 1 return-null stub)
├── paper-backdrop.tsx             # NEW — paper-card frame + clouds + illustration/video + video gate
├── product-screen.tsx             # NEW — Phase-2 stub (hero→wow only)
├── context.tsx                    # UNCHANGED — provider mounted in Phase 2 with real scrollYProgress
├── stages.ts                      # RETUNE wow.window[1] per D-14
├── types.ts                       # UNCHANGED
├── use-is-desktop.ts              # UNCHANGED
├── static-choreography-fallback.tsx  # UNCHANGED — Phase 5 owns refactor
└── (test files: one per source file, mirroring Phase 1 convention)
```

### Pattern 1: Orchestrator with mode-switch early return

**What:** Hooks first, mode computation, early-return for static, then provider + sticky shell.

**When to use:** Single orchestrator owning the master `useScroll` (Phase 1 ARCHITECTURE.md "single sticky orchestrator + downward-flowing motion values").

**Example** (verified — derived from Phase 1 RESEARCH.md `useIsDesktop` pattern + paper-hero.tsx mode logic):

```typescript
// scroll-choreography.tsx (Phase 2)
import { useRef } from "react"
import { useReducedMotion, useScroll } from "motion/react"

import { useIsDesktop } from "./use-is-desktop"
import { ScrollChoreographyContext } from "./context"
import { STAGES } from "./stages"
import { PaperBackdrop } from "./paper-backdrop"
import { ProductScreen } from "./product-screen"
import { StaticChoreographyFallback } from "./static-choreography-fallback"

import {
  finalCtaCopy,
  stages,
  TEACHER_WORKSPACE_APP_URL,
} from "@/content/landing"
import { Button } from "@/components/ui/button"

const HERO_COPY_LIFT_PROGRESS = 0.14    // intra-stage timing — D-13
const HERO_COPY_FADE_OUT_START = 0.06   // intra-stage timing — D-13
const HERO_COPY_FADE_OUT_END = 0.14     // intra-stage timing — D-13

export function ScrollChoreography() {
  const sectionRef = useRef<HTMLElement>(null)
  const prefersReducedMotion = useReducedMotion()
  const isDesktop = useIsDesktop()
  const reduced = prefersReducedMotion === true || !isDesktop

  // CRITICAL: useScroll MUST run before any conditional return so its hook
  // order stays stable across mode flips (the alternative is to extract the
  // choreography branch into a child component — see "Single-file vs split"
  // analysis below). Phase 1 D-02 says useScroll "only runs in the
  // choreography branch (target ref is mounted)" — this means we must split
  // the file, not call hooks unconditionally then early-return.
  if (reduced) return <StaticChoreographyFallback />

  return <ChoreographyTree sectionRef={sectionRef} />
}

function ChoreographyTree({ sectionRef }: { sectionRef: React.RefObject<HTMLElement | null> }) {
  // PHASE-2 REQUIREMENT (FOUND-04): production-build correctness fix per motion #2452.
  // SEE OQ-1 below — this option may be vestigial in motion 12.38; verify on
  // vite preview before locking the contract.
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
    // @ts-expect-error — option present in older motion API; verify motion@12.38 behavior
    layoutEffect: false,
  })

  const heroEntry = stages.find((s) => s.id === "hero")!
  const hero = heroEntry.copy as { headline: string; subline: string }

  const copyOpacity = useTransform(
    scrollYProgress,
    [0, HERO_COPY_FADE_OUT_START, HERO_COPY_FADE_OUT_END, 1],
    [1, 1, 0, 0],
  )
  const copyY = useTransform(
    scrollYProgress,
    [0, HERO_COPY_LIFT_PROGRESS, 1],
    ["0px", "-72px", "-72px"],
  )

  return (
    <ScrollChoreographyContext.Provider
      value={{
        scrollYProgress,
        stages: STAGES,
        reducedMotion: false,
        mode: "choreography",
      }}
    >
      <section
        ref={sectionRef}
        aria-labelledby="hero-title"
        className="scroll-choreography-only relative h-[280lvh]"
      >
        <div className="sticky top-0 flex h-svh items-stretch overflow-hidden p-3">
          <PaperBackdrop>
            <motion.div
              className="mt-14 flex flex-col items-center text-center sm:mt-20"
              style={{ opacity: copyOpacity, y: copyY }}
            >
              <h1
                id="hero-title"
                className="font-heading text-[clamp(1.75rem,4.4vw,4rem)] leading-[1.05] font-medium tracking-tight text-[color:var(--paper-ink)]"
              >
                {hero.headline}
              </h1>
              <p className="mt-3 max-w-xl text-base leading-7 text-balance text-[color:var(--paper-muted)] sm:text-lg sm:leading-8">
                {hero.subline}
              </p>
              <Button
                asChild
                className="mt-6 h-11 rounded-full bg-primary px-7 text-base text-primary-foreground hover:bg-primary/90 sm:mt-7"
              >
                <a href={TEACHER_WORKSPACE_APP_URL} rel="noreferrer">
                  {finalCtaCopy.cta}
                </a>
              </Button>
            </motion.div>
          </PaperBackdrop>
          <ProductScreen />
        </div>
      </section>
    </ScrollChoreographyContext.Provider>
  )
}
```

**Why a child component (`<ChoreographyTree>`):** React's rules-of-hooks forbid calling `useScroll` conditionally. The orchestrator MUST early-return for static OR call `useScroll` unconditionally. CONTEXT.md D-02 says "useScroll only runs in the choreography branch (target ref is mounted)" — the only correct way to satisfy that AND rules-of-hooks is to split. **The planner should adopt this two-component pattern, not try to make it a single component.**

### Pattern 2: useTransform direct into `style` (no useState for visual props)

**What:** Convert `useState` + `useMotionValueEvent` opacity setter into a `useTransform`-derived `MotionValue<number>` consumed via `style={{ opacity: motionValue }}`.

**When to use:** Every scroll-driven visual prop. Reserve `useMotionValueEvent` strictly for imperative DOM side effects (e.g., `video.currentTime`).

**Example** (the Phase 2 fix for `paper-hero.tsx:64–78`):

Before:
```typescript
// paper-hero.tsx:64–78 (Phase 1 — staying as debt per D-14)
const [stageOpacity, setStageOpacity] = useState(1)
const [screenOpacity, setScreenOpacity] = useState(0)
const [copyOpacity, setCopyOpacity] = useState(1)

useMotionValueEvent(scrollYProgress, "change", (p) => {
  setStageOpacity(p < 0.6 ? 1 : clamp01(1 - (p - 0.6) / 0.18))
  setScreenOpacity(p < 0.55 ? 0 : clamp01((p - 0.55) / 0.23))
  setCopyOpacity(p < 0.06 ? 1 : clamp01(1 - (p - 0.06) / 0.08))
  // ... video scrub
})
```

After (Phase 2 PaperBackdrop):
```typescript
// paper-backdrop.tsx
const STAGE_OPACITY_FADE_START = 0.6  // intra-stage local const — D-13
const STAGE_OPACITY_FADE_END = 0.78   // = STAGES.wow.window[1] per D-16
const SCREEN_OPACITY_FADE_START = byId("wow").window[0]  // stage-aligned — D-12
const SCREEN_OPACITY_FADE_END = byId("wow").window[1]    // stage-aligned — D-12

const stageOpacity = useTransform(
  scrollYProgress,
  [STAGE_OPACITY_FADE_START, STAGE_OPACITY_FADE_END],
  [1, 0],
  // useTransform clamps by default — no explicit clamp01() needed
)
const screenOpacity = useTransform(
  scrollYProgress,
  [SCREEN_OPACITY_FADE_START, SCREEN_OPACITY_FADE_END],
  [0, 1],
)

return (
  <motion.div style={{ scale: stageScale, opacity: stageOpacity, transformOrigin: "50% 92%" }}>
    {/* ... */}
  </motion.div>
)
```

**Why no `clamp01` helper needed:** `useTransform`'s default `clamp: true` clips outputs to the range. The original `clamp01(1 - (p - 0.6) / 0.18)` math handled both the range mapping AND the clamping; `useTransform([0.6, 0.78], [1, 0])` does the same job declaratively. `[VERIFIED: motion.dev/docs/react-use-transform — "clamp option" snippet]`.

### Pattern 3: useMotionValueEvent for imperative side effects ONLY

**What:** Use `useMotionValueEvent` to write to DOM imperatively (`video.currentTime`, `video.pause()`). Never use it to drive a React state update for a visual property.

**When to use:** Any DOM API that needs to be synced with scroll progress but cannot be expressed declaratively as `style`.

**Example** (the Phase 2 video gate inside PaperBackdrop):

```typescript
// paper-backdrop.tsx — CHOREO-08 video gate
import { useMotionValueEvent } from "motion/react"
import { useEffect, useRef } from "react"
import { byId } from "./stages"

const VIDEO_GATE_THRESHOLD = byId("wow").window[1]  // D-16: stage-aligned via STAGES

export function PaperBackdrop({ children }: { children?: React.ReactNode }) {
  const { scrollYProgress } = useScrollChoreography()
  const videoRef = useRef<HTMLVideoElement>(null)
  const videoDurationRef = useRef(0)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    const handleMeta = () => {
      videoDurationRef.current = video.duration || 0
    }
    if (video.readyState >= 1) handleMeta()
    else video.addEventListener("loadedmetadata", handleMeta)
    return () => video.removeEventListener("loadedmetadata", handleMeta)
  }, [])  // D-17: PaperBackdrop only renders in choreography mode; reduced doesn't exist

  useMotionValueEvent(scrollYProgress, "change", (p) => {
    const video = videoRef.current
    const duration = videoDurationRef.current
    if (!video || duration <= 0) return

    if (p >= VIDEO_GATE_THRESHOLD) {
      // D-16: skip currentTime write + defensive pause()
      video.pause()
      return
    }
    // Below threshold: scrub
    video.currentTime = (p / VIDEO_GATE_THRESHOLD) * duration
  })

  // ... render paper-card frame + clouds + video + children
}
```

**`useMotionValueEvent` firing rate:** `[CITED: motion.dev/docs/react-motion-value-event — verified via Context7]` — the hook attaches a listener that fires on every change to the underlying motion value. `useScroll` itself is rAF-throttled by motion's renderer. The callback fires synchronously on each scroll frame; expect ~60 calls/sec during continuous scroll. `video.pause()` is idempotent on a paused video, so calling it on every frame above the threshold is cheap. `video.currentTime` writes are NOT idempotent — assignment triggers a seek even if the value is unchanged. **Do NOT add `if (video.currentTime !== nextValue)` guard** — the assignment is faster than the conditional. **The gate logic above already prevents writes above threshold; this is sufficient.**

**Cleanup gotcha:** `useMotionValueEvent` cleans up listeners automatically on unmount. `[VERIFIED: motion.dev/docs/react-use-motion-value-event — "Handlers are automatically cleaned up when the component unmounts" — Context7]`. No race-condition risk during PaperBackdrop's lifetime.

### Pattern 4: MotionValue propagation via React Context

**What:** A `MotionValue<number>` passed through context to subscribers. The context value is a stable object reference for the lifetime of the orchestrator.

**Why no re-render storm:** `MotionValue` updates are NOT React state updates. The provider's value object is constructed once per render of `<ScrollChoreography>`, which happens at most twice during mode-flip transitions (mobile → desktop or reduced toggle). All scroll-driven updates flow through the `MotionValue.set()` path, bypassing React entirely. `[VERIFIED: motion.dev/docs/react-motion-value — "Motion values are performant because they can be rendered with Motion's optimised DOM renderer without triggering React re-renders" — Context7]`.

**Stability concern:** If the provider value is reconstructed every render (`value={{ scrollYProgress, stages: STAGES, reducedMotion: false, mode: "choreography" }}`), context consumers will think it changed (object identity differs). **For `MotionValue` consumers (`useScrollChoreography().scrollYProgress.set(...)` callers) this is harmless** — they extract the `MotionValue` reference and use it directly. **For non-MotionValue context fields (`mode`, `reducedMotion`, `stages`)**, downstream consumers re-render on every parent re-render. Phase 2 doesn't have downstream `mode`/`reducedMotion` consumers (only PaperBackdrop and ProductScreen, both consuming `scrollYProgress`), so this is fine. Phase 4 may need a `useMemo` on the value object if it adds consumers that read `mode`.

**Recommendation:** No `useMemo` needed in Phase 2. Document the future requirement in a code comment. The two-component split (Pattern 1) means `<ChoreographyTree>` only re-renders when its props change, so the value object is constructed once per choreography mount, not per scroll frame.

### Anti-Patterns to Avoid

- **Hooks called conditionally** — Rules of Hooks forbids `if (reduced) return ...; const { scrollYProgress } = useScroll(...)`. Split into two components instead (Pattern 1).
- **`useState` setters inside `useMotionValueEvent`** — the CHOREO-06 anti-pattern Phase 2 explicitly fixes. The current `paper-hero.tsx:64–78` is the canonical example.
- **Magic numbers in `useTransform` keyframes** — MIGRATE-03. Replace with `STAGES[i].window[j]` for stage-aligned values; use named local consts for intra-stage values (D-12/D-13).
- **Animating `width`/`height`/`top`/`left`/`box-shadow` on scroll-driven elements** — PERF-04. paper-hero.tsx already conforms (transform/opacity only); preserve in extraction.
- **Stretched `<header>` inside the transformed sticky parent** — would create stacking-context bug. SiteHeader is already a sibling of `<main>` at route level (Phase 1 D-16); do NOT move it inside `<ScrollChoreography>`.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Clamping a `useTransform` output to [0,1] | `clamp01()` wrapper around the motion value | `useTransform`'s default `clamp: true` (or explicit option) | The clamp is built-in; wrapping defeats motion's optimised renderer |
| Throttling `useMotionValueEvent` to rAF | Manual `requestAnimationFrame` debouncing | The hook's built-in firing rate (motion's renderer is already rAF-aligned) | `[CITED: motion.dev — useScroll uses ScrollTimeline / rAF fallback]` |
| Detecting "above threshold" with hysteresis | Custom debounce / boolean state machine | Plain `if (p >= threshold)` — D-16: no hysteresis first-pass | Phase 2 ships without hysteresis; revisit only if Profiler shows pause/play thrash |
| SSR-safe matchMedia | New custom hook | Existing `useIsDesktop()` (Phase 1) | Already wired, tested, hydration-safe |
| Mode-switch CSS gate | Inline JS hide/show | Existing `.scroll-choreography-only { display: none }` rule (styles.css:226–230) | Phase 1 already shipped the rule — Phase 2 just tags the orchestrator's outer container with the class |
| Mount-stability assertion in tests | Manual DOM querySelector + frame counting | `@testing-library/react`'s `rerender` + a ref-counter on the `motion.div` | Phase 1 testing convention; D-21 |

**Key insight:** The MIGRATE-02 / CHOREO-06 fix is *less code*, not more. Three `useState` declarations + one giant `useMotionValueEvent` callback collapse to three `useTransform` calls. Hand-rolling clamping or hysteresis adds debt; the motion library already handles both.

## Runtime State Inventory

> Phase 2 includes a rename-adjacent operation (extracting `paper-hero.tsx`'s scroll wiring into new files), but the existing `paper-hero.tsx` is preserved in place per CONTEXT.md D-03. No data migration is needed in Phase 2.

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | None — static marketing site, no databases or datastores | None |
| Live service config | None — Vercel deploy reads from git only; no UI-managed config | None |
| OS-registered state | None — no scheduled tasks, services, or process registrations | None |
| Secrets/env vars | None — `.env` is in `.gitignore` and no env vars referenced in src/ (verified 2026-04-29 by grep "process.env" src/) | None |
| Build artifacts | The dev/build cache (`.output/`, `.vinxi/`) carries no Phase 2-relevant state — preserved by gitignore | Run `pnpm build` after the wave-final commit to confirm production parity (this is the FOUND-04 verification gate per ROADMAP.md SC #3) |

**Nothing found in any live-state category** — Phase 2 is a pure code refactor. The one runtime concern is the production-build verification of FOUND-04 (see § Critical Verification Finding below).

## Common Pitfalls

### Pitfall 1: Calling `useScroll` conditionally violates Rules of Hooks

**What goes wrong:** A naive `if (reduced) return <StaticFallback/>` followed by `const { scrollYProgress } = useScroll(...)` produces a Rules-of-Hooks violation when `reduced` flips during the component's lifetime (e.g., user toggles `prefers-reduced-motion` in dev tools, or matchMedia listener flips on viewport resize across the 1024px breakpoint).
**Why it happens:** Hooks must be called in the same order on every render. An early-return placed before `useScroll` means useScroll is sometimes called and sometimes not.
**How to avoid:** Split into `<ScrollChoreography>` (mode switch) + `<ChoreographyTree>` (calls useScroll). React unmounts `<ChoreographyTree>` cleanly when mode flips; useScroll only runs while mounted. **This is the load-bearing pattern for Phase 2 — verify the planner adopts it.**
**Warning signs:** Vitest test `useScroll layoutEffect: false call signature` fails inconsistently across runs; ESLint `react-hooks/rules-of-hooks` warning at the orchestrator definition.

### Pitfall 2: Sticky parent transform breaks stacking context (PITFALLS.md #2)

**What goes wrong:** Today `paper-hero.tsx` already has `<motion.div style={{ scale: stageScale }}>` on the sticky container. PaperBackdrop preserves this. If SiteHeader were moved inside the choreography subtree, its `z-30` would stack against descendants of the transformed paper-card — making the hero copy block visually float above the header.
**Why it happens:** `transform`, `opacity < 1`, `filter` all create new stacking contexts; sticky positioning also creates one. Children of a transformed parent cannot compete on `z-index` against siblings of that parent.
**How to avoid:** SiteHeader is already a sibling of `<main>` at route level (Phase 1 D-16) — do NOT move it. Phase 2's MIGRATE-04 verification is "smoke-test that it still works," not "redesign." The verification is a vitest test that mounts `<><SiteHeader/><ScrollChoreography/></>` and asserts SiteHeader is not a descendant of any element with `transform` style.
**Warning signs:** DevTools shows correct `z-index` on `<header>` but it's visually below the morphing screen; removing `scale: stageScale` from the paper-card "magically fixes" the layering.

### Pitfall 3: iOS Safari `vh` jank (PITFALLS.md #5)

**What goes wrong:** Using `vh` (instead of `lvh`/`svh`) on the outer choreography container causes a mid-scroll jolt when iOS Safari's address bar collapses, because the total scroll length changes and `scrollYProgress` jumps.
**Why it happens:** `vh` includes the address bar at one moment and excludes it the next. Safari fires the resize as a single jolt, not 60fps.
**How to avoid:** D-18 — `lvh` outer (`h-[280lvh]`) + `svh` inner (`h-svh`). Tailwind v4 ships `h-svh` / `h-lvh` / `h-dvh` as first-class utilities `[CITED: tailwindcss.com/docs/height — fetched 2026-04-29]`. For arbitrary multipliers like `280lvh`, use Tailwind's arbitrary value syntax: `h-[280lvh]`. **Browser support for `lvh`/`svh`/`dvh`:** Chrome 108+, Edge 108+, Firefox 101+, Safari 15.4+ `[CITED: caniuse.com/viewport-unit-variants — fetched 2026-04-29; 94.26% global usage]`. Phase 2's desktop-only gate (`useIsDesktop` checks `min-width: 1024px`) means the choreography subtree only renders on viewports likely to have these versions. **No fallback strategy needed** — the desktop-only branch makes a `<lvh>`-supporting browser the de-facto requirement.
**Warning signs:** iOS Safari real-device test shows a "lurch" at the moment the address bar collapses; `useScroll` debug logs show `scrollYProgress` jumping by 0.05+ in a single frame on mobile (would only manifest if Phase 2 accidentally lifted the desktop gate).

### Pitfall 4: `useMotionValueEvent` re-render storm (PITFALLS.md #12)

**What goes wrong:** The current `paper-hero.tsx:64–78` updates 3 `useState` values on every scroll frame, re-rendering the entire 224-line `PaperHero` per frame.
**Why it happens:** `useMotionValueEvent` callbacks are not React-batched; each `setState` schedules a render.
**How to avoid:** Phase 2 IS the fix. CHOREO-06 / D-10 — replace with `useTransform` and consume via `style={{ opacity: motionValue }}`. The motion library updates the DOM directly without React re-render. **One legitimate use of `useMotionValueEvent` remains:** writing to `video.currentTime` — this is a DOM imperative, not a visual style. D-15 explicitly carves out this exception.
**Warning signs:** React DevTools Profiler "ranked" view shows `<ScrollChoreography>` or `<PaperBackdrop>` re-rendering 60+ times during continuous scroll; CHOREO-06 SC #2 ("0–2 re-renders/sec") fails.

### Pitfall 5: Production-build first-paint flicker (PITFALLS.md #1, motion#2452)

**What goes wrong:** In production builds, `useScroll({ target })` returns 0 on the first paint until the ref is measured, causing a one-frame flash of the stage-1 final state on hard refresh mid-page.
**Why it happens:** Historically (older motion versions), this was fixed by passing `layoutEffect: false`. Phase 1 encoded this as a load-bearing comment that Phase 2 must honor.
**How to avoid:** **See § Critical Verification Finding (OQ-1) below** — the `layoutEffect: false` option does not appear in motion 12.38's `useScroll` source. Phase 2 must verify on a `vite preview` (or Vercel preview) build whether the bug still reproduces. If it does NOT reproduce: the contract is vestigial; remove the comment in Phase 1's stub (or upgrade to a runtime assertion the production-build behavior is correct). If it DOES reproduce: file a follow-up bug for motion / find the new fix path. **Do not silently pass an unrecognized option** — TypeScript may not catch it and the planner / executor will assume it works.
**Warning signs:** "Looks fine in dev, broken in prod" — classic motion#2452 signal. Hard refresh halfway down the page shows a one-frame snap to a stage-1-final visual.

### Pitfall 6: Provider value object reconstructed every render

**What goes wrong:** Each render of `<ChoreographyTree>` creates a new `value={{...}}` object, causing all `useScrollChoreography()` consumers to re-render even though the underlying `MotionValue` is unchanged.
**Why it happens:** React Context uses `Object.is` to detect value changes; literal object expressions always create a new identity.
**How to avoid:** In Phase 2, this is a non-issue because (a) `<ChoreographyTree>` re-renders only on mode flips (rare), and (b) all current subscribers (PaperBackdrop, ProductScreen) extract the `MotionValue` at mount and use its imperative `.set()` / `useTransform` flow. The object identity drift doesn't matter. Phase 4 may need `useMemo`. Document this in a code comment so the planner doesn't pre-optimise.
**Warning signs:** React DevTools "Why did this render?" shows context value identity change; only relevant once Phase 4 adds copy-track consumers reading `mode` or `reducedMotion`.

### Pitfall 7: Overlapping STAGES windows after retuning

**What goes wrong:** D-14 retunes `wow.window[1]` to 0.78. Phase 1 first-pass had `feature-a.window: [0.50, 0.78]` and `feature-b.window: [0.75, 1.0]`. If wow stretches to 0.78, feature-a now starts at 0.50 (overlap with wow goes from `[0.50, 0.55]` (5% overlap) to `[0.50, 0.78]` (28% overlap)). Cross-fades between wow and feature-a behave radically differently.
**Why it happens:** Stage windows are not independent; tuning one affects neighbors.
**How to avoid:** **Phase 2 only needs to retune `wow.window` for the video-gate threshold (D-16)**. Feature-a/feature-b are Phase 3 territory (D-09: ProductScreen Phase-2 stub only animates hero→wow). The current Phase 1 first-pass `feature-a.window: [0.50, 0.78]` already overlaps with wow at 0.20–0.78 (heavy overlap, but feature-a doesn't render anything in Phase 2). Phase 3 will re-tune feature-a/b once the docking transforms are designed. **Phase 2 retuning recommendation:** retune wow to `[0.20, 0.78]`; bump feature-a.window[0] to align (e.g., `[0.55, 0.78]`) only if Phase 2's PaperBackdrop fade-out feels wrong with the current overlap. The `STAGES` retune is a Wave-2 visual-checkpoint task, not an early Wave-0 lock.
**Warning signs:** PaperBackdrop's `stageOpacity` fade-out feels delayed (because `STAGE_OPACITY_FADE_END = wow.window[1] = 0.78` is now further than the old `0.6` from the visual reveal point); planner adjusts the hero-stage `stageOpacity` end-keyframe via local const, not by retuning wow.

## Code Examples

Verified patterns from official sources + Phase 1 in-repo conventions.

### `useScroll` configuration

```typescript
// Source: motion.dev/docs/react-use-scroll [Context7-verified]
// + Phase 1 PHASE-2 REQUIREMENT comment in scroll-choreography.tsx:6-13
const { scrollYProgress } = useScroll({
  target: sectionRef,
  offset: ["start start", "end end"],
  // CRITICAL: see OQ-1 — layoutEffect:false's status in motion 12.38 unverified
  // @ts-expect-error — option likely not in 12.38 type signature
  layoutEffect: false,
})
```

The `["start start", "end end"]` offset means: progress is 0 when the **start** of the target meets the **start** of the container (page top = section top), and 1 when the **end** of the target meets the **end** of the container (page bottom = section bottom). For a sticky-pinned tall section starting at the top of the page, this gives 0..1 progress across the entire scroll length of the outer container. `[CITED: motion.dev/docs/react-use-scroll — "offset" option semantics]`. **Verified correct for paper-hero.tsx's tall sticky pattern.** `paper-hero.tsx:37–40` uses the identical offset shape.

### `useTransform` direct into style

```typescript
// Source: motion.dev/docs/react-use-transform [Context7-verified]
// + the CHOREO-06 / MIGRATE-02 fix
const stageOpacity = useTransform(
  scrollYProgress,
  [0.6, 0.78],         // input keyframes — STAGES[i].window[j] per D-12 (or local const per D-13)
  [1, 0],              // output values — clamp:true is default
)

return (
  <motion.div style={{ opacity: stageOpacity }}>
    {/* DOM updates via motion's renderer; no React re-render */}
  </motion.div>
)
```

`[VERIFIED: motion.dev/docs/react-use-transform — "Demonstrating the clamp Option Behavior" snippet via Context7]`. Default `clamp: true` makes the original `clamp01(...)` helper unnecessary.

### `useMotionValueEvent` for video gate

```typescript
// Source: motion.dev/docs/react-use-motion-value-event [Context7-verified]
// + paper-hero.tsx:68-78 (current pattern, gated by D-16)
useMotionValueEvent(scrollYProgress, "change", (p) => {
  const video = videoRef.current
  const duration = videoDurationRef.current
  if (!video || duration <= 0) return

  if (p >= byId("wow").window[1]) {
    video.pause()  // D-16: defensive, idempotent
    return
  }
  video.currentTime = (p / byId("wow").window[1]) * duration
})
```

Auto-cleanup on unmount per `[VERIFIED: motion.dev/docs/react-use-motion-value-event — "Handlers are automatically cleaned up when the component unmounts"]`. Fires synchronously on every motion-value change (motion's renderer is already rAF-aligned).

### `useIsomorphicLayoutEffect` is the actual SSR safety mechanism in motion 12.38

```typescript
// Source: framer-motion@12.38.0/dist/es/utils/use-isomorphic-effect.mjs (verified in node_modules)
const useIsomorphicLayoutEffect = isBrowser ? useLayoutEffect : useEffect
```

`useScroll` (`framer-motion@12.38.0/dist/es/value/use-scroll.mjs:65–84` — verified by direct read 2026-04-29) uses `useIsomorphicLayoutEffect` plus a `needsStart` ref pattern that defers ref measurement to a follow-up `useEffect` if the ref is unhydrated. **There is no `layoutEffect` option exposed.** This is the source of OQ-1.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `useState` + `useMotionValueEvent` for opacity | `useTransform` direct into `style` | motion 8+ pattern, locked-in by 12.x | CHOREO-06 fix is mechanical — replace 3 useState/setState pairs with 3 useTransform calls |
| Magic-number `useTransform` keyframes | `STAGES[i].window[j]` for stage-aligned + named local consts for intra-stage | Phase 1 introduced `STAGES`; Phase 2 binds keyframes to it (MIGRATE-03) | Editing copy / retuning visuals doesn't break choreography — the constant is the contract |
| `vh` for viewport-relative containers | `lvh` outer + `svh` inner | iOS Safari support since 15.4 (2022) | Phase 1 RESEARCH.md PITFALL #5; Tailwind v4 first-class utilities |
| `useScroll({ layoutEffect: false })` | (no longer required as an option in motion 12.38?) | motion appears to have refactored the layoutEffect path internally | **OQ-1 below** — production behavior must be verified before locking the contract |

**Deprecated/outdated:**
- `useState` for any visual property driven by scroll progress — `[CITED: motion.dev/docs/react-motion-value]` motion's renderer updates the DOM without re-render; using React state defeats the optimisation.
- `paper-hero.tsx:64–78`'s `setStageOpacity` / `setScreenOpacity` / `setCopyOpacity` pattern — Phase 2 deletes this in PaperBackdrop / ProductScreen extraction.
- `Record<StageId, StageDef>` as the STAGES ordering source — Phase 1 chose `readonly StageDef[]` + `byId()` for iteration-first ergonomics. Phase 2 consumes `byId("hero").window[0]`, etc.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | The `layoutEffect: false` option, instructed by Phase 1's load-bearing comment, exists as a recognised option on `useScroll` in motion 12.38 | Pattern 1 code example, OQ-1 | **HIGH** — if the option is silently ignored by motion 12.38, the FOUND-04 fix is a no-op. The production-build flicker bug may still exist (or may have been fixed differently in motion 12.x). Phase 2 must verify on `vite preview` before locking. |
| A2 | The first-pass STAGES.wow.window retune `[0.20, 0.78]` is visually correct (the screen reaches near-full-opacity at p=0.78) | D-14, Pitfall 7 | LOW-MEDIUM — first-pass; D-14 is "tunable in execution against visual review." Risk is wasted iteration time, not correctness. |
| A3 | `PaperBackdrop` rendering only in choreography mode means the `loadedmetadata` effect's empty dep array `[]` is correct | D-17, Pattern 3 | LOW — verified by construction (D-02: orchestrator early-returns static; PaperBackdrop only mounts in choreography branch). The `[reduced]` dep that Phase 1 fix WR-06 introduced was for paper-hero.tsx, not PaperBackdrop. Document explicitly in PaperBackdrop docstring per CONTEXT.md `<specifics>`. |
| A4 | The CSS rule `.scroll-choreography-only { display: none }` (styles.css:226–230) is sufficient defense-in-depth alongside the JS branch | Discretion | LOW — pure CSS; Phase 1 already shipped the rule; Phase 2 just tags the orchestrator's outer container with the class. |
| A5 | `useMotionValueEvent` cleans up listeners on component unmount, no race conditions during PaperBackdrop's lifetime | Pattern 3 | LOW — `[VERIFIED: motion.dev docs via Context7]` |
| A6 | React DevTools Profiler is sufficient for measuring "0–2 re-renders/sec of continuous scroll" (CHOREO-06 / SC #2) | § Validation Architecture | LOW-MEDIUM — Profiler is the standard tool, but "scroll for one second" is a manual, judgement-based gate. Augment with a unit test that mocks `scrollYProgress` and counts re-renders if a deterministic check is needed (see Wave 0 below). |

**No `[ASSUMED]` claims in the locked decisions** — the user's CONTEXT.md is a tight contract.

## Open Questions

### OQ-1: Is `layoutEffect: false` a real option on motion@12.38's `useScroll`?

- **What we know:** Phase 1 RESEARCH.md `[CITED: motion#2452]` flagged this as community-known but not in official docs. The Phase 1 stub comment in `scroll-choreography.tsx:6–13` instructs Phase 2 to pass it. The Phase 1 `[ASSUMED A4]` flag noted "research did not perform this physical verification."
- **What's unclear:** Direct read of `framer-motion@12.38.0/dist/es/value/use-scroll.mjs` (verified 2026-04-29) shows the function signature is `useScroll({ container, target, ...options } = {})` and `...options` is spread into the dom-level `scroll()` factory. There is **no `layoutEffect` extraction or branch** in the entire `use-scroll.mjs` body. Grep across `framer-motion@12.38.0` and `motion-dom@12.38.0` for the literal `layoutEffect` returns ZERO matches.
- **Implication:** Either (a) the option name has changed in motion 12.x (e.g., is now in the dom-level `scroll()` config — unverified), (b) the bug was fixed in motion 12.x via the new `needsStart` ref pattern visible in `use-scroll.mjs:65–84` and the option is no longer needed, or (c) the option is still required but lives in a new location. Phase 2's planner-checker must verify before locking the implementation contract.
- **Recommendation:** **Make a `vite preview` build of Phase 2 with and without `layoutEffect: false` in the useScroll call, hard-refresh mid-page, and observe whether stage-1-final flickers.** If no flicker reproduces in either build → the fix is built-in to motion 12.x; remove the comment from Phase 1's stub and document this in Phase 2 verification. If flicker reproduces with `layoutEffect: false` AND not without → option is real but ignored (TS-spread silent passthrough); upgrade priority to confirm the new option name. **Surface this as a discuss-phase confirmation question if the planner is uncertain how to proceed.** If unable to verify before plan-creation: ship Phase 2 with the option, mark it `// @ts-expect-error layoutEffect:false legacy contract — verify FOUND-04 in vite preview`, and add an acceptance criterion to verify in Wave 4.

### OQ-2: Are 4 mode-switch test cases sufficient (matchMedia × prefersReducedMotion = 2x2 = 4)?

- **What we know:** D-21 says "4 cases: desktop+motion, desktop+reduced-motion, mobile+motion, mobile+reduced-motion". Phase 1's `useIsDesktop` test covers 3 cases (default, post-hydrate flip, listener lifecycle) but not the combined matchMedia × reducedMotion matrix.
- **What's unclear:** Should Phase 2 test the 4 mode-switch combinations as 4 separate render tests (mocking both hooks per case), or rely on combining the existing `useIsDesktop` test with a separate `useReducedMotion`-mock test? The 4-case matrix is the more thorough approach.
- **Recommendation:** Adopt the 4-case matrix. `useReducedMotion` is mockable via `vi.spyOn(motion, "useReducedMotion").mockReturnValue(true)` or via the global `prefers-reduced-motion` media query in the matchMedia shim. Pattern: parameterise the test with `it.each([{desktop:true,reduced:false,expect:"choreo"}, ...])(...)`.

### OQ-3: Should Phase 2 add `pointer-events-none` to the morphing screen overlay (already in paper-hero.tsx:199)?

- **What we know:** The current `paper-hero.tsx:196–220` screen overlay carries `pointer-events-none` (line 199) so it doesn't intercept clicks during the hero stage. Phase 2 ports this verbatim. STACK.md mentions `pointer-events-none` should toggle to `pointer-events-auto` once the screen docks (Phase 3 concern), not during transit.
- **What's unclear:** Is the planner expected to keep `pointer-events-none` always-on in Phase 2's ProductScreen (since Phase 2 only renders hero→wow, no docked stages)?
- **Recommendation:** Yes, always-on `pointer-events-none` in Phase 2. Phase 3 lands the docking + `pointer-events-auto` toggle.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | dev/build | ✓ | 25.6.1 | — |
| pnpm | install | ✓ | 10.28.2 | — |
| motion (motion/react) | useScroll/useTransform/useMotionValueEvent/useReducedMotion | ✓ | 12.38.0 | — (stack-locked) |
| react | UI runtime | ✓ | 19.2.5 | — |
| @tanstack/react-router | useHydrated() inside useIsDesktop | ✓ | 1.168.23 | — |
| tailwindcss | h-svh / h-lvh utilities | ✓ | 4.2.4 | — |
| vitest | unit tests | ✓ | 3.2.4 | — |
| @testing-library/react | renderHook / render / screen | ✓ | 16.3.2 | — |
| jsdom | DOM env for vitest | ✓ | 27.4.0 | — |
| vite preview | FOUND-04 production-build verification | ✓ | 7.3.2 (via pnpm exec vite) | — |

**Missing dependencies with no fallback:** None. All required tooling is installed.

**Missing dependencies with fallback:** None.

**Note on Vercel preview:** the FOUND-04 / SC #3 verification ("vite preview build shows no first-paint flicker on hard refresh mid-page") can be done locally via `pnpm build && pnpm preview` (vite ships a `preview` command). A Vercel deploy is not strictly needed for Phase 2 (Phase 5 owns the production deploy verification per ROADMAP.md SC #4). Recommend adding a Wave 4 task: "run `pnpm build && pnpm preview`, hard-refresh at scroll position 50%, confirm no flicker." This is also where OQ-1 gets answered.

## Validation Architecture

> Phase 1 used 7 fail-loudly Wave-0 test stubs as the testing foundation. Phase 2 follows the same convention — adding 7–9 new test files (one per source file + integration tests for cross-component behavior), aligned to `workflow.nyquist_validation: true` in `.planning/config.json`.

### Test Framework

| Property | Value |
|----------|-------|
| Framework | vitest 3.2.4 + @testing-library/react 16.3.2 + jsdom 27.4.0 |
| Config file | `vitest.config.ts` (Phase 1, no Phase 2 changes needed) |
| Setup file | `vitest.setup.ts` (Phase 1 — matchMedia shim + `afterEach(cleanup)`) |
| Quick run command | `pnpm test --run` |
| Full suite command | `pnpm test --run && pnpm typecheck && pnpm build` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| CHOREO-01 | Single product-screen `motion.div` shared across all stages, never unmounts, no `layoutId` | unit (mount-counter) | `pnpm test --run -- product-screen.test.tsx` | ❌ Wave 0 — `src/components/landing/scroll-choreography/product-screen.test.tsx` |
| CHOREO-02 | Hero scroll-linked video continues to play underneath; product screen sits tiny inside the illustration | unit (rendered DOM check) | `pnpm test --run -- paper-backdrop.test.tsx` | ❌ Wave 0 — `paper-backdrop.test.tsx` (asserts `<video>` element present + product-screen overlay sibling exists) |
| CHOREO-06 | All scroll-driven visual values use `useTransform` directly into `style` — no `useState` for visual props | unit (grep + render) | `pnpm test --run -- choreography-rerender-budget.test.tsx` + `grep -nE "use(State\|MotionValueEvent)" src/components/landing/scroll-choreography/{paper-backdrop,product-screen,scroll-choreography}.tsx \| grep -v "video" \| wc -l` should be 0 | ❌ Wave 0 — `choreography-rerender-budget.test.tsx` (mocks scrollYProgress, asserts component renders ≤2 times across 100 motion value updates) |
| CHOREO-07 | Outer container uses `lvh`, inner sticky uses `svh` | unit (className grep) | `pnpm test --run -- scroll-choreography.test.tsx` | ❌ Wave 0 — `scroll-choreography.test.tsx` (assert `h-[280lvh]` and `h-svh` classNames present) |
| CHOREO-08 | Video `currentTime` writes gated/paused once Stage 2 fully covers it | unit (motion value event mock) | `pnpm test --run -- paper-backdrop-video-gate.test.tsx` | ❌ Wave 0 — `paper-backdrop.test.tsx` describe-block "video gate" |
| MIGRATE-01 | PaperBackdrop carries illustration + video + cloud parallax | unit (render check) | `pnpm test --run -- paper-backdrop.test.tsx` | ❌ Wave 0 — `paper-backdrop.test.tsx` |
| MIGRATE-02 | useState-driven opacity values replaced with useTransform | unit (no `useState` driven from `useMotionValueEvent`) | `pnpm test --run -- choreography-no-usestate.test.tsx` + grep | ❌ Wave 0 — covered by `choreography-rerender-budget.test.tsx` plus a static-analysis grep test |
| MIGRATE-03 | Hardcoded magic-number keyframes replaced with named STAGES constants | static-analysis grep | grep `useTransform.*[0-9]\.[0-9]+` in `paper-backdrop.tsx` and `product-screen.tsx`; should match only named-local-const usages | ❌ Wave 0 — `migrate-03-keyframe-binding.test.ts` (assert `byId("...")` or local const is used in every useTransform call) |
| MIGRATE-04 | SiteHeader visible above morph layer at every scroll position | integration | `pnpm test --run -- header-stacking.test.tsx` | ❌ Wave 0 — `header-stacking.test.tsx` (mounts route tree, asserts `<header>` is NOT a descendant of any element with `transform` style and is a sibling of the choreography subtree) |
| PERF-04 | No animated `width`/`height`/`top`/`left`/`box-shadow` on scroll-driven elements | static-analysis grep | grep `useTransform.*['"](width\|height\|top\|left\|box-shadow)['"]\|style=\\{\\{.*(width\|height\|top\|left).*motionValue` in scroll-choreography/; should be 0 | ❌ Wave 0 — `migrate-perf-04.test.ts` (static check — fail if any forbidden property is animated) |

### Sampling Rate (Nyquist)

- **Per task commit:** `pnpm test --run` (~3s for Phase 1's 31 tests; Phase 2 adds ~10–15 more, expect <5s)
- **Per wave merge:** `pnpm test --run && pnpm typecheck && pnpm build` (full suite + production build — catches FOUND-04 regression risk)
- **Phase gate:** Full suite green AND `pnpm preview` smoke (FOUND-04 verification — see § Critical Verification Finding) before `/gsd-verify-work`

### Wave 0 Gaps

- [ ] `src/components/landing/scroll-choreography/scroll-choreography.test.tsx` — covers CHOREO-07, the 4-case mode switch (D-21), `useScroll` `layoutEffect: false` call signature assertion, and the `.scroll-choreography-only` className assertion
- [ ] `src/components/landing/scroll-choreography/paper-backdrop.test.tsx` — covers MIGRATE-01, CHOREO-02, CHOREO-08 (video gate threshold cross), `loadedmetadata` effect lifecycle, useTransform-driven opacity (no useState for visual props)
- [ ] `src/components/landing/scroll-choreography/product-screen.test.tsx` — covers CHOREO-01 mount-counter (never unmounts across simulated scroll), useTransform shape (no useState for visual props), Phase 2 hero→wow ramp only
- [ ] `src/components/landing/scroll-choreography/header-stacking.test.tsx` — covers MIGRATE-04 (header sibling-of-main, not-descendant-of-transform)
- [ ] `src/components/landing/scroll-choreography/choreography-rerender-budget.test.tsx` — covers CHOREO-06 SC #2 (≤ 2 re-renders across 100 motion value updates) + MIGRATE-02
- [ ] `src/components/landing/scroll-choreography/migrate-03-keyframe-binding.test.ts` — covers MIGRATE-03 (no inline magic-number tuples; every useTransform input array starts/ends at a STAGES constant or named local const)
- [ ] `src/components/landing/scroll-choreography/migrate-perf-04.test.ts` — covers PERF-04 (no forbidden animated CSS properties)
- [ ] (optional, Wave 4) `pnpm preview` smoke — manual checkpoint, FOUND-04 verification

### Falsifiable Validation Checkpoints

These map 1:1 to ROADMAP.md Phase 2 success criteria. Each is a yes/no gate.

1. **CHOREO-01 / SC #1:** Mount-counter test: render `<ScrollChoreography>`, simulate 5 scrollYProgress updates spanning 0→1, assert `<ProductScreen>`'s `motion.div` ref is the same DOM node across all renders. *(Falsifiable in vitest.)*
2. **CHOREO-06 / SC #2:** Re-render budget test: mock `scrollYProgress`, fire 100 `change` events, assert `<ScrollChoreography>` and `<PaperBackdrop>` re-render counts are ≤ 2 each. *(Falsifiable in vitest.)*
3. **MIGRATE-04 / SC #3:** Stacking-context test: render `<><SiteHeader/><ScrollChoreography/></>`, assert `<header>` is NOT a descendant of any element with computed `transform !== "none"`. *(Falsifiable in vitest + jsdom.)*
4. **FOUND-04 / SC #3:** `pnpm build && pnpm preview` smoke. Hard-refresh at scroll position 50% (e.g., `https://localhost:5173#half-scroll` after manual scroll). Observe that the page does NOT flash a stage-1-final state for one frame. *(Manual; capture as DevTools-Performance recording on first run for baseline.)*
5. **CHOREO-07 / SC #4:** ClassName assertion test: render `<ScrollChoreography>`, query the outer `<section>`, assert `h-[280lvh]` and `h-svh` classes are present (or whatever final values D-18 retunes to). *(Falsifiable in vitest.)*
6. **CHOREO-07 + Pitfall 5 / SC #4:** Manual desktop viewport-resize test: load page, scroll to mid-stage, resize browser window, observe no mid-scroll lurch. *(Manual; the Phase 6 iOS Safari real-device test is the formal gate, but a desktop-resize sanity check belongs to Phase 2.)*
7. **PERF-04 / SC #4:** Static-analysis test: parse `paper-backdrop.tsx` and `product-screen.tsx`, assert no `useTransform` call animates `width`/`height`/`top`/`left`/`box-shadow`. *(Falsifiable in vitest.)*
8. **MIGRATE-03 / SC #5:** Static-analysis test: parse `paper-backdrop.tsx` and `product-screen.tsx`, for every `useTransform(scrollYProgress, [keyframes], [...])` call, assert all keyframe values come from `STAGES`/`byId()` references OR named local constants — no inline numeric literals like `[0, 0.6, 1]`. *(Falsifiable; AST-walk via @typescript-eslint/parser.)*
9. **CHOREO-08 / SC #1:** Video gate test: mount `<PaperBackdrop>` with mocked `scrollYProgress`, fire `change` event with `p = STAGES.wow.window[1] - 0.01` then `p = STAGES.wow.window[1] + 0.01`. Assert `videoRef.current.currentTime` was assigned in the first call and `videoRef.current.pause()` was called (not `currentTime`) in the second. *(Falsifiable; spy on video element.)*

## Critical Verification Finding (FOUND-04 / OQ-1)

**The Phase 1 contract `useScroll({ layoutEffect: false })` does not appear in motion@12.38's `useScroll` source.** Direct verification 2026-04-29:

- File: `node_modules/.pnpm/framer-motion@12.38.0_react-dom@19.2.5_react@19.2.5__react@19.2.5/node_modules/framer-motion/dist/es/value/use-scroll.mjs`
- Function signature: `function useScroll({ container, target, ...options } = {})`
- The `...options` is spread into the dom-level `scroll()` factory; `layoutEffect` is not destructured, branched on, or referenced anywhere
- `grep -rln "layoutEffect" node_modules/.pnpm/framer-motion@12.38.0/` returns zero matches
- `grep -rln "layoutEffect" node_modules/.pnpm/motion-dom@12.38.0/` returns zero matches
- The hook uses `useIsomorphicLayoutEffect` (which IS `useLayoutEffect` on the client) plus a `needsStart` ref pattern that defers ref measurement to a follow-up `useEffect` if the ref is unhydrated (lines 65–84 of use-scroll.mjs). This appears to be motion's *internal* fix for the production-flicker bug — superseding the older `layoutEffect: false` workaround.

**This is `[ASSUMED]` until verified by `pnpm preview`.** The planner has three options:

| Option | Action | Risk |
|--------|--------|------|
| A | Pass `layoutEffect: false` anyway (TS will accept it via `...options` spread) | LOW — silent no-op if motion 12.38 ignores it. If the bug reproduces, option B/C is the next step. |
| B | Surface to user during plan-check (`/gsd-discuss-phase` follow-up) and lock the contract based on user direction | MEDIUM — costs a round-trip but locks the FOUND-04 fix path |
| C | Verify in `pnpm preview` before locking, then either keep, remove, or replace the option | LOW — definitive answer; recommended path |

**Recommended: Option C, executed in Wave 4** (after PaperBackdrop / ProductScreen / orchestrator are all wired). The verification step is small (one `pnpm build && pnpm preview` + manual test), and if the bug doesn't reproduce, the FOUND-04 contract collapses to "no action needed in Phase 2" with a STATE.md note that motion 12.x fixed it internally. If the bug DOES reproduce, escalate as a Phase-blocker and surface to the user.

## Sources

### Primary (HIGH confidence)
- Context7 `/websites/motion_dev` — `useScroll`, `useTransform`, `useMotionValueEvent`, `useReducedMotion`, `motionValue`, `MotionConfig` API surface; verified 2026-04-29
- `motion.dev/docs/react-use-scroll` (direct fetch 2026-04-29) — confirmed official options: `target`, `offset`, `container`, `axis`, `trackContentSize`. **`layoutEffect` is NOT listed.**
- `motion.dev/docs/react-use-transform` (Context7 2026-04-29) — `clamp: true` default behavior; verified by Vue + React doc parity
- `motion.dev/docs/react-use-motion-value-event` (Context7) — auto-cleanup on unmount; "Handlers are automatically cleaned up when the component unmounts"
- `motion.dev/docs/react-motion-value` (Context7) — MotionValue propagation does not trigger React re-renders
- `tailwindcss.com/docs/height` (direct fetch 2026-04-29) — `h-svh`, `h-lvh`, `h-dvh` are first-class utilities in v4
- `caniuse.com/viewport-unit-variants` (direct fetch 2026-04-29) — Safari 15.4+, Chrome 108+, Firefox 101+, Edge 108+ all support `lvh`/`svh`/`dvh`; 94.26% global coverage
- `node_modules/.pnpm/framer-motion@12.38.0/.../value/use-scroll.mjs` (direct read 2026-04-29) — source proves `layoutEffect` is not a recognised option in motion 12.38
- Phase 1 RESEARCH.md `[CITED: GitHub motion #2452]` — historical context for the FOUND-04 contract
- Phase 1 VERIFICATION.md (in-repo) — confirms which artifacts Phase 1 shipped
- `src/components/landing/paper-hero.tsx` (in-repo) — reference for the extraction surface

### Secondary (MEDIUM confidence)
- `.planning/research/STACK.md` (in-repo, Phase 0) — verified motion API recommendations and the `layoutId` anti-pattern rationale
- `.planning/research/ARCHITECTURE.md` (in-repo, Phase 0) — single-orchestrator + downward-flowing motion values pattern
- `.planning/research/PITFALLS.md` (in-repo, Phase 0) — Pitfalls #1, #2, #5, #11, #12 (all Phase 2-relevant)
- `.planning/research/SUMMARY.md` (in-repo, Phase 0) — Phase 2 scope confirmation
- `.planning/codebase/CONCERNS.md` (in-repo) — flagged useState-on-scroll + magic-number keyframes pre-Phase 2
- GitHub motion#2452 (`github.com/motiondivision/motion/issues/2452`) — historical bug report; closed/open status not verified in 2026

### Tertiary (LOW confidence — synthesised, not verified by direct test in 2026)
- React Rules of Hooks docs (training data) — guides the conditional-useScroll pattern; standard knowledge
- React Context re-render semantics (training data) — Object.is comparison; standard knowledge
- Stacking-context creation rules from CSS spec — `transform`, `opacity < 1`, `filter`, `position: sticky` (Phase 1 PITFALLS.md cites MDN)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries already installed, version-pinned, and exercised in Phase 1
- Architecture (orchestrator + provider + subscribers): HIGH — direct generalization of Phase 1's documented pattern; the only novel decision is the two-component split (`<ScrollChoreography>` / `<ChoreographyTree>`) for hooks-rules compliance
- Pitfalls: HIGH — pulled directly from Phase 1's verified PITFALLS.md; all are pre-flagged
- FOUND-04 / `layoutEffect: false`: **LOW** — direct source-read does not confirm the option exists in motion 12.38; OQ-1 must be resolved before lock
- Test pattern: HIGH — Phase 1's vitest + jsdom + matchMedia shim infrastructure carries forward unchanged
- STAGES retuning: MEDIUM — `[0.20, 0.78]` is a visual-design first-pass; explicitly tunable

**Research date:** 2026-04-29
**Valid until:** 2026-05-29 (30 days; stable codebase, motion 12.x stable)

---

## RESEARCH COMPLETE

Phase 2 (Orchestrator Shell + Backdrop Migration) is well-bounded: locked decisions in CONTEXT.md cover every axis, and Phase 1 already shipped the typed data model + matchMedia infra. The single critical uncertainty is **OQ-1 (FOUND-04)** — direct read of motion@12.38's `useScroll` source shows `layoutEffect: false` is not a recognised option, contradicting the load-bearing comment Phase 1 encoded. Phase 2 must verify on `pnpm preview` (Wave 4 task) whether the production-flicker bug still reproduces; if not, motion 12.x fixed it internally. The hooks-rules constraint forces a two-component split (`<ScrollChoreography>` mode-switch + `<ChoreographyTree>` calls useScroll) — adopt this pattern explicitly. Wave 0 ships 7–9 fail-loudly test stubs covering CHOREO-01, CHOREO-06, CHOREO-07, CHOREO-08, MIGRATE-01..04, PERF-04.
