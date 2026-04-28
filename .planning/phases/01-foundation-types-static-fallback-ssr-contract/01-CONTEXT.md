# Phase 1: Foundation — Types, Static Fallback, SSR Contract - Context

**Gathered:** 2026-04-28
**Status:** Ready for planning

<domain>
## Phase Boundary

Lay the typed data model + static stacked fallback + SSR/hydration contract that every later phase builds on. Phase 1 ships **no animation** — `<PaperHero/>` keeps driving the live `/` route's hero scroll-linked video until the Phase 5 cutover.

Concretely, Phase 1 produces:

1. The typed choreography data model (`StageId`, `StageDef`, `StageWindow`, `ScreenTarget`, `StageCopyContent`)
2. `STAGES` data with windows + screen-target presets in `scroll-choreography/stages.ts`
3. `src/content/landing.ts` reshaped: `stages: readonly StageCopyContent[]` keyed by `StageId`, plus dedicated `proofCopy / finalCtaCopy / footerCopy / navItems / TEACHER_WORKSPACE_APP_URL` exports — legacy `heroCopy / productCopy / modules / proofPoints` deleted
4. SSR-safe `useIsDesktop` hook + `<ScrollChoreographyContext>` provider stub (built but not yet driving any motion)
5. `<StaticChoreographyFallback>` shell rendering `<PaperHero/> → <FeatureSection stage='feature-a'/> → <FeatureSection stage='feature-b'/> → <ProofStrip/> → <FinalCta/>` — wired into `routes/index.tsx` immediately
6. `<ProductSection>` refactored into a generic `<FeatureSection stage={featureA | featureB}/>` (renders one stage at a time)
7. `<SiteFooter>` (new) + `<SkipLink>` (new) landmarks
8. PaperHero gets a **minimal data swap only** (~5 lines): import from `stages` + `TEACHER_WORKSPACE_APP_URL`. Its `useState`-on-scroll re-render storm and magic-number `useTransform` keyframes stay until Phase 2.

Out of scope for Phase 1: any choreography motion, the orchestrator's `<ScrollChoreography>` shell body (Phase 2), the `SCREEN_TARGETS` preset → rect map (Phase 3), the Phase 4 copy rewrite, the `paper-hero.tsx` deletion (Phase 5).

</domain>

<decisions>
## Implementation Decisions

### Static Fallback Composition
- **D-01:** Static fallback reuses the existing `<PaperHero/>` (its `reduced` branch already renders illustration + product screenshot stacked) plus the existing `<ProductSection/>` (refactored), `<ProofStrip/>`, `<FinalCta/>` tree. Phase 1 does not invent a bespoke 4-section layout — the existing sections become the static path verbatim.
- **D-02:** A thin `<StaticChoreographyFallback>` shell wraps the four sections so the Phase 5 cutover is one branch: `<ScrollChoreography/>` will render `<StaticChoreographyFallback/>` on mobile/reduced-motion, choreography tree otherwise.
- **D-03:** `<StaticChoreographyFallback>` is wired into `routes/index.tsx` **immediately** in Phase 1 — no dead code. Phase 5's only edit to the route is swapping `<StaticChoreographyFallback/>` for `<ScrollChoreography/>`.
- **D-04:** New code lives at `src/components/landing/scroll-choreography/` (types.ts, stages.ts, context.tsx, use-is-desktop.ts, static-choreography-fallback.tsx, scroll-choreography.tsx — the last is a stub for Phase 2). `footer.tsx` and `skip-link.tsx` sit flat under `src/components/landing/` as siblings of the existing section components.

### Footer (CONTENT-07)
- **D-05:** Footer is intentionally minimal in v1: `© Teacher Workspace` + a single `mailto:` support link + a "Built with teachers" trust line. Privacy and Terms are **deferred** until real policies exist — fabricating policy stubs adds legal risk for an early-access marketing site. This conflicts with a literal reading of "footer with privacy / terms / support links" in Phase 1's success criterion #5; the project intent (no fabricated trust signals) overrides the literal phrasing.

