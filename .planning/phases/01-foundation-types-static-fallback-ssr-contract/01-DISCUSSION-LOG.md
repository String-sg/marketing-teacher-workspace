# Phase 1: Foundation — Types, Static Fallback, SSR Contract - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-28
**Phase:** 1 — Foundation — Types, Static Fallback, SSR Contract
**Areas discussed:** Static fallback composition, landing.ts reshape strategy, StageDef API shape, paper-hero.tsx interim treatment

---

## Static Fallback Composition

### Q1: What does a mobile / reduced-motion / JS-off visitor actually see for v1?

| Option | Description | Selected |
|--------|-------------|----------|
| Reuse existing sections | Keep `<PaperHero/>` (`reduced` branch) + `<ProductSection/>` + `<ProofStrip/>` + `<FinalCta/>`. Phase 1 adds skip-link, footer, landmarks. Lowest risk; one source of truth. | ✓ |
| Four stage-end-state `<section>`s | Bespoke `<StaticChoreographyFallback>` rendering four stacked sections matching choreography end-states. Same content tree as choreography. | |
| Long-form narrative read-down | Bespoke layout reading like a story / blog post. Doubles design work; risks visual drift between paths. | |

**User's choice:** Reuse existing sections.

---

### Q2: Where does the static-fallback shell live so Phase 5's cutover is clean?

| Option | Description | Selected |
|--------|-------------|----------|
| No shell — route composes directly | `routes/index.tsx` keeps direct children; Phase 5 swaps `<PaperHero/>` for `<ScrollChoreography/>`. | |
| Thin `<StaticChoreographyFallback>` shell | New component wrapping the existing tree. Phase 5: `<ScrollChoreography/>` branches between fallback and choreography tree. | ✓ |
| Full `<StaticChoreographyFallback>` rendering 4 stages | Build the 4-section reader now. Higher fidelity to research; doubles Phase 1 work. | |

**User's choice:** Thin shell.

---

### Q3: What do the footer privacy / terms / support links actually point to in v1?

| Option | Description | Selected |
|--------|-------------|----------|
| Minimal: mailto support + © only | `© Teacher Workspace` + mailto support + "Built with teachers". Privacy/Terms deferred until policies exist. | ✓ |
| Internal stub routes (/privacy /terms /support) | Create stub TanStack routes with placeholder copy. | |
| External policy URLs | Link out to existing policy docs (Notion / hosted PDF). Requires they exist today. | |
| All mailto: for now | Support / privacy / terms all `mailto:` the same address. | |

**User's choice:** Minimal — defer privacy/terms.

---

### Q4: Where do the new Phase 1 files physically live?

| Option | Description | Selected |
|--------|-------------|----------|
| `src/components/landing/scroll-choreography/` | All choreography internals in one new dir; footer + skip-link flat under `landing/`. | ✓ |
| Split: choreography internals nested, fallback flat | `<StaticChoreographyFallback>` lives flat next to existing sections. | |
| Flat — keep everything in `landing/` | No subdir; defer until Phase 2 lands the orchestrator. | |

**User's choice:** Nested `scroll-choreography/` for internals.

---

## landing.ts Reshape Strategy

### Q1: How does Phase 1 reshape landing.ts?

| Option | Description | Selected |
|--------|-------------|----------|
| Skeleton + leave existing intact | Add stages skeleton; keep heroCopy/productCopy/etc. Phase 4 deletes legacy. Two sources of truth for ~3 phases. | |
| Replace + migrate consumers now | Delete legacy exports. Build stages keyed by StageId. Migrate every component in Phase 1. End state clean. | ✓ |
| Hybrid: stages canonical, legacy as aliases | stages is source of truth; legacy exports become derived aliases. Adds indirection. | |

**User's choice:** Replace + migrate consumers now.

**Notes:** Bigger Phase 1 surface area accepted in exchange for a clean end state and no two-source-of-truth window.

---

### Q2: How is StageCopyContent typed?

| Option | Description | Selected |
|--------|-------------|----------|
| Discriminated union by id | Per-stage strict shapes; exact-3-bullets tuple enforces CONTENT-03/04 at compile time. | ✓ |
| Loose superset — one shape with optionals | Single interface with all fields optional; consumers do optional-chaining. | |
| Generic with per-id type lookup | Mapped type accessed via `stages.byId("hero")`. Overkill for 4 stages. | |

**User's choice:** Discriminated union.

---

### Q3: What about non-choreography sections (ProofStrip, FinalCta, footer, navItems)?

| Option | Description | Selected |
|--------|-------------|----------|
| Dedicated top-level exports | `stages` for choreography; separate `proofCopy / finalCtaCopy / footerCopy / navItems` exports. | ✓ |
| Single `landing` object with everything nested | One import, nested access. | |
| Split into multiple files | `src/content/{stages,proof,final-cta,nav,footer}.ts`; landing.ts becomes a barrel. | |

**User's choice:** Dedicated top-level exports.

---

### Q4: How do feature-a and feature-b stages render in the existing-sections static fallback?

