# Technology Stack

**Analysis Date:** 2026-04-28

## Languages

**Primary:**
- TypeScript 5.9.3 - Used throughout source code and configuration files
- JSX/TSX - React component development in `src/components/` and `src/routes/`

**Secondary:**
- JavaScript - Configuration files (`eslint.config.js`, `vite.config.ts`)
- CSS - `src/styles.css` for Tailwind and design tokens

## Runtime

**Environment:**
- Node.js 25.6.1 (or compatible)

**Package Manager:**
- pnpm (inferred from `pnpm-lock.yaml`)
- Lockfile: `pnpm-lock.yaml` (344KB)

## Frameworks

**Core:**
- React 19.2.4 - UI framework
- TanStack Start 1.166.15 - Full-stack React framework with SSR support
- TanStack React Router 1.167.4 - Type-safe routing
- Nitro (latest) - Server runtime for TanStack Start

**Styling:**
- Tailwind CSS 4.2.1 - Utility-first CSS framework
- @tailwindcss/vite 4.2.1 - Vite integration for Tailwind

**Animation & Motion:**
- Motion 12.38.0 - React animation library (used in `src/components/landing/paper-hero.tsx` for scroll-linked animations)

**UI Components:**
- Radix UI 1.4.3 - Unstyled, accessible component primitives
- shadcn 4.4.0 - Copy-paste component library built on Radix
- @radix-ui/colors 3.0.0 - Color system for theming
- Lucide React 1.9.0 - Icon library

**Utilities:**
- class-variance-authority 0.7.1 - Type-safe CSS class composition
- clsx 2.1.1 - Conditional CSS class merging
- tailwind-merge 3.5.0 - Intelligent Tailwind class merging
- tw-animate-css 1.4.0 - Animation utilities

**Development & Build:**
- Vite 7.3.1 - Build tool and dev server
- vite-tsconfig-paths 5.1.4 - TypeScript path alias support in Vite
- @vitejs/plugin-react 5.2.0 - Fast Refresh and JSX support

**Dev Tools:**
- @tanstack/react-devtools 0.10.0 - TanStack React Router dev tools
- @tanstack/react-router-devtools 1.166.9 - Router debugging tools
- @tanstack/devtools-vite 0.6.0 - Vite integration for TanStack devtools

**Testing:**
- Vitest 3.2.4 - Unit test framework (config: none detected)
- @testing-library/react 16.3.2 - React component testing utilities
- @testing-library/dom 10.4.1 - DOM testing utilities
- jsdom 27.4.0 - JavaScript DOM implementation for testing

**Code Quality:**
- ESLint (via @tanstack/eslint-config 0.4.0) - Linting
- Prettier 3.8.1 - Code formatting
- prettier-plugin-tailwindcss 0.7.2 - Tailwind class sorting
- @types/react 19.2.14 - React type definitions
- @types/react-dom 19.2.3 - React DOM type definitions
- @types/node 22.19.15 - Node.js type definitions

**Performance Monitoring:**
- web-vitals 5.1.0 - Web performance metrics (Core Web Vitals)

**Build Tool:**
- @rsbuild/core 2.0.1 - Alternative build framework (optional/dev dependency)
- @tanstack/router-plugin 1.166.13 - TanStack router file-based routing plugin
- @tanstack/react-router-ssr-query 1.166.9 - SSR support for router

## Configuration

**Environment:**
- No environment variables detected in source code
- .env file is in .gitignore (not tracked)
- No secrets/API keys referenced in codebase

**Build:**
- `vite.config.ts` - Primary build configuration
  - Plugins: Nitro, Tailwind, TanStack Start, TanStack devtools, Vite React, TypeScript paths
  - Dev server port: 3000 (default)
- `tsconfig.json` - TypeScript compiler configuration
  - Target: ES2022
  - Module resolution: bundler
  - Path aliases: `@/*` → `./src/*`
  - Strict mode enabled
- `.prettierrc` - Code formatting configuration
  - Print width: 80 characters
  - Tab width: 2 spaces
  - No semicolons
  - Double quotes disabled
  - Tailwind class sorting enabled
- `eslint.config.js` - Linting configuration
  - Uses @tanstack/eslint-config
  - Ignores: .output/, .vinxi/, dist/, node_modules/
- `components.json` - Likely shadcn/ui component configuration (contains theming or component mapping)

## Scripts

**Available npm/pnpm scripts:**
```bash
dev              # Start Vite dev server on port 3000
build            # Build for production
preview          # Preview production build locally
test             # Run Vitest tests
lint             # Run ESLint
format           # Format code with Prettier
typecheck        # Type check with tsc
```

## Platform Requirements

**Development:**
- Node.js 25.6.1 (no .nvmrc specified)
- pnpm package manager
- Modern browser (ES2022 target)

**Production:**
- Deployment target: Vercel (inferred from landing copy referencing `teacherworkspace-alpha.vercel.app`)
- Runtime: Node.js 18+ (TanStack Start/Nitro requirement)

## External Assets

- Font variables from @fontsource
  - Geist (variable 5.2.8)
  - Plus Jakarta Sans (variable 5.2.8)
- Local images and video in `/public/hero/`
  - `teacher-illustration.png` - Hero poster image
  - `teacher-working.mp4` - Hero scroll-linked video
  - `profiles-screen.png` - Product UI screenshot
  - `cloud-halftone.png` - Decorative cloud assets

---

*Stack analysis: 2026-04-28*
