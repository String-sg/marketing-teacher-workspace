<!-- refreshed: 2026-04-28 -->
# Architecture

**Analysis Date:** 2026-04-28

## System Overview

```text
┌─────────────────────────────────────────────────────────────┐
│              Landing Page (Marketing Site)                   │
│          `src/routes/index.tsx` (HomePage)                   │
├──────────────────┬──────────────────┬───────────────────────┤
│  Paper Hero      │  Product         │  Proof Strip          │
│  Section         │  Section         │  Final CTA            │
│ `paper-hero.tsx` │ `product-section │ `proof-strip.tsx`     │
│                  │ .tsx`            │ `final-cta.tsx`       │
└────────┬─────────┴────────┬─────────┴──────────┬────────────┘
         │                  │                     │
         ▼                  ▼                     ▼
┌─────────────────────────────────────────────────────────────┐
│              Landing Components Layer                        │
│   `src/components/landing/` (all landing sections)           │
│   - site-header.tsx                                         │
│   - email-capture.tsx                                       │
└─────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│              UI Component Library                            │
│   `src/components/ui/` (reusable UI primitives)             │
│   - button.tsx (CVA-based with variants)                    │
│   - input.tsx                                               │
└─────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│              Content & Utilities                             │
│   `src/content/landing.ts` - copy and data                  │
│   `src/lib/utils.ts` - cn() utility                         │
│   `src/styles.css` - global styles & tokens                 │
└─────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│              External Dependencies                           │
│   - @tanstack/react-router (routing)                        │
│   - motion/react (animations)                               │
│   - tailwindcss (styling)                                   │
│   - lucide-react (icons)                                    │
└─────────────────────────────────────────────────────────────┘
```

## Component Responsibilities

| Component | Responsibility | File |
|-----------|----------------|------|
| HomePage | Main landing page layout composing all sections | `src/routes/index.tsx` |
| PaperHero | Hero section with scroll-triggered animations, video, and CTA | `src/components/landing/paper-hero.tsx` |
| ProductSection | Product features showcase with grid layout and feature list | `src/components/landing/product-section.tsx` |
| ProofStrip | Social proof/testimonials strip with point callouts | `src/components/landing/proof-strip.tsx` |
| FinalCta | Bottom CTA section with email capture form | `src/components/landing/final-cta.tsx` |
| EmailCapture | Reusable email input form component | `src/components/landing/email-capture.tsx` |
| SiteHeader | Navigation header with logo and links | `src/components/landing/site-header.tsx` |
| Button | Polymorphic UI button with CVA variants | `src/components/ui/button.tsx` |
| Input | Form input field with consistent styling | `src/components/ui/input.tsx` |

## Pattern Overview

**Overall:** Component-based static marketing site with TanStack ecosystem (routing, animations, devtools)

**Key Characteristics:**
- Fully static landing page composition with no backend dependencies
- TanStack React Router for routing (file-based via routeTree.gen.ts)
- Scroll-driven animations using motion/react with reduced-motion support
- Tailwind CSS v4 with custom theming (paper design system)
- Radix UI colors and primitives (Button using Slot for polymorphism)
- Content as data structure (heroCopy, navItems, modules in content/landing.ts)

## Layers

**Route Layer:**
- Purpose: Define page structure and SEO metadata
- Location: `src/routes/`
- Contains: Root layout (__root.tsx) and file-based routes (index.tsx)
- Depends on: React Router, landing components
- Used by: TanStack Start server-side rendering

**Component Layer (Landing):**
- Purpose: Compose marketing page sections with animations and interactivity
- Location: `src/components/landing/`
- Contains: Section components (PaperHero, ProductSection, etc.) and SiteHeader
- Depends on: UI components, motion/react, content data, lucide-react icons
- Used by: HomePage route component

**Component Layer (UI):**
- Purpose: Provide reusable, styled primitives for composition
- Location: `src/components/ui/`
- Contains: Button, Input with CVA variants and Radix/shadcn integration
- Depends on: class-variance-authority, clsx, tailwind-merge, Radix UI, cn() utility
- Used by: Landing components, EmailCapture

**Content Layer:**
- Purpose: Centralize marketing copy and data for easy editing
- Location: `src/content/landing.ts`
- Contains: navItems, heroCopy, productCopy, modules, proofPoints
- Depends on: Nothing (pure data)
- Used by: Landing components, SiteHeader

**Utility Layer:**
- Purpose: Shared helper functions
- Location: `src/lib/utils.ts`
- Contains: cn() utility (combines clsx + tailwind-merge)
- Depends on: clsx, tailwind-merge
- Used by: All components

**Styling Layer:**
- Purpose: Global styles, design tokens, theme variables
- Location: `src/styles.css`
- Contains: Tailwind directives, custom theme tokens, Radix UI color imports, font imports
- Depends on: @tailwindcss/vite, tailwindcss, @radix-ui/colors, @fontsource-variable packages
- Used by: All components

## Data Flow

### Primary Request Path

1. HTTP request to `/` (`src/routes/__root.tsx:5-6`)
   - TanStack React Router resolves route via routeTree.gen.ts (auto-generated)

2. RootDocument renders HTML shell (`src/routes/__root.tsx:40-52`)
   - Injects global stylesheet `styles.css`
   - Sets viewport and SEO metadata

3. HomePage component mounts (`src/routes/index.tsx:10-19`)
   - Composes landing sections as main children

4. Landing sections render with scroll listeners (`src/components/landing/`)
   - PaperHero: Scroll event triggers useScroll() → motion transforms
   - ProductSection: Static grid with content data
   - ProofStrip: Static testimonials section
   - FinalCta: Static CTA with EmailCapture form

