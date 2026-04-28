# Architecture Research

**Domain:** Scroll-driven shared-element landing-page choreography (TanStack Start + motion/react, brownfield)
**Researched:** 2026-04-28
**Confidence:** HIGH (Context7-verified motion/react and TanStack Start docs; codebase mapped from `.planning/codebase/`)

> Scope. This file answers: *how should the codebase be structured to land a 4-stage scroll choreography (Hero → Wow → Feature A → Feature B) without tearing down the existing layered architecture?* It is consumed by the roadmap; phase ordering and per-phase research flags should follow from the build order in **§ Build Order** and the SSR / mobile boundaries in **§ Architectural Patterns**.

---

## Headline Decision (TL;DR)

**Adopt a single sticky orchestrator + shared `MotionValue` context. Do NOT use `layoutId`.**

- One component — `<ScrollChoreography>` — owns a tall sticky scroll container, the single product-screen DOM node, and the master `useScroll()` hook.
- Stage components are **pure presentational subscribers** to a `ScrollChoreographyContext` that exposes `scrollYProgress` (a `MotionValue<number>`) plus a typed list of stage definitions.
- The product screen is **one absolutely-positioned `motion.div`** transformed by interpolated motion values — *not* swapped between stages.
- This is the same pattern `paper-hero.tsx` already uses, generalized from one zone to four.

Why not `layoutId`? `layoutId` triggers FLIP layout animations only when an element **mounts/unmounts** with a matching id. In a sticky scroll choreography the screen is *continuously visible* and its position must be *driven by scroll progress*, not by mount events. Forcing `layoutId` here would mean either (a) thrashing mount/unmount on scroll thresholds (bad for performance and accessibility) or (b) using it in name only while doing the real animation with motion values anyway. Use `layoutId` for click-driven shared transitions; use sticky + motion values for scroll-driven ones.

---

## System Overview

```
┌──────────────────────────────────────────────────────────────────────┐
│                       src/routes/index.tsx (HomePage)                 │
│                                                                       │
│   <SiteHeader/>   (already inside paper-hero today; keep that)        │
│                                                                       │
│   <ScrollChoreography>          ← NEW orchestrator (desktop)          │
│   ├── tall section (h-[~360vh])                                       │
│   │   └── sticky container (h-svh)                                    │
│   │       ├── <PaperBackdrop/>     ← existing paper-hero visuals      │
│   │       │   (illustration + scroll-linked video + clouds)           │
│   │       └── <ProductScreen/>     ← THE shared element (one node)    │
│   │           styled with MotionValues from context                   │
│   └── <StageCopyTrack/>            ← per-stage copy panels            │
│       ├── HeroCopy                                                    │
│       ├── WowCopy                                                     │
│       ├── FeatureACopy                                                │
│       └── FeatureBCopy                                                │
│                                                                       │
│   <ProofStrip/>   (existing, untouched)                               │
│   <FinalCta/>     (existing, untouched)                               │
└──────────────────────────────────────────────────────────────────────┘
                              │
                              ▼  context (MotionValue, no React state)
┌──────────────────────────────────────────────────────────────────────┐
│   ScrollChoreographyContext                                           │
│     - scrollYProgress: MotionValue<number>   (0 → 1, master)          │
│     - stages: ReadonlyArray<StageDef>        (typed config)           │
│     - reducedMotion: boolean                                          │
│     - mode: "choreography" | "static"        (mobile / a11y switch)   │
└──────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────────┐
│   Subscribers (pure, no own useScroll)                                │
│   - ProductScreen (transforms screen position, scale, layout origin)  │
│   - StageCopyTrack (fades each StageCopy via useTransform)            │
│   - PaperBackdrop  (drives video.currentTime via useMotionValueEvent) │
└──────────────────────────────────────────────────────────────────────┘
```

**Key architectural constraint:** scroll progress flows **down** via context and `MotionValue`. It never flows up. No child component owns its own `useScroll`. This is the same single-source-of-scroll discipline `paper-hero.tsx` already enforces — we are just elevating it one level so multiple subscribers can read from one source.

---

## Component Responsibilities

