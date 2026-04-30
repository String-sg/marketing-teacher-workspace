import type { MotionValue } from "motion/react"

/** The three scroll-driven stages, ordered by narrative beat. */
export type StageId = "hero" | "wow" | "docked"

/** Scroll-progress window: [enter, exit] in master scrollYProgress (0..1). */
export type StageWindow = readonly [start: number, end: number]

/**
 * A single choreography stage. Window defines where in master scroll
 * progress (0..1) this stage's hold lives; the morph between adjacent
 * stages happens in the gap between prev.window[1] and next.window[0].
 *
 * The rect fields (scale / x / y / opacity) describe the product-screen's
 * peak-of-stage transform target. ProductScreen's useTransform reads
 * these directly — no intermediate ScreenTarget preset layer.
 *
 * Conventions:
 *   - x sign: negative = leftward (toward viewport left), positive =
 *     rightward (toward viewport right). Values include CSS units (vw / vh)
 *     so motion's mix() interpolates them as units, not numbers.
 *   - Hero rect positions the screen over the laptop in the cartoon
 *     illustration (small scale + offset right + offset down).
 *   - Wow rect is the centered full-viewport reveal (scale 1, x/y "0").
 *   - Docked rect parks the screen on one side (positive x = right side).
 */
export type StageDef = {
  readonly id: StageId
  readonly window: StageWindow
  readonly scale: number
  readonly x: string
  readonly y: string
  readonly opacity: number
}

/**
 * Per-stage copy — discriminated union by `id` (per CONTEXT.md D-07).
 * The exact-3-bullets tuple enforces CONTENT-03/04 at compile time:
 * adding a fourth bullet to docked is a TypeScript error.
 */
export type BulletItem = {
  readonly title: string
  readonly body: string
}

export type CtaLink = {
  readonly label: string
  readonly href: string
}

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
      readonly id: "docked"
      readonly copy: {
        readonly kicker: string
        readonly heading: string
        readonly paragraph: string
        readonly bullets: readonly [BulletItem, BulletItem, BulletItem]
        readonly cta: CtaLink
      }
    }

/** Mode chosen at the orchestrator level. Phase 1 always renders "static". */
export type ScrollChoreographyMode = "choreography" | "static"

/**
 * Context value — Phase 1 ships the type and a stub provider (Plan 04).
 * Phase 2 wires `useScroll` and replaces the stub `MotionValue<number>`.
 *
 * `paperCardScale` is the shared MotionValue published by the
 * orchestrator so that <ProductScreen> (now bundled inside <PaperBackdrop>)
 * can divide its own transform by the same value to keep its visual
 * scale/translate stable inside the scaled paper-card. Outside dev /
 * production both PaperBackdrop and ProductScreen consume the same
 * instance — no duplication, no drift between two derivations.
 */
export type ScrollChoreographyContextValue = {
  readonly scrollYProgress: MotionValue<number>
  readonly paperCardScale: MotionValue<number>
  readonly stages: readonly StageDef[]
  readonly reducedMotion: boolean
  readonly mode: ScrollChoreographyMode
}
