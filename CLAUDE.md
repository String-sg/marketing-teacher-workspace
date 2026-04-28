<!-- GSD:project-start source:PROJECT.md -->
## Project

**Teacher Workspace — Marketing Landing**

Marketing landing page for Teacher Workspace, a school product that gives teachers one screen to see every student's full picture (attendance, behavior, notes, messages home). The site exists to convert visitors to the live app at `teacherworkspace-alpha.vercel.app/students` — its job is to make a teacher feel "this is the tool I've been missing" within one scroll.

**Core Value:** A single scroll-driven choreography that introduces the product UI as a shared element morphing through the page — emerging from the hand-drawn paper world, scaling to a full reveal, then docking to the side as features explain themselves. If everything else regresses, *this transition must feel intentional and on-brand*.

### Constraints

- **Tech stack**: React 19 + TanStack Start + Tailwind v4 + `motion/react` — locked. The choreography must be implementable inside this stack without introducing GSAP or another animation library.
- **Visual system**: Paper design tokens (`--paper-*`) and the existing illustration assets in `/public/hero/` are locked. Don't restyle the illustration.
- **Performance**: Must not regress current Lighthouse scores. Scroll choreography is GPU-friendly (transform/opacity only); no layout thrash.
- **Accessibility**: `prefers-reduced-motion` is a hard requirement. All content must be reachable without scroll-driven animation.
- **Mobile**: Static fallback only — no engineering effort spent on mobile pinned scroll.
- **Deployment**: Vercel; the live app at `teacherworkspace-alpha.vercel.app/students` is the conversion target and must not be modified by this milestone.
- **Scope discipline**: Marketing-site-only milestone. Live app is untouched.
<!-- GSD:project-end -->

<!-- GSD:stack-start source:codebase/STACK.md -->
## Technology Stack

## Languages
- TypeScript 5.9.3 - Used throughout source code and configuration files
- JSX/TSX - React component development in `src/components/` and `src/routes/`
- JavaScript - Configuration files (`eslint.config.js`, `vite.config.ts`)
- CSS - `src/styles.css` for Tailwind and design tokens
## Runtime
- Node.js 25.6.1 (or compatible)
- pnpm (inferred from `pnpm-lock.yaml`)
- Lockfile: `pnpm-lock.yaml` (344KB)
## Frameworks
- React 19.2.4 - UI framework
- TanStack Start 1.166.15 - Full-stack React framework with SSR support
- TanStack React Router 1.167.4 - Type-safe routing
- Nitro (latest) - Server runtime for TanStack Start
- Tailwind CSS 4.2.1 - Utility-first CSS framework
- @tailwindcss/vite 4.2.1 - Vite integration for Tailwind
- Motion 12.38.0 - React animation library (used in `src/components/landing/paper-hero.tsx` for scroll-linked animations)
- Radix UI 1.4.3 - Unstyled, accessible component primitives
- shadcn 4.4.0 - Copy-paste component library built on Radix
- @radix-ui/colors 3.0.0 - Color system for theming
- Lucide React 1.9.0 - Icon library
- class-variance-authority 0.7.1 - Type-safe CSS class composition
- clsx 2.1.1 - Conditional CSS class merging
- tailwind-merge 3.5.0 - Intelligent Tailwind class merging
- tw-animate-css 1.4.0 - Animation utilities
- Vite 7.3.1 - Build tool and dev server
- vite-tsconfig-paths 5.1.4 - TypeScript path alias support in Vite
- @vitejs/plugin-react 5.2.0 - Fast Refresh and JSX support
- @tanstack/react-devtools 0.10.0 - TanStack React Router dev tools
- @tanstack/react-router-devtools 1.166.9 - Router debugging tools
- @tanstack/devtools-vite 0.6.0 - Vite integration for TanStack devtools
- Vitest 3.2.4 - Unit test framework (config: none detected)
- @testing-library/react 16.3.2 - React component testing utilities
- @testing-library/dom 10.4.1 - DOM testing utilities
- jsdom 27.4.0 - JavaScript DOM implementation for testing
- ESLint (via @tanstack/eslint-config 0.4.0) - Linting
- Prettier 3.8.1 - Code formatting
- prettier-plugin-tailwindcss 0.7.2 - Tailwind class sorting
- @types/react 19.2.14 - React type definitions
- @types/react-dom 19.2.3 - React DOM type definitions
- @types/node 22.19.15 - Node.js type definitions
- web-vitals 5.1.0 - Web performance metrics (Core Web Vitals)
- @rsbuild/core 2.0.1 - Alternative build framework (optional/dev dependency)
- @tanstack/router-plugin 1.166.13 - TanStack router file-based routing plugin
- @tanstack/react-router-ssr-query 1.166.9 - SSR support for router
## Configuration
- No environment variables detected in source code
- .env file is in .gitignore (not tracked)
- No secrets/API keys referenced in codebase
- `vite.config.ts` - Primary build configuration
- `tsconfig.json` - TypeScript compiler configuration
- `.prettierrc` - Code formatting configuration
- `eslint.config.js` - Linting configuration
- `components.json` - Likely shadcn/ui component configuration (contains theming or component mapping)
## Scripts
## Platform Requirements
- Node.js 25.6.1 (no .nvmrc specified)
- pnpm package manager
- Modern browser (ES2022 target)
- Deployment target: Vercel (inferred from landing copy referencing `teacherworkspace-alpha.vercel.app`)
- Runtime: Node.js 18+ (TanStack Start/Nitro requirement)
## External Assets
- Font variables from @fontsource
- Local images and video in `/public/hero/`
<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->
## Conventions

