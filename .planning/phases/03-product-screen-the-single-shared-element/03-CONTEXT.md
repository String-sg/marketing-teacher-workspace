# Phase 3: Product Screen — The Single Shared Element - Context

**Gathered:** 2026-04-30
**Status:** Ready for planning

<domain>
## Phase Boundary

The Phase 2 `<ProductScreen>` stub (`product-screen.tsx`) — currently animating only the hero→wow ramp via `screenScale` + `screenOpacity` — expands to the full 4-stage stitched morph: **tiny (hero) → centered (wow) → docked-left (feature-a) → docked-right (feature-b)**. The single `motion.div` continues to never unmount, never carries a `layoutId`, and never uses `AnimatePresence` (CHOREO-01, locked Phase 2).

Concretely, Phase 3 produces:

1. **`SCREEN_TARGETS` runtime const** lands in `scroll-choreography/stages.ts` — a `Record<ScreenTarget, ScreenTargetRect>` filling the type-only contract Phase 1 D-11 declared. Replaces the `export type ScreenTargetsMap` alias.
2. **`<ProductScreen>` rewired data-driven** — three `useTransform` calls (scale, x, opacity) whose stops and value arrays are built by `STAGES.flatMap(s => [s.window[0], s.window[1]])` and `STAGES.flatMap(s => [SCREEN_TARGETS[s.screen][axis], SCREEN_TARGETS[s.screen][axis]])`. y stays at 0 (no vertical morph). No clipPath axis.
3. **`STAGES` windows retuned to monotonic non-overlapping** — Phase 2's overlapping windows (`wow: [0.20, 0.78]`, `feature-a: [0.50, 0.78]`, `feature-b: [0.75, 1.0]`) become sequential with explicit hold + morph zones: `hero: [0, 0.10]`, `wow: [0.20, 0.55]`, `feature-a: [0.65, 0.78]`, `feature-b: [0.85, 1.0]`. The 35% wow plateau is the centerpiece reveal. Extends Phase 1 D-12's "first-pass, tunable in Phase 2/3" license.
4. **Cascade from window retune:** `PaperBackdrop`'s `VIDEO_GATE_THRESHOLD = byId("wow").window[1]` auto-tracks (was 0.78, becomes 0.55). `PaperBackdrop`'s intra-stage `STAGE_OPACITY_FADE_START`/`STAGE_OPACITY_FADE_END` named consts (currently `0.6`/`0.78`) need retuning to near the new `wow.window[1] = 0.55` (e.g., `0.45`/`0.55`) so the paper card finishes fading exactly when wow ends. Same for `STAGE_SCALE_MID_PROGRESS`/`STAGE_SCALE_MID_VALUE`/`STAGE_SCALE_END_VALUE`.
5. **Section height retune** — `<ScrollChoreography>`'s outer container becomes `h-[400lvh]` (was `h-[280lvh]`). Each stage gets ~1 viewport of scroll; wow plateau ~1.4 viewports of scrub time; docked stages ~0.5 viewport each.
6. **VISUAL-03 responsive image pipeline** — a one-shot `pnpm gen:hero-images` script using `sharp` produces `profiles-screen-{640,960,1280,1600}.{avif,webp,png}` variants in `public/hero/`. `<ProductScreen>` renders a `<picture>` element with three `<source>` tags (avif → webp → png fallback) and `sizes="(min-width:1280px) 1280px, 100vw"`.
7. **VISUAL-03 LCP preload** — `src/routes/index.tsx`'s `createFileRoute("/")` head config emits `<link rel="preload" as="image" fetchpriority="high" imagesrcset="…avif" imagesizes="(min-width:1280px) 1280px, 100vw" type="image/avif">` so the AVIF variant is preloaded as the LCP candidate before `<ProductScreen>` mounts. Lives only on `/` route — future routes don't pay the cost.
8. **VISUAL-04 midstate design** — per-axis cubic-bezier easing in each `useTransform` options (Motion 12 supports `{ ease }` in `useTransform`); light overshoot at each stage's arrival (preserves Phase 2 hero→wow `1.04` peak pattern); the fA→fB cross-center morph keeps linear x but applies a subtle scale dip (peak ~0.45 at midpoint) so the screen reads as "passing behind copy" not "ghosting through". Plan schedules a `checkpoint:human-verify` for visual review at 25/50/75 of every transition.
9. **A11Y-05 alt text** — the `<img>` (and `<picture>`'s fallback `<img>`) carries the spec-verbatim alt text: `"Teacher Workspace student view showing attendance, behavior notes, and family messages"`. Replaces Phase 2's shorter `"Teacher Workspace student insights dashboard"`. Same alt text reaches static-fallback render path.
10. **Browser-frame chrome preserved** — Mac-style traffic lights + truncated `TEACHER_WORKSPACE_APP_URL` (Phase 2 styling). No change.
11. **`pointer-events-none` preserved** — Phase 2 set it on the outer wrapper because the live app is the conversion target; this image is decorative. Phase 3 keeps it (Phase 4 may revisit when copy + bullets land).

Out of scope for Phase 3: stage copy rewrite (Phase 4 — CONTENT-01..05), bullet stagger / `<StageCopy>` extraction (Phase 4), OG/canonical/title meta (Phase 4 — SEO-01..03), `<PaperHero/>` deletion in `<StaticChoreographyFallback/>` (Phase 5 — MIGRATE-05), Lighthouse / axe-core / iOS Safari real-device audit (Phase 6).

</domain>

<decisions>
## Implementation Decisions

### Transform Stitching Shape

- **D-01 (window-edge holds):** Each stage holds at its peak between `window[0]` and `window[1]` on master `scrollYProgress`; the morph happens in the gap between adjacent windows (`prev.window[1] → next.window[0]`). The keyframe stops array is `STAGES.flatMap(s => [s.window[0], s.window[1]])` — 8 stops total. Values at `window[0]` and `window[1]` are identical per stage (the hold). Reads as four discrete legible "beats" with clean morph zones between them.

- **D-02 (wow-emphasis windowing):** `STAGES` retuned to monotonic non-overlapping — `hero: [0, 0.10]`, `wow: [0.20, 0.55]`, `feature-a: [0.65, 0.78]`, `feature-b: [0.85, 1.0]`. The 35% wow plateau is the page's centerpiece reveal; hero is a 10% setup; docked stages get ~13–15% each — enough for Phase 4's 200–300ms-staggered 3-bullet reveals. Extends Phase 1 D-12 + Phase 2 D-14's "tunable in Phase 3" license. **Phase 2's `wow.window = [0.20, 0.78]` and `feature-a.window = [0.50, 0.78]` are explicitly revised.**

- **D-03 (animated axes: scale + x + opacity only):** y stays at 0 throughout (vertical viewport center for all stages). No clipPath axis. Three `useTransform` calls per `<ProductScreen>`. `ScreenTargetRect`'s `y` and `clipPath?` fields stay declared but unused — future phases may consume.

- **D-04 (data-driven from `SCREEN_TARGETS` map):** Phase 3 fills `SCREEN_TARGETS` as a runtime `Record<ScreenTarget, ScreenTargetRect>` const in `stages.ts` (replacing the Phase 1 type alias). `<ProductScreen>` builds keyframe arrays via `STAGES.flatMap(s => { const v = SCREEN_TARGETS[s.screen][axis]; return [v, v] })`. Adding a 5th stage later costs zero `<ProductScreen>` edits; the map is the single source of truth.

### Dock Geometry & SCREEN_TARGETS Values

- **D-05 (hero target: hidden during hero, fades in during morph):** `SCREEN_TARGETS.tiny.opacity = 0` — preserves Phase 2 behavior. The "tiny inside the illustration" position is the geometric starting point; the fade-in (opacity 0 → 1) happens in the hero→wow morph zone (`[hero.window[1], wow.window[0]] = [0.10, 0.20]`) alongside scale (0.55 → 1.0). User during hero sees only paper card + clouds + autoplay-loop video.

- **D-06 (dock side semantics):** feature-a stage uses `screen: "docked-left"` → screen sits on viewport LEFT, copy area on RIGHT (Phase 4). feature-b stage uses `screen: "docked-right"` → screen sits on viewport RIGHT, copy area on LEFT. The fA→fB morph slides the screen through center (scale-dip midstate per D-09 below). Reading flow: screen-left+copy-right → mirrors → screen-right+copy-left.

- **D-07 (sign convention):** `x` values follow CSS transform conventions — negative `x` moves leftward, positive `x` moves rightward. So `docked-left.x = "-28vw"` (move screen toward viewport left), `docked-right.x = "+28vw"` (move screen toward viewport right). `tiny.x = "0"`, `centered.x = "0"`.

- **D-08 (balanced dock proportions):** `docked-left` and `docked-right` both have `scale: 0.5`, `x: ±28vw`. Smaller than hero's 0.55 — copy gets ~55% of viewport (Phase 4 has room for kicker + heading + 3 staggered bullets). Final `SCREEN_TARGETS`:
    ```ts
    export const SCREEN_TARGETS: Record<ScreenTarget, ScreenTargetRect> = {
      "tiny":         { scale: 0.55, x: "0",     y: "0", opacity: 0 },
      "centered":     { scale: 1.00, x: "0",     y: "0", opacity: 1 },
      "docked-left":  { scale: 0.50, x: "-28vw", y: "0", opacity: 1 },
      "docked-right": { scale: 0.50, x: "+28vw", y: "0", opacity: 1 },
    } as const
    ```

- **D-09 (section height retune):** `<ScrollChoreography>`'s outer container becomes `h-[400lvh]` (was Phase 2's `h-[280lvh]`). 4× viewport height — standard for 4-stage sticky-scroll choreographies. Within research/FEATURES.md anti-feature threshold of >4 viewports (avoids "am I stuck?" anxiety).

