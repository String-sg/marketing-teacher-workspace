# Phase 2: Orchestrator Shell + Backdrop Migration - Context

**Gathered:** 2026-04-29
**Status:** Ready for planning

<domain>
## Phase Boundary

A single `<ScrollChoreography>` owns the tall sticky shell and the master `useScroll`, with `<PaperBackdrop>` (illustration + scroll-linked video + cloud parallax) extracted cleanly from `paper-hero.tsx`. The two known debts (`useState`-on-scroll storm, magic-number `useTransform` keyframes) are paid down on the way through. A minimal `<ProductScreen>` stub ships so SC #1 ("a single shared product-screen `motion.div` that never unmounts") can be verified in production at end of Phase 2.

Concretely, Phase 2 produces:

1. `<ScrollChoreography>` body filled in (replaces the Phase 1 `return null` stub) — calls `useIsDesktop()` + `useReducedMotion()`, computes `mode`, calls `useScroll({ target, offset, layoutEffect: false })`, provides `ScrollChoreographyContext` with the real `scrollYProgress`. In static mode, early-returns `<StaticChoreographyFallback/>`. Owns the tall outer container (`lvh`-based) and inner sticky container (`svh`-based).
2. `<PaperBackdrop>` (new, at `src/components/landing/scroll-choreography/paper-backdrop.tsx`) carries the paper-card stage frame + `stageScale` + clouds (`cloudYLeft`/`cloudYRight`) + illustration/video + `loadedmetadata` effect + the scroll-driven video gating logic. Subscribes to `scrollYProgress` via `useScrollChoreography()`. Accepts `children` so the orchestrator can pass hero copy through to nest inside the paper-card frame (preserves current "hero copy scales with stage" behavior).
3. `<ProductScreen>` Phase-2 stub (new, at `src/components/landing/scroll-choreography/product-screen.tsx`) — a port of paper-hero.tsx:196–220 (browser-frame chrome + `profiles-screen.png` + `screenScale` + `screenOpacity`). Subscribes via context. Phase 3 expands to all 4 stage targets (docked-left, docked-right) and adds the responsive `srcset` + LCP preload.
4. Hero copy renders inline in `<ScrollChoreography>`'s sticky container, passed as `children` into `<PaperBackdrop>` so it nests inside the paper-card frame and scales together with the stage. Phase 4 later refactors it into `<StageCopy id="hero">` (or similar) without changing visuals.
5. **`useState`-on-scroll storm eliminated (MIGRATE-02, CHOREO-06):** every visual property that was driven by `setStageOpacity` / `setScreenOpacity` / `setCopyOpacity` becomes a `useTransform`-derived `MotionValue<number>` consumed via `style={{ … : motionValue }}`. The pattern matches Phase 1 RESEARCH.md PITFALLS #12.
6. **Magic-number keyframes paid down (MIGRATE-03):** stage-aligned keyframes (transition endpoints, midpoints) reference `STAGES[i].window[j]` or `byId('stage').window[j]`. Intra-stage timing values (e.g., `0.14` for the copyY mid-point) live as named local constants in PaperBackdrop (`HERO_COPY_LIFT_PROGRESS = 0.14`) — satisfies "zero inline magic-number tuples" without bloating `StageDef`.
7. **STAGES windows retuned (extending Phase 1 D-12's "first-pass, tunable in Phase 2" license):** `STAGES.wow.window[1]` is retuned to align with the moment the screen visually covers the video (first-pass: `wow.window: [0.20, 0.78]`, `feature-a.window: [0.75, …]` updated to overlap). This makes the CHOREO-08 video gate threshold = `STAGES.wow.window[1]` — single source of truth in `stages.ts`.
8. **`routes/index.tsx` swapped from `<StaticChoreographyFallback>` → `<ScrollChoreography>` in Phase 2** (revising Phase 1 D-03). The orchestrator branches mode internally; static-mode users still reach the same `<StaticChoreographyFallback>` tree (which still uses `<PaperHero/>` for its Stage 1 rendering — Phase 5 owns that refactor).
9. **CHOREO-08 video gate (in `<PaperBackdrop>`):** subscribes to `scrollYProgress` via `useMotionValueEvent`. When `p >= STAGES.wow.window[1]`, skips `currentTime` write and calls `video.pause()` (defensive — idempotent on the muted, non-autoplay scrub video). When `p` drops below threshold, resumes `currentTime` writes (scrub re-engages).
10. **`MIGRATE-04` site-header stacking-context regression check** — verify (don't redesign): SiteHeader is already a sibling of `<main>` at the route level (Phase 1 D-16) and renders OUTSIDE the choreography subtree, so it naturally stacks above. Add a smoke test asserting `<header>` is reachable above the choreography tree at every scroll position.

Out of scope for Phase 2: full `<ProductScreen>` with all 4 stage targets (Phase 3); responsive `srcset` + LCP preload (Phase 3 — VISUAL-03); `SCREEN_TARGETS` runtime values (Phase 3 — values designed against the actual product-screen render); `<StageCopyTrack/>` and per-stage copy fades for wow/feature-a/feature-b (Phase 4); `<StaticChoreographyFallback>` refactor away from `<PaperHero/>` (Phase 5); `paper-hero.tsx` deletion (Phase 5).

</domain>

<decisions>
## Implementation Decisions

### Routes Wiring & Mode Switch (revising Phase 1 D-03)

- **D-01:** `routes/index.tsx` swaps `<StaticChoreographyFallback/>` → `<ScrollChoreography/>` in Phase 2. The orchestrator internally renders `<StaticChoreographyFallback/>` when `mode === "static"` (mobile or reduced-motion), and the choreography tree otherwise. This resolves the conflict between Phase 1 D-03 ("Phase 5's only edit to the route is the swap") and Phase 2 SC #1 ("on the desktop landing"). Phase 5's route-level edit collapses to: optionally tightening the import path and removing the now-unused `<StaticChoreographyFallback/>` direct import from `routes/index.tsx`. **Phase 1 D-03 is hereby revised by Phase 2.**

- **D-02:** `<ScrollChoreography>` calls `useIsDesktop()` + `useReducedMotion()` inline at the top, computes `mode = (isDesktop && !prefersReducedMotion) ? "choreography" : "static"`, and early-returns `<StaticChoreographyFallback/>` when static. `useScroll({ target, offset, layoutEffect: false })` only runs in the choreography branch (target ref is mounted). The existing `ScrollChoreographyContext` `mode` field becomes a real value rather than the hardcoded `"static"` Phase-1 stub.

- **D-03:** Phase 2 does NOT touch `<StaticChoreographyFallback/>`. It still renders `<PaperHero/>` for its Stage 1 rendering. Phase 5's `MIGRATE-05` task does both (a) replaces `<PaperHero/>` in `<StaticChoreographyFallback/>` with an inlined static rendering of `<PaperBackdrop/>`'s reduced branch (or a small `<HeroStageStatic/>`), THEN (b) deletes `paper-hero.tsx`. Keeps Phase 2 scope tight; the static-side refactor is part of the cutover anyway.

### `<PaperBackdrop/>` Component Contract

- **D-04:** `<PaperBackdrop/>` lives at `src/components/landing/scroll-choreography/paper-backdrop.tsx` (per Phase 1 D-04 — all new choreography code under `scroll-choreography/`).

- **D-05:** `<PaperBackdrop/>` consumes `scrollYProgress` via `useScrollChoreography()` (matches research/ARCHITECTURE.md "pure presentational subscribers" pattern). It calls its own `useTransform` for `stageScale`, `cloudYLeft`, `cloudYRight`, plus a `useMotionValueEvent` for the imperative video gate. Phase 3 `<ProductScreen/>` and Phase 4 `<StageCopy/>` follow the same context-subscribing API — zero variance across choreography children.

- **D-06:** `<PaperBackdrop/>` renders the paper-card stage frame (with `stageScale` + `transformOrigin: "50% 92%"`) + clouds + illustration/video. It **accepts a `children` prop** that nests inside the paper-card frame. The orchestrator passes the hero copy block as `children`, so hero copy continues to scale together with the stage exactly as today (storytelling preserved 1:1: hero copy is "in the paper world"). PaperBackdrop is purely visual; it does NOT carry hero text directly.

- **D-07:** Hero copy (h1 + subline `<p>` + CTA `<Button>`) renders **inline in `<ScrollChoreography/>`'s body**, with its own `useTransform`-driven `copyOpacity` + `copyY` reading from the master `scrollYProgress`. Phase 4 later refactors it into `<StageCopy id="hero">` (or `<StageCopyTrack/>` per research) without changing visuals — a rename + parameterize, not a structural change.

### `<ProductScreen/>` Phase-2 Stub Scope

- **D-08:** `<ProductScreen/>` lives at `src/components/landing/scroll-choreography/product-screen.tsx`. Phase 2 ports paper-hero.tsx:196–220 verbatim (browser-frame chrome + `profiles-screen.png` + `screenScale` + `screenOpacity`) into this file. Renders as a sibling of `<PaperBackdrop/>` inside the orchestrator's sticky container, absolute-positioned at `inset-0 z-20` (current paper-hero.tsx pattern). Subscribes to `scrollYProgress` via `useScrollChoreography()` (D-05 pattern).

- **D-09:** Phase 2's `<ProductScreen/>` only animates the **hero → wow** transition (the existing `screenScale` + `screenOpacity` ramps). It does NOT dock to feature-a or feature-b. Phase 3 expands `<ProductScreen/>` to all 4 stage targets via stitched `useTransform` and adds the docking transforms (x, y, layout-origin shifts).

- **D-10:** `screenOpacity` becomes a `useTransform`-derived `MotionValue<number>` (replacing the Phase 1 `useState`+`useMotionValueEvent` pattern in paper-hero.tsx) — directly consumed via `style={{ opacity: screenOpacity }}`. Same migration applies to `stageOpacity` and `copyOpacity`. This is the MIGRATE-02 / CHOREO-06 fix.

- **D-11:** `SCREEN_TARGETS` stays as a **type alias only** (Phase 1 D-11 / Phase 1 verification). Phase 2 does NOT promote it to runtime. `<ProductScreen/>` hardcodes its `screenScale` + `screenOpacity` `useTransform` calls inline (using `STAGES[i].window[j]` for stage-aligned endpoints per the endpoint-only MIGRATE-03 binding). Phase 3 lands `SCREEN_TARGETS` runtime values for all 4 targets and re-derives `<ProductScreen/>`'s transforms from the map.

### MIGRATE-03 Keyframe Resolution (Endpoint-Only Binding)

- **D-12:** Stage-aligned keyframes (transition endpoints, transition midpoints between stage windows) reference `STAGES[i].window[j]` or `byId("stage").window[j]` directly — no helper module needed. Example: `useTransform(p, [byId("hero").window[0], byId("wow").window[1]], [...])`.

- **D-13:** Intra-stage timing values (e.g., the `0.14` mid-point of copyY's `[0, 0.14, 1]` keyframe array) live as **named local constants** in the component file:
  ```ts
  // PaperBackdrop.tsx
  const HERO_COPY_LIFT_PROGRESS = 0.14
  const STAGE_SCALE_MID = 0.6
  ```
  Satisfies "zero inline magic-number tuples in component code" (Phase 2 SC #5) without bloating `StageDef` or forcing all timing into `STAGES`.

- **D-14:** `STAGES` windows are **retuned in Phase 2** (extending Phase 1 D-12's "first-pass, tunable in Phase 2" license). Specifically: `wow.window[1]` becomes the moment the screen visually covers the video (first-pass target: `wow.window: [0.20, 0.78]`; `feature-a.window` adjusts to overlap). The exact retuning happens during planning/execution against visual review. **No magic numbers in component code; the data is in `stages.ts`.**

### CHOREO-08 Video Gate

- **D-15:** Gate logic lives **inside `<PaperBackdrop/>`** — colocates with the video element + `videoRef` + `loadedmetadata` effect (already a PaperBackdrop concern per D-06). Subscribes to `scrollYProgress` via `useScrollChoreography()`, uses `useMotionValueEvent` for the imperative gate. **`useMotionValueEvent` for imperative DOM side effects is consistent with CHOREO-06** — the rule is "no `useState` driven from `useMotionValueEvent` for *visual properties*"; setting `video.currentTime` is not a visual prop.

- **D-16:** Gate threshold = `STAGES.wow.window[1]` (whatever value Phase 2 retunes to per D-14). When `p >= STAGES.wow.window[1]`: skip `currentTime` write AND call `video.pause()` (defensive — idempotent on the muted non-autoplay scrub video). When `p` drops back below threshold: resume `currentTime` writes (scrub re-engages). No hysteresis / debounce — rapid scroll IS the expected user behavior in a scrub.

- **D-17:** The `loadedmetadata` effect (current paper-hero.tsx:85–95) moves into `<PaperBackdrop/>` with the same `[reduced]` dependency semantics — though in PaperBackdrop's world `reduced` doesn't exist (PaperBackdrop is only rendered in choreography mode), so the effect's dep array becomes `[]` (mount/unmount only). The effect attaches a `loadedmetadata` listener to the `videoRef`; sets `videoDurationRef.current = video.duration || 0`.

### Stacking & Stickying (CHOREO-07, MIGRATE-04)

- **D-18:** Outer tall container uses `lvh` (`h-[280lvh]` first-pass — exact value tunable). Inner sticky container uses `svh` (`h-svh`). Per Phase 1 RESEARCH.md PITFALL #5 (iOS Safari address-bar). No `vh` units anywhere on the choreography subtree.

- **D-19:** SiteHeader (already a sibling of `<main>` at the route level — Phase 1 D-16) renders OUTSIDE the choreography subtree and naturally stacks above. Phase 2 adds a smoke test asserting `<header>` is reachable / clickable above the morph layer at every scroll position. **No header redesign or z-index reshuffle in Phase 2** — verification, not modification.

### `useScroll` Configuration

- **D-20:** `useScroll({ target: sectionRef, offset: ["start start", "end end"], layoutEffect: false })` — `layoutEffect: false` is the Phase 1 FOUND-04 contract encoded in the load-bearing comment. Same `target` + `offset` shape as current paper-hero.tsx. No `container` parameter (default = window scroll).

### Testing Strategy

- **D-21:** Phase 2 ships unit tests for the orchestrator's mode switch (4 cases: desktop+motion, desktop+reduced-motion, mobile+motion, mobile+reduced-motion → expect choreography vs static branch). Plus a "never unmounts" assertion for the `<ProductScreen/>` motion.div via mount-counter / key-stability test (CHOREO-01 verification). The CHOREO-06 / SC #2 "0–2 re-renders per second of continuous scroll" check happens via the React DevTools Profiler smoke during a checkpoint:human-verify gate (planner schedules it).

### Claude's Discretion

- The exact retuned values for `STAGES.wow.window` (and any cascading adjustments to `feature-a.window` to maintain overlap) — first-pass `[0.20, 0.78]` is a starting point. Planner / executor can adjust during visual review.
- File naming: whether to introduce a `<BackdropVideo/>` child of `<PaperBackdrop/>` or keep video element inline — default to inline unless PaperBackdrop grows past ~200 lines.
- Test file organization (one `paper-backdrop.test.tsx` vs split per concern) — follow Phase 1 conventions (one test file per source file).
- Whether to add a `.scroll-choreography-only` class to the choreography subtree as defense-in-depth alongside the JS branch (Phase 1 styles.css:226–230 already has the rule waiting for a consumer — IN-04 in Phase 1 REVIEW). Recommended: yes, add the class to the orchestrator's tall outer container.
- Exact debounce/hysteresis behavior on the video gate if rapid pause/play during scrub turns out to thrash in practice — first-pass: no hysteresis; revisit only if Profiler / DevTools shows a problem.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project Spec
- `.planning/REQUIREMENTS.md` — full Phase 2 requirement set (CHOREO-01, CHOREO-02, CHOREO-06, CHOREO-07, CHOREO-08, MIGRATE-01, MIGRATE-02, MIGRATE-03, MIGRATE-04, PERF-04)
- `.planning/ROADMAP.md` §"Phase 2: Orchestrator Shell + Backdrop Migration" — goal, depends-on, 5 success criteria
- `.planning/PROJECT.md` — core value (the choreography is THE storytelling element), locked stack, mobile static-fallback constraint

### Project Research (HIGH confidence)
- `.planning/research/SUMMARY.md` §"Phase 2: Orchestrator Shell + Backdrop Migration" — what Phase 2 delivers, pitfalls 1/2/5/11/12 it must avoid, "split, not deleted" hint for paper-hero.tsx
- `.planning/research/ARCHITECTURE.md` §"System Overview", §"Component Responsibilities" — orchestrator pattern, paper-hero.tsx migration table, "pure presentational subscribers" pattern, recommended `scroll-choreography/` file paths
- `.planning/research/STACK.md` — `useScroll` `layoutEffect: false`, `useTransform` direct-into-style, `useMotionValueEvent` for imperative side effects (NOT visual properties)
- `.planning/research/PITFALLS.md` — #1 (`useScroll` 0 on first paint, motion #2452, `layoutEffect: false`), #2 (sticky parent transforms break stacking context), #5 (iOS Safari `vh` jank → `lvh`/`svh` + `min-width: 1024px` gate), #11 (HMR/remount scroll reset — verified post-deploy in Phase 5), #12 (`useState` re-render storm)

### Phase 1 Carry-Forward (LOCKED)
- `.planning/phases/01-foundation-types-static-fallback-ssr-contract/01-CONTEXT.md` — D-04 (file paths under `scroll-choreography/`), D-12 (STAGES first-pass + retuneable in Phase 2), D-13 (paper-hero.tsx data-swap-only Phase 1 treatment), D-14 (PHASE-2-DEBT explicitly punted), D-16/D-17 (SiteHeader + SiteFooter mounted at route level as siblings of `<main>`)
- `.planning/phases/01-foundation-types-static-fallback-ssr-contract/01-RESEARCH.md` §"useScroll({ layoutEffect: false }) — production-build correctness fix" — Phase 2 fills the contract Phase 1 encoded as a load-bearing comment
- `.planning/phases/01-foundation-types-static-fallback-ssr-contract/01-VERIFICATION.md` — confirms which artifacts Phase 1 shipped (and which are intentional stubs Phase 2 must replace)

### Codebase Maps
- `.planning/codebase/ARCHITECTURE.md` — current paper-hero pattern + scroll-choreography boundary, anti-patterns (`useState`-on-scroll, magic-number keyframes — both Phase 2 fixes them)
- `.planning/codebase/CONCERNS.md` — known issues including the two debts Phase 2 pays down
- `.planning/codebase/CONVENTIONS.md` — kebab-case files, named exports, no barrel files, `@/` alias, comment philosophy
- `.planning/codebase/STRUCTURE.md` — directory layout (already established `scroll-choreography/` from Phase 1)
- `.planning/codebase/TESTING.md` — test conventions (vitest + jsdom + matchMedia shim from Phase 1)

### Source Files Phase 2 Touches (or creates)
- `src/components/landing/paper-hero.tsx` — **read-only reference**: source of `<PaperBackdrop/>` extraction (lines 112–194 paper-card frame + clouds + video; lines 196–220 screen overlay → `<ProductScreen/>`); paper-hero.tsx itself stays in place this phase (Phase 5 deletes it)
- `src/components/landing/scroll-choreography/scroll-choreography.tsx` — fill in body (replaces Phase 1 `return null`); add `useScroll`, mode switch, context provider wiring
- `src/components/landing/scroll-choreography/paper-backdrop.tsx` — **NEW** (paper-card frame + clouds + illustration/video + video gate)
- `src/components/landing/scroll-choreography/product-screen.tsx` — **NEW** Phase-2 stub (port of paper-hero.tsx:196–220)
- `src/components/landing/scroll-choreography/context.tsx` — `defaultContextValue` may need adjustment (the Phase 1 `motionValue(0)` stub is replaced by ScrollChoreography's real `useScroll` value at provider mount; default still needed for non-provider consumers — keep stub)
- `src/components/landing/scroll-choreography/stages.ts` — retune `STAGES.wow.window[1]` (and any cascading overlap adjustments) per D-14
- `src/routes/index.tsx` — swap `<StaticChoreographyFallback/>` → `<ScrollChoreography/>` (D-01)
- `src/styles.css` — add `.scroll-choreography-only` consumer (the orchestrator's tall outer container) per Claude's-discretion note

### Tests Phase 2 Adds (mirroring Phase 1 testing pattern)
- `src/components/landing/scroll-choreography/scroll-choreography.test.tsx` — mode-switch (4 cases), `useScroll` `layoutEffect: false` assertion (call signature)
- `src/components/landing/scroll-choreography/paper-backdrop.test.tsx` — context subscription, video gate threshold cross (mock `scrollYProgress`), `loadedmetadata` effect lifecycle
- `src/components/landing/scroll-choreography/product-screen.test.tsx` — never-unmounts mount-counter, motion-value `useTransform` shape (no `useState` for visual properties)

### External Docs (cite from Phase 1 + research)
- `motion.dev/docs/react-use-scroll` — `layoutEffect: false` (FOUND-04 / Pitfall 1)
- `motion.dev/docs/react-use-motion-value-event` — `useMotionValueEvent` for imperative side effects (D-15 video gate)
- `motion.dev/docs/react-accessibility` — `useReducedMotion()` (mode switch in `<ScrollChoreography/>`)
- motion GitHub issue #2452 — production-build first-paint flicker (FOUND-04 carry-forward; verify in Phase 2 via `pnpm preview`)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **`paper-hero.tsx` (current, read-only this phase)** — source of truth for the visual extraction. Lines 27–40 (`useScroll` config), lines 50–62 (`useTransform` calls — to be ported with magic numbers replaced), lines 64–78 (the `useState`+`useMotionValueEvent` block — to be eliminated in Phase 2), lines 85–95 (`loadedmetadata` effect — moves into PaperBackdrop), lines 112–194 (paper-card frame body — becomes PaperBackdrop), lines 196–220 (screen overlay — becomes ProductScreen stub).
- **`useIsDesktop()` (Phase 1 — `scroll-choreography/use-is-desktop.ts`)** — wired into `<ScrollChoreography/>`'s mode computation; matches the way PaperHero already gates its `reduced` flag (paper-hero.tsx:31, 36).
- **`ScrollChoreographyContext` + `useScrollChoreography()` (Phase 1 — `scroll-choreography/context.tsx`)** — Phase 2 mounts a real provider in `<ScrollChoreography/>` whose `value.scrollYProgress` is the live `useScroll().scrollYProgress`. The Phase 1 `motionValue(0)` `defaultContextValue` stays as-is (used when consumers render outside a provider — defensive default).
- **`STAGES` + `byId()` (Phase 1 — `scroll-choreography/stages.ts`)** — Phase 2 references `STAGES[i].window[j]` / `byId("stage").window[j]` for stage-aligned keyframe endpoints (MIGRATE-03 endpoint-only binding). Phase 2 also retunes some window values (D-14 — extending Phase 1 D-12).
- **`<StaticChoreographyFallback/>` (Phase 1 — `scroll-choreography/static-choreography-fallback.tsx`)** — `<ScrollChoreography/>` early-returns this in static mode. Unchanged this phase. Still imports `<PaperHero/>` for Stage 1 (Phase 5's MIGRATE-05 owns the refactor).
- **`<Button>` polymorphism via Slot (`src/components/ui/button.tsx`)** — hero CTA inside the choreography path uses the same pattern as today (`<Button asChild><a href={TEACHER_WORKSPACE_APP_URL}>{finalCtaCopy.cta}</a></Button>`). No new variants.
- **`cn()` utility (`src/lib/utils.ts`)** — used for class merging in all new components.
- **vitest + jsdom + matchMedia shim (Phase 1)** — Phase 2 reuses; no new test infrastructure needed.
- **CSS gate `.scroll-choreography-only { display: none }` at `@media (max-width: 1023px)` (Phase 1 styles.css:226–230)** — was unused in Phase 1 (IN-04 in Phase 1 REVIEW); Phase 2 tags the orchestrator's tall outer container with this class as defense-in-depth alongside the JS branch.

### Established Patterns
- **"Pure presentational subscribers" (research/ARCHITECTURE.md)** — every choreography child consumes `scrollYProgress` via `useScrollChoreography()`. PaperBackdrop, ProductScreen, and (Phase 4) StageCopy all follow this single shape.
- **Hooks at top, `useTransform` direct into `style` (Phase 1 RESEARCH.md PITFALLS #12)** — no `useState` for visual properties. Imperative side effects (e.g., `video.currentTime`, `video.pause()`) via `useMotionValueEvent`.
- **Endpoint-only MIGRATE-03 binding** — stage-aligned keyframes use `STAGES[i].window[j]` or `byId("…").window[j]`. Intra-stage timing uses named local constants in the component file.
- **`lvh` outer + `svh` inner** for sticky-scroll containers (Phase 1 RESEARCH.md PITFALL #5).
- **Discriminated-union types + `as const satisfies`** (Phase 1 D-07, D-12). Phase 2 doesn't add types but consumes them.
- **Named exports only, no barrel files, `@/` alias** (Phase 1 D-04).
- **One vitest file per source file** (Phase 1 testing convention).

### Integration Points
- **`routes/index.tsx`** — single line swap `<StaticChoreographyFallback/>` → `<ScrollChoreography/>` (D-01). Phase 2's only edit to `routes/`.
- **`scroll-choreography/context.tsx`** — Phase 2 mounts a real provider inside `<ScrollChoreography/>`; the existing default-value module-singleton stays as a fallback for consumers outside a provider.
- **`scroll-choreography/scroll-choreography.tsx`** — body fill replaces the Phase 1 `return null` stub. The load-bearing `PHASE-2 REQUIREMENT (FOUND-04): layoutEffect: false` comment (lines 6–13) becomes verified by an actual `useScroll({ layoutEffect: false })` call.
- **`scroll-choreography/stages.ts`** — `STAGES.wow.window` retune; `byId` already in place. `SCREEN_TARGETS` stays type-only.
- **`scroll-choreography/static-choreography-fallback.tsx`** — Phase 2 doesn't touch. Phase 5 owns the PaperHero-removal refactor.

</code_context>

<specifics>
## Specific Ideas

- **The `[reduced]` dep on the `loadedmetadata` effect (paper-hero.tsx:85, fix WR-06 from Phase 1) is preserved by construction in PaperBackdrop** — PaperBackdrop is only rendered in choreography mode, so `reduced === false` always inside it. The effect's dep array becomes `[]` (mount/unmount only), but the underlying behavior (re-attach listener if the video element changes) is preserved by React's normal mount/unmount semantics. Document this explicitly in the PaperBackdrop docstring so reviewers don't try to add a `[reduced]`-equivalent dep.
- **The `transformOrigin: "50% 92%"` magic value on the paper-card stage frame** — kept as-is. This is a visual-design tuning value, not a stage-window number; outside the scope of MIGRATE-03's "magic-number keyframes" rule.
- **`finalCtaCopy.cta` as the hero CTA label** is the Phase 1 consumer pattern (paper-hero.tsx:166). PaperBackdrop's children-passed hero copy block continues this — same content shape.
- **The video URL `/hero/teacher-working.mp4` and poster `/hero/teacher-illustration.png`** — locked from Phase 1 / current implementation. PaperBackdrop renders them verbatim.
- **The product screenshot `/hero/profiles-screen.png`** — same in Phase 2 ProductScreen stub. Phase 3 swaps for responsive `srcset` variants (VISUAL-03).
- **`paper-hero.tsx` keeps its `PHASE-2-DEBT` comment block (lines 42–49)** until Phase 5 deletes the file. PaperBackdrop / ProductScreen do NOT carry the comment forward — they are the *answer* to that debt, not new debt.
- **The retuned STAGES.wow.window value lands in stages.ts; planning should surface this to the user during Wave 2 checkpoint** — it's a visual-design first-pass value (`[0.20, 0.78]` is a starting point) and the user may want to review the scrub feel at retuning time.

</specifics>

<deferred>
## Deferred Ideas

- **Multi-target `<ProductScreen/>` (docked-left, docked-right targets, stitched useTransform across all 4 stage windows).** Phase 3 — the SCREEN_TARGETS preset → rect map values are designed against the actual product-screen render, not pre-tuned in Phase 2.
- **Responsive `srcset` + WebP/AVIF + `<link rel="preload" fetchpriority="high">` on the product screenshot.** Phase 3 — VISUAL-03.
- **25%/50%/75% midstate design across stage transitions.** Phase 3 — VISUAL-04.
- **`<StageCopyTrack/>` + `<StageCopy/>` extraction; per-stage copy fades for wow/feature-a/feature-b; 200–300ms bullet stagger.** Phase 4 — CONTENT-01..05, 08.
- **OG/canonical/title meta + education trust line + footer privacy/terms.** Phase 4 (meta) and a project-level concern (real teacher testimonials — PROOF-V2-01..02 in REQUIREMENTS.md). Footer privacy/terms tracked since Phase 1 D-05 deferred them.
- **`<StaticChoreographyFallback/>` refactor away from `<PaperHero/>` + `paper-hero.tsx` deletion.** Phase 5 — MIGRATE-05.
- **Lighthouse no-regression + axe-core 0 violations + iOS Safari real-device smoke + reduced-motion smoke.** Phase 6.
- **`SCREEN_TARGETS` runtime values for all 4 targets.** Phase 3.
- **Hysteresis / debounce on the video gate.** Revisit only if Profiler / DevTools shows pause/play thrash during rapid scroll. First-pass: no hysteresis.
- **Per-stage easing curves for the product-screen docking transforms.** Phase 3.

</deferred>

---

*Phase: 2-Orchestrator Shell + Backdrop Migration*
*Context gathered: 2026-04-29*
