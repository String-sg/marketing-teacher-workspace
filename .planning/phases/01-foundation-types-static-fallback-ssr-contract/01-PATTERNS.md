# Phase 1: Foundation — Types, Static Fallback, SSR Contract — Pattern Map

**Mapped:** 2026-04-28
**Files analyzed:** 22 (10 new, 8 modified, 1 rename, ~7 test files, 2 vitest config)
**Analogs found:** 15 with strong analog / 22 total (test files + use-is-desktop have no in-repo analog — RESEARCH.md provides canonical patterns)

## File Classification

### New files

| New file | Role | Data Flow | Closest analog | Match Quality |
|----------|------|-----------|----------------|---------------|
| `src/components/landing/scroll-choreography/types.ts` | type-module | build-time | `src/content/landing.ts` (current) + research §"Typed Data Model" | partial (no pure-types file exists yet) |
| `src/components/landing/scroll-choreography/stages.ts` | data-module (`as const satisfies`) | build-time | `src/content/landing.ts` (current `export const ...` shape) | role-match |
| `src/components/landing/scroll-choreography/use-is-desktop.ts` | hook (SSR-safe) | request-response (event-driven on `matchMedia`) | none in repo (no existing custom hook) | none — use RESEARCH.md canonical pattern |
| `src/components/landing/scroll-choreography/context.tsx` | provider/context (stub) | event-driven (Phase 2) | none — closest is `paper-hero.tsx` `useScroll` callsite | none — use RESEARCH.md canonical pattern |
| `src/components/landing/scroll-choreography/static-choreography-fallback.tsx` | composition shell | request-response (pure render) | `src/routes/index.tsx` `HomePage` (current composition) | exact (same compositional intent) |
| `src/components/landing/scroll-choreography/scroll-choreography.tsx` | orchestrator stub | event-driven (Phase 2) | none in repo (Phase 2 will fill body) | none — Phase 1 is a thin export-stub; copy doc-comment pattern from `static-choreography-fallback.tsx` |
| `src/components/landing/feature-section.tsx` (rename of `product-section.tsx`) | section component | request-response (pure render) | `src/components/landing/product-section.tsx` (the file being renamed) | exact (rename + parametrize by `stage` prop) |
| `src/components/landing/footer.tsx` | landmark component | request-response (pure render) | `src/components/landing/site-header.tsx` (sister landmark) | role-match (header is the analog landmark) |
| `src/components/landing/skip-link.tsx` | landmark component (a11y) | request-response (pure render) | `src/components/landing/site-header.tsx` (anchor + focus pattern) | role-match (no skip-link exists) |
| `vitest.config.ts` | tooling config | build-time | `vite.config.ts` (sibling vite plugin config) | role-match |
| `vitest.setup.ts` | tooling config | build-time | none | none — RESEARCH.md §"Validation Architecture" |
| `tests/use-is-desktop.test.tsx` | test | unit | none in repo (zero existing tests) | none — Vitest 3.2 + @testing-library/react canonical |
| `tests/landing-content-shape.test.ts` | test | unit | none | none |
| `tests/static-fallback.test.tsx` | test | unit | none | none |
| `tests/site-footer.test.tsx` | test | unit | none | none |
| `tests/skip-link.test.tsx` | test | unit | none | none |
| `tests/landmarks.test.tsx` | test | unit | none | none |
| `tests/content-parity.test.tsx` (optional) | test | unit | none | none |

### Modified files

| Modified file | Role | Data Flow | Pattern source | Match Quality |
|---------------|------|-----------|----------------|---------------|
| `src/content/landing.ts` | data-module | build-time | self (current shape — extend with `as const`) | exact |
| `src/components/landing/paper-hero.tsx` | section component | event-driven (scroll) | self (minimal data swap only — D-13/D-14) | exact |
| `src/components/landing/proof-strip.tsx` | section component | request-response (pure render) | self (current rendering — only data source migrates) | exact |
| `src/components/landing/final-cta.tsx` | section component | request-response (pure render) | self (current — migrate hardcoded copy to `finalCtaCopy`) | exact |
| `src/components/landing/email-capture.tsx` | form component | request-response (no submit handler yet) | self (only import migration: `heroCopy` → `finalCtaCopy`) | exact |
| `src/components/landing/site-header.tsx` | landmark component | request-response (pure render) | self (only import migration: `heroCopy.ctaHref` → `TEACHER_WORKSPACE_APP_URL`, `heroCopy.cta` → `finalCtaCopy.cta`) | exact |
| `src/routes/index.tsx` | route composition | request-response | self (composition swap: list of sections → `<StaticChoreographyFallback/>`) | exact |
| `src/routes/__root.tsx` | route shell | request-response | self (add `<SkipLink/>` before `{children}`) | exact |
| `package.json` | tooling config | build-time | self (already has `test` + `typecheck` scripts — verify) | exact |

---

## Pattern Assignments

### `src/components/landing/scroll-choreography/types.ts` (type-module, build-time)

**Analog:** `src/content/landing.ts` (current) for the `export const` style; the actual type shapes are dictated by RESEARCH.md §"Typed Data Model" (the user accepted these in CONTEXT.md D-07/D-10/D-11).

**Imports pattern** (from `src/lib/utils.ts:1-3` — type-import discipline under `verbatimModuleSyntax: true`):
```typescript
import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import type { ClassValue } from "clsx"
```
Apply: `import type { MotionValue } from "motion/react"` (verbatimModuleSyntax requires `import type`).

