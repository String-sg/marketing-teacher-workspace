# Phase 3 — Deferred Items

Items observed during plan execution that fall outside the executing plan's scope. Logged for the next-wave executor / verifier.

## Out-of-scope failures observed during Plan 03-02 execution

### `src/routes/index.head.test.tsx` (5 failing tests)

- **Status:** RED (expected) — pre-existing Wave-0 falsification scaffold landed by Plan 03-01.
- **Why it's red:** `src/routes/index.tsx` has no `head()` callback yet. The test is a contract gate that Plan 03-04 (Wave 1c) will turn GREEN by adding the `<link rel="preload">` for the AVIF variant set in the route's `head()` config.
- **Out of scope for Plan 03-02:** Plan 03-02 only modifies `product-screen.tsx` + `product-screen.test.tsx`. The route head() config is owned by Plan 03-04.
- **Action:** None — Plan 03-04's executor is responsible for landing the head() body that satisfies these assertions.

Reference: `src/routes/index.head.test.tsx:1-25` (file header explicitly documents the Wave-0 RED state and the Plan 04 fix).

### Pre-existing lint errors (29 total) in other choreography files

- **Status:** Pre-existing — observed during Plan 03-02 verification but caused by no Plan 03-02 edit.
- **Affected files:** `feature-section.tsx`, `paper-hero.tsx`, `migrate-03-keyframe-binding.test.ts`, `migrate-perf-04.test.ts`, `paper-backdrop.tsx`, `paper-backdrop.test.tsx`, `header-stacking.test.tsx`, `scroll-choreography.tsx`, `scroll-choreography.test.tsx`, `choreography-rerender-budget.test.tsx`, `stages.ts`, `types.test.ts`.
- **Categories:** import-order, sort-imports, array-type (`T[]` vs `Array<T>` / `ReadonlyArray<T>`), no-unnecessary-condition, no-unnecessary-type-assertion, consistent-type-imports, import/first.
- **Verification:** `pnpm lint src/components/landing/scroll-choreography/product-screen.tsx src/components/landing/scroll-choreography/product-screen.test.tsx` exits 0 — Plan 03-02's two modified files are clean.
- **Out of scope for Plan 03-02:** SCOPE BOUNDARY rule — Plan 03-02 only modifies `product-screen.tsx` + `product-screen.test.tsx`. Pre-existing lint debt in other files is owned by whichever earlier plan introduced it.
- **Action:** None — these errors do not block Plan 03-02 verification. A future polish plan (or Phase 6) may auto-fix them with `pnpm lint --fix`.