## Naming Patterns
- Components: PascalCase (e.g., `PaperHero.tsx`, `EmailCapture.tsx`)
- Utilities: camelCase (e.g., `utils.ts`, `landing.ts`)
- Routes: lowercase with hyphens (e.g., `__root.tsx`, `index.tsx`)
- Directories: lowercase (e.g., `src/components/landing`, `src/lib`)
- Component functions: PascalCase (e.g., `export function PaperHero()`)
- Utility functions: camelCase (e.g., `export function cn(...)`)
- Helper functions: camelCase (e.g., `const clamp01 = (v: number) => ...`)
- State variables: camelCase (e.g., `stageOpacity`, `screenOpacity`, `copyOpacity`)
- Constants: camelCase (e.g., `videoDurationRef`, `sectionRef`)
- Data objects: camelCase (e.g., `heroCopy`, `navItems`, `modules`)
- React component props: Inlined with type annotations (e.g., `React.ComponentProps<"button">`)
- Type imports: Explicit `type` keyword usage (e.g., `import type { ClassValue } from "clsx"`)
- CVA variants: camelCase with consistent naming (e.g., `buttonVariants`, `variant`, `size`)
## Code Style
- Tool: Prettier 3.8.1
- Print width: 80 characters
- Trailing comma: ES5 (include in objects/arrays, not function params)
- Quotes: Double quotes for JSX/strings
- Semicolons: Disabled (no semicolons)
- Tab width: 2 spaces
- Tool: ESLint with TanStack config (`@tanstack/eslint-config`)
- Config: `eslint.config.js`
- Ignores: `.output/**`, `.vinxi/**`, `dist/**`, `node_modules/**`
- Plugin: `prettier-plugin-tailwindcss` (reorders classes)
- Custom functions: `cn()` and `cva()` recognized by formatter
- Stylesheet: `src/styles.css` referenced in prettier config
## Import Organization
- Base alias: `@/*` maps to `./src/*` (configured in `tsconfig.json`)
- Used consistently throughout: `@/components`, `@/lib`, `@/content`
## Error Handling
- No explicit error handling detected in source code (landing page focused codebase)
- Form submission prevents default: `onSubmit={(event) => event.preventDefault()}`
- Conditional rendering with ternary operators for fallback UI (e.g., reduced motion variants)
## Logging
- No centralized logging in current codebase (marketing landing page focused)
## Comments
- Function-level comments: Not used; code is self-documenting
- Inline comments: Minimal; only for non-obvious intent
- Comments for generated code: File headers warn against modification (e.g., `routeTree.gen.ts`)
- Not used in current codebase
- Type annotations are inline and explicit
## Function Design
- Utility functions: 1-8 lines (e.g., `cn()`, `clamp01()`)
- Component functions: 10-200 lines depending on logic complexity
- Largest component: `PaperHero` at ~224 lines with animation state management
- Use destructuring for component props
- Type definitions inline with `React.ComponentProps` where applicable
- Optional parameters with default values (e.g., `variant = "default"`)
- JSX components return React elements
- Utility functions return computed values or merged classes
- Early returns for conditional logic (e.g., early return in `useEffect`)
## Module Design
- Named exports for functions and components (e.g., `export function Button()`)
- Re-export pattern for UI components: `export { Button, buttonVariants }`
- Constants exported as named exports (e.g., `export const navItems`)
- Not explicitly used; imports are direct from source files
- Each component file contains single responsibility
## TypeScript Configuration
- `strict: true` - Full strict type checking enabled
- `noUnusedLocals: true` - Error on unused variables
- `noUnusedParameters: true` - Error on unused function parameters
- `noFallthroughCasesInSwitch: true` - Enforce exhaustive switch cases
- `moduleResolution: bundler` - Modern bundler resolution
- `allowImportingTsExtensions: true` - Allow `.ts`/`.tsx` imports
- `verbatimModuleSyntax: true` - Preserve module syntax as written
## Common Patterns
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->
## Architecture

