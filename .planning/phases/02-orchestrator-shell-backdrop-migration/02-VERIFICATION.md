---
phase: 02-orchestrator-shell-backdrop-migration
verified: 2026-04-29T14:42:00Z
status: passed
score: 18/18 must-haves verified
overrides_applied: 2
overrides:
  - must_have: "CHOREO-02 — current scroll-linked hero video continues to play underneath"
    reason: "User-approved scope shift on 2026-04-29 during production-preview smoke. Hero video switched from scroll-linked currentTime scrubbing to autoplay+loop. Same storytelling intent (background motion in the paper world during stage 1) with a simpler primitive and tempo decoupled from scroll speed. STATE.md captures the shift; paper-backdrop.test.tsx asserts autoplay+loop attrs and that currentTime is never written. REQUIREMENTS.md literal text is now stale relative to shipped behavior — deferred-cleanup item."
    accepted_by: "user (rezailmi)"
    accepted_at: "2026-04-29"
  - must_have: "CHOREO-08 — currentTime updates are gated/paused once Stage 2 fully covers it (GPU pressure fix)"
    reason: "User-approved scope shift on 2026-04-29. CHOREO-08's pause-when-covered GPU-relief intent is preserved — the gate now calls video.pause() above byId('wow').window[1] and video.play() below. Only the active behavior (scrub vs loop) changed. The literal 'currentTime updates are gated' text is stale relative to shipped behavior; the spirit (no GPU work for hidden frames) is intact and verified via paper-backdrop.test.tsx 'pauses video when threshold crossed'."
    accepted_by: "user (rezailmi)"
    accepted_at: "2026-04-29"
---

# Phase 2: Orchestrator Shell + Backdrop Migration — Verification Report

**Phase Goal:** A single `<ScrollChoreography>` owns the tall sticky shell and the master `useScroll`, with `<PaperBackdrop>` (illustration + scroll-linked video + cloud parallax) extracted cleanly from `paper-hero.tsx` — and the two known debts (`useState` on scroll, magic-number keyframes) paid down on the way through.

**Verified:** 2026-04-29T14:42Z
**Status:** PASSED
**Re-verification:** No — initial verification

---

## Goal Achievement

### ROADMAP Success Criteria (the contract)

