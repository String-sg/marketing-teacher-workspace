import { describe, expect, it } from "vitest"

import { SCREEN_TARGETS, STAGES, byId } from "./stages"

describe("STAGES data", () => {
  it("contains exactly 3 stages in narrative order", () => {
    expect(STAGES).toHaveLength(3)
    expect(STAGES.map((s) => s.id)).toEqual(["hero", "wow", "feature-a"])
  })

  it("each stage has a [start, end] window with start < end and both in [0, 1]", () => {
    for (const stage of STAGES) {
      const [start, end] = stage.window
      expect(start).toBeGreaterThanOrEqual(0)
      expect(end).toBeLessThanOrEqual(1)
      expect(start).toBeLessThan(end)
    }
  })

  it("screen target presets cover the 3 named values", () => {
    const screens = STAGES.map((s) => s.screen)
    expect(screens).toContain("tiny")
    expect(screens).toContain("centered")
    expect(screens).toContain("docked-left")
  })

  it("byId('hero') returns the hero stage", () => {
    expect(byId("hero").id).toBe("hero")
    expect(byId("hero").screen).toBe("tiny")
  })

  it("byId throws on an unknown id (defensive contract)", () => {
    // @ts-expect-error — intentional invalid id at runtime
    expect(() => byId("nope")).toThrow(/Unknown stage id/)
  })

  it("byId('wow').window[1] is the wow plateau end (0.55)", () => {
    // wow.window[1] is the single value PaperBackdrop's
    // VIDEO_GATE_THRESHOLD auto-tracks (D-21).
    expect(byId("wow").window[1]).toBeCloseTo(0.55, 2)
  })

  it("STAGES windows are monotonic non-overlapping (D-02)", () => {
    // For each adjacent pair, prev.window[1] must be < next.window[0].
    // This invariant is what enables window-edge keyframe stitching
    // (D-01) — adjacent stages have a clean morph zone between holds.
    for (let i = 0; i < STAGES.length - 1; i++) {
      const prev = STAGES[i]
      const next = STAGES[i + 1]
      expect(prev.window[1]).toBeLessThan(next.window[0])
    }
  })

  it("STAGES window endpoints exactly match the D-02 schedule", () => {
    expect(byId("hero").window).toEqual([0, 0.15])
    expect(byId("wow").window).toEqual([0.25, 0.55])
    expect(byId("feature-a").window).toEqual([0.65, 1])
  })
})

describe("SCREEN_TARGETS map (D-04 / D-08)", () => {
  it("has exactly the 3 named ScreenTarget keys", () => {
    expect(Object.keys(SCREEN_TARGETS).sort()).toEqual([
      "centered",
      "docked-left",
      "tiny",
    ])
  })

  it("tiny target — laptop-overlay contract: visible, small, offset over the cartoon laptop", () => {
    const t = SCREEN_TARGETS["tiny"]
    // tiny is the laptop overlay at hero stage. Opacity=1 (visible),
    // small scale to fit the cartoon laptop's screen, x/y offsets in
    // vw/vh that translate the centered ProductScreen to sit over the
    // laptop in the paper-card illustration.
    expect(t.opacity).toBe(1)
    expect(t.scale).toBeGreaterThan(0)
    expect(t.scale).toBeLessThan(0.2)
    expect(t.x).toMatch(/^[+-]?[\d.]+vw$/)
    expect(t.y).toMatch(/^[+-]?[\d.]+vh$/)
  })

  it("centered target — wow plateau: scale = 1.00, opacity = 1, x = '0'", () => {
    const c = SCREEN_TARGETS["centered"]
    expect(c.scale).toBe(1.0)
    expect(c.opacity).toBe(1)
    expect(c.x).toBe("0")
  })

  it("docked-left target — D-07 negative-leftward sign, scale 0.5", () => {
    const dl = SCREEN_TARGETS["docked-left"]
    expect(dl.scale).toBe(0.5)
    expect(dl.opacity).toBe(1)
    expect(dl.x).toBe("-28vw")
  })
})