| Option | Description | Selected |
|--------|-------------|----------|
| Split ProductSection into reusable FeatureSection | `<FeatureSection stage='feature-a'/>` + `<FeatureSection stage='feature-b'/>`. Same component drives Phase 4 choreography copy track. | ✓ |
| ProductSection renders both stages stacked | One component iterates over both feature stages. | |
| Two separate components (FeatureA + FeatureB) | Distinct components per stage. More files. | |
| Keep ProductSection as-is; defer feature-b copy to Phase 4 | Static path missing feature-b content. Violates STATIC-04. | |

**User's choice:** Split into FeatureSection.

---

## StageDef API Shape

### Q1: How is each stage's scroll-progress window declared?

| Option | Description | Selected |
|--------|-------------|----------|
| Tuple `[start, end]` | `readonly [number, number]`. Concise; passes straight into useTransform. STAGES.hero.window etc. — zero magic numbers (MIGRATE-03). | ✓ |
| Named object `{ start, end }` | Self-documenting; consumers spread into useTransform's tuple form. | |
| Auto-derived from stage order | `[i/N, (i+1)/N]`. Eliminates manual numbers but couples narrative pacing to even spacing. | |

**User's choice:** Tuple.

---

### Q2: How is each stage's product-screen target declared?

| Option | Description | Selected |
|--------|-------------|----------|
| Preset enum + lookup map | `screen: "tiny" \| "centered" \| "docked-left" \| "docked-right"`. Map fills in Phase 3. | ✓ |
| Inline rect coords on each StageDef | `screen: { scale, x, y, opacity, clipPath? }` declared per stage. Most explicit; harder to ensure consistency. | |
| Preset + per-stage overrides | Preset name plus optional override object. Speculative until Phase 3. | |

**User's choice:** Preset enum + lookup map. Phase 1 declares the type only; Phase 3 fills the SCREEN_TARGETS map.

---

## paper-hero.tsx Interim Treatment

### Q1: PaperHero currently imports heroCopy directly. What's its Phase 1 fate?

| Option | Description | Selected |
|--------|-------------|----------|
| Minimal data swap | ~5-line edit. Read from `stages` + `TEACHER_WORKSPACE_APP_URL`. useState storm + magic-number keyframes stay until Phase 2. | ✓ |
| Data swap + pay down useState debt | Phase 1 also converts useState-driven opacity to useTransform. Closes PERF-04 + CHOREO-06 inside paper-hero. Bigger Phase 1; risks regression. | |
| Data swap only; flag debts as known | Same as Minimal but with explicit code comment + CONTEXT note. | |
| Defer migration — leave PaperHero on legacy alias | Conflicts with the "Replace + migrate" decision. | |

**User's choice:** Minimal data swap. (Effectively combined with "flag debts as known" — see CONTEXT.md D-14.)

---

### Q2: Does Phase 1 wire `<StaticChoreographyFallback/>` into routes/index.tsx, or leave the route untouched until Phase 5?

| Option | Description | Selected |
|--------|-------------|----------|
| Wire now — fallback renders in Phase 1 | routes/index.tsx renders `<StaticChoreographyFallback/>`. No dead code. Phase 5: one-element swap to `<ScrollChoreography/>`. | ✓ |
| Leave route alone — wire fallback in Phase 5 | Route keeps current direct-children composition. Shell unused until cutover. | |
| Wire now AND collapse `<main>` wrapper | Move main/skip-link/footer landmarks inside fallback. More moving pieces. | |

**User's choice:** Wire now.

---

## Claude's Discretion

- Skip-link visual styling (focus treatment) — sr-only-until-focused with paper-aesthetic focus ring; planner can refine.
- `useIsDesktop` exact gate strategy — adopt research recommendation (optimistic-desktop default + CSS `@media (max-width: 1023px)` backstop, no `<ClientOnly>`) unless Phase 2 proves it insufficient.
- Whether `<SiteHeader>` lives inside `<StaticChoreographyFallback>` or at the route level — planner picks based on Phase 5 cutover ergonomics.
- `STAGES` data structure ordering: `Record<StageId, StageDef>` + `STAGE_ORDER: readonly StageId[]` constant **vs** `readonly StageDef[]` + `byId()` helper. Planner picks.

## Deferred Ideas

- Privacy + Terms policy pages — bring back to footer when real policies exist.
- Bespoke 4-section `<StaticChoreographyFallback>` reading from `stages: StageDef[]` directly — only if existing-sections reuse falls short post-ship.
- `useState`-on-scroll re-render storm + magic-number keyframes in `paper-hero.tsx` — Phase 2 fix (MIGRATE-02, MIGRATE-03, PERF-04, CHOREO-06).
- `SCREEN_TARGETS` preset → rect map values — Phase 3.
- 25%/50%/75% midstate handling (VISUAL-04) — Phase 3.
- Per-stage easing curves — Phase 2/3.
- Real teacher testimonial in proof strip — project-level (PROOF-V2-01..02).
