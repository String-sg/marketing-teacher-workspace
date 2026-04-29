---
phase: 02-orchestrator-shell-backdrop-migration
plan: 01
subsystem: testing-infrastructure
tags:
  - phase-2
  - wave-0
  - testing
  - vitest
  - choreography
  - ast
dependency-graph:
  requires:
    - "Phase 1 vitest + jsdom + matchMedia shim (vitest.config.ts, vitest.setup.ts)"
    - "Phase 1 scroll-choreography/ stubs (scroll-choreography.tsx return-null, context.tsx, stages.ts, types.ts)"
    - "Phase 1 SiteHeader, SiteFooter, SkipLink (landmark fixture composition)"
  provides:
    - "Falsifiable Wave-0 test contract for Phase 2 Waves 1-3"
    - "AST-walking gate for MIGRATE-03 keyframe binding"
    - "AST-walking gate for PERF-04 forbidden CSS properties"
    - "Mode-switch matrix gate for D-02 / D-21 / CHOREO-06"
    - "Mount-counter gate for CHOREO-01 (ProductScreen never unmounts)"
    - "<=2 re-renders / 100 motion-value updates gate for CHOREO-06 SC#2"
    - "Header-not-a-descendant-of-transformed-ancestor gate for MIGRATE-04"
    - "loadedmetadata effect lifecycle gate for D-17"
    - "Video gate threshold cross gate for CHOREO-08 / D-15 / D-16"
  affects:
    - "Plan 02-02 (PaperBackdrop): paper-backdrop.test.tsx must turn GREEN"
    - "Plan 02-03 (ProductScreen): product-screen.test.tsx must turn GREEN"
    - "Plan 02-04 (ScrollChoreography orchestrator + STAGES retune): scroll-choreography.test.tsx, header-stacking.test.tsx, choreography-rerender-budget.test.tsx, migrate-03-keyframe-binding.test.ts, migrate-perf-04.test.ts, stages.test.ts D-14 assertion all turn GREEN"
    - "Plan 02-05 (route swap + manual smoke): the 8-file Wave-0 contract is the sign-off precondition"
tech-stack:
  added:
    - "@typescript-eslint/parser ^8.0.0 (devDependency, resolved 8.59.0)"
  patterns:
    - "vi.mock(\"motion/react\") partial-mock for ESM-frozen useReducedMotion / useScroll exports"
    - "renderWithMockProgress() helper: motionValue(p) + ScrollChoreographyContext.Provider"
    - "AST walk over @typescript-eslint/parser ESTree-superset output (CallExpression args, JSXAttribute style)"
    - "expect.fail() RED-state gate when source files don't exist yet"
key-files:
  created:
    - "src/components/landing/scroll-choreography/scroll-choreography.test.tsx"
    - "src/components/landing/scroll-choreography/paper-backdrop.test.tsx"
    - "src/components/landing/scroll-choreography/product-screen.test.tsx"
    - "src/components/landing/scroll-choreography/header-stacking.test.tsx"
    - "src/components/landing/scroll-choreography/choreography-rerender-budget.test.tsx"
    - "src/components/landing/scroll-choreography/migrate-03-keyframe-binding.test.ts"
    - "src/components/landing/scroll-choreography/migrate-perf-04.test.ts"
  modified:
    - "package.json (added @typescript-eslint/parser devDependency)"
    - "pnpm-lock.yaml (parser dependency tree)"
    - "src/components/landing/scroll-choreography/stages.test.ts (one new D-14 assertion appended)"
decisions:
  - "Used vi.mock() partial-mock for motion/react instead of vi.spyOn() — RESEARCH PATTERNS § 'No Analog Found' note flagged motion/react ESM exports as frozen/non-configurable; vi.spyOn fails with 'Cannot redefine property'. Partial mock is the documented workaround (see file-header docstrings)."
  - "Strengthened header-stacking.test.tsx with a 4th test asserting <main> children.length >= 1, and choreography-rerender-budget.test.tsx with a pre-loop assertion on .scroll-choreography-only — without these, both tests would silently PASS against the Phase 1 return-null stub (false-positive). Plan-stated contract: 'pnpm test --run exits non-zero (suite is RED) and the failing tests include each of the 5 new files'."
  - "AST walks accept any MemberExpression in keyframe positions (STAGES[i].window[j] OR byId('...').window[j]). The stricter form would require dataflow analysis; PATTERNS § migrate-03 explicitly allows 'first-pass regex' or AST walk and recommends regex unless false positives appear. We chose AST for accuracy."