**Core type-module pattern** (canonical — RESEARCH.md lines 153-201, user-accepted in D-07):
```typescript
import type { MotionValue } from "motion/react"

export type StageId = "hero" | "wow" | "feature-a" | "feature-b"
export type StageWindow = readonly [start: number, end: number]
export type ScreenTarget = "tiny" | "centered" | "docked-left" | "docked-right"

export type ScreenTargetRect = {
  readonly scale: number
  readonly x: string
  readonly y: string
  readonly opacity: number
  readonly clipPath?: string
}

export type StageDef = {
  readonly id: StageId
  readonly window: StageWindow
  readonly screen: ScreenTarget
}

export type StageCopyContent =
  | { readonly id: "hero";      readonly copy: { readonly headline: string; readonly subline: string } }
  | { readonly id: "wow";       readonly copy: { readonly caption?: string } }
  | { readonly id: "feature-a"; readonly copy: { readonly kicker: string; readonly heading: string; readonly paragraph: string; readonly bullets: readonly [string, string, string] } }
  | { readonly id: "feature-b"; readonly copy: { readonly kicker: string; readonly heading: string; readonly paragraph: string; readonly bullets: readonly [string, string, string] } }

export type ScrollChoreographyMode = "choreography" | "static"

export type ScrollChoreographyContextValue = {
  readonly scrollYProgress: MotionValue<number>
  readonly stages: readonly StageDef[]
  readonly reducedMotion: boolean
  readonly mode: ScrollChoreographyMode
}
```

**Conventions to follow:**
- Named exports only (CONVENTIONS.md "Module Design — Named exports for functions and components"); no barrel files.
- All fields `readonly`; arrays wrapped `readonly T[]`.
- String-literal unions, no enums (CONVENTIONS.md — repo has zero enums).
- Type imports MUST use `import type` (tsconfig.json `verbatimModuleSyntax: true`).
- No semicolons, double quotes, 2-space indent (.prettierrc).

---

### `src/components/landing/scroll-choreography/stages.ts` (data-module, build-time)

**Analog:** `src/content/landing.ts` lines 1-41 (current shape — `export const X = { ... }`). The user explicitly accepted the `as const satisfies` form in CONTEXT.md `<specifics>`.

**Imports pattern** (from `src/content/landing.ts` — pure data module, no React imports):
```typescript
// Phase 1 stages.ts
import type { StageDef, StageId } from "./types"
```

**Core data-module pattern** (RESEARCH.md lines 211-225, user-accepted):
```typescript
import type { StageDef, StageId } from "./types"

export const STAGES = [
  { id: "hero",      window: [0.0, 0.25] as const, screen: "tiny" },
  { id: "wow",       window: [0.20, 0.55] as const, screen: "centered" },
  { id: "feature-a", window: [0.50, 0.78] as const, screen: "docked-left" },
  { id: "feature-b", window: [0.75, 1.0] as const, screen: "docked-right" },
] as const satisfies readonly StageDef[]

export function byId(id: StageId): StageDef {
  const stage = STAGES.find((s) => s.id === id)
  if (!stage) throw new Error(`Unknown stage id: ${id}`)
  return stage
}
```

**`SCREEN_TARGETS` Phase 1 declaration** (type-only — D-11 / RESEARCH.md lines 237-243):
```typescript
import type { ScreenTarget, ScreenTargetRect } from "./types"

// Phase 3 fills the rect values; Phase 1 ships only the contract.
export declare const SCREEN_TARGETS: Record<ScreenTarget, ScreenTargetRect>
```

**Risk flag (RESEARCH.md line 246):** `declare const` produces no runtime export. Phase 1 code MUST NOT import `SCREEN_TARGETS` (the value). Add a Phase 1 verification grep: `! grep -rn "SCREEN_TARGETS" src/` outside types/stages.

**Decision-point for the planner (CONTEXT.md D-12 / RESEARCH.md OQ-1):** RESEARCH.md recommends Option B (`readonly StageDef[]` + `byId()` helper). Adopt unless the planner has cause to switch.

---

### `src/components/landing/scroll-choreography/use-is-desktop.ts` (hook, SSR-safe)

**Analog:** None in repo. The closest reference is `useReducedMotion()` consumption in `src/components/landing/paper-hero.tsx:20, 67` — same SSR-null/optimistic pattern. Use RESEARCH.md's canonical hook (verified via Context7 against `@tanstack/react-router` `useHydrated`).

**Canonical pattern** (RESEARCH.md lines 332-356, `[VERIFIED: Context7 /websites/tanstack_start]`):
```typescript
import { useEffect, useState } from "react"
import { useHydrated } from "@tanstack/react-router"

const DESKTOP_MQ = "(min-width: 1024px)"

export function useIsDesktop(): boolean {
  const hydrated = useHydrated()
  const [isDesktop, setIsDesktop] = useState(true) // optimistic-desktop default

  useEffect(() => {
    if (!hydrated) return
    const mq = window.matchMedia(DESKTOP_MQ)
    const update = () => setIsDesktop(mq.matches)
    update()
    mq.addEventListener("change", update)
    return () => mq.removeEventListener("change", update)
  }, [hydrated])

  // SSR + first client render: optimistic `true` so server and client agree.
  return hydrated ? isDesktop : true
}
```

