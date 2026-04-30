/**
 * Phase 2 Wave-0 fail-loudly stub for <PaperBackdrop>.
 *
 * Proves (per CONTEXT.md):
 *   - D-04 / D-05 / D-06: PaperBackdrop subscribes to scrollYProgress via
 *     ScrollChoreographyContext and renders the paper-card frame +
 *     illustration/video + clouds.
 *   - MIGRATE-01 + CHOREO-02: render shape includes the autoplay-loop video
 *     element with the locked src/poster, plus two cloud images.
 *   - D-15 / D-16 / CHOREO-08 (revised 2026-04-29): video gate threshold
 *     cross at `byId("wow").window[1]` — above threshold pauses the video;
 *     below threshold resumes the loop via .play(). The video element
 *     carries `autoPlay` + `loop` so the active behavior is a continuous
 *     loop (no longer scroll-scrubbed).
 *   - CHOREO-06 / MIGRATE-02: opacity is motion-value driven (inline style
 *     attribute carries it) — no useState for visual properties.
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
  it("renders the autoplay-loop video element with the locked src and poster", () => {
    const { container } = renderWithMockProgress(0)
    const video = container.querySelector("video")
    expect(video).not.toBeNull()
    expect(video?.getAttribute("src")).toBe("/hero/teacher-working.mp4")
    expect(video?.getAttribute("poster")).toBe("/hero/teacher-illustration.png")
    // 2026-04-29 scope shift: the video plays continuously (no longer
    // scroll-scrubbed). React's HTMLVideoElement renders the boolean attrs
    // present-with-empty-string when set; assert via the property surface.
    expect(video?.autoplay).toBe(true)
    expect(video?.loop).toBe(true)
    expect(video?.muted).toBe(true)
    expect(video?.playsInline).toBe(true)
  })

  it("renders both cloud images (left + right) using cloud-halftone.png", () => {
    const { container } = renderWithMockProgress(0)
    const clouds = container.querySelectorAll(
      "img[src='/hero/cloud-halftone.png']"
    )
    expect(clouds.length).toBe(2)
  })
})

describe("PaperBackdrop video gate (D-15 / D-16 / CHOREO-08, revised 2026-04-29)", () => {
  it("pauses video when scrollYProgress crosses byId('wow').window[1]", () => {
    const { scrollYProgress, container } = renderWithMockProgress(0)
    const video = container.querySelector("video") as HTMLVideoElement
    const pauseSpy = vi.spyOn(video, "pause").mockImplementation(() => {
      Object.defineProperty(video, "paused", { value: true, configurable: true })
    })
    // Pre-cross: simulate the autoplay state (the real element auto-plays
    // on mount; jsdom does not run media, so we set `paused=false` manually).
    Object.defineProperty(video, "paused", { value: false, configurable: true })
    scrollYProgress.set(byId("wow").window[1] + 0.01)
    expect(pauseSpy).toHaveBeenCalled()
  })

  it("calls play() when scrollYProgress drops below the gate threshold", () => {
    const { scrollYProgress, container } = renderWithMockProgress(
      byId("wow").window[1] + 0.05
    )
    const video = container.querySelector("video") as HTMLVideoElement
    const playSpy = vi
      .spyOn(video, "play")
      .mockImplementation(() => Promise.resolve())
    // Above-threshold render leaves the gate having paused the video; in
    // jsdom we mark it explicitly so the next event sees paused=true and
    // can decide to call play().
    Object.defineProperty(video, "paused", { value: true, configurable: true })
    scrollYProgress.set(byId("wow").window[1] - 0.05)
    expect(playSpy).toHaveBeenCalled()
  })

  it("does not write video.currentTime (the autoplay-loop scope shift removed scrubbing)", () => {
    const { scrollYProgress, container } = renderWithMockProgress(0)
    const video = container.querySelector("video") as HTMLVideoElement
    const setSpy = vi.spyOn(video, "currentTime", "set")
    Object.defineProperty(video, "paused", { value: false, configurable: true })
    scrollYProgress.set(0.3)
    scrollYProgress.set(0.5)
    scrollYProgress.set(0.7)
    expect(setSpy).not.toHaveBeenCalled()
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