metrics:
  duration_seconds: 480
  duration_human: "~8 minutes"
  completed_date: "2026-04-29T03:38:57Z"
  tasks_completed: 3
  files_created: 7
  files_modified: 3
  commits: 3
---

# Phase 2 Plan 01: Wave-0 Test Infrastructure Summary

Wave-0 test contract for Phase 2 — 7 new fail-loudly test stubs plus 1 updated `stages.test.ts` (D-14 retune assertion), plus the single new devDependency `@typescript-eslint/parser` that the two AST tests require. The full suite is intentionally RED in 8 places; Waves 1-3 turn each one GREEN by landing source files (Plan 02 / Plan 03 / Plan 04) and retuning STAGES (Plan 04).

## What Was Built

### Task 1 — `@typescript-eslint/parser` devDependency (commit `0f82b1f`)

Installed `@typescript-eslint/parser@^8.0.0` (resolved to 8.59.0 in the lockfile) as a devDependency. The parser is the AST front-end used by `migrate-03-keyframe-binding.test.ts` and `migrate-perf-04.test.ts`. No other config touched (eslint.config.js, tsconfig.json, vitest.config.ts all unchanged). `pnpm exec node -e "require('@typescript-eslint/parser').parse"` confirms the parser is importable as a function.

### Task 2 — 5 unit/integration test stubs (commit `2729de2`)

| File | Tests | Covers | RED Reason |
|------|-------|--------|------------|
| `scroll-choreography.test.tsx` | 6 | D-02 / D-20 / D-21 / CHOREO-07 — mode-switch 4-case matrix, `useScroll layoutEffect:false` call signature (FOUND-04 / OQ-1), `.scroll-choreography-only` outer + `h-svh` inner shape | Source body is Phase 1 `return null` stub — assertions fail with "expected null not to be null" and "Unable to find an accessible element with the role 'heading'" |
| `paper-backdrop.test.tsx` | 5 | MIGRATE-01 / CHOREO-02 / D-15 / D-16 / D-17 / CHOREO-08 — render shape (video, poster, 2 clouds), video gate threshold cross at `byId("wow").window[1]`, loadedmetadata effect lifecycle, motion-value style smoke | Imports `./paper-backdrop` which doesn't exist — fails at import time with "Failed to resolve import './paper-backdrop'" |
| `product-screen.test.tsx` | 4 | CHOREO-01 / D-09 / D-10 / D-21 / MIGRATE-02 — mount-counter (same DOM node across 5 simulated scrollYProgress updates), motion-value-driven opacity & scale, Phase-2 hero->wow scope, no `layoutId` | Imports `./product-screen` which doesn't exist — fails at import time |
| `header-stacking.test.tsx` | 4 | MIGRATE-04 / D-19 / D-16 — header NOT a descendant of any inline `style.transform` ancestor, header NOT inside `<main>`, landmark count preserved post-swap, choreography subtree non-empty | The 4th test (subtree non-empty) fails because `<ScrollChoreography/>` returns `null` — the other 3 pass against an empty subtree |
| `choreography-rerender-budget.test.tsx` | 1 | CHOREO-06 / SC#2 / MIGRATE-02 — `<=2` re-renders / 100 `scrollYProgress` updates, with a pre-loop assertion on `.scroll-choreography-only` | Pre-loop assertion fails because the orchestrator body is `return null` (no `.scroll-choreography-only` section) |

Mocking strategy: every test that touches `useReducedMotion` or `useScroll` uses `vi.mock("motion/react", async () => { const actual = await vi.importActual(...); return { ...actual, useReducedMotion: ..., useScroll: ... } })` because `vi.spyOn` fails on motion/react's frozen ESM namespace exports.

### Task 3 — 2 AST static-analysis test stubs + `stages.test.ts` D-14 assertion (commit `7775b79`)

