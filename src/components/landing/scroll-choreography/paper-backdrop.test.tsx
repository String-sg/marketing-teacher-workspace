/**
 * Render-shape and orchestrator-wiring smoke tests for <PaperBackdrop>.
 *
 * Proves (per CONTEXT.md):
 *   - D-04 / D-05 / D-06: PaperBackdrop subscribes to scrollYProgress via
 *     ScrollChoreographyContext and renders the paper-card frame plus the
 *     hill backdrop and hand-drawn hero sketches.
 *   - CHOREO-06 / MIGRATE-02: opacity is motion-value driven (inline style
 *     attribute carries it) — no useState for visual properties.
 */
import { describe, expect, it } from "vitest"
import { render } from "@testing-library/react"
import { motionValue } from "motion/react"

import { ScrollChoreographyContext } from "./context"
import { PaperBackdrop } from "./paper-backdrop"
import { STAGES, byId } from "./stages"
import type { ScrollChoreographyContextValue } from "./types"

function renderWithMockProgress(progress = 0) {
  const mv = motionValue(progress)
  const value: ScrollChoreographyContextValue = {
    scrollYProgress: mv,
    paperCardScale: motionValue(1),
    stages: STAGES,
    reducedMotion: false,
    mode: "choreography",
  }
  const utils = render(
    <ScrollChoreographyContext.Provider value={value}>
      <PaperBackdrop />
    </ScrollChoreographyContext.Provider>
  )
  return { ...utils, scrollYProgress: mv }
}

describe("PaperBackdrop render shape", () => {
  it("renders the lush-hill backdrop image inside a <picture> with webp source", () => {
    const { container } = renderWithMockProgress(0)
    const picture = container.querySelector("picture")
    expect(picture).not.toBeNull()
    const webp = picture?.querySelector('source[type="image/webp"]')
    expect(webp?.getAttribute("srcSet")).toContain("/hero/hill-")
    const fallback = picture?.querySelector("img")
    expect(fallback?.getAttribute("src")).toBe("/hero/hill-1280.jpg")
  })

  it("renders both hand-drawn sketch overlays (cards + teacher)", () => {
    const { container } = renderWithMockProgress(0)
    const cards = container.querySelector(
      "img[src='/hero/hero-cards-sketch.svg']"
    )
    const teacher = container.querySelector(
      "img[src='/hero/hero-teacher-sketch.svg']"
    )
    expect(cards).not.toBeNull()
    expect(teacher).not.toBeNull()
  })
})

describe("PaperBackdrop motion-value-driven shape (CHOREO-06 / MIGRATE-02)", () => {
  it("renders the paper-card root with motion-value-driven inline style", () => {
    const { container } = renderWithMockProgress(byId("wow").window[1])
    const root = container.querySelector(".paper-card") as HTMLElement | null
    expect(root).not.toBeNull()
    // Asserts the post-mount element carries inline style (transform / opacity)
    // rather than a useState-derived className. The falsifiable budget gate
    // lives in choreography-rerender-budget.test.tsx — this is the smoke
    // assertion that the element is a motion.* node bound via style props.
    const inline = root?.getAttribute("style") ?? ""
    expect(inline.length).toBeGreaterThan(0)
  })
})