**Conventions to follow:**
- camelCase function name (`useIsDesktop` per CONVENTIONS.md "Functions: hooks are camelCase with `use` prefix").
- Named export, no default.
- `useEffect` cleanup returns the `removeEventListener` directly (matches `paper-hero.tsx:64` cleanup pattern).
- The `hydrated ? ... : true` ternary mirrors `paper-hero.tsx:67` `prefersReducedMotion === true` defensive pattern.

---

### `src/components/landing/scroll-choreography/context.tsx` (provider stub)

**Analog:** None in repo (no React Context exists yet). Use RESEARCH.md canonical pattern.

**Canonical pattern** (RESEARCH.md lines 391-415):
```typescript
import { createContext, useContext } from "react"
import { motionValue } from "motion/react"
import type { ScrollChoreographyContextValue } from "./types"
import { STAGES } from "./stages"

// Phase 1 placeholder — Phase 2 swaps for a real useScroll-driven value.
const stubScrollYProgress = motionValue(0)

const defaultContextValue: ScrollChoreographyContextValue = {
  scrollYProgress: stubScrollYProgress,
  stages: STAGES,
  reducedMotion: false,
  mode: "static",
}

const ScrollChoreographyContext =
  createContext<ScrollChoreographyContextValue>(defaultContextValue)

export function useScrollChoreography(): ScrollChoreographyContextValue {
  return useContext(ScrollChoreographyContext)
}

export { ScrollChoreographyContext }
```

**Conventions to follow:**
- `motionValue(0)` is a stable module-level singleton — Phase 1 never reads it.
- `import type` for `ScrollChoreographyContextValue` (verbatimModuleSyntax).
- Re-export pattern matches `src/components/ui/button.tsx:68` (`export { Button, buttonVariants }`).

---

### `src/components/landing/scroll-choreography/static-choreography-fallback.tsx` (composition shell)

**Analog:** `src/routes/index.tsx:10-19` — current `HomePage` composition is the exact same data flow (compose section components, no state, no effects). The shell is "thin" per D-02.

**Imports pattern** (from `src/routes/index.tsx:1-6`):
```typescript
import { FinalCta } from "@/components/landing/final-cta"
import { PaperHero } from "@/components/landing/paper-hero"
import { ProductSection } from "@/components/landing/product-section"
import { ProofStrip } from "@/components/landing/proof-strip"
```

**Core composition pattern** (RESEARCH.md lines 471-494, follows `routes/index.tsx:10-19` shape):
```typescript
import { PaperHero } from "@/components/landing/paper-hero"
import { FeatureSection } from "@/components/landing/feature-section"
import { ProofStrip } from "@/components/landing/proof-strip"
import { FinalCta } from "@/components/landing/final-cta"

/**
 * Renders the choreography content as a stacked layout. Used by:
 *  - Phase 1: directly in `routes/index.tsx` as the entire homepage body.
 *  - Phase 5: by `<ScrollChoreography>` when `mode === "static"`.
 */
export function StaticChoreographyFallback() {
  return (
    <>
      <PaperHero />
      <FeatureSection stage="feature-a" />
      <FeatureSection stage="feature-b" />
      <ProofStrip />
      <FinalCta />
    </>
  )
}
```

**Conventions to follow:**
- Named export, PascalCase function (CONVENTIONS.md).
- No state, no hooks — pure composition (matches `HomePage` in `routes/index.tsx`).
- A doc-comment IS warranted here (per CONVENTIONS.md "only for non-obvious intent") because the shell has two consumers across phases.

---

### `src/components/landing/scroll-choreography/scroll-choreography.tsx` (orchestrator stub)

**Analog:** None — Phase 2 will fill the body. Phase 1 needs only the file footprint and a code comment encoding the FOUND-04 contract.

**Canonical Phase 1 stub:**
```typescript
import { StaticChoreographyFallback } from "./static-choreography-fallback"

/**
 * Phase 2 will replace this body with a useScroll-driven orchestrator that
 * picks between the static fallback and the choreography tree based on
 * `useIsDesktop()` + `useReducedMotion()`.
 *
 * PHASE-2 REQUIREMENT (FOUND-04): the future useScroll() call MUST pass
 * `layoutEffect: false` to avoid the production-build first-paint flash
 * (motion #2452). Do not omit. See REQUIREMENTS.md FOUND-04.
 */
export function ScrollChoreography() {
  return <StaticChoreographyFallback />
}
```

**Conventions to follow:**
- Named export, PascalCase.
- The `PHASE-2 REQUIREMENT` comment is load-bearing — it encodes a contract Phase 2 must honor (per RESEARCH.md §"useScroll layoutEffect: false").

---

### `src/components/landing/feature-section.tsx` (rename of `product-section.tsx`)

**Analog:** `src/components/landing/product-section.tsx:1-78` — the file being renamed. Preserve its layout, swap data source.

**Imports pattern** (current `product-section.tsx:1-4`):
```typescript
import { ArrowUpRightIcon, CheckIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { modules, productCopy } from "@/content/landing"
```
After reshape: import from new `stages` array, look up by `stage` prop:
```typescript
import { ArrowUpRightIcon, CheckIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { stages, TEACHER_WORKSPACE_APP_URL } from "@/content/landing"
import type { StageId } from "@/components/landing/scroll-choreography/types"
```

