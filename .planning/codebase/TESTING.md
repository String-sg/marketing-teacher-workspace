# Testing Patterns

**Analysis Date:** 2026-04-28

## Test Framework

**Runner:**
- Vitest 3.2.4
- Config: Not explicitly configured (uses Vite default)
- Test script: `npm run test` → `vitest run`

**Assertion Library:**
- Vitest's built-in expect (from `@vitest/expect` 3.2.4)

**Testing Libraries:**
- `@testing-library/react` 16.3.2 - React component testing
- `@testing-library/dom` 10.4.1 - DOM testing utilities
- `jsdom` 27.4.0 - DOM environment for Node tests

**Run Commands:**
```bash
npm run test                    # Run all tests (vitest run)
npm run test -- --watch        # Watch mode (inferred)
npm run test -- --coverage     # Coverage (inferred)
```

## Test File Organization

**Location:**
- No test files currently exist in the codebase
- Convention would follow co-located pattern (preferred for React)
- Expected location: same directory as component with `.test.tsx` suffix

**Naming:**
- Pattern: `[component-name].test.tsx` or `[component-name].spec.tsx`
- Examples (inferred): `Button.test.tsx`, `PaperHero.test.tsx`

**Structure:**
```typescript
// Inferred convention from Testing Library imports
import { render, screen } from '@testing-library/react'
import { Button } from '@/components/ui/button'

describe('Button', () => {
  it('renders with default variant', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByRole('button')).toBeInTheDocument()
  })
})
```

## Test Structure

**Suite Organization:**
- Vitest uses `describe()` blocks for test suites
- Tests use `it()` or `test()` for individual cases
- Follows standard Jest/Vitest conventions

**Patterns (to be established):**
- Setup: Use `beforeEach()` for React component setup
- Teardown: Use `afterEach()` for cleanup if needed
- Assertion: Use expect() with Testing Library matchers

## Mocking

**Framework:** Vitest's built-in mocking (compatible with MSW if needed)

**Patterns (inferred from dependencies):**
```typescript
// Component mocking with vitest
vi.mock('@/components/landing/email-capture', () => ({
  EmailCapture: () => <div>Mocked</div>
}))

// Testing Library's render with mock providers
import { render } from '@testing-library/react'
```

**What to Mock:**
- External API calls (if any are added)
- Router navigation (TanStack Router)
- Animation libraries (motion/react) - consider disabling for tests

**What NOT to Mock:**
- UI components in same codebase (test the real implementation)
- Utility functions like `cn()` (test actual behavior)
- Tailwind class application (side effect testing only if needed)

## Fixtures and Factories

**Test Data:**
- Landing copy is centralized in `src/content/landing.ts`
- Can be imported directly in tests: `import { heroCopy } from "@/content/landing"`
- No factory pattern currently needed (simple data objects)

**Location:**
- Content data: `src/content/landing.ts`
- Future fixtures: Would go in `src/__fixtures__/` or `src/[feature]/__fixtures__/`

## Coverage

**Requirements:** Not enforced

**View Coverage:**
```bash
npm run test -- --coverage     # Generate coverage report
```

**Current State:** No tests written, coverage at 0%

## Test Types

**Unit Tests:**
- Scope: Individual component and utility function testing
- Approach: React Testing Library focusing on user behavior, not implementation details
- Priority: Start with UI components and utility functions like `cn()`

**Integration Tests:**
- Scope: Multi-component interactions within route pages
- Approach: Render full page sections, test component composition
- Example: Test `HomePage` with all section components rendering together
- Current opportunity: `src/routes/index.tsx` integrates all landing sections

**E2E Tests:**
- Framework: Not configured
- Approach: Could use Playwright or Cypress if added
- Current use case: Not needed for static landing page

## Common Patterns (to Follow)

**Async Testing:**
```typescript
// For components with useEffect or motion animations
import { waitFor } from '@testing-library/react'

it('updates state after animation', async () => {
  render(<PaperHero />)
  await waitFor(() => {
    expect(screen.getByRole('button')).toBeInTheDocument()
  })
})
```

**Error Testing:**
```typescript
// For conditional error states
it('renders fallback when error occurs', () => {
  // Test error boundary or error state
  render(<ComponentWithError error={true} />)
  expect(screen.getByText(/error/i)).toBeInTheDocument()
})
```

**Motion/Animation Testing:**
```typescript
// Motion components might need special handling
import { render } from '@testing-library/react'

it('renders motion elements without animation', () => {
  // Motion/react respects prefers-reduced-motion in tests
  render(<PaperHero />)
  expect(screen.getByRole('button')).toBeInTheDocument()
})
```

## Setup Requirements

**Vitest Config (recommended addition):**
```typescript
// vitest.config.ts or vite.config.ts with test options
export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
  },
})
```

**Test Setup File (recommended):**
```typescript
// src/test/setup.ts
import '@testing-library/jest-dom'
import { expect, afterEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'

afterEach(cleanup)
```

## Current Testing State

**Status:** No tests currently written

**Files Needing Tests:**
- `src/components/ui/button.tsx` - Base UI component
- `src/components/ui/input.tsx` - Base UI component
- `src/lib/utils.ts` - Utility function `cn()`
- `src/components/landing/paper-hero.tsx` - Complex component with animations
- `src/components/landing/email-capture.tsx` - Form component
- `src/routes/index.tsx` - Page integration

**Priority Order:**
1. `cn()` utility - simplest, highest value
2. `Button`, `Input` components - foundational UI
3. `EmailCapture` - form component with user interaction
4. `HomePage` (index route) - integration test
5. `PaperHero` - complex animations (requires mocking/reduced motion)

## Testing Best Practices for this Codebase

**For Component Testing:**
- Use `screen.getByRole()` and `screen.getByText()` (avoids implementation details)
- Test Button variants by checking rendered attributes: `data-variant`, `data-size`
- Mock `motion/react` or rely on `prefers-reduced-motion` detection

**For Tailwind Components:**
- Don't assert on specific class names (they change with updates)
- Assert on visual outcomes: computed styles, DOM attributes, text content

**For Landing Page Components:**
- Use `vi.mock()` to isolate components and test in sections
- Test content from `src/content/landing.ts` is correctly rendered
- For animated sections, mock scroll position or use `prefers-reduced-motion`

---

*Testing analysis: 2026-04-28*