### `landing.ts` Reshape (FOUND-05, FOUND-06)
- **D-06:** Replace + migrate consumers in Phase 1. Delete `heroCopy / productCopy / modules / proofPoints`. PaperHero, FeatureSection (née ProductSection), ProofStrip, FinalCta migrate to read from the new exports during Phase 1. **No two-source-of-truth window.**
- **D-07:** `StageCopyContent` is a discriminated union by `id` — strict per-stage shapes:
    ```ts
    type StageCopyContent =
      | { id: "hero";      copy: { headline: string; subline: string } }
      | { id: "wow";       copy: { caption?: string } }
      | { id: "feature-a"; copy: { kicker: string; heading: string; paragraph: string; bullets: readonly [string, string, string] } }
      | { id: "feature-b"; copy: { kicker: string; heading: string; paragraph: string; bullets: readonly [string, string, string] } }
    ```
    The exact-3-bullets tuple type enforces CONTENT-03/04 at compile time.
- **D-08:** Non-choreography content stays as dedicated top-level exports — not nested inside `stages`:
    ```ts
    export const TEACHER_WORKSPACE_APP_URL: string
    export const navItems: readonly NavItem[]
    export const stages: readonly StageCopyContent[]   // 4 items
    export const proofCopy: { heading: string; points: readonly string[] }
    export const finalCtaCopy: { headline: string; body: string; cta: string; emailPlaceholder: string }
    export const footerCopy: { copyright: string; supportEmail: string; trustLine: string }
    ```
- **D-09:** `<ProductSection>` is refactored into a generic `<FeatureSection stage={"feature-a" | "feature-b"} />`. Static fallback renders it twice (one per feature stage). Same component will drive Phase 4's copy track for choreography stages 3+4. This preserves STATIC-04 (every word and image of the choreography path reachable on the static path) without inventing a fourth section.

### `StageDef` API Shape
- **D-10:** Scroll windows are `readonly [start, end]` tuples — concise, pass straight into `useTransform` input arrays. Phase 2's keyframes resolve via `STAGES.hero.window[0]` / `[1]` so MIGRATE-03 gets zero magic numbers in component code.
- **D-11:** Screen targets are a preset enum — `type ScreenTarget = "tiny" | "centered" | "docked-left" | "docked-right"`. The preset → `{scale, x, y, opacity, clipPath?}` map (`SCREEN_TARGETS`) is **declared** in Phase 1 only as a type signature; the actual map is filled in Phase 3 when `<ProductScreen>` lands and the values can be visually verified.
- **D-12:** Phase 1 ships the `STAGES` data with overlapping windows by design (e.g., `hero: [0, 0.25]`, `wow: [0.20, 0.55]`) so neighboring stages can cross-fade. Specific window numbers are first-pass; Phase 2/3 will tune them once the orchestrator and product screen are running. Numbers in stages.ts are the contract surface for tuning, not magic constants in component code.
- **Planner concern surfaced during discussion (not yet decided):** `Record<StageId, StageDef>` loses iteration order. The planner should choose between (a) `STAGES: readonly StageDef[]` (ordered) + a `byId(id)` helper, or (b) `STAGES: Record<StageId, StageDef>` + a separate `STAGE_ORDER: readonly StageId[]` constant. Either is fine; pick one and stay consistent.

### `paper-hero.tsx` Interim Treatment
- **D-13:** Minimal data swap only in Phase 1. PaperHero's only Phase 1 edit: replace `import { heroCopy } from "@/content/landing"` with `import { stages, TEACHER_WORKSPACE_APP_URL } from "@/content/landing"` and pull `hero = stages.find((s) => s.id === "hero")!.copy`. ~5-line edit. Visuals unchanged.
- **D-14:** PaperHero's existing `useState`-on-scroll re-render storm (lines 40–54: `setStageOpacity / setScreenOpacity / setCopyOpacity` driven from `useMotionValueEvent`) and magic-number `useTransform` keyframes (lines 26–38) **stay** in Phase 1. Both are explicitly punted to Phase 2 (CHOREO-06, MIGRATE-02, MIGRATE-03, PERF-04). Add an inline code comment + CONTEXT note so reviewers don't try to fix them in Phase 1.

