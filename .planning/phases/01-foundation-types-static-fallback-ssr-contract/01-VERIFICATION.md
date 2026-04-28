---
phase: 01-foundation-types-static-fallback-ssr-contract
verified: 2026-04-28T23:55:00Z
status: passed
score: 5/5 ROADMAP success criteria + 15/15 phase requirement IDs verified
overrides_applied: 0
re_verification: false
---

# Phase 1: Foundation — Types, Static Fallback, SSR Contract — Verification Report

**Phase Goal:** The page works end-to-end as a static stacked layout reading from a single typed source of truth, with the SSR/hydration contract settled before any animation code lands.

**Verified:** 2026-04-28T23:55:00Z
**Status:** passed
**Re-verification:** No — initial verification (Plan 01-05 Task 4 user-approved smoke checks predate this verification pass; this report independently re-verifies the codebase artifacts).

## Goal Achievement

### Observable Truths (ROADMAP Success Criteria)

| #   | Truth (ROADMAP SC) | Status     | Evidence       |
| --- | ------- | ---------- | -------------- |
| 1   | With JS disabled or `prefers-reduced-motion: reduce`, every word/image of all 4 stages reachable as stacked layout; no hydration warnings | VERIFIED (with caveat) | `StaticChoreographyFallback` composes `PaperHero → FeatureSection(feature-a) → FeatureSection(feature-b) → ProofStrip → FinalCta` (static-choreography-fallback.tsx:23–32). PaperHero `reduced` branch (paper-hero.tsx:36) gates on `prefersReducedMotion === true \|\| !isDesktop` — both reduced-motion users and mobile users get the static branch. `prefers-reduced-motion: reduce` global backstop in src/styles.css:208–217. Hydration parity: pnpm build green; user-approved Task 4 smoke checks confirm zero hydration warnings. **Caveat:** "every word and image of the four stages" — Wow stage has no dedicated section in the static fallback (intentional per RESEARCH.md Wow stage gap analysis: the screenshot already appears 3× in PaperHero reduced + two FeatureSections; Phase 4 may add `<WowCaptionStatic>` if a caption is authored). This is documented in static-choreography-fallback.tsx:17–21 and aligns with CONTEXT.md D-07 (`wow.copy.caption` is optional, defaults undefined in Phase 1). |
| 2   | `import type { StageDef, StageId, StageWindow, ScreenTarget }` resolves; 4 stages live as `as const` data; `landing.ts` exposes `stages: StageCopyContent[]` keyed by StageId + single `TEACHER_WORKSPACE_APP_URL` | VERIFIED | All 4 types exported from src/components/landing/scroll-choreography/types.ts (lines 4, 7, 10–14, 29–33). `STAGES` is `as const satisfies readonly StageDef[]` in stages.ts:15–20 with all 4 ids in narrative order. landing.ts:26 exports `stages: readonly StageCopyContent[]` of length 4. landing.ts:10 exports `TEACHER_WORKSPACE_APP_URL = "https://teacherworkspace-alpha.vercel.app/students"` as the single string literal. Tests `types.test.ts` (8 expectTypeOf assertions) + `stages.test.ts` (5 runtime assertions) green. |
| 3   | Mobile viewport (<1024px) renders the static fallback; choreography tree is never instantiated on mobile | VERIFIED | `useIsDesktop()` (use-is-desktop.ts) — optimistic-true on SSR/first-render, post-hydration reads `matchMedia("(min-width: 1024px)")`. Wired into PaperHero (paper-hero.tsx:31) and combined with `prefersReducedMotion` (line 36) so the reduced/static branch wins on mobile. CSS backstop `@media (max-width: 1023px) { .scroll-choreography-only { display: none !important } }` lands in styles.css:226–230 ready for Phase 2's choreography subtree. The `useIsDesktop` test (3 cases) verifies optimistic-true default, post-hydration mobile flip via matchMedia override, and listener subscribe/unsubscribe lifecycle. Phase 1 ships no choreography subtree to instantiate, so the requirement is trivially satisfied. |
| 4   | Keyboard user can Tab from address bar through the page in reading order; visible "skip to main content" focusable as first stop; focus rings on every interactive element | VERIFIED | `<SkipLink />` mounted as first body element in routes/__root.tsx:48 (before `{children}`). SkipLink renders `<a href="#main">Skip to main content</a>` with `sr-only focus:not-sr-only` Tailwind utilities (skip-link.tsx:13). `<main id="main">` matches in routes/index.tsx:13. Focus-ring coverage verified by grep: SkipLink (focus:outline-2 focus:outline-offset-2 focus:outline-primary), email-capture input (focus-visible:border-primary focus-visible:ring-3 focus-visible:ring-primary/40 — A11Y-07 fix), site-header nav links (focus-visible:ring-3 focus-visible:ring-primary/40), footer mailto (focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary). User-approved manual smoke check (Plan 05 Task 4 step 2) confirmed Tab order in browser. |
| 5   | Semantic landmarks (`<header>`, `<main>`, `<footer>`); one `<h1>`; consistent `<h2>`/`<h3>` per stage; footer renders on every render path | VERIFIED (with documented deviation) | One `<h1>` only — paper-hero.tsx:152–157 (rendered inside both `reduced` and choreography branches). `<header>` in site-header.tsx:12 (mounted at route level routes/index.tsx:12). `<main id="main">` in routes/index.tsx:13. `<footer>` in footer.tsx:12 (mounted at routes/index.tsx:16). SiteHeader, main, and SiteFooter are siblings in a Fragment (D-16/D-17 landmark sibling structure). Test `landmark-audit.test.tsx` (7 cases) verifies exactly one of each landmark + skip-link first focusable + header/footer outside main. **Documented deviation:** ROADMAP success criterion #5 says "footer with privacy / terms / support links" — Phase 1 ships D-05 minimal footer (copyright + trust line + mailto only). Privacy + Terms intentionally deferred per CONTEXT.md D-05 ("fabricating policy stubs adds legal risk for an early-access marketing site"). This is an authored, user-locked deviation, not a gap. |