| Component | File path | Responsibility | Subscribes to | Owns DOM? |
|-----------|-----------|----------------|---------------|-----------|
| **`<ScrollChoreography>`** | `src/components/landing/scroll-choreography/scroll-choreography.tsx` | Owns `useScroll()`, sticky container, context provider; switches between choreography and static mode | — (it's the source) | Yes — tall section + sticky shell |
| **`<ProductScreen>`** | `src/components/landing/scroll-choreography/product-screen.tsx` | The single shared product UI node. Reads stage definitions; computes scale, x/y, opacity from `scrollYProgress` via `useTransform` | `scrollYProgress`, `stages` | Yes — one absolutely-positioned `motion.div` containing the browser-frame screenshot |
| **`<PaperBackdrop>`** | `src/components/landing/scroll-choreography/paper-backdrop.tsx` | Carries the existing paper-card illustration, scroll-linked video, and cloud parallax. *Extracted from current `paper-hero.tsx` body.* | `scrollYProgress` | Yes — the existing illustration + video |
| **`<StageCopyTrack>`** | `src/components/landing/scroll-choreography/stage-copy-track.tsx` | Renders the four `<StageCopy>` panels positioned next to / under the screen; each fades in/out on its scroll window | `scrollYProgress`, `stages` | Yes — copy regions |
| **`<StageCopy>`** | `src/components/landing/scroll-choreography/stage-copy.tsx` | Single stage's headline + body + bullets, with its own fade-in/out window | `scrollYProgress` (one window slice) | Yes — text only |
| **`<StaticChoreographyFallback>`** | `src/components/landing/scroll-choreography/static-fallback.tsx` | Mobile + reduced-motion fallback — renders each stage's end-state as an ordinary stacked section | — | Yes — plain layout |
| `<SiteHeader>` | `src/components/landing/site-header.tsx` | Unchanged | — | — |
| `<ProofStrip>`, `<FinalCta>` | existing files | Unchanged | — | — |
| `<PaperHero>` | `src/components/landing/paper-hero.tsx` | **Deprecated as a top-level section.** Its visual content is harvested into `<PaperBackdrop>`; its scroll logic is replaced by `<ScrollChoreography>` | — | — |

> **Deprecation note.** `paper-hero.tsx` is split, not deleted, in this milestone. The visual JSX (illustration, video, clouds, hero copy) becomes the body of `<PaperBackdrop>` + the Hero `<StageCopy>`. The scroll wiring (`useScroll`, `useTransform`, `useMotionValueEvent`, the video-currentTime handler) moves to `<ScrollChoreography>` and `<PaperBackdrop>`. Once `<ScrollChoreography>` ships, delete `paper-hero.tsx`.

---

## Recommended Project Structure

```
src/
├── routes/
│   └── index.tsx                           # composes <ScrollChoreography/> + ProofStrip + FinalCta
├── components/
│   └── landing/
│       ├── scroll-choreography/            # NEW — all choreography lives here
│       │   ├── scroll-choreography.tsx     # orchestrator (mode switch, useScroll, provider)
│       │   ├── scroll-choreography-context.tsx  # context + useScrollChoreography() hook
│       │   ├── product-screen.tsx          # the shared element
│       │   ├── paper-backdrop.tsx          # illustration + video + clouds (was paper-hero body)
│       │   ├── stage-copy-track.tsx        # positions StageCopy items
│       │   ├── stage-copy.tsx              # one stage's text content
│       │   ├── static-fallback.tsx         # mobile + reduced-motion path
│       │   ├── stages.ts                   # StageDef objects (motion targets) for the 4 stages
│       │   └── types.ts                    # StageDef, StageId, StageWindow, ScreenTarget
│       ├── site-header.tsx                 # unchanged
│       ├── product-section.tsx             # may be retired if FeatureA/B copy replaces it
│       ├── proof-strip.tsx                 # unchanged
│       ├── final-cta.tsx                   # unchanged
│       ├── email-capture.tsx               # unchanged
│       └── paper-hero.tsx                  # DELETE after migration completes
└── content/
    └── landing.ts                          # reshaped: stages[] + proof + finalCta
```

### Structure Rationale

- **One folder per feature, not per file type.** `scroll-choreography/` keeps the orchestrator, screen, backdrop, copy track, types, and stage data colocated. The codebase already groups by feature (`landing/`), this is one level deeper for a single complex feature.
- **Types and stage data are siblings of the components that use them**, not under `src/lib/` or `src/types/`. Conforms to the existing convention (`src/content/landing.ts` lives next to the components that read it).
- **Static fallback is a sibling of the choreography**, not a separate route. Same content tree, different rendering — chosen by a hook, not a route.
- **Conventions match the existing codebase**: kebab-case file names, named exports, no barrel files, `@/` alias.

---

## Reshaped `src/content/landing.ts`

The current file has `heroCopy`, `productCopy`, `modules` (3 entries), and `proofPoints`. The choreography needs four stages; the current `modules` array is the closest analog but is positioned for the standalone `<ProductSection>`. Reshape to a single `stages` array indexed by `StageId`.

```typescript
// src/content/landing.ts (proposed)

export type StageId = "hero" | "wow" | "featureA" | "featureB"

export type StageCopyContent = {
  id: StageId
  kicker?: string
  headline: string
  body?: string
  bullets?: ReadonlyArray<string>
  cta?: { label: string; href: string } // hero only, by convention
}

export const stages: ReadonlyArray<StageCopyContent> = [
  {
    id: "hero",
    headline: "See every student's full picture.",
    body: "...",
    cta: { label: "Start", href: TEACHER_WORKSPACE_APP_URL },
  },
  { id: "wow", headline: "One screen. Every signal." /* short caption */ },
  {
    id: "featureA",
    kicker: "A profile for every student",
    headline: "Every student, in context.",
    bullets: [
      "Grades, attendance, behavior — one page",
      "Messages home, attached to the student",
      "Term-by-term, not lost in tabs",
    ],
  },
  {
    id: "featureB",
    kicker: "Trends and notes",
    headline: "Patterns before problems.",
    bullets: [
      "Mastery curves and attendance dips surface early",
      "Notes that travel with the student term to term",
      "Hand off context cleanly at year end",
    ],
  },
] as const

export const TEACHER_WORKSPACE_APP_URL =
  "https://teacherworkspace-alpha.vercel.app/students"

export const proofPoints = [...]   // unchanged
export const finalCtaCopy = {...}  // extracted from FinalCta component if hardcoded
export const navItems = [...]      // unchanged
```

The existing `heroCopy` / `productCopy` / `modules` are migrated into `stages` (validated by `MARK-01..05` and `CHOREO-01..05` in `.planning/PROJECT.md`). Keep them around during the migration phase; remove once all section components consume `stages`.

---

## Architectural Patterns

### Pattern 1: Single sticky orchestrator + downward-flowing motion values

**What.** One component creates one `useScroll`. Its progress is exposed as a `MotionValue<number>` via React context. Children read it; nobody else creates one.

**When to use.** Any time multiple components need to coordinate on the same scroll axis. Independent `useScroll` instances drift, double-track, and create reflow hazards.

**Trade-offs.**
- (+) Single source of truth; no "whose progress is this" bugs.
- (+) `MotionValue` propagation does *not* trigger React re-renders — context value is stable across the component lifetime.
- (−) Adds one indirection (the provider) versus inlining everything.

**Example.**

```typescript
// scroll-choreography-context.tsx
import { createContext, useContext } from "react"
import type { MotionValue } from "motion/react"
import type { StageDef } from "./types"

type ScrollChoreographyValue = {
  scrollYProgress: MotionValue<number>
  stages: ReadonlyArray<StageDef>
  reducedMotion: boolean
  mode: "choreography" | "static"
}

const ScrollChoreographyContext =
  createContext<ScrollChoreographyValue | null>(null)

export function useScrollChoreography(): ScrollChoreographyValue {
  const v = useContext(ScrollChoreographyContext)
  if (!v) throw new Error("useScrollChoreography outside provider")
  return v
}

export { ScrollChoreographyContext }
```

```typescript
// scroll-choreography.tsx
import { useRef } from "react"
import { useScroll, useReducedMotion } from "motion/react"
import { ScrollChoreographyContext } from "./scroll-choreography-context"
import { stageDefs } from "./stages"
import { useIsDesktop } from "./use-is-desktop"   // see Mobile Fallback section
import { ProductScreen } from "./product-screen"
import { PaperBackdrop } from "./paper-backdrop"
import { StageCopyTrack } from "./stage-copy-track"
import { StaticChoreographyFallback } from "./static-fallback"

export function ScrollChoreography() {
  const sectionRef = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  })
  const reducedMotion = useReducedMotion() === true
  const isDesktop = useIsDesktop()

  const mode = !isDesktop || reducedMotion ? "static" : "choreography"

  if (mode === "static") {
    return <StaticChoreographyFallback stages={stageDefs} />
  }

  return (
    <ScrollChoreographyContext.Provider
      value={{ scrollYProgress, stages: stageDefs, reducedMotion, mode }}
    >
      <section ref={sectionRef} className="relative h-[360vh]">
        <div className="sticky top-0 h-svh overflow-hidden">
          <PaperBackdrop />
          <ProductScreen />
          <StageCopyTrack />
        </div>
      </section>
    </ScrollChoreographyContext.Provider>
  )
}
```

### Pattern 2: Stages as data, not branches

**What.** Each stage is a typed object describing its scroll window, the screen target (position/scale/origin), and which copy fades during it. Components are stage-agnostic — they iterate, they don't `if (stageId === "hero")`.

**When to use.** Any choreography with N≥3 stages. Two stages can get away with branches; four cannot without becoming spaghetti.

**Trade-offs.**
- (+) Adding a fifth stage = one more entry, no component edits.
- (+) Reduced-motion / static fallback can render stage end-states by reading the same data.
- (−) Slightly more upfront type design.

**Example.**

```typescript
// types.ts
export type StageId = "hero" | "wow" | "featureA" | "featureB"

/** Window in master scrollYProgress when this stage is "active". */
export type StageWindow = readonly [enter: number, peak: number, exit: number]

/** Screen layout target at this stage's peak. */
export type ScreenTarget = {
  /** scale relative to screen's intrinsic size */
  scale: number
  /** translation as percentage of viewport (e.g. -25 = -25vw) */
  xPercent: number
  yPercent: number
  /** transform-origin so morphs feel anchored */
  origin: { x: string; y: string }
}

export type StageDef = {
  id: StageId
  window: StageWindow
  target: ScreenTarget
  /** matched against StageCopyContent.id from src/content/landing.ts */
  copyId: StageId
}
```

```typescript
// stages.ts
import type { StageDef } from "./types"

export const stageDefs: ReadonlyArray<StageDef> = [
  {
    id: "hero",
    window: [0.00, 0.05, 0.20],
    target: { scale: 0.18, xPercent: 0, yPercent: 8,
              origin: { x: "50%", y: "92%" } },
    copyId: "hero",
  },
  {
    id: "wow",
    window: [0.20, 0.40, 0.55],
    target: { scale: 1.00, xPercent: 0, yPercent: 0,
              origin: { x: "50%", y: "50%" } },
    copyId: "wow",
  },
  {
    id: "featureA",
    window: [0.55, 0.70, 0.80],
    target: { scale: 0.55, xPercent: 22, yPercent: 0,
              origin: { x: "50%", y: "50%" } },
    copyId: "featureA",
  },
  {
    id: "featureB",
    window: [0.80, 0.92, 1.00],
    target: { scale: 0.55, xPercent: -22, yPercent: 0,
              origin: { x: "50%", y: "50%" } },
    copyId: "featureB",
  },
] as const
```

`<ProductScreen>` reduces these into one motion value per axis with `useTransform(scrollYProgress, keyframesIn, keyframesOut)`:

```typescript
// product-screen.tsx (sketch)
import { motion, useTransform } from "motion/react"
import { useScrollChoreography } from "./scroll-choreography-context"

export function ProductScreen() {
  const { scrollYProgress, stages } = useScrollChoreography()

  // Stitch the per-stage targets into keyframes at each stage's peak.
  const stops = stages.map((s) => s.window[1])  // peak progress
  const scale = useTransform(
    scrollYProgress,
    stops,
    stages.map((s) => s.target.scale),
  )
  const xPct = useTransform(
    scrollYProgress,
    stops,
    stages.map((s) => s.target.xPercent),
  )
  const yPct = useTransform(
    scrollYProgress,
    stops,
    stages.map((s) => s.target.yPercent),
  )

  return (
    <motion.div
      aria-hidden
      className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center"
      style={{ scale, x: xPct.get() + "vw", y: yPct.get() + "vh" }}
    >
      {/* browser-frame screenshot — single instance, never remounted */}
    </motion.div>
  )
}
```

(Final code uses `useMotionTemplate` or composed `useTransform` for the `vw`/`vh` units — sketch only.)

### Pattern 3: One shared DOM node, never `layoutId` for scroll

**What.** The product screen is rendered exactly once. Its visual progression through the four stages is achieved by interpolating its transform — never by mounting a different screen per stage.

**Why not `layoutId`.** Per Motion docs (Context7, `/websites/motion_dev`, "layoutId"): *"When a new element enters the DOM with a matching layoutId, it animates from the previous element's size and position. If the previous component remains in the tree, the two elements will crossfade."* `layoutId` is mount-driven (FLIP). For scroll-driven choreography you need progress-driven interpolation, which is exactly what `useTransform(MotionValue, ...)` does. Two further reasons:
1. `layoutId` triggers actual layout reads (FLIP), which hurts performance and risks CLS regressions (`PERF-01` constraint in `PROJECT.md`).
2. Mount/unmount over scroll thresholds creates accessibility issues — assistive tech sees the screen disappear and reappear.

`layoutId` remains the right tool for click/route-driven shared transitions. It is the wrong tool here.

**When `layoutId` *would* be correct.** A future "click a feature card → expand to fullscreen detail" interaction. That is out of scope for this milestone.

### Pattern 4: Reduced-motion and mobile collapse to the same static path

**What.** Both `useReducedMotion() === true` and "viewport < desktop" route to one `<StaticChoreographyFallback>` component. The component reads the same `stages` array and renders each stage's copy + the screen image as ordinary stacked sections.

**Trade-off.** (+) No duplicated content tree. (+) Mobile and a11y users see consistent content. (−) The static layout has to look intentional in two contexts (mobile and desktop+reduced-motion). Acceptable.

---

## Data Flow

### Scroll progress flow

```
Browser scroll event
     ↓
<ScrollChoreography>: useScroll({ target: sectionRef, offset: [...] })
     ↓
   scrollYProgress: MotionValue<number>     ← single source of truth
     ↓ (via React Context, value is stable)
     │
     ├─→ <ProductScreen>        useTransform(progress, [stops], [targets])
     │       ↓
     │     style={{ scale, x, y, opacity }} on <motion.div>
     │       ↓
     │     direct DOM update via Motion's renderer (no React re-render)
     │
     ├─→ <StageCopyTrack>       per-stage useTransform for opacity/y
     │
     └─→ <PaperBackdrop>        useMotionValueEvent("change", ...) to drive
                                video.currentTime (existing pattern)
```

### Why context+`MotionValue` instead of prop drilling or per-component `useScroll`

- **`MotionValue` doesn't re-render React.** Per Motion docs: *"Motion values are performant because they can be rendered with Motion's optimised DOM renderer without triggering React re-renders."* Passing it through context costs nothing.
- **Per-component `useScroll` would create N independent observers** on the same element. Each computes the same progress and adds reflow risk. We've already paid for one observer; share it.
- **Prop drilling** is fine for two layers; the choreography has three or four (orchestrator → track → copy → text). Context wins.

### State summary

| State | Where it lives | Why |
|-------|----------------|-----|
| `scrollYProgress` | `<ScrollChoreography>` `useScroll` | Single source |
| Stage *configuration* (windows, targets) | `stages.ts` | Static data |
| Stage *copy* | `src/content/landing.ts` `stages` | Existing convention |
| `reducedMotion` | `useReducedMotion()` in orchestrator | Hook owns this |
| `isDesktop` | `useIsDesktop()` (matchMedia, client-only) | See Mobile Fallback |
| Per-stage active flag | Derived from `scrollYProgress` via `useTransform` | Don't store; compute |
| Video `currentTime` | Imperative ref in `<PaperBackdrop>` (preserved) | Same as today |

**Key rule:** *no `useState` driven by scroll progress*. The current `paper-hero.tsx` uses `setStageOpacity`/`setScreenOpacity`/`setCopyOpacity` from `useMotionValueEvent`, which causes React re-renders on every scroll frame. The new architecture uses `useTransform` + `style={{ opacity: motionValue }}` instead, which updates the DOM directly. This is a measurable perf improvement and is required by `PERF-01`.

---

## Build Order

The roadmap should treat these as the dependency chain. **Each step unblocks the next.** Steps 1–3 ship together as a "scaffolding" phase; 4–6 are the choreography content; 7–8 are polish/ship.

| # | Build | Unblocks | Why this order |
|---|-------|----------|----------------|
| 1 | **Types + stage data** (`types.ts`, `stages.ts`, reshape `content/landing.ts` to add `stages: StageCopyContent[]`) | Everything else | All components import `StageDef`/`StageCopyContent`; without this nothing compiles |
| 2 | **Context + orchestrator shell** (`scroll-choreography-context.tsx`, skeleton `scroll-choreography.tsx` with the sticky shell, no children yet) | Subscribers | Provides the `MotionValue` children will read |
| 3 | **`useIsDesktop` + `<StaticChoreographyFallback>`** (renders all four stages stacked) | Mobile a11y, dev workflow | Guarantees the page is never broken on mobile or with reduced motion while choreography is being built |
| 4 | **`<PaperBackdrop>`** (extract existing illustration + video + clouds from `paper-hero.tsx`; rewire video `currentTime` to consume the orchestrator's `scrollYProgress`) | Hero stage works | The Hero stage *needs* the backdrop in place |
| 5 | **`<ProductScreen>`** (the shared element with all four stage targets stitched into one transform) | Wow / FeatureA / FeatureB stages | Without it, only the backdrop is visible |
| 6 | **`<StageCopyTrack>` + `<StageCopy>`** (per-stage copy fade-in/out) | Narrative complete | Choreography reads as a story only once copy beats land |
| 7 | **Wire into `routes/index.tsx`** (replace `<PaperHero/>` with `<ScrollChoreography/>`; delete `paper-hero.tsx`) | Production parity check | Switches the live page over |
| 8 | **Polish + perf pass** (cubicBezier easings on each `useTransform`, GPU-only properties verified, Lighthouse, CLS check) | `SHIP-01` | Final quality gate |

**Parallelizable.** Steps 4 and 5 can be built in parallel by two contributors after step 3 lands. Step 6 needs step 5's screen positions to know where copy panels should sit, so it follows.

---

## SSR Boundaries (TanStack Start)

TanStack Start does SSR. The choreography must not produce hydration mismatches (Context7 ref: `/websites/tanstack_start`, "Hydration Mismatches").

| Concern | Boundary | Why |
|---------|----------|-----|
| `useScroll` | Safe to render in SSR; motion values default to 0 on server, hydrate to real values on client | Confirmed: `paper-hero.tsx` already does this in production |
| `useReducedMotion` | Returns `null` on SSR, `true`/`false` after hydration | The orchestrator must treat `null` as "not yet decided" — render choreography optimistically and downgrade if needed; or render static and upgrade on hydration |
| `matchMedia` for `isDesktop` | **Client-only.** Wrap with `useHydrated()` from `@tanstack/react-router` | Server can't know viewport width |
| `<video>` `currentTime` | Imperative; only inside `useEffect` | DOM-only API |
| `<MotionConfig reducedMotion="user">` | Safe in SSR | Pure prop wrapper |
| Mobile fallback decision | **Render-time on client only**, after `useHydrated()` returns true | Otherwise SSR returns the wrong tree |

### Recommended SSR-safe pattern for the desktop/mobile switch

```typescript
// use-is-desktop.ts
import { useEffect, useState } from "react"
import { useHydrated } from "@tanstack/react-router"

export function useIsDesktop(): boolean {
  const hydrated = useHydrated()
  const [isDesktop, setIsDesktop] = useState(true) // optimistic on server

  useEffect(() => {
    if (!hydrated) return
    const mq = window.matchMedia("(min-width: 1024px)")
    const update = () => setIsDesktop(mq.matches)
    update()
    mq.addEventListener("change", update)
    return () => mq.removeEventListener("change", update)
  }, [hydrated])

  // During SSR + first client render, return `true` so server and client agree;
  // a one-frame swap to mobile happens after hydration if needed.
  return hydrated ? isDesktop : true
}
```

The "optimistic desktop" choice means desktop users get the choreography on first paint with no flash. Mobile users see the choreography shell for one frame before swapping to the static fallback. If that flash is too visible we can:
- (a) gate on a CSS `@media (max-width: 1023px)` that hides the choreography section, or
- (b) wrap the entire `<ScrollChoreography>` in `<ClientOnly fallback={<StaticChoreographyFallback/>}>` so SSR only ever produces the static tree.

**Recommendation:** start with option (a) — pure CSS gate as a backstop — combined with the JS-driven `useIsDesktop` switch. CSS handles the first-frame correctness; JS handles the dynamic resize case.

### `'use client'` notes

TanStack Start does not require `'use client'` directives — it is not React Server Components. All current landing components run on both server and client. Do **not** introduce `'use client'`; it isn't a meaningful boundary in this stack.

What *is* meaningful:
- Reads of `window`, `document`, `navigator`, `matchMedia` → guard with `useEffect` or `useHydrated`.
- Direct video element manipulation → already in `useEffect`. Preserve.

---

## Mobile Fallback Strategy

**One content tree, two render paths, chosen at the orchestrator level.**

```
<ScrollChoreography>
   │
   ├─ if (mode === "static")  → <StaticChoreographyFallback stages={...}/>
   │                            renders:
   │                              <PaperBackdropStatic/>
   │                              <StageCopyStatic id="hero"/>
   │                              <StaticScreenshot/>
   │                              <StageCopyStatic id="wow"/>
   │                              <StageCopyStatic id="featureA"/> + screenshot
   │                              <StageCopyStatic id="featureB"/> + screenshot
   │
   └─ if (mode === "choreography") → tall section + sticky + ProductScreen
```

**Why this is one component tree, not two.**
- Both paths import from the same `stages` array (data, not JSX).
- `<StageCopy>` content is identical in both modes; only its container differs.
- The screen image is the same `<img>` in both modes; only its motion wrapper differs.

**Switch trigger.**
```
mode = (isDesktop && !reducedMotion) ? "choreography" : "static"
```

**Out of scope per `PROJECT.md`.** Mobile pinned-scroll engineering is explicitly deferred (`MOBILE-01`, plus Out-of-Scope: *"Full mobile parity for the choreography — mobile gets a static fallback by design"*). The architecture above honors that.

---

## Coexistence with Existing `paper-hero.tsx` `useScroll`

`paper-hero.tsx` currently runs its own `useScroll` and uses `useMotionValueEvent` to drive `videoRef.current.currentTime`. **This is the only nontrivial behavior the choreography needs to preserve.** The migration:

| Today (`paper-hero.tsx`) | After migration |
|--------------------------|-----------------|
| `useScroll` on the section ref | Removed; orchestrator owns it |
| `stageScale`, `screenScale`, `copyY` `useTransform`s | Replaced by `<ProductScreen>`'s stitched targets in `stages.ts` |
| `cloudYLeft`, `cloudYRight` parallax | Moved into `<PaperBackdrop>`, reads `scrollYProgress` from context |
| `useMotionValueEvent` updating `setStageOpacity`/`setScreenOpacity`/`setCopyOpacity` `useState`s | **Eliminated.** Use `useTransform` → `style={{ opacity }}` directly. No React re-renders on scroll. |
| `useMotionValueEvent` driving `video.currentTime` | Preserved verbatim, moved into `<PaperBackdrop>` |
| `useReducedMotion` branching the JSX | Moved up to orchestrator-level mode switch |
| Inline browser-frame screenshot for the second screen | Removed — now lives in `<ProductScreen>` |

There is **no period during the migration where two `useScroll` instances run simultaneously**, because step 7 (rewire `routes/index.tsx`) is the same step that retires `paper-hero.tsx`. Until step 7, the page still uses the old hero; from step 7 onward, only the orchestrator.

---

## Typing Strategy

```typescript
// scroll-choreography/types.ts
import type { MotionValue } from "motion/react"

export type StageId = "hero" | "wow" | "featureA" | "featureB"

export type StageWindow = readonly [enter: number, peak: number, exit: number]

export type ScreenTarget = {
  scale: number
  xPercent: number          // -100..100, percentage of viewport width
  yPercent: number          // -100..100, percentage of viewport height
  origin: { x: string; y: string }  // CSS transform-origin values
}

export type StageDef = {
  readonly id: StageId
  readonly window: StageWindow
  readonly target: ScreenTarget
  readonly copyId: StageId
}

export type ScrollChoreographyMode = "choreography" | "static"

export type ScrollChoreographyContextValue = {
  scrollYProgress: MotionValue<number>
  stages: ReadonlyArray<StageDef>
  reducedMotion: boolean
  mode: ScrollChoreographyMode
}
```

```typescript
// src/content/landing.ts (relevant addition)
import type { StageId } from "@/components/landing/scroll-choreography/types"

export type StageCopyContent = {
  readonly id: StageId
  readonly kicker?: string
  readonly headline: string
  readonly body?: string
  readonly bullets?: ReadonlyArray<string>
  readonly cta?: { readonly label: string; readonly href: string }
}

export const stages: ReadonlyArray<StageCopyContent> = [/* ... */] as const
```

**Type discipline points.**
- `StageId` is a string-literal union, *not* an enum. Matches existing convention (no enums anywhere in the codebase).
- `StageDef` is `readonly`-deep. The `stageDefs` array is `as const`. Compile-time guarantee that nothing mutates choreography config.
- The link between a `StageDef.copyId` and a `StageCopyContent.id` is a string union — TS will reject mismatches.
- `MotionValue<number>` from `motion/react` is the type that must flow through context. Do not unwrap to `number` — that defeats the no-re-render property.
- `verbatimModuleSyntax: true` is set in `tsconfig.json` (per `CONVENTIONS.md`); use `import type` for `StageDef`, `MotionValue`, etc.

---

## Anti-Patterns

### Anti-Pattern 1: Multiple `useScroll` instances tracking the same element

**What people do.** Each stage component calls its own `useScroll` against the same parent ref.
**Why it's wrong.** N IntersectionObservers and N rAF subscriptions for one timeline. Reflow risk. The progress values can drift across hooks under heavy load.
**Do this instead.** One `useScroll` in the orchestrator; share via context.

### Anti-Pattern 2: Using `layoutId` for scroll-driven shared elements

**What people do.** Render four `<motion.div layoutId="screen"/>` (one per stage) and rely on FLIP.
**Why it's wrong.** `layoutId` is mount-driven. Scroll choreographies need progress-driven transforms. The two paradigms fight: either you mount/unmount on scroll thresholds (jank) or `layoutId` does nothing useful (waste). FLIP also performs layout reads, harming CLS / Lighthouse (`PERF-01`).
**Do this instead.** One persistent `<motion.div>` driven by `useTransform` from a shared `MotionValue`.

### Anti-Pattern 3: `useState` driven by scroll progress

**What people do.** `useMotionValueEvent("change", (p) => setOpacity(...))` and bind `style={{ opacity }}` from React state. *(This is what `paper-hero.tsx` does today.)*
**Why it's wrong.** Re-renders the React tree at scroll-frame frequency. Wasted work; risks dropped frames on weaker devices.
**Do this instead.** `const opacity = useTransform(scrollYProgress, [...], [...])` and `style={{ opacity }}` — the `MotionValue` drives the DOM directly without re-rendering.

### Anti-Pattern 4: Two parallel component trees for desktop and mobile

**What people do.** `<ScrollChoreographyDesktop/>` + `<StackedSectionsMobile/>` with the copy duplicated in each.
**Why it's wrong.** Two places to update copy. Drift guaranteed. Doubles QA surface.
**Do this instead.** One `stages` data array. Two render paths chosen by the orchestrator. Same content, different containers.

### Anti-Pattern 5: Animating non-GPU properties

**What people do.** `useTransform` on `width`, `top`, `left`, `margin`, etc.
**Why it's wrong.** Layout-triggering. CLS regressions. `PROJECT.md` constraint: *"Scroll choreography is GPU-friendly (transform/opacity only); no layout thrash."*
**Do this instead.** `transform` (scale, x, y) and `opacity` only. Position with absolute + percentage-based `x`/`y`.

---

## Integration Points

### External Services

This milestone introduces no new external services. Vercel deployment unchanged.

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| `<ScrollChoreography>` ↔ children | React context (`ScrollChoreographyContext`) | One-way: orchestrator → children |
| `<PaperBackdrop>` ↔ `<video>` | Imperative ref + `useMotionValueEvent` for `currentTime` | Preserved exactly from `paper-hero.tsx` |
| `routes/index.tsx` ↔ `<ScrollChoreography>` | Direct render in `<HomePage>` | Replaces `<PaperHero/>` |
| `stages.ts` (motion targets) ↔ `content/landing.ts` (copy) | Linked by `StageId` string union | TS-checked; no runtime lookup risk |
| `<StaticChoreographyFallback>` ↔ `stages` data | Reads same array, ignores `target`, uses only `copyId` | One source of content for both modes |

---

## Quality-Gate Checklist (per task brief)

- [x] **Components clearly defined with file paths** — see § Component Responsibilities table
- [x] **Data flow direction explicit** — § Data Flow; scroll progress flows orchestrator → context → subscribers, never upward
- [x] **Build order implications noted** — § Build Order, 8-step dependency chain
- [x] **SSR boundaries called out** — § SSR Boundaries; `useHydrated` for `matchMedia`, optimistic-desktop pattern, no `'use client'` needed
- [x] **Doesn't fight the existing layered architecture** — extends the layered model: `routes/` composes `components/landing/scroll-choreography/`, which uses `content/landing.ts` and `components/ui/`. Same direction of dependency as today.

---

## Sources

- Motion docs (Context7, `/websites/motion_dev`): `useScroll` target/offset, `MotionValue` re-render semantics, `useTransform`, `useMotionValueEvent`, `useReducedMotion`, `MotionConfig`, `layoutId` (and its mount-driven semantics that disqualify it for scroll-driven shared elements)
- TanStack Start docs (Context7, `/websites/tanstack_start`): `<ClientOnly>`, `useHydrated()`, hydration-mismatch anti-pattern, `createClientOnlyFn`
- Existing codebase: `src/components/landing/paper-hero.tsx` (the proven scroll-linked pattern this generalizes), `src/routes/index.tsx`, `src/content/landing.ts`
- Project context: `.planning/PROJECT.md` (CHOREO-01..06, MOBILE-01, A11Y-01, PERF-01, VISUAL-01..02), `.planning/codebase/ARCHITECTURE.md`, `.planning/codebase/STRUCTURE.md`, `.planning/codebase/CONVENTIONS.md`

---

*Architecture research for: scroll-driven shared-element landing-page choreography*
*Researched: 2026-04-28*
