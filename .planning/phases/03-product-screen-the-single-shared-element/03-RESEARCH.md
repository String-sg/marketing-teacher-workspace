# Phase 3: Product Screen — The Single Shared Element - Research

**Researched:** 2026-04-29
**Domain:** Multi-stop scroll-driven `useTransform` stitching + LCP-safe responsive images on TanStack Start + React 19 + motion/react 12.38
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01 (window-edge holds):** Each stage holds at its peak between `window[0]` and `window[1]`; the morph happens in the gap between adjacent windows (`prev.window[1] → next.window[0]`). The keyframe stops array is `STAGES.flatMap(s => [s.window[0], s.window[1]])` — 8 stops. Values at `window[0]` and `window[1]` are identical per stage (the hold).
- **D-02 (wow-emphasis windowing):** `STAGES` retuned to monotonic non-overlapping — `hero: [0, 0.10]`, `wow: [0.20, 0.55]`, `feature-a: [0.65, 0.78]`, `feature-b: [0.85, 1.0]`. The 35% wow plateau is the centerpiece reveal.
- **D-03 (animated axes: scale + x + opacity only):** y stays at 0 throughout. No clipPath axis. Three `useTransform` calls per `<ProductScreen>`. `ScreenTargetRect`'s `y` and `clipPath?` fields stay declared but unused.
- **D-04 (data-driven from `SCREEN_TARGETS` map):** Phase 3 fills `SCREEN_TARGETS` as a runtime `Record<ScreenTarget, ScreenTargetRect>` const in `stages.ts` (replacing the Phase 1 type alias). `<ProductScreen>` builds keyframe arrays via `STAGES.flatMap(s => { const v = SCREEN_TARGETS[s.screen][axis]; return [v, v] })`.
- **D-05 (hero target opacity 0):** `SCREEN_TARGETS.tiny.opacity = 0`. Fade-in (0 → 1) happens in the hero→wow morph zone `[0.10, 0.20]` alongside scale (0.55 → 1.0).
- **D-06 (dock side semantics):** feature-a → docked-left (screen LEFT, copy area RIGHT). feature-b → docked-right (screen RIGHT, copy area LEFT). fA→fB slides through center.
- **D-07 (sign convention):** negative `x` = leftward; `docked-left.x = "-28vw"`, `docked-right.x = "+28vw"`. `tiny.x = "0"`, `centered.x = "0"`.
- **D-08 (balanced dock):** scale 0.5, x ±28vw. Hero scale 0.55, wow scale 1.00.
  ```ts
  export const SCREEN_TARGETS: Record<ScreenTarget, ScreenTargetRect> = {
    "tiny":         { scale: 0.55, x: "0",     y: "0", opacity: 0 },
    "centered":     { scale: 1.00, x: "0",     y: "0", opacity: 1 },
    "docked-left":  { scale: 0.50, x: "-28vw", y: "0", opacity: 1 },
    "docked-right": { scale: 0.50, x: "+28vw", y: "0", opacity: 1 },
  } as const
  ```
- **D-09 (section height retune):** `<ScrollChoreography>` outer container `h-[280lvh]` → `h-[400lvh]`.
- **D-10 (build-time sharp script + static `<picture>`):** `scripts/gen-hero-images.mjs` produces `profiles-screen-{640,960,1280,1600}.{avif,webp,png}` variants in `public/hero/`. Variants commit to repo. `<ProductScreen>` renders `<picture>` with three `<source>` (avif/webp/png) + `sizes="(min-width:1280px) 1280px, 100vw"`.
- **D-11 (variant size set):** `640 / 960 / 1280 / 1600` widths.
- **D-12 (LCP preload via index route head):** `routes/index.tsx`'s `createFileRoute("/")` `head` config emits one `<link rel="preload">` for the AVIF variant set. Lives only on `/`.
- **D-13 (spec-verbatim alt text):** `alt="Teacher Workspace student view showing attendance, behavior notes, and family messages"`.
- **D-14 (per-axis cubic-bezier easing):** Stage-appropriate ease curves via Motion's `{ ease }` option.
- **D-15 (light overshoot at each peak):** Preserve Phase 2's hero→wow scale overshoot (`1.04`) pattern at each docked-stage arrival.
- **D-16 (fA→fB cross-center morph):** Linear x between `+28vw` and `-28vw`. Scale dip ~0.45 at midpoint of the morph zone (between `0.78` and `0.85`).
- **D-17 (visual-review checkpoint):** Plan schedules a `checkpoint:human-verify` step during the wave that ships `<ProductScreen>` with all 4 targets.
- **D-18 (chrome preserved):** Mac-style traffic lights + truncated `TEACHER_WORKSPACE_APP_URL`. No change.
- **D-19 (`pointer-events-none` preserved):** Outer wrapper keeps `pointer-events-none`.
- **D-20 (PaperBackdrop intra-stage consts retune):** First-pass `STAGE_OPACITY_FADE_START`/`END` → `0.45`/`0.55`. Same for `STAGE_SCALE_MID_PROGRESS` / `STAGE_SCALE_MID_VALUE` / `STAGE_SCALE_END_VALUE`.
- **D-21 (`VIDEO_GATE_THRESHOLD` auto-tracks):** No `paper-backdrop.tsx` edit needed for the gate itself; threshold tracks `byId("wow").window[1]` automatically.
- **D-22 (test snapshots / expectations):** Tests asserting specific keyframe arrays will fail on the window retune — expected. Planner schedules them as test-update tasks alongside source changes.

### Claude's Discretion

- Exact cubic-bezier values for D-14 — first-pass curves are starting points; planner / executor may swap to motion's named curves at human-verify.
- Exact overshoot magnitudes (D-15) — `1.04` baseline; small fluctuations are visual taste.
- fA→fB scale-dip midpoint (D-16) — `0.45` first-pass; adjustable 0.40–0.50 at human-verify (avoid <0.40 — legibility floor).
- Whether to add a snapshot test for `SCREEN_TARGETS` shape vs only the resulting `useTransform` keyframe arrays. Default: assert the map shape directly.
- Whether `gen:hero-images` script lives in `scripts/` (default) or `tools/`.
- Whether to add a `pnpm prebuild` hook vs manual run + commit. **Default: manual + commit.**
- Whether to also update `<StaticChoreographyFallback/>`'s image rendering. **Defer to Phase 5 (MIGRATE-05).**

### Deferred Ideas (OUT OF SCOPE)

- `<StageCopy>` panels for wow / feature-a / feature-b stages, per-stage copy fades, 200–300ms bullet stagger → Phase 4 (CONTENT-01..05)
- `<StaticChoreographyFallback/>` `<picture>` upgrade → Phase 5 (MIGRATE-05)
- Lighthouse / web-vitals / axe-core / iOS Safari real-device audit → Phase 6
- OG / canonical / title meta using the product UI image → Phase 4 (SEO-01..03)
- `pointer-events` toggle when docked → Phase 4 may revisit
- Subtle UI-region highlight tying bullets to specific zones of the product UI → Phase 6 polish (POLISH-02)
- Theme tone-shift across scroll → v2 (POLISH-03)
- Auto-loop product video at Stage 2 → v2 (POLISH-05)
- Adding `y` axis or `clipPath` to `SCREEN_TARGETS` → v2 candidate (type fields exist, unfilled)
- `pnpm prebuild` hook to auto-run `gen:hero-images` → reconsider only if drift becomes a problem
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| CHOREO-03 | Stage 2 (Wow) — product screen scales to centered, near-full-viewport reveal | §"Implementation Pattern 1: 8-Stop useTransform Stitching" — 35% wow plateau via `[0.20, 0.55]` window with hold at `centered` (scale 1.0, x 0, opacity 1) |
| CHOREO-04 | Stage 3 (Feature A) — product screen docks to one side | §"Implementation Pattern 1" — feature-a window `[0.65, 0.78]` holds at `docked-left` (scale 0.5, x -28vw, opacity 1) |
| CHOREO-05 | Stage 4 (Feature B) — product screen docks to the other side | §"Implementation Pattern 1" + §"Pitfalls Phase-3-Specific #1 (cross-center scale dip)" — feature-b window `[0.85, 1.0]` holds at `docked-right` (scale 0.5, x +28vw, opacity 1) with intra-morph scale dip ~0.45 |
| VISUAL-01 | Tonal contrast preserved — UI screen not flattened | §"Pitfalls Phase-3-Specific #5" — preserve current sharp/photorealistic styling: rounded-2xl + black/10 border + 30px shadow contrasting against paper aesthetic. Don't apply paper-aesthetic filters to the screenshot |
| VISUAL-02 | Browser-frame screenshot of Student Insights view is the canonical asset | §"Implementation Pattern 3: `<picture>` Element + Browser-Frame Chrome" — Mac traffic lights + truncated URL bar preserved verbatim from Phase 2; image source `/hero/profiles-screen.png` (1600×1000) |
| VISUAL-03 | Responsive `srcset` + WebP/AVIF + `<link rel="preload" fetchpriority="high">` | §"Implementation Pattern 2: sharp variant generation" + §"Implementation Pattern 4: TanStack Start head() preload" |
| VISUAL-04 | 25/50/75 midstates of every stage transition intentionally designed | §"Implementation Pattern 1" (per-segment easings) + §"Validation Architecture" (REQ-V04 covered by `checkpoint:human-verify`) + §"Pitfalls Phase-3-Specific #1" (cross-center scale dip) |
| A11Y-05 | Product-UI screenshot has descriptive `alt` text | §"Implementation Pattern 3" — D-13 spec-verbatim alt text reaches both choreography and static-fallback render paths |
</phase_requirements>

## Executive Summary

Phase 3 is technically straightforward but contract-heavy. Three areas need genuine research before planning, all of which this document closes:

**(1) `useTransform` per-segment easing.** Motion 12.38 supports an array of easing functions in `useTransform`'s `{ ease }` option — one ease per **segment between consecutive keyframe stops**. With 8 stops (4 stages × 2 hold-edges), there are 7 inter-stop segments — the easing array length matches that segment count. Stops at identical values (the holds at `[w[0], w[1]]` for each stage) collapse to flat `linear` segments regardless of ease, so only the 3 inter-stage morph segments (between `prev.window[1]` and `next.window[0]`) actually consume their ease curve. This is exactly the shape D-14 needs. Verified via Context7 / motion.dev docs. `[VERIFIED: motion.dev/docs/react-use-transform]`

