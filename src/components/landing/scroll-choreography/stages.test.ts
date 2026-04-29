import { describe, expect, it } from "vitest"

import { STAGES, byId } from "./stages"

describe("STAGES data", () => {
  it("contains exactly 4 stages in narrative order", () => {
    expect(STAGES).toHaveLength(4)
    expect(STAGES.map((s) => s.id)).toEqual([
      "hero",
      "wow",
      "feature-a",
      "feature-b",
    ])
  })

  it("each stage has a [start, end] window with start < end and both in [0, 1]", () => {
    for (const stage of STAGES) {
      const [start, end] = stage.window
      expect(start).toBeGreaterThanOrEqual(0)
      expect(end).toBeLessThanOrEqual(1)
      expect(start).toBeLessThan(end)
    }
  })

  it("screen target presets cover the 4 named values", () => {
    const screens = STAGES.map((s) => s.screen)
    expect(screens).toContain("tiny")
    expect(screens).toContain("centered")
    expect(screens).toContain("docked-left")
    expect(screens).toContain("docked-right")
  })

  it("byId('hero') returns the hero stage", () => {
    expect(byId("hero").id).toBe("hero")
    expect(byId("hero").screen).toBe("tiny")
  })

  it("byId throws on an unknown id (defensive contract)", () => {
    // @ts-expect-error — intentional invalid id at runtime
    expect(() => byId("nope")).toThrow(/Unknown stage id/)
  })

  it("byId('wow').window[1] is retuned to the Phase 2 first-pass value (D-14)", () => {
    // Phase 2 D-14 retunes wow.window[1] to align with the moment the screen
    // visually covers the video. First-pass: [0.20, 0.78]. Plan 04 may adjust
    // during the visual-review checkpoint; if so, update this assertion AND
    // the CONTEXT.md D-14 entry together.
    expect(byId("wow").window[1]).toBeCloseTo(0.78, 2)
  })
})