### VISUAL-03 — Responsive Image + LCP Preload

- **D-10 (build-time sharp script + static `<picture>`):** Add `scripts/gen-hero-images.mjs` (sharp-based, idempotent; runs via `pnpm gen:hero-images`) producing `profiles-screen-{640,960,1280,1600}.{avif,webp,png}` variants in `public/hero/`. Variants commit to the repo (no runtime image-optimization service). `<ProductScreen>` renders:
    ```html
    <picture>
      <source srcset="...640.avif 640w, ...960.avif 960w, ...1280.avif 1280w, ...1600.avif 1600w" type="image/avif" sizes="(min-width:1280px) 1280px, 100vw" />
      <source srcset="...640.webp 640w, ...960.webp 960w, ...1280.webp 1280w, ...1600.webp 1600w" type="image/webp" sizes="(min-width:1280px) 1280px, 100vw" />
      <img src="/hero/profiles-screen-1280.png"
           srcset="/hero/profiles-screen-640.png 640w, /hero/profiles-screen-960.png 960w, /hero/profiles-screen-1280.png 1280w, /hero/profiles-screen-1600.png 1600w"
           sizes="(min-width:1280px) 1280px, 100vw"
           alt="Teacher Workspace student view showing attendance, behavior notes, and family messages"
           loading="eager"
           decoding="async" />
    </picture>
    ```
    Source asset stays at `public/hero/profiles-screen.png` (1600×1000, 134 KB) — the script reads it as input; the original is preserved for the source-of-truth.

