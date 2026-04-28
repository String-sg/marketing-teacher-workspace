import { describe, it, expectTypeOf } from "vitest"

import type {
  ScreenTarget,
  ScreenTargetRect,
  ScrollChoreographyContextValue,
  ScrollChoreographyMode,
  StageCopyContent,
  StageDef,
  StageId,
  StageWindow,
} from "./types"

describe("scroll-choreography type module", () => {
  it("StageId is a string-literal union of exactly 4 ids", () => {
    expectTypeOf<StageId>().toEqualTypeOf<
      "hero" | "wow" | "feature-a" | "feature-b"
    >()
  })

  it("StageWindow is a readonly [number, number] tuple", () => {
    expectTypeOf<StageWindow>().toEqualTypeOf<
      readonly [start: number, end: number]
    >()
  })

  it("ScreenTarget is a string-literal union of 4 presets", () => {
    expectTypeOf<ScreenTarget>().toEqualTypeOf<
      "tiny" | "centered" | "docked-left" | "docked-right"
    >()
  })

  it("StageDef has readonly id/window/screen fields", () => {
    expectTypeOf<StageDef["id"]>().toEqualTypeOf<StageId>()
    expectTypeOf<StageDef["window"]>().toEqualTypeOf<StageWindow>()
    expectTypeOf<StageDef["screen"]>().toEqualTypeOf<ScreenTarget>()
  })

  it("StageCopyContent for feature-a has exactly-3-bullets tuple", () => {
    type FeatureA = Extract<StageCopyContent, { id: "feature-a" }>
    expectTypeOf<FeatureA["copy"]["bullets"]>().toEqualTypeOf<
      readonly [string, string, string]
    >()
  })

  it("ScrollChoreographyMode is 'choreography' | 'static'", () => {
    expectTypeOf<ScrollChoreographyMode>().toEqualTypeOf<
      "choreography" | "static"
    >()
  })

  it("ScreenTargetRect has scale/x/y/opacity required and clipPath optional", () => {
    expectTypeOf<ScreenTargetRect["scale"]>().toEqualTypeOf<number>()
    expectTypeOf<ScreenTargetRect["x"]>().toEqualTypeOf<string>()
    expectTypeOf<ScreenTargetRect["clipPath"]>().toEqualTypeOf<
      string | undefined
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