| File | Tests | Covers | RED Reason |
|------|-------|--------|------------|
| `migrate-03-keyframe-binding.test.ts` | 3 (it.each over 3 source files) | MIGRATE-03 / D-12 / D-13 — every `useTransform(...)` keyframe entry is `Literal 0`, `Literal 1`, `Identifier` (named local const), or `MemberExpression` (STAGES[i].window[j] / byId(...).window[j]) | `paper-backdrop.tsx` and `product-screen.tsx` don't exist — `expect.fail("Wave-0 RED contract: <file> does not exist yet. Wave 1 must create it.")` for both. `scroll-choreography.tsx` exists but has no useTransform calls (return-null body) so it passes vacuously. |
| `migrate-perf-04.test.ts` | 3 (it.each over 3 source files) | PERF-04 — no JSX `style` attribute Property keyed on `width`/`height`/`top`/`left`/`box-shadow`/`boxShadow` with non-Literal value | Same expect.fail() pattern for the 2 missing source files; scroll-choreography.tsx vacuously passes. |
| `stages.test.ts` (updated) | +1 (6 total) | D-14 retune — `byId("wow").window[1]` ≈ 0.78 | `wow.window[1]` is still `0.55` per Phase 1 STAGES; assertion fails with "expected 0.55 to be close to 0.78". The 5 prior assertions still pass. |

## RED-State Evidence

`pnpm test --run` exit code: **1** (suite is RED, as Wave-0 contracts).

Final vitest output excerpt — failing files named explicitly:

```
Test Files  8 failed | 6 passed (14)
Tests       13 failed | 36 passed (49)

❯ src/components/landing/scroll-choreography/stages.test.ts (6 tests | 1 failed) 12ms
   × STAGES data > byId('wow').window[1] is retuned to the Phase 2 first-pass value (D-14)
     → expected 0.55 to be close to 0.78
❯ src/components/landing/scroll-choreography/scroll-choreography.test.tsx (6 tests | 6 failed)
   × ScrollChoreography mode switch (D-02 / D-21) > desktop=true reduced=false -> 'choreography' branch
     → expected null not to be null  [.scroll-choreography-only section missing]
   × ScrollChoreography mode switch ... -> 'static' branch  [3 cases]
     → Unable to find an accessible element with the role "heading"
   × ScrollChoreography useScroll signature (FOUND-04 / OQ-1)
     → expected false to be true  [layoutEffect:false call never made]
   × ScrollChoreography container shape (CHOREO-07 / D-18)
     → expected null not to be null  [.scroll-choreography-only section missing]
❯ src/components/landing/scroll-choreography/choreography-rerender-budget.test.tsx (1 test | 1 failed)
   × ScrollChoreography rerender budget (CHOREO-06 / SC#2 / MIGRATE-02)
     → expected null not to be null  [.scroll-choreography-only section missing]
❯ src/components/landing/scroll-choreography/header-stacking.test.tsx (4 tests | 1 failed)
   × Header stacking (MIGRATE-04 / D-19) > ScrollChoreography renders a non-empty subtree inside <main>
     → expected 0 to be greater than or equal to 1
❯ src/components/landing/scroll-choreography/migrate-03-keyframe-binding.test.ts (3 tests | 2 failed)
   × MIGRATE-03 ... > paper-backdrop.tsx — every useTransform keyframe entry ...
     → Wave-0 RED contract: paper-backdrop.tsx does not exist yet. Wave 1 must create it.
   × MIGRATE-03 ... > product-screen.tsx — every useTransform keyframe entry ...
     → Wave-0 RED contract: product-screen.tsx does not exist yet. Wave 1 must create it.
❯ src/components/landing/scroll-choreography/migrate-perf-04.test.ts (3 tests | 2 failed)
   × PERF-04 ... > paper-backdrop.tsx — does not animate forbidden CSS properties
     → Wave-0 RED contract: paper-backdrop.tsx does not exist yet. Wave 1 must create it.
   × PERF-04 ... > product-screen.tsx — does not animate forbidden CSS properties
     → Wave-0 RED contract: product-screen.tsx does not exist yet. Wave 1 must create it.

FAIL src/components/landing/scroll-choreography/paper-backdrop.test.tsx
   Error: Failed to resolve import "./paper-backdrop" from
   "src/components/landing/scroll-choreography/paper-backdrop.test.tsx".
   Does the file exist?
FAIL src/components/landing/scroll-choreography/product-screen.test.tsx
   Error: Failed to resolve import "./product-screen" from
   "src/components/landing/scroll-choreography/product-screen.test.tsx".
   Does the file exist?
```

