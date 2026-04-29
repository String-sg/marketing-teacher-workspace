# Phase 2: Orchestrator Shell + Backdrop Migration — Pattern Map

**Mapped:** 2026-04-29
**Files analyzed:** 14 (8 new, 6 modified — including pre-existing test/data updates)
**Analogs found:** 14 / 14
**Primary analog:** `src/components/landing/paper-hero.tsx` (Phase 2 IS the extraction)

## File Classification

| New / Modified File | Status | Role | Data Flow | Closest Analog | Match Quality |
|---------------------|--------|------|-----------|----------------|---------------|
| `src/components/landing/scroll-choreography/scroll-choreography.tsx` | modify | orchestrator (component) | event-driven (scroll → MotionValue → context) | `paper-hero.tsx` (top-level structure + mode detection) | exact (extraction) |
| `src/components/landing/scroll-choreography/paper-backdrop.tsx` | new | presentational subscriber (component) | event-driven (scrollYProgress → useTransform + useMotionValueEvent) | `paper-hero.tsx:112–194` + `:85–95` | exact (extraction) |
| `src/components/landing/scroll-choreography/product-screen.tsx` | new | presentational subscriber (component) | event-driven (scrollYProgress → useTransform) | `paper-hero.tsx:196–220` | exact (extraction) |
| `src/components/landing/scroll-choreography/stages.ts` | modify | data module | request-response (pure data) | (self — retune in place) | n/a |
| `src/components/landing/scroll-choreography/scroll-choreography.test.tsx` | new | unit test | request-response | `use-is-desktop.test.ts` (renderHook + matchMedia override) + `static-choreography-fallback.test.tsx` (render + screen) | role-match |
| `src/components/landing/scroll-choreography/paper-backdrop.test.tsx` | new | unit test | event-driven (motion-value mock) | `use-is-desktop.test.ts` (vi.fn override pattern) + `stages.test.ts` (assertion shape) | role-match |
| `src/components/landing/scroll-choreography/product-screen.test.tsx` | new | unit test | event-driven (rerender + ref-counter) | `static-choreography-fallback.test.tsx` (render + role queries) | role-match |
| `src/components/landing/scroll-choreography/header-stacking.test.tsx` | new | integration test | request-response | `landmark-audit.test.tsx` (HomePageFixture composition + within() landmark queries) | exact |
| `src/components/landing/scroll-choreography/choreography-rerender-budget.test.tsx` | new | integration test | event-driven (render-counter ref) | `static-choreography-fallback.test.tsx` (render shape) + custom render-counter | role-match |
| `src/components/landing/scroll-choreography/migrate-03-keyframe-binding.test.ts` | new | static-analysis test (AST) | file-I/O (fs.readFile + regex/AST scan) | (no in-repo analog) | no analog — see § "No Analog Found" |
| `src/components/landing/scroll-choreography/migrate-perf-04.test.ts` | new | static-analysis test (AST) | file-I/O (fs.readFile + regex/AST scan) | (no in-repo analog) | no analog — see § "No Analog Found" |
| `src/routes/index.tsx` | modify | route component | request-response | (self — single-line swap) | n/a |
| `src/styles.css` | modify | stylesheet | n/a | (self — class consumer added; rule already exists at lines 226–230) | n/a |
| `src/components/landing/scroll-choreography/context.tsx` | (no edit) | context provider | event-driven | (self — Phase 2 mounts a real provider in `<ScrollChoreography>` but file unchanged per CONTEXT.md "Integration Points") | n/a |

## Pattern Assignments

### `src/components/landing/scroll-choreography/scroll-choreography.tsx` (orchestrator)

**Analog:** `src/components/landing/paper-hero.tsx` (top-level mode detection + useScroll wiring) + `src/components/landing/scroll-choreography/use-is-desktop.ts` (SSR-safe hook usage). Per RESEARCH Pattern 1 the file MUST split into a parent (mode switch) + child `<ChoreographyTree>` (calls `useScroll`) so hooks aren't called conditionally.

**Imports pattern** (paper-hero.tsx:1–16):

```typescript
import {
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useTransform,
} from "motion/react"
import { useEffect, useRef, useState } from "react"

import { useIsDesktop } from "@/components/landing/scroll-choreography/use-is-desktop"
import { Button } from "@/components/ui/button"
import {
  finalCtaCopy,
  stages,
  TEACHER_WORKSPACE_APP_URL,
} from "@/content/landing"
```

Phase 2 keeps the same import shape but uses **relative imports** for sibling files (`./use-is-desktop`, `./context`, `./stages`, `./paper-backdrop`, `./product-screen`, `./static-choreography-fallback`) per CONVENTIONS.md (no barrel files, kebab-case).

**Mode-detection pattern** (paper-hero.tsx:30–36):

```typescript
const prefersReducedMotion = useReducedMotion()
const isDesktop = useIsDesktop()
// Mobile users get the static fallback layout (per CLAUDE.md "Mobile: Static
// fallback only" + static-choreography-fallback.tsx docstring). Reduced-motion
// users likewise get the static branch.
const reduced = prefersReducedMotion === true || !isDesktop
```

