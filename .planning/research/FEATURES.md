# Feature Research

**Domain:** Polished modern SaaS marketing landing page (K–12 education) with scroll-driven shared-element choreography
**Researched:** 2026-04-28
**Confidence:** HIGH for landing-page primitives and accessibility requirements; MEDIUM for stage-by-stage copy norms (synthesized from multiple sources rather than a canonical reference); HIGH for anti-features.

> Scope note: this research is specifically for the Teacher Workspace marketing milestone — a 4-stage scroll choreography (Hero → Wow → Feature A → Feature B) on a brownfield TanStack Start site whose centerpiece is a single product-screen element morphing through the page. We deliberately do **not** research the existing system; we research what comparable polished landing pages (Linear, Stripe, Apple, Notion, Vercel, Loom) do at this caliber.

## Feature Landscape

### Table Stakes (Users Expect These)

Missing any of these and the page either feels broken, looks unfinished, or gets penalized by SEO/social/Lighthouse. Visitors won't praise them — they'll only notice if they're absent.

#### Page structure & content

| Feature | Why Expected | Complexity | Notes / Dependencies |
|---|---|---|---|
| Hero with single primary CTA above the fold | A clear value prop + one action is the dominant convention. Headlines avg ~6 words, subheads under ~35 words across SaaS landings. | S | Already exists (`paper-hero.tsx`). Headline copy must be rewritten for the 4-stage narrative (CONTENT-01). Headline benefit-led, not feature-led. |
| Scroll choreography stages 1–4 (Hero, Wow, Feature A, Feature B) | Centerpiece of the milestone. Without it, this milestone has no reason to exist. | L | CHOREO-01..05. Pinned scroll via `motion/react` `useScroll` + `useTransform`. Single shared element morphs across stages (transform/opacity only). |
| Proof strip / social proof | Risk-averse education buyers need "borrowed certainty" before they'll click out to a live app. Apple, Stripe, Linear all surface logos/numbers/quotes early. | S | Already exists. Content must shift toward education-appropriate signals (see "Conversion-funnel" section). |
| Final CTA section with single action | Convention is "one terminal action after the narrative releases." Already in plan (CTA-01). | S | Existing `final-cta.tsx`. Should mirror the hero CTA (link to live app at `teacherworkspace-alpha.vercel.app/students`). Email capture is secondary, not primary. |
| Footer | Without it the page feels like an unfinished demo. Must include privacy/terms links if email capture is present. | S | Likely doesn't currently exist (verify against `.planning/codebase/STRUCTURE.md`). Minimum: product name, copyright, privacy, terms, support contact. |
| Sticky / scroll-aware site header | Allows visitors to convert at any scroll depth without scrolling back to the top. Existing site already has scroll-away behavior (NAV-01). | S | Existing. Must continue to behave correctly *over* the pinned-scroll choreography — the choreography pins, the header still must respect its own visibility logic. |
| OG / Twitter / meta tags | Without these, links shared in teacher Slack/email/X show as broken cards. Required: `og:title`, `og:type`, `og:image` (≥1200×630, with `og:image:alt`), `og:url`, `og:description`, `twitter:card="summary_large_image"`. | S | Verify in TanStack Start route head. Image should show the product UI, not the paper illustration alone — that's the "what is this?" answer. |
| Favicon + apple-touch-icon | Tab/bookmark presence. | S | Verify presence. |
| Performance: Lighthouse not regressing, LCP < 2.5s | LCP > 2.5s → 32% bounce probability; > 4s → >90%. Choreography must not push LCP. | M | PERF-01. Choreography uses transform/opacity only (no layout thrash). Hero video is already scroll-linked; ensure poster frame is the LCP element with `fetchpriority="high"`. |
| Mobile fallback (static stacked layout) | ~50%+ of traffic on phones; pinned scroll is fragile on mobile and the milestone explicitly defers it. | M | MOBILE-01. Each of the 4 stage end-states becomes a normal stacked section below a `lg:` breakpoint. Same copy and screenshot, no scroll choreography. |
| Reduced-motion fallback | WCAG-adjacent expectation. `motion/react` supports `useReducedMotion()` and `MotionConfig reducedMotion="user"`. | M | A11Y-01. Strategy: when reduced-motion is set, skip the morph entirely and render the stacked end-state (same as mobile). No pinning, no scroll-linked transforms. Opacity-only fades are acceptable. |
| Skip-to-content link | Keyboard users need to bypass the header. Only ~14% of top-million sites have one — but at this caliber it's expected. | S | First focusable element. Target `<main id="main">` with `tabindex="-1"`. |
| Visible focus rings | Keyboard navigation. Default browser ring is acceptable; custom ring must meet 3:1 contrast. | S | Audit existing `Button`/`Input` primitives — Radix/shadcn primitives ship reasonable defaults but verify against the paper palette. |
| Semantic landmarks (`<header>`, `<main>`, `<nav>`, `<footer>`) | Screen-reader navigation. | S | Verify in `routes/index.tsx`. |
| Alt text on all decorative & content images | If the paper illustration carries narrative meaning, it needs descriptive alt; if purely decorative, `alt=""`. The product screenshot needs descriptive alt. | S | Audit `/public/hero/` references. |
| Color contrast WCAG AA (4.5:1 body, 3:1 large text) | Required at this caliber. | S | Audit paper-ink on paper-card combinations in `--paper-*` tokens. |
| HTTPS + valid SSL | Vercel handles automatically. | S | Already true. |
| Sitemap + robots.txt | SEO baseline. | S | TanStack Start default. |
| Title + meta description | SERP appearance. Title under 60 chars, description under 160. | S | Verify in route head. |
| Canonical URL | Prevents duplicate-content issues if Vercel preview URLs get indexed. | S | `<link rel="canonical">` to production domain. |