5. UI components render with variants (`src/components/ui/`)
   - Button: renders with CVA variant + size classes
   - Input: renders with Tailwind classes

6. Browser renders and attaches motion listeners (`motion/react`)
   - Scroll events update motion transforms (scale, opacity, position)
   - prefers-reduced-motion respected for accessibility

### User Interaction Flow

1. User scrolls page
2. PaperHero.useScroll() detects scroll progress
3. useTransform() calculates animation values (stageScale, screenOpacity, etc.)
4. useMotionValueEvent() updates video playback and opacity state
5. motion.div re-renders with new transform values
6. Video plays/pauses based on scroll position

**State Management:**
- Motion state: useScroll() + useTransform() (local motion library state)
- React state: stageOpacity, screenOpacity, copyOpacity in PaperHero (useState)
- Video metadata: stored in ref (videoDurationRef)
- Form state: none (email capture form has no submission handler yet)
- Global design tokens: CSS custom properties in :root (styles.css)

## Key Abstractions

**Button Component (CVA pattern):**
- Purpose: Render styled button/link with multiple variants (default, outline, ghost, etc.)
- Examples: `src/components/landing/paper-hero.tsx:139-146`, `src/components/landing/site-header.tsx:42-51`
- Pattern: CVA (class-variance-authority) defines variant combinations; Slot wrapper allows asChild to render as link; cn() merges classes

**Motion Transforms:**
- Purpose: Calculate animation values based on scroll progress
- Examples: `src/components/landing/paper-hero.tsx:26-38`
- Pattern: useScroll() → useTransform() → motion.div with style object

**Content-Driven Copy:**
- Purpose: Centralize all marketing text in data structure
- Examples: `src/content/landing.ts`
- Pattern: Export objects (heroCopy, productCopy, etc.) imported and rendered by components

**Paper Design System:**
- Purpose: Create cohesive visual language with CSS custom properties
- Examples: `--paper-card`, `--paper-ink`, `--paper-muted`, `--paper-rule` in styles.css
- Pattern: CSS variables defined in :root, used via `color-mix()` or `var()` in components

## Entry Points

**HTTP Server:**
- Location: `src/routes/__root.tsx:5` (createRootRoute)
- Triggers: Any HTTP request to `/`
- Responsibilities: Set up HTML shell, inject styles, define head metadata

**Page Route:**
- Location: `src/routes/index.tsx:8` (createFileRoute("/"))
- Triggers: Request to `/` path
- Responsibilities: Render HomePage component with all landing sections

**Development Server:**
- Location: `vite.config.ts` (vite dev --port 3000)
- Triggers: `npm run dev` command
- Responsibilities: Start HMR server, watch files, serve assets

## Architectural Constraints

- **Threading:** Single-threaded event loop (browser JavaScript) with Web Worker support via Nitro
- **Global state:** CSS custom properties in `<style>` or imported stylesheets (no JS global state)
- **Circular imports:** None detected (layered imports: routes → components → ui/content/lib)
- **Scroll behavior:** Single scroll listener in PaperHero; other sections are static
- **Prefers-reduced-motion:** Respected via useReducedMotion() hook with fallback static view
- **Third-party dependencies:** Heavy reliance on @tanstack (router, devtools), motion/react, Radix/shadcn

## Anti-Patterns

### Hardcoded External Links

**What happens:** External CTA links are hardcoded in components (e.g., `https://teacherworkspace-alpha.vercel.app/students`)
**Why it's wrong:** Link changes require code modifications instead of config/content updates; makes deployment-specific URLs brittle
**Do this instead:** Move URLs to `src/content/landing.ts` as constants (heroCopy.ctaHref already does this correctly) and ensure all links reference the content object

### Form Without Handler

**What happens:** `src/components/landing/email-capture.tsx` prevents default form submission but has no onSubmit logic
**Why it's wrong:** Users can't actually submit their email; captures no leads; misleading UX
**Do this instead:** Add a submission handler (API call or webhook) and feedback state (loading, success, error); use Form component with proper validation

### Inline Styling with CSS Variables

**What happens:** Components reference `var(--paper-*)` CSS variables via inline styles and className
**Why it's wrong:** Makes tokens non-observable in code; hard to understand available colors; increases CSS file size
**Do this instead:** Export token names from a TypeScript file (e.g., `src/lib/tokens.ts`) or use Tailwind's theme extension; consider design system tooling

### Hardcoded Breakpoints in Components

**What happens:** `src/components/landing/paper-hero.tsx` uses clamp() for responsive fonts but mobile design handled via CSS classes
**Why it's wrong:** Mixing CSS breakpoints and clamp() makes responsive behavior scattered
**Do this instead:** Use Tailwind's `@apply` directives or declare font-size tokens at breakpoints in styles.css

## Error Handling

**Strategy:** Defensive rendering (no try-catch; relies on React error boundaries and null-safety)

**Patterns:**
- Video fallback: If video doesn't load, poster image shows (`src/components/landing/paper-hero.tsx:159-169`)
- Reduced motion fallback: If prefers-reduced-motion, render static view instead of animations (`src/components/landing/paper-hero.tsx:67-84`)
- Missing images: Graceful img alt text and aria-hidden for decorative images

## Cross-Cutting Concerns

**Logging:** None (static site; use browser DevTools)

**Validation:** None in forms (email-capture has type="email" but no client validation)

**Authentication:** None (public marketing site)

**Animations:** motion/react library with scroll listener in PaperHero; respects prefers-reduced-motion

---

*Architecture analysis: 2026-04-28*
