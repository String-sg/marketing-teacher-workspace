---
phase: 01-foundation-types-static-fallback-ssr-contract
plan: 03
subsystem: content
tags: [typescript, content, data-model, landing-ts, types]

# Dependency graph
requires:
  - phase: 01-02
    provides: "StageCopyContent discriminated union type at scroll-choreography/types.ts"
provides:
  - "TEACHER_WORKSPACE_APP_URL constant (single source of truth for live app URL)"
  - "navItems: readonly NavItem[] (with NavItem type exported)"
  - "stages: readonly StageCopyContent[] (4 entries in hero/wow/feature-a/feature-b order)"
  - "proofCopy: { heading, subheading, points } (subheading is D-18 extension)"
  - "finalCtaCopy: { kicker, headline, body, cta, emailPlaceholder } (kicker is D-18 extension)"
  - "footerCopy: { copyright, supportEmail, trustLine } (D-05 minimal footer)"
affects: [01-04, 01-05, phase-02, phase-03, phase-04]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Discriminated union via StageCopyContent — exact-3-bullets tuple enforced at compile time (D-07)"
    - "as const on all exports for literal type flow-through"
    - "import type discipline — StageCopyContent imported with import type keyword"
    - "NavItem type exported alongside navItems data (type + data colocation)"

key-files:
  created: []
  modified:
    - src/content/landing.ts

key-decisions:
  - "TEACHER_WORKSPACE_APP_URL = 'https://teacherworkspace-alpha.vercel.app/students' — single source of truth, consumers must read this constant not hardcode the URL (FOUND-06)"
  - "proofCopy.subheading added beyond D-08 shape — absorbs the proof-strip h2 subhead currently hardcoded in JSX (D-18, user-confirmed 2026-04-28)"
  - "finalCtaCopy.kicker added beyond D-08 shape — absorbs the 'Free for individual teachers' kicker currently hardcoded in final-cta.tsx:32 (D-18, user-confirmed 2026-04-28)"
  - "footerCopy.supportEmail = 'support@teacherworkspace.app' per D-19 [CONFIRM — user can override before Plan 05 ships footer component]"
  - "feature-b copy is planner's first-pass recommendation — Phase 4 (CONTENT-04) owns the final copy rewrite"

# Metrics
duration: 10min
completed: 2026-04-28
---

# Phase 01 Plan 03: Content Reshape — landing.ts Summary

**src/content/landing.ts fully rewritten: 6 typed exports replace 4 legacy exports, StageCopyContent discriminated union enforced, TEACHER_WORKSPACE_APP_URL as single source of truth**

## Performance

- **Duration:** ~10 min
- **Completed:** 2026-04-28
- **Tasks:** 2 (Task 1: context-only, Task 2: landing.ts rewrite)
- **Files modified:** 1 (src/content/landing.ts)

## Accomplishments

- Deleted `heroCopy`, `productCopy`, `modules`, `proofPoints` (D-06 — no two-source-of-truth window)
- Added 6 new typed exports: `TEACHER_WORKSPACE_APP_URL`, `NavItem` type + `navItems`, `stages`, `proofCopy`, `finalCtaCopy`, `footerCopy`
- `stages` typed as `readonly StageCopyContent[]` — discriminated union from Plan 02 enforces exact-3-bullets at compile time
- All exports use `as const` for literal type flow-through
- Zero semicolons (CLAUDE.md code style compliance)
- Plan 02 tests (types.test.ts + stages.test.ts, 13 total) still pass

## The 6 Exports Written

| Export | Shape | Notes |
|--------|-------|-------|
| `TEACHER_WORKSPACE_APP_URL` | `string` literal | `"https://teacherworkspace-alpha.vercel.app/students"` |
| `NavItem` | `{ readonly label; readonly href }` | Type export |
| `navItems` | `readonly NavItem[]` (2 items) | Features + Testimonials nav links |
| `stages` | `readonly StageCopyContent[]` (4 items) | hero/wow/feature-a/feature-b ordered array |
| `proofCopy` | `{ heading; subheading; points: 3 }` | subheading is D-18 extension |
| `finalCtaCopy` | `{ kicker; headline; body; cta; emailPlaceholder }` | kicker is D-18 extension |
| `footerCopy` | `{ copyright; supportEmail; trustLine }` | D-05 minimal footer |

## [CONFIRM] Support Email Value

`footerCopy.supportEmail = "support@teacherworkspace.app"` — confirmed per D-19.

If this email needs to change before Plan 05 ships the `<SiteFooter>` component, edit `src/content/landing.ts` line 109 (`supportEmail: "support@teacherworkspace.app"`).

## D-08 Schema Extensions (Beyond Locked Shape)

