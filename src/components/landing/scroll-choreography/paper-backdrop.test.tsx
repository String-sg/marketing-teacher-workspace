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
    bgScale: motionValue(1),
    cardsScale: motionValue(1),
    teacherScale: motionValue(1),
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
  it("renders the sky-gradient backdrop on the bgScale layer", () => {
    const { container } = renderWithMockProgress(0)
    // Sky gradient lives on the same motion.div that carries bgScale —
    // identifiable as the wrapper of the cards-sketch's parent path. The
    // outer rounded layer carries Tailwind's bg-gradient-to-b utility plus
    // arbitrary-value sky stops.
    const root = container.querySelector(".paper-card") as HTMLElement | null
    const bgLayer = root?.firstElementChild as HTMLElement | null
    expect(bgLayer).not.toBeNull()
    const cls = bgLayer?.className ?? ""
    expect(cls).toMatch(/bg-gradient-to-b/)
    expect(cls).toMatch(/from-/)
    expect(cls).toMatch(/to-/)
    // Hill picture must be gone — sky gradient replaces the photographic
    // backdrop entirely. Scope to the bg layer; ProductScreen has its own
    // <picture> deeper in the tree.
    expect(bgLayer?.querySelector("picture")).toBeNull()
    expect(bgLayer?.querySelector("img[src*='hill']")).toBeNull()
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
  it("renders motion-value-driven inline styles on the per-layer scale wrappers", () => {
    const { container } = renderWithMockProgress(byId("wow").window[1])
    const root = container.querySelector(".paper-card") as HTMLElement | null
    expect(root).not.toBeNull()

    // After the layer-zoom refactor, scale lives on three inner motion.divs
    // (bg / cards / teacher) instead of the outer paper-card. Each sketch
    // sits inside a motion.div whose parent therefore carries inline style.
    // Asserts the post-mount element tree binds visual props via style props
    // rather than useState-derived classes — the equivalent of the previous
    // outer-element assertion. The falsifiable budget gate lives in
    // choreography-rerender-budget.test.tsx.
    const cards = root?.querySelector("img[src='/hero/hero-cards-sketch.svg']")
    const cardsLayer = cards?.parentElement as HTMLElement | null
    const cardsStyle = cardsLayer?.getAttribute("style") ?? ""
    expect(cardsStyle.length).toBeGreaterThan(0)

    const teacher = root?.querySelector(
      "img[src='/hero/hero-teacher-sketch.svg']"
    )
    const teacherLayer = teacher?.parentElement as HTMLElement | null
    const teacherStyle = teacherLayer?.getAttribute("style") ?? ""
    expect(teacherStyle.length).toBeGreaterThan(0)
  })
})