**Core section pattern** (preserve `product-section.tsx:6-78` markup; D-09 says "renders one stage at a time"):
```typescript
type FeatureSectionProps = { stage: Extract<StageId, "feature-a" | "feature-b"> }

export function FeatureSection({ stage }: FeatureSectionProps) {
  const entry = stages.find((s) => s.id === stage)
  if (!entry || (entry.id !== "feature-a" && entry.id !== "feature-b")) {
    throw new Error(`FeatureSection: unknown stage "${stage}"`)
  }
  const { kicker, heading, paragraph, bullets } = entry.copy
  // ... render the existing two-column grid from product-section.tsx:7-77
  //     swapping productCopy.kicker/headline/body/cta + modules[].title/body
  //     for kicker/heading/paragraph + bullets[]
}
```

**Layout pattern to preserve** (from `product-section.tsx:7-77`):
- `<section className="relative px-5 py-24 sm:px-8 lg:py-32">` outer
- `<div className="mx-auto grid max-w-[110rem] gap-12 lg:grid-cols-[0.85fr_1.15fr] ...">` two-column
- Kicker `<p className="text-xs font-medium tracking-[0.18em] text-[color:var(--paper-muted)] uppercase ...">`
- `<h2 className="mt-4 font-heading text-[clamp(1.5rem,3.6vw,3.25rem)] ...">`
- Paragraph `<p className="mt-6 text-base leading-7 text-[color:var(--paper-muted)] ...">`
- Bullets list with the existing `border-t border-[color:var(--paper-rule)]/55 py-5 first:border-t-0` + `CheckIcon` pattern (lines 24-45) — the `bullets: readonly [string, string, string]` tuple maps directly into this map.
- Right column: paper-card with browser-chrome + `profiles-screen.png` (lines 58-73) — preserve verbatim (this image is the shared product-screen visual, called out in RESEARCH.md §"Wow stage gap analysis").

**Section ID note:** Current `id="today"` (line 11) — since this component now renders twice (feature-a + feature-b), the planner must pick distinct ids per stage (e.g., `id={stage === "feature-a" ? "features" : "trends"}`). RESEARCH.md doesn't lock this; surface for planner.

---

### `src/components/landing/footer.tsx` (NEW landmark)

**Analog:** `src/components/landing/site-header.tsx:1-56` — sister landmark; same anatomy (single landmark element, paper-token classnames, focus-visible rings).

**Imports pattern** (mirrors `site-header.tsx:1-4`):
```typescript
import { footerCopy } from "@/content/landing"
```

**Core landmark pattern** (RESEARCH.md lines 608-628, follows `site-header.tsx:8-54` structural shape):
```typescript
import { footerCopy } from "@/content/landing"

export function SiteFooter() {
  return (
    <footer className="border-t border-[color:var(--paper-rule)]/55 px-5 py-10 sm:px-8 lg:py-14">
      <div className="mx-auto flex max-w-[110rem] flex-col items-center gap-4 text-sm text-[color:var(--paper-muted)] sm:flex-row sm:justify-between">
        <p>{footerCopy.copyright}</p>
        <p className="font-mono text-xs tracking-[0.18em] uppercase">
          {footerCopy.trustLine}
        </p>
        <a
          className="transition-colors hover:text-primary focus-visible:rounded focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          href={`mailto:${footerCopy.supportEmail}`}
        >
          {footerCopy.supportEmail}
        </a>
      </div>
    </footer>
  )
}
```

**Token usage to follow** (matches `site-header.tsx:14, 30` and `proof-strip.tsx:23-24`):
- `text-[color:var(--paper-muted)]` for muted body text
- `border-[color:var(--paper-rule)]/55` for separator (same alpha as `product-section.tsx:27`)
- `font-mono text-xs tracking-[0.18em] uppercase` for the trust line (matches `proof-strip.tsx:38` "01" labels)

**File-name decision flag:** CONTEXT.md §D-04 says `footer.tsx`; RESEARCH.md examples use `site-footer.tsx`. The exported component is `SiteFooter`. The planner picks the filename — `footer.tsx` is what D-04 specifies; recommend honoring that.

---

### `src/components/landing/skip-link.tsx` (NEW landmark)

**Analog:** No skip-link exists. Closest reference for focus-ring conventions: `site-header.tsx:33` (`focus-visible:ring-3 focus-visible:ring-primary/40 focus-visible:outline-none`).

**Canonical pattern** (RESEARCH.md lines 542-561, sr-only-until-focused):
```typescript
export function SkipLink() {
  return (
    <a
      href="#main"
      className="
        sr-only
        focus:not-sr-only
        focus:fixed focus:top-4 focus:left-4 focus:z-50
        focus:rounded-full focus:border focus:border-[color:var(--paper-rule)]
        focus:bg-[color:var(--paper-card)] focus:px-4 focus:py-2
        focus:font-heading focus:text-sm focus:text-[color:var(--paper-ink)]
        focus:shadow-[0_10px_40px_-20px_rgb(15_23_42/0.18)]
        focus:outline-2 focus:outline-offset-2 focus:outline-primary
      "
    >
      Skip to main content
    </a>
  )
}
```

**Conventions to follow:**
- Tailwind paper-card aesthetic — uses ONLY existing `--paper-*` tokens (CLAUDE.md "no new tokens").
- `paper-card` shadow value matches `proof-strip.tsx:20` and `final-cta.tsx:30` (`shadow-[0_10px_60px_-30px_rgb(15_23_42/0.18)]`-family).
- `focus:not-sr-only` confirmed available in Tailwind v4.2.1.

---

### `vitest.config.ts` (Wave 0 tooling)

**Analog:** `vite.config.ts` (sibling tool config) — same plugin pipeline, but vitest needs `defineConfig` from `vitest/config` and the `test:` block.