Both extensions are additive, do not violate any locked decision, and are recorded here for traceability:

1. **`proofCopy.subheading`** — D-08 stated shape was `{ heading: string; points: readonly string[] }`. The proof-strip h2 subhead (`"The grade, the absence, the parent message — finally on the same page."`) had no slot in D-08. D-18 (user-confirmed 2026-04-28) adds `subheading: string`. Plan 04 will migrate `proof-strip.tsx` to read from this field.

2. **`finalCtaCopy.kicker`** — D-08 stated shape was `{ headline; body; cta; emailPlaceholder }`. The `"Free for individual teachers"` kicker (currently hardcoded in `final-cta.tsx:32`) had no slot in D-08. D-18 (user-confirmed 2026-04-28) adds `kicker: string`. Plan 04 will migrate `final-cta.tsx` to read from this field.

## Typecheck Failure Analysis (Plan 04 Input)

`pnpm typecheck` fails after Plan 03 ships — this is expected per the plan (D-06 says delete legacy exports; Plan 04 migrates consumers). The failure mode is exclusively TS2305 "Module has no exported member 'X'" errors.

**Consumer files broken after Plan 03 (Plan 04 must fix all of these):**

| File | Broken import | Legacy members used |
|------|---------------|---------------------|
| `src/components/landing/email-capture.tsx` | `import { heroCopy }` | `heroCopy.emailPlaceholder`, `heroCopy.cta` |
| `src/components/landing/paper-hero.tsx` | `import { heroCopy }` | `heroCopy.headline`, `heroCopy.headlineSecond`, `heroCopy.ctaHref`, `heroCopy.cta` |
| `src/components/landing/product-section.tsx` | `import { modules, productCopy }` | `productCopy.kicker`, `productCopy.headline`, `productCopy.body`, `productCopy.cta`, `modules.map(...)` |
| `src/components/landing/proof-strip.tsx` | `import { proofPoints }` | `proofPoints.map(...)` |
| `src/components/landing/site-header.tsx` | `import { heroCopy, navItems }` | `heroCopy.ctaHref`, `heroCopy.cta` (navItems import is still valid) |

**Wave 0 stub test files also fail typecheck (expected — modules not yet created):**
- `src/components/landing/footer.test.tsx` — imports `./footer` (Plan 05)
- `src/components/landing/landmark-audit.test.tsx` — imports `./footer`, `./skip-link`, `./scroll-choreography/static-choreography-fallback` (Plans 04/05)
- `src/components/landing/scroll-choreography/static-choreography-fallback.test.tsx` (Plan 04)
- `src/components/landing/scroll-choreography/use-is-desktop.test.ts` (Plan 04)
- `src/components/landing/skip-link.test.tsx` (Plan 05)

These stub failures are pre-existing (Wave 0 stubs reference future modules) and not caused by Plan 03.

## Task Commits

1. **Task 2: Rewrite src/content/landing.ts** — `5a34e53` (feat)

## Deviations from Plan

### Auto-fixed Issues

None — Task 1 was context-only (no file changes). Task 2 executed exactly as specified.

**One style fix applied:** The `NavItem` type was reformatted from inline `{ readonly label: string; readonly href: string }` to multiline to comply with the zero-semicolons rule (CLAUDE.md code style). The plan's action block used inline form; CLAUDE.md's "Semicolons: Disabled" rule requires the multiline form in TypeScript type bodies when using property separators.

## Known Stubs

- `stages[1]` (wow): `copy.caption` is intentionally `undefined` — no caption content for wow stage in Phase 1. Phase 4 (CONTENT-02) decides whether wow gets a caption.
- `feature-b` copy is first-pass placeholder per planner recommendation — Phase 4 (CONTENT-04) owns final copy.

These stubs do not prevent the plan's goal (typed content shape) from being achieved — they are intentional first-pass values.

## Threat Flags

None — this plan modifies only a pure data/content file with no network endpoints, auth paths, file access patterns, or schema changes at trust boundaries.

## Next Phase Readiness

- **Plan 04 (component migrations + SSR primitives):** Reads `stages`, `TEACHER_WORKSPACE_APP_URL`, `proofCopy`, `finalCtaCopy`, `navItems` to migrate the 5 broken consumer files listed above. Also creates `<StaticChoreographyFallback>`, `<ScrollChoreographyContext>`, `useIsDesktop`, `<SiteFooter>`, `<SkipLink>`.
- **Plan 05 (footer + skip link):** Reads `footerCopy` for `<SiteFooter>` content.

## Self-Check

### Created files
- (No new files created)

### Modified files
- `src/content/landing.ts` — present and correct (verified above)

### Commits
- `5a34e53` — present
