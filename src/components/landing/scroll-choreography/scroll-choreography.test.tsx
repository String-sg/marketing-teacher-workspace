/**
 * Phase 2 Wave-0 fail-loudly stub for <ScrollChoreography>.
 *
 * Proves (per CONTEXT.md):
 *   - D-02 / D-21: 4-case mode-switch matrix (desktop × motion).
 *   - D-20: useScroll is called with `layoutEffect: false` (FOUND-04 contract).
 *     RESEARCH OQ-1: motion@12.38 may not recognize this option;
 *     verified end-to-end via `pnpm preview` in Plan 05.
 *   - D-18 / CHOREO-07: outer container carries `.scroll-choreography-only`
 *     class plus `lvh`-based height; inner sticky carries `svh` height.
 *
 * RED state in Wave 0: this file imports `./scroll-choreography` which is
 * still the Phase 1 `return null` stub, so render assertions for the
 * choreography branch fail. Wave 2 turns these GREEN.
 *
 * Mocking strategy (PATTERNS § "No Analog Found" — motion/react resists
 * vi.spyOn because its ESM namespace exports are frozen):
 *   - vi.mock("motion/react") with a partial mock that re-exports the real
 *     module while overriding `useReducedMotion` and `useScroll` with
 *     vi.fn()s we can configure per-test.
 */
import { describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"

const useReducedMotionMock = vi.fn(() => false)
const useScrollMock = vi.fn()

vi.mock("motion/react", async () => {
  const actual = await vi.importActual<typeof import("motion/react")>(
    "motion/react"
  )
  return {
    ...actual,
    useReducedMotion: () => useReducedMotionMock(),
    useScroll: (...args: Parameters<typeof actual.useScroll>) => {
      useScrollMock(...args)
      return actual.useScroll(...args)
    },
  }
})

import { ScrollChoreography } from "./scroll-choreography"

function mockMatchMedia(isDesktop: boolean) {
  window.matchMedia = vi.fn((query: string) => ({
    matches: isDesktop,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(() => false),
  })) as unknown as typeof window.matchMedia
}

describe("ScrollChoreography mode switch (D-02 / D-21)", () => {
  const cases = [
    { isDesktop: true, prefersReduced: false, branch: "choreography" },
    { isDesktop: true, prefersReduced: true, branch: "static" },
    { isDesktop: false, prefersReduced: false, branch: "static" },
    { isDesktop: false, prefersReduced: true, branch: "static" },
  ] as const

  it.each(cases)(
    "desktop=$isDesktop reduced=$prefersReduced -> $branch branch",
    ({ isDesktop, prefersReduced, branch }) => {
      const originalMatchMedia = window.matchMedia
      mockMatchMedia(isDesktop)
      useReducedMotionMock.mockReturnValue(prefersReduced)
      try {
        const { container } = render(<ScrollChoreography />)
        const choreoSection = container.querySelector(
          "section.scroll-choreography-only"
        )
        if (branch === "choreography") {
          expect(choreoSection).not.toBeNull()
        } else {
          // Static branch must render the static fallback (h1 reachable),
          // and MUST NOT render the choreography-only outer section.
          expect(choreoSection).toBeNull()
          const h1s = screen.getAllByRole("heading", { level: 1 })
          expect(h1s.length).toBeGreaterThanOrEqual(1)
        }
      } finally {
        useReducedMotionMock.mockReturnValue(false)
        window.matchMedia = originalMatchMedia
      }
    }
  )
})

describe("ScrollChoreography useScroll signature (FOUND-04 / OQ-1)", () => {
  it("calls useScroll with layoutEffect: false", () => {
    const originalMatchMedia = window.matchMedia
    mockMatchMedia(true)
    useReducedMotionMock.mockReturnValue(false)
    useScrollMock.mockClear()
    try {
      render(<ScrollChoreography />)
      // Note (RESEARCH OQ-1): motion@12.38 may not recognize this option,
      // but the call signature is the FOUND-04 contract Phase 1 documented.
      // Plan 05 verifies the runtime effect on `pnpm preview`.
      const sawLayoutEffectFalse = useScrollMock.mock.calls.some(
        (args) =>
          (args[0] as { layoutEffect?: boolean })?.layoutEffect === false
      )
      expect(sawLayoutEffectFalse).toBe(true)
    } finally {
      window.matchMedia = originalMatchMedia
    }
  })
})

describe("ScrollChoreography container shape (CHOREO-07 / D-18)", () => {
  it("tags outer section with .scroll-choreography-only and lvh height; inner sticky uses svh", () => {
    const originalMatchMedia = window.matchMedia
    mockMatchMedia(true)
    useReducedMotionMock.mockReturnValue(false)
    try {
      const { container } = render(<ScrollChoreography />)
      const section = container.querySelector(
        "section.scroll-choreography-only"
      )
      expect(section).not.toBeNull()
      const sectionClass = section?.className ?? ""
      expect(sectionClass).toMatch(/h-\[400lvh\]/)
      // header-stacking guarantee: outer section MUST NOT carry inline transform
      expect((section as HTMLElement | null)?.style.transform || "").toBe("")
      // inner sticky child uses h-svh (per D-18 / Pitfall #5)
      const sticky = container.querySelector("[class*='h-svh']")
      expect(sticky).not.toBeNull()
    } finally {
      window.matchMedia = originalMatchMedia
    }
  })
})
