/**
 * Unit tests for <ProductScreen>.
 *
 * Covers:
 *   - CHOREO-01 mount stability: single motion.div, never unmounts, no
 *     shared-element layout-id attribute
 *   - 3-stage stitched morph (hero/wow/docked all emit visible state)
 *   - CHOREO-06 / D-10: visual props flow direct from useTransform into style
 *   - D-18 / VISUAL-02: browser-frame chrome (traffic lights + URL bar)
 *   - Pointer-events: disabled at every stage so the embedded demo is non-interactive.
 */
import { describe, expect, it } from "vitest"
import { render } from "@testing-library/react"
import { motionValue } from "motion/react"

import { ScrollChoreographyContext } from "./context"
import { ProductScreen } from "./product-screen"
import { STAGES } from "./stages"
import type { ScrollChoreographyContextValue } from "./types"

function renderWithMockProgress(progress = 0) {
  const mv = motionValue(progress)
  const value: ScrollChoreographyContextValue = {
    scrollYProgress: mv,
    bgScale: motionValue(1),
    cardsScale: motionValue(1),
    teacherScale: motionValue(1),
    stages: STAGES,
    reducedMotion: false,
    mode: "choreography",
  }
  const utils = render(
    <ScrollChoreographyContext.Provider value={value}>
      <ProductScreen />
    </ScrollChoreographyContext.Provider>
  )
  return { ...utils, scrollYProgress: mv }
}

describe("ProductScreen mount stability (CHOREO-01)", () => {
  it("the morphing element instance is the same node across scroll updates spanning all 3 stages", () => {
    const { scrollYProgress, container } = renderWithMockProgress(0)
    const initialNode = container.querySelector(
      '[data-testid="product-screen-frame"]'
    )
    expect(initialNode).not.toBeNull()

    // Probe one progress value inside each stage's hold + one mid-morph
    for (const p of [0.05, 0.35, 0.6, 0.8]) {
      scrollYProgress.set(p)
    }

    const currentNode = container.querySelector(
      '[data-testid="product-screen-frame"]'
    )
    expect(currentNode).toBe(initialNode)
  })

  it("contains no layoutId attribute on any rendered element", () => {
    const { container } = renderWithMockProgress(0)
    expect(container.querySelector("[layoutid]")).toBeNull()
    expect(container.querySelector("[data-layoutid]")).toBeNull()
    expect(container.innerHTML).not.toContain("layoutId=")
  })
})

describe("ProductScreen motion-value shape (CHOREO-06 / D-10)", () => {
  it("renders inline styles carrying motion-value-driven opacity, x (outer) and scale (inner)", () => {
    // Probe at progress=0.6 — inside the wow→docked morph zone where scale
    // interpolates 1.0→0.6 and x interpolates 0→+28cqi, so both axes
    // are guaranteed to emit non-identity transform values into the
    // inline style attribute.
    const { container } = renderWithMockProgress(0.6)
    const innerMorph = container.querySelector(
      '[data-testid="product-screen-frame"]'
    )
    expect(innerMorph).not.toBeNull()

    const innerStyle = innerMorph?.getAttribute("style") ?? ""
    expect(innerStyle).toMatch(/transform|scale/)

    const outerWrap = container.querySelector(
      '[data-testid="product-screen-outer"]'
    )
    const outerStyle = outerWrap?.getAttribute("style") ?? ""
    expect(`${innerStyle} ${outerStyle}`).toMatch(/opacity/)
  })
})

describe("ProductScreen browser-frame chrome (D-18 / VISUAL-02)", () => {
  it("renders the three Mac traffic-light dots (red/yellow/green)", () => {
    const { container } = renderWithMockProgress(0)
    const dots = container.querySelectorAll("span.size-3.rounded-full")
    expect(dots.length).toBeGreaterThanOrEqual(3)
  })

  it("renders the truncated TEACHER_WORKSPACE_APP_URL in the chrome", () => {
    const { container } = renderWithMockProgress(0)
    // The URL bar removes the leading https:// (D-18); we just assert that
    // *some* hostname-like text is present in a truncated slot.
    const urlSlot = container.querySelector("span.truncate")
    expect(urlSlot).not.toBeNull()
    expect(urlSlot?.textContent).toBeTruthy()
  })
})

describe("ProductScreen pointer-events", () => {
  it("disables pointer-events on the embedded demo at every stage", () => {
    for (const progress of [0.1, STAGES[1].window[0], 0.8]) {
      const { container, unmount } = renderWithMockProgress(progress)
      const outer = container.querySelector(
        '[data-testid="product-screen-outer"]'
      )
      const style = outer?.getAttribute("style") ?? ""
      expect(style).toMatch(/pointer-events:\s*none/)
      unmount()
    }
  })
})

describe("ProductScreen embedded app", () => {
  it("renders the live Student Insights app inside the frame (no static <picture>)", () => {
    const { container } = renderWithMockProgress(0)
    expect(container.querySelector("picture")).toBeNull()
    // Sidebar header text is a stable signal that the app mounted.
    expect(container.textContent).toContain("Teacher Workspace")
    expect(container.textContent).toContain("Student Insights")
  })
})
