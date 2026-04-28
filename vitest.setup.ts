// Vitest setup for Phase 1 tests.
// If a future test wants `toBeInTheDocument()` etc., add `@testing-library/jest-dom` to devDependencies and import it here.

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
