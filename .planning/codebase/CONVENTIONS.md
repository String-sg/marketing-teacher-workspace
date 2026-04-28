# Coding Conventions

**Analysis Date:** 2026-04-28

## Naming Patterns

**Files:**
- Components: PascalCase (e.g., `PaperHero.tsx`, `EmailCapture.tsx`)
- Utilities: camelCase (e.g., `utils.ts`, `landing.ts`)
- Routes: lowercase with hyphens (e.g., `__root.tsx`, `index.tsx`)
- Directories: lowercase (e.g., `src/components/landing`, `src/lib`)

**Functions:**
- Component functions: PascalCase (e.g., `export function PaperHero()`)
- Utility functions: camelCase (e.g., `export function cn(...)`)
- Helper functions: camelCase (e.g., `const clamp01 = (v: number) => ...`)

**Variables:**
- State variables: camelCase (e.g., `stageOpacity`, `screenOpacity`, `copyOpacity`)
- Constants: camelCase (e.g., `videoDurationRef`, `sectionRef`)
- Data objects: camelCase (e.g., `heroCopy`, `navItems`, `modules`)

**Types:**
- React component props: Inlined with type annotations (e.g., `React.ComponentProps<"button">`)
- Type imports: Explicit `type` keyword usage (e.g., `import type { ClassValue } from "clsx"`)
- CVA variants: camelCase with consistent naming (e.g., `buttonVariants`, `variant`, `size`)

## Code Style

**Formatting:**
- Tool: Prettier 3.8.1
- Print width: 80 characters
- Trailing comma: ES5 (include in objects/arrays, not function params)
- Quotes: Double quotes for JSX/strings
- Semicolons: Disabled (no semicolons)
- Tab width: 2 spaces

**Linting:**
- Tool: ESLint with TanStack config (`@tanstack/eslint-config`)
- Config: `eslint.config.js`
- Ignores: `.output/**`, `.vinxi/**`, `dist/**`, `node_modules/**`

**Tailwind Formatting:**
- Plugin: `prettier-plugin-tailwindcss` (reorders classes)
- Custom functions: `cn()` and `cva()` recognized by formatter
- Stylesheet: `src/styles.css` referenced in prettier config

## Import Organization

**Order:**
1. React/framework imports (e.g., `import * as React from "react"`)
2. Third-party libraries (e.g., `import { motion, useMotionValueEvent } from "motion/react"`)
3. Internal components (e.g., `import { Button } from "@/components/ui/button"`)
4. Internal utilities (e.g., `import { cn } from "@/lib/utils"`)
5. Type imports (always use `import type { ... }`)

**Path Aliases:**
- Base alias: `@/*` maps to `./src/*` (configured in `tsconfig.json`)
- Used consistently throughout: `@/components`, `@/lib`, `@/content`

## Error Handling

**Patterns:**
- No explicit error handling detected in source code (landing page focused codebase)
- Form submission prevents default: `onSubmit={(event) => event.preventDefault()}`
- Conditional rendering with ternary operators for fallback UI (e.g., reduced motion variants)

## Logging

**Framework:** None detected

**Patterns:**
- No centralized logging in current codebase (marketing landing page focused)

## Comments

**When to Comment:**
- Function-level comments: Not used; code is self-documenting
- Inline comments: Minimal; only for non-obvious intent
- Comments for generated code: File headers warn against modification (e.g., `routeTree.gen.ts`)

**JSDoc/TSDoc:**
- Not used in current codebase
- Type annotations are inline and explicit

## Function Design

**Size:** Small, focused functions
- Utility functions: 1-8 lines (e.g., `cn()`, `clamp01()`)
- Component functions: 10-200 lines depending on logic complexity
- Largest component: `PaperHero` at ~224 lines with animation state management

**Parameters:**
- Use destructuring for component props
- Type definitions inline with `React.ComponentProps` where applicable
- Optional parameters with default values (e.g., `variant = "default"`)

**Return Values:**
- JSX components return React elements
- Utility functions return computed values or merged classes
- Early returns for conditional logic (e.g., early return in `useEffect`)

## Module Design

**Exports:**
- Named exports for functions and components (e.g., `export function Button()`)
- Re-export pattern for UI components: `export { Button, buttonVariants }`
- Constants exported as named exports (e.g., `export const navItems`)

**Barrel Files:**
- Not explicitly used; imports are direct from source files
- Each component file contains single responsibility

## TypeScript Configuration

**Key Settings:**
- `strict: true` - Full strict type checking enabled
- `noUnusedLocals: true` - Error on unused variables
- `noUnusedParameters: true` - Error on unused function parameters
- `noFallthroughCasesInSwitch: true` - Enforce exhaustive switch cases
- `moduleResolution: bundler` - Modern bundler resolution
- `allowImportingTsExtensions: true` - Allow `.ts`/`.tsx` imports
- `verbatimModuleSyntax: true` - Preserve module syntax as written

## Common Patterns

**Component Structure:**
```typescript
// 1. Imports (external, internal)
import { Button } from "@/components/ui/button"

// 2. Type definitions (inline if simple)
function Button({ 
  className,
  variant = "default",
  ...props 
}: React.ComponentProps<"button"> & VariantProps<typeof buttonVariants>)

// 3. Component body
const Comp = asChild ? Slot.Root : "button"
return <Comp {...props} />

// 4. Export
export { Button }
```

**Data Objects Pattern:**
```typescript
// src/content/landing.ts - Centralized content
export const heroCopy = {
  headline: "string",
  body: "string",
  cta: "string",
}
```

**Animation Pattern:**
```typescript
// Use motion/react with useTransform and useMotionValueEvent
const stageScale = useTransform(scrollYProgress, [0, 0.6, 1], [1, 2.4, 5.2])
useMotionValueEvent(scrollYProgress, "change", (p) => {
  setStageOpacity(p < 0.6 ? 1 : clamp01(1 - (p - 0.6) / 0.18))
})
```

**Classname Merging:**
```typescript
// Use cn() utility which combines clsx and tailwind-merge
className={cn(buttonVariants({ variant, size, className }))}
```

---

*Convention analysis: 2026-04-28*