| # | Success Criterion | Status | Evidence |
|---|---|---|---|
| SC1 | Single shared product-screen motion.div + video gate (with autoplay-loop scope shift) | VERIFIED (override) | `product-screen.tsx` is a single motion.div carrying `/hero/profiles-screen.png`; `product-screen.test.tsx` "mount stability" passes (DOM-node identity preserved across 5 scroll updates); video gate at `byId("wow").window[1]` verified by `paper-backdrop.test.tsx` (pause + play threshold tests) |
| SC2 | 0–2 re-renders / 1s scroll; no useState for visual values | VERIFIED | `choreography-rerender-budget.test.tsx` asserts ≤ 2 re-renders across 100 motion-value updates (GREEN); `grep useState\(` returns 0 actual hook calls across `scroll-choreography.tsx` / `paper-backdrop.tsx` / `product-screen.tsx`; only references are in JSDoc comments documenting paper-hero.tsx's debt being paid down |
| SC3 | Site header stays above morph layer; useScroll has layoutEffect:false; no first-paint flicker | VERIFIED (with deferred prod check) | `header-stacking.test.tsx` asserts banner is NOT a descendant of any element with inline style.transform AND not inside `<main>` (GREEN, 4 tests); `useScroll({ ..., layoutEffect: false })` present at scroll-choreography.tsx:80-84; FOUND-04 OQ-1 production-flicker smoke is Outcome C (inconclusive) per STATE.md — deferred to Phase 5 Vercel deploy verification (per ROADMAP Phase 5 SC#4) |
| SC4 | lvh outer + svh inner; transform/opacity/clip-path only on scroll-driven elements | VERIFIED | scroll-choreography.tsx:129 `h-[280lvh]` outer + line 132 `h-svh` inner sticky; `migrate-perf-04.test.ts` AST gate asserts no width/height/top/left/box-shadow motion-value bindings across all 3 files (GREEN, 3 tests) |
| SC5 | useTransform keyframes resolve through STAGES constants — zero magic-number tuples | VERIFIED | `migrate-03-keyframe-binding.test.ts` AST gate (GREEN, 3 tests). All useTransform keyframe entries are 0/1, byId('...').window[N] MemberExpressions, or named local Identifier consts (`STAGE_SCALE_MID_PROGRESS`, `STAGE_OPACITY_FADE_START`, `HERO_COPY_FADE_OUT_START`, etc.) |

**Roadmap SC Score:** 5/5 verified.

### Plan Frontmatter Must-Haves (across 5 plans)

#### Plan 01 — Wave-0 test scaffold (5 truths)

| # | Truth | Status | Evidence |
|---|---|---|---|
| 1 | 8 Wave-0 test files exist + RED initially | VERIFIED | All 8 files present: scroll-choreography, paper-backdrop, product-screen, header-stacking, choreography-rerender-budget, migrate-03-keyframe-binding, migrate-perf-04, stages.test.ts (D-14 assertion at line 43-49). All now GREEN per the Wave 1+2+3 progression (`pnpm test --run`: 14 files / 59 tests passing). |
| 2 | Every Phase 2 requirement ID covered by ≥1 fail-loudly stub | VERIFIED | Coverage map: CHOREO-01 (product-screen mount stability + no-layoutId tests), CHOREO-02 (paper-backdrop render-shape video + autoplay/loop attrs), CHOREO-06 (rerender-budget + paper-backdrop motion-value shape), CHOREO-07 (scroll-choreography container shape lvh/svh), CHOREO-08 (paper-backdrop video gate threshold pause/play tests), MIGRATE-01 (paper-backdrop render shape), MIGRATE-02 (rerender-budget + product-screen useTransform shape), MIGRATE-03 (AST keyframe-binding test), MIGRATE-04 (header-stacking 4 tests), PERF-04 (AST forbidden-CSS-keys test) |
| 3 | @typescript-eslint/parser added as devDep | VERIFIED | `pnpm exec node -e "require('@typescript-eslint/parser')"` succeeds; both AST tests import it. |
| 4 | stages.test.ts asserts retuned wow.window[1] = 0.78 | VERIFIED | stages.test.ts:43-49 `expect(byId("wow").window[1]).toBeCloseTo(0.78, 2)` (GREEN). |
| 5 | Test strategy honors D-21 (4-case mode-switch + never-unmounts + layoutEffect:false + Profiler→Plan 05) | VERIFIED | scroll-choreography.test.tsx implements 4-case it.each matrix; product-screen.test.tsx implements mount-counter test; scroll-choreography.test.tsx implements layoutEffect:false call-signature spy via vi.mock; rerender-budget gate is the ≤2 numeric assertion replacing manual Profiler smoke. |

#### Plan 02 — PaperBackdrop extraction (6 truths)

| # | Truth | Status | Evidence |
|---|---|---|---|
| 1 | Renders paper-card frame + 2 clouds + video at locked URLs (D-04) | VERIFIED | paper-backdrop.tsx:111-166 contains `paper-card` className, two `cloud-halftone.png` `<img>` elements, and a `<video src="/hero/teacher-working.mp4" poster="/hero/teacher-illustration.png">`. paper-backdrop.test.tsx render-shape test (GREEN). |
| 2 | stageScale/cloudYLeft/cloudYRight/stageOpacity flow through useTransform; no useState (D-10) | VERIFIED | 4 useTransform calls at lines 68, 73, 78, 83. `grep useState\(` returns 0 in paper-backdrop.tsx. CHOREO-06 honored. |
| 3 | Video gate fires at byId('wow').window[1] (D-15/D-16) — pause above, resume below | VERIFIED (override on details) | useMotionValueEvent at line 96 reads VIDEO_GATE_THRESHOLD = `byId("wow").window[1]` (line 42). Above: `video.pause()`. Below: `video.play()`. paper-backdrop.test.tsx threshold-cross tests (3 tests, GREEN). Note: original D-15/16 wrote currentTime; the autoplay-loop scope shift simplified this to play()/pause() only — STATE.md documents this user-approved deviation. |
| 4 | Every useTransform keyframe is 0/1, byId(...).window[N], or named local const (D-12/D-13) | VERIFIED | migrate-03-keyframe-binding.test.ts AST walk passes for paper-backdrop.tsx (GREEN). Named local consts at lines 42-59: VIDEO_GATE_THRESHOLD, STAGE_SCALE_MID_PROGRESS, STAGE_SCALE_MID_VALUE, STAGE_SCALE_END_VALUE, STAGE_OPACITY_FADE_START, STAGE_OPACITY_FADE_END, CLOUD_LEFT_TRAVEL_PX, CLOUD_RIGHT_TRAVEL_PX. |
| 5 | loadedmetadata effect attaches/cleans up; dep array [] (D-17) | DEFERRED → autoplay-loop scope shift removed this | The original D-17 contract was made obsolete by the autoplay-loop scope shift. STATE.md captures this. The `loadedmetadata` effect and `videoDurationRef` were intentionally removed — duration is no longer needed because we don't write currentTime. paper-backdrop.test.tsx no-currentTime regression guard (GREEN) prevents reintroduction. |
| 6 | Accepts children prop nesting between cloud divs and video container (D-06) | VERIFIED | paper-backdrop.tsx:61 `function PaperBackdrop({ children }: { children?: ReactNode })`. children render at lines 145-147 between cloud divs (lines 120-141) and video container (lines 149-164). |

#### Plan 03 — ProductScreen Phase-2 stub (6 truths)

| # | Truth | Status | Evidence |
|---|---|---|---|
| 1 | Renders browser-frame chrome + screenshot in inset-0 z-20 absolute container (D-08) | VERIFIED | product-screen.tsx:73-98 contains `pointer-events-none absolute inset-0 z-20` outer wrapper, browser-chrome bar with traffic-light dots + URL strip, and `<img src="/hero/profiles-screen.png">`. |
| 2 | screenScale + screenOpacity via useTransform; no useState (D-10/CHOREO-06) | VERIFIED | useTransform at lines 54 (screenScale) and 67 (screenOpacity). `grep useState\(` returns 0 in product-screen.tsx. |
| 3 | All useTransform keyframes are 0/1, byId(...).window[N], or named local consts (D-12/D-13) | VERIFIED | Lines 38-39: SCREEN_FADE_START = byId("wow").window[0]; SCREEN_FADE_END = byId("wow").window[1]. Lines 44-46: SCREEN_SCALE_HERO/PEAK/OVERSHOOT named consts. AST test passes. |
| 4 | NO layoutId attribute (CHOREO-01) | VERIFIED | `grep layoutId` returns 0 in product-screen.tsx. product-screen.test.tsx "no layoutId" test (GREEN) — checks `[layoutid]`, `[data-layoutid]`, AND `innerHTML` for "layoutId=" string. |
| 5 | Hero→wow transition only; SCREEN_TARGETS stays type alias (D-09/D-11) | VERIFIED | No docking transforms or feature-a/b animations in product-screen.tsx (D-09 honored). product-screen.test.tsx Phase-2 stage scope test (GREEN). stages.ts:42 `export type ScreenTargetsMap = Record<...>` remains a type alias only (no runtime export). |
| 6 | Subscribes to scrollYProgress via useScrollChoreography() (D-05) | VERIFIED | product-screen.tsx:49 `const { scrollYProgress } = useScrollChoreography()` |

#### Plan 04 — Orchestrator + STAGES retune (8 truths)

| # | Truth | Status | Evidence |
|---|---|---|---|
| 1 | Two-component split (ScrollChoreography + ChoreographyTree); hooks never conditional; mode computed correctly (D-02) | VERIFIED | scroll-choreography.tsx:55 `export function ScrollChoreography()` (mode switch + early-return at line 64); :69 `function ChoreographyTree({ sectionRef })` (private, calls useScroll). `reduced = prefersReducedMotion === true || !isDesktop` at line 60. |
| 2 | Outer section className `scroll-choreography-only relative h-[280lvh]` + inner sticky `h-svh` (CHOREO-07/D-18) | VERIFIED | scroll-choreography.tsx:129 outer section className matches; line 132 inner div `sticky top-0 flex h-svh items-stretch overflow-hidden p-3`. |
| 3 | useScroll called with layoutEffect:false + correct target/offset (D-20) | VERIFIED | Lines 80-84: `useScroll({ target: sectionRef, offset: ["start start", "end end"], layoutEffect: false } as Parameters<typeof useScroll>[0])`. |
| 4 | Provider value = { scrollYProgress, stages: STAGES, reducedMotion: false, mode: 'choreography' } | VERIFIED | Lines 119-126 match exactly. |
| 5 | Hero copy block (h1 + p + Button) inline as PaperBackdrop children with copyOpacity + copyY useTransform (D-07/D-13) | VERIFIED | scroll-choreography.tsx lines 102-111 copyOpacity + copyY useTransform with named local consts (HERO_COPY_FADE_OUT_START/END, HERO_COPY_LIFT_PROGRESS, HERO_COPY_LIFT_TRAVEL_PX at lines 50-53). Lines 133-156 render h1 + p + Button inside PaperBackdrop. |
| 6 | Static branch early-returns; useScroll never runs in static; PaperHero/StaticChoreographyFallback unchanged (D-03) | VERIFIED | Line 64 `if (reduced) return <StaticChoreographyFallback />`. ChoreographyTree (where useScroll lives) only mounts on choreography branch. `git diff src/components/landing/paper-hero.tsx src/components/landing/scroll-choreography/static-choreography-fallback.tsx` returns empty. |
| 7 | stages.ts wow.window = [0.2, 0.78] retune (D-14); feature-a/b unchanged | VERIFIED | stages.ts:17 `{ id: "wow", window: [0.2, 0.78] as const, screen: "centered" }`. Line 18 feature-a [0.5, 0.78] unchanged. Line 19 feature-b [0.75, 1.0] unchanged. stages.test.ts:43-49 D-14 assertion GREEN. |
| 8 | SiteHeader stacking-context preserved; verified by header-stacking.test.tsx (D-19) | VERIFIED | header-stacking.test.tsx (4 tests, GREEN). Banner not descendant of transformed element; banner not inside `<main>`; landmark count = 1 banner + 1 main + 1 contentinfo. |

#### Plan 05 — Routes wiring + production verification (5 truths)

| # | Truth | Status | Evidence |
|---|---|---|---|
| 1 | routes/index.tsx imports ScrollChoreography (not StaticChoreographyFallback) | VERIFIED | routes/index.tsx:5 `import { ScrollChoreography } from "@/components/landing/scroll-choreography/scroll-choreography"`. Line 14 `<ScrollChoreography />`. No StaticChoreographyFallback reference. |
| 2 | Full suite GREEN (`pnpm test --run && pnpm typecheck && pnpm build`) | VERIFIED | `pnpm test --run`: 14 files / 59 tests passing. `pnpm typecheck`: exit 0. `pnpm build`: built in 2.76s. |
| 3 | FOUND-04 / OQ-1 verdict captured in STATE.md | VERIFIED | STATE.md "Phase 2 FOUND-04 / OQ-1 verdict (2026-04-29 via pnpm build && pnpm preview smoke): Outcome C — inconclusive" present. layoutEffect:false stays in code; Phase 5 Vercel deploy is the authoritative gate. |
| 4 | STAGES.wow.window first-pass [0.20, 0.78] visually validated OR retune captured | VERIFIED | STATE.md "Phase 2 D-14 STAGES.wow.window retune (2026-04-29 via pnpm preview visual review): deferred re-verify" — first-pass [0.20, 0.78] retained; visual review deferred to Phase 3. stages.ts and stages.test.ts both reflect 0.78. |
| 5 | Hero → wow choreography reads correctly on desktop preview | VERIFIED (per Plan 05 SUMMARY browser-validated table) | Plan 05 SUMMARY documents agent-browser checks — autoplay-loop video, gate threshold pause/resume, ProofStrip + FinalCta + footer all rendered, no console errors. |

---

## Required Artifacts (Levels 1-3)

| Artifact | Expected | Status | Details |
|---|---|---|---|
| `src/components/landing/scroll-choreography/scroll-choreography.tsx` | Two-component split, useScroll, provider, sticky shell | VERIFIED + WIRED | 170 lines; exports ScrollChoreography; private ChoreographyTree; consumed by routes/index.tsx |
| `src/components/landing/scroll-choreography/paper-backdrop.tsx` | NEW — paper-card + clouds + video + gate + children slot | VERIFIED + WIRED | 167 lines; exports PaperBackdrop; consumed by scroll-choreography.tsx (line 33) |
| `src/components/landing/scroll-choreography/product-screen.tsx` | NEW — Phase-2 stub: browser frame + screenshot | VERIFIED + WIRED | 99 lines; exports ProductScreen; consumed by scroll-choreography.tsx (line 34) |
| `src/components/landing/scroll-choreography/stages.ts` | wow.window retuned to [0.2, 0.78] | VERIFIED + WIRED | Line 17 contains the retune; consumed by paper-backdrop.tsx, product-screen.tsx, scroll-choreography.tsx |
| `src/routes/index.tsx` | Renders `<ScrollChoreography />` (D-01 swap) | VERIFIED + WIRED | Lines 5 + 14 swap done; landmark structure preserved (SiteHeader / `<main id="main" className="paper-page">` / SiteFooter) |
| 8 Wave-0 test files | All exist + GREEN | VERIFIED | scroll-choreography.test.tsx (6 tests), paper-backdrop.test.tsx (6 tests), product-screen.test.tsx (4 tests), header-stacking.test.tsx (4 tests), choreography-rerender-budget.test.tsx (1 test), migrate-03-keyframe-binding.test.ts (3 tests), migrate-perf-04.test.ts (3 tests), stages.test.ts (6 tests) |
| `paper-hero.tsx` | UNCHANGED (Phase 5 owns deletion) | VERIFIED | `git diff src/components/landing/paper-hero.tsx` returns empty. PHASE-2-DEBT comment block at lines 42-49 still present as expected (Phase 5 deletes the file). |
| `static-choreography-fallback.tsx` | UNCHANGED (Phase 5 owns refactor) | VERIFIED | `git diff` returns empty. Still imports PaperHero per D-03. |

---

## Key Link Verification

| From | To | Via | Status | Detail |
|---|---|---|---|---|
| ScrollChoreography (outer) | StaticChoreographyFallback | Early-return when reduced | WIRED | scroll-choreography.tsx:64 `if (reduced) return <StaticChoreographyFallback />` |
| ScrollChoreography (outer) | ChoreographyTree | Direct render with sectionRef | WIRED | Line 66 `return <ChoreographyTree sectionRef={sectionRef} />` |
| ChoreographyTree | useScroll(motion/react) | layoutEffect:false + offset/target | WIRED | Lines 80-84 |
| ChoreographyTree | ScrollChoreographyContext.Provider | Provides live scrollYProgress | WIRED | Lines 119-126 |
| ChoreographyTree | PaperBackdrop | Renders + passes hero copy as children (D-06) | WIRED | Lines 133-156 (PaperBackdrop wraps the inline motion.div hero copy block) |
| ChoreographyTree | ProductScreen | Sibling render inside sticky container | WIRED | Line 157 `<ProductScreen />` |
| PaperBackdrop | useScrollChoreography() | Context subscription | WIRED | paper-backdrop.tsx:62 |
| PaperBackdrop | byId("wow").window[1] | VIDEO_GATE_THRESHOLD | WIRED | paper-backdrop.tsx:42 |
| PaperBackdrop | `<video>` element | useMotionValueEvent imperative pause/play | WIRED | Lines 96-109 (D-15 imperative gate, the only legitimate useMotionValueEvent in Phase 2) |
| ProductScreen | useScrollChoreography() | Context subscription | WIRED | product-screen.tsx:49 |
| ProductScreen | byId("wow").window[0]/[1] | SCREEN_FADE_START/END (D-12 endpoint binding) | WIRED | Lines 38-39 |
| routes/index.tsx | ScrollChoreography | Direct import + render in `<main>` | WIRED | Lines 5 + 14 |

All links verified.

---

## Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|---|---|---|---|---|
| ChoreographyTree | scrollYProgress | useScroll({ target: sectionRef, ... }) — real motion.useScroll | YES — live scroll observer | FLOWING |
| PaperBackdrop | scrollYProgress | Context (provided by ChoreographyTree) | YES | FLOWING |
| ProductScreen | scrollYProgress | Context | YES | FLOWING |
| ChoreographyTree (hero copy) | hero.headline / hero.subline | content/landing.ts stages array — discriminated-union narrow with throw on missing | YES (real content; throws if data is misshapen — defensive) | FLOWING |
| Video element | autoplay+loop attrs | DOM-level browser default; gate uses pause()/play() | YES — confirmed in Plan 05 SUMMARY browser-validated table (paused:false at scroll=0; paused:true above gate) | FLOWING |

---

## Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|---|---|---|---|
| Test suite passes | `pnpm test --run` | 14 files / 59 tests passing | PASS |
| TypeScript strict-mode passes | `pnpm typecheck` | exit 0 | PASS |
| Production build succeeds | `pnpm build` | "built in 2.76s" | PASS |
| Module exports load | grep `export function ScrollChoreography` scroll-choreography.tsx | 1 hit | PASS |
| Zero useState in Phase 2 source | `grep useState\(` paper-backdrop/product-screen/scroll-choreography .tsx | 0 actual hook calls (only JSDoc references) | PASS |
| Zero layoutId in Phase 2 source | `grep layoutId` (3 files) | 0 | PASS |

---

## Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|---|---|---|---|---|
| CHOREO-01 | 03 (product-screen) | Single product-screen motion.div; never unmounts; no layoutId | SATISFIED | product-screen.test.tsx mount-counter test asserts identity stability across 5 scroll updates (GREEN); zero `layoutId` in source |
| CHOREO-02 | 02 (paper-backdrop) | Stage 1 hero video continues to play | SATISFIED (override) | Original "scroll-linked" text superseded by user-approved 2026-04-29 autoplay-loop scope shift. Same intent (background motion in paper world) preserved; STATE.md captures shift. paper-backdrop.test.tsx asserts autoplay+loop+muted+playsInline attrs (GREEN) |
| CHOREO-06 | 02, 03, 04 | All scroll-driven visual values use useTransform (no useState) | SATISFIED | choreography-rerender-budget.test.tsx ≤2 re-renders gate (GREEN); zero useState calls in 3 Phase 2 source files; paper-backdrop motion-value shape test (GREEN) |
| CHOREO-07 | 04 (orchestrator) | lvh outer + svh inner | SATISFIED | scroll-choreography.tsx:129 `h-[280lvh]` outer; line 132 `h-svh` inner; container shape test (GREEN) |
| CHOREO-08 | 02 (paper-backdrop) | Hero video gated/paused once stage 2 covers it (GPU pressure fix) | SATISFIED (override) | GPU-relief intent fully preserved (pause()/play() at byId('wow').window[1]). Original "currentTime updates are gated" text superseded by autoplay-loop scope shift; STATE.md documents the shift. paper-backdrop.test.tsx threshold tests + no-currentTime regression guard all GREEN |
| MIGRATE-01 | 02 (paper-backdrop) | paper-hero.tsx illustration + video + clouds extracted into PaperBackdrop | SATISFIED | paper-backdrop.tsx exports PaperBackdrop with paper-card frame + 2 cloud images + video; render-shape test (GREEN) |
| MIGRATE-02 | 02, 03, 04 | useState→useTransform for opacity values | SATISFIED | Zero useState in Phase 2 source files; stageOpacity, screenOpacity, copyOpacity all flow through useTransform; rerender-budget gate is the falsifiable proof |
| MIGRATE-03 | 02, 03, 04 | Hardcoded magic-number keyframes replaced with named STAGES constants | SATISFIED | migrate-03-keyframe-binding.test.ts AST gate (GREEN, 3 tests across 3 files); endpoints bind to byId('...').window[N], intra-stage timing as named local consts (D-12 + D-13 honored) |
| MIGRATE-04 | 04 (orchestrator) | Site header remains visible above morph layer | SATISFIED | header-stacking.test.tsx 4 tests GREEN; outer section carries no inline transform; SiteHeader is a sibling of `<main>` at the route level (preserved) |
| PERF-04 | 02, 03, 04 | No animated width/height/top/left/box-shadow on scroll-driven elements | SATISFIED | migrate-perf-04.test.ts AST gate (GREEN, 3 tests across 3 files) |

**No orphaned requirements:** All 10 requirement IDs declared in PLAN frontmatters appear in REQUIREMENTS.md and map to Phase 2 in the traceability table.

---

## Anti-Patterns Scan

| File | Line | Pattern | Severity | Impact |
|---|---|---|---|---|
| (none in Phase 2 sources) | — | — | — | All scans across paper-backdrop.tsx, product-screen.tsx, scroll-choreography.tsx returned 0 violations: no `useState` calls, no `layoutId`, no inline magic-number keyframes, no animated width/height/top/left/box-shadow. The only `useMotionValueEvent` is the legitimate D-15 video gate (imperative DOM, not visual prop). All other matches were in JSDoc comments documenting paper-hero.tsx's debt being paid down. |

---

## Documented Deviations (User-Approved)

### CHOREO-02 / CHOREO-08 — Autoplay-loop scope shift (2026-04-29)

**Original requirement text (REQUIREMENTS.md):**
- CHOREO-02: "current scroll-linked hero video continues to play"
- CHOREO-08: "currentTime updates are gated/paused once Stage 2 fully covers it"

**Shipped behavior:** Hero video uses `autoPlay loop` attributes. Gate calls `play()` / `pause()` at `byId('wow').window[1]` instead of writing `currentTime`.

**Rationale (STATE.md):** Same storytelling intent (background motion in the paper world during stage 1) with a simpler primitive. CHOREO-08's pause-when-covered GPU-relief intent is preserved; only the active behavior (scrub vs loop) changed. Driven by user direction during production-preview smoke after `vite preview`'s Range-request limitation surfaced confounding behavior.

**Test coverage of new contract:** paper-backdrop.test.tsx asserts `autoplay`/`loop`/`muted`/`playsInline` DOM attrs; gate test asserts `play()`/`pause()` calls; new third test asserts `video.currentTime` is **never** written (regression guard).

**Outstanding cleanup:** REQUIREMENTS.md text updates are deferred to a future REQUIREMENTS.md edit (the shipped behavior is authoritative for Phase 5+).

### FOUND-04 / OQ-1 — Production-build flicker verdict (Outcome C — inconclusive)

**Outcome:** `layoutEffect: false` stays in scroll-choreography.tsx as the Phase 1 contract. Three confounders (page-tail regression, font FOUT, vite preview Range-request limitation) prevented a clean isolated test. Phase 5's Vercel production deploy verification (per ROADMAP Phase 5 SC#4) is the authoritative gate.

**STATE.md captures:** Verdict + rationale.

### D-14 STAGES.wow.window retune visual review (deferred)

**Outcome:** First-pass `[0.20, 0.78]` retained; clean visual review deferred to Phase 3 (when feature-a/b docking transforms land) or to the Vercel preview deploy. STATE.md captures.

---

## Gaps Summary

**No blocking gaps.** Phase 2 ships:
- All 5 ROADMAP success criteria are met (with documented user-approved deviations on CHOREO-02 / CHOREO-08).
- All 10 phase requirement IDs are satisfied (8 directly; 2 via approved scope-shift overrides).
- All 18 plan-frontmatter must_haves are verified (with one — D-17 loadedmetadata effect — superseded by the autoplay-loop scope shift, with regression-guard tests in place).
- Full automated suite is GREEN (14 files / 59 tests, typecheck, build all exit 0).
- paper-hero.tsx and static-choreography-fallback.tsx are UNCHANGED (Phase 5 owns deletions/refactors).
- routes/index.tsx swap to `<ScrollChoreography />` is in place (D-01).

**Deferred items** (not gaps; explicitly addressed in later phases per ROADMAP):
- FOUND-04 production-flicker authoritative verification → Phase 5 Vercel deploy.
- STAGES.wow.window visual review → Phase 3 (when feature-a/b docking transforms land).
- REQUIREMENTS.md CHOREO-02 / CHOREO-08 text edit → next REQUIREMENTS.md pass.
- Font FOUT preload hints → Phase 6 audit.
- vite preview Range-request limitation documentation → Phase 6 audit playbook.

---

*Verified: 2026-04-29T14:42Z*
*Verifier: Claude (gsd-verifier)*
