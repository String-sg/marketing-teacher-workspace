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
  it("renders the sky-image backdrop on the bgScale layer", () => {
    const { container } = renderWithMockProgress(0)
    // Sky background lives on the same motion.div that carries bgScale.
    // The sky image (image-set with AVIF + WebP) is applied via the
    // hero-sky-bg utility class defined in styles.css.
    const root = container.querySelector(
      "[data-testid='paper-backdrop']"
    ) as HTMLElement | null
    const bgLayer = root?.firstElementChild as HTMLElement | null
    expect(bgLayer).not.toBeNull()
    const cls = bgLayer?.className ?? ""
    expect(cls).toMatch(/hero-sky-bg/)
    // Hill picture must be gone — sky image replaces the photographic
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

describe("PaperBackdrop scenery opacity lock", () => {
  it("teacher + cards sketches fade out by docked window end so they don't bleed over the docked product screen", () => {
    const { container } = renderWithMockProgress(byId("docked").window[1])
    const cards = container.querySelector(
      "img[src='/hero/hero-cards-sketch.svg']"
    ) as HTMLElement | null
    const teacher = container.querySelector(
      "img[src='/hero/hero-teacher-sketch.svg']"
    ) as HTMLElement | null
    expect(cards).not.toBeNull()
    expect(teacher).not.toBeNull()

    // The shared `stageOpacity` MotionValue applied to both SVG imgs reaches
    // 0 at any progress >= opacityFadeEnd (0.48 default). docked.window[1]
    // (1.0) is well past that, so both sketches must be fully transparent.
    expect(cards?.style.opacity).toBe("0")
    expect(teacher?.style.opacity).toBe("0")
  })
})

describe("PaperBackdrop motion-value-driven shape (CHOREO-06 / MIGRATE-02)", () => {
  it("renders motion-value-driven inline styles on the per-layer scale wrappers", () => {
    const { container } = renderWithMockProgress(byId("wow").window[1])
    const root = container.querySelector(
      "[data-testid='paper-backdrop']"
    ) as HTMLElement | null
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