Phase 2 keeps this verbatim, then early-returns `<StaticChoreographyFallback />` when `reduced === true`.

**`useScroll` configuration** (paper-hero.tsx:37–40 — port verbatim, ADD `layoutEffect: false`):

```typescript
const { scrollYProgress } = useScroll({
  target: sectionRef,
  offset: ["start start", "end end"],
})
```

Phase 2 adds `layoutEffect: false` per the Phase 1 load-bearing comment in `scroll-choreography.tsx:6–13` (FOUND-04). RESEARCH § Critical Verification Finding flags that this option may be vestigial in motion 12.38; the planner may need a `@ts-expect-error` comment until the planner verifies on `vite preview`.

**Outer / inner sticky shell pattern** (paper-hero.tsx:97–110 — port and tweak):

```typescript
return (
  <section
    aria-labelledby="hero-title"
    className={
      reduced ? "relative min-h-svh overflow-hidden" : "relative h-[280vh]"
    }
    ref={sectionRef}
  >
    <div
      className={
        reduced
          ? "relative p-3"
          : "sticky top-0 flex h-svh items-stretch overflow-hidden p-3"
      }
    >
```

Phase 2 takes the **non-reduced branch only** (the orchestrator already early-returned for reduced) and changes `h-[280vh]` → `h-[280lvh]` per CONTEXT D-18 / CHOREO-07. Adds `scroll-choreography-only` class to the outer `<section>` per CONTEXT "Claude's Discretion" (defense-in-depth alongside JS branch). Inner sticky stays `h-svh`.

**Provider mount pattern** (RESEARCH § Pattern 4 — new code, no in-repo analog yet because the Phase 1 provider was a stub-only module):

```typescript
return (
  <ScrollChoreographyContext.Provider
    value={{
      scrollYProgress,
      stages: STAGES,
      reducedMotion: false,
      mode: "choreography",
    }}
  >
    {/* sticky shell */}
  </ScrollChoreographyContext.Provider>
)
```

Note from RESEARCH Pitfall 6: no `useMemo` needed in Phase 2 (single re-render at mount; no consumers read `mode`/`reducedMotion`).

**Children-as-hero-copy pattern** (paper-hero.tsx:147–170 — extract the `<motion.div>` wrapper + copy + CTA, render as `children` of `<PaperBackdrop>`):

```typescript
// Phase 1 paper-hero.tsx:148–170 — preserved 1:1 in Phase 2's <ScrollChoreography>
<motion.div
  className="mt-14 flex flex-col items-center text-center sm:mt-20"
  style={reduced ? undefined : { opacity: copyOpacity, y: copyY }}
>
  <h1 id="hero-title" className="font-heading text-[clamp(1.75rem,4.4vw,4rem)] ...">
    {hero.headline}
  </h1>
  <p className="mt-3 max-w-xl ...">{hero.subline}</p>
  <Button asChild className="mt-6 h-11 rounded-full bg-primary ...">
    <a href={TEACHER_WORKSPACE_APP_URL} rel="noreferrer">
      {finalCtaCopy.cta}
    </a>
  </Button>
</motion.div>
```

In Phase 2 this block lives in `<ScrollChoreography>`'s body and is passed as `children` to `<PaperBackdrop>` (CONTEXT D-06/D-07). The `reduced ? undefined : ...` guard goes away (orchestrator already early-returned for reduced).

**Hero copy intra-stage timing** (RESEARCH lines 261–263 + Pattern 1 example lines 296–305 — D-13 named local consts):

```typescript
const HERO_COPY_LIFT_PROGRESS = 0.14    // intra-stage timing — D-13
const HERO_COPY_FADE_OUT_START = 0.06   // intra-stage timing — D-13
const HERO_COPY_FADE_OUT_END = 0.14     // intra-stage timing — D-13

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
```

Replaces the Phase 1 paper-hero.tsx:56–60 inline `[0, 0.14, 1]` magic numbers (MIGRATE-03 satisfied: zero inline magic-number tuples).

**Stages content lookup pattern** (paper-hero.tsx:21–25 — port with tightened `byId` semantics):

```typescript
// paper-hero.tsx (current — uses .find + non-null narrowing)
const heroEntry = stages.find((s) => s.id === "hero")
if (!heroEntry || heroEntry.id !== "hero") {
  throw new Error("PaperHero: hero stage missing from content/landing stages")
}
const hero = heroEntry.copy
```

Phase 2 retains the discriminated-union narrow (`heroEntry.id === "hero"` is required so TypeScript narrows `copy` to `{ headline, subline }`). RESEARCH example uses a less-safe `as` cast (`heroEntry.copy as { headline: string; subline: string }`); prefer the in-repo `find + narrow` shape — it's safer and matches `paper-hero.tsx`.

---

### `src/components/landing/scroll-choreography/paper-backdrop.tsx` (presentational subscriber — NEW)

**Analog:** `paper-hero.tsx:112–194` (paper-card frame + clouds + illustration/video) + `paper-hero.tsx:85–95` (loadedmetadata effect).

**Imports + context-subscription pattern** (RESEARCH Pattern 3 lines 418–425):