**Canonical pattern** (RESEARCH.md §"Wave 0 Gaps" + Vitest 3.2.4 conventions):
```typescript
import { defineConfig } from "vitest/config"
import tsconfigPaths from "vite-tsconfig-paths"
import react from "@vitejs/plugin-react"

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    globals: false,
  },
})
```

**Why these plugins:** `vite-tsconfig-paths` resolves the `@/*` alias (per `tsconfig.json`); `@vitejs/plugin-react` enables JSX in test files. Both are already devDependencies (`package.json`).

---

### `vitest.setup.ts` (Wave 0 tooling)

**Analog:** None. Minimal Testing Library setup.

**Canonical pattern:**
```typescript
import "@testing-library/jest-dom/vitest"
```
(Or empty if `@testing-library/jest-dom` is not added — Phase 1 tests use only `@testing-library/react` + Vitest assertions which suffice for the current test surface.)

**Note:** `@testing-library/jest-dom` is not in current `package.json`. If the planner wants `toBeInTheDocument()` matchers, add the dep; otherwise use `expect(getByRole(...)).not.toBeNull()` which works without it.

---

### Test files (`tests/*.test.tsx`)

**Analog:** None — repo has zero existing tests `[VERIFIED: gitStatus, no .test.* files]`. Use Vitest 3.2.4 + @testing-library/react 16.3.2 canonical patterns from RESEARCH.md §"Validation Architecture".

**Canonical render-and-assert pattern** (for `static-fallback.test.tsx`, `site-footer.test.tsx`, `skip-link.test.tsx`, `landmarks.test.tsx`):
```typescript
import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import { StaticChoreographyFallback } from "@/components/landing/scroll-choreography/static-choreography-fallback"

describe("StaticChoreographyFallback", () => {
  it("renders all four stage sections + hero headline", () => {
    render(<StaticChoreographyFallback />)
    expect(screen.getByRole("heading", { level: 1 })).not.toBeNull()
    // assert exactly one h1, two feature-section h2s, etc.
  })
})
```

**Hook test pattern** (for `use-is-desktop.test.tsx`):
```typescript
import { describe, it, expect } from "vitest"
import { renderHook } from "@testing-library/react"
import { useIsDesktop } from "@/components/landing/scroll-choreography/use-is-desktop"

describe("useIsDesktop", () => {
  it("returns true on first render before hydration", () => {
    const { result } = renderHook(() => useIsDesktop())
    expect(result.current).toBe(true) // optimistic-desktop SSR contract
  })
})
```

**Type/shape test pattern** (for `landing-content-shape.test.ts`):
```typescript
import { describe, it, expect } from "vitest"
import * as landing from "@/content/landing"

describe("landing.ts content shape", () => {
  it("exports stages, proofCopy, finalCtaCopy, footerCopy, navItems, TEACHER_WORKSPACE_APP_URL", () => {
    expect(landing.stages).toHaveLength(4)
    expect(landing.proofCopy.points).toHaveLength(3)
    expect(landing.TEACHER_WORKSPACE_APP_URL).toMatch(/^https:\/\//)
  })

  it("does not export legacy heroCopy/productCopy/modules/proofPoints", () => {
    // @ts-expect-error — heroCopy must be deleted
    expect(landing.heroCopy).toBeUndefined()
  })
})
```

**Conventions to follow:**
- Named imports `{ describe, it, expect }` from `vitest` (no globals — `globals: false` in config).
- File suffix `.test.tsx` for component tests, `.test.ts` for pure data tests.
- Co-locate or use `tests/` — RESEARCH.md uses `tests/` flat at repo root; D-04 is silent on this.

---

## Modified File Patterns (self-references)

### `src/content/landing.ts` (full reshape)

**Pattern source:** self (the current `as const`-less style → migrate to `as const` per RESEARCH.md §"Reshaped landing.ts" + D-08).

**New shape** (RESEARCH.md lines 250-291; user-accepted in CONTEXT.md D-08):
```typescript
import type { StageCopyContent } from "@/components/landing/scroll-choreography/types"

export type NavItem = { readonly label: string; readonly href: string }

export const TEACHER_WORKSPACE_APP_URL =
  "https://teacherworkspace-alpha.vercel.app/students"

export const navItems: readonly NavItem[] = [
  { label: "Features", href: "#features" },
  { label: "Testimonials", href: "#testimonials" },
] as const

export const stages: readonly StageCopyContent[] = [
  { id: "hero",      copy: { headline: "...", subline: "..." } },
  { id: "wow",       copy: { /* caption optional — Phase 4 fills */ } },
  { id: "feature-a", copy: { kicker: "...", heading: "...", paragraph: "...", bullets: ["...", "...", "..."] } },
  { id: "feature-b", copy: { kicker: "...", heading: "...", paragraph: "...", bullets: ["...", "...", "..."] } },
] as const

export const proofCopy = {
  heading: "Built around the student",
  points: [
    "Spot a struggling student before the next quiz",
    "Walk into class already knowing the room",
    "Hand off context cleanly when the year ends",
  ],
} as const

export const finalCtaCopy = {
  headline: "Know every student before tomorrow's bell.",
  body: "Join the early list for Teacher Workspace. Schools are welcome, and individual teachers can start free.",
  cta: "Start",
  emailPlaceholder: "Enter your school email",
} as const

export const footerCopy = {
  copyright: "© Teacher Workspace",
  supportEmail: "hello@teacherworkspace.app", // PLANNER: confirm with user
  trustLine: "Built with teachers, for teachers",
} as const
```

