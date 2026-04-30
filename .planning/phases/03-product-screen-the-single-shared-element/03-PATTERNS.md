# Phase 3: Product Screen — The Single Shared Element - Pattern Map

**Mapped:** 2026-04-29
**Files analyzed:** 14 (10 modify + 4 new categories)
**Analogs found:** 11 / 14 (3 NEW files have weak/no analog — bootstrap conventions documented)

## File Classification

| File | New/Modified | Role | Data Flow | Closest Analog | Match Quality |
|------|--------------|------|-----------|----------------|---------------|
| `src/components/landing/scroll-choreography/product-screen.tsx` | modify (major rewrite) | component (presentational subscriber) | scroll-driven motion-value transform | self (Phase 2 stub) | exact (in-file evolution) |
| `src/components/landing/scroll-choreography/stages.ts` | modify | data/config (typed const) | static export | self (Phase 1 + Phase 2) | exact (in-file evolution) |
| `src/components/landing/scroll-choreography/scroll-choreography.tsx` | modify (1-line height) | component (orchestrator) | scroll | self | exact (intra-file) |
| `src/components/landing/scroll-choreography/paper-backdrop.tsx` | modify (intra-stage const retune) | component (presentational subscriber) | scroll-driven | self | exact (intra-file) |
| `src/routes/index.tsx` | modify (add `head()`) | route/SSR | request-response (SSR head injection) | TanStack `__root.tsx` (head meta pattern) | role-match |
| `scripts/gen-hero-images.mjs` | NEW | build-time Node script | file-I/O (read PNG, write 12 variants) | none in repo | NO ANALOG (bootstrap convention) |
| `package.json` | modify | config | static | self | exact |
| `public/hero/profiles-screen-{640,960,1280,1600}.{avif,webp,png}` | NEW (12 generated assets) | static asset | none | `public/hero/profiles-screen.png` | exact (sibling outputs) |
| `src/components/landing/scroll-choreography/product-screen.test.tsx` | modify (major rewrite) | test (unit) | render + scroll-mock | self (Phase 2 stub) + `paper-backdrop.test.tsx` | exact |
| `src/components/landing/scroll-choreography/stages.test.ts` | modify | test (unit, data shape) | static assertion | self | exact |
| `src/components/landing/scroll-choreography/paper-backdrop.test.tsx` | modify (threshold values) | test (unit) | render + motion-value driven | self | exact |
| `src/components/landing/scroll-choreography/scroll-choreography.test.tsx` | modify (h-[400lvh] regex) | test (unit) | render + class assertion | self | exact |
| `src/components/landing/scroll-choreography/migrate-03-keyframe-binding.test.ts` | verify-only | test (AST walker) | file-read + AST walk | self | exact (auto-passes) |
| `src/routes/index.head.test.tsx` | NEW | test (route head config) | route-config introspection | none in repo | NO ANALOG (TanStack `head()` test convention to bootstrap) |

---

## Pattern Assignments

### `src/components/landing/scroll-choreography/product-screen.tsx` (component, scroll-driven motion-value transform)

**Analog:** self (Phase 2 stub) — `src/components/landing/scroll-choreography/product-screen.tsx`
**Co-analog (for the multi-segment ease pattern):** `src/components/landing/scroll-choreography/paper-backdrop.tsx` (uses 3-stop `useTransform` with named consts; Phase 3 generalizes to 8-stop with per-segment `{ ease }`).

**Imports pattern** (Phase 2 stub lines 30–35 — preserved verbatim, plus add `cubicBezier`):

```typescript
import { motion, useTransform } from "motion/react"
// Phase 3 adds: import { cubicBezier } from "motion"

import { useScrollChoreography } from "./context"
import { byId } from "./stages"
// Phase 3 adds: import { STAGES, SCREEN_TARGETS } from "./stages"

import { TEACHER_WORKSPACE_APP_URL } from "@/content/landing"
```

Convention enforced: external (`motion`, `motion/react`) first, then internal `./` siblings, then `@/` alias imports. Blank lines separate the three groups. Matches `paper-backdrop.tsx:33–38` and `scroll-choreography.tsx:28–46`.

**Named-const intra-stage timing pattern** (Phase 2 stub lines 37–46 — extends to D-13 / D-14 / D-15 / D-16 named consts):

```typescript
// Stage-aligned endpoints — D-12: bind to STAGES via byId()
const SCREEN_FADE_START = byId("wow").window[0]
const SCREEN_FADE_END = byId("wow").window[1]

// Intra-stage scale curve — D-13: named local consts (visual tuning,
// not a stage window). Phase 2 ramps from hero to wow; Phase 3 will
// replace this with a multi-stage stitched curve.
const SCREEN_SCALE_HERO = 0.55
const SCREEN_SCALE_WOW_PEAK = 1
const SCREEN_SCALE_OVERSHOOT = 1.04
```

