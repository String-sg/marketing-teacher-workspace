// Product-UI shared element — 3-stage scroll-driven morph.
import { easeOut } from "motion"
import { motion, useTransform } from "motion/react"

import { useScrollChoreography } from "./context"
import { useFlowStages } from "./dev-flow-context"
import { EASE_HERO_TO_WOW, EASE_WOW_TO_DOCKED, LINEAR } from "./eases"

import { TEACHER_WORKSPACE_APP_URL } from "@/content/landing"

const SCALE_EASES = [
  LINEAR, // hero hold
  EASE_HERO_TO_WOW, // hero→wow morph
  LINEAR, // wow hold
  EASE_WOW_TO_DOCKED, // wow→docked morph
  LINEAR, // docked hold
]

const X_EASES = [
  LINEAR, // hero hold
  easeOut, // hero→wow
  LINEAR, // wow hold
  EASE_WOW_TO_DOCKED, // wow→docked
  LINEAR, // docked hold
]

const OPACITY_EASES = [
  LINEAR, // hero hold
  easeOut, // hero→wow
  LINEAR, // wow hold
  LINEAR, // wow→docked
  LINEAR, // docked hold
]

// Vertical distance from teacher-layer center to its transform-origin (50%, 92%),
// expressed in cqi (frame-width-relative). The frame is locked 16:10, so 42%
// of frame_height = 42 * (10/16) = 26.25 cqi. Using cqi instead of vh keeps
// the compensation viewport-stable: the SVG illustration is laid out in
// cqi/% of frame, and the product screen rides the same ruler. Must stay
// in lock-step with PaperBackdrop's teacher-layer transformOrigin.
const TEACHER_LAYER_ORIGIN_Y_OFFSET_CQI = 26.25

function parseCssLength(value: string): number {
  const match = value.match(/^([+-]?\d+(?:\.\d+)?)/)
  return match ? parseFloat(match[1]) : 0
}

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

// ty = 26.25*(1 - 1/St) + yCqi/St — compensates child translate for both
// teacher-layer scale St and its off-center transform-origin (50%, 92%).
// At St = 1 reduces to yCqi (no-op). All y values in STAGES are cqi.
function compensateYTranslate(yStr: string, scale: number): string {
  if (scale === 0 || !Number.isFinite(scale)) return yStr
  const yCqi = parseCssLength(yStr)
  const tyCqi =
    TEACHER_LAYER_ORIGIN_Y_OFFSET_CQI * (1 - 1 / scale) + yCqi / scale
  const rounded = Math.round(tyCqi * 10000) / 10000
  return `${rounded}cqi`
}

export function ProductScreen() {
  const { scrollYProgress, teacherScale } = useScrollChoreography()
  const STAGES = useFlowStages()

  const scale = useTransform(
    scrollYProgress,
    [
      STAGES[0].window[0],
      STAGES[0].window[1],
      STAGES[1].window[0],
      STAGES[1].window[1],
      STAGES[2].window[0],
      STAGES[2].window[1],
    ],
    [
      STAGES[0].scale,
      STAGES[0].scale,
      STAGES[1].scale,
      STAGES[1].scale,
      STAGES[2].scale,
      STAGES[2].scale,
    ],
    { ease: SCALE_EASES }
  )

  const x = useTransform(
    scrollYProgress,
    [
      STAGES[0].window[0],
      STAGES[0].window[1],
      STAGES[1].window[0],
      STAGES[1].window[1],
      STAGES[2].window[0],
      STAGES[2].window[1],
    ],
    [
      STAGES[0].x,
      STAGES[0].x,
      STAGES[1].x,
      STAGES[1].x,
      STAGES[2].x,
      STAGES[2].x,
    ],
    { ease: X_EASES }
  )

  const y = useTransform(
    scrollYProgress,
    [
      STAGES[0].window[0],
      STAGES[0].window[1],
      STAGES[1].window[0],
      STAGES[1].window[1],
      STAGES[2].window[0],
      STAGES[2].window[1],
    ],
    [
      STAGES[0].y,
      STAGES[0].y,
      STAGES[1].y,
      STAGES[1].y,
      STAGES[2].y,
      STAGES[2].y,
    ],
    { ease: X_EASES }
  )

  // clamp:false: prevents motion's WAAPI path from hijacking scroll-linked opacity.
  const opacity = useTransform(
    scrollYProgress,
    [
      STAGES[0].window[0],
      STAGES[0].window[1],
      STAGES[1].window[0],
      STAGES[1].window[1],
      STAGES[2].window[0],
      STAGES[2].window[1],
    ],
    [
      STAGES[0].opacity,
      STAGES[0].opacity,
      STAGES[1].opacity,
      STAGES[1].opacity,
      STAGES[2].opacity,
      STAGES[2].opacity,
    ],
    { ease: OPACITY_EASES, clamp: false }
  )

  // Trigger off scrollYProgress and .get() the others: motion's typed
  // multi-input overload doesn't accept mixed [string, number] tuples.
  const compensatedScale = useTransform(scrollYProgress, () => {
    const s = scale.get()
    const ts = teacherScale.get()
    return ts === 0 ? s : s / ts
  })
  const compensatedX = useTransform(scrollYProgress, () =>
    divideCssLength(x.get(), teacherScale.get())
  )
  const compensatedY = useTransform(scrollYProgress, () =>
    compensateYTranslate(y.get(), teacherScale.get())
  )

  return (
    <motion.div
      aria-hidden
      className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center px-4 sm:px-10 lg:px-16"
      style={{ opacity, x: compensatedX, y: compensatedY }}
    >
      <motion.div
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
        <picture>
          <source
            srcSet="/hero/profiles-screen-640.avif 640w, /hero/profiles-screen-960.avif 960w, /hero/profiles-screen-1280.avif 1280w, /hero/profiles-screen-1600.avif 1600w"
            sizes="(min-width:1280px) 1280px, 100vw"
            type="image/avif"
          />
          <source
            srcSet="/hero/profiles-screen-640.webp 640w, /hero/profiles-screen-960.webp 960w, /hero/profiles-screen-1280.webp 1280w, /hero/profiles-screen-1600.webp 1600w"
            sizes="(min-width:1280px) 1280px, 100vw"
            type="image/webp"
          />
          <img
            src="/hero/profiles-screen-1280.png"
            srcSet="/hero/profiles-screen-640.png 640w, /hero/profiles-screen-960.png 960w, /hero/profiles-screen-1280.png 1280w, /hero/profiles-screen-1600.png 1600w"
            sizes="(min-width:1280px) 1280px, 100vw"
            alt="Teacher Workspace student view showing attendance, behavior notes, and family messages"
            loading="eager"
            decoding="async"
            className="block h-auto w-full select-none"
          />
        </picture>
      </motion.div>
    </motion.div>
  )
}
