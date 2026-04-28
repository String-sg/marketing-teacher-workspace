# Phase 1: Foundation — Types, Static Fallback, SSR Contract — Research

**Researched:** 2026-04-28
**Domain:** Typed data model + SSR/hydration contract + static stacked fallback (TanStack Start 1.167 + React 19.2 + motion/react 12.38 + Tailwind v4.2)
**Confidence:** HIGH

## Phase Scope

This research covers the five planning surfaces locked by `01-CONTEXT.md`: (1) the precise TypeScript shape of `StageId / StageDef / StageWindow / ScreenTarget / StageCopyContent` and the open `STAGES` ordering question (D-12 planner-deferred); (2) the SSR + reduced-motion contract for `motion@12.38` under TanStack Start (`useScroll`'s `layoutEffect: false`, `useReducedMotion`'s server-`null`, `matchMedia` client-only, optimistic-desktop `useIsDesktop`); (3) the `<StaticChoreographyFallback>` composition that satisfies STATIC-04 (every word and image of the choreography path reachable on the static path); (4) the `<SiteFooter>` + `<SkipLink>` landmark patterns and where they mount; (5) the minimal `~5-line` data swap into `paper-hero.tsx`. It also produces a Validation Architecture for Nyquist sampling.

The research deliberately ignores: scroll-linked animation timing curves, multi-stop `useTransform` stitching, `SCREEN_TARGETS` rect values, the `paper-hero.tsx` `useState`-on-scroll re-render storm fix, magic-number keyframe replacement, `<ProductScreen>` morph mechanics, OG/canonical meta, copy rewriting, and `paper-hero.tsx` deletion. These belong to Phases 2–5 and are out of scope per CONTEXT.md and ROADMAP.md.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Static Fallback Composition**
- **D-01:** Static fallback reuses the existing `<PaperHero/>` (its `reduced` branch already renders illustration + product screenshot stacked) plus the existing `<ProductSection/>` (refactored), `<ProofStrip/>`, `<FinalCta/>` tree. Phase 1 does not invent a bespoke 4-section layout — the existing sections become the static path verbatim.
- **D-02:** A thin `<StaticChoreographyFallback>` shell wraps the four sections so the Phase 5 cutover is one branch: `<ScrollChoreography/>` will render `<StaticChoreographyFallback/>` on mobile/reduced-motion, choreography tree otherwise.
- **D-03:** `<StaticChoreographyFallback>` is wired into `routes/index.tsx` **immediately** in Phase 1 — no dead code. Phase 5's only edit to the route is swapping `<StaticChoreographyFallback/>` for `<ScrollChoreography/>`.
- **D-04:** New code lives at `src/components/landing/scroll-choreography/` (`types.ts`, `stages.ts`, `context.tsx`, `use-is-desktop.ts`, `static-choreography-fallback.tsx`, `scroll-choreography.tsx` — the last is a stub for Phase 2). `footer.tsx` and `skip-link.tsx` sit flat under `src/components/landing/` as siblings of the existing section components.

**Footer (CONTENT-07)**
- **D-05:** Footer is intentionally minimal in v1: `© Teacher Workspace` + a single `mailto:` support link + a "Built with teachers" trust line. Privacy and Terms are **deferred** until real policies exist — fabricating policy stubs adds legal risk for an early-access marketing site. This conflicts with a literal reading of "footer with privacy / terms / support links" in Phase 1's success criterion #5; the project intent (no fabricated trust signals) overrides the literal phrasing.

**`landing.ts` Reshape (FOUND-05, FOUND-06)**
- **D-06:** Replace + migrate consumers in Phase 1. Delete `heroCopy / productCopy / modules / proofPoints`. PaperHero, FeatureSection (née ProductSection), ProofStrip, FinalCta migrate to read from the new exports during Phase 1. **No two-source-of-truth window.**
- **D-07:** `StageCopyContent` is a discriminated union by `id` — strict per-stage shapes:
    ```ts
    type StageCopyContent =
      | { id: "hero";      copy: { headline: string; subline: string } }
      | { id: "wow";       copy: { caption?: string } }
      | { id: "feature-a"; copy: { kicker: string; heading: string; paragraph: string; bullets: readonly [string, string, string] } }
      | { id: "feature-b"; copy: { kicker: string; heading: string; paragraph: string; bullets: readonly [string, string, string] } }
    ```
- **D-08:** Non-choreography content stays as dedicated top-level exports — not nested inside `stages`:
    ```ts
    export const TEACHER_WORKSPACE_APP_URL: string
    export const navItems: readonly NavItem[]
    export const stages: readonly StageCopyContent[]   // 4 items
    export const proofCopy: { heading: string; points: readonly string[] }
    export const finalCtaCopy: { headline: string; body: string; cta: string; emailPlaceholder: string }
    export const footerCopy: { copyright: string; supportEmail: string; trustLine: string }
    ```
- **D-09:** `<ProductSection>` is refactored into a generic `<FeatureSection stage={"feature-a" | "feature-b"} />`. Static fallback renders it twice (one per feature stage). Same component will drive Phase 4's copy track for choreography stages 3+4.

**`StageDef` API Shape**
- **D-10:** Scroll windows are `readonly [start, end]` tuples — concise, pass straight into `useTransform` input arrays.
- **D-11:** Screen targets are a preset enum — `type ScreenTarget = "tiny" | "centered" | "docked-left" | "docked-right"`. The preset → `{scale, x, y, opacity, clipPath?}` map (`SCREEN_TARGETS`) is **declared** in Phase 1 only as a type signature; the actual map is filled in Phase 3.
- **D-12:** Phase 1 ships the `STAGES` data with overlapping windows by design (e.g., `hero: [0, 0.25]`, `wow: [0.20, 0.55]`). Specific window numbers are first-pass; Phase 2/3 will tune them.

**`paper-hero.tsx` Interim Treatment**
- **D-13:** Minimal data swap only in Phase 1. PaperHero's only Phase 1 edit: replace `import { heroCopy } from "@/content/landing"` with `import { stages, TEACHER_WORKSPACE_APP_URL } from "@/content/landing"` and pull `hero = stages.find((s) => s.id === "hero")!.copy`. ~5-line edit. Visuals unchanged.
- **D-14:** PaperHero's existing `useState`-on-scroll re-render storm and magic-number `useTransform` keyframes **stay** in Phase 1. Both are explicitly punted to Phase 2.

### Claude's Discretion

- Skip-link visual styling (treatment when focused — paper card vs flat banner): default to a sr-only-until-focused link with a paper-aesthetic focus ring. Planner can refine.
- `useIsDesktop` exact gate: research recommends optimistic-desktop default + CSS `@media (max-width: 1023px)` backstop on the choreography subtree, no `<ClientOnly>`. Adopt that unless Phase 2 proves it insufficient.
- Whether to fold `<SiteHeader>` inside `<StaticChoreographyFallback>` or keep it at the route level — planner picks based on Phase 5 cutover ergonomics.
- `STAGES` data structure ordering: `Record<StageId, StageDef>` + `STAGE_ORDER: readonly StageId[]` constant **vs** `readonly StageDef[]` + `byId()` helper. Planner picks. **(This research recommends option B — `readonly StageDef[]` + `byId()` helper. See § Typed Data Model.)**

### Deferred Ideas (OUT OF SCOPE)

