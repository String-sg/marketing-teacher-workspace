# Codebase Structure

**Analysis Date:** 2026-04-28

## Directory Layout

```
marketing-teacher-workspace/
├── src/                           # Source code
│   ├── routes/                    # TanStack React Router file-based routes
│   │   ├── __root.tsx            # Root layout component
│   │   └── index.tsx             # Home page (/)
│   ├── components/               # React components
│   │   ├── landing/              # Landing page sections
│   │   │   ├── paper-hero.tsx           # Hero with scroll animations
│   │   │   ├── product-section.tsx      # Product features
│   │   │   ├── proof-strip.tsx          # Testimonials/proof points
│   │   │   ├── final-cta.tsx            # Bottom CTA section
│   │   │   ├── email-capture.tsx        # Email signup form
│   │   │   └── site-header.tsx          # Navigation header
│   │   └── ui/                   # Reusable UI primitives
│   │       ├── button.tsx              # Button component (CVA variants)
│   │       └── input.tsx               # Input component
│   ├── content/                  # Marketing copy and data
│   │   └── landing.ts            # Hero, product, nav, proof copy
│   ├── lib/                      # Utilities
│   │   └── utils.ts              # cn() class merge utility
│   ├── router.tsx                # Router initialization
│   ├── routeTree.gen.ts          # Auto-generated route tree (do not edit)
│   └── styles.css                # Global styles, design tokens, themes
├── public/                        # Static assets
│   └── hero/                     # Hero section images/videos
│       ├── teacher-working.mp4        # Scroll-driven video
│       ├── teacher-illustration.png   # Fallback image
│       ├── profiles-screen.png        # Dashboard screenshot
│       ├── tw-icon.png               # Logo
│       └── cloud-halftone.png        # Decorative clouds
├── vite.config.ts                # Vite build config (TanStack plugins)
├── tsconfig.json                 # TypeScript config with @ path alias
├── tailwind.config.ts            # Tailwind CSS config (if present)
├── package.json                  # Dependencies & scripts
└── README.md                      # Project overview
```

## Directory Purposes

**`src/routes/`:**
- Purpose: Define HTTP routes and page layouts via file-based routing
- Contains: Root layout, page components
- Key files: `__root.tsx` (HTML shell), `index.tsx` (home page)
- Auto-generated: `routeTree.gen.ts` (do not manually edit)

**`src/components/landing/`:**
- Purpose: Section components that make up the landing page
- Contains: Composable page sections with animations and content
- Key files: `paper-hero.tsx` (main scroll section), `product-section.tsx`, `final-cta.tsx`

**`src/components/ui/`:**
- Purpose: Reusable UI building blocks with variants
- Contains: Button, Input, and other primitives
- Pattern: CVA (class-variance-authority) for variant management

**`src/content/`:**
- Purpose: Centralize all marketing copy and static data
- Contains: Copy objects (heroCopy, productCopy, modules, proofPoints, navItems)
- Editing: Change copy here once; components automatically reflect updates

**`src/lib/`:**
- Purpose: Shared utility functions
- Contains: `cn()` for class merging (clsx + tailwind-merge)

**`public/hero/`:**
- Purpose: Store video, images, and assets for hero section
- Contains: `.mp4` video, `.png` images for desktop/mobile
- Usage: Referenced via src="/hero/filename" in components

## Key File Locations

**Entry Points:**
- `src/routes/__root.tsx`: Root HTML document; defines <head>, <body>, styles
- `src/routes/index.tsx`: Home page route; renders HomePage with sections
- `src/router.tsx`: Router factory function; called by server/client

**Configuration:**
- `package.json`: Dependencies (React 19, @tanstack, motion/react, tailwindcss, lucide-react)
- `vite.config.ts`: Build plugins (TanStack Start, Tailwind Vite, Vite React, Nitro)
- `tsconfig.json`: Compiler options, path alias `@/*` → `./src/*`
- `src/styles.css`: Global styles, custom properties (--paper-card, --paper-ink), theme tokens

**Core Logic:**
- `src/components/landing/paper-hero.tsx`: Main scroll animation handler (260+ lines)
- `src/content/landing.ts`: All marketing copy as data structure
- `src/components/landing/site-header.tsx`: Navigation component

**Testing:**
- No test files present (no .test.ts, .spec.tsx)

## Naming Conventions

**Files:**
- Component files: PascalCase.tsx (e.g., PaperHero.tsx)
- Utility files: camelCase.ts (e.g., utils.ts, landing.ts)
- Generated files: suffix .gen.ts (e.g., routeTree.gen.ts)
- Routes: directory-based + index file (index.tsx for /; __root.tsx for layout)

