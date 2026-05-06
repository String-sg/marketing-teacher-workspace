// Product-UI shared element — single mount across the 3-stage morph.
//
// The screen lives inside the teacher motion.div which carries
// teacherScale and transformOrigin "50% paperOriginY%" (default 68%,
// the laptop position in the SVG). Under the choreography lock
// (teacherScale = screenScale / HERO_SCREEN_SCALE), the laptop's
// viewport position is invariant under teacher scaling because it sits
// at the transform origin. So compensating the screen's translate +
// scale to undo teacher's transform places it in viewport space, and
// at hero+wow the viewport target (from HERO.x / HERO.y) coincides
// with the laptop — i.e. the screen is glued to the laptop while
// scaling together with the teacher illustration.
//
// Through hero+wow the position holds at HERO local (laptop). At the
// wow→docked seam, x/y morph to DOCKED local — landing the screen on
// the right of the viewport at scale 0.5 alongside the docked feature
// copy. The screen scale interpolates HERO.scale → WOW.scale →
// DOCKED.scale across all three windows, driving teacher's lock-step
// scaling and the cinematic zoom into the laptop.
import { motion, useTransform } from "motion/react"

import { useScrollChoreography } from "./context"
import { useFlowStages, usePaperCardConfig } from "./dev-flow-context"
import { EASE_WOW_TO_DOCKED, LINEAR, SCALE_EASES } from "./eases"
import { StudentInsightsApp } from "./student-insights-app/app"

import { TEACHER_WORKSPACE_APP_URL } from "@/content/landing"

const POSITION_EASES = [
  LINEAR, // hero hold
  EASE_WOW_TO_DOCKED, // wow→docked morph
  LINEAR, // docked hold
]

const OPACITY_EASES = [
  LINEAR, // hero hold
  LINEAR, // hero→wow
  LINEAR, // wow hold
  LINEAR, // wow→docked
  LINEAR, // docked hold
]

// Frame is aspect-locked 16:10. Frame width = 100cqi, frame height =
// 62.5cqi. Frame vertical center is at 31.25cqi.
const FRAME_HEIGHT_CQI = 62.5
const FRAME_CENTER_Y_CQI = FRAME_HEIGHT_CQI / 2

function parseCssLength(value: string): number {
  const match = value.match(/^([+-]?\d+(?:\.\d+)?)/)
  return match ? parseFloat(match[1]) : 0
}

// compensatedX = xCqi / scale. At St=1 collapses to xCqi.
function divideCssLength(value: string, scale: number): string {
  if (scale === 0 || !Number.isFinite(scale)) return value
  const match = value.match(/^([+-]?\d+(?:\.\d+)?)([a-z%]*)$/i)
  if (!match) return value
  const num = parseFloat(match[1])
  const unit = match[2]
  if (num === 0) return "0"
  const compensated = num / scale
  const rounded = Math.round(compensated * 10000) / 10000
  return `${rounded}${unit}`
}

// compensatedY = (originY_cqi - centerY_cqi)*(1 - 1/St) + yCqi/St.
// This formula composes with the parent scale + transformOrigin so
// visual_y = frameCenterY + yCqi at every St. yCqi inputs are stage
// y values (offset from frame center). At St=1 collapses to yCqi.
function compensateYTranslate(
  yStr: string,
  scale: number,
  paperOriginYPct: number
): string {
  if (scale === 0 || !Number.isFinite(scale)) return yStr
  const yCqi = parseCssLength(yStr)
  const originYCqi = (paperOriginYPct / 100) * FRAME_HEIGHT_CQI
  const originOffsetFromCenter = originYCqi - FRAME_CENTER_Y_CQI
  const tyCqi = originOffsetFromCenter * (1 - 1 / scale) + yCqi / scale
  const rounded = Math.round(tyCqi * 10000) / 10000
  return `${rounded}cqi`
}

