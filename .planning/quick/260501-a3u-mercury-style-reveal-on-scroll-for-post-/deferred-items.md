# Deferred Items — 260501-a3u

## Lint not run

`pnpm lint` was deferred because the project's `eslint.config.js` references `@tanstack/eslint-config` but the eslint binary is not installed in `node_modules`. Pre-existing — not introduced by this quick task. Test suite + `pnpm tsc --noEmit` + `pnpm build` all pass and exercise the same code paths.

To resolve: `pnpm add -D eslint @tanstack/eslint-config` (or align with the project's existing tooling once a maintainer decides on a lint runner).

## Lighthouse before/after

The user-approved plan listed Lighthouse as a supporting check. Skipped this run because the dev-server build pulls in HMR / devtools / the `<DevFlowPanel>` which would skew LCP and TBT. Should be measured against a Vercel preview build of the merge commit (`3f21945`) before considering the cohort regression-checked. LCP candidate is the product-screen AVIF preload — unchanged by this task; reveal targets are below the fold.

## Mercury patterns NOT shipped (deliberately deferred)

The user-approved plan considered four Mercury patterns and shipped one. The other three remain available for future work:

1. **Frame-scrubbed hero video** — replace the existing binary `play()`/`pause()` toggle in `paper-backdrop.tsx` with scroll-position-linked `video.currentTime` scrubbing.
2. **Per-feature pinned chapters** — second pinned scroll section after the existing 400lvh choreography, with feature mockups pinning while text rotates.
3. **Smooth-scroll layer (Lenis-style)** — global scroll smoothing. Flagged as high-risk in the user-approved plan due to potential conflict with the existing `useScroll` math.
