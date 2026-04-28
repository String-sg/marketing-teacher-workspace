# Pitfalls Research

**Domain:** Scroll-driven shared-element landing-page choreography on SSR React (TanStack Start, React 19, motion/react 12.x, Tailwind v4)
**Researched:** 2026-04-28
**Confidence:** HIGH (verified against motion.dev official docs, TanStack Start hydration guide, MDN; cross-checked with motion GitHub issues #2452, #2770, #1853, #1687)

Scope is intentionally narrow: pitfalls that are specific to building the 4-stage shared-element morph described in `.planning/PROJECT.md` (CHOREO-01..06), extending the existing `paper-hero.tsx` pattern. Generic web advice has been omitted.

## Critical Pitfalls

### Pitfall 1: `useScroll` returns `0` until ref hydrates — flash of stage-1 final-state on load

**What goes wrong:**
On first paint, `scrollYProgress` is `0` and any element driven by it renders at the start-of-range value. With a 4-stage choreography that means the user lands looking at stage-1 frozen. If the page loads scrolled (deep link, refresh mid-page, browser scroll restoration), the morphing screen sits in its stage-1 hidden/scaled-down state for one frame before `useScroll` measures the ref and snaps to the correct progress. Visible flicker.

**Why it happens:**
`useScroll({ target })` needs the target ref to be attached to a real DOM node before it can measure offsets. SSR renders without DOM measurement; on hydration there's a one-frame gap. There's also a documented production-only bug ([motion#2452](https://github.com/motiondivision/motion/issues/2452)) where `scrollYProgress` is wrong in production builds unless `layoutEffect: false` is set. `paper-hero.tsx` does not currently pass this option.

**How to avoid:**
- Pass `layoutEffect: false` to every `useScroll` call in the choreography, or wrap the entire choreography in a `<ClientOnly>` (TanStack Start's recommended pattern for unstable UI per their [Hydration Errors guide](https://tanstack.com/start/latest/docs/framework/react/guide/hydration-errors)).
- Render the SSR markup in the **stage-1 end-state** (what the user expects to see at scroll 0) so any flicker is invisible.
- Set `scrollRestoration="manual"` or scroll the page to top on first mount if browser scroll restoration causes mid-choreography landings during dev.
- Verify in a `vite preview`/production build, not just dev — the bug only manifests in prod.

**Warning signs:**
- "Looks fine in dev, broken in prod" — classic motion#2452 signal.
- Hard refresh halfway down the page shows a one-frame snap.
- Lighthouse CLS score worse on choreography page than on the current `paper-hero.tsx` page.

**Phase to address:** Phase 1 — scaffolding the choreography container. Set the option globally before writing any transforms.

---

### Pitfall 2: Transform on the sticky parent breaks z-index of overlays — header disappears or video clips

**What goes wrong:**
Today `paper-hero.tsx` already has `<motion.div style={{ scale: stageScale }}>` on the sticky container. When CHOREO-01 extends this to a 4-stage container, applying `transform` (scale, translate) to the sticky parent creates a new stacking context. Anything outside that parent — site header, the morphing screen overlay positioned `absolute inset-0`, modal portals — can no longer compete with elements *inside* the transformed parent on z-index. Result: the morphing screen meant to float above the paper card ends up clipped by it, or the header that's supposed to stay visible gets covered.

**Why it happens:**
Per [MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Positioned_layout/Stacking_context), `transform`, `opacity < 1`, `filter`, and `will-change` all create new stacking contexts. Sticky positioning also creates one. There is no way to escape a stacking context with `z-index` alone — a child of a transformed parent cannot be compared against a sibling of that parent.

**How to avoid:**
- Keep the sticky parent free of transforms. Apply scale/translate to a child wrapper, not the sticky element itself.
- The morphing screen should be a **sibling** of the sticky scroll container (rendered in the same parent), not a descendant of a transformed node, if it needs to overlap the header.
- If the header must always be on top, render it via a portal at the document body so it lives in its own stacking context, or keep its z-index inside a non-transformed ancestor.
- Audit `paper-hero.tsx`: the `motion.div` at line 86 has `scale: stageScale` and is also the sticky container's main child. The current overlay (line 174–199) is a sibling — keep that pattern.

**Warning signs:**
- Devtools shows the right `z-index` value but the element is still hidden.
- Removing a `transform` or `opacity` declaration "magically" fixes the layering.
- Issue only appears once an animation runs (transform applied), not at rest.

**Phase to address:** Phase 2 — layout pass when introducing the multi-stage container.

---

### Pitfall 3: SSR/client mismatch from `useReducedMotion` rendering different markup on server vs. client

**What goes wrong:**
`paper-hero.tsx` already uses `useReducedMotion` to swap between two completely different DOM trees (the `reduced ? <img> : <video>` swap, and the post-section static card at lines 202–220). On SSR `useReducedMotion` returns `null`, then on hydration it resolves to `true`/`false`. If the server picks one branch and the client picks the other, you get a hydration mismatch error and React 19 may [discard the entire subtree and re-render client-side](https://tanstack.com/start/latest/docs/framework/react/guide/hydration-errors), undoing your SSR LCP win.

**Why it happens:**
`prefers-reduced-motion` is not knowable on the server — it's a browser media query. `useReducedMotion` returns `null` server-side; the current code checks `prefersReducedMotion === true`, which means SSR always picks the **animated** branch, then the client may swap to **reduced** on hydration. With four stages of choreography this swap is a much bigger DOM diff than today's hero.

**How to avoid:**
- Always render the **non-reduced (animated) markup as SSR baseline**, then opt out of motion on the client only. Don't render two different trees.
- Use a `useIsMounted` pattern: render animations only after `useEffect` has run (post-hydration), so the server and client first paint match.
- For the static stacked end-states, render them as SSR-friendly markup that exists in both branches; only the *transforms* (motion values) differ between reduced and full-motion.
- Wrap the choreography in `<ClientOnly>` if the markup truly diverges, accepting the trade-off that the choreography is not in the SSR HTML.

**Warning signs:**
- "Hydration failed because the initial UI does not match" warning in console.
- Reduced-motion users see the page flash from animated to static layout on load.
- Lighthouse LCP regresses because the LCP node is hydrated, not SSR'd.

**Phase to address:** Phase 1 — set the SSR/CSR contract before writing any stage-specific code.

---

### Pitfall 4: Reduced-motion fallback hides the screen entirely — content unreachable

**What goes wrong:**
Easy mistake: when `prefersReducedMotion === true`, skip the morphing screen entirely. But the screen IS the product reveal — if it's hidden, reduced-motion users see only the hero illustration and four blocks of text with no product UI. That violates **A11Y-01** ("no missing content").

**Why it happens:**
Developers conflate "no animation" with "no content." In motion/react it's tempting to gate the whole `<motion.div>` block on `!reduced` because the animated branch already contains the product image.

**How to avoid:**
- Reduced-motion users get **the static stacked layout** that mobile users get (per **MOBILE-01**). The product screen, feature copy, and bullets all render as normal sections in document order — same as scrolling past the choreography on desktop.
- Build the static stacked layout first; the choreography is the *enhancement* that overlays it. This guarantees content parity by construction.
- Test by running the page with `prefers-reduced-motion: reduce` in DevTools — every word and image of copy that exists in the full version must be visible without scroll-driven animation.

**Warning signs:**
- Reduced-motion view has visibly less content than full-motion.
- Test checklist includes "scroll the page" for reduced-motion users — that's a smell, they shouldn't need scroll-driven anything.
- The four feature copies only exist inside `motion.div` blocks gated on `!reduced`.

**Phase to address:** Phase 1 — static stacked layout is the foundation, not an afterthought. Build it first, layer the choreography on top.

---

### Pitfall 5: 280vh sticky container causes 100vh/dvh jank on iOS Safari address-bar resize

**What goes wrong:**
`paper-hero.tsx` currently uses `h-[280vh]` for the section and `h-svh` for the sticky child. A 4-stage choreography will need ~400-500vh of scroll length. On iOS Safari the address bar collapses on scroll, changing the viewport height, which triggers a layout recalc that resizes the sticky container mid-scroll. Result: the stage's progress jumps because the total scrollable length just changed; the user sees a "snap" mid-transition.

**Why it happens:**
`vh` includes the address bar at one moment and excludes it the next. Safari [intentionally doesn't fire resize 60fps during scroll](https://medium.com/rbi-tech/safaris-100vh-problem-3412e6f13716) to avoid jank, so the change happens in a single jolt. Pinned/sticky multi-stage choreographies are uniquely vulnerable because the stage progress is computed against the container's total scroll length.

**How to avoid:**
- Per **MOBILE-01**, the choreography is desktop-only — gate the entire pinned-scroll mode behind a min-width media query or container query and ship the static stacked layout below that breakpoint.
- For the desktop case, prefer `lvh` (large viewport height — fixed at the largest viewport size, no resize jank) or `dvh` (dynamic, accepting the resize but well-defined). Avoid `vh` and `svh` for the *outer* scroll-length container; `svh` is fine for the *sticky* inner viewport since it stays consistent.
- Pick the breakpoint conservatively: a "tablet" in landscape with iOS Safari is still mobile-ish for choreography purposes. `min-width: 1024px` is a defensible cutoff.
- Set `overscroll-behavior: contain` on the sticky parent to prevent rubber-band scrolling from triggering off-by-one stage transitions.

**Warning signs:**
- iOS Safari shows a sudden "lurch" at the moment the address bar collapses.
- Stage-2-to-stage-3 transition completes early on mobile but not desktop.
- `useScroll` debugging shows `scrollYProgress` jumping by 0.05+ in a single frame on mobile.

**Phase to address:** Phase 2 — layout pass. Establish the desktop-only gate and the unit choices before tuning stage offsets.

---

### Pitfall 6: Brittle `useTransform` stage thresholds — every copy edit breaks the choreography

**What goes wrong:**
`paper-hero.tsx` already shows the seeds: hardcoded keyframes like `[0, 0.55, 0.85, 1]` and `[0, 0.6, 1]` (lines 26–38). Extending to 4 stages means ~12 such keyframes, all interdependent. The moment a designer adds a sentence to stage 3's bullet list, the section gets taller, the stage-3 zone now ends at `0.78` instead of `0.75`, and stages 2 and 4 visually overlap because their thresholds didn't move with it. This is flagged as fragile in `.planning/codebase/CONCERNS.md` ("Motion/Scroll Binding in PaperHero — exact scroll progress percentages").

**Why it happens:**
`useTransform` keyframes are coupled to the proportions of a container whose height isn't fixed. As content grows, the proportions drift but the keyframes don't.

**How to avoid:**
- Define stages as **named constants** with explicit start/end progress values, derived from a single source of truth: `const STAGES = { hero: [0, 0.2], wow: [0.2, 0.45], featureA: [0.45, 0.7], featureB: [0.7, 1] }`. Every transform reads from `STAGES`, no inline magic numbers.
- Make each stage a **fixed-height block** inside the section (`h-[100vh]` per stage, total `h-[400vh]`), so a stage's pixel range is constant regardless of inner content. Inner content overflows or scrolls within the sticky viewport, not by stretching the section.
- For overlapping fades (e.g. screen scaling up while paper card fades out), express the overlap explicitly: `const HANDOFF = 0.05; const wowStart = STAGES.hero[1] - HANDOFF`.
- Add a dev-only debug overlay that prints the current progress and active stage; hide behind a `?debug` query param.

**Warning signs:**
- Tweaking copy in `landing.ts` visibly breaks animation timing.
- The number of magic numbers in `useTransform` calls exceeds the number of stages.
- Two animations finish at the same scroll position by coincidence, not by shared constant.

**Phase to address:** Phase 2 — when scaffolding the multi-stage container, establish the constants/structure. Going back later is a rewrite.

---

### Pitfall 7: Video underneath a scaled overlay double-paints — GPU pressure spikes during stage 2

**What goes wrong:**
Per **CHOREO-02**, the existing scroll-linked video stays underneath the morphing screen during stage 1, and the screen scales up over it during stage 2. If the video keeps decoding/painting while the screen overlay covers ~100% of the viewport, the GPU is doing redundant work (decoding video frames the user can't see), and on lower-end devices this manifests as scroll jank exactly at the most cinematic moment of the choreography.

**Why it happens:**
A video element keeps decoding even when fully obscured by an opaque sibling. Worse, `paper-hero.tsx` updates `video.currentTime` every scroll frame via `useMotionValueEvent` (line 51) — that's a forced decode/seek per frame, expensive even when invisible. Add a large `box-shadow` on the morphing screen (currently `shadow-[0_30px_120px_-40px_...]`) and you have shadow repaints overlapping video repaints.

**How to avoid:**
- Pause the video and stop seeking once stage 2 begins covering it: in the `useMotionValueEvent` callback, only update `video.currentTime` while progress is in the hero range.
- Alternatively, fade the video to `display: none` (not just `opacity: 0`) once the screen overlay is fully opaque, so the browser can stop decoding.
- Prefer `filter: drop-shadow()` over `box-shadow` for the scaling screen if any shadow is needed — it composites better, though it can still trigger paints. Better: use a static pre-composited shadow image, or skip the shadow during the active scale transition.
- Add `will-change: transform` to the morphing screen but *only* during the active stage; remove it once the stage is past. Sticky `will-change` on every stage's element is the most common Lighthouse memory complaint.
- Profile with Chrome DevTools Performance tab + Rendering > Paint flashing on. Anything green during scroll is a paint you can probably eliminate.

**Warning signs:**
- Frame rate drops to 30fps in stage 2 while staying 60fps in stages 1, 3, 4.
- Lighthouse "Avoid large composite layers" warning.
- Battery indicator drops noticeably faster on the choreography page.

**Phase to address:** Phase 4 — performance polish. Don't pre-optimize, but profile after stage 2 lands.

---

### Pitfall 8: Scrubbing back-and-forth surfaces intermediate states that don't read as content

**What goes wrong:**
A user mid-scroll sees stage 2 at 60% progress: the screen is half-scaled, the paper card is half-faded, the feature copy is half-visible. None of these are "real" states the design was created for — they're tweens. If the user pauses there (mousewheel up-down, trackpad inertia, screenshot for sharing), the page looks broken. Worse, scrubbing **back** through the choreography on a touchpad reveals these midstates more often than scrubbing forward.

**Why it happens:**
Scroll-driven animation is bidirectional and pause-able by definition. Designers tend to design the keyframes (start and end of each stage) but not the in-between, especially when copy and imagery are crossfading simultaneously.

**How to avoid:**
- Design and review **at 25%, 50%, 75%** of each stage transition, not just the endpoints. If a midstate reads as "broken layout," fix it (shorter overlap, bigger pause between stages, sequential rather than simultaneous fades).
- Sequence rather than overlap: complete stage 2's fade-out before starting stage 3's fade-in (with a brief stable hold in between). Costs scroll length but reads cleaner.
- Lock content in the static stacked fallback — every "stage end-state" must be a coherent, screenshot-able layout that exists in the mobile/reduced layout.
- For text crossfades, prefer "old text fades out, new text fades in" with a beat of empty space between rather than a true crossfade — overlapping text reads as broken even at 50%.

**Warning signs:**
- Manual QA: scrolling slowly with arrow keys reveals "ugly" midstates.
- Designer says "but the start and end look great."
- A user-recorded video at 0.5x speed shows frames that look like layout bugs.

**Phase to address:** Phase 3 — when wiring stages 3 and 4. Stage 1→2 has fewer overlapping elements; the messy ones are 2→3 and 3→4.

---

### Pitfall 9: Keyboard-only and screen-reader users skip the choreography entirely — content unreachable via tab order

**What goes wrong:**
A keyboard user pressing Tab moves focus through interactive elements in DOM order. If the morphing screen and feature copy live inside `motion.div` blocks that are visually above the fold but DOM-positioned at the end of the long sticky section, focus order desyncs from visual order. Worse, if any feature copy or CTA is gated behind animation (rendered only when stage progress > X), keyboard users can never reach it because Tab doesn't trigger scroll.

**Why it happens:**
Sticky scroll choreographies decouple visual order from DOM order. The temptation is to reorder DOM for the visual effect, breaking accessibility. Or to render content conditionally based on scroll progress, making it invisible to assistive tech.

**How to avoid:**
- **DOM order = reading order.** Stage content lives in document order (hero → feature A → feature B → final CTA). Visual position is achieved with absolute/fixed positioning and transforms, not DOM reordering.
- All content is in the DOM at all times. Animation controls *visual visibility* (opacity, transform), never *existence* (no `{progress > 0.5 && <Content />}`).
- Tab through the page from the address bar with no mouse — every CTA, link, and form must be reachable in a sensible order. The browser will scroll to focused elements; if `scroll-margin-top` is set on stage anchors, focus snaps to a readable position.
- The site header (per **NAV-01**) must remain keyboard-reachable throughout the choreography. Don't put it inside the transformed sticky parent.
- Run axe-core or Lighthouse a11y audit; expect 0 violations for "scrollable region must be focusable" and "color contrast" at every stage's static end-state.

**Warning signs:**
- Tabbing skips half the page.
- A screen reader announces "stage 2 of 4" but the content underneath is empty.
- Conditional rendering based on `scrollYProgress` shows up in code review.

**Phase to address:** Phase 3 — when feature copy is integrated. Phase 4 final a11y audit catches missed cases.

---

### Pitfall 10: Full-resolution `profiles-screen.png` blocks LCP and tanks Lighthouse

**What goes wrong:**
The morphing screen is a static PNG (`/hero/profiles-screen.png`). At stage 2 it scales to ~100% viewport width, so it needs to look sharp at ~1920px wide on a Retina display — which means a 3840px source image, easily 1-2 MB. If that image is the LCP candidate (or the video poster is), and it isn't preloaded with the right `fetchpriority`, LCP regresses vs. the current production landing. **PERF-01** ("Lighthouse must not regress") is then violated.

**Why it happens:**
The current landing's LCP is probably the hero illustration (~smaller). Adding a much larger product screenshot as a visible element changes the LCP candidate without anyone noticing until the Lighthouse run.

**How to avoid:**
- Serve a responsive `srcset` for the screen image. At stage 1 it's tiny (only need ~600px source); only load the full-resolution version when the user is approaching stage 2.
- Consider rendering stage 1's tiny screen as a low-res inline image and the stage-2 reveal as a separately-loaded high-res image, swapped at the right scroll position. The crossfade hides the load.
- Ship a WebP or AVIF version with PNG fallback. Modern variants are ~30-50% smaller for the same visual quality.
- Use `<link rel="preload" as="image" fetchpriority="high">` for whatever image is the LCP candidate. Verify with Chrome DevTools "Performance Insights" panel.
- Lazy-load the video (`preload="metadata"` instead of `preload="auto"`) once stage 1's poster is loaded — don't compete with the LCP image.

**Warning signs:**
- Lighthouse LCP > 2.5s on the choreography page.
- Network tab shows `profiles-screen.png` as a 1MB+ download in the critical path.
- The image arrives after first paint and causes a visible "pop-in" at stage 2.

**Phase to address:** Phase 4 — performance polish, with Lighthouse run as the gate before merging.

---

### Pitfall 11: TanStack Start `head()` revalidation or HMR breaks scroll position mid-development

**What goes wrong:**
TanStack Start route revalidation (e.g. on file save, on route param change) can re-mount the route component, which resets `useScroll`'s internal state and may scroll the page to top. There are also [reported HMR hydration issues](https://github.com/TanStack/router/issues/6556). During development this is annoying; if a `head()` change triggers re-render in production it can cause a real visible jump.

**Why it happens:**
`useScroll` reads from `window.scrollY` once on mount and subscribes to scroll events. A re-mount re-reads, but the browser's native scroll position persists, so the reset is the React tree's perception, not the actual scroll. Any state derived from scroll progress (the stage indicator, motion values that have been `set()` imperatively) loses its history.

**How to avoid:**
- Keep all `head()` content static. If route metadata depends on choreography state, that's a smell — separate the two.
- Don't re-key the choreography component during HMR. Avoid React keys derived from `useRouter().state` or similar.
- Verify behavior on a deployed Vercel preview, not just localhost — HMR-only quirks shouldn't block ship.
- If the choreography uses any global state (Zustand, Jotai, etc.), ensure scroll-derived values are recomputed from the live `scrollYProgress` on remount, not stored externally.

**Warning signs:**
- Saving a file mid-development causes the page to jump to a stage-3 visual at scroll 0.
- Vercel preview behaves differently from localhost in ways unrelated to env vars.
- Adding/removing a route metadata field shifts the choreography.

**Phase to address:** Phase 4 — pre-ship verification on Vercel preview.

---

### Pitfall 12: `useMotionValueEvent` setting React state on every frame triggers re-render storm

**What goes wrong:**
`paper-hero.tsx` lines 40–47 use `useState` for `stageOpacity`, `screenOpacity`, `copyOpacity` and update them inside `useMotionValueEvent`. Every scroll frame triggers up to three React state updates, which means a re-render of the entire `PaperHero` tree (~223 lines, plus children) per frame. With four stages and more interpolated values, this scales linearly. The whole point of motion values is to update the DOM *without* re-rendering — the current code defeats that.

**Why it happens:**
It's natural to reach for `useState` when you want a value, then realize too late that motion values do the same job without re-renders. Or the code grew organically from a one-off opacity calc to a pattern that's now copied for every value.

**How to avoid:**
- Replace the `useState` + `useMotionValueEvent` pattern with `useTransform` on `scrollYProgress` directly. Pass the resulting motion value into `style={{ opacity: motionValue }}` — motion will update the DOM without React re-render.
- Reserve `useMotionValueEvent` for genuinely imperative side-effects (like `video.currentTime = x` — that one is correct).
- Audit: every `useState` whose setter is called from `useMotionValueEvent` is a re-render bug. Convert to `useTransform`.
- Profile with React DevTools Profiler. During a 1-second scroll, the choreography component should re-render 0–2 times, not 60+.

**Warning signs:**
- React DevTools Profiler shows the choreography component at the top of the "ranked" view during scroll.
- Adding more stages makes everything slower, not just visually busier.
- Disabling `prefers-reduced-motion` (full animation) is laggy on mid-tier hardware where the static fallback is fine.

**Phase to address:** Phase 2 — refactor `paper-hero.tsx`'s state-update pattern when extending it. Easier now than after stages 3 and 4 are also using it.

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Hardcoded `useTransform` keyframes (`[0, 0.55, 0.85, 1]`) | Quick to write while iterating | Every copy/layout change requires re-tuning all keyframes; brittle integration with content (already flagged in CONCERNS.md) | Phase 1 prototype only; must be refactored to named stage constants in Phase 2 |
| `useState` + `useMotionValueEvent` for derived animation values | Familiar React pattern | Forces a re-render per scroll frame; defeats motion's main perf benefit | Never for purely visual values; OK for genuinely imperative side-effects (video seek) |
| `box-shadow` animated alongside `transform: scale` | Easy visual depth | Triggers paint per frame; one of the top causes of scroll jank | OK at rest; avoid combining shadow with active scale |
| `h-[280vh]` / `h-[400vh]` literal heights instead of stage constants | Reads quickly | Total scroll length and stage thresholds drift apart silently | Never in this codebase — use `STAGES` constants |
| Single big component file (already at 223 lines for one stage) | Faster to scaffold | Per CONCERNS.md, hard to test, refactor, or share with future feature pages | OK during Phase 1; extract `<StageScreen>`, `<StageContainer>`, `useChoreography` hook in Phase 2 |
| Skipping reduced-motion fallback "for now" | Saves a day of work | A11Y-01 violation; reduced-motion users see a broken page; audit-blocking | Never — build the static stacked layout *first*, layer animation on top |

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| `motion/react` `useScroll` + TanStack Start SSR | Default config; production build shows wrong `scrollYProgress` ([motion#2452](https://github.com/motiondivision/motion/issues/2452)) | Pass `layoutEffect: false` to `useScroll`; verify in `vite preview` not just dev |
| `useReducedMotion` + SSR | Render two different DOM trees based on its return value | Render the animated tree as SSR baseline; opt out of motion on client only — keep DOM identical |
| Sticky parent + child motion `transform` | Apply `style={{ scale }}` to the sticky element itself | Apply transform to a non-sticky child; sticky parent stays clean to keep stacking-context predictable |
| `<video>` underneath an opaque overlay | Keep playing/seeking while obscured | Stop `video.currentTime` writes when overlay is opaque; consider `display: none` once fully covered |
| TanStack Start `<ClientOnly>` | Wrap the entire landing in it to avoid all hydration issues | Only wrap genuinely client-only branches; keep SSR markup for LCP-critical content |
| Tailwind v4 `@theme` tokens + motion `style` prop | Mix `className="bg-foo"` and `style={{ scale }}` thinking they don't conflict — they do at runtime | Choose one for any given property; for animated styles always use motion's `style`/`animate` |

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Setting `useState` from `useMotionValueEvent` | Component re-renders every scroll frame | Use `useTransform` and pass motion value to `style` directly | Becomes visible at ~3 simultaneous animated values; current `paper-hero.tsx` already at 3 |
| Animating `box-shadow` during scale | Frame drops in stage 2 (scale-up moment) | Use static shadow at rest; remove during active scale; or use pre-composited shadow image | Mid-tier laptops, any phone |
| Video kept decoding while obscured | Battery drain, GPU at 100% during stage 2-3 | Pause/skip seeks once overlay opacity is full | Always; worse on low-end devices |
| Multiple `useScroll` subscribers all reading the same scroll progress | Each one re-measures on resize; redundant work | One `useScroll` at the choreography root, share `scrollYProgress` via context or props | At ~5+ subscribers; current paper-hero has 1, watch the count grow |
| `will-change: transform` on every stage element permanently | Memory bloat warning in Lighthouse | Apply only during active stage; remove after | When > 3 elements have it permanently |
| Loading full-res `profiles-screen.png` (`~3840px` wide) for stage 1's tiny screen | Wasted bytes; LCP regression | Responsive `srcset` or two separate images swapped at stage boundary | Always — current single image is the LCP risk |
| `vh` units for outer scroll-length container on iOS Safari | Mid-scroll jolt when address bar collapses | Use `lvh` for outer length, `svh` for inner sticky viewport — or gate choreography to `min-width: 1024px` (per **MOBILE-01**) | iOS Safari, mobile portrait |

## Security Mistakes

The choreography itself has minimal security surface (it's a marketing site, no user input), but the brownfield context introduces a few:

| Mistake | Risk | Prevention |
|---------|------|------------|
| Inline `dangerouslySetInnerHTML` for stage content | XSS if copy ever flows from a CMS later | Keep copy in `src/content/landing.ts` as plain strings; never set HTML strings into the choreography |
| External CTA link (`teacherworkspace-alpha.vercel.app`) without `rel="noreferrer"` consistently | Tabnabbing risk, already flagged in CONCERNS.md | Apply `rel="noreferrer"` to every external link added in the choreography (final CTA, hero CTA) |
| Asset paths assumed to exist (`/hero/profiles-screen.png`) | Silent broken page on missing asset, fragile per CONCERNS.md | Add a build-time check or use Vite's `import.meta.url` so missing assets fail at build, not at runtime |

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Choreography too long (each stage takes a full screen of scroll) | User skims past, never absorbs the message; scroll fatigue | 200-400vh total per stage is a sane band. Time the full choreography end-to-end at normal scroll speed; should be 4-8 seconds, not 15+ |
| Choreography too fast | Stages flash by; user doesn't read feature copy | Each stage's copy should be readable for ≥1 second at normal scroll speed. Pad with stable hold zones between transitions |
| No "exit" — choreography eats the whole page | User scrolls to leave the section but is still in it | Define a clear `end end` boundary — past that point, regular page scroll resumes (the proof strip and final CTA are post-choreography) |
| Reduced-motion users see a snap from animated to static layout | Jarring, feels like a bug | Reduced-motion path is a fully different rendering path with no animation snapshot — never a "frozen mid-animation" state |
| Scrubbing back-and-forth reveals broken-looking midstates | User thinks the page is broken | Design the 25%/50%/75% midstates intentionally; sequence rather than overlap simultaneous text fades |
| User scrolls fast (trackpad flick) and skips past stage 3 entirely | Feature copy never read | Either don't put critical copy *only* in the choreography (it's also in the static fallback below), or add a small "scroll cue" that telegraphs the upcoming stage |
| Final CTA buried at the bottom after a 5x viewport-height section | High friction to convert | Keep the final-CTA height short, and ensure header CTA stays visible/keyboard-accessible throughout |

## "Looks Done But Isn't" Checklist

- [ ] **Reduced-motion path:** Often missing the *content* of later stages — verify all copy, all bullets, all CTAs from CHOREO-04 and CHOREO-05 appear in the static stacked layout.
- [ ] **SSR markup:** Often differs from client first-paint — verify `view-source:` of the deployed page contains the stage content and matches the post-hydration DOM (no React warning in console).
- [ ] **Keyboard tab order:** Often skips choreography content — Tab from the address bar through the entire page, every interactive element must be reachable in a sensible order.
- [ ] **Mobile/static fallback:** Often forgotten that the morphing screen image needs an `<img alt>` in the static layout too — verify every product image has alt text in *both* the choreography and the fallback.
- [ ] **Production build:** Often works in dev only — `vite preview` and a Vercel preview deploy must show identical scroll progress to dev (the `layoutEffect: false` fix only matters in prod).
- [ ] **Scroll restoration:** Often breaks deep-linking — refresh the page mid-choreography; the scroll position should be preserved and the visual should match.
- [ ] **Browser back/forward:** Often resets choreography to stage 1 — navigate away, navigate back; the scroll position and stage should restore.
- [ ] **`prefers-reduced-motion` toggle live:** Often only honored on first load — toggle the OS setting while on the page; the choreography should respond on next interaction (or at minimum, on next page load — document which).
- [ ] **High-zoom (200%):** Often breaks sticky layout — Chrome at 200% zoom should still render the choreography or fall back to static layout cleanly.
- [ ] **Lighthouse perf score:** Often regresses silently — run Lighthouse on the deployed preview; PERF-01 requires no regression vs. current prod, both LCP and CLS.

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Hydration mismatch from `useReducedMotion` | LOW | Wrap choreography in `<ClientOnly>`; accept SSR baseline shows static markup |
| Sticky parent transform broke z-index | LOW | Move transform from sticky parent to non-sticky child; refactor 1-2 components |
| Brittle keyframes broke after copy edit | MEDIUM | Refactor to named `STAGES` constants; touches every `useTransform` call; ~half-day |
| `useState`+`useMotionValueEvent` re-render storm | MEDIUM | Convert each value to `useTransform`; mechanical refactor across the component |
| iOS Safari address-bar jank | LOW | Gate choreography behind `min-width: 1024px` per MOBILE-01; ship static layout below |
| LCP regression from large product screenshot | MEDIUM | Add responsive `srcset`, WebP/AVIF variant, preload tag; coordinate with design for asset variants |
| Reduced-motion content unreachable | HIGH | Re-architecture: build static stacked layout first as the foundation, layer animation on top — if discovered late, it's a rebuild |
| Keyboard tab order broken | MEDIUM | Reorder DOM to match reading order; use `position: absolute` for visual placement instead of DOM reordering |
| `useScroll` `0` flicker on hydration | LOW | Add `layoutEffect: false` option globally; verify in production build |

## Pitfall-to-Phase Mapping

This assumes a roadmap with phases like: 1) Scaffolding & SSR/static foundation, 2) Multi-stage container & layout, 3) Stage content integration, 4) Performance & a11y polish.

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| 1. `useScroll` ref-not-hydrated flicker | Phase 1 | `vite preview` build shows no flicker on hard refresh mid-page |
| 2. Sticky transform breaks z-index | Phase 2 | Header always visible above morphing screen during full choreography sweep |
| 3. SSR mismatch from `useReducedMotion` | Phase 1 | No React hydration warning in console; `view-source:` matches first paint |
| 4. Reduced-motion content unreachable | Phase 1 | DevTools `prefers-reduced-motion: reduce` shows all CHOREO-04/05 content statically |
| 5. iOS Safari `vh` jank | Phase 2 | iOS Safari real-device test: no lurch when address bar collapses; or static layout under 1024px |
| 6. Brittle stage keyframes | Phase 2 | Code review: no inline magic numbers in `useTransform`; all from `STAGES` constants |
| 7. Video underneath drains GPU | Phase 4 | Chrome DevTools Performance: video element shows no decode work during stage 2 |
| 8. Scrubbing reveals broken midstates | Phase 3 | Design QA at 25%/50%/75% of each stage transition; midstates documented |
| 9. Keyboard a11y unreachable content | Phase 3 + Phase 4 audit | Tab from address bar; axe-core 0 violations; manual screen-reader pass |
| 10. LCP regression from product screenshot | Phase 4 | Lighthouse on Vercel preview matches/beats current prod (PERF-01) |
| 11. TanStack Start re-mount/HMR scroll reset | Phase 4 | Vercel preview QA; not a localhost-only finding |
| 12. `useState` re-render storm | Phase 2 | React Profiler shows ≤2 component re-renders per second of scroll |

## Sources

- [useScroll — React scroll-linked animations (Motion docs)](https://motion.dev/docs/react-use-scroll) — HIGH confidence; primary doc on `target`, `offset`, `layoutEffect`, content-size tracking.
- [Error: useScroll ref is not hydrated (Motion docs)](https://motion.dev/troubleshooting/use-scroll-ref) — HIGH confidence; covers the ref-not-hydrated flicker.
- [useTransform — Composable React animation values (Motion docs)](https://motion.dev/docs/react-use-transform) — HIGH confidence.
- [useReducedMotion — Accessible React animations (Motion docs)](https://motion.dev/docs/react-use-reduced-motion) — HIGH confidence.
- [Motion Values — composable React values (Motion docs)](https://motion.dev/docs/react-motion-value) — HIGH confidence; basis for the re-render storm pitfall.
- [Animation performance guide (Motion docs)](https://motion.dev/docs/performance) — HIGH confidence.
- [Hydration Errors — TanStack Start React Docs](https://tanstack.com/start/latest/docs/framework/react/guide/hydration-errors) — HIGH confidence; `<ClientOnly>` and `ssr: false` patterns.
- [motion#2452 — useScroll doesn't work correctly in production build](https://github.com/motiondivision/motion/issues/2452) — HIGH confidence; documents the `layoutEffect: false` workaround.
- [motion#2770 — useScroll jittery when using translateY on mobile](https://github.com/motiondivision/motion/issues/2770) — MEDIUM confidence; mobile-specific.
- [motion#1853 — useScroll() with container option behave strangely](https://github.com/motiondivision/motion/issues/1853) — MEDIUM confidence; sticky/container interactions.
- [motion#1687 — useScroll with undefined ref at first render](https://github.com/motiondivision/motion/discussions/1687) — MEDIUM confidence; first-render ref timing.
- [Stacking context — MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Positioned_layout/Stacking_context) — HIGH confidence; canonical reference for transform/sticky stacking.
- [The Hidden Battle Between sticky position and z-index](https://medium.com/@ayham.attar98/the-hidden-battle-between-sticky-position-and-z-index-78097175c3b2) — MEDIUM confidence (community).
- [Accessible Animations in React with prefers-reduced-motion (Josh Comeau)](https://www.joshwcomeau.com/react/prefers-reduced-motion/) — HIGH confidence; SSR pattern reference.
- [Safari's 100vh Problem](https://medium.com/rbi-tech/safaris-100vh-problem-3412e6f13716) — MEDIUM confidence (community); aligned with widely-known iOS Safari quirk.
- [Lazy loading video — web.dev](https://web.dev/articles/lazy-loading-video) — HIGH confidence.
- [Lighthouse: Don't lazy load LCP image — GTmetrix](https://gtmetrix.com/dont-lazy-load-lcp-image.html) — HIGH confidence.
- [Why Most Scroll Animations Miss What Apple Gets Right (Brad Holmes)](https://www.brad-holmes.co.uk/web-performance-ux/why-most-scroll-animations-miss-what-apple-gets-right/) — MEDIUM confidence (commentary); useful framing for the UX pitfalls section.
- [Scrollable regions must be keyboard focusable — GetWCAG](https://getwcag.com/en/accessibility-guide/scrollable-region-focusable) — HIGH confidence.
- [Why Sticky Navigation Can Undermine Accessibility — Buttondown](https://buttondown.com/access-ability/archive/why-sticky-navigation-can-undermine-accessibility/) — MEDIUM confidence.
- [Playwright Visual Regression Testing](https://bug0.com/knowledge-base/playwright-visual-regression-testing) — MEDIUM confidence; `animations: 'disabled'` pattern for testing the static end-states.
- `.planning/codebase/CONCERNS.md` (in-repo) — HIGH confidence; brittle scroll thresholds and large `PaperHero` already flagged.
- `src/components/landing/paper-hero.tsx` (in-repo) — HIGH confidence; reference implementation revealing patterns to extend.

---
*Pitfalls research for: scroll-driven shared-element landing-page choreography on TanStack Start (Teacher Workspace marketing site)*
*Researched: 2026-04-28*
