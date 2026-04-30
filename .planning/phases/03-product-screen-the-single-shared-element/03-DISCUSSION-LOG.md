# Phase 3: Product Screen — The Single Shared Element - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-30
**Phase:** 3-Product Screen — The Single Shared Element
**Areas discussed:** Transform stitching shape, Dock geometry & SCREEN_TARGETS values, Responsive image + LCP strategy (VISUAL-03), Midstate design for VISUAL-04

---

## Transform Stitching Shape

### Q1 — Where should keyframe stops sit on scrollYProgress for each stage?

| Option | Description | Selected |
|--------|-------------|----------|
| Window-edge with holds | Each stage holds at peak between window[0] and window[1]; morph happens between adjacent windows. | ✓ |
| Peak-only stops, continuous | One stop per stage at peak; motion interpolates linearly. No plateau. | |
| Hybrid: holds for hero/wow, continuous for fA↔fB | Hero/wow use holds; docked stages share scale and only morph x. | |

**User's choice:** Window-edge with holds (Recommended)
**Notes:** Reads as four discrete legible "beats" with clean morph zones — same shape Phase 2 already uses.

### Q2 — How should the four stages partition scrollYProgress?

| Option | Description | Selected |
|--------|-------------|----------|
| Wow-emphasis | hero[0,0.10] / wow[0.20,0.55] / fA[0.65,0.78] / fB[0.85,1.0] — 35% wow plateau. | ✓ |
| Equal-share four quarters | Each stage gets ~25% of scroll. Predictable but dilutes the wow moment. | |
| Late-loading docked stages | Hero+wow fast; docks get most scroll time. Risks wow feeling rushed. | |

**User's choice:** Wow-emphasis (Recommended)
**Notes:** The 35% wow plateau is the centerpiece reveal; narrow hero (10%) sets up; docked stages (~13–15% each) deliver feature copy.

### Q3 — Which axes should the screen morph animate across the four stages?

| Option | Description | Selected |
|--------|-------------|----------|
| scale + x + opacity | Three motion values. y=0 throughout. No clipPath. | ✓ |
| scale + x + y + opacity | Adds vertical position. 4th useTransform call. | |
| scale + x + opacity + clipPath | clipPath as 4th axis for shape-morph. Higher risk; finicky interpolation. | |

**User's choice:** scale + x + opacity (Recommended)
**Notes:** y stays at 0 (vertical viewport center for all stages). 3 useTransform calls per ProductScreen — matches research/ARCHITECTURE.md sketch.

### Q4 — How should ProductScreen read its per-stage targets?

| Option | Description | Selected |
|--------|-------------|----------|
| Data-driven from SCREEN_TARGETS map | Phase 3 fills SCREEN_TARGETS runtime; ProductScreen iterates STAGES.flatMap. | ✓ |
| Inline named local consts (no SCREEN_TARGETS map) | Skip the map; explicit named consts in ProductScreen. | |
| Hybrid: SCREEN_TARGETS for values, inline useTransform calls | Map for values but explicit per-axis useTransform writes. | |

**User's choice:** Data-driven from SCREEN_TARGETS map (Recommended)
**Notes:** Single source of truth; honors Phase 1 D-11 + Phase 2 D-11 commitment.

---

## Dock Geometry & SCREEN_TARGETS Values

### Q1 — What should the screen look like during the hero stage?

| Option | Description | Selected |
|--------|-------------|----------|
| Hidden during hero, fades in during wow morph | opacity 0 at hero, ramps to 1 during morph zone. Preserves Phase 2 behavior. | ✓ |
| Visible tiny inside the illustration | opacity 1 during hero — ghost-like presence inside the paper card. | |
| Faded ghost (opacity ~0.4) | Partial visibility during hero, ramps to 1 during wow. | |

**User's choice:** Hidden during hero, fades in during wow morph (Recommended)
**Notes:** Cleaner narrative — paper world first, product reveals during the wow morph.