#### Behavior expected by 2026 visitors

| Feature | Why Expected | Complexity | Notes |
|---|---|---|---|
| Smooth, jank-free scroll | At this caliber, jank reads as broken. 60fps minimum during the choreography. | M | Constraint says transforms/opacity only. Avoid `width`/`height`/`top`/`left` interpolation. Test on a mid-tier laptop, not an M-series. |
| Page works with JS errors in third-party scripts | Defensive baseline. | S | No known third parties. Confirm. |
| Page works without external font load (FOUT acceptable, not FOIT) | `font-display: swap` is the convention. | S | Tailwind v4 typography defaults. |
| Working browser back/forward and deep links | Choreography state should not need URL state. Plain page. | S | Current architecture. |
| No layout shift (CLS < 0.1) | Lighthouse and Core Web Vitals. | M | Reserve dimensions for hero video and product screenshot. |

### Differentiators (Make the Page Stand Out)

These elevate the page from "competent SaaS landing" to the Linear/Stripe/Apple tier the project explicitly targets. Not all should be built — pick the ones that reinforce the storytelling intent (paper world → product world).

#### High-leverage (recommended for this milestone)

| Feature | Value Proposition | Complexity | Notes / Dependencies |
|---|---|---|---|
| Cross-stage shared element with continuous transform (no jump-cuts) | The single most differentiating thing on the page. Linear/Apple/Stripe all do continuous transform; cuts feel cheap. | L | Already the milestone's centerpiece (CHOREO-01). Implementation discipline: one motion-value tree, derived `useTransform` per stage, no remounts. Use `position: sticky` on the pinning container so the screen never leaves the DOM. |
| Stage-locked text reveals (stagger 200–300ms between bullets) | The accepted modern timing for guiding attention without feeling sluggish. Each bullet earns its own beat. | M | `motion/react` `staggerChildren: 0.2` on the variants. Trigger via `useInView()` at each stage's text panel. Reduced-motion: render visible immediately, no transform. |
| Scroll-linked video preserved underneath in Stage 1 | Already in place; the depth (paper world has its own motion under the morphing screen) is part of the storytelling. | S | Already exists (MARK-02). Just ensure it doesn't fight the new morph layer. |
| Subtle bullet microinteractions (icon pulse, underline draw, number count-up) | At Linear/Stripe caliber, "static" feature bullets read as low-effort. One pulse/draw per stage is enough. | S–M | Apply only one microinteraction per stage to avoid noise. Reduced-motion: static. |
| Tonal contrast as deliberate design signal (paper sketch ↔ photoreal UI) | Already a stated VISUAL-01 requirement. The contrast itself is the differentiator — most SaaS pages flatten everything to one aesthetic. | M | Don't restyle the screenshot to match paper. Keep crisp browser frame, real product colors, real shadows. |
| Hover/cursor-aware microinteractions on the morphed product UI in Stages 3–4 | Suggests interactivity without committing to an in-page demo. E.g., hovering the screenshot subtly highlights the part of the UI the bullet refers to. | M | Optional but high-impact polish. Reduced-motion: skip. |
| Per-stage anchor links in nav ("Wow / Every signal / Trends & notes") | Lets visitors jump and re-share specific moments. Linear and Vercel both do this. | S | Smooth-scroll with focus management (move focus to the section heading). Honor reduced-motion (instant scroll). |

#### Optional (build only if time permits and they reinforce the story)

| Feature | Value Proposition | Complexity | Notes |
|---|---|---|---|
| Subtle scroll progress indicator (thin top bar OR side dots tied to the 4 stages) | Tells visitors "there's more, and you're 50% through the story." Especially valuable for pinned-scroll because it visually relieves the "am I stuck?" anxiety. | S | Side dots aligned to the 4 stages communicates structure; top bar is more generic. Recommend dots. |
| Theme transition tied to scroll position (paper warm tone → cooler product tone in Wow stage) | Reinforces the storytelling beat without extra UI. | M | Animate `--paper-card` background through `useTransform` on the same scroll progress. Reduced-motion: skip the transition. |
| Parallax depth in the hero illustration only | Makes the paper world feel alive in Stage 1. Apple does this on every product page. | S | Translate-Y at 0.3–0.5× scroll. Cheap. Reduced-motion: skip. |
| Auto-playing, muted, looped product UI clip embedded in the morphed screen at Stage 2 (Wow) | Replaces the static screenshot at the climax of the morph. Loom and Linear both do this. | M | Pre-loaded, ≤500KB, `playsInline muted loop`. Provide a static poster fallback. Reduced-motion: show poster only (no autoplay). |
| Dark/light auto-switch (`prefers-color-scheme`) | Polished sites at this caliber respect system theme. Optional because the paper aesthetic may not have a dark mode. | M | If paper tokens have no dark variant, skip — half-implemented dark mode is worse than none. |
| OG image generated from the actual product UI, not a generic banner | A small detail teachers will notice when peers share the link. | S | Use Vercel OG image generation or a static export. |

