# Codebase Concerns

**Analysis Date:** 2026-04-28

## Tech Debt

**Loose Dependency Pinning:**
- Issue: `nitro` package is pinned to `"latest"` instead of a specific version, which can cause unexpected breaking changes
- Files: `package.json` (line 29)
- Impact: Build reproducibility is compromised; CI/CD and local development may run different versions
- Fix approach: Replace `"latest"` with a specific pinned version (e.g., `^2.0.0` with version verification)

**Unhandled Form Submission:**
- Issue: Email capture form in `EmailCapture` component prevents default but has no actual submission handler or backend integration
- Files: `src/components/landing/email-capture.tsx` (lines 9-11)
- Impact: User emails are collected but discarded; no validation, storage, or follow-up mechanism exists
- Fix approach: Implement form submission handler, add email validation, connect to email service (e.g., Supabase, Airtable, Mailchimp)

**Hardcoded External Links:**
- Issue: Multiple components hardcode external URLs for the alpha app without environment variable configuration
- Files: 
  - `src/content/landing.ts` (line 12: `"https://teacherworkspace-alpha.vercel.app/students"`)
  - `src/components/landing/paper-hero.tsx` (line 189)
  - `src/components/landing/product-section.tsx` (line 65)
- Impact: Environment-specific URLs require code changes to switch between dev/staging/production
- Fix approach: Move URLs to environment variables or a config file that supports multiple deployment environments

**Missing Test Coverage:**
- Issue: No test files exist in the codebase despite test runner (`vitest`) being configured
- Files: None (absence of `*.test.ts`, `*.test.tsx`, `*.spec.ts`, `*.spec.tsx`)
- Impact: No regression detection; component refactoring and feature changes carry unknown risk
- Fix approach: Add unit and integration tests for critical components, especially `PaperHero` and `EmailCapture`

## Known Bugs

**Video Playback Sync Issues (Potential):**
- Symptoms: Hero video animation sync depends on scroll progress calculations and video metadata loading
- Files: `src/components/landing/paper-hero.tsx` (lines 44-54, 56-65)
- Trigger: Fast scrolling, slow video load, or network throttling may cause video currentTime to jump or fall out of sync
- Workaround: Use fallback image (`/hero/teacher-illustration.png`) for users with reduced motion or on slower connections; already implemented via `prefers-reduced-motion` check

**Hardcoded Internal Link Href:**
- Symptoms: ProductSection button links to `#today` instead of the section's `id="today"` 
- Files: `src/components/landing/product-section.tsx` (line 51)
- Trigger: User clicks "See a student profile" button
- Workaround: Currently works due to matching ID, but fragile to refactoring; should use explicit route or anchor
- Fix approach: Consider using explicit route navigation or dynamic anchor linking

## Security Considerations

**No Input Validation on Email Field:**
- Risk: Email input field in `EmailCapture` has no client-side or server-side validation before submission
- Files: `src/components/landing/email-capture.tsx` (line 13-18)
- Current mitigation: None; form submission is prevented with `event.preventDefault()`, preventing any submission at all
- Recommendations: 
  - Implement email regex validation on input
  - Add server-side validation if form submission backend is implemented
  - Consider rate limiting on submission endpoint

**No Content Security Policy Headers:**
- Risk: Images loaded from public paths without validation or CSP headers to prevent injection attacks
- Files: All image src attributes throughout landing components
- Current mitigation: Vite/React Router configuration (assumed safe)
- Recommendations:
  - Add CSP headers in server config (`src/routes/__root.tsx`)
  - Consider subresource integrity (SRI) for external assets if any are used

**Hardcoded External Domain in Browser:**
- Risk: External link to `teacherworkspace-alpha.vercel.app` is user-facing and could be phishing target
- Files: `src/content/landing.ts`, multiple components
- Current mitigation: Uses `rel="noreferrer"` on some links (e.g., `site-header.tsx` line 47)
- Recommendations:
  - Apply `rel="noreferrer"` consistently to all external links
  - Consider verifying domain ownership or using trusted link shortener
  - Add security headers to prevent clickjacking

## Performance Bottlenecks

**Large Single Component (PaperHero):**
- Problem: `PaperHero` is 223 lines with complex motion animations and scroll-linked effects
- Files: `src/components/landing/paper-hero.tsx`
- Cause: Combines hero section, video sync, parallax clouds, and opacity transitions in one component
- Improvement path:
  - Extract cloud animations into separate `<CloudLayer>` component
  - Extract video sync logic into custom hook (`useVideoSync`)
  - Extract opacity/transform calculations into constants or utility functions
  - Consider memoizing motion values to prevent unnecessary re-renders

**Redundant Cloud Image Markup:**
- Problem: Cloud halftone image is duplicated with nearly identical markup in multiple components
- Files: 
  - `src/components/landing/paper-hero.tsx` (lines 98-119)
  - `src/components/landing/final-cta.tsx` (lines 11-27)
  - `src/components/landing/proof-strip.tsx` (lines 12-18)
- Cause: Copy-paste pattern instead of creating reusable component
- Improvement path: Extract into `<CloudDrift>` component with configurable position and animation direction

**Inline CSS Variables for Colors:**
- Problem: Multiple hardcoded color values and CSS variables scattered throughout components
- Files: Throughout styles.css and inline className attributes
- Cause: Mix of Tailwind/CSS variables and inline hex colors
- Improvement path:
  - Centralize all color definitions in Tailwind config or CSS custom properties
  - Use consistent variable naming (e.g., `--paper-*` family)
  - Remove duplicate color definitions in dark mode overrides

## Fragile Areas

