/**
 * Phase 2 Wave-0 fail-loudly stub for <PaperBackdrop>.
 *
 * Proves (per CONTEXT.md):
 *   - D-04 / D-05 / D-06: PaperBackdrop subscribes to scrollYProgress via
 *     ScrollChoreographyContext and renders the paper-card frame +
 *     illustration/video + clouds.
 *   - MIGRATE-01 + CHOREO-02: render shape includes the existing video src,
 *     poster, and two cloud images.
 *   - D-15 / D-16 / CHOREO-08: video gate threshold cross at
 *     `byId("wow").window[1]` — above threshold pauses video and stops
 *     currentTime writes; below threshold resumes them.
 *   - D-17: loadedmetadata effect attaches on mount and cleans up on unmount.
 *   - CHOREO-06 / MIGRATE-02: opacity is motion-value driven (inline style
 *     attribute carries it) — no useState for visual properties.
 *
 * RED state in Wave 0: imports `./paper-backdrop` which does not yet exist.
 * Wave 1 (Plan 02) lands the source file.
 */
import { describe, expect, it, vi } from "vitest"
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

describe("PaperBackdrop render shape (MIGRATE-01 / CHOREO-02)", () => {
  it("renders the scroll-linked video element with the locked src and poster", () => {
    const { container } = renderWithMockProgress(0)
    const video = container.querySelector("video")
    expect(video).not.toBeNull()
    expect(video?.getAttribute("src")).toBe("/hero/teacher-working.mp4")
    expect(video?.getAttribute("poster")).toBe("/hero/teacher-illustration.png")
  })

  it("renders both cloud images (left + right) using cloud-halftone.png", () => {
    const { container } = renderWithMockProgress(0)
    const clouds = container.querySelectorAll(
      "img[src='/hero/cloud-halftone.png']"
    )
    expect(clouds.length).toBe(2)
  })
})

describe("PaperBackdrop video gate (D-15 / D-16 / CHOREO-08)", () => {
  it("pauses video when scrollYProgress crosses byId('wow').window[1]", () => {
    const { scrollYProgress, container } = renderWithMockProgress(0)
    const video = container.querySelector("video") as HTMLVideoElement
    Object.defineProperty(video, "duration", {
      value: 5,
      configurable: true,
    })
    video.dispatchEvent(new Event("loadedmetadata"))
    const pauseSpy = vi.spyOn(video, "pause")
    scrollYProgress.set(byId("wow").window[1] + 0.01)
    expect(pauseSpy).toHaveBeenCalled()
  })

  it("writes currentTime when scrollYProgress is below the gate threshold", () => {
    const { scrollYProgress, container } = renderWithMockProgress(
      byId("wow").window[1] + 0.05
    )
    const video = container.querySelector("video") as HTMLVideoElement
    Object.defineProperty(video, "duration", {
      value: 5,
      configurable: true,
    })
    video.dispatchEvent(new Event("loadedmetadata"))
    const setSpy = vi.spyOn(video, "currentTime", "set")
    scrollYProgress.set(0.3)
    expect(setSpy).toHaveBeenCalled()
  })
})

describe("PaperBackdrop loadedmetadata effect lifecycle (D-17)", () => {
  it("removes the loadedmetadata listener on unmount", () => {
    const { container, unmount } = renderWithMockProgress(0)
    const video = container.querySelector("video") as HTMLVideoElement
    const removeSpy = vi.spyOn(video, "removeEventListener")
    unmount()
    const calls = removeSpy.mock.calls.filter((c) => c[0] === "loadedmetadata")
    expect(calls.length).toBeGreaterThanOrEqual(1)
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