#### Differentiators we explicitly recommend **against** for this milestone

These are common at the Linear/Stripe tier but conflict with the audience or scope:

- **Sound design on key beats.** Loom does this; Stripe does not. Teachers visit landing pages from staffroom laptops with audio off, often during lunch or prep, and unexpected sound is a trust violation. Anti-feature.
- **Full-page WebGL or canvas animation.** GPU-expensive, fights reduced-motion, and the brownfield stack (`motion/react` only) doesn't justify it.
- **Cursor trails / custom cursors.** Reads as portfolio-site, not product-site. Not what schools expect.

### Anti-Features (Commonly Requested, Often Problematic)

Features that show up in landing-page templates but actively harm this product. Document them so the team has a defensible answer when stakeholders ask "why don't we have X?"

| Feature | Why Requested | Why Problematic for This Page | Alternative |
|---|---|---|---|
| Auto-rotating hero carousel | "We have multiple value props." | Multiple sources rank carousels among the lowest-converting elements. Auto-rotation steals attention; manual carousels hide content behind clicks. Choreography is our "carousel" already. | The 4-stage scroll choreography *is* the rotation — narrative-driven, not timer-driven. |
| Auto-playing audio anywhere | "Our product video has narration." | Browsers block it, screen readers fight it, teachers browse with audio off. Always feels like an ambush. | Muted autoplay video with captions in the morphed screen. User can tap to unmute. |
| Marketing chatbot / "talk to us" widget | "It increases engagement." | For a product whose whole pitch is "less noise in your day," a chatbot popping up undermines the message. Education buyers don't convert via chatbot. | Email link in footer + the live-app CTA. |
| Exit-intent popup ("Wait! Free trial!") | "It captures abandoning visitors." | At this caliber it reads as desperate. Teachers reading this from a staffroom will close the tab and never return. | Strong final CTA section that arrives naturally at the end of the choreography. |
| Time-delayed popup on first visit | "Boosts email signups." | Same trust violation. Also fights pinned-scroll: the popup arrives mid-choreography. | Email capture lives in-place in the final CTA section. Visible, never interrupting. |
| Cookie consent that blocks content (full-screen overlay) | GDPR compliance theater. | Blocks LCP, blocks the hero choreography, and we don't currently set non-essential cookies anyway. | If/when we add analytics: a slim, dismissable bottom bar; never a full-screen overlay. (Out-of-scope for this milestone — no analytics yet.) |
| Multi-CTA hero ("Free trial / Book demo / Watch video / Contact sales") | "Different visitors want different things." | Cognitive load, kills conversion. Best practice is 1–2 primary CTAs total per page. | Single primary CTA ("Open the workspace") in hero and final CTA. Email capture is the *secondary*, lower-emphasis action. |
| Long form (>3 fields) for email capture | "Qualify the lead." | Teachers won't fill it. Procurement happens later, in a different conversation. | Email-only field. (Already the case — UI only, submission deferred.) |
| Pricing comparison table | "Buyers want pricing transparency." | This is a free-to-explore product whose conversion is "open the live app." Pricing on the marketing page would imply gates that don't exist. | If pricing arrives later, separate page. |
| Stat-counter animations that count to fake numbers | "Looks dynamic." | At this caliber, fabricated stats (or stats counting from 0) read as marketing slime. | Real stats only, statically rendered. Or none. |
| Typewriter / glitch effects on the headline | "Modern and eye-catching." | Hostile to screen readers (each character announces) and to reduced-motion. | Static headline that's instantly readable. |
| Full-page background video that fights reduced-motion | "Cinematic feel." | Battery drain on laptops, ignores `prefers-reduced-motion` if not gated. The hero already has a scroll-linked video — that's enough motion. | Existing scroll-linked hero video, gated by reduced-motion. |
| Modal/overlay video player | "Lets us show product in full screen." | Adds focus-trap requirements and a back-button trap. | Inline muted loop in the morphed screen at Stage 2. |
| "Trusted by" with fabricated or unauthorized logos | "Looks credible." | A school or district seeing its logo without consent is a lawsuit. For an early product, real testimonials > fake logo strips. | Quote-led testimonials from real teachers, with name + role + (optional) school. Or a simple "early access" badge instead of a logo strip until real partners exist. |
| Newsletter modal | "Build the audience." | Same trust violation as exit-intent. | Inline email capture in final CTA. |
| Aggressive scroll-jacking (locking the user inside the choreography too long) | "Forces them to see the message." | A pinned section that doesn't release within ~3–4 viewport scrolls feels broken. Apple's longest pinned sections release in 2–3. | Total choreography pins for ≤4 viewport heights. Each stage gets ~1 viewport of scroll. |
| Mobile pinned scroll | "Parity with desktop." | Out of scope (PROJECT.md). Pinned scroll on iOS Safari is fragile, fights momentum scroll, and breaks with `100vh` URL bar dynamics. | Static stacked layout on mobile, same end-states. |