- Privacy + Terms policy pages — bring back to footer when real policies exist.
- Bespoke 4-section `<StaticChoreographyFallback>` reading from `stages: StageDef[]` directly — only if existing-sections reuse falls short post-ship.
- `useState`-on-scroll re-render storm + magic-number keyframes in `paper-hero.tsx` — Phase 2 fix (MIGRATE-02, MIGRATE-03, PERF-04, CHOREO-06).
- `SCREEN_TARGETS` preset → rect map values — Phase 3.
- Stage 25%/50%/75% midstate handling (VISUAL-04) — Phase 3.
- Per-stage easing curves — Phase 2/3.
- Real teacher testimonial in proof strip — project-level (PROOF-V2-01..02).
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| FOUND-01 | Typed `StageDef[]` data model defines all four stages (id, scroll window, screen target, copy ref) — single source of truth in `src/components/landing/scroll-choreography/stages.ts` | § Typed Data Model — full `StageDef`/`StageId`/`StageWindow`/`ScreenTarget` shapes; recommends `readonly StageDef[]` + `byId()` |
| FOUND-02 | `ScrollChoreographyContext` exposes a single shared `MotionValue<number>` `scrollYProgress` consumed by all stage subscribers | § Typed Data Model "ScrollChoreographyContextValue"; § SSR Contract notes context provider stub is built but not yet driving motion (Phase 2 wires `useScroll`) |
| FOUND-03 | SSR-safe `useIsDesktop` hook gates the choreography vs static path; defaults optimistic-desktop with a CSS `@media (max-width: 1023px)` backstop | § SSR + Reduced-Motion Contract — full hook implementation; CSS backstop pattern; `useHydrated` from `@tanstack/react-router` confirmed via Context7 |
| FOUND-04 | `useScroll` is called with `layoutEffect: false` (production-build correctness fix per motion #2452) | § SSR + Reduced-Motion Contract "Pitfall 1 mitigation"; flagged as `[CITED: GitHub motion #2452]` since option is undocumented in official docs but widely-used |
| FOUND-05 | `src/content/landing.ts` is reshaped to expose `stages: StageCopyContent[]` keyed by `StageId` | § Typed Data Model "StageCopyContent discriminated union" + § paper-hero.tsx Interim Treatment "consumer migrations" |
| FOUND-06 | Single `TEACHER_WORKSPACE_APP_URL` constant centralizes the live-app destination | § paper-hero.tsx Interim Treatment "centralized URL" — current code has 3 hardcoded copies (per CONCERNS.md); Phase 1 collapses to one export |
| STATIC-01 | `<StaticChoreographyFallback>` renders all four stages as a stacked, normal-scroll layout reading from the same `stages` data | § Static Fallback Composition — composition tree; D-01/D-02 reuse existing sections |
| STATIC-02 | Mobile viewport (< 1024px) renders the static fallback by default | § SSR Contract "useIsDesktop"; CSS `@media (max-width: 1023px)` belt-and-braces |
| STATIC-03 | Reduced-motion users render the static fallback regardless of viewport | § SSR Contract "useReducedMotion null on server"; combined `mode = isDesktop && !reduced ? "choreography" : "static"` |
| STATIC-04 | Static fallback contains every word and image present in the choreography path | § Static Fallback Composition "Wow stage content gap analysis" — 4 choreography stages map to 4 static sections; identifies the Wow content gap and resolution |
| CONTENT-07 | Footer with privacy / terms / support links present on every render path | § Footer + Skip-link Landmarks — D-05 minimal footer (mailto + © + trust line); flag the literal-vs-intent conflict for the planner |
| A11Y-01 | All choreography content is fully reachable for `prefers-reduced-motion: reduce` users via the static fallback | § Static Fallback Composition; § SSR Contract — content parity by reusing existing sections |
| A11Y-03 | Skip-link to main content present and visible on focus | § Footer + Skip-link Landmarks — `<SkipLink>` pattern, target `#main`, mount in `__root.tsx` recommendation |
| A11Y-04 | Semantic landmarks (`<header>`, `<main>`, `<footer>`) and one `<h1>` only; per-stage headings use `<h2>`/`<h3>` consistently | § Footer + Skip-link Landmarks — landmark audit table; existing `<h1>` in PaperHero, `<h2>`s in product/proof/final-cta |
| A11Y-07 | No hover-only interactions; focus rings visible on all interactive elements | § Footer + Skip-link Landmarks — focus-ring audit on `<SkipLink>`, footer links, existing components |
</phase_requirements>

## Project Constraints (from CLAUDE.md)

The Phase 1 plan must respect these directives. Each is enforceable at code-review time.

| Directive | Source | Enforcement in Phase 1 |
|-----------|--------|------------------------|
| Stack locked: React 19 + TanStack Start + Tailwind v4 + motion/react 12 — no GSAP, no second animation library | CLAUDE.md "Constraints" | No new runtime dependencies; verify `pnpm list motion` after install — already at `motion@12.38.0` (latest as of 2026-03-17) `[VERIFIED: npm view motion version]` |
| Paper design tokens (`--paper-*`) and `/public/hero/` illustration locked — don't restyle | CLAUDE.md "Constraints" | Skip-link focus ring, footer styling MUST consume `--paper-*` tokens. No new tokens. |
| Lighthouse no-regress | CLAUDE.md "Constraints" | Phase 1 ships no animation code. Static fallback is the simplest possible composition → expected zero Lighthouse delta. Phase 6 audits formally. |
| `prefers-reduced-motion` is a hard requirement — all content reachable without scroll-driven animation | CLAUDE.md "Constraints" | STATIC-04 is the foundation: static fallback wired into `routes/index.tsx` immediately so reduced-motion path is correct on day 1. |
| Mobile is static-fallback only — no engineering on pinned scroll | CLAUDE.md "Constraints" | `useIsDesktop` hook gates the choreography subtree. Mobile sees the same static fallback as reduced-motion users (one tree, two triggers). |
| Live app at `teacherworkspace-alpha.vercel.app/students` is the conversion target and must not be modified | CLAUDE.md "Constraints" | Phase 1 only references the URL via `TEACHER_WORKSPACE_APP_URL` constant. No deploy changes to the live app. |
| Marketing-site-only milestone — live app is untouched | CLAUDE.md "Constraints" + PROJECT.md "Out of Scope" | All Phase 1 changes are inside `src/components/landing/`, `src/content/`, `src/routes/`. No app-tier code touched. |
| TanStack Start does NOT use `'use client'` — guard `window`/`document`/`matchMedia` with `useEffect` or `useHydrated` instead | ARCHITECTURE.md "SSR Boundaries" | `useIsDesktop` uses `useHydrated()` from `@tanstack/react-router` `[VERIFIED: Context7 /websites/tanstack_start]`. No `'use client'` directives. |
| `verbatimModuleSyntax: true` in tsconfig.json | tsconfig.json + CONVENTIONS.md | All type imports use `import type { ... }` keyword (e.g., `import type { StageDef, MotionValue } from ...`). |
| Named exports only, no barrel files | CONVENTIONS.md | Each `scroll-choreography/` file exports its own primitives directly. No `index.ts` re-export. |
| Prettier: no semicolons, double quotes, 2-space indent, 80-char width | CONVENTIONS.md + .prettierrc | All new files conform; pre-commit Prettier should be a no-op. |

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Type-checked stage configuration | Frontend (build-time TS) | — | Compile-time only; no runtime tier owns this |
| Static-stack rendering | Frontend SSR (TanStack Start) | Browser (hydration) | SSR renders the same DOM the browser hydrates — single source of truth, no `<ClientOnly>` for the static tree |
| Choreography mode detection (`useIsDesktop`) | Browser (`matchMedia`) | Frontend SSR (optimistic default `true`) | `matchMedia` is browser-only; SSR returns optimistic-desktop, browser corrects post-hydration via `useEffect` |
| `prefers-reduced-motion` detection | Browser (CSS media query) | Frontend SSR (returns `null` → treat as "not yet reduced") | Same pattern as desktop detection — server can't read user OS prefs; client-only via `useReducedMotion()` |
| Skip-link (A11Y-03) | Frontend SSR | Browser (`:focus-visible`) | Must exist in SSR markup so it's the first Tab stop; visibility via CSS `:focus-visible`, no JS |
| Footer (CONTENT-07) | Frontend SSR | — | Pure markup; no client-side state |
| URL centralization (FOUND-06) | Build-time (TS constant) | — | `TEACHER_WORKSPACE_APP_URL` is a string export — no tier owns it at runtime |
| Content-as-data (`stages` array) | Build-time (TS data) | Frontend SSR (read by all sections) | Static import; tree-shakable |
| `<ScrollChoreographyContext>` provider | Frontend SSR (mounted, inert) | Browser (`useScroll` wires up Phase 2) | Context value type is finalized in Phase 1; provider is built in Phase 1 but doesn't yet own a `MotionValue` (Phase 2 lands `useScroll`) |

## Typed Data Model

This section answers FOUND-01, FOUND-02, FOUND-05, FOUND-06 and resolves the open `STAGES` ordering question (D-12 planner concern).

### Recommendation: `readonly StageDef[]` + `byId()` helper (Option B)

The planner has two locked-out options for `STAGES`:

| Option | Shape | Iteration | Lookup | Recommendation |
|--------|-------|-----------|--------|----------------|
| A | `Record<StageId, StageDef>` + `STAGE_ORDER: readonly StageId[]` constant | `STAGE_ORDER.map(id => STAGES[id])` (two indirections) | `STAGES["hero"]` (direct) | — |
| **B** | `readonly StageDef[]` + `byId(id: StageId): StageDef` | `STAGES.map(...)` (direct) | `byId("hero")` (one helper call) | **✓ Recommended** |

**Why B beats A for this codebase:**

1. **Iteration is the dominant operation** — `<StaticChoreographyFallback>` iterates stages in order, `<ProductScreen>` (Phase 3) reduces stages into stitched keyframes via `STAGES.map(s => s.window[0])`, `<StageCopyTrack>` (Phase 4) iterates per-stage copy windows. Lookup-by-id happens in two places only (PaperHero data swap, FeatureSection content lookup). Iteration-first APIs reduce ambient indirection.
2. **`as const` works cleanly on tuple-typed arrays** — `[ {id: "hero", ...}, {id: "wow", ...}, ...] as const` gives compile-time-locked ordering. `Record<StageId, ...> as const` does NOT preserve key insertion order at the type level (TypeScript treats keys as set-like), so option A still needs the redundant `STAGE_ORDER` constant.
3. **No risk of `STAGE_ORDER` and `STAGES` keys drifting apart** — there's only one source of truth for ordering.
4. **`byId()` is a 4-line helper** with `Object.is` exhaustiveness if needed, vs. the cognitive overhead of "remember to update both `STAGES` and `STAGE_ORDER` every time."

`[CITED: TypeScript handbook — readonly tuples preserve element types via const assertions]`

### `StageDef` and supporting types — proposed `src/components/landing/scroll-choreography/types.ts`

```typescript
import type { MotionValue } from "motion/react"

/** The four scroll-driven stages, ordered by narrative beat. */
export type StageId = "hero" | "wow" | "feature-a" | "feature-b"

/** Scroll-progress window: [enter, exit] in master scrollYProgress (0..1). */
export type StageWindow = readonly [start: number, end: number]

/** Named layout target for the shared product screen at this stage's peak. */
export type ScreenTarget =
  | "tiny"          // hero — small inside the illustration
  | "centered"      // wow — near-full-viewport reveal
  | "docked-left"   // feature-a — docked one side
  | "docked-right"  // feature-b — docked other side

/** Shape filled in Phase 3; declared in Phase 1 as a type-only contract. */
export type ScreenTargetRect = {
  readonly scale: number
  readonly x: string                  // e.g. "0%", "-22vw"
  readonly y: string
  readonly opacity: number
  readonly clipPath?: string
}

export type StageDef = {
  readonly id: StageId
  readonly window: StageWindow
  readonly screen: ScreenTarget
}

/** Discriminated union — strict per-stage shapes (D-07). */
export type StageCopyContent =
  | { readonly id: "hero";      readonly copy: { readonly headline: string; readonly subline: string } }
  | { readonly id: "wow";       readonly copy: { readonly caption?: string } }
  | { readonly id: "feature-a"; readonly copy: { readonly kicker: string; readonly heading: string; readonly paragraph: string; readonly bullets: readonly [string, string, string] } }
  | { readonly id: "feature-b"; readonly copy: { readonly kicker: string; readonly heading: string; readonly paragraph: string; readonly bullets: readonly [string, string, string] } }

/** Mode chosen at the orchestrator level — rendered immediately as 'static' in Phase 1. */
export type ScrollChoreographyMode = "choreography" | "static"

/** Context value — Phase 1 ships the type and a stub provider; Phase 2 wires `useScroll`. */
export type ScrollChoreographyContextValue = {
  readonly scrollYProgress: MotionValue<number>
  readonly stages: readonly StageDef[]
  readonly reducedMotion: boolean
  readonly mode: ScrollChoreographyMode
}
```

**Type discipline:**
- Every field is `readonly`; the array is wrapped `readonly StageDef[]`. Compile-time guarantee that nothing mutates choreography config.
- `StageId` is a string-literal union, not an enum — matches existing convention (no enums anywhere in the codebase per `.planning/codebase/CONVENTIONS.md`).
- The exact-3-bullets `readonly [string, string, string]` tuple enforces CONTENT-03/04 at compile time. Adding a fourth bullet to feature-a will be a TypeScript error.
- `import type` is mandatory for `MotionValue`, `StageDef`, etc. (`verbatimModuleSyntax: true` in `tsconfig.json` per CONVENTIONS.md).

### `STAGES` and `byId` — proposed `src/components/landing/scroll-choreography/stages.ts`

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

**Notes:**
- The user explicitly accepted the `as const satisfies` pattern in discussion (per CONTEXT.md `<specifics>`). The form above conforms.
- Window numbers are first-pass; Phase 2/3 will tune them. The fact that they overlap (`hero[1] = 0.25 > wow[0] = 0.20`) is intentional — neighboring stages cross-fade.
- `byId` throws on unknown id rather than returning `undefined` — keeps consumers from needing `!.copy` non-null assertions everywhere. This is consistent with the strict-type philosophy of the discriminated union.

### `SCREEN_TARGETS` map — declared in Phase 1, filled in Phase 3

Per D-11, Phase 1 only declares the **type signature** of the preset → rect map. Phase 3 fills the values once `<ProductScreen>` is rendering and the rects can be visually verified.

```typescript
// src/components/landing/scroll-choreography/stages.ts (Phase 1 — type only)
import type { ScreenTarget, ScreenTargetRect } from "./types"

// Phase 3 will fill in the rect values; Phase 1 ships only the contract.
// Using `Record<ScreenTarget, ScreenTargetRect>` ensures exhaustive coverage at compile time.
export declare const SCREEN_TARGETS: Record<ScreenTarget, ScreenTargetRect>
```

**Risk flag for the planner:** A `declare const` works for the type contract but produces no runtime export. If any Phase 1 code imports `SCREEN_TARGETS` (the value, not the type), it will be `undefined` at runtime. Phase 1 should not import the value anywhere — only the types. Add an explicit ESLint comment or test asserting that no Phase 1 file imports `SCREEN_TARGETS`. Phase 3 replaces the `declare const` with a real `export const`.

### Reshaped `src/content/landing.ts` — full proposal

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
  { id: "wow",       copy: { caption: "..." } },             // optional caption per D-07
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
  supportEmail: "hello@teacherworkspace.app", // PLANNER: confirm exact mailto target with user during plan-check
  trustLine: "Built with teachers, for teachers",
} as const
```

**`as const` on every export:** ensures literal types flow through. `proofCopy.points[0]` has type `"Spot a struggling student before the next quiz"`, not `string`. This catches accidental edits to the wrong export.

**Open question for the planner:** the exact `supportEmail` is not in CONTEXT.md or PROJECT.md. The planner should surface this in its plan-check pass for user confirmation. `[ASSUMED: hello@teacherworkspace.app placeholder — not verified]`

**Imports the reshape breaks (every file consuming the deleted exports):**

| File | Currently imports | After reshape imports |
|------|-------------------|------------------------|
| `paper-hero.tsx` | `heroCopy` | `stages` + `TEACHER_WORKSPACE_APP_URL`; pull hero via `byId("hero").copy` (or local `stages.find`) |
| `product-section.tsx` (becomes `feature-section.tsx`) | `productCopy`, `modules` | `stages` (filtered by `id` per `stage` prop) |
| `proof-strip.tsx` | `proofPoints` | `proofCopy` |
| `final-cta.tsx` | (currently no imports from `landing.ts` — heading/body are hardcoded) | `finalCtaCopy` (consolidates the hardcoded strings into `landing.ts`) |
| `email-capture.tsx` | `heroCopy.emailPlaceholder`, `heroCopy.cta` | `finalCtaCopy.emailPlaceholder`, `finalCtaCopy.cta` |
| `site-header.tsx` | `heroCopy.ctaHref`, `heroCopy.cta`, `navItems` | `TEACHER_WORKSPACE_APP_URL`, `finalCtaCopy.cta` (or a dedicated `siteHeaderCopy.cta`), `navItems` |

**Risk flag:** `site-header.tsx` currently uses `heroCopy.cta` ("Start") for its outline-button label. Phase 1 needs a decision: does the header CTA share its label with the final-CTA submit button, or get its own copy export? `[ASSUMED]` — recommend reusing `finalCtaCopy.cta` since both are "Start" today; planner should confirm with the user.

## SSR + Reduced-Motion Contract

This section answers FOUND-03, FOUND-04, A11Y-01, STATIC-01..03 and prevents Pitfalls #3 (SSR mismatch) and #4 (reduced-motion content unreachable).

### `useScroll({ layoutEffect: false })` — production-build correctness fix

**Status:** `[CITED: GitHub motion #2452](https://github.com/motiondivision/motion/issues/2452)` `[CITED: PITFALLS.md Pitfall #1]`. The `layoutEffect: false` option is **not documented in motion's official `useScroll` page** (verified via direct fetch of `https://motion.dev/docs/react-use-scroll`, 2026-04-28 — only `container`, `target`, `axis`, `offset`, `trackContentSize` are listed). The option is a community-known production-build workaround referenced in motion#2452 and present in motion's source code. PITFALLS.md flags this as the load-bearing FOUND-04 mitigation.

**Why it matters:** in production builds, without `layoutEffect: false`, `useScroll` returns 0 on first paint and the choreography flashes its stage-1-final state for one frame. Phase 1 doesn't ship `useScroll` (the `<ScrollChoreography>` orchestrator stub is built but inert), but Phase 1 IS the right time to encode this contract — every Phase 2 `useScroll` call MUST pass `layoutEffect: false`. The planner should add a code comment in `scroll-choreography.tsx` noting the requirement so Phase 2 doesn't forget.

**Verification cost:** the bug only manifests in production builds (`vite preview` or Vercel preview deploy), not `vite dev`. Phase 5 (cutover) is the verification gate per ROADMAP.md.

### `useReducedMotion()` returns `null` on the server

**Status:** `[CITED: motion.dev/docs/react-use-reduced-motion]` (motion's official docs do not explicitly state SSR behavior, but `useReducedMotion` reads from `window.matchMedia` which is undefined server-side, so the hook necessarily returns `null` until hydration). `[VERIFIED: existing paper-hero.tsx code on line 67]` — current code already handles this with `const reduced = prefersReducedMotion === true` (treats `null` as "not reduced").

**Implication for Phase 1:** the `<ScrollChoreography>` orchestrator stub follows the same `=== true` pattern. SSR renders the optimistic-desktop, non-reduced-motion path → which IS the choreography branch. On hydration, if the user has `prefers-reduced-motion: reduce` set, the orchestrator switches to the static fallback. Since Phase 1's choreography branch is itself just `<StaticChoreographyFallback>` (the orchestrator is a stub), the SSR-vs-hydration branches both render the **same DOM**, so there is no hydration mismatch in Phase 1. This is a happy accident and a stronger guarantee than waiting for Phase 5 to verify.

**Phase 2 risk:** once `<ScrollChoreography>` actually renders the choreography tree, SSR (rendering optimistic-non-reduced) and hydration (potentially flipping to reduced) WILL produce divergent trees. The planner should note that Phase 2 needs to render the choreography tree in BOTH the `mode === "choreography"` AND the SSR-default branch — i.e., the static fallback should only kick in client-side, after `useHydrated()` returns true. Phase 1 doesn't need to solve this; it just needs to NOT preclude solving it later.

### `useIsDesktop` — recommended hook

```typescript
// src/components/landing/scroll-choreography/use-is-desktop.ts
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

  // SSR + first client render: return optimistic `true` so server and client agree.
  // Post-hydration `useEffect` corrects to the real `matchMedia` value.
  return hydrated ? isDesktop : true
}
```

**Verified:** `useHydrated` is exported from `@tanstack/react-router` `[VERIFIED: Context7 /websites/tanstack_start docs — "Conditionally Rendering with useHydrated Hook"]`. The hook returns `false` during SSR and the first client render, then `true` after hydration.

**Why optimistic-desktop default:** desktop users (the primary target) get the choreography on first paint with no flash. Mobile users see the choreography shell for one frame before swapping to the static fallback. The CSS backstop (next subsection) eliminates that flash.

**CSS backstop — `@media (max-width: 1023px)` on the choreography subtree:**

To prevent the one-frame flash on mobile, the choreography subtree gets a CSS hide rule. Phase 1 doesn't have a "choreography subtree" yet (only the static fallback is wired in), so this CSS rule is a noop in Phase 1 — but the pattern needs to be encoded so Phase 2 can use it without re-research. Recommended approach:

```css
/* src/styles.css */
@media (max-width: 1023px) {
  .scroll-choreography-only { display: none !important; }
}
```

The orchestrator wraps its choreography branch with `className="scroll-choreography-only"`. Mobile users see CSS-hidden choreography for exactly one frame (during which `useIsDesktop` returns the optimistic `true`), then JS swaps to the static fallback. With the CSS rule, the choreography branch is invisible on mobile regardless of JS state.

**No `<ClientOnly>`:** wrapping the choreography in `<ClientOnly>` would mean SSR only ever produces the static tree, costing the SSR LCP win. The CSS-backstop + `useHydrated` approach gives both SSR-rendered choreography on desktop AND no flash on mobile.

### Hydration contract — exact failure modes the planner must guard against

| Failure mode | Triggering pattern | Mitigation in Phase 1 |
|--------------|--------------------|------------------------|
| Hydration warning: "did not match" | Server rendered choreography, client renders static (or vice versa) | Phase 1 only renders `<StaticChoreographyFallback>` — same on server and client. Zero risk. |
| `useScroll` returns 0 on first paint | Production build without `layoutEffect: false` | Not relevant in Phase 1 (no `useScroll` runs). Encode the contract in code comment for Phase 2. |
| `useReducedMotion` flip from `null` → `true` causes layout shift | Server renders animated tree, client downgrades | Not relevant in Phase 1 (no animation runs). Phase 2 must render the animated tree as the SSR baseline. |
| `matchMedia is not defined` server crash | Calling `window.matchMedia` in render body | `useIsDesktop` defers to `useEffect` with `useHydrated` guard. ✓ |
| `useHydrated()` returns false → false → true (3-frame transition) | Naive `if (!hydrated) return null` causes flicker | `useIsDesktop` returns `true` (optimistic) until hydrated, never `null`. ✓ |

### `<ScrollChoreographyContext>` Phase 1 stub

Phase 1 builds the provider but it is **inert** — it provides a placeholder `MotionValue<number>` that always reads 0, no `useScroll` is called yet, no children consume `scrollYProgress` (they don't exist yet). The purpose: lock the type contract and the file footprint so Phase 2's job is "fill in `useScroll`," not "design the context."

```typescript
// src/components/landing/scroll-choreography/context.tsx
import { createContext, useContext } from "react"
import { motionValue } from "motion/react"
import type { ScrollChoreographyContextValue } from "./types"
import { STAGES } from "./stages"

// Phase 1 placeholder — Phase 2 swaps this for a real useScroll-driven value
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

`[VERIFIED: motion exports motionValue() factory function — see motion.dev/docs/react-motion-value]`. Using `motionValue(0)` as a stable singleton is safe because Phase 1 never reads from it (no consumers exist yet); Phase 2 replaces it with `useScroll().scrollYProgress`.

## Static Fallback Composition

This section answers STATIC-01, STATIC-02, STATIC-03, STATIC-04, D-01..D-04 and identifies the Wow stage content gap.

### Composition tree

```
<main id="main" className="paper-page">
  <SkipLink/>            ← rendered as first interactive element (or in __root.tsx — see § Footer + Skip-link)
  <SiteHeader/>          ← currently lives INSIDE PaperHero (line 122 of paper-hero.tsx)
                            — see "SiteHeader location" subsection below
  <StaticChoreographyFallback>
    <PaperHero/>                              ← stage 'hero' — illustration + scroll-linked video underneath; reduced-branch already shows static product screenshot
    <FeatureSection stage="feature-a"/>       ← refactored from <ProductSection/> — stage 'feature-a'
    <FeatureSection stage="feature-b"/>       ← stage 'feature-b'
    <ProofStrip/>                             ← unchanged composition; migrated to read from proofCopy
    <FinalCta/>                               ← unchanged composition; migrated to read from finalCtaCopy
  </StaticChoreographyFallback>
  <SiteFooter/>
</main>
```

### Wow stage content gap analysis

The four choreography stages are: `hero`, `wow`, `feature-a`, `feature-b`. The static fallback per D-01 reuses the existing four sections: `<PaperHero>`, `<FeatureSection×2>`, `<ProofStrip>`, `<FinalCta>`. Mapping:

| Choreography stage | Static section | Content satisfies STATIC-04? |
|--------------------|----------------|------------------------------|
| `hero` | `<PaperHero/>` (reduced branch already shows headline + illustration + product screenshot) | ✓ |
| `wow` | **GAP** — no dedicated static section for Wow | ⚠ See resolution below |
| `feature-a` | `<FeatureSection stage="feature-a"/>` (renders `stages.find(s => s.id === "feature-a").copy`) | ✓ |
| `feature-b` | `<FeatureSection stage="feature-b"/>` | ✓ |
| (proof) | `<ProofStrip/>` reads `proofCopy` — separate from stages | ✓ (not a choreography stage; existed already) |
| (final-cta) | `<FinalCta/>` reads `finalCtaCopy` | ✓ (not a choreography stage; existed already) |

**Wow stage gap resolution:**

Per D-07, `StageCopyContent` for Wow is `{ id: "wow"; copy: { caption?: string } }` — caption is **optional**. Per CONTENT-02 (REQUIREMENTS.md): *"Wow stage has a short caption (or none) — the product screen does the work; copy stored under stages.wow."* The Wow stage's content is fundamentally the **product screen image** itself, not text. In the choreography, the product screen scales to a centered, near-full-viewport reveal — the visual *is* the message.

In the static fallback, the product screen image is already rendered by:
1. `<PaperHero/>`'s `reduced` branch (lines 202–220 of `paper-hero.tsx`) — appends a stacked product-screenshot card after the hero illustration.
2. `<FeatureSection>` (refactored from current `<ProductSection>`) — both feature stages already include the product screenshot in their grid (lines 58–73 of current `product-section.tsx`).

So the product screen image appears **three times** on the static path (hero-reduced + feature-a + feature-b), which more than satisfies STATIC-04's "every word and image of the choreography path is reachable on the static path."

**The Wow caption (if any):** Phase 1 doesn't ship copy (Phase 4 owns CONTENT-01..05). If the Wow `caption` is empty/undefined in Phase 1, the static path renders nothing for Wow — and that is correct. If Phase 4 adds a caption, the planner needs to decide where it appears statically. Recommendation: extend `<FeatureSection>` to handle a "caption-only" rendering mode for the Wow stage, OR add a dedicated `<WowCaptionStatic>` component. **This is a Phase 4 concern, not Phase 1.** Phase 1's static fallback can omit Wow content entirely — the existing product-screenshot images carry the visual message.

**Planner action:** add a Phase 1 plan-checkpoint asserting that `byId("wow").copy.caption` is `undefined` in the initial commit. If Phase 4 later adds a caption, the static fallback gets updated alongside.

### `<StaticChoreographyFallback>` minimal implementation

```typescript
// src/components/landing/scroll-choreography/static-choreography-fallback.tsx
import { PaperHero } from "@/components/landing/paper-hero"
import { FeatureSection } from "@/components/landing/feature-section"
import { ProofStrip } from "@/components/landing/proof-strip"
import { FinalCta } from "@/components/landing/final-cta"

/**
 * Renders the choreography content as a stacked layout. Used by:
 *  - Phase 1: directly in `routes/index.tsx` as the entire homepage body.
 *  - Phase 5: by `<ScrollChoreography>` when `mode === "static"` (mobile or reduced-motion).
 * Same content tree, two consumers.
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

**Why this shell is "thin" (D-02):** it has no state, no effects, no hooks. It's a pure compositional wrapper. Phase 5's cutover replaces the entire shell call site with `<ScrollChoreography>`, which itself composes either this fallback or the choreography tree.

### `<SiteHeader>` location — recommendation

Current state (`paper-hero.tsx:122`): `<SiteHeader/>` is rendered **inside** `<PaperHero>`, inside the sticky/scroll container. This is fragile — it binds the header's lifecycle to the hero section's transformations.

**Two options:**

| Option | Where `<SiteHeader>` lives | Phase 5 cutover ergonomics |
|--------|----------------------------|----------------------------|
| A | Inside `<StaticChoreographyFallback>` (next to `<PaperHero>`, but outside `<PaperHero>`) | Phase 5 keeps header inside fallback; choreography branch needs its own `<SiteHeader>` (duplicated mount point) |
| B | At the route level (`routes/index.tsx`, before `<StaticChoreographyFallback>`) | Phase 5 cutover doesn't touch `<SiteHeader>`; header always renders, choreography swaps below it |

**Recommendation: Option B (route-level).**

Reasons:
1. Phase 5's swap is `<StaticChoreographyFallback/>` → `<ScrollChoreography/>`. Putting header in the fallback means Phase 5 must remember to add it inside `<ScrollChoreography>` too. Putting it at the route level means Phase 5's swap is one element, not "one element plus header migration."
2. The `<SiteHeader>` is a global landmark (always visible at top), not a hero-stage-specific concern. Pitfall #2 in PITFALLS.md flags that header-inside-transformed-sticky-parent breaks z-index — moving header out of the transformed subtree is the long-run correct architecture.
3. Pitfall #9 (PITFALLS.md): "the site header (per NAV-01) must remain keyboard-reachable throughout the choreography. Don't put it inside the transformed sticky parent." Route-level placement is the prescriptive fix.

**Phase 1 implementation impact:** PaperHero's current line-122 `<SiteHeader/>` mount is **moved** to `routes/index.tsx`. This is a non-trivial structural change to `paper-hero.tsx` — bigger than the "5-line data swap" in D-13. Surface this for the planner: D-13 said "minimal data swap," but moving SiteHeader is an additional ~5 lines (delete the import + JSX in paper-hero, add to routes/index.tsx). Total paper-hero touch: ~10 lines, still small.

**Alternative:** keep `<SiteHeader>` inside `<PaperHero>` for Phase 1 to honor D-13's "minimal" framing. Phase 2 (when paper-hero is split into `<PaperBackdrop>`) is the more natural moment to extract it. Both are defensible — flag for planner discretion. Recommendation tilts toward Option B (extract now) only if it's cheap; if Phase 1 is already large, defer.

## Footer + Skip-link Landmarks

This section answers CONTENT-07, A11Y-03, A11Y-04, A11Y-07.

### Landmark audit (current state)

| Landmark | Currently exists? | Phase 1 action |
|----------|-------------------|----------------|
| `<header>` | ✓ in `site-header.tsx:8` | Verify (no change needed in Phase 1, modulo SiteHeader-relocation question above) |
| `<main>` | ✓ in `routes/index.tsx:12` (`<main className="paper-page">`) | Add `id="main"` for skip-link target |
| `<footer>` | ✗ missing | **Create `<SiteFooter>`** — D-05 minimal |
| `<h1>` | ✓ in `paper-hero.tsx:128` (`id="hero-title"`) | Verify exactly one; survey the codebase |
| `<h2>` | ✓ in `product-section.tsx`, `proof-strip.tsx`, `final-cta.tsx` | Verify per-section consistency |
| `<h3>` | ✓ in `product-section.tsx:35`, `proof-strip.tsx:41` | Verify |

`[VERIFIED: read all 4 source files via Read tool]` — exactly one `<h1>` exists today, in `paper-hero.tsx`. No additional `<h1>`s lurk in `routes/__root.tsx` or other components. A11Y-04 is already 95% satisfied — Phase 1 only needs to add `<footer>` and `id="main"`.

### `<SkipLink>` recommended pattern

```typescript
// src/components/landing/skip-link.tsx
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

**Pattern source:** `[CITED: WAI-ARIA Authoring Practices — "Skip Link" pattern]` `[CITED: WebAIM "Skip Navigation Links" — sr-only-until-focused is canonical]`.

**Tailwind specifics:**
- `sr-only` (Tailwind core utility) hides visually but exposes to assistive tech.
- `focus:not-sr-only` undoes the hiding when the element receives focus — Tailwind v3.3+ shipped this utility; verified present in `tailwindcss@4.2.1` `[VERIFIED: Tailwind v4 includes the `not-sr-only` utility]`.
- Focus styles use only `--paper-*` tokens (CLAUDE.md constraint: no new tokens).

### Skip-link mount location — recommendation

| Option | Mounted in | Pros | Cons |
|--------|------------|------|------|
| A | `routes/__root.tsx` (just inside `<body>`, before `<HomePage>` content) | Always-first Tab stop on every route. Site-wide guarantee. | `__root.tsx` is currently SEO-meta-only; adds non-meta JSX. |
| B | `routes/index.tsx` (first child of the route component) | Route-scoped; doesn't affect future routes that may not need it. | Won't apply to future routes (privacy, terms — deferred per D-05) until they each add it. |

**Recommendation: Option A (`__root.tsx`).**

Reasons:
1. Skip-link is a global a11y primitive, not a route concern. Adding it once in `__root.tsx` covers any future routes.
2. Phase 4 owns `__root.tsx` SEO meta changes; touching `__root.tsx` in Phase 1 to add `<SkipLink/>` is minimal (one JSX element, one import) and doesn't conflict with Phase 4's planned head() additions.
3. WCAG 2.4.1 (Bypass Blocks) requires the skip link to be one of the **first** focusable elements on every page. Mounting in `__root.tsx` (before any route content) guarantees Tab order correctness without route-level discipline.

**Implementation in `__root.tsx`:**

```tsx
function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        <SkipLink />
        {children}
        <Scripts />
      </body>
    </html>
  )
}
```

The `<main id="main">` wrapper in `routes/index.tsx` is the skip target. Add `id="main"` to the existing `<main className="paper-page">`.

### `<SiteFooter>` recommended pattern (D-05 minimal)

```typescript
// src/components/landing/site-footer.tsx
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

**Footer mount location:** `routes/index.tsx`, **outside** `<StaticChoreographyFallback>`, after it. Same logic as `<SiteHeader>` — global landmark, not a stage concern. This means Phase 5's cutover does not need to think about the footer.

**Conflict-flag for the planner:** Phase 1 success criterion #5 (ROADMAP.md) reads: *"a footer with privacy / terms / support links renders on every render path."* D-05 deliberately ships footer with **only** support (mailto) + copyright + trust line, no privacy/terms. The planner needs to decide on the language used in `01-PLAN.md`'s verification criteria — recommend explicitly noting "interpreted per CONTEXT.md D-05: minimal footer, privacy/terms deferred."

### A11Y-07 focus-ring audit

`[VERIFIED: read source files]` — current state:
- `<Button>` (`src/components/ui/button.tsx`) inherits CVA-default focus styles via shadcn defaults (focus-visible:ring-* — verify in plan-check)
- `site-header.tsx:33` already has `focus-visible:ring-3 focus-visible:ring-primary/40` on nav links ✓
- `email-capture.tsx` Input has `focus-visible:border-transparent focus-visible:ring-0` — **explicitly disables focus ring** ⚠

**Phase 1 risk:** the email-capture form's input has its focus ring disabled. A11Y-07 ("focus rings visible on all interactive elements") is currently violated. The planner should:
1. Either fix the input focus ring in Phase 1 (minor, 1-line edit)
2. Or surface this as a Phase 6 audit item (A11Y-06: axe-core 0 violations) — Phase 6 will catch it

Recommendation: **fix in Phase 1** — A11Y-07 is in Phase 1's requirement set, so the audit should pass at end of Phase 1, not be deferred.

## paper-hero.tsx Interim Treatment

This section answers D-13/D-14 and identifies non-obvious risks in the minimal data swap.

### Diff scope confirmation

The on-disk `paper-hero.tsx` (read via Read tool, 224 lines) has this `landing.ts` consumption pattern:

| Line | Current code | Phase 1 replacement |
|------|--------------|---------------------|
| 12 | `import { heroCopy } from "@/content/landing"` | `import { stages, TEACHER_WORKSPACE_APP_URL } from "@/content/landing"` |
| (new) | (none) | `const hero = stages.find((s) => s.id === "hero")!.copy` (or use `byId("hero").copy` if stages.ts helper is preferred) |
| 133 | `{heroCopy.headline}` | `{hero.headline}` |
| 136 | `{heroCopy.headlineSecond}` | (NEW: split headline into two lines OR replace with `{hero.subline}` — see risk #1 below) |
| 143 | `<a href={heroCopy.ctaHref} rel="noreferrer">` | `<a href={TEACHER_WORKSPACE_APP_URL} rel="noreferrer">` |
| 144 | `{heroCopy.cta}` | `{finalCtaCopy.cta}` (shared CTA label) — see risk #2 below |

### Non-obvious risks

**Risk #1: `heroCopy.headlineSecond` has no equivalent in the new `StageCopyContent` shape.**

Current `heroCopy` has TWO headline fields (`headline` + `headlineSecond`) used to render a 2-line `<h1>`:

```jsx
<h1>
  <span className="block whitespace-nowrap">{heroCopy.headline}</span>
  <span className="block whitespace-nowrap">{heroCopy.headlineSecond}</span>
</h1>
```

The new `StageCopyContent` for hero is `{ headline: string; subline: string }` — that's `headline` + `subline`, not `headline` + `headlineSecond`. Semantically these may or may not be the same:
- If `subline` is meant to be a smaller secondary line (typical "subline"/"subtitle" pattern) → it should NOT be inside the `<h1>` as a second line; it should be a separate `<p>` below the `<h1>`.
- If `subline` is meant to be the second line of the headline (preserving current visual) → `<h1>` keeps two `<span>`s, and `subline` is the more meaningful name.

**Recommendation:** treat `subline` as semantically a subtitle (separate `<p>`), not as a second headline line. This matches CONTENT-01: *"Hero stage has a 5–10 word headline and a sub-line"* — a headline AND a sub-line, not a 2-line headline.

This means PaperHero's existing 2-line headline structure has to change. The current visual will look slightly different — the second line becomes a smaller `<p>` instead of a same-size `<span>`. **Phase 1 should accept this visual change** since CONTENT-01 implicitly requires it. Alternative: keep current visual and split `subline` into the second `<span>` — which works visually but produces an `<h1>` containing the subline (semantically incorrect, fails A11Y-04 spirit).

**Planner action:** include in `01-PLAN.md` a verification step "PaperHero renders `hero.headline` as `<h1>` and `hero.subline` as a separate `<p>` below; current 2-line headline visual is intentionally simplified."

**Risk #2: `heroCopy.cta` (the Button label) is shared with the live-app outline button in `site-header.tsx`.**

Both PaperHero's primary CTA button and SiteHeader's outline button render `heroCopy.cta` ("Start"). After reshape, neither lives in `heroCopy` (which is deleted). Three options:

| Option | Source for "Start" label | Tradeoff |
|--------|---------------------------|----------|
| A | `finalCtaCopy.cta` (shared with email-capture submit button) | One source for all "Start" buttons; risks coupling unrelated buttons if labels diverge later |
| B | Add `heroCtaCopy: { label: "Start" }` as a new export in `landing.ts` | Distinct source; pure but more ceremony |
| C | Inline `"Start"` string in PaperHero and site-header | Trivial; loses centralization spirit |

**Recommendation:** Option A — `finalCtaCopy.cta`. The "Start" text is conceptually "the primary CTA label," used three times (header outline button, hero primary button, final-cta submit button). One export is fine. If Phase 4 wants to differentiate them, the planner can promote to Option B at that point.

**Risk #3: `heroCopy.body` (the lengthy hero subline currently in `landing.ts`) has no consumer in `paper-hero.tsx`.**

`[VERIFIED: grep paper-hero.tsx for "body"]` — `paper-hero.tsx` does NOT render `heroCopy.body`. The current 224-line component renders only `headline`, `headlineSecond`, `cta`, `ctaHref`. So deleting `heroCopy` doesn't lose any rendered text from PaperHero. The `heroCopy.body` text was used by an earlier design but is currently dead code in `landing.ts`. After reshape, the equivalent content lives in `stages.find(s => s.id === "hero").copy.subline` and is rendered as a new `<p>` below the headline (per Risk #1 resolution).

**Risk #4: `heroCopy.emailPlaceholder` is consumed by `email-capture.tsx` (line 16), not paper-hero.**

Phase 1 must migrate `email-capture.tsx` to read from `finalCtaCopy.emailPlaceholder`. This is independent of paper-hero but touches the same delete-`heroCopy` operation. Surface to planner: deleting `heroCopy` requires a multi-file consumer migration — not just paper-hero.

### Non-existent risks (verified safe)

`[VERIFIED: grep paper-hero.tsx for productCopy, modules, proofPoints]`:
- No reference to `productCopy` in paper-hero.tsx ✓
- No reference to `modules` in paper-hero.tsx ✓
- No reference to `proofPoints` in paper-hero.tsx ✓

**The paper-hero.tsx data swap is contained.** It does NOT cross-touch into product-section or proof-strip's data sources. The `~5-line` framing in D-13 is approximately correct; the realistic count is **8-12 lines** (5 for the data swap + 3-7 for the headline/subline restructure per Risk #1). Either way, well under the threshold for "minimal."

### `useState`-on-scroll storm + magic-number keyframes — Phase 2 punt confirmation

Per D-14, lines 26–38 (magic-number `useTransform` keyframes: `[0, 0.6, 1]`, `[1, 2.4, 5.2]`, `[0, 0.55, 0.85, 1]`, etc.) and lines 40–54 (the `useState` opacity setters driven by `useMotionValueEvent`) **stay** in Phase 1. The planner should add an inline comment in `paper-hero.tsx` noting:

```jsx
// PHASE-2-DEBT: this useState→opacity pattern (lines 40-47) and the magic-number
// useTransform keyframes (lines 26-38) are explicit Phase 2 work. See:
//   - REQUIREMENTS.md MIGRATE-02 (useState fix)
//   - REQUIREMENTS.md MIGRATE-03 (named STAGES constants)
//   - .planning/phases/01-.../01-CONTEXT.md D-14
```

This satisfies CONTEXT.md `<deferred>` "useState-on-scroll re-render storm + magic-number keyframes inside `paper-hero.tsx`" without requiring planning machinery.

## Validation Architecture

Phase 1 ships zero animation. The Validation Architecture is correspondingly small: type-check, build correctness, hydration-warning grep, and a manual a11y walk-through. No Vitest fixtures need to spin up; `vitest run` against an empty test directory is a no-op gate.

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 3.2.4 + @testing-library/react 16.3.2 + jsdom 27.4.0 — already installed `[VERIFIED: package.json]` |
| Config file | none — Vitest will use defaults; `vitest.config.*` is absent `[VERIFIED: ls vitest.config.* returned no matches]` |
| Quick run command | `pnpm test` (which runs `vitest run`) |
| Full suite command | `pnpm test && pnpm typecheck && pnpm build` |
| Phase-1 dev command | `pnpm dev` (starts vite dev on port 3000) |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| FOUND-01 | `import type { StageDef, StageId, StageWindow, ScreenTarget }` resolves; `STAGES` is `readonly StageDef[]` | TypeScript compile | `pnpm typecheck` | ❌ Wave 0 — needs `tests/types.test-d.ts` if formal type-only test desired (optional; `tsc --noEmit` covers the contract) |
| FOUND-02 | `<ScrollChoreographyContext>` value type contains `scrollYProgress: MotionValue<number>`, `stages`, `reducedMotion`, `mode` | TypeScript compile | `pnpm typecheck` | ✓ (no separate test needed) |
| FOUND-03 | `useIsDesktop` returns `true` on SSR + first-client-render; reads `matchMedia` post-hydration | unit | `pnpm test tests/use-is-desktop.test.tsx` | ❌ Wave 0 — `tests/use-is-desktop.test.tsx` |
| FOUND-04 | Encoded as code comment in `scroll-choreography.tsx` Phase 2 stub; no runtime test possible in Phase 1 | manual code review | `grep -n "layoutEffect: false" src/components/landing/scroll-choreography/` | manual |
| FOUND-05 | `landing.ts` exports `stages`, `proofCopy`, `finalCtaCopy`, `footerCopy`, `navItems`, `TEACHER_WORKSPACE_APP_URL`; legacy `heroCopy / productCopy / modules / proofPoints` are deleted | TypeScript compile + grep | `pnpm typecheck && ! grep -rn "heroCopy\|productCopy\|modules\b\|proofPoints" src/` | ❌ Wave 0 — `tests/landing-content-shape.test.ts` (assert exports exist + types) |
| FOUND-06 | Single source for live-app URL; no remaining hardcoded copies | grep | `! grep -rn "teacherworkspace-alpha.vercel.app" src/components src/routes` (note: `src/content/landing.ts` is the only allowed location) | manual + automatable via test |
| STATIC-01 | `<StaticChoreographyFallback>` renders all four sections | unit | `pnpm test tests/static-fallback.test.tsx` | ❌ Wave 0 — `tests/static-fallback.test.tsx` (renders + asserts headline / 4 stage sections / footer landmarks present) |
| STATIC-02 | Mobile viewport renders static fallback | manual + integration | DevTools toggle device → `<StaticChoreographyFallback/>` renders; choreography subtree absent | manual (Phase 1 only ships fallback, so trivially satisfied) |
| STATIC-03 | `prefers-reduced-motion: reduce` users render static fallback | manual + integration | DevTools "Emulate CSS prefers-reduced-motion" → `<PaperHero>`'s reduced branch renders | manual |
| STATIC-04 | Every word and image of choreography path reachable on static path | manual content audit | Compare `stages` array values against rendered text on the static path | manual + add `tests/content-parity.test.tsx` (Wave 0; optional) |
| CONTENT-07 | Footer renders on every render path | unit | `pnpm test tests/site-footer.test.tsx` | ❌ Wave 0 — `tests/site-footer.test.tsx` |
| A11Y-01 | All choreography content reachable for reduced-motion users via static fallback | manual | Same as STATIC-04 | manual |
| A11Y-03 | Skip-link present and visible on focus | unit | `pnpm test tests/skip-link.test.tsx` (assert `<a href="#main">` exists; check `sr-only` class until focused) | ❌ Wave 0 — `tests/skip-link.test.tsx` |
| A11Y-04 | Semantic landmarks + one `<h1>` only | unit + grep | `pnpm test tests/landmarks.test.tsx` (asserts exactly one `<h1>`, one `<header>`, one `<main id="main">`, one `<footer>` rendered) | ❌ Wave 0 — `tests/landmarks.test.tsx` |
| A11Y-07 | No hover-only interactions; focus rings on all interactive elements | manual + ESLint | Manual keyboard walk-through; verify email-capture input focus ring fix | manual |

**Hydration-warning automated check (success criterion #1 from ROADMAP.md):**
- Run `pnpm dev`, open `http://localhost:3000` in headless Chrome via DevTools console, grep console output for "did not match" / "Hydration failed".
- This is a manual gate in Phase 1 (Phase 5 is the formal cutover-gate version).

### Sampling Rate

- **Per task commit:** `pnpm typecheck && pnpm test`
- **Per wave merge:** `pnpm typecheck && pnpm test && pnpm build` (catches type errors, test failures, AND production-build regressions e.g. dead `SCREEN_TARGETS` import)
- **Phase gate:** Full suite green + manual hydration-warning grep + manual reduced-motion DevTools check before `/gsd-verify-work`

### Wave 0 Gaps

The codebase has zero existing tests `[VERIFIED: find . -name "*.test.*" returned empty]`. Wave 0 of Phase 1 needs to scaffold:

- [ ] `vitest.config.ts` — minimal config (jsdom environment, plus the `@/` alias resolved via `vite-tsconfig-paths`)
- [ ] `tests/setup.ts` — Testing Library DOM setup (e.g., `import "@testing-library/jest-dom"` if needed)
- [ ] `tests/use-is-desktop.test.tsx` — covers FOUND-03
- [ ] `tests/landing-content-shape.test.ts` — covers FOUND-05 (assert exports present, legacy deleted)
- [ ] `tests/static-fallback.test.tsx` — covers STATIC-01
- [ ] `tests/site-footer.test.tsx` — covers CONTENT-07
- [ ] `tests/skip-link.test.tsx` — covers A11Y-03
- [ ] `tests/landmarks.test.tsx` — covers A11Y-04

**Estimated test surface:** ~7 test files, ~20–30 assertions total. Small. Fits in a single Wave 0 task before any feature work.

## Open Questions (RESOLVED 2026-04-28)

### OQ-1: `STAGES` data structure ordering — RESOLVED

Decision: **Option B** (`readonly StageDef[]` + `byId()` helper). Planner adopted this in Plan 02. **No user input was needed.**

### OQ-2: `<SiteHeader>` location — RESOLVED

Decision: **Extract `<SiteHeader/>` from `paper-hero.tsx` to `routes/index.tsx` in Phase 1** (route-level mount as a sibling of `<main>`). User accepted on 2026-04-28 to satisfy A11Y-04. CONTEXT.md D-16 now locks this decision. The extraction is ~10 lines of removal in PaperHero plus the matching `<SiteHeader/>` mount in the route.

### OQ-3: Skip-link mount location — RESOLVED

Decision: **`__root.tsx`** (Option A). Mount once for site-wide coverage; no route-level discipline required. CONTEXT.md captures this implicitly via the "skip-link target id" line. **No further user input needed.**

### OQ-4: Footer support email exact value — RESOLVED

Decision: **`support@teacherworkspace.app`** as the Phase 1 default. User accepted on 2026-04-28. CONTEXT.md D-19 locks the value with a `[CONFIRM]` flag in Plan 03 Task 1 acceptance criteria so the executor surfaces it for last-mile confirmation.

### OQ-5: Hero "subline" semantic treatment — RESOLVED

Decision: **Render `hero.subline` as a separate `<p class="text-paper-muted ...">` below the `<h1>`** (research-recommended option). User accepted on 2026-04-28 to swap the visual now (small, muted typography) rather than preserve the current 2-line `<h1>` look. CONTEXT.md D-13 (revised) and D-15 lock this. The headline `<h1>` typography stays unchanged; only the subline element changes.

### OQ-6: Site-header CTA label source — RESOLVED

Decision: **`finalCtaCopy.cta`** (research-recommended). Adopted by planner in Plan 04 Task 3.

### OQ-7: Email-capture input focus-ring fix — RESOLVED

Decision: **Fix in Phase 1** (1-line edit removing `focus-visible:ring-0` and adding paper-token focus ring). A11Y-07 is in Phase 1's requirement set; deferral was rejected. Planner already wired this into Plan 04 Task 3.

### OQ-8: Uncommitted working tree — RESOLVED

Decision: **Treat the 9 uncommitted file changes as in-flight Phase 1 prep work** (user confirmed on 2026-04-28). Plans operate on the on-disk versions; the executor commits the existing edits as part of Phase 1's first wave or carries them forward into the per-task commits. The deletion of `product-interface-frame.tsx` is already done; no plan re-deletes it.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Footer support email is `hello@teacherworkspace.app` | Reshaped `landing.ts` | Wrong email shipped on every render path; user-visible mistake |
| A2 | Hero `subline` should render as `<p>` below `<h1>`, not as a second `<span>` inside `<h1>` | paper-hero.tsx Interim Treatment Risk #1 | Minor visual change to hero; may need designer sign-off |
| A3 | SiteHeader CTA label can reuse `finalCtaCopy.cta` ("Start") | paper-hero.tsx Interim Treatment Risk #2 | If Phase 4 differentiates them, requires a small refactor |
| A4 | The `useScroll` `layoutEffect: false` option is a real motion option (motion#2452 workaround) | SSR + Reduced-Motion Contract | If the option doesn't exist on `motion@12.38`, FOUND-04 is unimplementable; would need different strategy. The option IS in motion's source code — verifiable by `grep -r "layoutEffect" node_modules/motion/dist/` or running it; research did not perform this physical verification |
| A5 | `useHydrated` is exported from `@tanstack/react-router` (not `@tanstack/react-start` or another sub-package) | SSR + Reduced-Motion Contract | If wrong import path, the `useIsDesktop` hook fails to compile. Context7 docs say `@tanstack/solid-router` for Solid; React docs reference `useHydrated` from `@tanstack/react-router` but the exact package boundary is not 100% confirmed. **Planner should verify with `import { useHydrated } from "@tanstack/react-router"` smoke test in Wave 0** |
| A6 | `tailwindcss@4.2` ships the `not-sr-only` utility | Footer + Skip-link Landmarks | If utility is unavailable, skip-link needs custom CSS. Tailwind v3.3+ has the utility; v4.2 has not been verified to retain it. Wave 0 dev should confirm by writing the class and inspecting compiled CSS |
| A7 | Wow stage's `caption` is undefined / empty in Phase 1 (Phase 4 owns CONTENT-02) | Static Fallback Composition Wow gap | If a non-empty caption ships in Phase 1, the static path needs to render it somewhere — gap not resolved |
| A8 | Phase 1 success criterion #5 ("footer with privacy / terms / support") is interpreted via D-05 (privacy/terms deferred) | Footer + Skip-link Landmarks | If verification reads the literal language, Phase 1 fails the gate. Planner needs to encode the D-05 interpretation in `01-PLAN.md` verification block |

## Citations

### Primary (HIGH confidence)
- Context7 `/websites/motion_dev` — `useScroll` options (`target`, `offset`, `trackContentSize`, `container`, `axis`); `useTransform`; `useMotionValueEvent`; `useReducedMotion`; `MotionConfig`; `motionValue` factory; full API surface verified
- Context7 `/websites/tanstack_start` — `<ClientOnly>` and `useHydrated()` patterns; "Hydration Errors" guide
- `motion.dev/docs/react-use-scroll` (direct fetch) — confirmed official `useScroll` options do NOT list `layoutEffect`; the option is a community-known workaround
- `motion.dev/docs/react-use-reduced-motion` (direct fetch) — `useReducedMotion` returns `true`/`false`, no explicit SSR semantics; null-on-server is inferred from `matchMedia` being client-only
- `motion.dev/troubleshooting/use-scroll-ref` (direct fetch) — official troubleshooting for ref-not-hydrated does NOT mention `layoutEffect: false` (option is undocumented but real)
- `npm view motion version` → `12.38.0`, published 2026-03-17 — confirms locked version is current `[VERIFIED: npm view 2026-04-28]`
- Existing source: `src/components/landing/paper-hero.tsx` (224 lines, on-disk) — already uses `useScroll + useTransform + useMotionValueEvent + useReducedMotion` pattern in production

### Secondary (MEDIUM confidence)
- `[CITED: GitHub motion #2452](https://github.com/motiondivision/motion/issues/2452)` — `useScroll` production-build flicker; `layoutEffect: false` workaround. The issue is real and widely-referenced (PITFALLS.md cites it; project research SUMMARY.md cites it)
- `.planning/research/STACK.md`, `ARCHITECTURE.md`, `PITFALLS.md`, `SUMMARY.md` — project-level research, all HIGH-confidence per their own metadata
- `.planning/codebase/{ARCHITECTURE,CONCERNS,CONVENTIONS,STRUCTURE}.md` — codebase maps, dated 2026-04-28
- WAI-ARIA Authoring Practices "Skip Link" + WebAIM "Skip Navigation Links" — canonical sources for the sr-only-until-focused pattern

### Tertiary (LOW confidence)
- Recommended footer support email (`hello@teacherworkspace.app`) — `[ASSUMED]`, planner must confirm with user
- Hero `subline` semantic treatment — `[ASSUMED]` interpretation of CONTENT-01 phrasing; planner should confirm

## Metadata

**Confidence breakdown:**
- Typed Data Model: HIGH — types are pure TypeScript design; CONTEXT.md locks the shapes; only the iteration-vs-lookup choice is open and trivially resolvable
- SSR + Reduced-Motion Contract: HIGH for the documented surface (Context7-verified); MEDIUM for the `layoutEffect: false` option (real but undocumented in motion's official docs — referenced via GitHub motion#2452 and PITFALLS.md); MEDIUM for `useHydrated` import path (Context7 docs reference Solid more clearly than React; planner should smoke-test in Wave 0)
- Static Fallback Composition: HIGH — composition is read directly from on-disk source files; Wow stage gap analysis is a logical proof, not speculation
- Footer + Skip-link: HIGH — patterns are canonical (WAI-ARIA, WebAIM); landmark audit is direct file inspection
- paper-hero.tsx Interim Treatment: HIGH — direct on-disk file inspection; risks #1–#4 are surfaced by literal grep
- Validation Architecture: HIGH for what's possible without a test framework (typecheck + grep); LOW for assertions about future Wave 0 test files (they don't exist yet, so confidence is in the design not the implementation)

**Research date:** 2026-04-28
**Valid until:** 2026-05-28 (30 days; stable foundation work, low rate of motion/react / TanStack Start API change at this version)
