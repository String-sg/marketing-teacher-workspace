---
phase: 1
slug: foundation-types-static-fallback-ssr-contract
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-28
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> Source of truth: `.planning/phases/01-foundation-types-static-fallback-ssr-contract/01-RESEARCH.md` § Validation Architecture.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 3.2.4 + @testing-library/react 16.3.2 (already installed; **no `vitest.config.ts` yet — Wave 0 installs**) |
| **Config file** | `vitest.config.ts` (Wave 0 creates) |
| **Quick run command** | `pnpm typecheck` (≈ 3–5 s) |
| **Full suite command** | `pnpm typecheck && pnpm test --run && pnpm build` |
| **Estimated runtime** | ~30–60 s (build dominates) |

---

## Sampling Rate

- **After every task commit:** `pnpm typecheck`
- **After every plan wave:** `pnpm typecheck && pnpm test --run`
- **Before `/gsd-verify-work`:** full suite must be green
- **Max feedback latency:** ≤ 60 s

---

## Per-Task Verification Map

> Filled in after `/gsd-plan-phase` writes `*-PLAN.md` files. Mapping is requirement → automated check, derived from RESEARCH.md § Validation Architecture.

| Requirement | Test Type | Automated Command | Wave | Status |
|-------------|-----------|-------------------|------|--------|
| FOUND-01 (StageId/StageDef/StageWindow/ScreenTarget exist) | TS compile | `pnpm typecheck` | 1 | ⬜ pending |
| FOUND-02 (StageDef.window is `[start, end]` tuple) | unit (vitest) | `pnpm test scroll-choreography/types.test.ts --run` | 1 | ⬜ pending |
| FOUND-03 (4 stages, ordered hero→wow→feature-a→feature-b) | unit | `pnpm test scroll-choreography/stages.test.ts --run` | 1 | ⬜ pending |
| FOUND-04 (`useScroll({ layoutEffect: false })` smoke) | manual + grep | `grep -n "layoutEffect: false" src/components/landing/scroll-choreography/scroll-choreography.tsx` | 2 | ⬜ pending |
| FOUND-05 (landing.ts new exports) | TS compile + grep | `pnpm typecheck` + `grep -E "export const (TEACHER_WORKSPACE_APP_URL\|stages\|proofCopy\|finalCtaCopy\|footerCopy\|navItems)" src/content/landing.ts` | 1 | ⬜ pending |
| FOUND-06 (legacy exports deleted) | grep | `! grep -E "export const (heroCopy\|productCopy\|modules\|proofPoints)" src/content/landing.ts` | 1 | ⬜ pending |
| STATIC-01 (no JS = full content) | manual DevTools | "Disable JavaScript", load `/`, verify all 4 stages reachable | 3 | ⬜ pending |
| STATIC-02 (prefers-reduced-motion = full content) | manual DevTools | Set `prefers-reduced-motion: reduce`, verify all 4 stages reachable | 3 | ⬜ pending |
| STATIC-03 (mobile <1024px renders fallback) | manual viewport | DevTools 768px viewport, verify no `useScroll` observer (Phase 2 adds; Phase 1 placeholder) | 3 | ⬜ pending |
| STATIC-04 (every word/image of choreography path on static path) | unit + manual | `pnpm test landing/static-choreography-fallback.test.tsx --run` | 2 | ⬜ pending |
| CONTENT-07 (footer landmark renders) | unit | `pnpm test landing/footer.test.tsx --run` | 3 | ⬜ pending |
| A11Y-01 (no hydration warnings) | manual + console grep | Build + serve via `vite preview`, hard-refresh `/`, DevTools console must be empty | 3 | ⬜ pending |
| A11Y-03 (one `<h1>`, consistent `<h2>`/`<h3>`) | unit + axe | `pnpm test landing/landmark-audit.test.tsx --run` | 3 | ⬜ pending |
| A11Y-04 (skip-link first focusable) | unit | `pnpm test landing/skip-link.test.tsx --run` | 3 | ⬜ pending |
| A11Y-07 (focus rings on every interactive element) | manual keyboard | Tab through page, verify focus ring visible at every stop | 3 | ⬜ pending |

---

## Wave 0 Requirements

- [ ] `vitest.config.ts` — root config: jsdom env, `setupFiles: ['./vitest.setup.ts']`, paths from tsconfig
- [ ] `vitest.setup.ts` — `@testing-library/jest-dom` import + cleanup
- [ ] `package.json` script: `"test": "vitest"`, `"typecheck": "tsc --noEmit"`
- [ ] `tsconfig.json` — confirm `vitest/globals` types resolved (or per-file imports)
- [ ] Test files (stubs at minimum, fail-loudly on missing exports):
  - `src/components/landing/scroll-choreography/types.test.ts`
  - `src/components/landing/scroll-choreography/stages.test.ts`
  - `src/components/landing/scroll-choreography/use-is-desktop.test.ts`
  - `src/components/landing/scroll-choreography/static-choreography-fallback.test.tsx`
  - `src/components/landing/footer.test.tsx`
  - `src/components/landing/skip-link.test.tsx`
  - `src/components/landing/landmark-audit.test.tsx`

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Hydration parity (no console warnings) | A11Y-01 | Vitest + jsdom can't catch real React 19 hydration mismatch in production build | `pnpm build && pnpm preview`, open `/` in Chrome, Cmd+Shift+R, DevTools Console must be empty |
| JS-disabled fallback | STATIC-01 | Vitest renders with React; can't simulate JS-off | DevTools → ⋮ → More tools → Settings → Debugger → "Disable JavaScript", reload `/` |
| `prefers-reduced-motion` fallback | STATIC-02 | jsdom doesn't fire matchMedia change events deterministically across React 19 + motion | DevTools Rendering → "Emulate CSS media feature `prefers-reduced-motion: reduce`", reload `/` |
| Mobile viewport gates choreography | STATIC-03 | Phase 1 ships choreography subtree as inert stub; full check is Phase 2 | DevTools responsive 768×1024, confirm `<StaticChoreographyFallback>` renders, no `useScroll` observers (`window.__motion_value_observers__` undefined or 0) |
| Keyboard tab order + focus rings | A11Y-04, A11Y-07 | Real focus visibility is browser-rendered, not measurable in jsdom | Tab from address bar through `/`, verify (1) skip-link is first stop and visible, (2) every link/button shows focus ring, (3) reading order is hero → features → proof → final-cta → footer |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references (vitest config + 7 test stubs)
- [ ] No watch-mode flags (`--run` always passed)
- [ ] Feedback latency < 60 s
- [ ] `nyquist_compliant: true` set in frontmatter once planner ratifies the per-task map

**Approval:** pending