```typescript
import { motion, useMotionValueEvent, useTransform } from "motion/react"
import { useEffect, useRef } from "react"
import type { ReactNode } from "react"

import { useScrollChoreography } from "./context"
import { byId } from "./stages"

export function PaperBackdrop({ children }: { children?: ReactNode }) {
  const { scrollYProgress } = useScrollChoreography()
  const videoRef = useRef<HTMLVideoElement>(null)
  const videoDurationRef = useRef(0)
  // ...
}
```

Note `import type { ReactNode }` per `verbatimModuleSyntax: true` (CONVENTIONS.md). Named export only.

**MIGRATE-02 / CHOREO-06 fix — useState → useTransform** (replaces paper-hero.tsx:64–78):

```typescript
// paper-hero.tsx:64–78 (the debt being paid down):
const [stageOpacity, setStageOpacity] = useState(1)
useMotionValueEvent(scrollYProgress, "change", (p) => {
  setStageOpacity(p < 0.6 ? 1 : clamp01(1 - (p - 0.6) / 0.18))
  // ...
})
```

Becomes (RESEARCH lines 387–397):

```typescript
const STAGE_OPACITY_FADE_END = byId("wow").window[1]    // stage-aligned via STAGES
const STAGE_OPACITY_FADE_START = 0.6                     // intra-stage local const — D-13

const stageScale = useTransform(scrollYProgress, [0, 0.6, 1], [1, 2.4, 5.2])
//                                              ^^^^^^^^^^^ Phase 2 must replace
//                                              with stage-aligned + named consts
const stageOpacity = useTransform(
  scrollYProgress,
  [STAGE_OPACITY_FADE_START, STAGE_OPACITY_FADE_END],
  [1, 0],
)
const cloudYLeft = useTransform(scrollYProgress, [0, 1], ["0px", "-160px"])
const cloudYRight = useTransform(scrollYProgress, [0, 1], ["0px", "-110px"])
```

`useTransform`'s default `clamp: true` removes the `clamp01` helper from paper-hero.tsx:18. **Do not** carry `clamp01` into the new file (RESEARCH § "Don't Hand-Roll").

**MIGRATE-03 endpoint-only binding** (D-12 + D-13):

```typescript
// Stage-aligned endpoints reference STAGES directly:
const VIDEO_GATE_THRESHOLD = byId("wow").window[1]

// Intra-stage values are named local consts at file top:
const HERO_COPY_LIFT_PROGRESS = 0.14
const STAGE_SCALE_MID = 0.6
```

