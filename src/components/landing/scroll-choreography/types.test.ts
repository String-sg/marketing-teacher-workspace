import { describe, it, expectTypeOf } from "vitest"

import type {
  ScrollChoreographyContextValue,
  ScrollChoreographyMode,
  StageCopyContent,
  StageDef,
  StageId,
  StageWindow,
} from "./types"

describe("scroll-choreography type module", () => {
  it("StageId is a string-literal union of exactly 3 ids", () => {
    expectTypeOf<StageId>().toEqualTypeOf<"hero" | "wow" | "docked">()
  })

  it("StageWindow is a readonly [number, number] tuple", () => {
    expectTypeOf<StageWindow>().toEqualTypeOf<
      readonly [start: number, end: number]
    >()
  })

  it("StageDef has readonly id/window plus inlined rect fields (scale/x/y/opacity)", () => {
    expectTypeOf<StageDef["id"]>().toEqualTypeOf<StageId>()
    expectTypeOf<StageDef["window"]>().toEqualTypeOf<StageWindow>()
    expectTypeOf<StageDef["scale"]>().toEqualTypeOf<number>()
    expectTypeOf<StageDef["x"]>().toEqualTypeOf<string>()
    expectTypeOf<StageDef["y"]>().toEqualTypeOf<string>()
    expectTypeOf<StageDef["opacity"]>().toEqualTypeOf<number>()
  })

  it("StageCopyContent for docked has exactly-3-bullets tuple", () => {
    type Docked = Extract<StageCopyContent, { id: "docked" }>
    type Bullet = { readonly title: string; readonly body: string }
    expectTypeOf<Docked["copy"]["bullets"]>().toEqualTypeOf<
      readonly [Bullet, Bullet, Bullet]
    >()
  })

  it("ScrollChoreographyMode is 'choreography' | 'static'", () => {
    expectTypeOf<ScrollChoreographyMode>().toEqualTypeOf<
      "choreography" | "static"
    >()
  })

  it("ScrollChoreographyContextValue exposes all four required fields", () => {
    expectTypeOf<
      ScrollChoreographyContextValue["stages"]
    >().toEqualTypeOf<readonly StageDef[]>()
    expectTypeOf<
      ScrollChoreographyContextValue["reducedMotion"]
    >().toEqualTypeOf<boolean>()
    expectTypeOf<
      ScrollChoreographyContextValue["mode"]
    >().toEqualTypeOf<ScrollChoreographyMode>()
  })
})