### Q2 — Which side does each feature stage dock the screen to?

| Option | Description | Selected |
|--------|-------------|----------|
| feature-a → left, feature-b → right | screen-left+copy-right → mirrors → screen-right+copy-left. | ✓ |
| feature-a → right, feature-b → left | Reverse reading order. | |
| Same side for both (slide vertically) | No center-crossing morph. Simpler animation. | |

**User's choice:** feature-a → left, feature-b → right (Recommended)
**Notes:** Negative x = move screen leftward (toward viewport left). docked-left.x = "-28vw"; docked-right.x = "+28vw". fA→fB slides through center.

### Q3 — How aggressive should the dock be?

| Option | Description | Selected |
|--------|-------------|----------|
| Modest dock: scale 0.55, x ±22vw | Same as hero scale. Tight on copy room. | |
| Balanced dock: scale 0.5, x ±28vw | Smaller dock + more aggressive offset. ~55% viewport for copy. | ✓ |
| Aggressive dock: scale 0.42, x ±32vw | Smallest dock; most viewport for copy. Risk: detail loss undermines VISUAL-01. | |

**User's choice:** Balanced dock: scale 0.5, x ±28vw (Recommended)
**Notes:** Standard split for Stripe/Linear-style sticky-scroll feature blocks. Phase 4 has room for kicker + heading + 3 staggered bullets.

### Q4 — How tall should the orchestrator's tall outer container be?

| Option | Description | Selected |
|--------|-------------|----------|
| h-[400lvh] | 4× viewport height. Standard for 4-stage choreographies. | ✓ |
| h-[360lvh] | Tighter. Faster overall scrub. Risk: docked stages feel rushed. | |
| h-[480lvh] | 5× viewport. Long pinned scroll. "Am I stuck?" anxiety risk. | |
| Defer — planner tunes during execution | Don't lock now; tune at human-verify checkpoint. | |

**User's choice:** h-[400lvh] (Recommended)
**Notes:** Wow plateau gets ~1.4 viewports of scrub; docked stages ~0.5 viewport each. Replaces Phase 2's h-[280lvh].

---

## Responsive Image + LCP Strategy (VISUAL-03)

### Q1 — How should responsive image variants be produced and served?

| Option | Description | Selected |
|--------|-------------|----------|
| Build-time sharp script + static <picture> | One-shot pnpm script generates 12 variants; <picture> with three <source> tags. | ✓ |
| Vercel Image Optimization | On-demand variants via Vercel runtime. Couples to Vercel runtime. | |
| Vite/build plugin (vite-imagetools) | Variants generated at build time via vite plugin. New devDep. | |

**User's choice:** Build-time sharp script + static <picture> (Recommended)
**Notes:** Zero runtime cost; reproducible; works offline. The page already deploys static — no Vercel-specific runtime needed.

### Q2 — Where and how should the LCP preload tag be emitted?

| Option | Description | Selected |
|--------|-------------|----------|
| Index route head() with imagesrcset | <link rel='preload'> in src/routes/index.tsx createFileRoute head config. | ✓ |
| Root route head() (always preload) | __root.tsx — fires on every route. Wasteful for future routes. | |
| Skip preload on mobile / reduced-motion | Media-query gated preload. Spotty browser support. | |

**User's choice:** Index route head() with imagesrcset (Recommended)
**Notes:** imagesrcset matches <picture> srcset so browsers preload the same variant the renderer will pick. Lives only on '/' route.

### Q3 — What alt text should the product screenshot carry?

| Option | Description | Selected |
|--------|-------------|----------|
| Spec example verbatim | "Teacher Workspace student view showing attendance, behavior notes, and family messages" — matches ROADMAP SC #5. | ✓ |
| Short and abstract | Current Phase 2 alt: "Teacher Workspace student insights dashboard". | |
| Lock as a content edit — store in landing.ts | Move alt into src/content/landing.ts as productScreenCopy export. | |