**Phase 3 deviates by:**
- Removing the two `byId("wow").window[*]` const aliases — STOPS array now flatMaps all 4 stages.
- Adding D-14 ease consts: `EASE_HERO_TO_WOW = cubicBezier(0.32, 0, 0.67, 1)`, `EASE_WOW_TO_FA = cubicBezier(0.4, 0, 0.2, 1)`, `LINEAR = (t: number) => t`.
- Adding D-16 mid-morph dip consts: `FA_TO_FB_SCALE_DIP_PROGRESS = 0.815`, `FA_TO_FB_SCALE_DIP_VALUE = 0.45` (per RESEARCH.md Pattern 1 Option A).
- Keeping `SCREEN_SCALE_OVERSHOOT = 1.04` baseline (D-15) and applying it as the per-stage arrival overshoot (no longer just at the wow peak).

**Core useTransform pattern** (Phase 2 stub lines 48–72 — pattern preserved, value/stop arrays expand):

```typescript
export function ProductScreen() {
  const { scrollYProgress } = useScrollChoreography()

  // Phase 2 hero→wow ramp (D-09). Keyframe endpoints stage-aligned via
  // byId(); intra-stage scale values as named local consts (D-13). The
  // motion library's default clamp removes any need for a manual clamp.
  const screenScale = useTransform(
    scrollYProgress,
    [0, SCREEN_FADE_START, SCREEN_FADE_END, 1],
    [
      SCREEN_SCALE_HERO,
      SCREEN_SCALE_HERO,
      SCREEN_SCALE_WOW_PEAK,
      SCREEN_SCALE_OVERSHOOT,
    ],
  )
```

**Phase 3 deviates by** rewiring to 3 calls each consuming `STAGES.flatMap(...)` arrays per RESEARCH.md Pattern 1:

```typescript
// 8-stop scroll progress: [hero[0], hero[1], wow[0], wow[1], fA[0], fA[1], fB[0], fB[1]]
const STOPS = STAGES.flatMap((s) => [s.window[0], s.window[1]])

const SCALE_VALUES = STAGES.flatMap((s) => {
  const v = SCREEN_TARGETS[s.screen].scale
  return [v, v]
})
const X_VALUES = STAGES.flatMap((s) => {
  const v = SCREEN_TARGETS[s.screen].x
  return [v, v]
})
const OPACITY_VALUES = STAGES.flatMap((s) => {
  const v = SCREEN_TARGETS[s.screen].opacity
  return [v, v]
})

// Per-axis ease arrays (7 entries — one per inter-stop segment)
const SCALE_EASES = [LINEAR, EASE_HERO_TO_WOW, LINEAR, EASE_WOW_TO_FA, LINEAR, EASE_WOW_TO_FA, LINEAR]
const X_EASES = [LINEAR, "easeOut", LINEAR, EASE_WOW_TO_FA, LINEAR, "easeInOut", LINEAR]
const OPACITY_EASES = [LINEAR, "easeOut", LINEAR, LINEAR, LINEAR, LINEAR, LINEAR]

const scale = useTransform(scrollYProgress, STOPS, SCALE_VALUES, { ease: SCALE_EASES })
const x = useTransform(scrollYProgress, STOPS, X_VALUES, { ease: X_EASES })
const opacity = useTransform(scrollYProgress, STOPS, OPACITY_VALUES, { ease: OPACITY_EASES })
```

**JSX wrapper pattern** (Phase 2 stub lines 73–98 — verbatim preserve outer + chrome; swap `<img>` for `<picture>`):

```typescript
return (
  <motion.div
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
  </motion.div>
)
```

**Phase 3 deviates by:**
- Outer wrapper `style={{ opacity }}` → `style={{ opacity, x }}` (D-03 adds the x axis).
- Inner `<motion.div>` keeps `style={{ scale }}` (no change).
- `<img>` swapped for `<picture>` element with three `<source>` (avif/webp/png) per RESEARCH.md Pattern 3 + D-10 / D-11. Render shape (camelCase JSX props — `srcSet`, NOT `srcset`):
  ```tsx
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
  ```
- Alt text replaces Phase 2's `"Teacher Workspace student insights dashboard"` with D-13 spec-verbatim string `"Teacher Workspace student view showing attendance, behavior notes, and family messages"`.
- Keep `pointer-events-none`, `aria-hidden`, `z-20`, all chrome JSX **verbatim** (D-18 / D-19).

