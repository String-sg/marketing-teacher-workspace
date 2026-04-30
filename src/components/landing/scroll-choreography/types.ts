import type { MotionValue } from "motion/react"

/** The three scroll-driven stages, ordered by narrative beat. */
export type StageId = "hero" | "wow" | "feature-a"

/** Scroll-progress window: [enter, exit] in master scrollYProgress (0..1). */
export type StageWindow = readonly [start: number, end: number]

/** Named layout target for the shared product screen at this stage's peak. */
export type ScreenTarget =
  | "tiny" // hero — small inside the illustration
  | "centered" // wow — near-full-viewport reveal
  | "docked-left" // feature-a — docked one side

/**
 * Shape filled in Phase 3 — declared in Phase 1 as a type-only contract.
 * Phase 3's <ProductScreen> resolves preset → rect at runtime.
 */
export type ScreenTargetRect = {
  readonly scale: number
  readonly x: string
  readonly y: string
  readonly opacity: number
  readonly clipPath?: string
}

/** A single choreography stage's structural definition. */
export type StageDef = {
  readonly id: StageId
  readonly window: StageWindow
  readonly screen: ScreenTarget
}

/**
 * Per-stage copy — discriminated union by `id` (per CONTEXT.md D-07).
 * The exact-3-bullets tuple enforces CONTENT-03/04 at compile time:
 * adding a fourth bullet to feature-a or feature-b is a TypeScript error.
 */
export type StageCopyContent =
  | {
      readonly id: "hero"
      readonly copy: {
        readonly headline: string
        readonly subline: string
      }
    }
  | {
      readonly id: "wow"
      readonly copy: { readonly caption?: string }
    }
  | {
      readonly id: "feature-a"
      readonly copy: {
        readonly kicker: string
        readonly heading: string
        readonly paragraph: string
        readonly bullets: readonly [string, string, string]
      }
    }

/** Mode chosen at the orchestrator level. Phase 1 always renders "static". */
export type ScrollChoreographyMode = "choreography" | "static"

/**
 * Context value — Phase 1 ships the type and a stub provider (Plan 04).
 * Phase 2 wires `useScroll` and replaces the stub `MotionValue<number>`.
 */
export type ScrollChoreographyContextValue = {
  readonly scrollYProgress: MotionValue<number>
  readonly stages: readonly StageDef[]
  readonly reducedMotion: boolean
  readonly mode: ScrollChoreographyMode
}
