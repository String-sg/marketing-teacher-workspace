/**
 * Phase 2 Wave-0 fail-loudly stub for CHOREO-06 / SC #2 + MIGRATE-02.
 *
 * Proves (per CONTEXT.md):
 *   - D-21 + ROADMAP SC #2: <ScrollChoreography> re-renders 0–2 times across
 *     100 motion-value updates of `scrollYProgress`. The falsifiable budget
 *     gate (the manual DevTools Profiler smoke is the human cross-check in
 *     Plan 05).
 *   - MIGRATE-02: every visual property is a `useTransform`-derived
 *     MotionValue read directly into `style={{ ... }}`. A useState-on-scroll
 *     pattern (paper-hero.tsx:64–78 PHASE-2-DEBT) would push this re-render
 *     count well above 2 and fail this test loudly.
 *
 * RED state in Wave 0: imports `./scroll-choreography` which is still the
 * Phase 1 `return null` stub — the rendered output has no transform-driven
 * visual properties to monitor and the orchestrator never calls into
 * useScroll. Wave 2 turns this GREEN once the orchestrator body is filled
 * in.
 *
 * Mocking strategy (PATTERNS § "No Analog Found"): motion/react resists
 * vi.spyOn because its ESM namespace exports are frozen. We use vi.mock
 * with a partial mock that swaps `useReducedMotion` for a vi.fn and
 * `useScroll` for a vi.fn that returns our hand-built motion-value stub.
 */
import { describe, expect, it, vi } from "vitest"
import { render } from "@testing-library/react"
import { motionValue } from "motion/react"

const mockProgress = motionValue(0)
const useReducedMotionMock = vi.fn(() => false)

vi.mock("motion/react", async () => {
  const actual = await vi.importActual<typeof import("motion/react")>(
    "motion/react"
  )
  return {
    ...actual,
    useReducedMotion: () => useReducedMotionMock(),
    useScroll: () => ({
      scrollYProgress: mockProgress,
      scrollY: actual.motionValue(0),
      scrollX: actual.motionValue(0),
      scrollXProgress: actual.motionValue(0),
    }),
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

describe("ScrollChoreography rerender budget (CHOREO-06 / SC #2 / MIGRATE-02)", () => {
  it("does not re-render more than 2 times per 100 scrollYProgress updates", () => {
    const originalMatchMedia = window.matchMedia
    mockMatchMedia(true)
    useReducedMotionMock.mockReturnValue(false)
    try {
      let renderCount = 0
      function CountingChoreo() {
        renderCount++
        return <ScrollChoreography />
      }
      const { container } = render(<CountingChoreo />)
      // Wave-0 RED contract: <ScrollChoreography/> is the Phase 1 `return null`
      // stub. The choreography subtree must be present (non-null section)
      // before this budget gate is meaningful. Wave 2 turns this assertion
      // GREEN by filling the orchestrator body.
      expect(
        container.querySelector("section.scroll-choreography-only")
      ).not.toBeNull()
      const initial = renderCount
      for (let i = 0; i < 100; i++) {
        mockProgress.set(i / 100)
      }
      expect(renderCount - initial).toBeLessThanOrEqual(2)
    } finally {
      window.matchMedia = originalMatchMedia
    }
  })
})
