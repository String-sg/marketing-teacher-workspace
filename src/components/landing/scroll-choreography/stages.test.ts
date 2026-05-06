import { describe, expect, it } from "vitest"

import { STAGES, byId } from "./stages"

describe("STAGES data", () => {
  it("contains exactly 3 stages in narrative order", () => {
    expect(STAGES).toHaveLength(3)
    expect(STAGES.map((s) => s.id)).toEqual(["hero", "wow", "docked"])
  })

  it("each stage has a [start, end] window with start < end and both in [0, 1]", () => {
    for (const stage of STAGES) {
      const [start, end] = stage.window
      expect(start).toBeGreaterThanOrEqual(0)
      expect(end).toBeLessThanOrEqual(1)
      expect(start).toBeLessThan(end)
    }
  })

  it("each stage carries inlined rect fields (scale/x/y/opacity)", () => {
    for (const stage of STAGES) {
      expect(typeof stage.scale).toBe("number")
      expect(typeof stage.x).toBe("string")
      expect(typeof stage.y).toBe("string")
      expect(typeof stage.opacity).toBe("number")
    }
  })

  it("byId('hero') returns the hero stage with tiny-laptop rect", () => {
    const hero = byId("hero")
    expect(hero.id).toBe("hero")
    expect(hero.scale).toBeGreaterThan(0)
    expect(hero.scale).toBeLessThan(0.2)
    // cqi anchors translates to the aspect-locked frame (paper-backdrop)
    // so alignment holds across viewport aspects.
    expect(hero.x).toMatch(/^[+-]?[\d.]+cqi$/)
    expect(hero.y).toMatch(/^[+-]?[\d.]+cqi$/)
    expect(hero.opacity).toBe(1)
  })

  it("byId throws on an unknown id (defensive contract)", () => {
    // @ts-expect-error — intentional invalid id at runtime
    expect(() => byId("nope")).toThrow(/Unknown stage id/)
  })

  it("byId('wow').window[1] is the wow plateau end", () => {
    expect(byId("wow").window[1]).toBeCloseTo(0.62, 2)
  })

  it("STAGES windows are monotonic non-overlapping (D-02)", () => {
    for (let i = 0; i < STAGES.length - 1; i++) {
      const prev = STAGES[i]
      const next = STAGES[i + 1]
      expect(prev.window[1]).toBeLessThan(next.window[0])
    }
  })

  it("STAGES window endpoints match the current schedule", () => {
    expect(byId("hero").window).toEqual([0, 0.21])
    expect(byId("wow").window).toEqual([0.57, 0.62])
    expect(byId("docked").window).toEqual([0.63, 0.98])
  })

  it("wow rect — centered full-viewport reveal", () => {
    const w = byId("wow")
    expect(w.scale).toBe(1.0)
    expect(w.opacity).toBe(1)
    expect(w.x).toBe("0cqi")
    expect(w.y).toBe("0cqi")
  })

  it("docked rect — positive-rightward sign, scale 0.5", () => {
    const d = byId("docked")
    expect(d.scale).toBe(0.5)
    expect(d.opacity).toBe(1)
    expect(d.x).toBe("+28cqi")
  })

  // Scenery layers (bg/cards/teacher) are locked to the product-screen
  // scale via teacherScale = STAGES.scale / STAGES[0].scale (see
  // ChoreographyContextShell). Tweaking the hero baseline is a load-
  // bearing change — fail loudly if it drifts so the lock derivation
  // gets reviewed alongside.
  it("STAGES[0].scale is the lock baseline (0.05)", () => {
    expect(STAGES[0].scale).toBe(0.05)
  })

  it("non-hero scales are exact integer multiples of the lock baseline", () => {
    const baseline = STAGES[0].scale
    expect(STAGES[1].scale / baseline).toBeCloseTo(20, 4)
    expect(STAGES[2].scale / baseline).toBeCloseTo(10, 4)
  })

  // Re-derives the production lock formula:
  //   teacherScale = STAGES.scale / STAGES[0].scale
  //   compensatedScale = STAGES.scale / teacherScale  (in product-screen.tsx)
  // The compensation must collapse to a constant equal to the hero baseline
  // for every stage — this is what keeps the screen visually glued to the
  // laptop in the SVG regardless of where in the timeline we are.
  it("lock invariant: compensatedScale === hero baseline at every stage", () => {
    const baseline = STAGES[0].scale
    for (const stage of STAGES) {
      const teacherScaleAtStage = stage.scale / baseline
      const compensated = stage.scale / teacherScaleAtStage
      expect(compensated).toBeCloseTo(baseline, 6)
    }
  })
})