**Directories:**
- Component directories: lowercase plural or singular (e.g., `components`, `ui`, `landing`)
- Feature directories: descriptive lowercase (e.g., `content`, `lib`, `routes`)

**Functions/Variables:**
- React components: PascalCase (e.g., HomePage, PaperHero, EmailCapture)
- Utility functions: camelCase (e.g., cn, getRouter)
- Constants: UPPER_SNAKE_CASE (none found; consider using for design tokens)
- CSS custom properties: kebab-case (e.g., --paper-card, --paper-ink, --primary)

**Imports:**
- Relative: ./sibling, ../parent, @/absolute
- Alias usage: @/components/landing/paper-hero, @/content/landing
- Order: React/libraries → @/ aliases → relative imports

## Where to Add New Code

**New Landing Section:**
1. Create component in `src/components/landing/new-section.tsx`
2. Add copy to `src/content/landing.ts` (e.g., newSectionCopy)
3. Import and compose in `src/routes/index.tsx` (HomePage)
4. Optional: Add assets to `public/hero/` if images needed

**New UI Component:**
1. Create in `src/components/ui/my-component.tsx`
2. Define CVA variants if multiple styles
3. Use cn() utility to merge Tailwind classes
4. Export from file (no barrel exports used)

**New Page/Route:**
1. Create file in `src/routes/[route-name].tsx`
2. Use `createFileRoute()` pattern (see `index.tsx` for example)
3. TanStack Start auto-generates routeTree.gen.ts

**Styling:**
- Global: Add to `src/styles.css` (custom properties, @apply directives)
- Component: Use className with Tailwind (no CSS modules)
- Theme colors: Define in `:root { --variable-name: value }` in styles.css

**Utilities:**
- Shared helpers: Add to `src/lib/utils.ts`
- Content-driven data: Add to `src/content/landing.ts`

## Special Directories

**`src/routeTree.gen.ts`:**
- Purpose: Auto-generated route file tree by TanStack plugin
- Generated: Yes (by vite build on each compilation)
- Committed: Yes (checked in for type safety)
- Do not: Manually edit this file

**`public/`:**
- Purpose: Static assets served as-is by server
- Generated: No (manually added files)
- Committed: Yes (part of source)

**`.output/`:**
- Purpose: Build output directory
- Generated: Yes (by vite build and nitro)
- Committed: No (in .gitignore)

**`node_modules/`:**
- Purpose: Installed dependencies
- Generated: Yes (by pnpm install)
- Committed: No (in .gitignore)

## Build & Development Structure

**Build Process:**
1. Entry: `vite.config.ts` loads plugins (Tailwind, TanStack Start, React)
2. Routes: TanStack Router plugin auto-generates `routeTree.gen.ts`
3. Assets: Imported images/videos bundled to `public/` during build
4. Output: `dist/` folder with server and client bundles (via Nitro/TanStack Start)

**Development Server:**
- Command: `npm run dev`
- Port: 3000
- Hot Module Reload: Enabled
- Entry: `src/routes/__root.tsx`

**Type Checking:**
- Command: `npm run typecheck`
- Config: `tsconfig.json` (strict: true)
- Path alias: `@/*` resolves to `./src/*`

## Styling Architecture

**CSS Layers (in src/styles.css):**
1. Tailwind directives (@import "tailwindcss")
2. Animation library (tw-animate-css)
3. shadcn/ui base styles
4. Fonts (@fontsource-variable/geist, plus-jakarta-sans)
5. Radix UI colors (mauve, blue, cyan, amber, grass)
6. Custom theme variables (:root with --color-*, --radius-*, etc.)

**Design Tokens:**
- Colors: `--primary`, `--secondary`, `--destructive`, `--paper`, `--paper-ink`
- Spacing: Default Tailwind + custom `--radius` multipliers
- Fonts: `--font-heading` (Plus Jakarta Sans), `--font-sans` (Plus Jakarta Sans)
- Paper system: `--paper-card`, `--paper-ink`, `--paper-muted`, `--paper-rule`

**Responsive Approach:**
- Tailwind breakpoints (sm:, lg:, etc.) in className
- CSS clamp() for fluid typography (e.g., `text-[clamp(1.75rem,4.4vw,4rem)]`)
- Reduced motion media query via useReducedMotion() hook

---

*Structure analysis: 2026-04-28*