### Claude's Discretion
- Skip-link visual styling (treatment when focused — paper card vs flat banner): default to a sr-only-until-focused link with a paper-aesthetic focus ring. Planner can refine.
- `useIsDesktop` exact gate: research recommends optimistic-desktop default + CSS `@media (max-width: 1023px)` backstop on the choreography subtree, no `<ClientOnly>`. Adopt that unless Phase 2 proves it insufficient.
- Whether to fold `<SiteHeader>` inside `<StaticChoreographyFallback>` or keep it at the route level — planner picks based on Phase 5 cutover ergonomics.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project Spec
- `.planning/REQUIREMENTS.md` — full Phase 1 requirement set (FOUND-01..06, STATIC-01..04, CONTENT-07, A11Y-01, A11Y-03, A11Y-04, A11Y-07)
- `.planning/ROADMAP.md` §"Phase 1: Foundation — Types, Static Fallback, SSR Contract" — goal, depends-on, success criteria
- `.planning/PROJECT.md` — core value, locked stack, out-of-scope list

### Project Research (HIGH confidence)
- `.planning/research/SUMMARY.md` §"Phase 1: Foundation — Types, Static Fallback, SSR Contract" — what Phase 1 delivers, pitfalls 3/4/6 it must avoid
- `.planning/research/STACK.md` — locked stack, motion APIs to use vs avoid, Tailwind classes for sticky/lvh/svh
- `.planning/research/ARCHITECTURE.md` — `<ScrollChoreographyContext>` shape, `StageDef[]` typed sketch, `paper-hero.tsx` migration table, file paths for `scroll-choreography/`
- `.planning/research/PITFALLS.md` — pitfall #3 (SSR/`useReducedMotion`/`useScroll` 0 on first paint, motion #2452, `layoutEffect: false`), pitfall #4 (reduced-motion content unreachable), pitfall #6 (brittle keyframes)

### Codebase Maps
- `.planning/codebase/ARCHITECTURE.md` — current paper-hero pattern, layer responsibilities, anti-patterns to address
- `.planning/codebase/CONCERNS.md` — known issues including the `useState`-on-scroll re-render storm and magic-number keyframes in current paper-hero (which Phase 1 explicitly does NOT fix)
- `.planning/codebase/CONVENTIONS.md` — naming, formatting, import order, comment philosophy
- `.planning/codebase/STRUCTURE.md` — directory layout, where to add new code

### Source Files Phase 1 Touches
- `src/content/landing.ts` — full reshape (D-06 through D-09)
- `src/routes/index.tsx` — composition swap to `<StaticChoreographyFallback/>` (D-03)
- `src/routes/__root.tsx` — verify `<main>` wrapping; skip-link target id
- `src/components/landing/paper-hero.tsx` — minimal data swap only (D-13)
- `src/components/landing/product-section.tsx` — refactor into `<FeatureSection stage=...>` (D-09); rename file
- `src/components/landing/proof-strip.tsx` — migrate to `proofCopy` export
- `src/components/landing/final-cta.tsx` — migrate to `finalCtaCopy` + `TEACHER_WORKSPACE_APP_URL`
- `src/components/landing/email-capture.tsx` — verify `finalCtaCopy.emailPlaceholder` consumption
- `src/components/landing/site-header.tsx` — verify `navItems` consumption

### External Docs (cite from research)
- `motion.dev/docs/react-use-scroll` — `layoutEffect: false` (per FOUND-04 + Pitfall 3)
- `motion.dev/docs/react-accessibility` — `useReducedMotion()` returns `null` server-side
- `tanstack_start` hydration-errors guide — for the SSR contract

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **`paper-hero.tsx`'s `reduced` branch (lines 67–84, 152–168, 202–220)** — already renders the static-stacked illustration + product screenshot. Phase 1 keeps this branch intact; it IS the hero stage on the static path.
- **`useReducedMotion()` + `useRef` pattern (paper-hero.tsx:20)** — established. New `<StaticChoreographyFallback>` doesn't need to reinvent reduced-motion gating; PaperHero handles its own.
- **`<Button>` + CVA + `Slot` polymorphism (`src/components/ui/button.tsx`)** — Phase 1 reuses for footer mailto, skip-link, and CTAs. No new variants needed.
- **`cn()` utility (`src/lib/utils.ts`)** — used for all class merging.
- **Existing semantic structure** — `<h1>` already in paper-hero (`hero-title`); `<h2>`s in product/proof/final-cta; `<h3>` subheads in product-section/proof-strip. Phase 1 preserves it; the audit is "verify, don't reshape."
- **`<main className="paper-page">` wrapper in `routes/index.tsx`** — Phase 1 keeps this wrapper; the `id="main"` skip target is added to it.