**User's choice:** Spec example verbatim (auto-selected at user request — see Claude's Discretion)
**Notes:** User chose to switch to auto-recommended for remaining questions and proceed to plan-phase. Spec-verbatim alt is the most descriptive option and matches ROADMAP SC #5 word-for-word.

---

## Midstate Design for VISUAL-04

The user opted to skip detailed Q&A on this area and let Claude pick recommended defaults so the workflow could advance to plan-phase.

**Auto-decided defaults captured in CONTEXT.md D-14 through D-17:**
- D-14: Per-axis cubic-bezier easing in each useTransform `{ ease }` option (named curves matching the morph intent — e.g., `[0.32, 0, 0.67, 1]` for hero→wow scale).
- D-15: Light overshoot (~1.04× target scale) at each stage's arrival, matching Phase 2's hero→wow `1.04` peak pattern.
- D-16: fA→fB cross-center morph keeps linear x with a subtle scale dip (peak ~0.45 at midpoint) — reads as "passing behind copy" not "ghosting through".
- D-17: Plan schedules a `checkpoint:human-verify` for visual review at 25/50/75 of every transition during execution.

These are starting tuning values, adjustable by planner / executor at the human-verify checkpoint.

---

## Claude's Discretion

The user redirected mid-discussion ("please auto answers all next questions with the most recommended options and then continue to next gsd workflow") after Q3 of the Image strategy area. The following decisions are **Claude-picked defaults**, not user-locked:

- **Q4 of Image strategy (variant size set):** widths `640 / 960 / 1280 / 1600` × {avif, webp, png} = 12 variants. Covers mobile (640), tablet (960), desktop wow plateau (1280, the inner wrapper's max-width), and 1.25× retina at 1280 display (1600).
- **Midstate design (VISUAL-04) — full area:** see D-14 through D-17 in CONTEXT.md. All four sub-decisions are starting values, tunable at the visual-review checkpoint.
- **Section-height retune (D-09):** locked at `h-[400lvh]` per user selection — but Phase 2's intra-stage timing consts in `paper-backdrop.tsx` (D-20) are Claude-picked first-pass numbers (`STAGE_OPACITY_FADE_START` = 0.45, `STAGE_OPACITY_FADE_END` = 0.55). Planner reviews magnitudes against visual feel.
- **Test infrastructure:** whether to assert `SCREEN_TARGETS` map shape directly vs only assert resulting `useTransform` keyframe arrays — default: assert the map shape directly (one source of truth).
- **`gen-hero-images.mjs` script location:** `scripts/` (new directory) chosen as default — first usage of the dir.
- **Manual run vs `prebuild` hook:** manual + commit chosen as default. Variants are checked-in artifacts; auto-running on every CI / dev start would slow feedback loops.
- **Whether to update `<StaticChoreographyFallback/>`'s image rendering** in Phase 3: deferred to Phase 5 (MIGRATE-05) — Phase 3 only touches the choreography path's `<ProductScreen/>` per Phase 2 D-03.

## Deferred Ideas

See CONTEXT.md `<deferred>` section. Highlights:

- `<StageCopy>` panels for wow / feature-a / feature-b + per-stage copy fades + 200–300ms bullet stagger → Phase 4 (CONTENT-01..05).
- `<StaticChoreographyFallback/>` `<picture>` upgrade → Phase 5 (MIGRATE-05).
- Lighthouse / web-vitals / axe-core / iOS Safari real-device audit → Phase 6.
- OG / canonical / title meta using product UI image → Phase 4 (SEO-01..03).
- `pointer-events` toggle when docked (clickable thumbnail) → Phase 4 reconsider.
- POLISH-02 / POLISH-03 / POLISH-05 (UI-region highlight, theme tone-shift, video at stage 2) → v2.
- Adding `y` and `clipPath` axes to `SCREEN_TARGETS` if a future stage needs them → v2 candidates; type fields already declared.
- `pnpm prebuild` hook to auto-run `gen:hero-images` → revisit only if variant drift becomes a problem.