- **D-11 (variant size set):** Widths `640 / 960 / 1280 / 1600` — covers mobile static fallback (640), tablet static (960), desktop wow plateau (1280, max-width of `<ProductScreen>`'s inner wrapper), and 1.25× retina at 1280 display (1600). No 1920+ — current source is 1600 max; upscaling would lose quality.

- **D-12 (LCP preload via index route head):** `src/routes/index.tsx`'s `createFileRoute("/")` `head` config emits one `<link rel="preload">` for the AVIF variant set. Browsers that don't support AVIF fall through to `<picture>`'s WebP/PNG sources at render time:
    ```ts
    head: () => ({
      links: [{
        rel: "preload",
        as: "image",
        fetchpriority: "high",
        imagesrcset: "/hero/profiles-screen-640.avif 640w, /hero/profiles-screen-960.avif 960w, /hero/profiles-screen-1280.avif 1280w, /hero/profiles-screen-1600.avif 1600w",
        imagesizes: "(min-width:1280px) 1280px, 100vw",
        type: "image/avif",
      }],
    })
    ```
    Lives only on `/` route — index-route head, not `__root.tsx`.

### A11Y-05 — Alt Text

- **D-13 (spec-verbatim alt text):** `alt="Teacher Workspace student view showing attendance, behavior notes, and family messages"` (matches ROADMAP SC #5 verbatim). Reaches both choreography and static-fallback render paths (STATIC-04 already requires same content tree). Replaces Phase 2's `"Teacher Workspace student insights dashboard"`.

### VISUAL-04 — Midstate Design (25/50/75 Intentional)

- **D-14 (per-axis cubic-bezier easing):** Each `useTransform` call applies a stage-appropriate ease via Motion's `{ ease }` option. Default `"linear"` is replaced with named curves matching the morph intent:
    - hero→wow scale: `[0.32, 0, 0.67, 1]` (fast accelerate, slow settle — like a screen "rising into focus")
    - hero→wow opacity: `"easeOut"` (fade in fast, then settle)
    - wow→feature-a scale: `[0.4, 0, 0.2, 1]` (smooth deceleration as it docks)
    - wow→feature-a x: `[0.4, 0, 0.2, 1]` (matches scale curve so axes feel coupled)
    - feature-a→feature-b x: `"easeInOut"` (symmetric — passes through center smoothly)

- **D-15 (light overshoot at each peak):** Preserve Phase 2's hero→wow scale overshoot pattern (`[0.55 → 1.0 → 1.04]` at the wow.window[1] tail end). Add the same shape at each docked-stage arrival — small overshoot (~1.04× target scale) at the morph endpoint, settling to the docked scale during the hold. Documented as named local consts in `<ProductScreen>` (D-13 from Phase 2 / Phase 3 keeps the named-const pattern).

- **D-16 (fA→fB cross-center morph):** Linear x between `+28vw` and `-28vw` (passes through 0 at midpoint by definition). Add an intra-morph scale dip — peak ~0.45 at midpoint of the morph zone (between `feature-a.window[1] = 0.78` and `feature-b.window[0] = 0.85`) — so the screen visibly *recedes slightly* during the cross-center transit. This makes the midstate read as "the screen is passing behind copy" rather than "ghosting through". No clipPath, no y change; pure scale modulation.

- **D-17 (visual-review checkpoint):** Plan schedules a `checkpoint:human-verify` step during Wave 3 (or the wave that ships `<ProductScreen>` with all 4 targets). User scrubs through 25/50/75 of every transition; planner / executor adjusts easing curves and overshoot magnitudes against visual feel before commit-merge.

### Browser-Frame Chrome & Pointer Events

- **D-18 (chrome preserved verbatim from Phase 2):** Mac-style traffic lights (red/yellow/green) + truncated `TEACHER_WORKSPACE_APP_URL` in the URL bar — `<ProductScreen>`'s outer rounded card with shadow stays. No change in Phase 3.

- **D-19 (`pointer-events-none` preserved):** The outer wrapper keeps `pointer-events-none` (Phase 2 D-08 + Phase 2 ProductScreen Phase-2 stub note). The screen is decorative; the conversion target is `TEACHER_WORKSPACE_APP_URL` reached via the hero CTA + final-CTA. Phase 4 may revisit when copy lands; Phase 3 makes no change.

### Cascade From Window Retune (Backdrop Touch-Up)

- **D-20 (PaperBackdrop intra-stage consts retune):** `PaperBackdrop`'s `STAGE_OPACITY_FADE_START` / `STAGE_OPACITY_FADE_END` (currently `0.6` / `0.78`) need retuning to near the new `wow.window[1] = 0.55` so the paper card finishes fading exactly when wow ends. First-pass: `0.45` / `0.55`. Same for `STAGE_SCALE_MID_PROGRESS` / `STAGE_SCALE_MID_VALUE` / `STAGE_SCALE_END_VALUE` — all are intra-stage timing values that drift relative to the retuned wow window. Planner reviews magnitudes.

- **D-21 (`VIDEO_GATE_THRESHOLD` auto-tracks):** `PaperBackdrop`'s `VIDEO_GATE_THRESHOLD = byId("wow").window[1]` auto-tracks the retune (was 0.78, becomes 0.55) — no `paper-backdrop.tsx` edit needed for this. Test at `paper-backdrop.test.tsx` may need value updates to reflect the new threshold.

- **D-22 (test snapshots / expectations):** Tests asserting specific keyframe arrays (`migrate-03-keyframe-binding.test.ts`, `stages.test.ts`, `paper-backdrop.test.tsx`, `product-screen.test.tsx`) will fail on the window retune — expected. Planner schedules them as test-update tasks alongside the source changes; not a regression.

### Claude's Discretion

- Exact cubic-bezier values for D-14 — first-pass curves above are starting points; planner / executor may swap to motion's named curves (`"easeIn"`, `"easeOut"`, `"easeInOut"`, `"backOut"`) if they read better at human-verify checkpoint.
- Exact overshoot magnitudes (D-15) — `1.04` is the Phase 2 baseline; small fluctuations are visual taste, not a contract.
- Whether the fA→fB scale-dip midpoint is `0.45` or some other value (D-16) — adjustable at the human-verify checkpoint. Avoid going below `0.4` (legibility floor for the screenshot at viewport scale).
- Test infrastructure — whether to add a snapshot test for `SCREEN_TARGETS` shape vs only test the resulting `useTransform` keyframe arrays. Default: assert the map shape directly (one source of truth, easier to read on failure).
- Whether `gen:hero-images` script lives in `scripts/` (new dir) or `tools/` (also new) — planner picks based on existing convention; default `scripts/` since it's Node-script-ish.
- Whether to add a `pnpm prebuild` hook that runs `gen:hero-images` automatically vs requiring a manual run + commit. Default: manual + commit (variants are checked-in artifacts; `prebuild` would slow every CI and dev-server start unnecessarily).
- Whether to also update `<StaticChoreographyFallback/>`'s image rendering (currently routed via `<PaperHero/>`'s reduced branch) to use the same `<picture>` element. Defer to Phase 5 (MIGRATE-05) per Phase 2 D-03 — Phase 3 only touches the choreography path's `<ProductScreen/>`.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project Spec
- `.planning/REQUIREMENTS.md` — full Phase 3 requirement set (CHOREO-03, CHOREO-04, CHOREO-05, VISUAL-01, VISUAL-02, VISUAL-03, VISUAL-04, A11Y-05)
- `.planning/ROADMAP.md` §"Phase 3: Product Screen — The Single Shared Element" — goal, depends-on, 5 success criteria
- `.planning/PROJECT.md` — core value (the choreography is THE storytelling element), tonal-contrast directive (VISUAL-01)

### Project Research (HIGH confidence)
- `.planning/research/SUMMARY.md` §"Phase 3: Product Screen — The Single Shared Element" — what Phase 3 delivers, pitfalls 8/10 it must avoid, parallelism note
- `.planning/research/ARCHITECTURE.md` §"System Overview", §"Architectural Patterns" Pattern 2 (stages-as-data) + Pattern 3 (one shared DOM node, no `layoutId`), §"Typing Strategy" (`StageDef` / `ScreenTarget` / `ScreenTargetRect`)
- `.planning/research/STACK.md` — `useTransform` direct-into-style, motion options (`{ ease }`), `<picture>` + `<link rel="preload">` patterns
- `.planning/research/PITFALLS.md` — #8 (broken-looking midstates → design 25/50/75), #10 (full-resolution screenshot blocks LCP → responsive `srcset` + WebP/AVIF + preload), #2 (sticky parent transforms — already verified Phase 2)

### Phase 1 + 2 Carry-Forward (LOCKED — do not relitigate)
- `.planning/phases/01-foundation-types-static-fallback-ssr-contract/01-CONTEXT.md` — D-04 (file paths under `scroll-choreography/`), D-08 (content shapes), D-11 (`ScreenTarget` enum + `SCREEN_TARGETS` Phase-3-fills contract), D-12 (STAGES first-pass + retuneable in Phase 3)
- `.planning/phases/02-orchestrator-shell-backdrop-migration/02-CONTEXT.md` — D-05 (context-subscriber pattern), D-08 (`<ProductScreen>` file path + Phase-2 stub scope), D-09 (Phase 2 = hero→wow only), D-10 (`screenOpacity` as `useTransform`), D-11 (`SCREEN_TARGETS` runtime values for Phase 3 — confirmed lock target), D-12 / D-13 (endpoint-only MIGRATE-03 binding + named local consts for intra-stage), D-14 (STAGES retunable in Phase 3 — Phase 3 hereby exercises that license), D-15 / D-16 (CHOREO-08 video gate + threshold = `byId("wow").window[1]` auto-tracking)
- `.planning/phases/02-orchestrator-shell-backdrop-migration/02-VERIFICATION.md` — confirms which Phase 2 artifacts shipped (so Phase 3 doesn't re-create them)

### Codebase Maps
- `.planning/codebase/ARCHITECTURE.md` — current `<ProductScreen>` Phase-2 stub state, choreography subtree boundaries, anti-patterns to avoid
- `.planning/codebase/CONVENTIONS.md` — kebab-case files, named exports, no barrel files, `@/` alias, comment philosophy
- `.planning/codebase/STRUCTURE.md` — directory layout (already established `scroll-choreography/` from Phase 1; new `scripts/` for image-gen)
- `.planning/codebase/TESTING.md` — vitest + jsdom + matchMedia shim conventions

### Source Files Phase 3 Touches (or creates)
- `src/components/landing/scroll-choreography/product-screen.tsx` — **rewires from hero→wow stub to 4-stage data-driven morph**; adds `<picture>` element; updates alt text
- `src/components/landing/scroll-choreography/stages.ts` — **fills `SCREEN_TARGETS` runtime const** (replaces type alias); **retunes `STAGES` windows** to monotonic non-overlapping sequence
- `src/components/landing/scroll-choreography/types.ts` — no shape change; `ScreenTargetRect` already declared (Phase 1 D-11)
- `src/components/landing/scroll-choreography/scroll-choreography.tsx` — **section height retune** `h-[280lvh]` → `h-[400lvh]`
- `src/components/landing/scroll-choreography/paper-backdrop.tsx` — **intra-stage consts retune** (`STAGE_OPACITY_FADE_*`, `STAGE_SCALE_*`) to track new `wow.window[1] = 0.55`
- `src/routes/index.tsx` — **add LCP preload `<link>` to `head()`** config
- `scripts/gen-hero-images.mjs` — **NEW** sharp-based variant generator (one-shot, idempotent)
- `package.json` — add `gen:hero-images` script + `sharp` devDep
- `public/hero/profiles-screen-{640,960,1280,1600}.{avif,webp,png}` — **NEW** generated variant files (12 total)

### Tests Phase 3 Updates or Adds
- `src/components/landing/scroll-choreography/product-screen.test.tsx` — **major rewrite**: assert 4-stage stitched keyframes; assert `SCREEN_TARGETS` map values flow through to `useTransform` calls; never-unmounts mount-counter (preserved); `<picture>` element renders all 3 source types; alt text matches D-13
- `src/components/landing/scroll-choreography/stages.test.ts` — **update**: assert new monotonic STAGES windows + assert `SCREEN_TARGETS` shape + values
- `src/components/landing/scroll-choreography/paper-backdrop.test.tsx` — **update**: video-gate threshold expectations track `wow.window[1] = 0.55`; intra-stage consts retune
- `src/components/landing/scroll-choreography/migrate-03-keyframe-binding.test.ts` — **update**: ProductScreen now binds via `byId(...).window[]` for all 4 stages, not just hero/wow
- `src/components/landing/scroll-choreography/scroll-choreography.test.tsx` — assert `h-[400lvh]` outer-container class
- **NEW** test for index-route head: assert `<link rel="preload" as="image">` is emitted by route head config (vitest with TanStack Router head harness, or DOM smoke after first-render)
- **NEW** test for `gen-hero-images.mjs`: assert script is idempotent + produces all 12 variants from a fixture input PNG (lightweight smoke; full run is offline)

### External Docs
- `motion.dev/docs/react-use-transform` — `{ ease }` option in `useTransform`, named easings, cubic-bezier curves
- `motion.dev/docs/react-motion-value` — `MotionValue` re-render semantics (already-Phase-2-locked but Phase 3 expands consumption)
- `developer.mozilla.org/docs/Web/HTML/Element/picture` — `<picture>` + `<source>` + media negotiation
- `developer.mozilla.org/docs/Web/HTML/Attributes/rel/preload` — `imagesrcset` + `imagesizes` for responsive preload
- `web.dev/preload-responsive-images` — LCP responsive-image preload pattern
- `sharp.pixelplumbing.com` — sharp Node API for AVIF/WebP/PNG variant generation

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **`<ProductScreen>` Phase-2 stub** (`src/components/landing/scroll-choreography/product-screen.tsx`) — Phase 3 rewires the same file. Browser-frame chrome JSX (Mac dots + URL bar), outer `motion.div` wrapper, `pointer-events-none`, `aria-hidden`, z-20 layering — all preserved verbatim.
- **`STAGES` + `byId()`** (`stages.ts`) — Phase 3 retunes window values; `byId()` helper is unchanged. `<ProductScreen>` still uses `byId()` for individual stage lookups in tests; the runtime `SCREEN_TARGETS` map sits alongside `STAGES`.
- **`useScrollChoreography()` context hook** (Phase 1 / 2) — Phase 3 `<ProductScreen>` consumes it the same way. No context-shape changes.
- **`PaperBackdrop`'s `useMotionValueEvent` video-gate pattern** (Phase 2 D-15 / D-16) — auto-tracks `wow.window[1]` retune. No code change in `paper-backdrop.tsx` for the gate threshold itself; only intra-stage timing consts (D-20) need retuning.
- **`useTransform` clamp:true default** (Phase 2 D-10 — eliminated `clamp01` helper) — Phase 3's 8-stop arrays still benefit; values outside the stops range clamp at the endpoints.
- **`finalCtaCopy.cta`** (`src/content/landing.ts`) — Phase 3 doesn't use directly (no copy edits); reaches `<ProductScreen>` only via the URL bar string already in Phase 2.
- **`cn()` utility** (`src/lib/utils.ts`) — for `<picture>`/`<img>` className composition if needed.
- **vitest + jsdom + matchMedia shim** (Phase 1) — Phase 3 reuses; jsdom doesn't render `<picture>` source negotiation but does parse the element tree, so DOM-shape assertions work.

### Established Patterns
- **"Pure presentational subscribers"** (research/ARCHITECTURE.md, Phase 2 D-05) — `<ProductScreen>` consumes `scrollYProgress` via `useScrollChoreography()`. Phase 3 expands what it does with that motion value but doesn't change the subscription pattern.
- **`useTransform` direct-into-style** (CHOREO-06 / Phase 2 D-10) — three motion values (scale, x, opacity) flow into `style={{ scale, x, opacity }}` on the inner `<motion.div>`. No `useState` for visual values.
- **Endpoint-only MIGRATE-03 binding** (Phase 2 D-12) — keyframe stops use `STAGES.flatMap(s => [s.window[0], s.window[1]])` rather than magic numbers. Intra-stage timing values (e.g., the morph-midpoint scale dip in D-16) live as named local consts in `product-screen.tsx`.
- **Named exports only, no barrel files, `@/` alias** (Phase 1 D-04, Phase 2 reuses).
- **One vitest file per source file** (Phase 1 testing convention) — same Phase 3.
- **Mac-style browser-frame chrome with traffic lights + truncated URL** (Phase 2 ProductScreen styling) — preserved.

### Integration Points
- **`stages.ts`** — Phase 3's `SCREEN_TARGETS` runtime const replaces the Phase 1 type alias `export type ScreenTargetsMap`. Adjacent in the same file.
- **`product-screen.tsx`** — sole consumer of `SCREEN_TARGETS`. Iterates `STAGES`, indexes `SCREEN_TARGETS[s.screen]`.
- **`scroll-choreography.tsx`** — Phase 3's only edit: outer container `h-[280lvh]` → `h-[400lvh]`. The `useScroll` config is unchanged (target/offset/`layoutEffect: false` all preserved).
- **`paper-backdrop.tsx`** — intra-stage timing consts retune (D-20). No structural change.
- **`routes/index.tsx`** — Phase 3 adds the `<link rel="preload">` via `createFileRoute`'s `head()` config. The route already exists from Phase 1 D-03 / Phase 2 D-01.
- **`public/hero/`** — 12 new variant files commit alongside the existing `profiles-screen.png`. Source PNG is preserved (the gen-script reads it).
- **`scripts/`** (new directory) — first usage; a one-file `gen-hero-images.mjs` script ships here. Future Node-script tooling lands here too.
- **`package.json`** — adds `"gen:hero-images": "node scripts/gen-hero-images.mjs"` to `scripts`; adds `sharp` to `devDependencies`.

</code_context>

<specifics>
## Specific Ideas

- **Source asset is preserved.** `public/hero/profiles-screen.png` (1600×1000, 134 KB, 8-bit sRGB) stays as the canonical input. The `gen-hero-images.mjs` script reads it and writes 12 variants alongside it. Don't delete or modify the source PNG — future re-runs of the script need it.
- **AVIF preload is the only format preloaded.** Browsers without AVIF support fall through to the `<picture>`'s WebP source, then PNG. The preload is a fast-path for AVIF-capable browsers; the `<picture>` handles negotiation for the rest.
- **`sizes="(min-width:1280px) 1280px, 100vw"`** — same `sizes` attribute on both the `<img>`/`<source>` srcsets AND the `<link rel="preload">`'s `imagesizes` (per `web.dev/preload-responsive-images` — they MUST match for the preload to actually preload the right variant).
- **The fA→fB scale-dip midpoint at ~0.45** (D-16) is a starting tuning value. The user expects to scrub through this transition during the visual-review checkpoint and may want to adjust between 0.40–0.50 based on legibility.
- **The 8-stop keyframe array per axis is 8 numbers** — for window-edge stitching, each stage contributes 2 stops (its `window[0]` and `window[1]`) with the same value (the hold). Across all 4 stages: `[hero.w[0], hero.w[1], wow.w[0], wow.w[1], fA.w[0], fA.w[1], fB.w[0], fB.w[1]]` = 8 stops. Motion library handles 8-stop arrays natively (no segment-stitching libraries needed).
- **The user explicitly accepted the wow-emphasis 35% plateau partition** during gray-area selection — Phase 3 commits these specific window numbers. If post-execution review wants to shift to equal-share or late-loading, Phase 4+ can revisit (it's intra-`stages.ts` data, not a structural change).
- **The user opted to skip remaining detail questions and auto-advance** after the alt-text question — Phase 3 image-strategy details (variant size set, sharp script location) and Midstate design VISUAL-04 details (D-14 through D-17) are **Claude-decided defaults**, not user-locked decisions. Planner may refine during research / planning if the defaults read poorly.
- **No spike/sketch findings exist** for Phase 3 — `.planning/spikes/` and `.planning/sketches/` are empty. If the visual-review checkpoint surfaces unexpected midstate badness, a `/gsd-spike` is the recovery path.

</specifics>

<deferred>
## Deferred Ideas

- **`<StageCopy>` panels for wow / feature-a / feature-b stages, per-stage copy fades, 200–300ms bullet stagger.** Phase 4 — CONTENT-01..05.
- **`<StaticChoreographyFallback/>` `<picture>` upgrade** (currently routed via `<PaperHero/>`'s reduced branch). Phase 5 — MIGRATE-05 owns the static-fallback refactor; same `<picture>` element should land there for parity.
- **Lighthouse / web-vitals / axe-core / iOS Safari real-device audit** measuring the actual LCP improvement Phase 3 ships. Phase 6.
- **OG / canonical / title meta using the product UI image.** Phase 4 — SEO-01..03. Phase 3 ships the variant assets that Phase 4's `og:image` will reuse.
- **`pointer-events` toggle when docked** (so the screen becomes a clickable thumbnail linking to `TEACHER_WORKSPACE_APP_URL`). Phase 4 may revisit when copy + bullets land alongside the docked stages and the screen reads as a "preview thumbnail" rather than pure decoration.
- **Subtle UI-region highlight tying bullets to specific zones of the product UI** in stages 3–4 (research/FEATURES.md P2 — POLISH-02 in REQUIREMENTS.md v2). Phase 6 polish-only if time permits.
- **Theme tone-shift across scroll** (warm paper → cooler product — POLISH-03). v2 deferred.
- **Auto-loop product video at Stage 2** (POLISH-05 — only if a clip becomes available). v2 deferred.
- **Adding y axis to `SCREEN_TARGETS`** if a future stage needs vertical position. The `ScreenTargetRect` type already declares `y` (Phase 1 D-11) — Phase 3 fills it as `"0"` for all four stages but the field exists.
- **Adding `clipPath` to `SCREEN_TARGETS`** for shape-morph during transitions (e.g., screen "emerging" from a paper card cutout). Type field exists (`clipPath?`); Phase 3 leaves it undefined for all four targets. v2 candidate.
- **`pnpm prebuild` hook to auto-run `gen:hero-images`.** Default decision: manual + commit. Reconsider only if variant-asset drift becomes a problem (e.g., contributors editing the source PNG without re-running the script).

</deferred>

---

*Phase: 3-Product Screen — The Single Shared Element*
*Context gathered: 2026-04-30*
