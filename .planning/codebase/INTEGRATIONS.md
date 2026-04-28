# External Integrations

**Analysis Date:** 2026-04-28

## APIs & External Services

**Email Capture:**
- No active integration detected in codebase
- `src/components/landing/email-capture.tsx` renders a form with `onSubmit={(event) => event.preventDefault()`
- Form submission is currently not connected to any backend service
- Email input placeholder: "Enter your school email"
- Awaiting integration with email service (Mailchimp, ConvertKit, custom backend, etc.)

## Data Storage

**Databases:**
- Not used - This is a static/client-rendered landing page
- No ORM detected (Prisma, Drizzle, etc.)
- No database client libraries in dependencies

**File Storage:**
- Not used - Only local static assets in `/public/`
- No cloud storage SDK detected (AWS S3, Cloudinary, etc.)

**Caching:**
- Browser-level caching via HTTP cache headers (configured at deployment)
- Vite build output is optimized for caching via hashing
- No application-level caching (Redis, etc.)

## Authentication & Identity

**Auth Provider:**
- Not implemented
- Hero CTA links to `https://teacherworkspace-alpha.vercel.app/students` (external application)
- No authentication/authorization in this landing page

## Monitoring & Observability

**Error Tracking:**
- Not detected - No Sentry, Rollbar, or similar integration found

**Logs:**
- Development: Vite dev server logs
- Production: Standard Vercel deployment logs
- No application-level logging library detected

**Performance Metrics:**
- web-vitals 5.1.0 - Tracks Core Web Vitals (LCP, FID, CLS, TTFB, INP)
- Used to measure landing page performance

## CI/CD & Deployment

**Hosting:**
- Vercel (inferred from URL `teacherworkspace-alpha.vercel.app` in `src/content/landing.ts`)
- TanStack Start and Nitro support Vercel deployments out-of-the-box

**CI Pipeline:**
- Not explicitly configured in repository
- Likely using Vercel's auto-deployment from git (deploy on push to main)

**Build Output:**
- Vite build produces: `dist/` directory (in .gitignore)
- Nitro server output: `.output/` directory (in .gitignore)

## Environment Configuration

**Required env vars:**
- None detected - This landing page has no backend service dependencies
- No API keys, database URLs, or secrets referenced in code

**Secrets location:**
- Not applicable - No secrets in this project
- `.env` file exists (in .gitignore) but not tracked or referenced in code

## Webhooks & Callbacks

**Incoming:**
- None detected
- No API endpoints for receiving webhooks

**Outgoing:**
- Planned: Email capture form will eventually send user emails to an email service
- Not currently implemented

## Static Assets

**Content Delivery:**
- Local assets served from `/public/` directory
- Images: `.png` format
  - `/hero/teacher-illustration.png` - Hero section
  - `/hero/profiles-screen.png` - Product showcase
  - `/hero/cloud-halftone.png` - Decorative elements (×2 variants)
- Video: `.mp4` format
  - `/hero/teacher-working.mp4` - Scroll-linked animation
- Fonts:
  - @fontsource-variable/geist - System font
  - @fontsource-variable/plus-jakarta-sans - Display font (used in `font-heading` class)

## Future Integration Points

**Email List Service:**
- `src/components/landing/email-capture.tsx` has form structure ready for integration
- Recommended: Wire form submission handler to send to email service

**Analytics:**
- Placeholder for tracking landing page traffic and engagement
- Consider: Google Analytics, Plausible, or custom tracking

**Outbound Link Tracking:**
- Hero CTA points to external app (`teacherworkspace-alpha.vercel.app/students`)
- Consider: UTM parameters for tracking campaign effectiveness

---

*Integration audit: 2026-04-28*