## System Overview
```text
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
- Fully static landing page composition with no backend dependencies
- TanStack React Router for routing (file-based via routeTree.gen.ts)
- Scroll-driven animations using motion/react with reduced-motion support
- Tailwind CSS v4 with custom theming (paper design system)
- Radix UI colors and primitives (Button using Slot for polymorphism)
- Content as data structure (heroCopy, navItems, modules in content/landing.ts)
## Layers
- Purpose: Define page structure and SEO metadata
- Location: `src/routes/`
- Contains: Root layout (__root.tsx) and file-based routes (index.tsx)
- Depends on: React Router, landing components
- Used by: TanStack Start server-side rendering
- Purpose: Compose marketing page sections with animations and interactivity
- Location: `src/components/landing/`
- Contains: Section components (PaperHero, ProductSection, etc.) and SiteHeader
- Depends on: UI components, motion/react, content data, lucide-react icons
- Used by: HomePage route component
- Purpose: Provide reusable, styled primitives for composition
- Location: `src/components/ui/`
- Contains: Button, Input with CVA variants and Radix/shadcn integration
- Depends on: class-variance-authority, clsx, tailwind-merge, Radix UI, cn() utility
- Used by: Landing components, EmailCapture
- Purpose: Centralize marketing copy and data for easy editing
- Location: `src/content/landing.ts`
- Contains: navItems, heroCopy, productCopy, modules, proofPoints
- Depends on: Nothing (pure data)
- Used by: Landing components, SiteHeader
- Purpose: Shared helper functions
- Location: `src/lib/utils.ts`
- Contains: cn() utility (combines clsx + tailwind-merge)
- Depends on: clsx, tailwind-merge
- Used by: All components
- Purpose: Global styles, design tokens, theme variables
- Location: `src/styles.css`
- Contains: Tailwind directives, custom theme tokens, Radix UI color imports, font imports
- Depends on: @tailwindcss/vite, tailwindcss, @radix-ui/colors, @fontsource-variable packages
- Used by: All components
## Data Flow
### Primary Request Path
### User Interaction Flow
- Motion state: useScroll() + useTransform() (local motion library state)
- React state: stageOpacity, screenOpacity, copyOpacity in PaperHero (useState)
- Video metadata: stored in ref (videoDurationRef)
- Form state: none (email capture form has no submission handler yet)
- Global design tokens: CSS custom properties in :root (styles.css)
## Key Abstractions
- Purpose: Render styled button/link with multiple variants (default, outline, ghost, etc.)
- Examples: `src/components/landing/paper-hero.tsx:139-146`, `src/components/landing/site-header.tsx:42-51`
- Pattern: CVA (class-variance-authority) defines variant combinations; Slot wrapper allows asChild to render as link; cn() merges classes
- Purpose: Calculate animation values based on scroll progress
- Examples: `src/components/landing/paper-hero.tsx:26-38`
- Pattern: useScroll() → useTransform() → motion.div with style object
- Purpose: Centralize all marketing text in data structure
- Examples: `src/content/landing.ts`
- Pattern: Export objects (heroCopy, productCopy, etc.) imported and rendered by components
- Purpose: Create cohesive visual language with CSS custom properties
- Examples: `--paper-card`, `--paper-ink`, `--paper-muted`, `--paper-rule` in styles.css
- Pattern: CSS variables defined in :root, used via `color-mix()` or `var()` in components
## Entry Points
- Location: `src/routes/__root.tsx:5` (createRootRoute)
- Triggers: Any HTTP request to `/`
- Responsibilities: Set up HTML shell, inject styles, define head metadata
- Location: `src/routes/index.tsx:8` (createFileRoute("/"))
- Triggers: Request to `/` path
- Responsibilities: Render HomePage component with all landing sections
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
### Form Without Handler
### Inline Styling with CSS Variables
### Hardcoded Breakpoints in Components
## Error Handling
- Video fallback: If video doesn't load, poster image shows (`src/components/landing/paper-hero.tsx:159-169`)
- Reduced motion fallback: If prefers-reduced-motion, render static view instead of animations (`src/components/landing/paper-hero.tsx:67-84`)
- Missing images: Graceful img alt text and aria-hidden for decorative images
## Cross-Cutting Concerns
<!-- GSD:architecture-end -->

<!-- GSD:skills-start source:skills/ -->
## Project Skills

No project skills found. Add skills to any of: `.claude/skills/`, `.agents/skills/`, `.cursor/skills/`, `.github/skills/`, or `.codex/skills/` with a `SKILL.md` index file.
<!-- GSD:skills-end -->

<!-- GSD:workflow-start source:GSD defaults -->
## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:
- `/gsd-quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd-debug` for investigation and bug fixing
- `/gsd-execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->



<!-- GSD:profile-start -->
## Developer Profile

> Profile not yet configured. Run `/gsd-profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