**Score:** 5/5 ROADMAP Success Criteria verified.

### Required Artifacts

| Artifact | Expected | Status | Details |
| -------- | ------- | ------ | ------- |
| `vitest.config.ts` | jsdom env, react plugin, tsconfig-paths, setupFiles, globals:false | VERIFIED | File exists at repo root; `pnpm test --run` reports 7 test files / 31 tests passing. |
| `vitest.setup.ts` | matchMedia shim + afterEach(cleanup) | VERIFIED | File exists; matchMedia shim uses vi.fn (WR-04 fix); afterEach(cleanup) imported from @testing-library/react. |
| `src/components/landing/scroll-choreography/types.ts` | 8 exported types incl. StageId, StageDef, StageCopyContent (discriminated union) | VERIFIED | All 8 exports present. `StageId = "hero" \| "wow" \| "feature-a" \| "feature-b"`. Discriminated union enforces exact-3-bullets tuple for feature-a/b. `import type { MotionValue } from "motion/react"` per verbatimModuleSyntax. |
| `src/components/landing/scroll-choreography/stages.ts` | STAGES (readonly StageDef[], length 4, narrative order) + byId() + ScreenTargetsMap (type alias post WR-07 fix) | VERIFIED | STAGES has 4 entries hero/wow/feature-a/feature-b in narrative order with overlapping windows per D-12. `byId()` throws on unknown id. `ScreenTargetsMap` is type-only (WR-07: replaced `declare const SCREEN_TARGETS` with `type ScreenTargetsMap = Record<...>` so any value-import is now a hard tsc error). |
| `src/content/landing.ts` | 6 typed exports (TEACHER_WORKSPACE_APP_URL, navItems, stages, proofCopy, finalCtaCopy, footerCopy) + NavItem type; legacy `heroCopy/productCopy/modules/proofPoints` deleted | VERIFIED | All 6 exports present; legacy exports absent. proofCopy.subheading + finalCtaCopy.kicker are user-confirmed D-18 extensions. footerCopy.supportEmail = "support@teacherworkspace.app" (D-19). `import type { StageCopyContent } from "@/components/landing/scroll-choreography/types"`. |
| `src/components/landing/scroll-choreography/use-is-desktop.ts` | useHydrated + useState(true) + matchMedia subscription | VERIFIED | useHydrated from @tanstack/react-router (line 2); optimistic-true via outer ternary `hydrated ? isDesktop : true` (line 43); listener add/remove lifecycle in effect. WR-05 docstring corrected to match useHydrated semantics. |
| `src/components/landing/scroll-choreography/context.tsx` | ScrollChoreographyContext + useScrollChoreography hook with motionValue(0) stub | VERIFIED | createContext wired with default value of `{ scrollYProgress: motionValue(0), stages: STAGES, reducedMotion: false, mode: "static" }`. Phase 2 will swap stub for real useScroll. |
| `src/components/landing/scroll-choreography/scroll-choreography.tsx` | Phase-1 stub returning null + load-bearing PHASE-2 REQUIREMENT (FOUND-04) layoutEffect:false comment | VERIFIED | grep confirms `PHASE-2 REQUIREMENT (FOUND-04)` (line 6) and `layoutEffect: false` (lines 7, 12) literals. Body returns null intentionally to avoid Plan 04↔Plan 05 import dependency. |
| `src/components/landing/scroll-choreography/static-choreography-fallback.tsx` | Pure compositional shell rendering 4 sections | VERIFIED | Real implementation (Plan 05 replaced Plan 04's null stub). No state/hooks/effects. Composes `PaperHero → FeatureSection(feature-a) → FeatureSection(feature-b) → ProofStrip → FinalCta`. |
| `src/components/landing/feature-section.tsx` | Generic FeatureSection over feature-a/feature-b | VERIFIED | `Extract<StageId, "feature-a" \| "feature-b">` constrains stage prop. `stages.find((s) => s.id === stage)` does the lookup; throws on misshapen data. SECTION_IDS map binds feature-a → #features, feature-b → #testimonials (matching navItems hrefs). |
| `src/components/landing/paper-hero.tsx` | Data swap to typed content; useState/useTransform internals untouched (D-14); SiteHeader removed (D-16); reduced branch gates on isDesktop+reducedMotion (WR-01) | VERIFIED | `import { finalCtaCopy, stages, TEACHER_WORKSPACE_APP_URL } from "@/content/landing"`. heroEntry guard (lines 21–25). PHASE-2-DEBT comment (line 42) preserved. h1+separate p subline per D-15 (lines 152–160). useIsDesktop wired (line 31), `reduced = prefersReducedMotion === true \|\| !isDesktop` (line 36) per WR-01 fix. No `<header>` / `<SiteHeader>` element in paper-hero.tsx. video-metadata effect now depends on `[reduced]` per WR-06. |
| `src/components/landing/footer.tsx` | SiteFooter with copyright + trust line + mailto | VERIFIED | `<footer>` landmark; renders `{footerCopy.copyright}`, `{footerCopy.trustLine}`, `<a href="mailto:${footerCopy.supportEmail}">`. |
| `src/components/landing/skip-link.tsx` | sr-only-until-focused `<a href="#main">` | VERIFIED | sr-only + focus:not-sr-only Tailwind utilities; href="#main"; visible focus state with paper-card styling. |
| `src/styles.css` | `.scroll-choreography-only { display: none }` mobile gate + `prefers-reduced-motion` backstop | VERIFIED | Mobile gate at lines 226–230 (`@media (max-width: 1023px)`). Global reduced-motion backstop at lines 208–217. Both rules in place; class is currently unused (Phase 2 will tag the choreography subtree per design — IN-04 in REVIEW). |
| `src/routes/__root.tsx` | SkipLink mounted as first child of body | VERIFIED | `import { SkipLink }` (line 4); `<SkipLink />` is the first child of `<body>` (line 48). |
| `src/routes/index.tsx` | SiteHeader + main#main + SiteFooter as siblings; renders StaticChoreographyFallback inside main | VERIFIED | Fragment containing `<SiteHeader />`, `<main id="main" className="paper-page"><StaticChoreographyFallback /></main>`, `<SiteFooter />`. No `<PaperHero>`/`<ProductSection>`/`<FinalCta>` direct imports. |
| `src/components/landing/product-section.tsx` | DELETED (Plan 04 transition shim, Plan 05 deletes) | VERIFIED | File does not exist. `grep -rE "ProductSection\|product-section" src/` returns 0 matches. |

### Key Link Verification

| From | To | Via | Status | Details |
| ---- | --- | --- | ------ | ------- |
| stages.ts | types.ts | `import type { ScreenTarget, ScreenTargetRect, StageDef, StageId } from "./types"` | WIRED | Line 1 of stages.ts. |
| context.tsx | stages.ts | `import { STAGES } from "./stages"` | WIRED | Line 4 of context.tsx; STAGES used as default contextValue.stages. |
| use-is-desktop.ts | @tanstack/react-router | `import { useHydrated } from "@tanstack/react-router"` | WIRED | Line 2 of use-is-desktop.ts. |
| paper-hero.tsx | useIsDesktop | `import { useIsDesktop } from "@/components/landing/scroll-choreography/use-is-desktop"` | WIRED | Lines 10, 31, 36 — used to gate the reduced/static branch (WR-01 fix). |
| paper-hero.tsx | landing.ts | `import { finalCtaCopy, stages, TEACHER_WORKSPACE_APP_URL } from "@/content/landing"` | WIRED | Lines 12–16; consumed at hero entry guard (line 21), CTA href (165), CTA label (166), browser-chrome display spans (211, 232). |
| feature-section.tsx | landing.ts | `import { stages, TEACHER_WORKSPACE_APP_URL } from "@/content/landing"` | WIRED | Line 5; consumed at stages.find (line 16), CTA href (61), browser-chrome display (75). |
| feature-section.tsx | types.ts | `import type { StageId } from "@/components/landing/scroll-choreography/types"` | WIRED | Line 4; constrains FeatureStageId via Extract<>. |
| proof-strip.tsx | landing.ts | `import { proofCopy } from "@/content/landing"` | WIRED | Line 1; rendered at lines 24, 27, 32. |
| final-cta.tsx | landing.ts | `import { finalCtaCopy } from "@/content/landing"` | WIRED | Line 2; rendered at lines 33, 36, 39. |
| email-capture.tsx | landing.ts | `import { finalCtaCopy } from "@/content/landing"` | WIRED | Line 5; rendered at placeholder (line 16) + button label (line 23). Focus ring fix (A11Y-07) at line 15. |
| site-header.tsx | landing.ts | `import { finalCtaCopy, navItems, TEACHER_WORKSPACE_APP_URL } from "@/content/landing"` | WIRED | Lines 4–8; rendered at navItems.map (line 35), CTA href (51), CTA label (52). |
| routes/__root.tsx | skip-link | `import { SkipLink }` + `<SkipLink />` as first body child | WIRED | Lines 4, 48. |
| routes/index.tsx | SiteHeader + main + StaticChoreographyFallback + SiteFooter | direct imports + Fragment render | WIRED | Lines 3–5 imports; lines 11–17 render tree. `id="main"` on `<main>` matches SkipLink's `href="#main"`. |
| static-choreography-fallback.tsx | PaperHero + FeatureSection×2 + ProofStrip + FinalCta | direct imports + render | WIRED | Lines 1–4 imports; lines 23–32 compose all four sections in narrative order. |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
| -------- | ------------- | ------ | ------------------ | ------ |
| PaperHero | `hero = stages.find(s => s.id === "hero").copy` | landing.ts `stages` array | Yes — real headline + subline strings | FLOWING |
| FeatureSection(feature-a) | `entry.copy` (kicker, heading, paragraph, bullets) | landing.ts `stages` feature-a entry | Yes — real first-pass copy from Plan 03 | FLOWING |
| FeatureSection(feature-b) | `entry.copy` | landing.ts `stages` feature-b entry | Yes — real first-pass copy (Phase 4 owns final rewrite) | FLOWING |
| ProofStrip | `proofCopy.heading/subheading/points` | landing.ts proofCopy | Yes — 3-point preserved-verbatim array | FLOWING |
| FinalCta | `finalCtaCopy.kicker/headline/body` | landing.ts finalCtaCopy | Yes | FLOWING |
| EmailCapture | `finalCtaCopy.emailPlaceholder/cta` | landing.ts finalCtaCopy | Yes | FLOWING |
| SiteHeader | `navItems`, `TEACHER_WORKSPACE_APP_URL`, `finalCtaCopy.cta` | landing.ts | Yes | FLOWING |
| SiteFooter | `footerCopy.copyright/trustLine/supportEmail` | landing.ts footerCopy | Yes | FLOWING |
| ScrollChoreographyContext | `STAGES` from stages.ts | static array | Yes (Phase 1 — Phase 2 swaps motionValue(0) stub for real useScroll) | FLOWING (intentional Phase 1 stub for scrollYProgress only — STAGES is real) |

All artifacts that render dynamic data are wired to real data sources. The single Phase-1 stub is `ScrollChoreographyContext.scrollYProgress = motionValue(0)` — by design, never read in Phase 1, swapped in Phase 2.

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
| -------- | ------- | ------ | ------ |
| Project type-checks under strict TypeScript | `pnpm typecheck` | exit 0 | PASS |
| Production build succeeds | `pnpm build` | `✓ built in 2.04s` | PASS |
| All 7 test files pass with 31 tests | `pnpm test --run` | `Test Files  7 passed (7)` / `Tests  31 passed (31)` | PASS |
| FOUND-06: no live-app URL leakage outside landing.ts | `grep -rn "teacherworkspace-alpha.vercel.app" src/components/ src/routes/` | 0 matches | PASS |
| D-06 / FOUND-05: no legacy export references | `grep -rE "heroCopy\|productCopy\|\bmodules\b\|proofPoints" src/components/ src/routes/` | 0 matches | PASS |
| Phase-2 contract comment encoded | `grep "PHASE-2 REQUIREMENT" scroll-choreography.tsx` + `grep "layoutEffect: false"` | 1 + 2 matches | PASS |
| product-section.tsx deleted | `test -f src/components/landing/product-section.tsx` | non-zero (file absent) | PASS |
| One `<h1>` source-wide | `grep -nE "<h1" src/components/landing/**/*.tsx` | 1 match (paper-hero.tsx:152) | PASS |
| SkipLink wired as first body child | inspect routes/__root.tsx body | `<SkipLink />` is first child of `<body>` | PASS |

All automated checks pass.

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
| ----------- | ---------- | ----------- | ------ | -------- |
| FOUND-01 | 01-01 (Wave 0 stubs), 01-02 (impl) | Typed `StageDef[]` data model defines all four stages | SATISFIED | types.ts (8 exports); STAGES in stages.ts is `as const satisfies readonly StageDef[]`. types.test.ts + stages.test.ts green (13 tests). |
| FOUND-02 | 01-01, 01-02, 01-04 | `ScrollChoreographyContext` exposes shared `MotionValue<number>` scrollYProgress | SATISFIED | context.tsx provides ScrollChoreographyContext with `scrollYProgress: MotionValue<number>` (motionValue(0) stub for Phase 1; Phase 2 swaps for real useScroll). useScrollChoreography hook exported. |
| FOUND-03 | 01-01, 01-04 | SSR-safe `useIsDesktop` hook gates choreography vs static; optimistic-desktop with CSS backstop | SATISFIED | use-is-desktop.ts: useHydrated + useState(true) + ternary; CSS backstop in styles.css:226–230. Wired into PaperHero (line 31, 36) per WR-01. Tests cover optimistic default, post-hydration mobile flip, and listener lifecycle. |
| FOUND-04 | 01-04 | `useScroll({ layoutEffect: false })` production-build correctness fix | SATISFIED (contract encoded for Phase 2) | scroll-choreography.tsx is a Phase-1 stub returning null with the load-bearing `PHASE-2 REQUIREMENT (FOUND-04): layoutEffect: false` comment block (lines 6–13). Phase 2 fills the body using the encoded contract. Phase 1 has no useScroll consumers in choreography subtree, so the runtime rule is trivially satisfied. |
| FOUND-05 | 01-03 | `src/content/landing.ts` reshaped to expose `stages: StageCopyContent[]` keyed by StageId | SATISFIED | landing.ts:26 exports `stages: readonly StageCopyContent[]` with 4 entries; discriminated-union typing flowed from types.ts. Legacy heroCopy/productCopy/modules/proofPoints deleted. |
| FOUND-06 | 01-03, 01-04 | Single TEACHER_WORKSPACE_APP_URL constant centralizes live-app destination | SATISFIED | landing.ts:10–11 defines the constant. `grep -rn "teacherworkspace-alpha.vercel.app" src/components/ src/routes/` returns 0 matches. paper-hero.tsx + feature-section.tsx use `TEACHER_WORKSPACE_APP_URL.replace("https://", "")` for browser-chrome display spans. |
| STATIC-01 | 01-05 | `<StaticChoreographyFallback>` renders all four stages as stacked normal-scroll layout from same `stages` data | SATISFIED | static-choreography-fallback.tsx composes PaperHero + FeatureSection(feature-a) + FeatureSection(feature-b) + ProofStrip + FinalCta. All four sections read from `stages` (or for ProofStrip/FinalCta, from related top-level exports). Test: static-choreography-fallback.test.tsx (3 tests). |
| STATIC-02 | 01-04, 01-05 | Mobile viewport (<1024px) renders the static fallback by default | SATISFIED | useIsDesktop returns false on mobile post-hydration; PaperHero `reduced` flag becomes true on `!isDesktop`. CSS `@media (max-width: 1023px) { .scroll-choreography-only { display: none } }` adds defense-in-depth. Phase 1 has no choreography subtree to instantiate, so requirement is structurally satisfied. |
| STATIC-03 | 01-04 | Reduced-motion users render the static fallback regardless of viewport | SATISFIED | PaperHero gates on `prefersReducedMotion === true \|\| !isDesktop` (line 36). Global `@media (prefers-reduced-motion: reduce)` backstop in styles.css:208–217 also active. User-approved manual smoke check confirmed. |
| STATIC-04 | 01-05 | Static fallback contains every word and image present in choreography path | SATISFIED (with documented Wow gap) | All hero/feature-a/feature-b copy + product screenshot reachable in the static path via `<PaperHero>` (reduced branch shows the screenshot at lines 224–242) + 2× `<FeatureSection>` (each renders the screenshot at lines 68–84). Wow stage caption is intentionally undefined in Phase 1 per D-07 (Phase 4 may author one). |
| CONTENT-07 | 01-03, 01-05 | Footer with privacy/terms/support links present on every render path | SATISFIED (with D-05 deviation) | SiteFooter mounted at routes/index.tsx:16 (route-level sibling of main, present on every render). D-05: minimal footer ships copyright + trust line + mailto only; privacy + terms intentionally deferred (no fabricated policy stubs). User-approved deviation from literal ROADMAP phrasing per CONTEXT.md D-05. |
| A11Y-01 | 01-04, 01-05 | All choreography content fully reachable for prefers-reduced-motion users via static fallback | SATISFIED | PaperHero reduced branch (lines 224–242) renders the full hero illustration + product screenshot stack. FeatureSection×2 + ProofStrip + FinalCta render unconditionally. User-approved smoke check (Plan 05 Task 4 step 3) confirmed reduced-motion mode in DevTools. |
| A11Y-03 | 01-05 | Skip-link to main content present and visible on focus | SATISFIED | SkipLink mounted in __root.tsx:48 as first body element. href="#main" matches `<main id="main">` in routes/index.tsx:13. sr-only + focus:not-sr-only Tailwind utilities make it visible only on focus. Test: skip-link.test.tsx (2 tests) + landmark-audit.test.tsx (skip-link first focusable assertion). |
| A11Y-04 | 01-04, 01-05 | Semantic landmarks (header, main, footer) + one h1; consistent h2/h3 per stage | SATISFIED | One `<h1>` (paper-hero.tsx:152). One `<header>` (site-header.tsx:12). One `<main id="main">` (routes/index.tsx:13). One `<footer>` (footer.tsx:12). Per landmark-audit.test.tsx: header and footer are siblings of main, not children (D-16/D-17). FeatureSection×2 contributes 2× `<h2>`; ProofStrip + FinalCta each contribute 1× `<h2>`; ProofStrip points are `<h3>`s. |
| A11Y-07 | 01-04 | No hover-only interactions; focus rings visible on all interactive elements | SATISFIED | email-capture.tsx:15 swaps `focus-visible:ring-0` for `focus-visible:border-primary focus-visible:ring-3 focus-visible:ring-primary/40` (the original A11Y-07 fix). All other interactive elements (SkipLink, SiteHeader nav links + CTA, hero CTA, FeatureSection CTAs, EmailCapture submit, footer mailto) carry visible focus-ring or focus-visible styles. User-approved manual keyboard walk-through (Plan 05 Task 4 step 2). |

**Coverage:** 15/15 phase requirement IDs SATISFIED.

**Orphaned check:** REQUIREMENTS.md Phase 1 = {FOUND-01..06, STATIC-01..04, CONTENT-07, A11Y-01, A11Y-03, A11Y-04, A11Y-07} = 15 IDs. The 15 IDs declared across plans 01-01..01-05 frontmatter exactly match. No orphans.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
| ---- | ---- | ------- | -------- | ------ |
| `src/components/landing/paper-hero.tsx` | 42–49 | `PHASE-2-DEBT` comment block flagging useState/useTransform debt | INFO | Intentional debt flag per CONTEXT.md D-14 — Phase 2 owns CHOREO-06/MIGRATE-02/MIGRATE-03. Not a bug. |
| `src/components/landing/scroll-choreography/scroll-choreography.tsx` | 1–20 | Component returns `null` (intentional Phase 1 stub) | INFO | Documented in 01-05-SUMMARY and component docstring. The `return null` is the contract; Phase 2 fills body. Static fallback is wired directly into routes/index.tsx, bypassing this stub. Not a bug. |
| `src/styles.css` | 226–230 | `.scroll-choreography-only` class has no consumers in Phase 1 | INFO | Phase 2 will tag the choreography subtree with this class; intentional defense-in-depth. Listed as IN-04 in REVIEW.md (out of `critical_warning` scope). |
| `src/components/landing/email-capture.tsx` | 11 | Form `onSubmit={(event) => event.preventDefault()}` (no real handler) | INFO | Pre-existing pattern from before Phase 1; documented as out-of-scope in REQUIREMENTS.md (Email-capture submission backend). Not introduced by Phase 1; not a Phase 1 gap. |
| (none) | — | No TODO/FIXME/XXX/HACK/PLACEHOLDER strings introduced by Phase 1 in source code | — | Verified by grep across modified files. |

No blocker-severity anti-patterns.

### Human Verification Required

(None — Plan 05 Task 4 was a checkpoint:human-verify gate executed by the user on 2026-04-28; smoke checks were signed off as "approved" per commit `bf86c70 docs(phase-01): mark plan 01-05 complete after user-approved smoke verification (Phase 1 done)`. The visual regression check, keyboard tab order walkthrough, reduced-motion emulation, mobile viewport, and production hydration parity were all confirmed in the user's browser before sign-off. This verification report independently re-verifies the structural artifacts in code; the user's manual sign-off remains the source of truth for browser behavior.)

### Gaps Summary

No gaps. Phase 1 ships:

- The typed `StageDef`/`StageCopyContent` data model with discriminated-union per-stage shapes (FOUND-01).
- `ScrollChoreographyContext` with shared `MotionValue<number>` scrollYProgress stub (FOUND-02).
- SSR-safe `useIsDesktop` with optimistic-desktop default + CSS backstop, wired into PaperHero (FOUND-03).
- `PHASE-2 REQUIREMENT (FOUND-04): layoutEffect: false` contract encoded as a load-bearing comment for Phase 2 (FOUND-04).
- `landing.ts` reshape: 6 typed exports replace 4 legacy exports (FOUND-05).
- Single `TEACHER_WORKSPACE_APP_URL` centralizes the live-app destination; 0 grep matches outside landing.ts (FOUND-06).
- `<StaticChoreographyFallback>` thin shell composing PaperHero + FeatureSection×2 + ProofStrip + FinalCta (STATIC-01..04).
- D-05 minimal footer landmark + sr-only-until-focused skip-link mounted at root (CONTENT-07, A11Y-03, A11Y-04).
- A11Y-07 focus-ring fix in email-capture.
- Reduced-motion fallback gating in PaperHero, with global CSS backstop (A11Y-01, STATIC-03).

All 7 Wave-0 test files (31 tests) green. `pnpm typecheck`, `pnpm test --run`, `pnpm build` all exit 0.

The two intentional Phase-1 deviations from a literal reading of ROADMAP success criteria are user-locked per CONTEXT.md:
- D-05: footer has no privacy/terms links (deferred until real policies exist; no fabricated stubs).
- Wow stage has no dedicated static section (the screenshot already appears 3× in the static tree; Phase 4 may add a caption).

Both deviations are deliberate, documented, and were approved during Phase 1 planning + user sign-off. Phase 1 goal is achieved.

---

_Verified: 2026-04-28T23:55:00Z_
_Verifier: Claude (gsd-verifier)_