### Conversion-Funnel Features for K–12 Teachers

Education buyers behave differently from B2B SaaS norms. Three things matter:

1. **Teachers evaluate first, procurement decides later.** The marketing page's job is to convert *the teacher's interest*, not to capture procurement. The CTA is "let me try it," not "book a demo."
2. **Trust signals must be education-relevant, not generic SaaS.** "FERPA-aware," "Used in real classrooms," "Teacher-built" land harder than "Trusted by Fortune 500."
3. **Low-commitment first action.** "Open the workspace" (links straight to the live app, no signup) is dramatically lower-friction than "Start free trial" — and the milestone already sets this up.

| Feature | Audience Fit | Complexity | Notes |
|---|---|---|---|
| **Single primary CTA: link to live app** ("Open the workspace" or similar verb) | Matches teacher mental model: "let me poke at it." Already in plan (PROJECT.md core value). | S | Hardcode-elimination (centralize in `src/content/landing.ts`) is a known concern. Use one URL constant. |
| **Email capture as secondary, lower-emphasis action** | Teachers who don't want to click out yet — give them a way to remember the product. | S | Already exists as UI. Submission wiring deferred (Out of Scope). Make sure visual weight is *less* than the primary CTA. |
| **Education-appropriate trust line** ("Built with teachers, for teachers" / "Made by an ex-classroom teacher" / "Free for individual teachers") | Builds credibility without fabricating school logos. | S | One line in hero or proof strip. Verifiable claims only. |
| **Real teacher quote with name + role + school** (when real ones exist) | Highest-leverage social proof in education per the research. Lived-experience > stats. | S | Format: photo (optional) + quote + "Ms. X, 5th-grade teacher, [School name]". Avoid stock photos. |
| **Concrete classroom scenario in copy** ("See a student's full picture in 5 seconds before parent-teacher night") | Specific, time-and-context-bound scenarios beat abstract benefits ("save time"). | S | Affects copy in stage 2 (Wow) and stages 3–4 (Feature A/B). |
| **No pricing on this page** | Aligns with the "open the workspace, no friction" CTA. | — | Anti-feature; documented above. |
| **Visible privacy/safety positioning** (even one line) | Schools are sensitive to student data. Even a soft "Notes stay on your machine — we don't sell student data" line lowers barrier. | S | Footer or final CTA. Verify against actual product behavior before claiming anything. |
| **Compatibility / "no IT setup" reassurance** ("Works in any browser. No install.") | Removes the procurement-as-blocker fear. | S | One line in proof strip or final CTA. |

Things deliberately *not* on this list (because the audience is teachers, not enterprise IT):

- "Book a demo" CTA
- Webinar / case study / whitepaper gates
- "Schedule implementation consultation"
- "Talk to sales"

These belong on a *district-buyer* landing page, which is a different page (and out of scope here).

### Stage-Specific Content Patterns (4 Stages)

Synthesized from analysis of 87+ SaaS landing pages, the Linear/Stripe/Apple/Notion/Loom corpus, and the milestone's narrative structure (Hero → Wow → Feature A → Feature B). Confidence MEDIUM — these are working norms, not absolute laws.

#### Stage 1 — Hero (paper world, screen sits tiny inside the illustration)

| Element | Pattern | Why |
|---|---|---|
| Headline | 5–10 words. Benefit-led, not feature-led. Plainspoken. | SaaS avg ≈6 words. Linear: "The issue tracker you'll enjoy using." Notion: "Write. Plan. Share." For Teacher Workspace, something like "See every student. All in one place." |
| Subhead | 1–2 sentences, ≤35 words total. Identifies the audience and the outcome. | "Built for K–12 teachers who want their notes, attendance, and family messages in one screen — not seven tabs." |
| Primary CTA | Single button. Action verb + object. "Open the workspace" beats "Get started." | Lower friction than "Start free trial" since there's no signup. |
| Secondary action | Email capture, smaller weight, optional. | Acceptable to omit at hero — only the final CTA needs it. |
| Visual | The paper illustration; the product UI is intentionally tiny / barely visible inside it. | This is the storytelling setup — visitor doesn't yet know what the product looks like. |
| Length | ~1 viewport. | Above-the-fold convention. |

#### Stage 2 — Wow (screen scales to centered, near-full-viewport reveal)

| Element | Pattern | Why |
|---|---|---|
| Caption | 1 short sentence (≤15 words). The "ah, this is what it is" moment. | Don't compete with the visual. The screen *is* the message. |
| Visual | Product screenshot (or muted looped video) at maximum scale. Crisp, photoreal, not flattened to paper aesthetic. | VISUAL-01: tonal contrast is the storytelling. |
| CTA | None at this stage. | Don't break the climactic beat. |
| Length | ~1 viewport pinned. | Apple's pattern: the "wow" moment gets one full viewport, no more. |
| Microinteraction | Optional: subtle UI element pulse inside the screen (cursor blink, notification dot). | Suggests "this is alive." |

