# Teacher Workspace — Marketing Landing

## What This Is

Marketing landing page for Teacher Workspace, a school product that gives teachers one screen to see every student's full picture (attendance, behavior, notes, messages home). The site exists to convert visitors to the live app at `teacherworkspace-alpha.vercel.app/students` — its job is to make a teacher feel "this is the tool I've been missing" within one scroll.

## Core Value

A single scroll-driven choreography that introduces the product UI as a shared element morphing through the page — emerging from the hand-drawn paper world, scaling to a full reveal, then docking to the side as features explain themselves. If everything else regresses, *this transition must feel intentional and on-brand*.

## Requirements

### Validated

<!-- Inferred from existing brownfield code under /src and the prior paper-hero redesign (commit 008ed67). -->

- ✓ **MARK-01**: TanStack Start landing page renders at `/` with paper visual system — existing
- ✓ **MARK-02**: Hero section with scroll-linked video (`teacher-working.mp4`) and reduced-motion fallback — existing (`paper-hero.tsx`)
- ✓ **MARK-03**: Static product, proof-strip, and final-CTA sections compose the page — existing
- ✓ **MARK-04**: Paper design tokens (`--paper-card`, `--paper-ink`, etc.) and shared UI primitives (Button, Input) — existing
- ✓ **MARK-05**: Header navigation and email-capture form (UI only, no submission) — existing

### Active

<!-- v1 scope of this milestone: a 4-stage shared-element scroll choreography, shipped to prod. -->

- [ ] **CHOREO-01**: A single product-screen element is shared across the page and morphs through 4 scroll-driven stages on desktop
- [ ] **CHOREO-02**: Stage 1 (Hero) — screen sits tiny inside the existing illustration, with the current scroll-linked video preserved underneath
- [ ] **CHOREO-03**: Stage 2 (Wow) — screen scales to a centered, near-full-viewport reveal as the user enters the first scroll zone
- [ ] **CHOREO-04**: Stage 3 (Feature A) — screen docks to one side; "every signal" feature copy and bullets fade in alongside
- [ ] **CHOREO-05**: Stage 4 (Feature B) — screen docks to the other side (or shifts position); "trends / notes" feature copy and bullets fade in
- [ ] **CHOREO-06**: Choreography uses `motion/react` scroll APIs and respects `prefers-reduced-motion` (static stacked end-states)
- [ ] **MOBILE-01**: On mobile, choreography is replaced with a static stacked layout — each stage's end-state is a normal section
- [ ] **CONTENT-01**: Copy across the 4 stages is rewritten to match the new sequence (hero headline, wow caption, feature A bullets, feature B bullets)
- [ ] **VISUAL-01**: Tonal contrast between paper-sketch world and photorealistic UI is preserved and used as a storytelling device — UI is not flattened to match paper
- [ ] **VISUAL-02**: Existing browser-frame screenshot of the Student Insights view (or a refreshed version) is the canonical product asset for the morphing element
- [ ] **NAV-01**: Site header behavior continues to work over the choreography (existing scroll-away behavior preserved or adapted)
- [ ] **CTA-01**: Final CTA (with email capture and link to live app) remains the page's terminal action after the choreography releases
- [ ] **PERF-01**: Lighthouse performance and CLS do not regress versus the current production landing
- [ ] **A11Y-01**: Reduced-motion users get a meaningful, non-jarring view (no missing content, no animation artifacts)
- [ ] **SHIP-01**: Deployed to production (Vercel) with the choreography live on `/`

### Out of Scope

- **Email-capture submission backend** — form will keep its current UI-only behavior; wiring to a CRM/webhook is a separate concern
- **Internationalization / multi-language copy** — single English landing only for now
- **Auth / sign-up flows on the marketing site** — the live app handles all auth; marketing only links out to it
- **Replacing or restyling the paper illustration** — the illustration stays; only the choreography around it changes
- **Replacing the hero video** — video remains underneath the morphing screen, not retired
- **Full mobile parity for the choreography** — mobile gets a static fallback by design; we are not engineering pinned scroll for small screens
- **Analytics, A/B testing, conversion instrumentation** — not part of this milestone; can be layered in later
- **CMS / content-driven copy** — copy stays inline in `src/content/landing.ts`
- **Adding new product features** — this is a marketing-site milestone only; the live app is untouched

## Context

**Codebase state:** Brownfield TanStack Start (React 19, Tailwind v4, motion/react, Radix/shadcn primitives) marketing site. Codebase is mapped under `.planning/codebase/`. Existing landing has a paper visual system, a scroll-linked hero video, and stacked static sections (product, proof, final-CTA). The latest commit (`008ed67`) introduced the paper-hero redesign that this milestone now extends.

**Storytelling intent:** The hand-drawn world is the *teacher's reality* — the chaos, the post-its, the photos on the wall. The product UI emerging from that world and growing into focal point is the moment of "ah, this is the calm in the chaos." The contrast between the two visual languages is the message; we keep both.

**Technical anchor:** `paper-hero.tsx` already uses `useScroll() + useTransform()` from `motion/react` to drive scroll-linked video and motion values. The shared-element choreography extends that pattern — the same pattern, larger surface area, multiple zones.

**Reference touchstones:** Apple product pages (shared-element scroll), Stripe and Linear marketing sites (sticky scroll choreography with content beats). The page should feel of that caliber on desktop without copying their visual language.

**Known anti-patterns to address (from CONCERNS / ARCHITECTURE):** Hardcoded external CTA links — should consolidate into `src/content/landing.ts`. Email-capture form has no submit handler — explicitly deferred via Out of Scope. Tokens are inline CSS variables — fine for now; not part of this milestone.

## Constraints

- **Tech stack**: React 19 + TanStack Start + Tailwind v4 + `motion/react` — locked. The choreography must be implementable inside this stack without introducing GSAP or another animation library.
- **Visual system**: Paper design tokens (`--paper-*`) and the existing illustration assets in `/public/hero/` are locked. Don't restyle the illustration.
- **Performance**: Must not regress current Lighthouse scores. Scroll choreography is GPU-friendly (transform/opacity only); no layout thrash.
- **Accessibility**: `prefers-reduced-motion` is a hard requirement. All content must be reachable without scroll-driven animation.
- **Mobile**: Static fallback only — no engineering effort spent on mobile pinned scroll.
- **Deployment**: Vercel; the live app at `teacherworkspace-alpha.vercel.app/students` is the conversion target and must not be modified by this milestone.
- **Scope discipline**: Marketing-site-only milestone. Live app is untouched.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Treat this as a landing redesign with the screen-morph as centerpiece (not a feature add or full rebuild) | Centerpiece framing forces section structure and copy to align with the choreography rather than retrofitting it | — Pending |
| Four scroll stages: Hero → Wow → Feature A → Feature B | Matches the natural narrative beat of the live product (one screen, every signal, trends, notes) | — Pending |
| Keep the existing scroll-linked hero video underneath the morphing screen | Adds depth (paper world has motion of its own) without conflicting with the screen reveal | — Pending |
| Preserve the tonal contrast between paper illustration and photorealistic UI | Contrast is the storytelling — the real product emerging from the teacher's drawn-out world | — Pending |
| Static fallback on mobile (no pinned scroll) | Pinned-scroll choreographies degrade on mobile; engineering cost is high; static end-states preserve the message | — Pending |
| Use `motion/react` scroll APIs (extending the `paper-hero.tsx` pattern) — no GSAP | Stack already uses motion/react; introducing a second animation library is unjustified | — Pending |
| Defer email-capture submission wiring | Out of scope for a redesign milestone; would dilute focus | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-04-28 after initialization*
