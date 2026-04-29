/**
 * Phase 2 Wave-0 fail-loudly stub for <ProductScreen>.
 *
 * Proves (per CONTEXT.md):
 *   - D-08 / D-21 / CHOREO-01: the morphing motion.div instance survives
 *     across simulated scroll updates — same DOM-node identity at progress
 *     0.1, 0.3, 0.5, 0.7, 0.95 (mount-counter / never-unmounts gate).
 *   - D-10 / MIGRATE-02: visual props (opacity, transform/scale) come from
 *     motion-value `useTransform` outputs (no React state).
 *   - D-09: Phase 2 only animates hero -> wow; no docked-left or docked-right
 *     state machine yet (Phase 3 territory).
 *   - CHOREO-01: NO `layoutId` attribute — the element is a single shared
 *     `motion.div` that never unmounts.
 *
 * RED state in Wave 0: imports `./product-screen` which does not yet exist.
 * Wave 1 (Plan 03) lands the source file.
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

describe("ProductScreen mount stability (CHOREO-01 / D-21)", () => {
  it("the morphing element instance is the same node across 5 scroll updates", () => {
    const { scrollYProgress, container } = renderWithMockProgress(0)
    const initialNode = container
      .querySelector("img[src='/hero/profiles-screen.png']")
      ?.parentElement
    expect(initialNode).not.toBeNull()

    for (const p of [0.1, 0.3, 0.5, 0.7, 0.95]) {
      scrollYProgress.set(p)
    }

    const currentNode = container
      .querySelector("img[src='/hero/profiles-screen.png']")
      ?.parentElement
    expect(currentNode).toBe(initialNode)
  })
})

describe("ProductScreen motion-value shape (MIGRATE-02 / D-10)", () => {
  it("renders inline style carrying motion-value-driven opacity and scale transform", () => {
    const { container } = renderWithMockProgress(0.5)
    const morphRoot = container
      .querySelector("img[src='/hero/profiles-screen.png']")
      ?.parentElement as HTMLElement | null
    expect(morphRoot).not.toBeNull()
    const inline = morphRoot?.getAttribute("style") ?? ""
    expect(inline).toMatch(/transform|scale/)
    // The outer wrapper carries `style={{ opacity: screenOpacity }}`; the
    // morphing motion.div carries `style={{ scale: screenScale }}`. We assert
    // that one of them carries opacity inline (motion-value driven).
    const outerWrap = morphRoot?.parentElement as HTMLElement | null
    const outerInline = outerWrap?.getAttribute("style") ?? ""
    expect(`${inline} ${outerInline}`).toMatch(/opacity/)
  })
})

describe("ProductScreen Phase 2 stage scope (D-09)", () => {
  it("renders the product screenshot and does not yet emit feature-a/feature-b stage markers", () => {
    const { container } = renderWithMockProgress(0)
    expect(
      container.querySelector("img[src='/hero/profiles-screen.png']")
    ).not.toBeNull()
    expect(container.querySelector("[data-stage='feature-a']")).toBeNull()
    expect(container.querySelector("[data-stage='feature-b']")).toBeNull()
  })
})

describe("ProductScreen has no layoutId (CHOREO-01)", () => {
  it("contains no layoutId attribute on any rendered element", () => {
    const { container } = renderWithMockProgress(0)
    expect(container.querySelector("[layoutid]")).toBeNull()
    expect(container.querySelector("[data-layoutid]")).toBeNull()
    // Defensive: the literal string "layoutId=" must not appear in the
    // rendered output (would indicate a JSX-level layoutId binding).
    expect(container.innerHTML).not.toContain("layoutId=")
  })
})