#### Stage 3 — Feature A (screen docks to one side; "every signal" copy enters)

| Element | Pattern | Why |
|---|---|---|
| Eyebrow / kicker | 1–3 words. ("Every signal" / "All-in-one view" / "What you actually need"). | Frames the bullet list. |
| Section headline | 5–10 words. Outcome-focused. ("See attendance, behavior, and notes in one place.") | SaaS norm. |
| Bullet list | **3 bullets max.** Each: short label (2–4 words, bold) + 1-sentence description (≤15 words). | The "needle-mover" pattern: don't list everything; highlight what teachers actually use. 3 is the magic number across Linear/Stripe/Vercel. |
| Visual | Product UI docked, with the relevant section subtly highlighted/zoomed when its bullet enters view. | Microinteraction tying copy to UI. |
| Bullet reveal timing | Stagger 200–300ms via `motion/react`. | Modern norm. Reduced-motion: render together immediately. |
| Length | ~1 viewport pinned. | Stage 3 and 4 each get one viewport, matching Apple's product-page rhythm. |

#### Stage 4 — Feature B (screen docks to other side; "trends / notes" copy enters)

Same structure as Stage 3, mirrored:

| Element | Pattern |
|---|---|
| Eyebrow / kicker | 1–3 words. ("Notes that stick" / "Trends, not just data points"). |
| Section headline | 5–10 words. ("Patterns you'd otherwise miss.") |
| Bullet list | 3 bullets, same format as Stage 3. |
| Visual | Product UI docked to opposite side of Stage 3 (the "shifting position" beat in CHOREO-05). |
| Bullet reveal | Same 200–300ms stagger. |
| Length | ~1 viewport pinned. |

#### Post-choreography release (final CTA section)

| Element | Pattern |
|---|---|
| Headline | Reinforces the value prop with the visitor now informed. "Ready to see your class in one screen?" |
| Primary CTA | Same destination as the hero CTA. Repeat the same verb ("Open the workspace"). |
| Email capture | Visible, secondary weight. UI-only for now. |
| Trust line | One short reassurance ("Free for individual teachers" / "No setup required"). |
| Length | ~half a viewport. |

### Accessibility Features Expected at This Caliber

The bar is WCAG 2.2 AA. At Linear/Stripe/Apple caliber, several practices go beyond the minimum.