**(2) TanStack Start `head().links` preload syntax.** TanStack Start's route `head()` config returns a `links: [{...}]` array whose objects flow through React 19's `<link>` element. **Critical gotcha:** React 19 expects camelCase `imageSrcSet` and `imageSizes` props — it serializes them to lowercase `imagesrcset` and `imagesizes` HTML attributes (the spec-required form). The CONTEXT.md D-12 example using lowercase keys directly will likely silently fail (props that don't match React's known set get warnings or are dropped depending on React's strict-mode settings). Plan must use camelCase keys. `[VERIFIED: react.dev/reference/react-dom/preload + stefanjudis.com/today-i-learned/how-to-preload-responsive-images]`

**(3) Sharp variant-generation API.** Sharp 0.34.5 (current stable, 2025-11) provides `.avif({ quality, effort })`, `.webp({ quality, effort })`, `.png({ compressionLevel })`. Recommended settings for screenshot content: AVIF `{ quality: 60, effort: 4 }`, WebP `{ quality: 78, effort: 4 }`, PNG `{ compressionLevel: 9 }`. The script must be idempotent (skip outputs newer than input mtime), preserve sRGB color profile via `sharp.withMetadata()`, and use `.resize(width, null)` (height auto-computed to maintain 16:10 ratio). Source asset preserved at `public/hero/profiles-screen.png`. `[VERIFIED: sharp.pixelplumbing.com/api-output via Context7]`

**Beyond those three:** the cascade impact on existing tests is well-defined (six test files need surgical updates, exact line ranges in §"Cascade Impact"), the PaperBackdrop intra-stage const retune has clean first-pass values (§"PaperBackdrop Cascade Retune"), and three open questions (`OQ-01`/`OQ-02`/`OQ-03`) warrant `checkpoint:human-verify` gates rather than blocking research.

**Primary recommendation:** Plan as **3 waves**: Wave 0 (test stubs that fail loudly + sharp devDep + run gen-hero-images once + commit variants), Wave 1 (parallel: `SCREEN_TARGETS` runtime + `<ProductScreen>` rewire | `<picture>` element + alt text | `index.tsx` head() preload + section-height retune + PaperBackdrop const retune), Wave 2 (test cascade updates + `checkpoint:human-verify` for D-17 midstate scrub review + smoke LCP check). The 8-stop `useTransform` is the load-bearing primitive; everything else is stage geometry, image plumbing, and test bookkeeping.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Scroll-driven keyframe stitching | Browser / Client | — | Motion values + `useTransform` are pure-client (consume `scrollYProgress`); SSR renders static end-state markup only |
| `<picture>` element format negotiation | Browser / Client | — | Browser-side capability detection; AVIF support detection happens in the user's browser |
| LCP `<link rel="preload">` injection | Frontend Server (SSR) | — | TanStack Start's `head()` runs at SSR; the `<link>` reaches the document `<head>` BEFORE `<ProductScreen>` mounts client-side. Critical for LCP |
| Variant image generation | Build-time / Static | — | sharp script runs in Node CLI offline; outputs commit to repo; CDN serves them as static assets |
| sharp script execution | Build-time / Static | — | Manual `pnpm gen:hero-images` ahead of commit; not a CI step (D-10 dictates manual + commit) |
| Alt text on `<img>` | Frontend Server (SSR) + Browser | — | Same alt text in both render paths (choreography + static-fallback); SSR-rendered HTML carries it |
| `pointer-events-none` on outer wrapper | Browser / Client | — | CSS-only; no SSR/runtime decision |

**Why this matters:** Phase 3 splits cleanly across three tiers. The planner must place the LCP preload tasks at the *route head* layer (server-rendered), the `<picture>` and `useTransform` tasks at the *component* layer (client), and the variant generation at the *build-time* layer (no app code). Mis-tiering causes LCP regressions (e.g., if the preload were inside `<ProductScreen>` instead of the route head, it would run AFTER the component mounted — too late to be useful).

## Implementation Patterns

### Pattern 1: 8-Stop `useTransform` Stitching with Per-Segment Easing

**What:** A single `useTransform(scrollYProgress, stops, values, { ease })` call per axis. With 8 stops there are 7 inter-stop segments; the `ease` option accepts an array of 7 easing functions, one per segment.

**Source:** [motion.dev/docs/react-use-transform — Options > ease](https://motion.dev/docs/react-use-transform) `[VERIFIED: motion.dev]` + [motion.dev/docs/animate — Options > ease](https://motion.dev/docs/animate) (`useTransform` and `animate` share ease semantics).

> *"The ease option accepts an easing function or array of easing functions to ease the mixing between each value."*

**Why an array of eases:** The CONTEXT.md D-14 spec calls for distinct easing per morph (hero→wow vs wow→feature-a vs fA→fB). With per-segment eases, hold segments (where stop values are identical) get a "linear" ease that has no visible effect, while morph segments get the cubic-bezier curves D-14 specifies.

**The 8-stop / 7-segment shape:**

```ts
// stages.ts — STAGES retuned to D-02 (8 stops total via flatMap):
// hero[0]=0, hero[1]=0.10, wow[0]=0.20, wow[1]=0.55,
// fA[0]=0.65, fA[1]=0.78, fB[0]=0.85, fB[1]=1.00

// Segments (7 total):
// 0: 0     → 0.10  (hero hold)        — linear no-op
// 1: 0.10  → 0.20  (hero→wow morph)   — D-14: [0.32, 0, 0.67, 1] (scale)
// 2: 0.20  → 0.55  (wow hold)         — linear no-op
// 3: 0.55  → 0.65  (wow→fA morph)     — D-14: [0.4, 0, 0.2, 1]
// 4: 0.65  → 0.78  (fA hold)          — linear no-op
// 5: 0.78  → 0.85  (fA→fB morph)      — easeInOut for x; cubicBezier for scale dip
// 6: 0.85  → 1.00  (fB hold)          — linear no-op
```

**Implementation sketch:**

```ts
// product-screen.tsx (Phase 3 rewire)
import { motion, useTransform } from "motion/react"
import { cubicBezier } from "motion"
import { useScrollChoreography } from "./context"
import { STAGES, SCREEN_TARGETS } from "./stages"

// D-14: per-segment easing curves — first-pass; tunable at human-verify (D-17)
const EASE_HERO_TO_WOW = cubicBezier(0.32, 0, 0.67, 1)
const EASE_WOW_TO_FA = cubicBezier(0.4, 0, 0.2, 1)
const LINEAR = (t: number) => t // hold-segment no-op

// 8-stop scroll progress array: [hero[0], hero[1], wow[0], wow[1], fA[0], fA[1], fB[0], fB[1]]
const STOPS = STAGES.flatMap((s) => [s.window[0], s.window[1]])

// Per-axis value arrays — each stage contributes [target, target] (the hold)
const SCALE_VALUES = STAGES.flatMap((s) => {
  const v = SCREEN_TARGETS[s.screen].scale
  return [v, v]
})
// → [0.55, 0.55, 1.00, 1.00, 0.50, 0.50, 0.50, 0.50]

const X_VALUES = STAGES.flatMap((s) => {
  const v = SCREEN_TARGETS[s.screen].x
  return [v, v]
})
// → ["0", "0", "0", "0", "-28vw", "-28vw", "+28vw", "+28vw"]

const OPACITY_VALUES = STAGES.flatMap((s) => {
  const v = SCREEN_TARGETS[s.screen].opacity
  return [v, v]
})
// → [0, 0, 1, 1, 1, 1, 1, 1]

// Per-axis ease arrays (7 entries each — one per segment)
const SCALE_EASES = [LINEAR, EASE_HERO_TO_WOW, LINEAR, EASE_WOW_TO_FA, LINEAR, EASE_FA_TO_FB_SCALE, LINEAR]
const X_EASES     = [LINEAR, "easeOut",        LINEAR, EASE_WOW_TO_FA, LINEAR, "easeInOut",          LINEAR]
const OPACITY_EASES = [LINEAR, "easeOut",      LINEAR, LINEAR,         LINEAR, LINEAR,               LINEAR]

export function ProductScreen() {
  const { scrollYProgress } = useScrollChoreography()

  const scale = useTransform(scrollYProgress, STOPS, SCALE_VALUES, { ease: SCALE_EASES })
  const x = useTransform(scrollYProgress, STOPS, X_VALUES, { ease: X_EASES })
  const opacity = useTransform(scrollYProgress, STOPS, OPACITY_VALUES, { ease: OPACITY_EASES })

  // ... <picture> render
}
```

**`[VERIFIED: motion.dev/docs/react-use-transform]`** — confirmed both:
- `useTransform({ ease })` accepts an array of easing functions per segment
- Named easings (`"easeOut"`, `"easeInOut"`) and `cubicBezier(p1x, p1y, p2x, p2y)` from `motion` package are both supported
- Easing functions must be JavaScript functions; named string easings resolve to motion's built-in functions

**Performance note:** Motion processes 8-stop arrays via the same internal `mix()` pipeline as 4-stop arrays — there is no quadratic blow-up. Each frame, motion finds the active segment via binary-or-linear scan over `STOPS`, then mixes between the two adjacent values using the segment's ease. **`[ASSUMED]`** This is the documented behavior; an explicit benchmark vs 4-stop has not been published. The Phase 2 PaperBackdrop already uses 4-stop arrays without re-render impact (verified by `choreography-rerender-budget.test.tsx`); 8-stop should behave equivalently.

**Pitfall: scale-dip on fA→fB.** The fA→fB segment (stops 5–6) has identical scale endpoints (`0.5 → 0.5`), which would normally render as a flat hold. To produce D-16's mid-morph scale dip (~0.45 at midpoint), there are two options:
- **Option A (recommended):** Add a third "virtual" stop at the midpoint `(0.78 + 0.85) / 2 = 0.815` with value `0.45`. This means scale's STOPS array has 9 entries instead of 8 (the dip injects an extra mid-morph stop). x and opacity remain at 8 stops. Document this asymmetry as a named local const.
- **Option B:** Use a custom JS easing function (not a cubicBezier) that returns a non-monotonic curve — produces the dip via the ease math alone. Harder to read; harder to test. Reject.

Recommend **Option A** with a named const `FA_TO_FB_SCALE_DIP_PROGRESS = 0.815` and `FA_TO_FB_SCALE_DIP_VALUE = 0.45` per D-13's named-const convention.

**Confidence:** HIGH for the per-segment ease pattern. MEDIUM for Option A's asymmetric stop count being lint-clean against the existing `migrate-03-keyframe-binding.test.ts` AST walker (it asserts every keyframe entry is a STAGES ref or named const — Option A's named const is allowed).

### Pattern 2: sharp Variant Generation Script

**What:** A standalone Node ES-module script at `scripts/gen-hero-images.mjs` reads `public/hero/profiles-screen.png` and writes 12 variants. Idempotent: skips outputs newer than the input mtime.

**Source:** [sharp.pixelplumbing.com/api-output](https://sharp.pixelplumbing.com/api-output) via Context7 `[VERIFIED]`. Sharp 0.34.5 is the current stable (2025-11-06 release).

**API surface used:**

| Method | Options used | Notes |
|--------|--------------|-------|
| `sharp(input)` | `{ failOnError: true }` | Default behavior; throws on malformed PNG. |
| `.resize(width, null)` | `{ withoutEnlargement: true }` | `null` height = preserve aspect ratio. `withoutEnlargement` skips upscale (1600 source → 1600 output is the hard cap). |
| `.avif(opts)` | `{ quality: 60, effort: 4 }` | Quality 60 is the AVIF sweet spot for photographic content per common image-optimization guides. Effort 4 is sharp's default; effort 9 is ~3× slower for ~5% size win. |
| `.webp(opts)` | `{ quality: 78, effort: 4 }` | Quality 78 = visually-lossless for screenshot content. Default effort 4. |
| `.png(opts)` | `{ compressionLevel: 9 }` | Zlib max compression (the source PNG is 134KB; output is comparable). |
| `.withMetadata(opts)` | (none) | Preserves sRGB color profile. The source PNG is 8-bit/color RGB (verified via `file` command); without `.withMetadata()`, sharp strips the profile and downstream browsers may render colors differently. |
| `.toFile(outputPath)` | — | Writes the variant. |

**Recommended quality settings (recommendation; first-pass tunable):**

| Format | Quality | Effort | Rationale |
|--------|---------|--------|-----------|
| AVIF | 60 | 4 | Sweet spot for screenshot-quality content; produces ~25–35% smaller files than WebP at quality 78. |
| WebP | 78 | 4 | Visually lossless for UI screenshots with text; sharp's default 80 is fine; 78 sheds ~5% with no perceptible loss. |
| PNG | (compressionLevel 9) | — | Maximum zlib compression. PNG is the legacy fallback; size matters less. |

`[CITED: sharp.pixelplumbing.com/api-output]` — quality and effort defaults; `[ASSUMED]` — that 60/78 are the right values for *this* screenshot. The user may want to compare AVIF quality 50 vs 60 vs 70 visually before committing. Recommend Plan task to surface the quality settings as named consts at the top of the script so a 1-line change re-runs the script with new settings.

**Idempotency strategy (recommended):**

```js
import { existsSync, statSync } from "node:fs"

function shouldRegenerate(inputPath, outputPath) {
  if (!existsSync(outputPath)) return true
  const inputMtime = statSync(inputPath).mtimeMs
  const outputMtime = statSync(outputPath).mtimeMs
  return inputMtime > outputMtime
}

// In the loop:
if (!shouldRegenerate(SOURCE_PNG, outputPath)) {
  console.log(`✓ skip ${outputPath} (up to date)`)
  continue
}
```

This keeps repeated `pnpm gen:hero-images` runs cheap during development; only changed source PNGs trigger regeneration.

**Script skeleton:**

```js
// scripts/gen-hero-images.mjs
import sharp from "sharp"
import { existsSync, statSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { dirname, resolve } from "node:path"

const __dirname = dirname(fileURLToPath(import.meta.url))
const SOURCE = resolve(__dirname, "..", "public", "hero", "profiles-screen.png")
const OUT_DIR = resolve(__dirname, "..", "public", "hero")
const WIDTHS = [640, 960, 1280, 1600]
const FORMATS = [
  { ext: "avif", method: "avif", opts: { quality: 60, effort: 4 } },
  { ext: "webp", method: "webp", opts: { quality: 78, effort: 4 } },
  { ext: "png",  method: "png",  opts: { compressionLevel: 9 } },
]

function shouldRegenerate(inPath, outPath) {
  if (!existsSync(outPath)) return true
  return statSync(inPath).mtimeMs > statSync(outPath).mtimeMs
}

for (const width of WIDTHS) {
  for (const { ext, method, opts } of FORMATS) {
    const outPath = resolve(OUT_DIR, `profiles-screen-${width}.${ext}`)
    if (!shouldRegenerate(SOURCE, outPath)) {
      console.log(`✓ skip ${outPath}`)
      continue
    }
    await sharp(SOURCE)
      .resize(width, null, { withoutEnlargement: true })
      .withMetadata() // preserve sRGB
      [method](opts)
      .toFile(outPath)
    console.log(`✓ wrote ${outPath}`)
  }
}
```

**Dev workflow (per D-10 default — manual + commit, no `prebuild` hook):**

1. Designer edits `public/hero/profiles-screen.png` (the source).
2. Developer runs `pnpm gen:hero-images` — 12 variants regenerate.
3. Developer commits both the source PNG AND all 12 variants in one commit.
4. CI / Vercel build does NOT regenerate; uses the committed variants verbatim.

**Why no `prebuild` hook:** sharp's first-time native-binary install adds ~3s to `pnpm install`; the 12-variant generation adds ~2–4s on every CI run. With manual + commit, neither cost is paid by CI or by other developers' `pnpm install` runs. The cost reappears only when *this* developer regenerates.

**Confidence:** HIGH for the API surface (Context7-verified). MEDIUM for the recommended quality settings (general guidance from web.dev image-optimization corpus; final tuning is visual taste, defer to human-verify).

### Pattern 3: `<picture>` Element + Browser-Frame Chrome

**What:** `<ProductScreen>`'s inner `motion.div` (the one that scales) wraps a `<picture>` with three `<source>` and one fallback `<img>`. The browser-frame chrome (Mac dots + URL bar) wraps the `<picture>` per D-18.

**Source:** [MDN — `<picture>` element](https://developer.mozilla.org/docs/Web/HTML/Element/picture) `[CITED]` + [web.dev — Preload responsive images](https://web.dev/articles/preload-responsive-images) `[CITED]`.

**Concrete render shape:**

```tsx
<motion.div
  aria-hidden
  className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center px-4 sm:px-10 lg:px-16"
  style={{ opacity, x }}
>
  <motion.div
    className="relative w-full max-w-[1280px] overflow-hidden rounded-2xl border border-black/10 bg-white shadow-[0_30px_120px_-40px_rgb(15_23_42/0.45)]"
    style={{ scale }}
  >
    {/* D-18: Mac-style chrome — preserved verbatim from Phase 2 */}
    <div className="flex items-center gap-2 border-b border-black/5 bg-[#f7f7f5] px-4 py-2.5">
      <span className="size-3 rounded-full bg-[#ff5f57]" />
      <span className="size-3 rounded-full bg-[#febc2e]" />
      <span className="size-3 rounded-full bg-[#28c840]" />
      <span className="ml-4 truncate text-xs text-black/55">
        {TEACHER_WORKSPACE_APP_URL.replace("https://", "")}
      </span>
    </div>
    {/* D-10/D-11/D-13: <picture> with three <source> */}
    <picture>
      <source
        srcSet="/hero/profiles-screen-640.avif 640w, /hero/profiles-screen-960.avif 960w, /hero/profiles-screen-1280.avif 1280w, /hero/profiles-screen-1600.avif 1600w"
        sizes="(min-width:1280px) 1280px, 100vw"
        type="image/avif"
      />
      <source
        srcSet="/hero/profiles-screen-640.webp 640w, /hero/profiles-screen-960.webp 960w, /hero/profiles-screen-1280.webp 1280w, /hero/profiles-screen-1600.webp 1600w"
        sizes="(min-width:1280px) 1280px, 100vw"
        type="image/webp"
      />
      <img
        src="/hero/profiles-screen-1280.png"
        srcSet="/hero/profiles-screen-640.png 640w, /hero/profiles-screen-960.png 960w, /hero/profiles-screen-1280.png 1280w, /hero/profiles-screen-1600.png 1600w"
        sizes="(min-width:1280px) 1280px, 100vw"
        alt="Teacher Workspace student view showing attendance, behavior notes, and family messages"
        loading="eager"
        decoding="async"
        className="block h-auto w-full select-none"
      />
    </picture>
  </motion.div>
</motion.div>
```

**Critical: React 19 attribute names.** React 19 expects camelCase JSX props (`srcSet`, not `srcset`). React serializes them to lowercase HTML attributes correctly. **Do NOT use `srcset` (lowercase) in JSX** — React will warn and may drop the prop.

**Critical: `sizes` attribute reasoning.**

The `sizes="(min-width:1280px) 1280px, 100vw"` attribute tells the browser: "when the viewport is ≥1280px wide, the rendered image takes 1280px; otherwise it takes 100% of the viewport width."

The user's question (from research scope) — *does CSS `transform: scale()` affect the `sizes` calculation?* — answer: **No.** Per HTML spec, `sizes` describes the **layout-box width** (i.e., the rendered CSS box before transforms). CSS `transform` is purely visual; it does not change layout-box dimensions. The browser picks the variant based on the layout-box width × DPR, then scales the *bitmap* via the transform. So:

- At wow stage (scale 1.0), the layout box is `max-w-[1280px]` → sizes value 1280px → browser picks the 1280w variant on a 1× display, or 1600w on a Retina (2×) display.
- At docked stages (scale 0.5), the layout box is *still* `max-w-[1280px]` (CSS scale doesn't shrink the box) → browser picks the 1280w/1600w variant. The transform then visually shrinks it to half-width.

This means **the same image variant is downloaded regardless of stage** — there's no opportunity to shed bytes by serving a smaller variant when docked. That's correct behavior: switching `srcset` based on JS state would re-trigger image decode mid-scroll (jank). The download-once-display-many model is what `<picture>` is designed for.

**`sizes` MUST match between `<picture>` and preload.** Per web.dev, the `sizes` value on `<source>` and `<img>` must be **byte-identical** to the `imagesizes` value on the `<link rel="preload">` for the preloaded variant to match the variant the browser actually uses. CONTEXT.md D-12 has this right (`(min-width:1280px) 1280px, 100vw` in both places); the planner must enforce this contract via a code comment in *both* the `head()` config AND the `<picture>` element.

**`[CITED: web.dev/articles/preload-responsive-images]`**:
> *"For the preloaded image to match the variant chosen by `<picture>`, the `imagesizes` attribute on the preload must match the `sizes` attribute on the `<source>` and `<img>`."*

**Confidence:** HIGH for the `<picture>` semantics. HIGH for the React 19 prop-name camelCase requirement. HIGH for the `sizes` matching rule.

### Pattern 4: TanStack Start `head()` Preload Link Syntax

**What:** `routes/index.tsx` uses `createFileRoute("/")({ head: () => ({ links: [...] }) })` to inject one `<link rel="preload">` for the AVIF variant set into the route's `<head>`. Lives only on `/`, not in `__root.tsx`.

**Source:** [TanStack Start Routing guide](https://tanstack.com/start/latest/docs/framework/react/guide/routing) `[CITED]` via Context7.

**Critical gotcha — React 19 attribute name handling:**

React 19's `<link>` component accepts the following props for image preloads (per [react.dev/reference/react-dom/preload](https://react.dev/reference/react-dom/preload) `[VERIFIED]`):

| React prop (camelCase) | Serialized HTML attribute (lowercase) |
|------------------------|---------------------------------------|
| `imageSrcSet` | `imagesrcset` |
| `imageSizes` | `imagesizes` |
| `fetchPriority` | `fetchpriority` |
| `crossOrigin` | `crossorigin` |
| `as` | `as` |
| `rel` | `rel` |
| `type` | `type` |
| `href` | `href` |

**TanStack Start's `head().links` array is rendered through React 19's `<HeadContent />` component** (see `__root.tsx`'s `RootDocument`). That means the keys in each link object are React props, NOT raw HTML attributes. The CONTEXT.md D-12 example writes `imagesrcset` and `imagesizes` (lowercase) — **that is wrong for React 19**. The correct syntax:

```ts
// routes/index.tsx (Phase 3)
export const Route = createFileRoute("/")({
  component: HomePage,
  head: () => ({
    links: [
      {
        rel: "preload",
        as: "image",
        fetchPriority: "high",                                              // camelCase
        imageSrcSet:                                                         // camelCase
          "/hero/profiles-screen-640.avif 640w, /hero/profiles-screen-960.avif 960w, /hero/profiles-screen-1280.avif 1280w, /hero/profiles-screen-1600.avif 1600w",
        imageSizes: "(min-width:1280px) 1280px, 100vw",                      // camelCase
        type: "image/avif",
      },
    ],
  }),
})
```

**Why this matters:** If lowercase keys (`imagesrcset`, `imagesizes`, `fetchpriority`) are passed, React 19 either (a) warns and silently drops them or (b) renders them but generates a console warning about unknown DOM props. Either way, the preload either won't preload or will preload the wrong variant. The Plan must include a smoke-test asserting the rendered HTML contains `imagesrcset=` and `imagesizes=` attributes (lowercase, in the rendered HTML — proving React serialized the camelCase props correctly).

**Verification approach (build-into-plan):** the planner schedules a Wave 0/2 test that does:

```ts
// routes/index.head.test.tsx — NEW
import { renderToString } from "react-dom/server"
import { Route } from "./index"

it("emits link rel=preload as=image with imagesrcset and imagesizes (lowercase HTML attrs)", () => {
  const head = Route.options.head?.()
  const link = head?.links?.find((l) => l.rel === "preload")
  expect(link).toBeDefined()
  expect(link?.as).toBe("image")
  expect(link?.fetchPriority).toBe("high") // camelCase prop
  expect(link?.imageSrcSet).toContain(".avif 1280w") // camelCase prop
  expect(link?.imageSizes).toBe("(min-width:1280px) 1280px, 100vw")
  expect(link?.type).toBe("image/avif")
})
```

A second optional test renders the route via TanStack's test harness and asserts the actual HTML contains the lowercase attribute names. Phase 3 first-pass: data-shape test (above) is sufficient; HTML-rendering test is a Phase 6 concern when Lighthouse runs anyway.

**Confidence:** HIGH for the React 19 camelCase rule (multiple sources). MEDIUM for whether TanStack Start's link object schema enforces React-prop names vs raw HTML attribute names — Context7 docs show only `rel`/`href`/`type`/`sizes` examples (no preload examples), so the camelCase contract is inferred from React 19's `<link>` element behavior. The test above falsifies it cheaply.

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 3.2.4 + @testing-library/react 16.3.2 + jsdom 27.4.0 |
| Config file | `vitest.config.ts` |
| Setup file | `vitest.setup.ts` (Phase 1 reuse) |
| Quick run command | `pnpm test src/components/landing/scroll-choreography/` |
| Full suite command | `pnpm test` |
| Single-file run | `pnpm test src/components/landing/scroll-choreography/product-screen.test.tsx` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|--------------|
| CHOREO-03 | Wow stage holds at `centered` (scale 1.0, x 0, opacity 1) between `wow.window[0]` and `wow.window[1]` | unit | `pnpm test product-screen.test.tsx` (assert `useTransform` keyframe values at indices 2,3 = `1.00, 1.00`) | rewrite needed |
| CHOREO-04 | Feature-A stage holds at `docked-left` (scale 0.5, x -28vw, opacity 1) between `feature-a.window[0]` and `feature-a.window[1]` | unit | `pnpm test product-screen.test.tsx` (assert keyframe values at indices 4,5) | rewrite needed |
| CHOREO-05 | Feature-B stage holds at `docked-right` (scale 0.5, x +28vw, opacity 1) between `feature-b.window[0]` and `feature-b.window[1]` | unit | `pnpm test product-screen.test.tsx` (assert keyframe values at indices 6,7) | rewrite needed |
| CHOREO-05 (cross-center) | fA→fB scale dip ~0.45 at midpoint of `[0.78, 0.85]` morph | unit | `pnpm test product-screen.test.tsx` (assert named const `FA_TO_FB_SCALE_DIP_VALUE === 0.45` AND assert SCALE keyframe array contains a 9th entry between fA[1] and fB[0]) | rewrite needed |
| VISUAL-01 | UI screen retains photorealistic styling (rounded corners + subtle shadow + white bg + black/10 border) — no paper-aesthetic filter | smoke | `pnpm test product-screen.test.tsx` (assert outer wrapper has class regex `/rounded-2xl/` AND `/shadow-/` AND `/border-black/`) | partial; extend |
| VISUAL-02 | Mac-style chrome rendered: 3 colored dots + URL bar with truncated TEACHER_WORKSPACE_APP_URL | smoke | `pnpm test product-screen.test.tsx` (assert 3 spans with traffic-light bg colors AND a span containing `teacherworkspace-alpha.vercel.app`) | rewrite needed |
| VISUAL-03 | `<picture>` renders with 3 `<source>` (avif/webp/png-fallback) + sizes match | unit | `pnpm test product-screen.test.tsx` (querySelectorAll('source').length === 2; img with srcset; sizes contains '(min-width:1280px)') | rewrite needed |
| VISUAL-03 (preload) | Index route head emits `<link rel="preload" as="image">` with imageSrcSet, imageSizes, fetchPriority="high", type="image/avif" | unit | `pnpm test routes/index.head.test.tsx` (Route.options.head() returns links array containing the preload object) | NEW file |
| VISUAL-04 | 25/50/75 of every transition reads as intentional (no broken layout, no half-cropped UI) | manual | `checkpoint:human-verify` — Plan task: scrub via `pnpm dev` + Chrome DevTools "Show timing graph" or arrow-key scroll | N/A |
| A11Y-05 | `<img>` carries `alt="Teacher Workspace student view showing attendance, behavior notes, and family messages"` | unit | `pnpm test product-screen.test.tsx` (assert img alt === D-13 verbatim string) | rewrite needed |
| A11Y-05 (static parity) | StaticChoreographyFallback's image (via PaperHero in Phase 3) eventually carries the same alt — Phase 5 owns refactor | manual + smoke | (deferred — note it as Phase 5 carry-over) | N/A |

### Sampling Rate

- **Per task commit:** `pnpm test src/components/landing/scroll-choreography/` (~6 test files, expected runtime <5s on a warm cache)
- **Per wave merge:** `pnpm test && pnpm typecheck && pnpm lint`
- **Phase gate:** Full suite green + `checkpoint:human-verify` (D-17) signed off + LCP smoke check via `pnpm preview` + manual DevTools Network panel

### Per-Criterion Pass/Fail Detail

#### REQ CHOREO-03 — Wow stage centered hold

**Pass:** `useTransform`'s keyframe array contains `[…, SCREEN_TARGETS.centered.scale, SCREEN_TARGETS.centered.scale, …]` at indices [2, 3] (the wow window edges). Visual verification: at `scrollYProgress.set(0.35)` (midpoint of `[0.20, 0.55]`) the rendered transform style contains `scale(1)`.

**Fail:** keyframe at index 2 ≠ keyframe at index 3 (no hold), or value !== 1.00.

**Command:**
```ts
// product-screen.test.tsx (Phase 3 rewrite, partial)
it("CHOREO-03: wow stage holds at centered scale 1.0", () => {
  const scaleStops = SCREEN_TARGETS_SCALE_VALUES // exported for testing OR computed by walking STAGES
  expect(scaleStops[2]).toBe(1.00)
  expect(scaleStops[3]).toBe(1.00)
})
```

#### REQ CHOREO-04 — Feature-A docked-left hold

**Pass:** keyframe arrays at indices [4, 5]: scale=0.5, x="-28vw", opacity=1.0. At `scrollYProgress.set(0.715)` (midpoint of `[0.65, 0.78]`), rendered transform contains `scale(0.5) translateX(-28vw)`.

**Fail:** values at 4 ≠ values at 5; OR x sign positive (would put screen on RIGHT).

#### REQ CHOREO-05 — Feature-B docked-right hold + cross-center dip

**Pass (hold):** keyframe arrays at indices [6, 7]: scale=0.5, x="+28vw", opacity=1.0.

**Pass (dip):** SCALE keyframe array has a 9th entry between fA.window[1]=0.78 and fB.window[0]=0.85 with value 0.45 ± 0.05.

**Fail:** scale array length === 8 (no dip injected); OR dip value < 0.40 (legibility floor).

#### REQ VISUAL-01 — Tonal contrast preserved

**Pass:** the inner `motion.div` has class string matching `/rounded-2xl/` AND `/shadow-\[/` AND `/border-black/` AND `/bg-white/`. The browser-frame chrome bg is `[#f7f7f5]` (light off-white). NO Tailwind class containing `paper-` or `text-paper-ink` on the inner motion.div or its descendants.

**Fail:** the screenshot is wrapped in a `bg-paper-card` class (would flatten to paper aesthetic).

**Command:**
```ts
it("VISUAL-01: photorealistic styling preserved", () => {
  const inner = container.querySelector("img[alt^='Teacher Workspace']")?.closest(".rounded-2xl")
  expect(inner?.className).toMatch(/rounded-2xl/)
  expect(inner?.className).toMatch(/shadow-/)
  expect(inner?.className).not.toMatch(/bg-paper-/)
})
```

#### REQ VISUAL-02 — Browser-frame chrome present

**Pass:** 3 `<span>` elements with class strings matching the 3 traffic-light hex colors `[#ff5f57]`, `[#febc2e]`, `[#28c840]`. URL bar contains the truncated `TEACHER_WORKSPACE_APP_URL.replace("https://", "")` text.

**Fail:** any of the 3 dot spans missing; URL bar absent.

#### REQ VISUAL-03 — Responsive `<picture>` + LCP preload

**Pass (picture):** rendered DOM contains `<picture>` with exactly 2 `<source>` elements (avif and webp; png is the `<img>` fallback) plus 1 `<img>`. Each `<source>` has `srcset` matching `/profiles-screen-\d+\.(avif|webp) \d+w/` and `sizes` === `(min-width:1280px) 1280px, 100vw`.

**Pass (preload):** `Route.options.head()` returns `{ links: [{ rel: "preload", as: "image", fetchPriority: "high", imageSrcSet: <avif srcset>, imageSizes: "(min-width:1280px) 1280px, 100vw", type: "image/avif" }] }`.

**Fail (smoke):** Network panel during `pnpm preview` does NOT show `profiles-screen-*.avif` requested at high priority before the JS bundle.

**Manual smoke (Phase 6 owns formal Lighthouse; Phase 3 ships a quick check):**
```bash
pnpm build && pnpm preview
# In Chrome DevTools → Network → reload
# Expect: profiles-screen-1280.avif (or 1600.avif on retina) loaded with Priority: High
# Expect: Initiator column shows the <link rel="preload"> from index.html
# Expect: LCP element in Performance Insights = the <img> (not the hero video poster)
```

#### REQ VISUAL-04 — 25/50/75 midstates intentional

**Pass:** at `checkpoint:human-verify`, user scrubs via arrow-key scroll through the 3 morph zones: `[0.10, 0.20]`, `[0.55, 0.65]`, `[0.78, 0.85]`. At each of 25%, 50%, 75% of each morph, the screenshot reads as a coherent intermediate state (no half-rendered UI, no orphan box-shadow seams, no overlap with paper card except by design).

**Fail:** any midstate looks broken; user reports specific scroll progress and the planner schedules an ease-tuning task.

**Command:** Manual; not CLI-verifiable. The plan must include a `checkpoint:human-verify` task with the criterion above written verbatim.

#### REQ A11Y-05 — Alt text spec-verbatim

**Pass:** `<img>` element's `alt` attribute === `"Teacher Workspace student view showing attendance, behavior notes, and family messages"` exactly (D-13).

**Fail:** alt missing, alt === Phase 2's `"Teacher Workspace student insights dashboard"` (the placeholder), or alt mutated.

### Wave 0 Gaps

- [x] `src/components/landing/scroll-choreography/product-screen.test.tsx` — exists; needs **major rewrite** (Phase 2's hero→wow assertions all fail under D-02 retune)
- [x] `src/components/landing/scroll-choreography/stages.test.ts` — exists; needs **update** (assert new STAGES windows + assert SCREEN_TARGETS shape + values)
- [x] `src/components/landing/scroll-choreography/paper-backdrop.test.tsx` — exists; video-gate threshold expectation auto-updates (uses `byId("wow").window[1]` in the test); intra-stage const test assertions need update
- [x] `src/components/landing/scroll-choreography/migrate-03-keyframe-binding.test.ts` — exists; will GREEN unchanged (its AST walker is data-driven; passes if every keyframe entry is a STAGES ref or named const, regardless of values)
- [x] `src/components/landing/scroll-choreography/scroll-choreography.test.tsx` — exists; **update** (assert `h-[400lvh]` not `h-[280lvh]`)
- [ ] `src/routes/index.head.test.tsx` — NEW; assert `Route.options.head()` returns the preload link object with the correct camelCase keys
- [ ] `scripts/gen-hero-images.test.mjs` — NEW (optional); idempotency smoke: run script twice, assert no rewrites on second run. Not blocking — script is offline tooling

**Test framework install:** none — vitest already configured in Phase 1.

## Cascade Impact on Existing Tests

The D-02 STAGES window retune and D-09 section height retune will break exactly the tests below. Each entry lists the file, the assertion that breaks, the line range, and the surgical update needed.

### `src/components/landing/scroll-choreography/stages.test.ts`

| Line | Current assertion | Cascade | Update needed |
|------|-------------------|---------|---------------|
| L43-49 | `expect(byId("wow").window[1]).toBeCloseTo(0.78, 2)` | **FAIL** — D-02 retunes to 0.55 | Replace with `0.55`; update Phase 2 D-14 reference comment to Phase 3 D-02 |
| L17-22 | `for (const stage of STAGES) { ... start < end ... }` | **PASS** — invariant survives | none |
| L25-31 | `expect(screens).toContain("tiny" | "centered" | "docked-left" | "docked-right")` | **PASS** — values unchanged | none |
| L33-36 | `expect(byId("hero").screen).toBe("tiny")` | **PASS** | none |
| (NEW) | — | — | Add: `it("STAGES windows are monotonic non-overlapping (D-02)", ...)` — verify each `s[i+1].window[0] >= s[i].window[1]` |
| (NEW) | — | — | Add: `it("SCREEN_TARGETS map shape matches D-08 values (D-04)", ...)` — assert each rect's `scale`, `x`, `y`, `opacity` |

### `src/components/landing/scroll-choreography/paper-backdrop.test.tsx`

| Line | Current assertion | Cascade | Update needed |
|------|-------------------|---------|---------------|
| L78-79 | `scrollYProgress.set(byId("wow").window[1] + 0.01)` | **PASS** — uses `byId(...)` accessor | none (auto-tracks D-21) |
| L83-84 | `scrollYProgress.set(byId("wow").window[1] + 0.05)` | **PASS** — uses `byId(...)` accessor | none |
| L98-104 | `scrollYProgress.set(0.3); ... 0.5; ... 0.7` (currentTime never written) | **PASS** — values irrelevant to the spy | none |
| L112 | `renderWithMockProgress(byId("wow").window[1])` | **PASS** — uses `byId(...)` accessor | none |
| (NEW) | — | — | Add: assertions for D-20 retuned consts. Either (a) export the consts from `paper-backdrop.tsx` for testing, or (b) test the visible inline-style result at specific scroll progresses (e.g., at `0.55`, opacity should be 0; at `0.45`, opacity should be 1). Recommend (b) — observable behavior over private internals. |

**Risk:** if D-20's first-pass values (`0.45`/`0.55`) prove wrong at human-verify, both the consts AND the test thresholds need updating together.

### `src/components/landing/scroll-choreography/product-screen.test.tsx`

**Treat this file as a full rewrite.** Phase 2 stub asserted hero→wow only; Phase 3 needs all 4 stages + cross-center dip + `<picture>` element.

| Line | Current assertion | Cascade | Update needed |
|------|-------------------|---------|---------------|
| L43-60 | mount-stability across `[0.1, 0.3, 0.5, 0.7, 0.95]` | **PASS** — invariant unchanged (CHOREO-01) | keep verbatim — proves shared element survives |
| L62-78 | inline style contains `transform|scale` and `opacity` | **PASS** but weak | extend to assert `x` (translateX) is also present |
| L80-89 | renders `profiles-screen.png` (single src) AND no `data-stage='feature-a'/'feature-b'` markers | **FAIL on src** — Phase 3 renders `<picture>` with `profiles-screen-1280.png` fallback (path changed). The `data-stage` assertions are still valid (ProductScreen does not emit per-stage markers; copy track does — that's Phase 4) | update src to `/hero/profiles-screen-1280.png` (the `<img>` fallback inside `<picture>`); keep no-data-stage assertion |
| L91-100 | no `layoutId` attribute | **PASS** | none |
| (NEW) | — | — | Add: `<picture>` exists, has 2 `<source>` (avif + webp), `<img>` carries D-13 alt text |
| (NEW) | — | — | Add: scale at `scrollYProgress = 0.35` ≈ 1.00 (wow stage); at `0.715` ≈ 0.5 (fA); at `0.925` ≈ 0.5 (fB) |
| (NEW) | — | — | Add: x at `0.715` ≈ "-28vw"; at `0.925` ≈ "+28vw" |
| (NEW) | — | — | Add: SCALE keyframe array has 9 entries (8 stage edges + 1 mid-morph dip per Pattern 1 Option A) |

### `src/components/landing/scroll-choreography/migrate-03-keyframe-binding.test.ts`

**Should PASS unchanged.** The AST walker validates every `useTransform` keyframe entry is `0`, `1`, an Identifier (named const), or a MemberExpression (STAGES ref / byId ref). Phase 3's new keyframe arrays will be:
- `STOPS` — built via `STAGES.flatMap(...)` — each entry resolves to `MemberExpression`. AST check passes.
- `SCALE_VALUES` / `X_VALUES` / `OPACITY_VALUES` — built via `STAGES.flatMap(s => SCREEN_TARGETS[s.screen][axis])` — each entry resolves to `MemberExpression`. AST check passes.
- The mid-morph dip stop is a named local const. AST check passes.

**One risk:** if the planner inlines the SCALE_VALUES expansion as a literal array `[0.55, 0.55, 1.0, 1.0, 0.5, 0.5, 0.5, 0.5]` for clarity, those literals are NOT 0 or 1 → test FAILS. Solution: insist on the `flatMap`-generated form per D-04 ("data-driven from SCREEN_TARGETS").

### `src/components/landing/scroll-choreography/scroll-choreography.test.tsx`

| Line | Current assertion | Cascade | Update needed |
|------|-------------------|---------|---------------|
| L125 | `expect(sectionClass).toMatch(/h-\[280lvh\]/)` | **FAIL** — D-09 retunes to `h-[400lvh]` | Replace `280lvh` with `400lvh` |
| L92-110 | `useScroll` called with `layoutEffect: false` | **PASS** | none |
| L55-89 | mode-switch matrix | **PASS** | none |
| L113-135 | outer container shape | **PASS** | none after L125 update |

### `src/components/landing/scroll-choreography/choreography-rerender-budget.test.tsx`

**PASS unchanged.** The 0–2 re-renders / 100 motion-value updates budget is invariant under D-02/D-09 — the test mocks `useScroll`, so STAGES values don't affect re-render counts.

**Total cascade work:** 4 test files require surgical edits (2 single-line, 2 multi-line); 1 needs a major rewrite (`product-screen.test.tsx`); 1 NEW file (`routes/index.head.test.tsx`); 2 files PASS unchanged.

## PaperBackdrop Cascade Retune

CONTEXT.md D-20 requires the planner to retune `paper-backdrop.tsx`'s intra-stage timing consts so the paper card finishes fading exactly when the wow stage ends. Phase 2 values were tuned against `wow.window = [0.20, 0.78]`; Phase 3 retunes the wow window to `[0.20, 0.55]`, so the consts shift accordingly.

### Phase 2 values (current — `paper-backdrop.tsx` L48-57)

```ts
const STAGE_SCALE_MID_PROGRESS = 0.6
const STAGE_SCALE_MID_VALUE = 2.4
const STAGE_SCALE_END_VALUE = 5.2
const STAGE_OPACITY_FADE_START = 0.6
const STAGE_OPACITY_FADE_END = 0.78
```

These are used by:
```ts
const stageScale = useTransform(scrollYProgress, [0, 0.6, 1], [1, 2.4, 5.2])
const stageOpacity = useTransform(scrollYProgress, [0.6, 0.78], [1, 0])
```

**Phase 2 visual intent:** paper card scales and fades during the second half of scroll progress, finishing the fade exactly when the wow window's exit edge (`0.78`) is crossed. This is the moment the product screen visually covers the paper world.

### Phase 3 first-pass values (recommendation)

The wow window's exit edge becomes `0.55`. The paper card must finish fading by `0.55`. The fade should start before that — recommend the same proportional ramp from Phase 2 (~0.18 progress units of fade, which was 0.6→0.78). Applied to the new wow window:

| Const | Phase 2 value | Phase 3 first-pass | Rationale |
|-------|--------------|--------------------|-----------|
| `STAGE_OPACITY_FADE_START` | 0.6 | **0.45** | 0.55 - 0.10 (0.10 progress units of fade — slightly tighter than Phase 2's 0.18 because the morph zone after wow is also tighter; aligns with the `[0.45, 0.55]` example CONTEXT.md D-20 cites) |
| `STAGE_OPACITY_FADE_END` | 0.78 | **0.55** | Equals `byId("wow").window[1]` — paper card finishes fading exactly when wow ends |
| `STAGE_SCALE_MID_PROGRESS` | 0.6 | **0.45** | Track the fade-start so scale and opacity are coupled |
| `STAGE_SCALE_MID_VALUE` | 2.4 | **2.4** *(unchanged)* | Visual peak of the paper-card scale-up — independent of wow window position |
| `STAGE_SCALE_END_VALUE` | 5.2 | **5.2** *(unchanged)* | Visual peak at progress 1.0 — independent of wow window position |

**Why scale END value can stay:** the `[0.45, 1.0]` range now covers `0.55` more progress (0.55 → 1.0 = 0.45 units) vs Phase 2's `[0.6, 1.0]` (0.4 units). The paper-card's runaway scale-up after fade-out is invisible behind the product screen anyway — perfectly identical scale-end value is fine.

**Side-effect:** by setting `STAGE_OPACITY_FADE_END = byId("wow").window[1]`, the const becomes a duplicate of the auto-tracked `VIDEO_GATE_THRESHOLD`. Recommend the planner either (a) accept the duplication (intra-stage timing is conceptually distinct from the video gate, even if numerically equal) or (b) refactor the const to `const STAGE_OPACITY_FADE_END = byId("wow").window[1]` so it auto-tracks. **Default: (a)** — keeps the contract that intra-stage timing values are named local consts (D-13). Explicit numeric value also makes the cascade impact at human-verify obvious.

**Risk:** the `0.45 → 0.55` fade window is only 0.10 progress units (vs Phase 2's 0.18). At normal scroll speeds this should still feel smooth, but it's tighter; the human-verify checkpoint should explicitly review the fade.

**Confidence:** MEDIUM — the values are first-pass; the actual visual review is at `checkpoint:human-verify` (D-17). The planner should mark these as "first-pass; tunable" in code comments, mirroring Phase 2's pattern.

## Open Questions

### OQ-01: Cross-center scale dip — single mid-stop vs custom JS easing

**Context:** D-16 specifies a scale dip at the midpoint of the fA→fB morph. Pattern 1 above recommends Option A (a 9th stop at `0.815` with value `0.45`). An alternative is Option B (a custom JS easing function that returns a non-monotonic curve).

**Default behavior to ship:** Option A — 9th stop, named const `FA_TO_FB_SCALE_DIP_PROGRESS = 0.815`, `FA_TO_FB_SCALE_DIP_VALUE = 0.45`. Code review can verify; AST walker passes.

**Verification gate:** if at `checkpoint:human-verify` the dip reads as a "step" rather than a "smooth recess", the executor may either (i) interpolate via two extra stops (e.g., `[0.79, 0.46], [0.815, 0.45], [0.84, 0.46]`) for a softer floor, or (ii) replace with Option B. A spike (`/gsd-spike`) is the recovery path if neither (i) nor (ii) reads cleanly.

**Risk if wrong:** the cross-center morph reads as broken. Fix at human-verify or in a Phase 4 follow-up.

### OQ-02: Section height tuning — 400lvh vs 360lvh

**Context:** D-09 locks `h-[400lvh]` based on the rule-of-thumb "1 viewport per stage". With wow plateau being 35% of `400lvh = 140lvh` of scrub time and docked stages getting ~52lvh each, the relative pacing may feel off.

**Default behavior to ship:** `h-[400lvh]` per D-09.

**Verification gate:** human-verify checkpoint scrolls end-to-end. If the wow plateau feels too long (user wants to scroll past), reduce to `h-[360lvh]`. If docked stages feel too short for Phase 4's 200–300ms-staggered 3-bullet reveals (Phase 4 timing not yet known), increase to `h-[440lvh]`. Either is a 1-line change in `scroll-choreography.tsx` + a 1-line change in `scroll-choreography.test.tsx`.

**Risk if wrong:** scroll feel is off; user fatigue or rushed reveals. Pure visual-design issue, not a contract.

### OQ-03: Sharp quality settings — AVIF 60 vs 70

**Context:** Pattern 2 recommends AVIF quality 60. For UI screenshots with a lot of text, quality 70 may produce visibly cleaner glyph edges at the cost of ~25% larger files.

**Default behavior to ship:** AVIF quality 60. Plan task to surface the value as a named const at the top of `gen-hero-images.mjs` so a single-line change re-runs all 4 widths.

**Verification gate:** at human-verify, zoom to 200% on the wow stage; if AVIF artifacts on text are visible (most likely on the 640w variant scaled up), regenerate with quality 70 or 75.

**Risk if wrong:** noticeable AVIF compression artifacts in screenshots. Phase 6 Lighthouse audit will catch any LCP regression from over-quality (e.g., quality 90 producing 200KB AVIFs that are bigger than the WebP).

### OQ-04: TanStack Start `head().links` schema — does it accept React-prop names or HTML attribute names?

**Context:** Pattern 4 above asserts that `head().links[i]` uses React 19 prop names (camelCase `imageSrcSet`/`imageSizes`). This is inferred from React 19's `<link>` element behavior, not from explicit TanStack Start documentation.

**Default behavior to ship:** Use camelCase prop names (`imageSrcSet`, `imageSizes`, `fetchPriority`).

**Verification gate:** add a smoke test in Wave 0 that renders the home route via TanStack's test harness and asserts the rendered `<head>` HTML contains lowercase `imagesrcset=` and `imagesizes=` attributes. If they're missing, the prop names were wrong; switch to lowercase keys in the `head()` config OR file a TanStack Start issue. Falsify cheaply at Wave 0.

**Risk if wrong:** preload silently doesn't fire; LCP unaffected by Phase 3's optimization (still falls back to `<picture>`'s WebP/PNG). Detected at Phase 6 Lighthouse run; can be hot-fixed in Phase 5/6.

### OQ-05: 8-stop `useTransform` performance vs 4-stop

**Context:** Phase 2's PaperBackdrop uses 4-stop arrays without re-render impact. Phase 3 doubles to 8 stops (plus a 9th for the dip). Motion 12.38's docs don't quantify a per-stop cost.

**Default behavior to ship:** Use the 8-/9-stop arrays as designed in Pattern 1. The `choreography-rerender-budget.test.tsx` (Phase 2) asserts ≤2 re-renders per 100 motion-value updates — that test will catch any regression introduced by 8-stop.

**Verification gate:** if `choreography-rerender-budget.test.tsx` fails after Phase 3 lands (i.e., re-renders rise from 0–2 to 5+), investigate. Most likely cause would be a misuse of `useState` somewhere in the new code (not 8-stop overhead). Falsify cheaply.

**Risk if wrong:** scroll jank on mid-tier hardware. Phase 6 React DevTools Profiler smoke would catch it.

## Pitfalls

### Phase-3-Specific Pitfall #1: Cross-center scale-dip read as "step" not "recess"

**What goes wrong:** D-16 recipe (linear x + scale dip via Option A's 9th stop) may produce a piecewise-linear scale curve `0.5 → 0.45 → 0.5` that reads as a sharp V-shape rather than a smooth dip.

**Why it happens:** linear interpolation between three stops `[0.78 → 0.815 → 0.85]` with values `[0.5, 0.45, 0.5]` produces a non-smooth derivative at the midpoint. Visually: the screen appears to "stop shrinking" then "snap to growing".

**How to avoid:** apply an `easeInOut`-style ease curve to BOTH the dip-in segment (`[0.78, 0.815]`) and the dip-out segment (`[0.815, 0.85]`) so the velocity is continuous through the apex. Per Pattern 1's per-segment ease arrays: `SCALE_EASES[5] = "easeInOut"` (instead of LINEAR for that segment). The resulting curve is C¹-smooth at the apex.

**Warning signs:** at human-verify, the user reports "the screen jerks" or "feels stepped" at the cross-center moment.

**Phase to address:** Phase 3 (D-17 human-verify). Recovery: change SCALE_EASES indices 5 and (post-injection) 6 to `easeInOut`.

### Phase-3-Specific Pitfall #2: LCP preload mismatch — preloads wrong variant

**What goes wrong:** browser preloads the AVIF variant per the `<link rel="preload">` but `<picture>` selects a different one because the `sizes` values disagree.

**Why it happens:** typo — `imageSizes` on the preload says `(min-width:1280px) 1280px, 100vw` but `<source sizes>` is `(min-width: 1280px) 1280px, 100vw` (with space after colon, or different breakpoint, or trailing comma). Per HTML spec the comparison is byte-exact for cache-key matching.

**How to avoid:** extract `sizes` to a named const at the top of `index.tsx` and reference it in BOTH the head config and (via a route-exported const) the `<ProductScreen>` component. One source of truth.

```ts
// shared/lcp-preload.ts (or inline in index.tsx)
export const HERO_IMAGE_SIZES = "(min-width:1280px) 1280px, 100vw"
```

**Warning signs:** Network panel during `pnpm preview` shows the AVIF preload AND a *separate* AVIF download by the `<picture>` element (proving the cache miss). LCP unchanged from a no-preload baseline.

**Phase to address:** Phase 3 Wave 0 — schedule the named-const extraction explicitly. Tested by an assertion that both consumers reference the same const.

### Phase-3-Specific Pitfall #3: React 19 silently drops lowercase preload props

**What goes wrong:** `head().links` config uses `imagesrcset` (lowercase, as in CONTEXT.md D-12 example). React 19 renders `<link>` without the prop or with a console warning; the preload either doesn't fire or fires without the responsive variants.

**Why it happens:** React 19's `<link>` element only recognizes camelCase props for image preload attributes. Lowercase `imagesrcset` is treated as an unknown DOM prop.

**How to avoid:** Pattern 4 — use camelCase keys (`imageSrcSet`, `imageSizes`, `fetchPriority`). Test in Wave 0 by rendering and asserting the rendered HTML carries lowercase HTML attributes (proving React serialized correctly).

**Warning signs:** console warning during dev: "React does not recognize the `imagesrcset` prop on a DOM element". Network panel shows preload firing but without responsive selection.

**Phase to address:** Phase 3 Wave 0 — encode in route head test.

### Phase-3-Specific Pitfall #4: Scale-only morph hides x-axis movement during fA→fB

**What goes wrong:** the fA→fB cross-center morph is dominated by x-translation (-28vw → +28vw = ~56vw of horizontal travel), but the simultaneous scale dip (0.5 → 0.45 → 0.5) is small. If the human-verify reviewer focuses on scale only, they may miss x-jank.

**Why it happens:** D-14's per-axis ease curves are independent — x has `"easeInOut"`, scale has the cubicBezier dip. If they decouple in time (e.g., x finishes its morph at progress 0.83 but scale dip apexes at 0.815), the visual effect reads as "screen shoots past, then dips, then settles" — three beats instead of one.

**How to avoid:** ensure x and scale both use ease curves whose midpoints align with progress 0.815. For x with `easeInOut`, the midpoint progress = midpoint output, which means at progress 0.815 (midpoint of `[0.78, 0.85]`), x = 0vw (midpoint of `[-28vw, +28vw]`) — already aligned. For scale, the dip apex is explicitly at 0.815 by Option A construction. **Coupling holds by design.**

**Warning signs:** at human-verify, user reports "the screen jumps" or "doesn't pass through center cleanly".

**Phase to address:** Phase 3 D-17. Recovery: tighten the dip stop progress to exactly the midpoint of `[fA.window[1], fB.window[0]]`.

### Phase-3-Specific Pitfall #5 (carry-forward from research/PITFALLS.md #8): Broken-looking midstates

**What goes wrong:** at 25%/50%/75% of every transition, the user sees an intermediate that doesn't read as content. Worst offenders:
- Hero→Wow at 50%: screen at scale 0.78, opacity 0.5, x 0 — partially-faded, partially-scaled. Reads as "loading screen" rather than "morphing".
- Wow→FA at 50%: screen at scale 0.75, x ~-14vw — half-docked, half-centered. Reads as "broken layout".

**Why it happens:** the morph zones are short (10–13% of progress) and animate three axes simultaneously. Without intentional easing, the midpoints are arithmetic-mean values that lack visual structure.

**How to avoid:**
1. **Per-axis cubic-bezier easing (D-14)** — fast initial acceleration + slow settle so the midpoint is closer to the target than the source. Reads as "anchored to the destination".
2. **Light overshoot at peak (D-15)** — small pop at the morph endpoint (~1.04× target scale) so arrival reads as intentional rather than "stops abruptly".
3. **Cross-center scale dip (D-16)** — fA→fB explicitly recedes through center to read as "passes behind copy".
4. **`checkpoint:human-verify` (D-17)** — user scrubs and the planner adjusts. Not test-falsifiable; visual taste.

**Warning signs:** at human-verify, the user reports specific scroll progresses where the morph reads as broken. Common: 0.13 (early hero→wow), 0.60 (wow→fA midpoint), 0.815 (fA→fB midpoint).

**Phase to address:** Phase 3 (this is THE midstate-design phase). Phase 4 may further refine if copy interactions reveal new issues.

### Phase-3-Specific Pitfall #6 (carry-forward from research/PITFALLS.md #10): LCP regression from product screenshot

**What goes wrong:** the product UI image becomes the LCP candidate (was hero illustration in Phase 2), and without preload the LCP > 2.5s on Vercel.

**Why it happens:** at wow stage, the product screenshot fills ~1280px of viewport — much larger than the hero illustration's `~min(28vw, 300px)` cloud images or the centered paper card. LCP picks the largest above-the-fold paint.

**How to avoid:** Pattern 4 — the `<link rel="preload">` in route head fires before any JS executes. Browser fetches AVIF variant in parallel with HTML parse. By the time `<ProductScreen>` mounts, the variant is in cache.

**Warning signs (Phase 3 smoke check):**
- `pnpm build && pnpm preview`
- Chrome DevTools → Network → reload
- Observe: `profiles-screen-1280.avif` (or 1600) loads with Priority: High
- Observe: Initiator column = `<link rel=preload>` from `index.html`
- If Initiator = `<picture>` (instead of preload), the preload didn't fire — likely OQ-04 (camelCase mismatch).

**Phase to address:** Phase 3 ships the smoke check; Phase 6 owns formal Lighthouse against current-prod baseline (PERF-01/PERF-02).

### Phase-3-Specific Pitfall #7: Browser-frame chrome breaks at scale 0.5 (docked stages)

**What goes wrong:** the Mac traffic-lights + URL bar (D-18) are sized in absolute units (`size-3` = 12px dots, `text-xs` = 12px URL bar text). At docked-stage scale 0.5, they render at 6px effective — too small to read. The truncated URL becomes illegible.

**Why it happens:** `transform: scale()` shrinks the *visual* size but the chrome was sized for scale 1.0 (wow stage).

**How to avoid:** the chrome should *appear* legible at all stages. Two options:
- **Option A (current — implicit accept):** chrome shrinks with the screen; at docked stages it's deliberately small because the screen is small. The eye reads the chrome as part of the browser-frame illusion at any scale.
- **Option B:** counter-scale the chrome so it stays at constant pixel size regardless of stage. Adds a `useTransform` for chrome scale = `1 / screenScale`. Complexity not worth it.

**Default decision:** Option A — accept that chrome shrinks. The illusion holds because the dots and URL bar maintain their aspect ratio relative to the browser frame.

**Warning signs:** at human-verify, the user complains "the URL is unreadable when docked". Recovery: either accept (storytelling: "at docked stages, the screen is showcasing features, not the URL") or apply Option B (tighter visual but more code).

**Phase to address:** Phase 3 D-17. Default no-action; revisit if user pushback at human-verify.

## Confidence Assessment

| Area | Level | Reason |
|------|-------|--------|
| Standard stack (motion 12.38, sharp 0.34.5, TanStack Start 1.166) | HIGH | All Context7-verified against current docs; sharp version checked against npm registry (`0.34.5` published 2025-11-06) |
| `useTransform` per-segment easing API | HIGH | Context7-verified motion.dev docs explicitly document the array-of-eases shape; matched against current motion@12.38 |
| TanStack Start `head().links` syntax | MEDIUM | Context7 docs cover the basic `links` array shape; the camelCase prop-name requirement is inferred from React 19's `<link>` behavior. OQ-04 surfaces a Wave 0 verification gate |
| `<picture>` + `<source>` + preload `sizes` matching | HIGH | web.dev + MDN agree; CONTEXT.md D-12 already has the values right |
| sharp variant generation | HIGH | Context7-verified API surface; defaults documented |
| sharp quality settings (AVIF 60 / WebP 78) | MEDIUM | First-pass values; final tuning is visual taste (OQ-03) |
| Cascade impact on existing tests | HIGH | All test files read; line ranges cited; cascade reasoning verified by reading the actual assertions |
| PaperBackdrop intra-stage const retune | MEDIUM | First-pass values are proportionally derived from Phase 2; final tuning at human-verify (D-17) |
| 8-stop `useTransform` performance | MEDIUM | No published benchmarks; Phase 2's 4-stop precedent + `choreography-rerender-budget.test.tsx` will catch regressions (OQ-05) |
| Cross-center scale dip stop count (Option A vs B) | MEDIUM | Recommended Option A based on AST walker compatibility + readability; Option B kept as recovery path |
| Image LCP smoke-check protocol | HIGH | `pnpm preview` + DevTools Network is a well-known pattern; Phase 6 owns formal Lighthouse |

**Overall confidence:** HIGH for the core technical design; MEDIUM for tuning values that warrant human-verify gates.

## Sources

### Primary (HIGH confidence — Context7 / official docs)
- [motion.dev/docs/react-use-transform](https://motion.dev/docs/react-use-transform) — `useTransform` `{ ease }` option accepts array of easing functions per segment between keyframe stops
- [motion.dev/docs/animate](https://motion.dev/docs/animate) — `ease` option semantics including per-keyframe easing arrays (shared between `animate` and `useTransform`)
- [motion.dev/docs/easing-functions](https://motion.dev/docs/easing-functions) — `cubicBezier(p1x, p1y, p2x, p2y)` API and named easings
- [react.dev/reference/react-dom/preload](https://react.dev/reference/react-dom/preload) — `imageSrcSet` / `imageSizes` camelCase prop names; image-preload semantics
- [tanstack.com/start/latest/docs/framework/react/guide/routing](https://tanstack.com/start/latest/docs/framework/react/guide/routing) — `head()` config with `links: [{...}]` array
- [sharp.pixelplumbing.com/api-output](https://sharp.pixelplumbing.com/api-output) (via Context7 `/lovell/sharp`) — `.avif()`, `.webp()`, `.png()` options including quality and effort defaults
- [web.dev/articles/preload-responsive-images](https://web.dev/articles/preload-responsive-images) — `imagesizes` must match `<picture>` `sizes` attribute byte-exactly
- [developer.mozilla.org/docs/Web/HTML/Element/picture](https://developer.mozilla.org/docs/Web/HTML/Element/picture) — `<picture>` + `<source>` + media negotiation semantics
- npm registry: `npm view sharp version` → 0.34.5 (published 2025-11-06)

### Secondary (MEDIUM confidence — community / cross-references)
- [stefanjudis.com — preload responsive images with imagesizes and imagesrcset](https://www.stefanjudis.com/today-i-learned/how-to-preload-responsive-images-with-imagesizes-and-imagesrcset/) — confirms lowercase HTML attribute names; React-camelCase-to-lowercase-HTML serialization
- [github.com/facebook/react/issues/31352](https://github.com/facebook/react/issues/31352) — React 19 `preload()` hoisting/serialization edge cases
- Phase 1 + Phase 2 in-repo CONTEXT.md, RESEARCH.md, and test files — establishes the patterns Phase 3 extends

### Tertiary (assumed — flagged for verification)
- AVIF quality 60 / WebP quality 78 specific values — first-pass; visual review at human-verify (OQ-03)
- 8-stop `useTransform` rendering parity vs 4-stop — assumed from motion's documented data-flow (single mix() pipeline); no published benchmark (OQ-05)

## Project Constraints (from CLAUDE.md)

| Directive | Compliance Plan |
|-----------|----------------|
| **Stack locked: React 19 + TanStack Start + Tailwind v4 + motion/react** — no GSAP, no second animation library | Pattern 1 uses motion's `useTransform` + `cubicBezier` only. No new animation library |
| **Visual system: paper design tokens + existing illustration assets locked** — don't restyle the illustration | Phase 3 only edits the product-screen path; PaperBackdrop intra-stage consts retune (D-20) but the visual language is unchanged. New assets are variants of the existing `profiles-screen.png` |
| **GPU-friendly: scroll choreography is transform/opacity only; no layout thrash** | D-03 locks animated axes to scale + x + opacity. No `width`/`height`/`top`/`left`. No `box-shadow` animation (the static `shadow-[0_30px_120px...]` is fine; not animated) |
| **prefers-reduced-motion: hard requirement; all content reachable without animation** | A11Y-05 alt text reaches both choreography and static-fallback render paths (verified by D-13 verbatim text + Phase 2 `static-choreography-fallback.tsx` consumer of `<PaperHero>`'s reduced branch) |
| **Mobile: static fallback only — no engineering on pinned scroll** | Phase 3 makes no mobile-specific changes. The orchestrator's `mode === "static"` branch already routes mobile users to `<StaticChoreographyFallback>` |
| **Performance: must not regress current Lighthouse scores** | Pattern 4's preload + Pattern 2's AVIF/WebP variants are net wins for LCP. Phase 6 verifies formally. Phase 3 ships the smoke-check protocol (§Validation Architecture) |
| **Deployment: Vercel; live app at teacherworkspace-alpha.vercel.app/students must not be modified** | Phase 3 makes no changes outside `src/components/landing/scroll-choreography/`, `src/routes/index.tsx`, `scripts/`, `public/hero/`, `package.json`. Live app untouched |
| **Scope discipline: Marketing-site-only milestone; live app is untouched** | Same as above |
| **GSD workflow enforcement: don't make direct repo edits outside a GSD workflow** | This research file feeds the planner; planner generates plans; plans are executed via `/gsd-execute-phase`. Workflow respected |
| **Naming patterns: kebab-case files, PascalCase components, camelCase utilities** | New file `scripts/gen-hero-images.mjs` follows kebab-case. Existing convention (no barrel files, named exports, `@/` alias) preserved |
| **Code style: Prettier 3.8.1, double quotes, no semicolons, 80 chars** | All code examples in this research follow project style |
| **TypeScript strict mode + verbatimModuleSyntax** | `import type` for types in all examples; `import` for runtime values |

## RESEARCH COMPLETE

**Phase:** 3 — Product Screen — The Single Shared Element
**Confidence:** HIGH (with MEDIUM-tagged areas warranting human-verify gates: midstate visual quality, sharp quality settings, 8-stop performance)

### Key Findings

- **`useTransform({ ease })` accepts an array of 7 easing functions** (one per inter-stop segment for the 8-stop array) — directly enables D-14's per-axis cubic-bezier easing without custom easing math
- **TanStack Start `head().links` requires React 19 camelCase prop names** (`imageSrcSet`, `imageSizes`, `fetchPriority`) — the CONTEXT.md D-12 lowercase example will silently break preload; OQ-04 schedules a Wave 0 verification
- **Sharp 0.34.5 stable; `.avif({ quality: 60, effort: 4 })` + `.webp({ quality: 78 })` + `.png({ compressionLevel: 9 })` + `.withMetadata()` for sRGB profile** — idempotent script via mtime check
- **Cross-center scale dip best implemented as a 9th `useTransform` stop with named const** (Option A) — passes the existing AST walker, easier to test than a custom JS easing
- **Section-height retune cascades into exactly 1 line** in `scroll-choreography.test.tsx`; STAGES window retune cascades into 1 line in `stages.test.ts`; `paper-backdrop.test.tsx` auto-tracks via `byId(...)`; `product-screen.test.tsx` requires major rewrite

### File Created

`.planning/phases/03-product-screen-the-single-shared-element/03-RESEARCH.md`

### Confidence Assessment

| Area | Level | Reason |
|------|-------|--------|
| Standard stack | HIGH | Context7 + npm-registry verified |
| `useTransform` per-segment easing | HIGH | Context7 motion.dev docs explicit |
| TanStack Start head() preload syntax | MEDIUM | Inferred from React 19 `<link>`; OQ-04 falsifies cheaply at Wave 0 |
| sharp variant generation API | HIGH | Context7-verified |
| sharp quality settings | MEDIUM | First-pass; OQ-03 visual review |
| Test cascade | HIGH | Line ranges cited |
| PaperBackdrop const retune | MEDIUM | First-pass; D-17 human-verify |
| 8-stop performance | MEDIUM | No published benchmark; OQ-05 falsifiable |

### Open Questions

- **OQ-01:** Cross-center scale dip — single mid-stop (default) vs custom JS easing (recovery). Falsified at human-verify
- **OQ-02:** Section height tuning — `400lvh` (default) vs `360lvh`/`440lvh`. Falsified at human-verify
- **OQ-03:** Sharp AVIF quality — 60 (default) vs 70. Falsified at human-verify
- **OQ-04:** TanStack Start head() prop name casing — camelCase (default) vs lowercase. Falsified at Wave 0 by smoke test
- **OQ-05:** 8-stop `useTransform` performance — same as 4-stop (default). Falsified by `choreography-rerender-budget.test.tsx` at Wave 1

### Ready for Planning

Research complete. Planner can now create PLAN.md files. Recommended wave structure:

- **Wave 0:** test stubs (rewrite product-screen.test.tsx, update stages.test.ts L43-49, update scroll-choreography.test.tsx L125, NEW routes/index.head.test.tsx) + sharp devDep + run gen-hero-images.mjs once + commit 12 variants
- **Wave 1 (parallelizable):** [a] SCREEN_TARGETS runtime const + STAGES window retune in stages.ts + ProductScreen rewire to 8-stop useTransform with per-segment eases | [b] `<picture>` element with avif/webp/png sources + alt text update | [c] index.tsx head() preload + section-height retune + PaperBackdrop intra-stage const retune
- **Wave 2:** test green-up + `checkpoint:human-verify` for D-17 (midstate scrub review across all 3 morph zones at 25/50/75) + LCP smoke check via `pnpm preview` + commit