**Paper Design Token System:**
- Files: `src/styles.css` (lines 100-106, custom properties like `--paper-ink`, `--paper-muted`)
- Why fragile: Custom CSS variables are mixed with Radix UI and shadcn color tokens; inconsistent naming convention
- Safe modification: When adding new colors, define both light and dark variants in `:root` and `.dark` selector
- Test coverage: No tests verify that color tokens are correctly applied; visual regression would be undetected

**Motion/Scroll Binding in PaperHero:**
- Files: `src/components/landing/paper-hero.tsx` (lines 21-54)
- Why fragile: Multiple dependent `useTransform` hooks rely on exact scroll progress percentages (0.6, 0.55, 0.85, etc.)
- Safe modification: Any adjustment to section height or scroll offset requires recalibrating all animation thresholds
- Test coverage: No unit tests for scroll calculations; visual tests would require manual browser testing

**Hardcoded Asset Paths:**
- Files: All image paths like `/hero/cloud-halftone.png`, `/hero/teacher-working.mp4`, etc.
- Why fragile: Public asset paths are not validated; if files move or are deleted, pages break silently
- Safe modification: Create a central asset manifest or configuration file for all public assets
- Test coverage: No build-time validation of asset existence

**Navigation Structure Assumptions:**
- Files: `src/components/landing/site-header.tsx` (lines 30-39), `src/content/landing.ts` (lines 1-4)
- Why fragile: Navbar links assume specific section IDs exist (`#features`, `#testimonials`) but ProofStrip uses `#reviews` instead
- Safe modification: Maintain a single source of truth for all section anchors
- Test coverage: No tests verify link targets match section IDs

## Scaling Limits

**Single Page Application with Single Route:**
- Current capacity: Handles 1 landing page with 4 hero sections effectively
- Limit: When adding multiple pages/routes, router configuration will need expansion; no page layout templates exist
- Scaling path: 
  - Create layout components for different page types (marketing, app, admin)
  - Add route grouping in `src/routes/`
  - Implement middleware for analytics tracking and authentication checks

**No Database or Backend Infrastructure:**
- Current capacity: Static landing page only; no user data persistence
- Limit: Cannot scale to handle user accounts, form submissions, or personalization
- Scaling path:
  - Integrate Supabase or similar backend for email list storage
  - Add API routes via Nitro (already configured)
  - Implement authentication middleware

**Asset Delivery Without Optimization:**
- Current capacity: Loads full video file (`/hero/teacher-working.mp4`) without streaming or lazy loading
- Limit: Page load time increases significantly on slow connections; video not optimized for different devices
- Scaling path:
  - Use video streaming service (e.g., Mux, Cloudinary) for adaptive bitrate
  - Implement lazy loading with intersection observer for below-fold images
  - Add responsive image variants using `srcset`

## Dependencies at Risk

**Nitro at Latest Version:**
- Risk: `nitro: "latest"` can break between major versions without warning
- Impact: Build process may fail unexpectedly; API routes may not work as expected
- Migration plan: 
  - Pin to a specific major version (e.g., `nitro: "^2.0.0"`)
  - Test in staging before updating
  - Review changelog for breaking changes

**Motion Library Version Risk:**
- Risk: `motion: ^12.38.0` is a relative new major version; animations may break in future updates
- Impact: Hero scroll animations may behave unexpectedly after motion library update
- Migration plan:
  - Review motion library release notes before upgrading
  - Consider creating wrapper hooks around motion hooks to insulate from API changes
  - Add visual regression tests for animations

**React 19 Edge Cases:**
- Risk: Project uses React 19.2.4, a recent major version with potential edge cases in concurrent rendering
- Impact: Unexpected behavior with state updates or animation timing in scroll-linked effects
- Migration plan:
  - Monitor React release notes for bug fixes
  - Test with React 19 beta features if adopting new features
  - Consider fallback testing in React 18 for critical animations

## Missing Critical Features

**Email List Capture Backend:**
- Problem: `EmailCapture` form accepts email but does nothing with it; no backend endpoint or service integration
- Blocks: Cannot build mailing list; no way to follow up with interested teachers
- Priority: High - core business requirement for marketing site

**Analytics/Tracking:**
- Problem: No analytics integration (Google Analytics, Posthog, Mixpanel, etc.)
- Blocks: Cannot measure landing page effectiveness, user flow, or conversion funnel
- Priority: High - critical for understanding user behavior and optimizing marketing

**SEO Metadata:**
- Problem: Basic meta tags in `__root.tsx` but no Open Graph, structured data, or dynamic meta generation
- Blocks: Sharing on social media shows generic preview; search engines can't parse structured content
- Priority: Medium - important for social sharing and organic search visibility

**Contact/Support Form:**
- Problem: No way for users to contact support or provide feedback on the landing page
- Blocks: Cannot gather user research or address support requests early
- Priority: Medium - important for user validation and feedback loop

## Test Coverage Gaps

**No Component Tests:**
- What's not tested: All landing page components lack unit/integration tests
- Files: All `.tsx` files in `src/components/`
- Risk: Refactoring or dependency updates could silently break component rendering
- Priority: High

**No E2E Tests:**
- What's not tested: User flows (form submission, navigation, scroll interactions)
- Risk: Broken links (like `#features` navigation) or form failures go undetected in production
- Priority: Medium

**No Accessibility Tests:**
- What's not tested: ARIA labels, keyboard navigation, screen reader compatibility
- Files: Components use `aria-label`, `aria-hidden`, etc. but no a11y testing
- Risk: Accessibility regressions introduced without detection
- Priority: Medium

**No Visual Regression Tests:**
- What's not tested: CSS changes, responsive design at different breakpoints, animation smoothness
- Risk: Changes to `styles.css` or Tailwind config could break layout or animations
- Priority: Medium

---

*Concerns audit: 2026-04-28*