| Feature | Required for? | Complexity | Notes |
|---|---|---|---|
| `prefers-reduced-motion` honored | Everyone with vestibular sensitivity. | M | A11Y-01 already in the milestone. Strategy: when set, render the static stacked end-states (same as mobile). Use `useReducedMotion()` from `motion/react` and `MotionConfig reducedMotion="user"` at the app root. |
| Skip-to-main-content link | Keyboard users. | S | First focusable element. Link to `<main id="main" tabindex="-1">`. |
| Visible focus rings on all interactive elements | Keyboard users. | S | Audit `Button`, `Input`, anchor links, CTA buttons. 3:1 contrast against background. |
| Semantic landmarks | Screen-reader users. | S | `<header>`, `<main>`, `<nav>`, `<footer>`, `<section aria-labelledby="...">` for each stage. |
| Heading hierarchy (one h1, ordered h2/h3) | Screen-reader users, SEO. | S | h1 = hero headline. Each stage section = h2. Bullet labels = h3 or just `<strong>` (don't over-nest). |
| Alt text on images, including the product screenshot | Screen-reader users. | S | Product screenshot alt: descriptive ("Teacher Workspace student view showing attendance, behavior notes, and family messages for a 5th-grade student"). Paper illustration alt: depends on whether it's narrative or decorative. |
| ARIA labels on the morphing element | Screen-reader users. | M | The shared element changes context across stages. Approach: it's a single `<figure>` with an `aria-label` describing the canonical product (e.g., "Teacher Workspace student view"). Don't try to update ARIA per stage — that creates announcement noise. The text content per stage carries the stage-specific meaning. |
| Reduced-motion alternative for scroll-linked video | Vestibular users. | S | Existing pattern in `paper-hero.tsx` already gates this — extend it. Show a static poster frame instead of the scrubbing video. |
| Color contrast WCAG AA (4.5:1 body, 3:1 large) | Low-vision users. | S | Audit `--paper-ink` over `--paper-card`. |
| Keyboard-reachable in scroll order | Keyboard users. | M | Pinned scroll must not trap focus. All bullets, CTAs, and email field reachable via Tab in document order. |
| Smooth-scroll respects reduced-motion | Vestibular users. | S | Use `scroll-behavior: smooth` only inside `@media (prefers-reduced-motion: no-preference)`. |
| ARIA live region for any dynamic content (none currently planned) | Screen-reader users. | — | N/A for this milestone — no async content. |
| Captions on any embedded product video | Deaf/HoH users. | S | If the optional Stage 2 video clip is added, ship captions or use it muted with no narration. |
| Form labels and error states on email capture | Screen-reader users. | S | Existing `Input` primitive — verify `<label>` association. |
| `lang="en"` on `<html>` | Screen-reader users. | S | Verify in TanStack Start root. |
| No hover-only interactions | Touch and keyboard users. | S | Any hover microinteraction must have a non-hover equivalent (focus, or just always-on). |
| Touch targets ≥44×44px (mobile) | Touch users with motor difficulties. | S | Audit CTA buttons on mobile breakpoints. |

## Feature Dependencies

```
[Choreography stages 1-4 (CHOREO)]
    └──requires──> [motion/react useScroll + useTransform foundation]
                       └──requires──> [Reserved layout (no CLS) for shared element]
                                          └──requires──> [Single product screenshot asset (VISUAL-02)]

[Reduced-motion fallback]
    └──requires──> [Static stacked end-states for stages 2-4]
                       └──also serves──> [Mobile fallback (MOBILE-01)]
                                          (Same component output, gated by media query OR useReducedMotion)

[Stage-specific copy (CONTENT-01)]
    └──requires──> [Locked stage structure (4 stages, end-states defined)]

[Stagger-fade bullet reveals]
    └──requires──> [Stage-specific copy locked]
    └──conflicts──> [Reduced-motion]   (must short-circuit to instant render)

[Education-appropriate trust signals]
    └──requires──> [Real testimonials OR honest "early access" framing]
    (Until real testimonials exist, do NOT fabricate logo strips — anti-feature)

[Primary CTA centralization]
    └──blocks──> [Final CTA + Hero CTA pointing to same URL]
    (Known concern: hardcoded external links scattered. Centralize in src/content/landing.ts before this milestone ships.)

[OG/meta tags using product UI image]
    └──requires──> [Canonical product screenshot decided (VISUAL-02)]

[Optional muted-loop video in Stage 2]
    └──requires──> [Static poster fallback for reduced-motion AND for mobile]
    └──enhances──> [Stage 2 (Wow)]

[Scroll progress indicator (side dots)]
    └──enhances──> [Choreography stages]
    └──reinforces──> [Pinned-scroll trust ("am I stuck?" anxiety)]
```

### Dependency notes

- **Reduced-motion fallback === Mobile fallback (mostly).** Both render the static stacked end-states. Implementing one well gives the other almost for free. Build the static end-states *first*, then layer the choreography on top of them. This also means progressive enhancement: if `motion/react` fails to load, the page still works.
- **Stage copy must lock before stage timing.** Bullet stagger timing depends on bullet count. Don't tune choreography until copy (CONTENT-01) is final, or you'll re-tune twice.
- **Primary CTA centralization is a blocker for the milestone, not a nice-to-have.** Two CTAs pointing to two different hardcoded URLs would be a regression. Resolve before SHIP-01.
- **Real testimonials block the proof strip's evolution.** Until they exist, the safe move is a soft "early access" trust line + the existing proof strip kept minimal. Fabricated logos are an anti-feature.

## MVP Definition

This is a single-milestone landing redesign, not a multi-version roadmap. "MVP" here means **the minimum to ship the milestone (`SHIP-01`) without it feeling broken or unfinished.** Anything below is the recommended cut line.

### Ship with v1 (must-have for this milestone)

- [ ] CHOREO-01..06 — 4-stage scroll choreography, motion/react, reduced-motion respected
- [ ] MOBILE-01 — static stacked layout below `lg:` breakpoint
- [ ] CONTENT-01 — copy rewritten for all 4 stages following the patterns above
- [ ] VISUAL-01 / VISUAL-02 — tonal contrast preserved, single canonical product screenshot
- [ ] NAV-01 — site header continues to behave correctly over the choreography
- [ ] CTA-01 — single primary CTA in hero and final-CTA, both pointing to the live app via a centralized URL constant
- [ ] PERF-01 — Lighthouse not regressing, LCP ≤ 2.5s, no CLS regression
- [ ] A11Y-01 — reduced-motion fallback, skip-link, focus rings, semantic landmarks, heading hierarchy, alt text, ARIA on shared figure
- [ ] Footer — exists, with privacy/terms/support links
- [ ] OG/meta tags — title, description, OG image (product UI, ≥1200×630), canonical URL
- [ ] Education-appropriate trust line in proof strip (no fabricated logos)
- [ ] Stagger-fade bullet reveals on stages 3 and 4 (with reduced-motion short-circuit)

### Add after validation (v1.x — small follow-ups)

- [ ] Side-dot scroll progress indicator — add if early users report "am I stuck?" feedback
- [ ] Subtle hover/focus highlight tying bullets to UI regions in stages 3–4
- [ ] Real teacher testimonial(s) in proof strip — add as soon as one exists
- [ ] Subtle parallax in the hero illustration — add if perceptually flat without it
- [ ] Theme tone-shift tied to scroll position (warm paper → cooler product) — only if it reinforces the beat

### Defer (v2 / next milestone)

- [ ] Email-capture submission backend (explicitly Out of Scope per PROJECT.md)
- [ ] Analytics / A/B testing instrumentation (explicitly Out of Scope)
- [ ] Mobile pinned-scroll choreography (explicitly Out of Scope)
- [ ] Auto-playing muted loop video in Stage 2 (only if a clip exists and tests well; not foundational)
- [ ] Dark/light auto-switching (paper aesthetic doesn't have a defined dark mode yet)
- [ ] Per-stage anchor links in nav (depends on stable copy)
- [ ] District-buyer landing page (different audience entirely, different page)
- [ ] Pricing page (no pricing model yet)
- [ ] CMS / dynamic copy (PROJECT.md: copy stays inline)

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---|---|---|---|
| 4-stage scroll choreography (CHOREO-01..06) | HIGH | HIGH | **P1** |
| Reduced-motion + mobile static stack | HIGH | MEDIUM | **P1** |
| Stage-specific copy rewrite (CONTENT-01) | HIGH | LOW | **P1** |
| Single primary CTA centralized URL | HIGH | LOW | **P1** |
| Performance / no Lighthouse regression | HIGH | MEDIUM | **P1** |
| Skip-link + focus rings + landmarks | HIGH | LOW | **P1** |
| OG / meta tags with product UI image | HIGH | LOW | **P1** |
| Footer | MEDIUM | LOW | **P1** |
| Education-appropriate trust line | HIGH | LOW | **P1** |
| 3-bullet stagger-fade reveals (Stages 3–4) | HIGH | MEDIUM | **P1** |
| Real teacher testimonial in proof strip | HIGH | LOW (when one exists) | **P1 if exists, P2 otherwise** |
| Subtle UI-region highlight tied to bullets | MEDIUM | MEDIUM | **P2** |
| Side-dot scroll progress indicator | MEDIUM | LOW | **P2** |
| Hero illustration parallax | LOW–MEDIUM | LOW | **P2** |
| Theme tone-shift across scroll | MEDIUM | MEDIUM | **P2** |
| Muted-loop product video at Stage 2 | MEDIUM | MEDIUM | **P3** |
| Dark/light auto-switch | LOW | MEDIUM | **P3** |
| Per-stage anchor links in nav | LOW | LOW | **P3** |
| Sound design on key beats | NEGATIVE for this audience | — | **Anti-feature** |
| Cursor effects / WebGL | LOW | HIGH | **Anti-feature** |
| Mobile pinned scroll | MEDIUM | HIGH | **Out of scope** |

**Priority key:**
- **P1** — must have for this milestone to ship
- **P2** — should have, add when possible within milestone or as v1.x follow-up
- **P3** — nice to have, future consideration
- **Anti-feature / Out of scope** — explicitly not building

## Competitor Feature Analysis

| Feature | Linear (linear.app) | Stripe (stripe.com) | Apple product pages | Notion (notion.so) | Loom (loom.com) | Vercel (vercel.com) | **Our approach** |
|---|---|---|---|---|---|---|---|
| Hero copy length | 5–8 word headline | 6–9 word headline | Short product name + tagline | 3-word command ("Write. Plan. Share.") | Outcome statement | Short, technical | 5–10 word, benefit-led, plainspoken |
| Primary CTA | "Get started" / "Sign up" | "Start now" | "Buy" / "Learn more" | "Get Notion free" | "Get Loom for free" | "Start Deploying" | **"Open the workspace"** (no signup) |
| Sticky/pinned scroll choreography | Yes (mid-page features) | Yes (Connect, Atlas) | Yes (every product page) | Mostly static | Mostly static | Some | Yes (4 stages, centerpiece) |
| Shared morphing element | Subtle | Yes on some products | Heavy use (signature pattern) | No | No | No | **Yes — single product UI screen, our defining differentiator** |
| Side-dot scroll progress | No | No | No | No | No | No | **Optional** — could be a tasteful original signature |
| Sound design | No | No | No (rare) | No | Some videos | No | **No** (anti-feature for this audience) |
| Auto-loop product video | Yes (some sections) | Yes (Atlas) | Yes (most pages) | Yes | Heavy use | Yes | **Optional in Stage 2** (P3) |
| Dark mode auto-switch | Yes | Yes | N/A | Yes | Yes | Yes | Defer (paper aesthetic) |
| Parallax / depth layers | Subtle | Yes | Heavy use | No | Subtle | Subtle | **Subtle in hero illustration only** (P2) |
| Bullet stagger-fade | Yes | Yes | Yes | Some | Yes | Yes | **Yes, 200–300ms, P1** |
| 3-bullet feature pattern | Yes | Yes | 3–4 bullets typical | Variable | Yes | Yes | **3 bullets, locked** |
| Cookie banner | Slim bottom bar | Slim bottom bar | EU-only slim | Slim | Slim | Slim | **None for now** (no analytics yet) |
| Exit-intent popup | No | No | No | No | No | No | **No** (anti-feature) |
| Chatbot widget | No | No | No | Sometimes | No | No | **No** (anti-feature) |
| Multiple CTAs in hero | 1 primary | 1 primary | 1 primary + "Learn more" | 1 primary | 1 primary | 1 primary | **1 primary + 1 secondary email capture** |
| Reduced-motion respected | Yes | Yes | Yes | Yes | Partial | Yes | **Yes — hard requirement** |
| Mobile fallback | Static | Static | Static, simplified | Native | Native | Static | **Static stacked** |
| Skip-link | Yes | Yes | Yes | Yes | Yes | Yes | **Yes — required** |

**Key takeaway:** Our caliber peers converge on a small, opinionated set of conventions: 1 primary CTA, 3-bullet feature blocks, 200–300ms stagger, pinned scroll choreographies that release within ~3 viewports, no cookie/chatbot/exit-intent friction, reduced-motion honored. The one thing we can do that they mostly don't is the **paper-world ↔ photoreal-product tonal contrast as the storytelling beat** — that's our differentiator inside an otherwise convention-respecting page.

## Sources

Primary references on conventions and quality bar:

- [SaaS Landing Page Best Practices 2025 — Magic UI](https://magicui.design/blog/saas-landing-page-best-practices)
- [I Analyzed Copy on 87 SaaS Startup Landing Pages — Process.st](https://www.process.st/startup-landing-pages/)
- [SaaS Headline Formulas That Convert — getscrapbook](https://www.getscrapbook.com/saas-headline-formulas)
- [SaaS Landing Page Best Practices — Grafit Agency](https://www.grafit.agency/blog/saas-landing-page-best-practices)
- [What we can learn from this new Stripe landing page — Charli Marie](https://pages.charlimarie.com/posts/what-we-can-learn-from-this-new-stripe-landing-page)
- [Connect: behind the front-end experience — Stripe blog](https://stripe.com/blog/connect-front-end-experience)
- [Let's Make One of Those Fancy Scrolling Animations Used on Apple Product Pages — CSS-Tricks](https://css-tricks.com/lets-make-one-of-those-fancy-scrolling-animations-used-on-apple-product-pages/)
- [Scroll-driven Animations with just CSS — WebKit](https://webkit.org/blog/17101/a-guide-to-scroll-driven-animations-with-just-css/)
- [4 Types of Website Scrolling Patterns — UXPin](https://www.uxpin.com/studio/blog/4-types-creative-website-scrolling-patterns/)

Education / K-12 audience research:

- [Top 13 EdTech Landing Page Designs in 2025 — Caffeine Marketing](https://www.caffeinemarketing.com/blog/top-13-edtech-landing-page-designs)
- [Why most edtech testimonials fail — Bee Digital](https://beedigital.marketing/why-most-edtech-testimonials-fail-and-how-expert-social-proof-fixes-it)
- [Stuff EdTech Buyers Need to See on Your Website — PRP Group](https://www.prp.group/edtech-101/edtech-101-stuff-edtech-buyers-need-to-see-on-your-website)
- [EdTech Marketing Strategy Guide 2025 — SaaSsy](https://saassy.agency/edtech-marketing-strategy/)
- [Marketing to K-12 Schools — Nexus Marketing](https://nexusmarketing.com/marketing-to-k12-schools/)

Anti-features and friction:

- [12 Landing Page Friction Points Killing B2B SaaS Conversions — SaaS Hero](https://www.saashero.net/design/landing-page-friction-points/)
- [Common Landing Page Optimization Mistakes — SaaS Hero](https://www.saashero.net/design/common-landing-page-optimization-mistakes/)
- [Popup UI Best Practices — Eleken](https://www.eleken.co/blog-posts/popup-ui)
- [Exit Intent Pop-Up Best Practices — Shopify](https://www.shopify.com/blog/exit-intent-popup)

Accessibility:

- [Create accessible animations in React — Motion (motion/react)](https://motion.dev/docs/react-accessibility)
- [useReducedMotion — Motion for React](https://motion.dev/docs/react-use-reduced-motion)
- [prefers-reduced-motion — MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@media/prefers-reduced-motion)
- [Accessibility Quick Wins in ReactJS 2025 — Skip Links, Focus Traps, ARIA Live](https://medium.com/@sureshdotariya/accessibility-quick-wins-in-reactjs-2025-skip-links-focus-traps-aria-live-regions-c926b9e44593)
- [The Skip Navigation feature — DEV Community](https://dev.to/devly-digital/the-skip-navigation-feature-makes-your-website-more-accessible-1i93)

OG / meta:

- [The Open Graph protocol — ogp.me](https://ogp.me/)
- [OpenGraph Tags Guide — Prerender](https://prerender.io/blog/benefits-of-using-open-graph/)

Microinteractions & scroll progress:

- [15 best microinteraction examples — Webflow](https://webflow.com/blog/microinteractions)
- [Pros and cons of progress indicator as a scroll bar — UX Collective](https://uxdesign.cc/pros-and-cons-of-progress-indicator-as-a-scroll-bar-345f19967cb6)
- [Scroll Animations SaaS Landing Pages — Saaspo](https://saaspo.com/style/scroll-animations)

Confidence note: Where research relied solely on WebSearch (e.g., specific 200–300ms stagger timing, "3-bullet pattern"), I treated it as MEDIUM confidence — these are widely-repeated norms but not single-canonical-source. Where research touched authoritative documentation (motion/react accessibility, Open Graph, prefers-reduced-motion), confidence is HIGH.

---
*Feature research for: Polished modern SaaS marketing landing page (K–12 education) with scroll-driven shared-element choreography*
*Researched: 2026-04-28*
