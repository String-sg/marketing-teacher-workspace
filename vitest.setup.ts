import { afterEach } from "vitest"
import { cleanup } from "@testing-library/react"

// Vitest setup for Phase 1 tests.
// If a future test wants `toBeInTheDocument()` etc., add `@testing-library/jest-dom` to devDependencies and import it here.

// @testing-library/react auto-wires cleanup only when vitest globals:true.
// With globals:false we wire it manually so jsdom is cleared after each test
// and "multiple elements found" false-positives don't occur when tests run
// together in a file.
afterEach(cleanup)

// jsdom does not implement window.matchMedia. Provide a minimal stub so that
// hooks calling window.matchMedia (e.g. useIsDesktop) do not throw in tests.
// Returns matches: true (desktop) so useIsDesktop() stays at its optimistic
// default in the test environment. Individual tests can override via
// vi.spyOn(window, "matchMedia") when they need specific behavior.
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: true,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
})
