# Phase 3 — Deferred Items

Items observed during plan execution that fall outside the executing plan's scope. Logged for the next-wave executor / verifier.

## Out-of-scope failures observed during Plan 03-02 execution

### `src/routes/index.head.test.tsx` (5 failing tests)

- **Status:** RED (expected) — pre-existing Wave-0 falsification scaffold landed by Plan 03-01.
- **Why it's red:** `src/routes/index.tsx` has no `head()` callback yet. The test is a contract gate that Plan 03-04 (Wave 1c) will turn GREEN by adding the `<link rel="preload">` for the AVIF variant set in the route's `head()` config.
- **Out of scope for Plan 03-02:** Plan 03-02 only modifies `product-screen.tsx` + `product-screen.test.tsx`. The route head() config is owned by Plan 03-04.
- **Action:** None — Plan 03-04's executor is responsible for landing the head() body that satisfies these assertions.

Reference: `src/routes/index.head.test.tsx:1-25` (file header explicitly documents the Wave-0 RED state and the Plan 04 fix).