All 8 Wave-0 contract files (7 new + 1 updated) appear in the failing-files list. Phase 1's existing test files remain green individually (`use-is-desktop`, `types`, `static-choreography-fallback`, `landmark-audit`, `skip-link`, `footer`, plus 5/6 of `stages` — only the new D-14 assertion fails).

## Requirement Coverage Map

Every Phase 2 phase-requirement ID covered by at least one Wave-0 fail-loudly stub:

| Requirement ID | Test File(s) | Assertion Locus |
|----------------|--------------|------------------|
| **CHOREO-01** | `product-screen.test.tsx` (mount-counter), `product-screen.test.tsx` (no layoutId) | "the morphing element instance is the same node across 5 scroll updates", "contains no layoutId attribute" |
| **CHOREO-02** | `paper-backdrop.test.tsx` (render shape) | "renders the scroll-linked video element with the locked src and poster" + "renders both cloud images" |
| **CHOREO-06** | `choreography-rerender-budget.test.tsx`, `scroll-choreography.test.tsx` (mode-switch matrix), `paper-backdrop.test.tsx` (motion-value shape) | "<= 2 re-renders / 100 scrollYProgress updates", mode-switch matrix |
| **CHOREO-07** | `scroll-choreography.test.tsx` (container shape) | ".scroll-choreography-only outer + h-[280lvh] outer + h-svh inner" |
| **CHOREO-08** | `paper-backdrop.test.tsx` (video gate) | "pauses video when scrollYProgress crosses byId('wow').window[1]" + below-threshold currentTime write |
| **MIGRATE-01** | `paper-backdrop.test.tsx` (render shape) | video + poster + 2 clouds rendered |
| **MIGRATE-02** | `choreography-rerender-budget.test.tsx`, `paper-backdrop.test.tsx`, `product-screen.test.tsx` | rerender budget gate + motion-value style assertions |
| **MIGRATE-03** | `migrate-03-keyframe-binding.test.ts` (AST walk) | "every useTransform keyframe entry is a STAGES ref, named const, or 0/1" |
| **MIGRATE-04** | `header-stacking.test.tsx` | "SiteHeader is NOT a descendant of any element with inline style.transform" |
| **PERF-04** | `migrate-perf-04.test.ts` (AST walk) | "does not animate forbidden CSS properties via motion values" |

(Bonus IDs not in plan frontmatter but covered: D-09, D-10, D-12, D-13, D-14, D-15, D-16, D-17, D-18, D-19, D-20, D-21, FOUND-04, OQ-1.)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Worktree was at stale base `008ed67`; reset to expected `f6407d3`**

- **Found during:** Initial worktree-branch-check
- **Issue:** Worktree HEAD was `008ed67` (Phase 1 missing) but plan execution requires base `f6407d3` (Phase 2 plans drafted).
- **Fix:** `git reset --hard f6407d3f8068d95f4c1aaa9c518a98f4d351459a`. Verified `HEAD == EXPECTED` post-reset and that Phase 1's `scroll-choreography/` directory is now present.
- **Files modified:** worktree state only (no commit)

**2. [Rule 3 - Blocking] `vi.spyOn(motion, "useReducedMotion")` fails with "Cannot redefine property"**

- **Found during:** Task 2 first test run
- **Issue:** motion/react's ESM namespace exports are frozen/non-configurable, so `vi.spyOn(motion, "useReducedMotion")` throws `TypeError: Cannot spy on export "useReducedMotion". Module namespace is not configurable in ESM.` This blocks the entire `scroll-choreography.test.tsx` file from running — tests never reach their assertions, producing the WRONG kind of RED.
- **Fix:** Replaced spy pattern with `vi.mock("motion/react", async () => { const actual = await vi.importActual(...); return { ...actual, useReducedMotion: () => useReducedMotionMock(), useScroll: (...args) => { useScrollMock(...args); return actual.useScroll(...args) } } })`. The module-level `vi.fn()` instances let each test set per-call return values via `mockReturnValue()`. Documented in file-header docstrings citing PATTERNS § "No Analog Found" line 858-860 which explicitly recommends this fallback.
- **Files modified:** `scroll-choreography.test.tsx`, `choreography-rerender-budget.test.tsx`
- **Commit:** `2729de2`

**3. [Rule 3 - Blocking] header-stacking.test.tsx and choreography-rerender-budget.test.tsx silently passed against the Phase 1 return-null stub**