**File header docstring pattern** (Phase 2 lines 1–29 — extend, don't replace):
The Phase 2 docstring already declared "Phase 3 expands this to all four stage targets". Phase 3's update should:
- Update the scope sentence (Phase 2 hero→wow → Phase 3 4-stage stitched).
- Document MIGRATE-03 8-stop binding (was 4-stop).
- Document VISUAL-03 `<picture>` + AVIF/WebP/PNG.
- Document A11Y-05 alt text replacement.
- Document D-15 / D-16 named-const additions.
- Keep CHOREO-01 single-shared-motion-div + no `layoutId` claims (still true).

---

### `src/components/landing/scroll-choreography/stages.ts` (data/config)

**Analog:** self — `src/components/landing/scroll-choreography/stages.ts`

**STAGES const pattern** (lines 15–20 — preserved structurally; window values retuned):

```typescript
export const STAGES = [
  { id: "hero", window: [0.0, 0.25] as const, screen: "tiny" },
  { id: "wow", window: [0.2, 0.78] as const, screen: "centered" },
  { id: "feature-a", window: [0.5, 0.78] as const, screen: "docked-left" },
  { id: "feature-b", window: [0.75, 1.0] as const, screen: "docked-right" },
] as const satisfies readonly StageDef[]
```

**Phase 3 deviates by** retuning to D-02 monotonic non-overlapping windows:

```typescript
export const STAGES = [
  { id: "hero", window: [0.0, 0.10] as const, screen: "tiny" },
  { id: "wow", window: [0.20, 0.55] as const, screen: "centered" },
  { id: "feature-a", window: [0.65, 0.78] as const, screen: "docked-left" },
  { id: "feature-b", window: [0.85, 1.0] as const, screen: "docked-right" },
] as const satisfies readonly StageDef[]
```

The `as const` + `satisfies` pattern, the `byId()` helper (lines 24–28), and the comment style stay verbatim.

**ScreenTargetsMap type → SCREEN_TARGETS const pattern** (lines 30–42 — replace type alias with runtime const):

Phase 1/2 export:
```typescript
export type ScreenTargetsMap = Record<ScreenTarget, ScreenTargetRect>
```

Phase 3 deviates by replacing with a runtime const of the same shape (D-04 / D-08):

```typescript
export const SCREEN_TARGETS: Record<ScreenTarget, ScreenTargetRect> = {
  "tiny":         { scale: 0.55, x: "0",     y: "0", opacity: 0 },
  "centered":     { scale: 1.00, x: "0",     y: "0", opacity: 1 },
  "docked-left":  { scale: 0.50, x: "-28vw", y: "0", opacity: 1 },
  "docked-right": { scale: 0.50, x: "+28vw", y: "0", opacity: 1 },
} as const
```

The Phase 1 docstring at lines 30–42 explicitly anticipates this swap: *"Phase 3 replaces this type alias with `export const SCREEN_TARGETS` of the same shape. Consumers should import the type today and update the import to a value once Phase 3 lands."* — Phase 3 deletes/replaces that docstring with a new comment describing the runtime values.

**Phase 3 retains** the named export pattern, the `as const` literal, the lowercase string keys (`"tiny"`, etc.), and the readonly typing via `Record<ScreenTarget, ScreenTargetRect>`.

---

### `src/components/landing/scroll-choreography/scroll-choreography.tsx` (orchestrator)

**Analog:** self — `src/components/landing/scroll-choreography/scroll-choreography.tsx`

**Single-line edit** (line 129) — outer section className:

```typescript
className="scroll-choreography-only relative h-[280lvh]"
```

**Phase 3 deviates by:**

```typescript
className="scroll-choreography-only relative h-[400lvh]"
```

D-09: 4× viewport height for 4-stage choreography. No other change to this file. Inner sticky stays `h-svh` (line 132).

---

### `src/components/landing/scroll-choreography/paper-backdrop.tsx` (presentational subscriber)

**Analog:** self — `src/components/landing/scroll-choreography/paper-backdrop.tsx`

**Intra-stage named-const pattern** (lines 42–59):

```typescript
const VIDEO_GATE_THRESHOLD = byId("wow").window[1]

const STAGE_SCALE_MID_PROGRESS = 0.6
const STAGE_SCALE_MID_VALUE = 2.4
const STAGE_SCALE_END_VALUE = 5.2

const STAGE_OPACITY_FADE_START = 0.6
const STAGE_OPACITY_FADE_END = 0.78
const CLOUD_LEFT_TRAVEL_PX = "-160px"
const CLOUD_RIGHT_TRAVEL_PX = "-110px"
```

**Phase 3 deviates by** retuning the 5 intra-stage timing consts (D-20) to track the new `wow.window[1] = 0.55`:

```typescript
// First-pass per D-20 — planner reviews magnitudes; tunable at human-verify
const STAGE_SCALE_MID_PROGRESS = 0.40   // was 0.6
const STAGE_SCALE_MID_VALUE = 2.4       // unchanged (vertical-only retune)
const STAGE_SCALE_END_VALUE = 5.2       // unchanged

const STAGE_OPACITY_FADE_START = 0.45   // was 0.6
const STAGE_OPACITY_FADE_END = 0.55     // was 0.78
```

**Auto-tracking** (D-21): `VIDEO_GATE_THRESHOLD = byId("wow").window[1]` requires NO edit — the `byId()` reference automatically resolves to the new `0.55` after `stages.ts` is updated.

**Cloud travel consts** (`CLOUD_LEFT_TRAVEL_PX`, `CLOUD_RIGHT_TRAVEL_PX`) are unchanged — they're scrollProgress-mapped 0→1 with absolute pixel travel, independent of stage windows.

The full `useTransform` calls (lines 68–87), `useMotionValueEvent` gate (lines 96–109), and JSX (lines 111–166) stay verbatim.

---

### `src/routes/index.tsx` (route, SSR head injection)

**Analog (in-repo):** `src/routes/__root.tsx` (root route head config — TanStack head meta pattern). `src/routes/index.tsx` itself is currently minimal (no `head` config); Phase 3 adds one.

Current `src/routes/index.tsx` (lines 1–19, all of it):

```typescript
import { createFileRoute } from "@tanstack/react-router"

import { SiteFooter } from "@/components/landing/footer"
import { SiteHeader } from "@/components/landing/site-header"
import { ScrollChoreography } from "@/components/landing/scroll-choreography/scroll-choreography"

export const Route = createFileRoute("/")({ component: HomePage })

function HomePage() { /* ... */ }
```

**Phase 3 deviates by** expanding the `createFileRoute("/")({...})` config object to include a `head()` callback per D-12 + RESEARCH.md Pattern 4 (camelCase keys are mandatory for React 19 — see RESEARCH.md "Critical gotcha"):

```typescript
export const Route = createFileRoute("/")({
  component: HomePage,
  head: () => ({
    links: [
      {
        rel: "preload",
        as: "image",
        type: "image/avif",
        // CRITICAL: camelCase keys (React 19 serializes to lowercase HTML attrs).
        // CRITICAL: imageSizes value MUST byte-match the `sizes` attribute on
        // <picture>/<source>/<img> in product-screen.tsx (web.dev contract).
        imageSrcSet:
          "/hero/profiles-screen-640.avif 640w, /hero/profiles-screen-960.avif 960w, /hero/profiles-screen-1280.avif 1280w, /hero/profiles-screen-1600.avif 1600w",
        imageSizes: "(min-width:1280px) 1280px, 100vw",
        fetchPriority: "high",
      },
    ],
  }),
})
```

**Lives only on `/` route** — index-route head, not `__root.tsx`. Future routes don't pay the cost.

---

### `scripts/gen-hero-images.mjs` (NEW — build-time Node script)

**No analog in repo** — `scripts/` directory does not yet exist. This file bootstraps the convention for build-time tooling.

**Recommended bootstrap conventions (synthesized from CLAUDE.md + repo style):**

| Convention | Value | Rationale |
|------------|-------|-----------|
| File extension | `.mjs` | `package.json` declares `"type": "module"`, but `.mjs` is the explicit signal that this is a Node script (not TS-source). Avoids accidental TS-import pollution. |
| Location | `scripts/` (new dir) | CONTEXT.md "Claude's Discretion" defaults to `scripts/`; matches Node ecosystem norm. |
| Quotes / semicolons | Double quotes; no semicolons | Matches `.prettierrc` enforced repo-wide. |
| Imports | Top-of-file, single blank line group separator | Matches `paper-backdrop.tsx:33–38`. |
| Async style | `async`/`await` (no `.then()` chains) | Sharp's API is Promise-based. |
| Console output | `console.log` with `✓ wrote …` / `✓ skip …` prefixes | Idempotency-friendly, easy to scan. |

**Skeleton (RESEARCH.md Pattern 2 — verified sharp 0.34.5 API):**

```javascript
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

**Idempotency**: skip outputs newer than the source mtime. Manual run + commit (D-10 default — no `pnpm prebuild` hook).

---

### `package.json` (config)

**Analog:** self.

Current `scripts` block (lines 5–13):
```json
"scripts": {
  "dev": "vite dev --port 3000",
  "build": "vite build",
  "preview": "vite preview",
  "test": "vitest run",
  "lint": "eslint",
  "format": "prettier --write \"**/*.{ts,tsx,js,jsx}\"",
  "typecheck": "tsc --noEmit"
}
```

**Phase 3 deviates by** adding one line:
```json
"gen:hero-images": "node scripts/gen-hero-images.mjs"
```

**devDependencies block** (lines 39–57): add `"sharp": "^0.34.5"` (current stable per RESEARCH.md Pattern 2).

No other package.json changes.

---

### `public/hero/profiles-screen-{640,960,1280,1600}.{avif,webp,png}` (NEW static assets)

**Analog:** `public/hero/profiles-screen.png` — sibling source asset; same directory; lowercase-with-hyphens naming continues.

**Naming convention** (matches existing `public/hero/` files: `cloud-halftone.png`, `teacher-illustration.png`, `teacher-working.mp4`):
- Lowercase, hyphenated descriptor (`profiles-screen`)
- Width suffix as `-{width}` (new for variants)
- Format extension `.avif` / `.webp` / `.png`

12 files total: 4 widths × 3 formats. All commit to repo (D-10). Source `profiles-screen.png` (134KB, 1600×1000) preserved untouched.

---

### `src/components/landing/scroll-choreography/product-screen.test.tsx` (test, major rewrite)

**Analog:** self (Phase 2 stub) + `paper-backdrop.test.tsx` (motion-value gate / context-provider test pattern).

**Test harness pattern** (current product-screen.test.tsx lines 27–41 — preserved verbatim):

```typescript
function renderWithMockProgress(progress = 0) {
  const mv = motionValue(progress)
  const value: ScrollChoreographyContextValue = {
    scrollYProgress: mv,
    stages: STAGES,
    reducedMotion: false,
    mode: "choreography",
  }
  const utils = render(
    <ScrollChoreographyContext.Provider value={value}>
      <ProductScreen />
    </ScrollChoreographyContext.Provider>
  )
  return { ...utils, scrollYProgress: mv }
}
```

This harness is the established convention — Phase 3 keeps it verbatim. `paper-backdrop.test.tsx:27–41` uses identical shape, confirming the convention.

**Mount-stability test pattern** (current product-screen.test.tsx lines 43–60 — preserved):

```typescript
describe("ProductScreen mount stability (CHOREO-01 / D-21)", () => {
  it("the morphing element instance is the same node across 5 scroll updates", () => {
    const { scrollYProgress, container } = renderWithMockProgress(0)
    const initialNode = container
      .querySelector("img[src='/hero/profiles-screen.png']")
      ?.parentElement
    expect(initialNode).not.toBeNull()

    for (const p of [0.1, 0.3, 0.5, 0.7, 0.95]) {
      scrollYProgress.set(p)
    }

    const currentNode = container
      .querySelector("img[src='/hero/profiles-screen.png']")
      ?.parentElement
    expect(currentNode).toBe(initialNode)
  })
})
```

**Phase 3 deviates by:**
- Selector changes: `img[src='/hero/profiles-screen.png']` → `img[src='/hero/profiles-screen-1280.png']` (the fallback `<img>` inside `<picture>` uses the 1280 variant as `src` per D-10).
- Add NEW test blocks for:
  1. `<picture>` element render — assert `container.querySelector("picture")` exists, and 2 `<source>` elements with `type="image/avif"` and `type="image/webp"` exist.
  2. Alt text — assert `container.querySelector("img")?.getAttribute("alt") === "Teacher Workspace student view showing attendance, behavior notes, and family messages"` (D-13).
  3. 4-stage keyframe binding — assert that scrubbing through scrollYProgress produces 4 distinct visual peaks (style snapshots at `0.05` (hero hold), `0.35` (wow hold), `0.71` (fA hold), `0.92` (fB hold)). Use `motionValue.set()` + read inline-style transform.
  4. Phase 2 D-09 scope test (current lines 80–89 — *delete*, no longer accurate; Phase 3 explicitly DOES emit feature-a/feature-b state).
- The `CHOREO-01 layoutId` test (lines 91–100) stays verbatim — still a valid invariant.

**Note on jsdom**: `<picture>` source negotiation does NOT happen in jsdom (per CONTEXT.md `<code_context>` final bullet — "jsdom doesn't render `<picture>` source negotiation but does parse the element tree, so DOM-shape assertions work"). Tests assert structure (element exists, srcSet attribute set, sizes attribute set), not which variant the browser would pick.

---

### `src/components/landing/scroll-choreography/stages.test.ts` (test, data shape)

**Analog:** self.

**Existing test pattern** (lines 5–50 — preserved structurally; values updated):

```typescript
describe("STAGES data", () => {
  it("contains exactly 4 stages in narrative order", () => {
    expect(STAGES).toHaveLength(4)
    expect(STAGES.map((s) => s.id)).toEqual(["hero", "wow", "feature-a", "feature-b"])
  })

  it("byId('wow').window[1] is retuned to the Phase 2 first-pass value (D-14)", () => {
    expect(byId("wow").window[1]).toBeCloseTo(0.78, 2)
  })
})
```

**Phase 3 deviates by:**
- Updating the `byId("wow").window[1]` assertion: `0.78` → `0.55` (D-02). Update the comment to reference D-02 instead of "Phase 2 D-14".
- Adding a "monotonic non-overlapping" assertion: `for each adjacent pair, prev.window[1] < next.window[0]`.
- Adding a NEW `describe("SCREEN_TARGETS map (D-04 / D-08)")` block:
  - assert all 4 keys present (`tiny`, `centered`, `docked-left`, `docked-right`)
  - assert exact values per D-08 (e.g., `expect(SCREEN_TARGETS["tiny"].scale).toBe(0.55)`)
  - assert `SCREEN_TARGETS["tiny"].opacity === 0` (D-05 hero hidden contract)
  - assert sign convention (`docked-left.x === "-28vw"`, `docked-right.x === "+28vw"`) per D-07.
- Import update: `import { STAGES, SCREEN_TARGETS, byId } from "./stages"` (was `import { STAGES, byId } from "./stages"`).

---

### `src/components/landing/scroll-choreography/paper-backdrop.test.tsx` (test)

**Analog:** self.

**Existing video-gate test pattern** (lines 68–80 — preserved structurally; threshold value updates):

```typescript
it("pauses video when scrollYProgress crosses byId('wow').window[1]", () => {
  const { scrollYProgress, container } = renderWithMockProgress(0)
  // ...
  scrollYProgress.set(byId("wow").window[1] + 0.01)
  expect(pauseSpy).toHaveBeenCalled()
})
```

**Phase 3 deviates by:**
- The `byId("wow").window[1] + 0.01` reference auto-tracks (D-21) — no edit needed for the threshold-crossing tests; they continue to pass post-stage-retune because they reference `byId(...)` at test time.
- Hard-coded probe values like `scrollYProgress.set(0.3)` (line 95, 102, 103, 104) may need adjustment if they currently sit inside the wow window but would sit outside after retune. Audit each scrollYProgress.set(...) call: if value is in the new "morph zone" (0.10–0.20, 0.55–0.65, 0.78–0.85) it may produce an interim transform value; pick values inside hold zones for stable assertions. Recommended replacements: `0.3 → 0.30` (still inside wow `[0.20, 0.55]` — fine).
- May need to update the assertions for `STAGE_OPACITY_FADE_START`/`END` if the test file references them by value (it does not currently — it tests behavior, not consts). Confirm with the executor.

---

### `src/components/landing/scroll-choreography/scroll-choreography.test.tsx` (test)

**Analog:** self.

**Existing class-assertion test** (lines 113–135 — class regex update only):

```typescript
const sectionClass = section?.className ?? ""
expect(sectionClass).toMatch(/h-\[280lvh\]/)
```

**Phase 3 deviates by**:
```typescript
expect(sectionClass).toMatch(/h-\[400lvh\]/)
```

Single-line regex update. The rest of the file is untouched.

---

### `src/components/landing/scroll-choreography/migrate-03-keyframe-binding.test.ts` (test, AST walker)

**Analog:** self.

**No code change required.** This test asserts every `useTransform` keyframe entry is `0`, `1`, an `Identifier` (named const), or a `MemberExpression` (`STAGES[...].window[...]` / `byId(...).window[...]`). Phase 3's new `STAGES.flatMap((s) => [s.window[0], s.window[1]])` invocation passes — `s.window[0]` is a `MemberExpression`. Phase 3's named ease consts (`EASE_HERO_TO_WOW`, etc.) are `Identifier`s. Auto-pass.

**Phase 3 verifies only** — the executor runs this test after rewiring `product-screen.tsx` and confirms it stays GREEN. If it goes RED, the executor introduced an anonymous numeric literal somewhere and must extract it to a named const.

---

### `src/routes/index.head.test.tsx` (NEW — TanStack head() test)

**No analog in repo** — this is the first test for a TanStack `head()` config.

**Recommended bootstrap convention (synthesized from existing test patterns + TanStack docs):**

| Convention | Value | Rationale |
|------------|-------|-----------|
| File location | `src/routes/index.head.test.tsx` (co-located, suffix `.head.test.tsx`) | Matches "one vitest per source file" convention (Phase 1). The `.head.test.tsx` suffix disambiguates from a future `index.test.tsx` integration test. |
| Imports | `import { Route } from "./index"` (or `import { Route } from "./index.tsx"` if needed for `verbatimModuleSyntax`) | Pattern matches Phase 2 cross-file test imports. |
| Assertion strategy | Direct introspection of `Route.options.head?.()` return value | TanStack Start exposes the `head()` callback on the route definition; calling it synchronously returns the `{ links }` object. |

**Skeleton:**

```typescript
/**
 * Asserts the index route emits a `<link rel="preload">` for the AVIF
 * variant set (D-12 / VISUAL-03).
 *
 * Why test the route config object instead of the rendered DOM:
 *   - TanStack Start's head() runs at SSR; testing via render() would
 *     require a full router harness.
 *   - The route.options.head() callback is a pure function returning
 *     a plain object — direct introspection is the cheapest assertion.
 *
 * Critical: we assert React-19 camelCase keys (imageSrcSet, imageSizes,
 * fetchPriority) — the lowercase HTML attribute form is React's job
 * at serialization time. CONTEXT.md D-12 originally illustrated lowercase
 * keys; RESEARCH.md Pattern 4 corrected this to camelCase.
 */
import { describe, expect, it } from "vitest"
import { Route } from "./index"

describe("index route head() preload (D-12 / VISUAL-03)", () => {
  it("emits exactly one <link rel='preload' as='image'> for the AVIF variant set", () => {
    const head = Route.options.head?.()
    expect(head).toBeDefined()
    expect(head?.links).toBeDefined()
    const preloads = head!.links!.filter(
      (l: { rel?: string; as?: string }) => l.rel === "preload" && l.as === "image"
    )
    expect(preloads).toHaveLength(1)
  })

  it("uses React 19 camelCase keys (imageSrcSet, imageSizes, fetchPriority)", () => {
    const link = Route.options.head?.()?.links?.[0] as Record<string, unknown>
    expect(link.imageSrcSet).toEqual(expect.stringContaining(".avif 1280w"))
    expect(link.imageSizes).toBe("(min-width:1280px) 1280px, 100vw")
    expect(link.fetchPriority).toBe("high")
    expect(link.type).toBe("image/avif")
  })

  it("imageSizes value byte-matches the <picture> sizes contract", () => {
    // web.dev: imagesizes on <link> MUST equal sizes on <picture>/<img>
    // for the preloaded variant to match what the browser uses.
    const link = Route.options.head?.()?.links?.[0] as Record<string, unknown>
    const expected = "(min-width:1280px) 1280px, 100vw"
    expect(link.imageSizes).toBe(expected)
  })
})
```

**Note:** the actual `Route.options.head` shape depends on TanStack Start's API surface — the executor should verify by reading the existing route in `__root.tsx` for any precedent and/or running `Route.options` introspection in a REPL during planning. If the API doesn't expose `options.head` directly, the test falls back to a render-and-query-document.head approach.

---

## Shared Patterns

### Cross-cutting: Named-const intra-stage timing (D-13)

**Source:** `src/components/landing/scroll-choreography/paper-backdrop.tsx:42–59` and `scroll-choreography.tsx:48–53`.

**Apply to:** `product-screen.tsx` (Phase 3), `paper-backdrop.tsx` (Phase 3 retune).

**The rule:** Any numeric literal that isn't `0` or `1` and isn't a `STAGES` reference MUST be extracted to an UPPER_SNAKE_CASE `const` at the top of the component file. Enforced by `migrate-03-keyframe-binding.test.ts`.

**Concrete example** (paper-backdrop.tsx):
```typescript
// Stage-aligned endpoints — D-12: bind to STAGES via byId()
const VIDEO_GATE_THRESHOLD = byId("wow").window[1]

// Intra-stage timing constants — D-13: named local constants in component file
const STAGE_SCALE_MID_PROGRESS = 0.6
const STAGE_OPACITY_FADE_START = 0.6
const STAGE_OPACITY_FADE_END = 0.78
```

Phase 3 product-screen.tsx adds: `EASE_HERO_TO_WOW`, `EASE_WOW_TO_FA`, `LINEAR`, `FA_TO_FB_SCALE_DIP_PROGRESS`, `FA_TO_FB_SCALE_DIP_VALUE`, `SCREEN_OVERSHOOT`. All UPPER_SNAKE_CASE, all top-of-file under imports.

---

### Cross-cutting: useTransform direct-into-style (CHOREO-06 / Phase 2 D-10)

**Source:** `src/components/landing/scroll-choreography/paper-backdrop.tsx:68–87` and `scroll-choreography.tsx:102–111` and Phase 2 `product-screen.tsx:54–71`.

**Apply to:** `product-screen.tsx` Phase 3 expansion (3 calls — scale, x, opacity).

**The rule:** Visual properties flow from `useTransform(scrollYProgress, stops, values)` directly into `style={{...}}` on a `motion.div`. **NO `useState` / `useMotionValueEvent` / `setState` for visual values.** `useMotionValueEvent` is only legitimate for DOM-imperative side-effects (e.g., the video-gate `play()`/`pause()` in paper-backdrop.tsx:96–109).

**Concrete example** (paper-backdrop.tsx):
```typescript
const stageOpacity = useTransform(
  scrollYProgress,
  [STAGE_OPACITY_FADE_START, STAGE_OPACITY_FADE_END],
  [1, 0]
)
// ...
<motion.div style={{ scale: stageScale, opacity: stageOpacity }} />
```

Phase 3 product-screen.tsx replicates this with 8-stop arrays + per-segment `{ ease }` option.

---

### Cross-cutting: Named-export-only, no barrel files (Phase 1 D-04)

**Source:** Every file in `src/components/landing/scroll-choreography/`.

**Apply to:** all Phase 3 source/test files.

**The rule:** `export function FooBar()` / `export const FOO_BAR = …` / `export type FooBar = …`. No `export default`. No `index.ts` barrel. Imports always reach the source file directly: `import { ProductScreen } from "./product-screen"`, never `import { ProductScreen } from "."`.

---

### Cross-cutting: File header docstring (multiline `/** ... */`)

**Source:** `paper-backdrop.tsx:1–32`, `product-screen.tsx:1–29`, `scroll-choreography.tsx:1–27`.

**Apply to:** every modified Phase 3 source file (rewrite the header where scope changes).

**The rule:** Multi-paragraph docstring at top of file describing:
1. Purpose (what does this file do).
2. Phase context (which phase shipped what).
3. Locked invariants (CHOREO-01, CHOREO-06, etc.).
4. Notable quirks (e.g., paper-backdrop's "2026-04-29 scope shift" disclosure).

Comment style: opening `/**`, body lines start with ` *`, closing ` */`. Ranges of about 10–30 lines. Phase 3 must update the header on `product-screen.tsx` and `stages.ts` to reflect Phase 3 scope; the `paper-backdrop.tsx` and `scroll-choreography.tsx` headers need only minor edits (D-20 / D-09 cascade notes).

---

### Cross-cutting: Test file scaffolding (vitest + jsdom + Provider harness)

**Source:** `paper-backdrop.test.tsx:27–41`, `product-screen.test.tsx:27–41`.

**Apply to:** any Phase 3 test that renders a context-subscriber component.

**The shared `renderWithMockProgress(progress)` helper** is the canonical pattern. Copy it verbatim per file (no helper-extraction; tests are self-contained per Phase 1 testing convention).

```typescript
import { motionValue } from "motion/react"
import { ScrollChoreographyContext } from "./context"
import type { ScrollChoreographyContextValue } from "./types"

function renderWithMockProgress(progress = 0) {
  const mv = motionValue(progress)
  const value: ScrollChoreographyContextValue = {
    scrollYProgress: mv,
    stages: STAGES,
    reducedMotion: false,
    mode: "choreography",
  }
  const utils = render(
    <ScrollChoreographyContext.Provider value={value}>
      <ProductScreen />
    </ScrollChoreographyContext.Provider>
  )
  return { ...utils, scrollYProgress: mv }
}
```

For Phase 3 product-screen.test.tsx: keep this verbatim. The component under test uses identical context shape.

---

## No Analog Found

Files with no close in-repo analog (planner / executor must rely on RESEARCH.md + bootstrap conventions documented above):

| File | Role | Reason | Recovery |
|------|------|--------|----------|
| `scripts/gen-hero-images.mjs` | build-time Node script | Repo has no `scripts/` directory; first Node-script tooling. | RESEARCH.md Pattern 2 documents the sharp 0.34.5 API verbatim. Bootstrap convention: `.mjs` extension, double quotes, no semicolons, top-level `await`. |
| `src/routes/index.head.test.tsx` | TanStack head() test | Repo has no head-config tests yet. | Skeleton above leverages `Route.options.head?.()` introspection. If TanStack API differs, fall back to `render(<Route />)` + `document.head.querySelector('link[rel="preload"]')`. |
| `public/hero/profiles-screen-{640,960,1280,1600}.{avif,webp,png}` | static asset (12 files) | Repo has no asset-variant precedent in `public/hero/`. | Naming pattern `{base}-{width}.{ext}` synthesized from CONTEXT.md D-10 + matches MDN srcset convention. Files are generated, not authored — generated by `scripts/gen-hero-images.mjs`. |

---

## Metadata

**Analog search scope:**
- `src/components/landing/scroll-choreography/` (full directory — 18 files)
- `src/routes/` (`__root.tsx`, `index.tsx`)
- `src/components/landing/` (sibling components for component-style precedent)
- `src/lib/` (`utils.ts`)
- `package.json`, `tsconfig.json`, `.prettierrc` (config conventions)
- Top-level dirs: `scripts/` (does not exist), `tools/` (does not exist), `public/hero/`

**Files scanned:** ~25 source/config + 6 test files.

**Pattern extraction date:** 2026-04-29

**Confidence:** HIGH for all in-repo analogs (Phase 2's scroll-choreography subtree is dense with directly-applicable precedent). MEDIUM for the 3 NEW-with-no-analog files (RESEARCH.md provides verified API surface, but bootstrap conventions like script directory location remain Claude-decided per CONTEXT.md "Claude's Discretion").

---

## PATTERN MAPPING COMPLETE

**Phase:** 3 - Product Screen — The Single Shared Element
**Files classified:** 14
**Analogs found:** 11 / 14

### Coverage
- Files with exact analog (in-file evolution or sibling): 11
- Files with role-match analog: 0
- Files with NO analog (bootstrap convention required): 3 (`scripts/gen-hero-images.mjs`, `src/routes/index.head.test.tsx`, `public/hero/profiles-screen-*.{avif,webp,png}`)

### Key Patterns Identified
- **Phase 2's scroll-choreography subtree IS the analog.** Phase 3 is dense in-file evolution: `product-screen.tsx` 4-stop → 8-stop, `stages.ts` type alias → runtime const, `paper-backdrop.tsx` intra-stage const retune, `scroll-choreography.tsx` 1-line height edit. Every modify-file has its own past version as the closest analog.
- **Named-const intra-stage timing (D-13)** is enforced by `migrate-03-keyframe-binding.test.ts` AST walker. Every Phase 3 numeric-literal addition (eases, dip values, overshoot) MUST be extracted to a named const. Auto-passing of this test is a non-negotiable Phase 3 quality gate.
- **`useTransform` direct-into-style (CHOREO-06)** is the bedrock pattern. Phase 3's three `useTransform` calls (scale, x, opacity) flow into `style={{...}}` on a single `motion.div` — no `useState`, no `useMotionValueEvent` for visual values. The `useMotionValueEvent` exception (paper-backdrop.tsx:96–109 video gate) is DOM-imperative only.
- **React 19 camelCase JSX props for `<picture>` and `<link>` preload** is the load-bearing detail (RESEARCH.md Pattern 3 + Pattern 4). Both `srcSet`/`sizes` on `<source>`/`<img>` AND `imageSrcSet`/`imageSizes`/`fetchPriority` on `<link>` MUST be camelCase. Lowercase will silently be dropped by React.
- **Test harness pattern (`renderWithMockProgress`)** is duplicated verbatim per test file (no helper extraction). Phase 1 testing convention; Phase 3 continues.
- **Bootstrap conventions for new files** synthesized from CLAUDE.md + repo style: `.mjs` for Node scripts, `scripts/` directory, double quotes, no semicolons, top-of-file imports, `as const satisfies` for typed const exports.

### File Created
`/Users/rezailmi/Developer/marketing-teacher-workspace/.planning/phases/03-product-screen-the-single-shared-element/03-PATTERNS.md`

### Ready for Planning
Pattern mapping complete. Planner can now reference each Phase 3 file's analog patterns + concrete code excerpts when authoring action steps in PLAN.md files. The 3 NO-ANALOG files (`scripts/gen-hero-images.mjs`, `src/routes/index.head.test.tsx`, `public/hero/profiles-screen-*.*`) have explicit bootstrap conventions documented above; the planner should cite RESEARCH.md Pattern 2 / Pattern 4 verbatim for sharp + TanStack head() implementation details.