**`loadedmetadata` effect pattern** (paper-hero.tsx:85–95, **dep array becomes `[]`** per D-17 — PaperBackdrop only renders in choreography mode so `reduced` doesn't exist):

```typescript
// paper-hero.tsx:85–95 (port, drop the [reduced] guard):
useEffect(() => {
  const video = videoRef.current
  if (!video) return
  const handleMeta = () => {
    videoDurationRef.current = video.duration || 0
  }
  if (video.readyState >= 1) handleMeta()
  else video.addEventListener("loadedmetadata", handleMeta)
  return () => video.removeEventListener("loadedmetadata", handleMeta)
}, [])  // D-17: empty deps; PaperBackdrop never renders under reduced
```

The Phase 1 WR-06 fix (`[reduced]` dep) is preserved by construction — document this in the PaperBackdrop docstring per CONTEXT § Specific Ideas.

**CHOREO-08 video gate pattern** (RESEARCH Pattern 3 lines 440–452):

```typescript
const VIDEO_GATE_THRESHOLD = byId("wow").window[1]  // D-16

useMotionValueEvent(scrollYProgress, "change", (p) => {
  const video = videoRef.current
  const duration = videoDurationRef.current
  if (!video || duration <= 0) return

  if (p >= VIDEO_GATE_THRESHOLD) {
    // D-16: skip currentTime write + defensive pause()
    video.pause()
    return
  }
  video.currentTime = (p / VIDEO_GATE_THRESHOLD) * duration
})
```

Replaces paper-hero.tsx:73–77's ungated scrub. RESEARCH line 458 confirms: `useMotionValueEvent` cleans up automatically on unmount; no explicit cleanup needed.

**Paper-card frame + clouds JSX** (paper-hero.tsx:112–145 — port verbatim, drop `reduced ?` guards):

```typescript
<motion.div
  className="paper-card relative mx-auto flex w-full max-w-[110rem] flex-1 flex-col items-center overflow-hidden rounded-[20px] bg-[color:var(--paper-card)] shadow-[0_10px_60px_-30px_rgb(15_23_42/0.18)]"
  style={{
    scale: stageScale,
    opacity: stageOpacity,
    transformOrigin: "50% 92%",  // visual-design value — kept (CONTEXT § Specific Ideas)
  }}
>
  <motion.div
    aria-hidden
    className="pointer-events-none absolute -bottom-8 -left-10 w-[min(28vw,300px)] sm:-left-12"
    style={{ y: cloudYLeft }}
  >
    <img
      alt=""
      className="cloud-drift-left block w-full opacity-80 mix-blend-multiply select-none"
      src="/hero/cloud-halftone.png"
    />
  </motion.div>
  {/* mirror cloud-right at -top-4 -right-10 with cloudYRight */}

  {children}  {/* hero copy block from <ScrollChoreography> */}

  <div className="relative z-0 mt-auto flex w-full justify-center pb-0">
    <div className="relative w-full max-w-[360px] px-4 sm:max-w-[400px]">
      <video
        aria-label="A teacher slowly working at her desk"
        className="hero-media block h-auto w-full select-none"
        muted
        playsInline
        poster="/hero/teacher-illustration.png"
        preload="auto"
        ref={videoRef}
        src="/hero/teacher-working.mp4"
      />
    </div>
  </div>
</motion.div>
```

Per CONTEXT § Specific Ideas: `transformOrigin: "50% 92%"` is a visual-design value, NOT a magic-number keyframe — keep as-is. Asset URLs (`/hero/teacher-working.mp4`, `/hero/cloud-halftone.png`, `/hero/teacher-illustration.png`) are locked.

**Children prop placement:** paper-hero.tsx:147–170 wraps the hero copy block in a `<div className="relative z-10 mx-auto flex w-fit flex-col pt-8 sm:pt-10">` that sits between the cloud divs and the video div. Phase 2 PaperBackdrop renders `{children}` in that exact slot so the orchestrator's `<motion.div opacity={copyOpacity} y={copyY}>` block nests correctly inside the paper-card frame.

---

### `src/components/landing/scroll-choreography/product-screen.tsx` (presentational subscriber — NEW)

**Analog:** `paper-hero.tsx:196–220` (browser-frame chrome + `profiles-screen.png` + `screenScale` + `screenOpacity`).

**Component shape** (port verbatim with `useState` → `useTransform` migration):

```typescript
import { motion, useTransform } from "motion/react"

import { useScrollChoreography } from "./context"
import { byId } from "./stages"
import { TEACHER_WORKSPACE_APP_URL } from "@/content/landing"

const SCREEN_OPACITY_FADE_START = byId("wow").window[0]   // D-12 stage-aligned
const SCREEN_OPACITY_FADE_END = byId("wow").window[1]     // D-12 stage-aligned

export function ProductScreen() {
  const { scrollYProgress } = useScrollChoreography()
  const screenScale = useTransform(
    scrollYProgress,
    [0, byId("wow").window[0], byId("wow").window[1], 1],
    [0.55, 0.55, 1, 1.04],
  )
  const screenOpacity = useTransform(
    scrollYProgress,
    [SCREEN_OPACITY_FADE_START, SCREEN_OPACITY_FADE_END],
    [0, 1],
  )

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center px-4 sm:px-10 lg:px-16"
      style={{ opacity: screenOpacity }}
    >
      <motion.div
        className="relative w-full max-w-[1280px] overflow-hidden rounded-2xl border border-black/10 bg-white shadow-[0_30px_120px_-40px_rgb(15_23_42/0.45)]"
        style={{ scale: screenScale }}
      >
        <div className="flex items-center gap-2 border-b border-black/5 bg-[#f7f7f5] px-4 py-2.5">
          <span className="size-3 rounded-full bg-[#ff5f57]" />
          <span className="size-3 rounded-full bg-[#febc2e]" />
          <span className="size-3 rounded-full bg-[#28c840]" />
          <span className="ml-4 truncate text-xs text-black/55">
            {TEACHER_WORKSPACE_APP_URL.replace("https://", "")}
          </span>
        </div>
        <img
          alt="Teacher Workspace student insights dashboard"
          className="block h-auto w-full select-none"
          src="/hero/profiles-screen.png"
        />
      </motion.div>
    </div>
  )
}
```

Same JSX as paper-hero.tsx:196–220, but `screenOpacity` becomes a `MotionValue<number>` consumed via `style={{ opacity: screenOpacity }}` (MIGRATE-02). The outer `<div>` opacity binding is the **only** style change vs. the analog (paper-hero.tsx:200 currently uses a `useState` number). `screenScale` migration is a no-op — already a `MotionValue` in paper-hero.tsx:51.

**Why `aria-hidden` and `pointer-events-none`:** preserved from paper-hero.tsx:198–199. The product-screen is decorative in Phase 2 (the live app at `TEACHER_WORKSPACE_APP_URL` is the conversion target, not this image). Phase 3 may revisit when docking transforms add interaction targets.

**No `layoutId`** (CHOREO-01 — single shared `motion.div`, never unmounts). Phase 2 must NOT add a `layoutId`. Document in component docstring.

---

### `src/components/landing/scroll-choreography/stages.ts` (data module — modify)

**Analog:** self (Phase 1 ships the data + `byId` helper).

**Retune pattern** (CONTEXT D-14 — first-pass `wow.window: [0.20, 0.78]`):

```typescript
// stages.ts current (Phase 1):
export const STAGES = [
  { id: "hero", window: [0.0, 0.25] as const, screen: "tiny" },
  { id: "wow", window: [0.2, 0.55] as const, screen: "centered" },
  { id: "feature-a", window: [0.5, 0.78] as const, screen: "docked-left" },
  { id: "feature-b", window: [0.75, 1.0] as const, screen: "docked-right" },
] as const satisfies readonly StageDef[]
```

Phase 2 retunes `wow.window[1]` from `0.55` to `~0.78`. Per RESEARCH Pitfall 7, **do NOT cascade-tune feature-a/feature-b** in Phase 2 (those are Phase 3 territory; their windows already overlap with the new `wow.window`, which is harmless because feature-a/b don't render in Phase 2's ProductScreen stub).

**`as const satisfies` pattern preserved** (Phase 1 D-07/D-12). Tests in `stages.test.ts` already cover `start < end` and `[0,1]` bounds — the retune passes existing tests.

---

### `src/components/landing/scroll-choreography/scroll-choreography.test.tsx` (NEW)

**Analog:** `use-is-desktop.test.ts` (matchMedia override pattern) + `static-choreography-fallback.test.tsx` (render + screen + role queries).

**Test file imports + describe shape** (use-is-desktop.test.ts:1–6):

```typescript
import { describe, expect, it, vi } from "vitest"
import { render, renderHook, screen, waitFor } from "@testing-library/react"

import { ScrollChoreography } from "./scroll-choreography"
```

**4-case mode-switch coverage** (`describe.each` pattern — synthesize from `use-is-desktop.test.ts:15–38` matchMedia override + `useReducedMotion` mock):

```typescript
import * as motion from "motion/react"

describe("ScrollChoreography mode switch", () => {
  const cases = [
    { isDesktop: true, prefersReduced: false, branch: "choreography" },
    { isDesktop: true, prefersReduced: true, branch: "static" },
    { isDesktop: false, prefersReduced: false, branch: "static" },
    { isDesktop: false, prefersReduced: true, branch: "static" },
  ] as const

  it.each(cases)("desktop=$isDesktop reduced=$prefersReduced → $branch", ({ isDesktop, prefersReduced, branch }) => {
    // 1. Override window.matchMedia for isDesktop (use-is-desktop.test.ts:20–30 pattern)
    // 2. Spy on useReducedMotion to return prefersReduced
    // 3. render(<ScrollChoreography />)
    // 4. assert presence of static-fallback marker (h1 + 2 h2s) OR choreography marker (.scroll-choreography-only class)
  })
})
```

The "static branch" assertion can reuse `static-choreography-fallback.test.tsx`'s shape (`screen.getAllByRole("heading", { level: 1 })` returns the PaperHero h1).

**`useScroll` `layoutEffect: false` call-signature assertion** (D-21, no in-repo analog — synthesize using `vi.spyOn`):

```typescript
import * as motion from "motion/react"

it("calls useScroll with layoutEffect: false (FOUND-04)", () => {
  const useScrollSpy = vi.spyOn(motion, "useScroll")
  // render with desktop+motion mode
  render(<ScrollChoreography />)
  expect(useScrollSpy).toHaveBeenCalledWith(
    expect.objectContaining({ layoutEffect: false }),
  )
})
```

**`scroll-choreography-only` className assertion** (verifies Claude's-discretion D-18 wiring):

```typescript
it("tags the outer container with .scroll-choreography-only", () => {
  const { container } = render(<ScrollChoreography />)
  // desktop + motion mode active via matchMedia mock
  const section = container.querySelector("section.scroll-choreography-only")
  expect(section).not.toBeNull()
})
```

---

### `src/components/landing/scroll-choreography/paper-backdrop.test.tsx` (NEW)

**Analog:** `use-is-desktop.test.ts` (vi.fn lifecycle pattern) + `stages.test.ts` (assertion shape) + RESEARCH Pattern 3 (gate threshold expectations).

**Test pattern — context-subscription via wrapper** (synthesize; no in-repo analog uses provider wrapping yet):

```typescript
import { describe, expect, it, vi } from "vitest"
import { render } from "@testing-library/react"
import { motionValue } from "motion/react"

import { PaperBackdrop } from "./paper-backdrop"
import { ScrollChoreographyContext } from "./context"
import { STAGES } from "./stages"

function renderWithMockProgress(progress = 0) {
  const mv = motionValue(progress)
  const value = {
    scrollYProgress: mv,
    stages: STAGES,
    reducedMotion: false,
    mode: "choreography" as const,
  }
  const utils = render(
    <ScrollChoreographyContext.Provider value={value}>
      <PaperBackdrop />
    </ScrollChoreographyContext.Provider>,
  )
  return { ...utils, scrollYProgress: mv }
}
```

**Video-gate threshold cross test** (RESEARCH lines 440–452 — D-16 verification):

```typescript
it("pauses video when scrollYProgress >= STAGES.wow.window[1]", () => {
  const { scrollYProgress, container } = renderWithMockProgress(0)
  const video = container.querySelector("video")!
  const pauseSpy = vi.spyOn(video, "pause")

  scrollYProgress.set(byId("wow").window[1] + 0.01)
  expect(pauseSpy).toHaveBeenCalled()
})

it("resumes currentTime writes when scrollYProgress drops below threshold", () => {
  const { scrollYProgress, container } = renderWithMockProgress(byId("wow").window[1] + 0.05)
  const video = container.querySelector("video")!
  const setCurrentTime = vi.spyOn(video, "currentTime", "set")

  scrollYProgress.set(0.3)
  expect(setCurrentTime).toHaveBeenCalled()
})
```

**`loadedmetadata` lifecycle test** (paper-hero.tsx:85–95 → PaperBackdrop with `[]` deps):

```typescript
it("attaches loadedmetadata listener on mount and removes on unmount", () => {
  const { container, unmount } = renderWithMockProgress()
  const video = container.querySelector("video")!
  const addSpy = vi.spyOn(video, "addEventListener")
  const removeSpy = vi.spyOn(video, "removeEventListener")
  // ... assertions mirror use-is-desktop.test.ts:42–67 lifecycle shape
})
```

**`useTransform`-driven opacity (no useState) shape assertion** — covers MIGRATE-02 / CHOREO-06 SC #2. Pair with the AST static-analysis test below (`migrate-perf-04.test.ts`) for end-to-end coverage.

---

### `src/components/landing/scroll-choreography/product-screen.test.tsx` (NEW)

**Analog:** `static-choreography-fallback.test.tsx` (render + role queries) + `use-is-desktop.test.ts:40–68` (lifecycle pattern adapted for "never unmounts").

**Mount-counter / never-unmounts test** (D-21 + CHOREO-01):

```typescript
import { describe, expect, it, vi } from "vitest"
import { render } from "@testing-library/react"
import { motionValue } from "motion/react"

it("ProductScreen's motion.div instance survives across rerenders", () => {
  let mountCount = 0
  // wrap the motion.div ref to count mount/unmount cycles
  // assertion: rerender(<ProductScreen/>) does not increment mountCount
  // pattern adapted from use-is-desktop.test.ts add/remove counter shape
})
```

**`useTransform` shape assertion** (no `useState` for visual properties — pairs with AST test):

```typescript
it("renders with motion-value-driven opacity (not React state)", () => {
  const mv = motionValue(0)
  // render with provider; mv.set(0.5)
  // assert no React re-render of ProductScreen body (use a render-counter ref)
})
```

---

### `src/components/landing/scroll-choreography/header-stacking.test.tsx` (NEW — MIGRATE-04)

**Analog:** `landmark-audit.test.tsx` (HomePageFixture + `within()` landmark queries).

**HomePageFixture pattern** (landmark-audit.test.tsx:15–26 — copy verbatim, swap `<StaticChoreographyFallback>` → `<ScrollChoreography>`):

```typescript
import { describe, expect, it } from "vitest"
import { render, screen, within } from "@testing-library/react"

import { SiteFooter } from "../footer"
import { SiteHeader } from "../site-header"
import { SkipLink } from "../skip-link"
import { ScrollChoreography } from "./scroll-choreography"

function HomePageFixture() {
  return (
    <>
      <SkipLink />
      <SiteHeader />
      <main id="main">
        <ScrollChoreography />
      </main>
      <SiteFooter />
    </>
  )
}
```

**MIGRATE-04 assertion — header NOT a descendant of any transformed sticky parent** (RESEARCH Pitfall 2 lines 516–522):

```typescript
it("SiteHeader is NOT a descendant of any element with style.transform set", () => {
  render(<HomePageFixture />)
  const header = screen.getByRole("banner")
  // walk parent chain; assert no ancestor has inline style.transform OR computed transform
  let cursor: HTMLElement | null = header.parentElement
  while (cursor) {
    expect(cursor.style.transform || "").toBe("")
    cursor = cursor.parentElement
  }
})

it("header is NOT inside main (D-16 sibling structure preserved)", () => {
  render(<HomePageFixture />)
  const main = screen.getByRole("main")
  expect(within(main).queryByRole("banner")).toBeNull()
})
```

The second test is verbatim from `landmark-audit.test.tsx:49–53`; Phase 2 just verifies it still passes after the route swap.

---

### `src/components/landing/scroll-choreography/choreography-rerender-budget.test.tsx` (NEW — CHOREO-06 / SC #2 + MIGRATE-02)

**Analog:** `static-choreography-fallback.test.tsx` (render shape) + custom render-counter ref (no in-repo analog — synthesize).

**Render-counter pattern** (RESEARCH § "Don't Hand-Roll" line 489 — use `@testing-library/react`'s `rerender` + a ref-counter):

```typescript
import { describe, expect, it } from "vitest"
import { render } from "@testing-library/react"
import { motionValue } from "motion/react"

it("ScrollChoreography does not re-render when scrollYProgress changes", () => {
  let renderCount = 0
  function CountingChoreo() {
    renderCount++
    return <ScrollChoreography />
  }
  const mv = motionValue(0)
  // mock useScroll to return our mv
  render(<CountingChoreo />)
  const initial = renderCount

  // simulate 60 scroll frames
  for (let i = 0; i < 60; i++) mv.set(i / 60)

  expect(renderCount - initial).toBeLessThanOrEqual(2)  // SC #2: 0–2 re-renders
})
```

The exact mock for `useScroll` follows `scroll-choreography.test.tsx`'s `vi.spyOn(motion, "useScroll")` pattern.

---

### `src/components/landing/scroll-choreography/migrate-03-keyframe-binding.test.ts` (NEW — AST static analysis)

**Analog:** **none in repo** — see § "No Analog Found".

This is a node-`fs`-driven static-analysis test that reads `paper-backdrop.tsx` + `product-screen.tsx` + `scroll-choreography.tsx` and asserts no inline magic-number tuple appears as the second argument to `useTransform`. RESEARCH § Anti-Patterns lines 472–479 specifies the rule.

**Recommended approach** (tools already in the stack — TypeScript compiler available via `typescript` package):

```typescript
import { describe, expect, it } from "vitest"
import { readFileSync } from "node:fs"
import { resolve } from "node:path"

const FILES = [
  "paper-backdrop.tsx",
  "product-screen.tsx",
  "scroll-choreography.tsx",
]

describe("MIGRATE-03 keyframe-binding rule", () => {
  it.each(FILES)("%s contains no inline magic-number tuple in useTransform args", (file) => {
    const src = readFileSync(resolve(__dirname, file), "utf8")
    // regex: useTransform\([^,]+,\s*\[\s*[0-9.]+\s*,
    // OR parse with TypeScript compiler API and walk CallExpression args
    const matches = src.match(/useTransform\([^)]*\[\s*[0-9]/g) ?? []
    // Allow numeric literals only when bound to a named const (HERO_COPY_*, byId(...))
    // Reject only direct anonymous numeric tuples
    expect(matches.length).toBe(0)
  })
})
```

**Pattern note:** The test allows `[0, HERO_COPY_FADE_OUT_START, HERO_COPY_FADE_OUT_END, 1]` (named consts) but rejects `[0, 0.06, 0.14, 1]` (anonymous). The exact predicate definition is a planning decision — recommend regex first-pass (allow numeric literals only as `0`, `1`, or after `byId(...).window[`); upgrade to TypeScript AST walk if false positives appear.

---

### `src/components/landing/scroll-choreography/migrate-perf-04.test.ts` (NEW — AST static analysis)

**Analog:** **none in repo** — see § "No Analog Found". Same shape as `migrate-03-keyframe-binding.test.ts`.

**Rule** (PERF-04, RESEARCH lines 477–478): no animated `width`/`height`/`top`/`left`/`box-shadow` properties on scroll-driven `motion.*` elements.

```typescript
const FORBIDDEN_ANIMATED_PROPS = ["width", "height", "top", "left", "box-shadow"]

describe("PERF-04 transform/opacity-only rule", () => {
  it.each(FILES)("%s does not animate forbidden CSS properties", (file) => {
    const src = readFileSync(resolve(__dirname, file), "utf8")
    for (const prop of FORBIDDEN_ANIMATED_PROPS) {
      // forbid `style={{ width: motionValue }}` patterns
      // (allow static `style={{ width: "100%" }}` strings)
      const re = new RegExp(`style=\\{\\{[^}]*${prop}\\s*:\\s*[a-zA-Z_]\\w*Value\\b`)
      expect(re.test(src)).toBe(false)
    }
  })
})
```

---

### `src/routes/index.tsx` (modify — single-line swap)

**Analog:** self. CONTEXT D-01 specifies the swap: replace `<StaticChoreographyFallback />` with `<ScrollChoreography />` inside `<main>`.

```typescript
// Before (current):
import { StaticChoreographyFallback } from "@/components/landing/scroll-choreography/static-choreography-fallback"
// ...
<main id="main" className="paper-page">
  <StaticChoreographyFallback />
</main>

// After (Phase 2):
import { ScrollChoreography } from "@/components/landing/scroll-choreography/scroll-choreography"
// ...
<main id="main" className="paper-page">
  <ScrollChoreography />
</main>
```

Phase 5 owns the import-path tightening + cleanup of any unused direct import (CONTEXT D-01 final paragraph).

---

### `src/styles.css` (modify — class consumer)

**Analog:** self (the rule already exists at lines 226–230, awaiting a consumer). CONTEXT § Claude's Discretion line 100 recommends adding the consumer.

The CSS rule is **already shipped** by Phase 1 (styles.css:219–230 — IN-04). Phase 2's ONLY edit to styles.css is **none** — the consumer is on the `<section>` element inside `scroll-choreography.tsx` (`className="scroll-choreography-only relative h-[280lvh]"`). If Phase 2 wants to add a comment update or scope tightening to the existing CSS rule, do so here; otherwise leave styles.css untouched.

**Verification:** add an assertion in `scroll-choreography.test.tsx` (already specified above): `container.querySelector("section.scroll-choreography-only")` is non-null.

## Shared Patterns

### SSR-safe hook composition

**Source:** `src/components/landing/scroll-choreography/use-is-desktop.ts:30–44`

**Apply to:** Any new code path that reads `window` / `matchMedia` / DOM. Phase 2's only candidate: `<ScrollChoreography>` already uses `useIsDesktop()` directly (no new wrappers needed). PaperBackdrop and ProductScreen do NOT call `matchMedia` — they receive scroll progress via context.

```typescript
export function useIsDesktop(): boolean {
  const hydrated = useHydrated()
  const [isDesktop, setIsDesktop] = useState(true)

  useEffect(() => {
    if (!hydrated) return
    const mq = window.matchMedia(DESKTOP_MQ)
    const update = () => setIsDesktop(mq.matches)
    update()
    mq.addEventListener("change", update)
    return () => mq.removeEventListener("change", update)
  }, [hydrated])

  return hydrated ? isDesktop : true
}
```

### Discriminated-union narrowing for stages content

**Source:** `src/components/landing/paper-hero.tsx:21–25`

**Apply to:** `<ScrollChoreography>` when reading `hero.headline` / `hero.subline` from `stages` content array.

```typescript
const heroEntry = stages.find((s) => s.id === "hero")
if (!heroEntry || heroEntry.id !== "hero") {
  throw new Error("ScrollChoreography: hero stage missing from content/landing stages")
}
const hero = heroEntry.copy  // narrowed to { headline; subline }
```

Prefer this over RESEARCH's `as` cast.

### `import type` for type-only imports

**Source:** `src/components/landing/scroll-choreography/types.ts` + `verbatimModuleSyntax: true` in tsconfig.json

**Apply to:** Every Phase 2 file that imports a type only.

```typescript
import type { ReactNode } from "react"
import type { MotionValue } from "motion/react"
import type { StageDef, StageId } from "./types"
```

### Named exports + relative imports + kebab-case files

**Source:** CONVENTIONS.md (Phase 1 D-04) + every existing file under `src/components/landing/scroll-choreography/`

**Apply to:** All new Phase 2 files.

- File names: `paper-backdrop.tsx`, `product-screen.tsx` (kebab-case)
- Exports: `export function PaperBackdrop()`, `export function ProductScreen()` (named)
- No `index.ts` barrel files
- Sibling imports: `./context`, `./stages`, `./use-is-desktop`
- Cross-tree imports: `@/components/ui/button`, `@/content/landing`

### Vitest test conventions

**Source:** Phase 1 — `vitest.config.ts` + `vitest.setup.ts` + every `*.test.ts(x)` under `scroll-choreography/`

**Apply to:** All Phase 2 tests.

- One test file per source file (`paper-backdrop.tsx` → `paper-backdrop.test.tsx`)
- Imports: `import { describe, expect, it, vi } from "vitest"` + `import { render, screen, within } from "@testing-library/react"` (or `renderHook`/`waitFor` for hooks)
- jsdom environment (already configured)
- matchMedia shim already in setup; override per-test for non-desktop simulation (use-is-desktop.test.ts:20–37 pattern)
- `afterEach(cleanup)` already wired globally
- Tests should NOT install `@testing-library/jest-dom` for now (vitest.setup.ts:5 comment); use plain expect assertions

### `as const satisfies` for typed data

**Source:** `src/components/landing/scroll-choreography/stages.ts:15–20`

**Apply to:** stages.ts retune (D-14) — preserve the `as const satisfies readonly StageDef[]` suffix.

## No Analog Found

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| `migrate-03-keyframe-binding.test.ts` | static-analysis test (AST / regex over source files) | file-I/O | No existing in-repo test reads source files via `fs.readFileSync`. Closest reference patterns are in RESEARCH § "Don't Hand-Roll" (line 489 hints at `rerender` + ref-counter for unit-level coverage, but the AST gate is a different shape). The planner should write a thin first-pass regex matcher and document the assertion shape; if false positives surface, upgrade to a `typescript` compiler-API walk over `CallExpression` arguments. |
| `migrate-perf-04.test.ts` | static-analysis test (AST / regex over source files) | file-I/O | Same pattern as MIGRATE-03 above — no in-repo precedent. |

**Note on test mocking gap:** No existing in-repo test mounts a context provider with a `MotionValue` that the test then mutates (`motionValue(0)` + `.set(...)`). `paper-backdrop.test.tsx` and `choreography-rerender-budget.test.tsx` will introduce this pattern; document the test helper inline in the first test file that uses it.

**Note on `useScroll` mocking:** No existing test spies on a `motion/react` export. Phase 2 introduces `vi.spyOn(motion, "useScroll")` for the `scroll-choreography.test.tsx` `layoutEffect: false` call-signature assertion. If `motion/react` resists `vi.spyOn` (some libraries freeze their exports), fall back to `vi.mock("motion/react", async (importOriginal) => { ... })` with a partial-mock. RESEARCH lines 282–306 show the call site shape to assert against.

## Metadata

**Analog search scope:**
- `src/components/landing/paper-hero.tsx` (THE primary analog — Phase 2 extracts FROM this file; lines 1–245 fully scanned)
- `src/components/landing/scroll-choreography/*.{ts,tsx}` (all 8 Phase 1 files: `scroll-choreography.tsx`, `paper-backdrop.tsx` (n/a — new), `product-screen.tsx` (n/a — new), `context.tsx`, `use-is-desktop.ts`, `static-choreography-fallback.tsx`, `stages.ts`, `types.ts`, plus 4 test files)
- `src/components/landing/landmark-audit.test.tsx` (header-stacking integration analog)
- `src/routes/index.tsx` (route swap site)
- `vitest.config.ts` + `vitest.setup.ts` (test infra)
- `src/styles.css` lines 200–230 (`.scroll-choreography-only` rule confirmation)

**Files scanned:** 14
**Pattern extraction date:** 2026-04-29
**Phase:** 2 — Orchestrator Shell + Backdrop Migration
