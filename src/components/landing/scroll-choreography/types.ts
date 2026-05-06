import type { MotionValue } from "motion/react"

export type StageId = "hero" | "wow" | "docked"

export type StageWindow = readonly [start: number, end: number]

export type StageDef = {
  readonly id: StageId
  readonly window: StageWindow
  readonly scale: number
  readonly x: string
  readonly y: string
  readonly opacity: number
}

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

export type ScrollChoreographyMode = "choreography" | "static"

export type ScrollChoreographyContextValue = {
  readonly scrollYProgress: MotionValue<number>
  readonly bgScale: MotionValue<number>
  readonly cardsScale: MotionValue<number>
  readonly teacherScale: MotionValue<number>
  readonly stages: readonly StageDef[]
  readonly reducedMotion: boolean
  readonly mode: ScrollChoreographyMode
}