**Mandatory deletions (per D-06, RESEARCH.md line 297-308):** `heroCopy`, `productCopy`, `modules`, `proofPoints`. Verification grep: `! grep -rn "heroCopy\|productCopy\|\bmodules\b\|proofPoints" src/`.

---

### `src/components/landing/paper-hero.tsx` (minimal data swap, D-13)

**Pattern source:** self. ~5–12 line edit, otherwise unchanged.

**Imports diff** (paper-hero.tsx:12):
```diff
-import { heroCopy } from "@/content/landing"
+import { stages, TEACHER_WORKSPACE_APP_URL, finalCtaCopy } from "@/content/landing"
```

**Body diff:**
- Add near top of component: `const hero = stages.find((s) => s.id === "hero")!.copy` (or use `byId("hero").copy` if importing from `stages.ts`).
- Line 133: `{heroCopy.headline}` → `{hero.headline}`
- Line 136: `{heroCopy.headlineSecond}` → restructure per RESEARCH.md Risk #1 — split into `<h1>{hero.headline}</h1>` + `<p>{hero.subline}</p>` (semantically correct; visual change accepted).
- Line 143: `<a href={heroCopy.ctaHref}>` → `<a href={TEACHER_WORKSPACE_APP_URL}>`
- Line 144: `{heroCopy.cta}` → `{finalCtaCopy.cta}` (shared label per RESEARCH.md Risk #2 Option A).

**MANDATORY: leave Phase 2 debt intact** (D-14, RESEARCH.md lines 717-728):
- Lines 26-38 (magic-number `useTransform` keyframes) — **DO NOT TOUCH.**
- Lines 40-54 (`useState` opacity setters via `useMotionValueEvent`) — **DO NOT TOUCH.**
- Add the inline comment block above line 26:
```jsx
// PHASE-2-DEBT: this useState→opacity pattern (lines 40-47) and the magic-number
// useTransform keyframes (lines 26-38) are explicit Phase 2 work. See:
//   - REQUIREMENTS.md MIGRATE-02 (useState fix)
//   - REQUIREMENTS.md MIGRATE-03 (named STAGES constants)
//   - .planning/phases/01-foundation-types-static-fallback-ssr-contract/01-CONTEXT.md D-14
```

---

### `src/components/landing/proof-strip.tsx` (data migration)

**Pattern source:** self. Single import + variable migration.

**Imports diff** (proof-strip.tsx:1):
```diff
-import { proofPoints } from "@/content/landing"
+import { proofCopy } from "@/content/landing"
```

**Body diff:**
- Line 33: `{proofPoints.map((point, index) => (` → `{proofCopy.points.map((point, index) => (`
- Lines 23-29: replace hardcoded `"Built around the student"` + `"The grade, the absence, the parent message — finally on the same page."` with `{proofCopy.heading}` + (planner decides — heading text was previously inline; if `proofCopy.heading` covers only the kicker, the planner may need to add a `proofCopy.subheading` field, OR keep the long h2 inline and delete just the kicker swap). RESEARCH.md `proofCopy` shape only defines `heading + points`; surface to planner.

---

### `src/components/landing/final-cta.tsx` (data migration)

**Pattern source:** self. Migrate hardcoded strings (lines 32, 35-36, 38-39) into `finalCtaCopy` reads.

**Imports diff:**
```diff
+import { finalCtaCopy } from "@/content/landing"
```

**Body diff** (final-cta.tsx:32-39):
- Line 32 (kicker — hardcoded `"Free for individual teachers"`): planner choice — add `finalCtaCopy.kicker` to `landing.ts`, OR keep inline.
- Line 35: `Know every student before tomorrow's bell.` → `{finalCtaCopy.headline}`
- Line 38-39: body text → `{finalCtaCopy.body}`

**Note:** `finalCtaCopy` shape from RESEARCH.md does NOT include `kicker`; surface to planner whether to extend or keep inline.

---

### `src/components/landing/email-capture.tsx` (verify import)

**Pattern source:** self. Single import migration.

**Imports diff** (email-capture.tsx:5):
```diff
-import { heroCopy } from "@/content/landing"
+import { finalCtaCopy } from "@/content/landing"
```

**Body diff:**
- Line 16: `{heroCopy.emailPlaceholder}` → `{finalCtaCopy.emailPlaceholder}`
- Line 23: `{heroCopy.cta}` → `{finalCtaCopy.cta}`

**A11Y-07 risk** (RESEARCH.md lines 638-646): line 15 currently has `focus-visible:border-transparent focus-visible:ring-0` — explicitly disables focus ring. Planner SHOULD fix in Phase 1 (A11Y-07 is a Phase 1 requirement):
```diff
-className="h-12 flex-1 border-transparent bg-transparent px-5 text-[color:var(--paper-ink)] placeholder:text-[color:var(--paper-muted)] focus-visible:border-transparent focus-visible:ring-0"
+className="h-12 flex-1 border-transparent bg-transparent px-5 text-[color:var(--paper-ink)] placeholder:text-[color:var(--paper-muted)] focus-visible:border-primary focus-visible:ring-3 focus-visible:ring-primary/40"
```

---

### `src/components/landing/site-header.tsx` (data migration)

**Pattern source:** self.

**Imports diff** (site-header.tsx:4):
```diff
-import { heroCopy, navItems } from "@/content/landing"
+import { TEACHER_WORKSPACE_APP_URL, finalCtaCopy, navItems } from "@/content/landing"
```

**Body diff:**
- Line 47: `<a href={heroCopy.ctaHref}>` → `<a href={TEACHER_WORKSPACE_APP_URL}>`
- Line 48: `{heroCopy.cta}` → `{finalCtaCopy.cta}` (shared label per RESEARCH.md Risk #2 Option A)

---

### `src/routes/index.tsx` (composition swap, D-03)

**Pattern source:** self. Swap the four-section composition for `<StaticChoreographyFallback/>`. Decide on SiteHeader/SiteFooter mount per RESEARCH.md §"SiteHeader location" (recommendation: route-level for both).

**Recommended Phase 1 shape** (RESEARCH.md §"Composition tree", route-level header/footer):
```typescript
import { createFileRoute } from "@tanstack/react-router"

import { SiteHeader } from "@/components/landing/site-header"
import { SiteFooter } from "@/components/landing/footer"
import { StaticChoreographyFallback } from "@/components/landing/scroll-choreography/static-choreography-fallback"

export const Route = createFileRoute("/")({ component: HomePage })

function HomePage() {
  return (
    <main id="main" className="paper-page">
      <SiteHeader />
      <StaticChoreographyFallback />
      <SiteFooter />
    </main>
  )
}
```

**Mandatory:** add `id="main"` to `<main>` (skip-link target — A11Y-03).

**Header location decision** (RESEARCH.md OQ-2): Currently `<SiteHeader/>` is mounted INSIDE `<PaperHero>` at `paper-hero.tsx:122`. RESEARCH.md recommends extracting to route-level (Pitfall #2 — sticky-parent transform breaks z-index). Planner discretion: either extract now (~10-line paper-hero touch) or defer to Phase 2 (when `<PaperBackdrop>` is split). Both are defensible; flag for user.

---

### `src/routes/__root.tsx` (skip-link mount)

**Pattern source:** self. One element + one import added.

**Recommended diff** (RESEARCH.md lines 586-601):
```diff
 import { HeadContent, Scripts, createRootRoute } from "@tanstack/react-router"

 import appCss from "../styles.css?url"
+import { SkipLink } from "@/components/landing/skip-link"

 // ... Route + head() unchanged ...

 function RootDocument({ children }: { children: React.ReactNode }) {
   return (
     <html lang="en">
       <head>
         <HeadContent />
       </head>
       <body>
+        <SkipLink />
         {children}
         <Scripts />
       </body>
     </html>
   )
 }
```

**Phase 4 conflict-free** (RESEARCH.md line 581): Phase 4 owns SEO meta in `head()`; Phase 1's `__root.tsx` edit only touches `RootDocument`'s body — no conflict.

---

### `package.json` (verify scripts)

**Pattern source:** self. `package.json:9, 12` already have `"test": "vitest run"` and `"typecheck": "tsc --noEmit"` `[VERIFIED]`. No edits needed unless the planner wants to add `"test:watch"` or split. Phase 1 verifies presence, no migration.

---

## Shared Patterns

### Paper-token styling

**Source:** `src/styles.css` `:root` block (CSS vars `--paper-card`, `--paper-ink`, `--paper-muted`, `--paper-rule`).
**Apply to:** `footer.tsx`, `skip-link.tsx`, `feature-section.tsx`, all migrated sections.
**Reference excerpts:**
- `proof-strip.tsx:20` — paper-card shadow `shadow-[0_10px_60px_-30px_rgb(15_23_42/0.18)]`
- `proof-strip.tsx:23-24` — kicker `text-xs font-medium tracking-[0.18em] text-[color:var(--paper-muted)] uppercase sm:text-sm`
- `final-cta.tsx:30` — paper-card outer shell `paper-card relative ... rounded-[20px] border border-black/5 ...`
- `product-section.tsx:35-39` — h3 + body pair using `text-[color:var(--paper-ink)]` + `text-[color:var(--paper-muted)]`
**Constraint:** No new tokens (CLAUDE.md "Paper design tokens locked").

### Named-export discipline

**Source:** all components. CONVENTIONS.md "Module Design — Named exports for functions and components".
**Apply to:** every new file. No default exports. No barrel files.
**Reference excerpt** (`src/components/ui/button.tsx:68`):
```typescript
export { Button, buttonVariants }
```
For single-export files, inline `export function Foo()` is the norm (per `src/components/landing/proof-strip.tsx:3`).

### `import type` discipline (verbatimModuleSyntax)

**Source:** `tsconfig.json` `verbatimModuleSyntax: true`; `src/lib/utils.ts:3` (`import type { ClassValue } from "clsx"`).
**Apply to:** `types.ts`, `stages.ts`, `context.tsx`, `feature-section.tsx`, every test file that imports types, every consumer of `StageId`/`StageDef`.
**Rule:** anything used only in a type position MUST use `import type`.

### CTA `<Button asChild>` polymorphism

**Source:** `src/components/ui/button.tsx:55, 49` (`asChild` prop + `Slot.Root`).
**Apply to:** `footer.tsx` mailto link (if buttonized — D-05 keeps it as a plain `<a>`, so probably not), `skip-link.tsx` (also plain `<a>`), and existing CTAs in `paper-hero.tsx`, `site-header.tsx`, `final-cta.tsx`, `email-capture.tsx`.
**Reference excerpt** (`paper-hero.tsx:139-146`):
```tsx
<Button asChild className="...">
  <a href={TEACHER_WORKSPACE_APP_URL} rel="noreferrer">{finalCtaCopy.cta}</a>
</Button>
```

### `cn()` for class merging

**Source:** `src/lib/utils.ts:5-7`.
**Apply to:** any new component that conditionally composes Tailwind classes. The current Phase 1 components don't need conditional classes — `static-choreography-fallback.tsx`, `footer.tsx`, `skip-link.tsx` use static `className` strings. Reserve `cn()` for the orchestrator's eventual `<div className={cn("scroll-choreography-only", isDesktop && ...)}` (Phase 2).

### Section anatomy (kicker + h2 + body)

**Source:** `product-section.tsx:14-22`, `proof-strip.tsx:23-29`, `final-cta.tsx:31-40`.
**Apply to:** `feature-section.tsx` (renders this anatomy from `stages.find(...).copy`).
**Reference excerpt** (`product-section.tsx:14-22`):
```tsx
<p className="text-xs font-medium tracking-[0.18em] text-[color:var(--paper-muted)] uppercase sm:text-sm">
  {productCopy.kicker}
</p>
<h2 className="mt-4 font-heading text-[clamp(1.5rem,3.6vw,3.25rem)] leading-[1.08] font-medium tracking-tight text-balance text-[color:var(--paper-ink)]">
  {productCopy.headline}
</h2>
<p className="mt-6 text-base leading-7 text-[color:var(--paper-muted)] sm:text-lg sm:leading-8">
  {productCopy.body}
</p>
```
After migration: `productCopy.kicker` → `entry.copy.kicker`, etc.

### SSR-safe browser API gating

**Source:** `paper-hero.tsx:20, 67` (`useReducedMotion()` + `=== true` defensive read).
**Apply to:** `use-is-desktop.ts` (mirrors the SSR-null/optimistic discipline).
**Pattern:** never read `window`/`document`/`matchMedia` in render body — defer to `useEffect` and use `useHydrated()` for the gate.

### Section ID anchors (nav-target)

**Source:** `product-section.tsx:11` (`id="today"`), `proof-strip.tsx:7` (`id="reviews"`), `final-cta.tsx:8` (`id="pricing"`).
**Apply to:** `feature-section.tsx` (each instance needs a distinct id; planner picks values that match `navItems` hrefs `#features`, `#testimonials`).
**Reference excerpt:**
```tsx
<section className="..." id="today">
```

---

## No Analog Found

Files without an in-repo analog. Use RESEARCH.md canonical patterns instead.

| File | Role | Data Flow | Reason | Pattern source |
|------|------|-----------|--------|----------------|
| `src/components/landing/scroll-choreography/use-is-desktop.ts` | hook | event-driven (matchMedia) | No custom hooks exist in repo | RESEARCH.md §"useIsDesktop" lines 332-356 (`[VERIFIED: Context7]`) |
| `src/components/landing/scroll-choreography/context.tsx` | provider stub | (Phase 2) | No React Context exists | RESEARCH.md §"ScrollChoreographyContext Phase 1 stub" lines 391-415 |
| `src/components/landing/scroll-choreography/scroll-choreography.tsx` | orchestrator stub | (Phase 2) | Phase 2 fills body | Custom — Phase 1 stub embeds FOUND-04 contract comment |
| `src/components/landing/skip-link.tsx` | a11y landmark | request-response | No skip-link exists | RESEARCH.md §"SkipLink recommended pattern" lines 542-561 (`[CITED: WAI-ARIA + WebAIM]`) |
| `vitest.config.ts` | tooling | build-time | No test config exists | RESEARCH.md §"Validation Architecture" + Vitest 3.2.4 docs |
| `vitest.setup.ts` | tooling | build-time | No test setup exists | RESEARCH.md §"Wave 0 Gaps" |
| `tests/*.test.tsx` (7 files) | tests | unit | Zero tests in repo `[VERIFIED]` | Vitest 3.2 + @testing-library/react 16.3 canonical |

---

## Metadata

**Analog search scope:**
- `src/components/landing/` — all 6 existing landing components
- `src/components/ui/` — Button, Input
- `src/content/` — landing.ts (current shape)
- `src/lib/` — utils.ts
- `src/routes/` — __root.tsx, index.tsx
- `package.json` — scripts + dependency versions

**Files scanned:** 12 source files + 5 planning docs (CONTEXT.md, RESEARCH.md, STRUCTURE.md, CONVENTIONS.md, ARCHITECTURE.md) + CLAUDE.md.

**Key cross-cutting findings:**
1. The repo uses zero default exports, zero barrel files, zero enums — Phase 1 must adhere.
2. `verbatimModuleSyntax: true` — every type-only import must be `import type`.
3. Paper-tokens (`--paper-card`, `--paper-ink`, `--paper-muted`, `--paper-rule`) are the entire visual vocabulary; no new tokens.
4. The "kicker (uppercase, mono-tracking) → h2 (clamp font, tracking-tight) → body (paper-muted)" anatomy is repeated across product/proof/final-cta — it IS the section pattern.
5. The product-screenshot card (browser-chrome + `profiles-screen.png`) appears 3 times in the static path (paper-hero reduced branch + 2 feature-sections) which satisfies STATIC-04 without a dedicated Wow section.
6. Zero existing tests — Wave 0 must scaffold Vitest from scratch; treat all test patterns as new-canonical.
7. The on-disk working tree has uncommitted edits across 8 files (per gitStatus); the planner must reconcile these before applying Phase 1 changes (CONTEXT.md `<specifics>`).

**Pattern extraction date:** 2026-04-28