- **Found during:** Task 2 second test run (after the vi.mock fix)
- **Issue:** With `<ScrollChoreography/>` returning `null`, the header-stacking parent-walk and rerender-budget assertions are vacuously true (empty subtree, single render). The plan's acceptance criteria explicitly state: "pnpm test --run exits non-zero (suite is RED) and the failing tests include each of the 5 new files". Without strengthening, these two files would PASS in Wave 0 — violating the contract.
- **Fix:** Added one new assertion to each:
  - `header-stacking.test.tsx`: appended a 4th test asserting `<main>.children.length >= 1` (Wave 2 fills the orchestrator body, turning this GREEN).
  - `choreography-rerender-budget.test.tsx`: prepended a pre-loop assertion that `container.querySelector("section.scroll-choreography-only")` is non-null.
- **Rationale:** This is exactly the contract the plan describes — falsifiable Wave-0 gates that turn GREEN once Wave 2 fills `scroll-choreography.tsx`.
- **Files modified:** `header-stacking.test.tsx`, `choreography-rerender-budget.test.tsx`
- **Commit:** `2729de2`

### Auto-added Critical Functionality

None — every test the plan specified was created with real assertions (no `it.skip` / `it.todo`).

### Authentication Gates

None.

## Files Touched

**Created (7):**
- `src/components/landing/scroll-choreography/scroll-choreography.test.tsx`
- `src/components/landing/scroll-choreography/paper-backdrop.test.tsx`
- `src/components/landing/scroll-choreography/product-screen.test.tsx`
- `src/components/landing/scroll-choreography/header-stacking.test.tsx`
- `src/components/landing/scroll-choreography/choreography-rerender-budget.test.tsx`
- `src/components/landing/scroll-choreography/migrate-03-keyframe-binding.test.ts`
- `src/components/landing/scroll-choreography/migrate-perf-04.test.ts`

**Modified (3):**
- `package.json` (single line: added `"@typescript-eslint/parser": "^8.0.0"` to `devDependencies`)
- `pnpm-lock.yaml` (parser dependency tree; 8 references to `typescript-eslint/parser`)
- `src/components/landing/scroll-choreography/stages.test.ts` (one assertion appended at end of `describe("STAGES data")` block)

## Commits

| Order | Hash | Type | Subject |
|-------|------|------|---------|
| 1 | `0f82b1f` | chore | add `@typescript-eslint/parser` devDependency for AST tests |
| 2 | `2729de2` | test | add 5 Wave-0 fail-loudly stubs for orchestrator + backdrop + product-screen |
| 3 | `7775b79` | test | add 2 AST static-analysis stubs + retuned `wow.window` assertion |

All commits made with `--no-verify` per parallel-executor protocol (orchestrator validates hooks once after wave completes).

## Self-Check: PASSED

**Created files exist (7/7):**
- FOUND: `src/components/landing/scroll-choreography/scroll-choreography.test.tsx`
- FOUND: `src/components/landing/scroll-choreography/paper-backdrop.test.tsx`
- FOUND: `src/components/landing/scroll-choreography/product-screen.test.tsx`
- FOUND: `src/components/landing/scroll-choreography/header-stacking.test.tsx`
- FOUND: `src/components/landing/scroll-choreography/choreography-rerender-budget.test.tsx`
- FOUND: `src/components/landing/scroll-choreography/migrate-03-keyframe-binding.test.ts`
- FOUND: `src/components/landing/scroll-choreography/migrate-perf-04.test.ts`

**Modified files reflect changes:**
- `package.json` — `@typescript-eslint/parser` line present
- `pnpm-lock.yaml` — 8 references to `typescript-eslint/parser`
- `stages.test.ts` — D-14 assertion (`toBeCloseTo(0.78, 2)`) present

**Commits exist (3/3):**
- FOUND: `0f82b1f` (chore: parser devDependency)
- FOUND: `2729de2` (test: 5 stubs)
- FOUND: `7775b79` (test: 2 AST stubs + stages D-14)

**No-stub policy:** zero `it.skip` / `it.todo` across all 11 test files in `scroll-choreography/`.

**Phase 1 regression guard:** all 7 Phase 1 test files still green individually (only 1/6 stages.test.ts assertions fails — the new D-14 assertion, by design).