export function ProductScreen() {
  const { scrollYProgress, teacherScale } = useScrollChoreography()
  const STAGES = useFlowStages()
  const paper = usePaperCardConfig()
  const HERO = STAGES[0]
  const WOW = STAGES[1]
  const DOCKED = STAGES[2]

  // Position held at HERO through wow.end; morphs to DOCKED across the
  // wow→docked seam. Keeps the screen glued to the laptop through hero
  // and wow plateaus.
  const x = useTransform(
    scrollYProgress,
    [HERO.window[0], WOW.window[1], DOCKED.window[0], DOCKED.window[1]],
    [HERO.x, HERO.x, DOCKED.x, DOCKED.x],
    { ease: POSITION_EASES }
  )
  const y = useTransform(
    scrollYProgress,
    [HERO.window[0], WOW.window[1], DOCKED.window[0], DOCKED.window[1]],
    [HERO.y, HERO.y, DOCKED.y, DOCKED.y],
    { ease: POSITION_EASES }
  )

  // Scale interpolates across all 3 stage windows so the screen + locked
  // teacher scale grow together (camera dolly) and settle at docked.
  const scale = useTransform(
    scrollYProgress,
    [
      HERO.window[0],
      HERO.window[1],
      WOW.window[0],
      WOW.window[1],
      DOCKED.window[0],
      DOCKED.window[1],
    ],
    [
      HERO.scale,
      HERO.scale,
      WOW.scale,
      WOW.scale,
      DOCKED.scale,
      DOCKED.scale,
    ],
    { ease: SCALE_EASES }
  )

  // clamp:false: prevents motion's WAAPI accelerate path from hijacking
  // scroll-linked opacity (see paper-backdrop.tsx for the same).
  const opacity = useTransform(
    scrollYProgress,
    [
      HERO.window[0],
      HERO.window[1],
      WOW.window[0],
      WOW.window[1],
      DOCKED.window[0],
      DOCKED.window[1],
    ],
    [
      HERO.opacity,
      HERO.opacity,
      WOW.opacity,
      WOW.opacity,
      DOCKED.opacity,
      DOCKED.opacity,
    ],
    { ease: OPACITY_EASES, clamp: false }
  )

  // Compensation undoes parent (teacher) scale + off-center origin so
  // the screen sits in viewport space at every stage. With paperOriginY
  // at the laptop, the laptop is invariant under scaling, so HERO local
  // (the laptop) and DOCKED local (right side) are both viewport-stable
  // anchors. Triggers off scrollYProgress and reads the dependents via
  // .get() because motion's typed multi-input overload doesn't accept
  // mixed [string, number] tuples.
  const compensatedScale = useTransform(scrollYProgress, () => {
    const s = scale.get()
    const ts = teacherScale.get()
    return ts === 0 ? s : s / ts
  })
  const compensatedX = useTransform(scrollYProgress, () =>
    divideCssLength(x.get(), teacherScale.get())
  )
  const compensatedY = useTransform(scrollYProgress, () =>
    compensateYTranslate(y.get(), teacherScale.get(), paper.paperOriginY)
  )

  // Pointer-events stay off during morphs so clicks don't land on a
  // scaling/translating frame. Enable once the wow plateau begins so
  // visitors can drive the embedded Student Insights demo at full size
  // and through the docked hold.
  const pointerEvents = useTransform(scrollYProgress, (v) =>
    v >= WOW.window[0] ? "auto" : "none"
  )

  return (
    <motion.div
      data-testid="product-screen-outer"
      className="absolute inset-0 z-20 flex items-center justify-center px-4 sm:px-10 lg:px-16"
      style={{ opacity, x: compensatedX, y: compensatedY, pointerEvents }}
    >
      <motion.div
        data-testid="product-screen-frame"
        className="relative w-full max-w-[1280px] overflow-hidden rounded-2xl border border-black/10 bg-white"
        style={{ scale: compensatedScale }}
      >
        <div className="flex items-center gap-2 border-b border-black/5 bg-[#f7f7f5] px-4 py-2.5">
          <span className="size-3 rounded-full bg-[#ff5f57]" />
          <span className="size-3 rounded-full bg-[#febc2e]" />
          <span className="size-3 rounded-full bg-[#28c840]" />
          <span className="ml-4 truncate text-xs text-black/55">
            {TEACHER_WORKSPACE_APP_URL.replace("https://", "")}
          </span>
        </div>
        <div className="aspect-[16/10] w-full">
          <StudentInsightsApp />
        </div>
      </motion.div>
    </motion.div>
  )
}