### Established Patterns
- Content-as-data in `src/content/landing.ts` (data + types together) — Phase 1 keeps this pattern; types live in `scroll-choreography/types.ts`, data lives in `landing.ts` (copy) and `stages.ts` (windows + targets), with `StageId` as the join key.
- File-based TanStack routing — Phase 1 doesn't add routes (privacy/terms/support are deferred).
- Tailwind-only styling, paper design tokens (`--paper-card`, `--paper-ink`, `--paper-muted`, `--paper-rule`) — Phase 1's footer + skip-link consume these tokens; no new tokens added.
- Named exports only (no barrel files) — Phase 1's new `scroll-choreography/` files each export their own primitives directly.

### Integration Points
- `routes/index.tsx` — single point where `<StaticChoreographyFallback/>` is wired in (D-03); single point where Phase 5 will swap to `<ScrollChoreography/>`.
- `routes/__root.tsx` — head/SEO meta lives here; Phase 1 doesn't touch (Phase 4 owns SEO-01..03).
- `landing.ts` — every landing component imports from here; Phase 1 reshape is the connective change.

</code_context>

<specifics>
## Specific Ideas

- The user explicitly accepted the `Record<string, StageDef> as const satisfies` pattern (preview shown during the StageDef-window question) — that exact form is the lower bound for what stages.ts ships, modulo the Order Note in D-12.
- Window sample numbers `[0, 0.25] / [0.20, 0.55] / [0.50, 0.78] / [0.75, 1.0]` (visible in the user-accepted preview) are first-pass and explicitly tunable in Phase 2/3; do NOT treat them as locked.
- The user's working tree has uncommitted edits to `email-capture.tsx`, `final-cta.tsx`, `paper-hero.tsx`, `product-section.tsx`, `proof-strip.tsx`, `landing.ts`, `routes/index.tsx`, `styles.css`, plus a deletion of `product-interface-frame.tsx`. **The planner must surface these uncommitted changes to the user** before Phase 1 commits land — they may be in-flight work that should ship with Phase 1, or stale work that should be reverted. The CONTEXT.md decisions above were grounded against the on-disk versions.

</specifics>

<deferred>
## Deferred Ideas

- **Privacy + Terms policy pages.** Out of v1 footer until real policies exist. When written, add `/privacy` + `/terms` TanStack routes and wire footer links. Tracked here so we don't lose the obligation.
- **Bespoke 4-section `<StaticChoreographyFallback>` reading directly from `stages: StageDef[]`.** Considered (option B in the static-fallback question) and deferred — the existing-sections reuse is faster and ships a known-good static path. Revisit only if v1 mobile/reduced-motion path is found wanting after ship.
- **`useState`-on-scroll re-render storm + magic-number keyframes inside `paper-hero.tsx`.** Phase 2 (MIGRATE-02, MIGRATE-03, PERF-04, CHOREO-06). Phase 1 explicitly leaves these in place.
- **`SCREEN_TARGETS` preset → rect map values.** Phase 3 — values designed against the actual product-screen render, not pre-tuned.
- **Stage 25%/50%/75% midstate handling (VISUAL-04).** Phase 3 — the StageDef shape does not pre-bake midstate hooks; Phase 3 decides whether to add them or to design midstates by tweaking endpoints.
- **Per-stage easing curves.** Phase 2/3 — not a Phase 1 type concern.
- **Real teacher testimonial in proof strip.** Project-level; `proofCopy.heading` carries soft trust line "Built with teachers" until a permissioned testimonial exists (PROOF-V2-01..02 in REQUIREMENTS.md).

</deferred>

---

*Phase: 1-Foundation — Types, Static Fallback, SSR Contract*
*Context gathered: 2026-04-28*
