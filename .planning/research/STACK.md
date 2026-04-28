# Stack Research — Scroll-Driven Shared-Element Choreography

**Domain:** Marketing-site scroll choreography (4-stage shared-element morph) on TanStack Start + React 19 + Tailwind v4 + motion/react
**Researched:** 2026-04-28
**Confidence:** HIGH (motion/react APIs verified against motion.dev docs via Context7; pinning + sticky patterns cross-checked against community sources and motion's own docs)

## Constraints This Research Honors

- **Stack is locked**: React 19.2 + TanStack Start 1.166 + Tailwind v4.2 + motion/react 12.38 + Radix/shadcn + lucide-react. Do NOT propose framework swaps.
- **No GSAP / no ScrollTrigger / no canvas**: explicitly ruled out by milestone.
- **Brownfield**: `paper-hero.tsx` already uses `useScroll` + `useTransform` + `useMotionValueEvent` + `useReducedMotion`. The choreography extends that pattern, it does not replace it.
- **Mobile gets a static stacked fallback by design** — no engineering on pinned mobile scroll.

## Recommended Stack

### Core Technologies (already installed — pin and use)

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| `motion` (motion/react) | `^12.38.0` (current 12.38.x line; 12.37 added hardware-accelerated `start`/`end` offsets, 12.35 added `ViewTimeline` support, 12.38 added `layoutAnchor`) | Scroll-linked motion values, layout animations, reduced-motion handling | Stack standard; v12 has full React 19 + concurrent rendering support; `useScroll` is built on the browser's native `ScrollTimeline` API where available, with motion's render-batched fallback elsewhere — this is what makes pinned scroll choreographies smooth on the compositor. No API breaking changes from `framer-motion`. |
| `react` | `19.2.4` (locked) | UI runtime | motion 12 supports React 18.2+ including 19; no concurrent-rendering pitfalls for `useScroll` in this app shape. |
| `@tanstack/react-router` + TanStack Start | `1.166–1.167` (locked) | SSR shell | The choreography is a single-route, client-driven concern; SSR only needs to render the static end-state markup. No router-specific work required for the morph itself. |
| `tailwindcss` | `4.2.1` (locked) | Layout, sticky positioning, container queries, aspect-ratio, responsive switching | Tailwind v4 ships native `@container` utilities, `aspect-[…]`, `sticky`, `clip-path-[…]` (arbitrary), and `motion-safe:` / `motion-reduce:` variants — exactly the toolkit needed for sticky pinning + responsive fallback without adding a plugin. |

### motion/react APIs to use (the prescriptive list)

| API | Use For | Notes / Pitfalls |
|-----|---------|------------------|
| `useScroll({ target, offset })` | Per-section scroll progress (one call per stage container) | `target` is a single ref — **not an array**. For 4 stages, call `useScroll` either once on a single tall parent (driving the whole choreography from one progress value) OR once per stage container. **Recommended:** one tall sticky parent for the morph trio (Wow → Feature A → Feature B), with the existing hero kept as its own `useScroll` (preserving `paper-hero.tsx` behavior). See "Architecture Pattern" below. |
| `useTransform(progress, inputRange, outputRange, { clamp })` | Map a single `scrollYProgress` to per-stage values (x, y, scale, opacity, clip-path) using multi-stop input ranges like `[0, 0.25, 0.5, 0.75, 1]` | Use multi-stop ranges to encode all 4 stages on one progress value. `clamp: true` (default) prevents over/undershoot at section boundaries. |
| `useMotionValueEvent(mv, "change", cb)` | Side-effects driven by progress (e.g., setting video `currentTime`, toggling React state for opacity gates) | Already used in `paper-hero.tsx` for video scrubbing — keep that pattern. Prefer pure motion values over React state where possible (one less render). |
| `useSpring(progress, { stiffness, damping, restDelta, skipInitialAnimation: true })` | Optional smoothing of the scroll progress before feeding `useTransform` | **Use sparingly.** Spring-smoothed scroll feels luxurious on parallax but introduces lag that can desync the morph from scroll position. For shared-element morph, prefer the raw progress; only smooth secondary parallax (clouds, copy fade). `skipInitialAnimation: true` prevents a first-frame jump on mount. |
| `useReducedMotion()` | Branch the entire choreography to a stacked, non-pinned layout | Already used in `paper-hero.tsx`. Keep the same pattern: `const reduced = useReducedMotion() === true` and gate the sticky parent. |
| `<MotionConfig reducedMotion="user">` | Optional global guard wrapping the whole landing | When set, motion auto-disables transform/layout animations for users with the OS preference, preserving opacity. Useful as a belt-and-braces alongside explicit `useReducedMotion()` branching. |
| `motion.div style={{ scale, x, y, opacity, clipPath }}` | The morphing screen element itself | Use direct motion-value styles (transform/opacity only) — these are GPU-accelerated and stay on the compositor. No layout thrash. |
| `style={{ willChange: "transform" }}` | Optional hint on the morphing element | Helps browsers promote the element to its own layer when scale/clip-path change frequently. Don't sprinkle widely — only on the single morph container. |

### motion/react APIs to AVOID for this milestone

| API | Why to Avoid Here | What to Use Instead |
|-----|-------------------|---------------------|
| `layoutId` / `LayoutGroup` for the cross-stage morph | **Documented bugs with `position: sticky` and `position: fixed`.** Layout projection includes window scroll for stuck/fixed elements, which produces incorrect start/end positions. Combined with shared-layout animations, results are flaky in scroll contexts. (motion issues #1535, #1580, #2006, #2111) | **One persistent motion element** rendered inside the sticky container, driven by `useTransform` on `scrollYProgress`. The "shared element" illusion comes from the element never unmounting — it just transforms. This is what `paper-hero.tsx` already does between Hero and Wow stages. Extend the same pattern across all 4 stages. |
| `layoutScroll` prop | Doesn't fix the sticky+layoutId combo (see issue #2111). Only relevant if you have an internal scrollable container, which we don't. | Not needed. |
| `layoutRoot` prop | Only for `position: fixed` containers with layout-animated children — irrelevant to a `position: sticky` choreography that uses motion values, not layout. | Not needed. |
| `useScrollTimeline` hook | **Does not exist as a public hook.** `useScroll` itself uses the native `ScrollTimeline` API under the hood when available; there is no separate hook to call. (Motion v12.35 added internal `ViewTimeline` support — same story: it's an implementation detail of `useScroll`.) | `useScroll`. |
| `AnimatePresence` for the morph | Unmounting + remounting the morph element across stages would defeat the "shared element" feel and re-trigger image decode. | Keep the morph element mounted across all 4 stages; only mount/unmount surrounding copy blocks. |
| Spring-smoothed `scrollYProgress` for the morph itself | Introduces lag between scroll position and morph position; user feels the screen "drift" away from their fingertip. | Raw `scrollYProgress` for the morph; spring only for ambient parallax (clouds, background drift). |
| Animating layout properties (`width`, `height`, `top`, `left`) | Triggers layout/paint; janks at 60fps under scroll. | Animate `transform` (`scale`, `x`, `y`) and `opacity` only. For shape changes use `clip-path`, which is also GPU-friendly. |

### Supporting Libraries (already installed — keep)

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `class-variance-authority` | `0.7.1` | Variant-based class composition | Existing Button pattern; reuse for any new variant components. |
| `clsx` + `tailwind-merge` (via `cn()`) | `2.1.1` / `3.5.0` | Conditional + dedup'd class merging | Required for any responsive class toggling (`sm:sticky`, `motion-reduce:relative`, etc.). |
| `tw-animate-css` | `1.4.0` | CSS animation utilities | Optional for reduced-motion fade-ins; not required for the morph itself. |
| `lucide-react` | `1.9.0` | Iconography | Stage labels / feature bullets. Pure SVG, no animation impact. |
| `web-vitals` | `5.1.0` | Verify CLS / INP didn't regress | Critical for PERF-01. Already installed; wire into a one-shot logger when validating the milestone. |

### CSS / Tailwind Patterns Recommended

| Pattern | Tailwind Utility | Use For | Notes |
|---------|------------------|---------|-------|
| Sticky parent for pinned choreography | `sticky top-0 h-svh` inside a tall outer container (e.g. `h-[400vh]` or `h-[500vh]`) | The morph viewport | Use `h-svh` (small viewport) over `h-screen` to avoid mobile-browser-chrome jumps. The outer height drives the scroll distance — longer = slower / more granular morph. |
| Scroll length per stage | `h-[400vh]` outer ⇒ ~100vh per stage (4 stages) | Total scroll budget | Tune by feel; 100vh per stage is a baseline. Wow stage often needs 100–150vh for the punch; docked stages can be shorter. |
| Aspect ratio lock for the morph element | `aspect-[16/10]` or `aspect-video` | Screen frame keeps proportions through scale | Prevents the screenshot distorting at non-1:1 scales. |
| Container queries for the docked layout | `@container` on the sticky parent + `@md:flex-row` on children | Switching feature copy + screen position at the *container* size, not viewport | Tailwind v4 has this built-in. Useful because the sticky parent's effective width is what matters, not the page width. |
| Wow-stage shape transition | `clip-path: inset(…)` driven by `useTransform` | Optional reveal effect (e.g., the screen "unmasks" from a paper-shaped clip into a clean rectangle) | `clip-path` is GPU-accelerated. Animating `inset()` percentages or `polygon()` points works well. Do not animate `border-radius` simultaneously — too many compositor changes. |
| Z-index stacking for video underneath morph | `z-0` on video, `z-10` on paper card, `z-20` on morph overlay | Already established in `paper-hero.tsx` | Keep the existing pattern: video sits at the back of the sticky container; the morphing screen overlay sits on top with `pointer-events-none` until it docks (then re-enables on the docked feature stages if it has interactive elements). |
| Reduced-motion / mobile static fallback | `motion-reduce:static motion-reduce:h-auto` on the outer container, plus a `md:` / `@container` breakpoint to swap the sticky version for a stacked one | Single source of truth for the static layout | The static end-state of each stage is the same DOM; reduced-motion / small-viewport just turns OFF the sticky pin and renders stages as normal stacked sections. **Do not duplicate components.** |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| Browser DevTools → Performance tab | Verify the morph stays on the compositor (no layout/paint events during scroll) | The single most important debugging tool. If you see purple "Layout" or green "Paint" bars during scroll, you've animated the wrong property. |
| Chrome DevTools → Animations panel | Inspect timing/easing curves | Useful for tweaking transitions on docked-stage copy fade-ins. |
| `useMotionValueEvent(scrollYProgress, "change", console.log)` | Cheap scrubber/probe during development | Drop in temporarily to log progress at each scroll position; remove before commit. |
| **Motion DevTools** | Browser extension for inspecting motion values | **NOTE:** the official Motion DevTools is currently **incompatible with motion 12** (per the upgrade guide). It only supports `motion@10`. Do **not** plan around it for this milestone. |
| `web-vitals` one-shot logger | CLS/INP regression check before shipping | Wire it up against the previous landing once, capture baseline; re-run after the choreography lands. |
| Vitest + @testing-library/react | Unit-test the reduced-motion branch | Mock `matchMedia` to assert the static-fallback markup renders without motion components. |

## Architecture Pattern (the load-bearing decision)

**Choose: One tall outer section per "pinned scene", containing a single `position: sticky` viewport, with one `useScroll` per pinned scene.**

```
<section> (Hero — already exists, h-[280vh], its own useScroll)
  <div class="sticky top-0 h-svh"> ... existing paper card ... </div>
</section>

<section ref={choreoRef} class="relative h-[400vh]">  ← NEW: the 3-stage choreography
  <div class="sticky top-0 h-svh overflow-hidden">
    <video … />                         ← stays underneath, z-0
    <motion.div style={{ scale, x, y, clipPath }} …>
      <BrowserFrame screenshot />        ← THE ONE morphing element
    </motion.div>
    <CopyBlock stage="wow" style={{ opacity }} />
    <CopyBlock stage="featureA" style={{ opacity, x }} />
    <CopyBlock stage="featureB" style={{ opacity, x }} />
  </div>
</section>
```

### Why one tall section (not stacked stickies)

- **One progress value drives all 3 morph stages** — easier to reason about transitions and crossfades than coordinating multiple `scrollYProgress` values.
- **The morphing element never unmounts** — that's what makes it feel "shared". No `layoutId` needed and none of its sticky-related bugs.
- **Multi-stop `useTransform` ranges encode the choreography declaratively**:
  ```tsx
  const screenScale = useTransform(scrollYProgress, [0, 0.25, 0.55, 1], [1, 1.1, 0.7, 0.7])
  const screenX     = useTransform(scrollYProgress, [0, 0.5, 0.7, 0.85, 1], ["0%", "0%", "-22%", "-22%", "22%"])
  const wowOpacity   = useTransform(scrollYProgress, [0, 0.1, 0.4, 0.5], [0, 1, 1, 0])
  const featureAOp   = useTransform(scrollYProgress, [0.5, 0.6, 0.7, 0.8], [0, 1, 1, 0])
  const featureBOp   = useTransform(scrollYProgress, [0.8, 0.85, 1], [0, 1, 1])
  ```
- **Hero stays separate** — the existing `paper-hero.tsx` already pins itself; keeping it as its own scroll context preserves the working video-scrub logic and isolates risk.

### Why NOT stacked sticky sections per stage

- Each stage would need its own `useScroll`, and the morph element would have to live in only one of them — meaning either it duplicates (not "shared") or you reach for `layoutId` (which has the documented sticky bugs).
- Crossfading between two pinned siblings is harder than crossfading copy blocks within one pinned parent.

### Why NOT `layoutId` here

Re-stating because this is the load-bearing anti-recommendation: motion's layout animations measure positions relative to the document and incorrectly include scroll offset for stuck/fixed elements. Multiple open issues confirm this is unfixed in motion 12: #1535 (sticky containers), #1580 (after page scroll), #2006 (scroll + nav), #2111 (`layoutScroll` doesn't fix it). For a 4-stage scroll choreography where the element lives inside a pinned container, **direct motion values on a persistent element are the correct primitive, not `layoutId`.**

## Reduced-Motion Strategy (prescriptive)

**Pattern: Branch the markup, not just the values.**

```tsx
const reduced = useReducedMotion() === true

return reduced ? (
  // Static stacked end-states — every stage is a normal section with its terminal copy and screenshot
  <>
    <HeroStatic />
    <WowStatic />
    <FeatureAStatic />
    <FeatureBStatic />
  </>
) : (
  // Pinned choreography
  <ChoreographyPinned />
)
```

**Why branch instead of `MotionConfig reducedMotion="user"`:**
- `MotionConfig reducedMotion="user"` only disables transform/layout animation values; it does NOT remove the `h-[400vh]` outer container or the `sticky top-0` viewport. Reduced-motion users would still scroll through 4 viewports of static content.
- Branching the JSX returns the page to a normal stacked layout — same total scroll length as a regular landing page, all content reachable, no animation artifacts.
- The static stage components are reusable for the mobile fallback (see below) — single source of truth.

**Belt-and-braces:** also wrap the page in `<MotionConfig reducedMotion="user">` so any nested motion components (e.g., a forgotten hover animation) honor the preference automatically.

## Mobile Static-Fallback Pattern (prescriptive)

**Pattern: Container-query / breakpoint switch — same primitive as reduced-motion branching, different trigger.**

Two viable approaches; recommend Option A:

**Option A (recommended): Match-media breakpoint via JS, render same static components**

```tsx
const reduced = useReducedMotion() === true
const isDesktop = useMediaQuery("(min-width: 1024px)") // small custom hook
const useStaticLayout = reduced || !isDesktop

return useStaticLayout ? <StackedStatic /> : <ChoreographyPinned />
```

- ✅ Same `<StackedStatic>` component serves both reduced-motion users AND mobile users — **no duplicated content**.
- ✅ JS branch means the heavy `useScroll` / sticky / multi-stop transforms tree is never instantiated on mobile (memory + CPU win).
- ⚠️ Use a `useMediaQuery` hook with SSR-safe initial state (default to mobile to avoid hydration flash, then upgrade to desktop on client mount).

**Option B (alternative): CSS-only via `lg:` Tailwind breakpoint + `motion-reduce:`**

```tsx
<div className="contents lg:hidden motion-reduce:contents lg:motion-reduce:hidden">
  <StackedStatic />
</div>
<div className="hidden lg:contents motion-reduce:hidden">
  <ChoreographyPinned />
</div>
```

- ✅ No JS hook; SSR-friendly.
- ❌ Both component trees mount and the `useScroll` hooks in `ChoreographyPinned` execute even on mobile (just hidden). Wasted work and observer subscriptions.

**Recommendation:** Option A. The `useScroll` hook attaches scroll listeners and `IntersectionObserver`s on mount; you don't want those firing on mobile users who will never see the choreography.

## Video-Underneath-Morph Stacking (z-index + transforms)

The morphing screen is overlaid on top of the existing scroll-linked video. To keep them visually layered without compositing artifacts:

1. **Both must be inside the same `position: sticky` parent** so they pin together.
2. **Stacking context** — give the sticky parent `position: relative` (it already is, by virtue of being sticky). Children use `z-0` (video), `z-10` (paper card / illustration), `z-20` (morphing screen overlay). This is the existing `paper-hero.tsx` pattern; extend it.
3. **Don't transform the sticky parent itself** — transforms on a sticky element create a containing block for `position: fixed` descendants and can interfere with sticky behavior in some browsers. Only transform the children (the paper card and the morph overlay).
4. **`pointer-events-none` on the morph overlay during transit stages**, re-enable on docked stages if you want the overlay to be interactive (e.g., a "view live" link inside the browser frame). The video already has `pointer-events: none` implicitly (no controls).
5. **`backdrop-filter` warning**: avoid `backdrop-blur` on the morph overlay during scroll — backdrop filters are expensive on the compositor and will cause INP regressions on mid-tier devices. If you want a "frosted" look on the docked feature copy, use `bg-white/85` (opaque-ish solid) instead.
6. **Video pause-during-non-hero**: the existing video scrubs to a frame based on hero `scrollYProgress`. Once past the hero section, leave the video on its last frame (don't tear it down — keeps the visual continuity if the user scrolls back up).

## Installation

```bash
# All required packages are already installed. No new dependencies needed.
# Verify versions:
pnpm list motion react @tanstack/react-router tailwindcss
# Expected: motion 12.38.x, react 19.2.x, tailwindcss 4.2.x
```

If any drift is found:

```bash
pnpm add motion@^12.38.0
```

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| Direct motion values on a persistent morph element | `layoutId` shared-element animation | Use only if there's NO sticky/fixed positioning involved (e.g., card-to-modal transitions). Not applicable to this milestone. |
| One tall sticky parent for 3 stages | Stacked sticky sections, one per stage | Use stacked stickies if stages have radically different scroll lengths or if SEO requires each stage as its own `<section>` with independent semantic structure. For a tightly choreographed morph, one parent is simpler. |
| Raw `scrollYProgress` driving the morph | `useSpring`-smoothed progress | Use spring smoothing only for ambient secondary motion (cloud parallax, copy fade) where lag improves the feel, never on the morph itself. |
| JS-driven mobile/reduced-motion branch | CSS-only `lg:hidden` + `motion-reduce:` swap | Use CSS-only if you must avoid any client-side hook (e.g., strict no-JS policy). Costs duplicate hook subscriptions on mobile; not worth it here. |
| `clip-path: inset()` for shape transitions | `mask-image` with gradient | Use `mask-image` if you need feathered edges; `clip-path` is sharper and faster. For a "screen unmasks from paper" effect, `clip-path` is the right call. |
| Tailwind v4 `@container` queries | Plain `md:` / `lg:` viewport breakpoints | Use container queries when the morph viewport's effective width matters more than the page width — useful on the docked stages where the screen takes 60% of the sticky parent's width. |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| GSAP / ScrollTrigger | Explicitly ruled out by milestone constraints; would duplicate motion's capabilities and double the animation runtime cost. | motion/react `useScroll` + `useTransform`. |
| `layoutId` across sticky containers | Documented bugs (motion issues #1535, #1580, #2006, #2111) where stuck/fixed projection includes scroll offset incorrectly. | One persistent motion element with `useTransform`-driven values. |
| `useScrollTimeline` (as a hypothetical hook name) | Does not exist as a public motion API. ScrollTimeline is used internally by `useScroll`. | `useScroll` — it already uses ScrollTimeline under the hood where the browser supports it. |
| `AnimatePresence` for stage transitions | Mounting/unmounting the morph element loses the "shared" feel and triggers image decode each time. | Keep the morph mounted; toggle opacity/transform of surrounding copy via motion values. |
| Animating `width`, `height`, `top`, `left` | Causes layout/paint during scroll → 60fps janks. | Animate `transform` (`scale`, `x`, `y`) and `opacity`. Use `clip-path` for shape changes. |
| `backdrop-filter: blur()` on scroll-linked elements | Compositor cost on mid-tier devices; INP regression risk. | Solid translucent backgrounds (`bg-white/85`). |
| Smooth-scroll polyfills (Lenis, Locomotive) | Hijacks native scroll, conflicts with `useScroll`'s ScrollTimeline integration, breaks mobile feel. | Native browser scroll. Use `useSpring` only for derived values, not for the scroll itself. |
| `MotionConfig reducedMotion="user"` AS THE ONLY reduced-motion strategy | Disables animation values but keeps the 4×viewport tall pinned container — reduced-motion users still scroll through dead space. | Branch the JSX (`if (reduced) return <Static />`). MotionConfig is fine as additional belt-and-braces. |
| Canvas / WebGL for the morph | Massive complexity for what is a 2D transform of a single rectangular screenshot. | DOM `<motion.div>` + transforms. The whole thing stays at <5kb of code. |
| Motion DevTools (browser extension) | Currently incompatible with motion 12 (per official upgrade guide). Only supports motion@10. | Browser DevTools Performance + Animations panels; ad-hoc `useMotionValueEvent` logging. |

## Stack Patterns by Variant

**If the choreography needs more than 4 stages later:**
- Same one-tall-sticky-parent pattern; add more stops to the `useTransform` input ranges.
- Each new stage costs ~100vh of scroll height and one more multi-stop point per animated value.
- No architectural change.

**If a stage needs interactive elements inside the morphed screen (e.g., clickable buttons in the docked feature):**
- Wrap that stage's interactive zone in a sub-component that toggles `pointer-events: auto` only when its stage's opacity is at full (use a `useMotionValueEvent` to flip a React state).
- Keep `pointer-events: none` on the morph overlay during transit between stages.

**If performance regresses on mid-tier hardware:**
- First lever: increase the per-stage scroll budget (`h-[400vh]` → `h-[500vh]`) to lower per-frame change-rate.
- Second lever: add `style={{ willChange: "transform" }}` to the morph element (forces a compositor layer).
- Third lever: replace `clip-path` transitions with `opacity` crossfades between two pre-rendered states.
- Last resort: drop the wow-stage shape transition entirely; keep only `scale` + `opacity`.

**If the team wants a debugging scrubber:**
- Drop a `<input type="range" min="0" max="1" step="0.001">` in dev that calls `scrollYProgress.set(value)` (motion values support `.set()`). Lets you scrub the entire choreography without scrolling. Strip before commit.

## Version Compatibility

| Package A | Compatible With | Notes |
|-----------|-----------------|-------|
| `motion@^12.38.0` | `react@>=18.2`, including `react@19.2.4` | Verified via motion's upgrade guide. No concurrent-rendering pitfalls observed for `useScroll` in this app shape. |
| `motion@^12` | `tailwindcss@4.x` | No interaction; motion is JS-only, Tailwind is CSS-only. |
| `tailwindcss@4.2` | `@tailwindcss/vite@4.2` | Required peer; already installed. |
| `motion@^12` | TanStack Start SSR | Motion components hydrate cleanly on the client. The reduced-motion branch + media-query branch must be SSR-safe (default to "use static" on first render to avoid hydration mismatch, then upgrade on client mount). |
| `motion@10` | Motion DevTools extension | If you need DevTools, you'd have to downgrade — **don't**. Use browser DevTools instead. |

## Sources

- **Context7: `/websites/motion_dev`** — verified `useScroll`, `useTransform`, `useMotionValueEvent`, `useSpring`, `useReducedMotion`, `MotionConfig`, `layoutId`, `LayoutGroup`, `layoutRoot`, `layoutScroll` APIs against current docs (HIGH confidence)
- **https://motion.dev/changelog** — confirmed motion 12.37/12.38 status, `ScrollTimeline` / `ViewTimeline` integration, `layoutAnchor` addition (HIGH confidence)
- **https://motion.dev/docs/react-use-scroll** — confirmed `target` accepts a single ref (not an array); offset semantics; ScrollTimeline integration (HIGH confidence)
- **https://motion.dev/docs/react-layout-animations** — confirmed `layoutId` semantics, namespacing via `LayoutGroup` (HIGH confidence)
- **https://motion.dev/docs/react-accessibility** — confirmed `useReducedMotion` and `MotionConfig reducedMotion="user"` semantics (HIGH confidence)
- **https://motion.dev/docs/react-upgrade-guide** — confirmed Motion 12 has no breaking API changes from Framer Motion; Motion DevTools incompatibility with v12 (HIGH confidence)
- **https://motion.dev/docs/performance** — confirmed `will-change: transform` hint pattern, GPU-friendly properties (HIGH confidence)
- **GitHub issue motion #1535** — sticky container layout-projection bug (MEDIUM confidence; issue is open/known)
- **GitHub issue motion #1580** — `layoutId` positioned incorrectly after page scroll (MEDIUM confidence)
- **GitHub issue motion #2006** — broken `layoutId` with Next.js page change + scroll (MEDIUM confidence; cross-confirms sticky/scroll fragility)
- **GitHub issue motion #2111** — `layoutScroll` doesn't fix shared-layout animations (MEDIUM confidence)
- **https://www.frontend.fyi/course/motion/06-scroll-animations/08-scroll-animations-with-position-sticky** — community confirmation of the "tall outer + sticky inner + `useScroll` on outer" pattern (MEDIUM confidence; multiple sources agree)
- **https://blog.maximeheckel.com/posts/framer-motion-layout-animations/** — independent walkthrough of layout animations and their constraints (MEDIUM confidence)
- **Brownfield reference: `src/components/landing/paper-hero.tsx`** — existing implementation already uses the exact pattern recommended for extension (HIGH confidence; it's our own working code)

---
*Stack research for: scroll-driven shared-element choreography on TanStack Start + React 19 + motion/react*
*Researched: 2026-04-28*
