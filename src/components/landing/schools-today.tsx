import {
  motion,
  useInView,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "motion/react"
import { useRef, useState } from "react"

import { RevealOnScroll } from "./reveal-on-scroll"

import type { MouseEvent as ReactMouseEvent } from "react"
import type { SchoolMemo } from "@/content/landing"
import { schoolsTodayCopy } from "@/content/landing"

const TAPE_BG: Record<1 | 2 | 3, string> = {
  1: "var(--memo-tape-1)",
  2: "var(--memo-tape-2)",
  3: "var(--memo-tape-3)",
}

// Final at-rest Z rotation per card (degrees). Cards land here after the flip.
const CARD_TILT_DEG = [-1.4, 0.8, -0.6] as const

// Per-card stagger so the trio doesn't slap down in lockstep.
const FLIP_DELAY_MS = [0, 110, 220] as const

const FLIP_IN_VIEW_OPTIONS = {
  once: true,
  margin: "0px 0px -10% 0px",
  amount: 0.3,
} as const

// Designed keyframes for a paper-flap entry: drop, overshoot, small backswing,
// settle. Times are normalized progress points; ease is the transition between
// adjacent keyframes (easeOut keeps each segment decelerating).
const ENTRANCE_DURATION_S = 0.95

// Cursor tracking spring — responsive, but with give so the paper has momentum
// instead of tracking the cursor pixel-for-pixel.
const CURSOR_SPRING = {
  stiffness: 110,
  damping: 14,
  mass: 1,
} as const

// Cursor tilt range. Pivot is at the top edge of the card, so the bottom moves
// the most and the top barely moves — that's how the paper "feels stuck" to
// the tape while the bottom flexes.
const CURSOR_TILT_X_MAX_DEG = 9
const CURSOR_TILT_Y_MAX_DEG = 6

export function SchoolsToday() {
  return (
    <section
      className="relative px-5 py-16 sm:px-8 lg:py-20"
      id="schools"
    >
      <div className="mx-auto w-full max-w-[1412px] rounded-[28px] bg-[color:var(--memo-section-bg)] px-6 py-20 sm:rounded-[44px] sm:px-12 sm:py-24 lg:px-24 lg:py-28">
        <RevealOnScroll>
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-heading text-[clamp(1.75rem,4vw,3.5rem)] leading-[1.08] font-medium tracking-tight text-balance text-[color:var(--paper-ink)]">
              {schoolsTodayCopy.heading}
            </h2>
            <p className="mt-6 text-base leading-[1.7] text-balance text-[color:var(--paper-muted)] sm:text-lg">
              {schoolsTodayCopy.subheading}
            </p>
          </div>
        </RevealOnScroll>

        <div className="mx-auto mt-14 grid w-full max-w-[1220px] grid-cols-1 gap-10 sm:gap-7 lg:mt-20 lg:grid-cols-3 [perspective:900px]">
          {schoolsTodayCopy.cases.map((memo, i) => (
            <MemoCard index={i} key={memo.number} memo={memo} />
          ))}
        </div>
      </div>
    </section>
  )
}

type MemoCardProps = {
  readonly memo: SchoolMemo
  readonly index: number
}

// Memo: tape stays static against the wall; the paper hinges from the top
// edge. With the rotation pivot at the very top, motion magnitude scales with
// distance from the tape — top of paper barely moves, bottom moves most. So
// the upper area visually "sticks" while the lower area responds to cursor.
function MemoCard({ memo, index }: MemoCardProps) {
  const articleRef = useRef<HTMLElement | null>(null)
  // === true: hydration null must not skip the animation
  const reduced = useReducedMotion() === true
  const inView = useInView(articleRef, FLIP_IN_VIEW_OPTIONS)
  // entered: gates the cursor-tilt handoff. Reduced-motion users start entered
  // so we don't strand them mid-flip.
  const [entered, setEntered] = useState(reduced)

  const finalTilt = CARD_TILT_DEG[index] ?? 0
  const delay = FLIP_DELAY_MS[index] ?? 0

  // Mouse position normalized to the card rect, [-1, 1]. Springs smooth jitter.
  const mx = useMotionValue(0)
  const my = useMotionValue(0)
  const sx = useSpring(mx, CURSOR_SPRING)
  const sy = useSpring(my, CURSOR_SPRING)

  // Bottom-biased cursor mapping: cursor in the upper third of the card barely
  // tilts; cursor in the lower half drives the bottom toward the viewer.
  // Three keyframes give a non-linear curve: top -> 0, middle -> -1.5, bottom
  // -> -CURSOR_TILT_X_MAX. The lever from the top pivot amplifies the bottom.
  const cursorRotX = useTransform(
    sy,
    [-1, 0, 1],
    [0, -1.5, -CURSOR_TILT_X_MAX_DEG]
  )
  // Symmetric horizontal sway. Pivoted at top, so the upper area pivots only
  // slightly while the bottom swings most.
  const cursorRotY = useTransform(
    sx,
    [-1, 1],
    [CURSOR_TILT_Y_MAX_DEG, -CURSOR_TILT_Y_MAX_DEG]
  )

  function handleMouseMove(e: ReactMouseEvent<HTMLElement>) {
    if (!entered || reduced) return
    const rect = e.currentTarget.getBoundingClientRect()
    mx.set(((e.clientX - rect.left) / rect.width - 0.5) * 2)
    my.set(((e.clientY - rect.top) / rect.height - 0.5) * 2)
  }

  function handleMouseLeave() {
    mx.set(0)
    my.set(0)
  }

  // Designed keyframe entrance: -78° drop, +9° overshoot, -3° backswing,
  // +1° tiny rebound, settle. The Z tilt also overshoots to amplify the
  // "weight" of the paper landing.
  const initial = reduced
    ? false
    : { rotateX: -78, rotateZ: finalTilt * 0.3, opacity: 0 }
  const animate =
    reduced || inView
      ? {
          rotateX: [-78, 9, -3, 1, 0],
          rotateZ: [
            finalTilt * 0.3,
            finalTilt * 1.4,
            finalTilt * 0.85,
            finalTilt * 1.05,
            finalTilt,
          ],
          opacity: [0, 1, 1, 1, 1],
        }
      : { rotateX: -78, rotateZ: finalTilt * 0.3, opacity: 0 }
  const transition = reduced
    ? { duration: 0 }
    : {
        duration: ENTRANCE_DURATION_S,
        times: [0, 0.55, 0.78, 0.9, 1],
        ease: "easeOut" as const,
        delay: delay / 1000,
        opacity: { duration: 0.3, delay: delay / 1000 },
      }

  // After entrance, style.rotateX/Y take over and follow the cursor. rotateZ
  // stays at finalTilt (animate's last value persists because style omits it).
  const cursorStyle =
    entered && !reduced ? { rotateX: cursorRotX, rotateY: cursorRotY } : undefined

  return (
    <div className="relative h-full">
      {/* Tape: glued to the wall, never transforms. */}
      <span
        aria-hidden
        className="pointer-events-none absolute -top-3.5 left-1/2 z-20 inline-block h-7 w-[110px] -translate-x-1/2 border-x border-dashed border-black/10"
        style={{ backgroundColor: TAPE_BG[memo.tape] }}
      />
      <motion.article
        animate={animate}
        className="relative flex h-full flex-col rounded-[4px] border border-black/5 bg-[color:var(--memo-bg)] px-9 pt-14 pb-9 shadow-[0_18px_40px_-22px_rgb(15_23_42/0.30)] [transform-origin:50%_0%] will-change-transform"
        initial={initial}
        onAnimationComplete={() => {
          if (!reduced) setEntered(true)
        }}
        onMouseLeave={handleMouseLeave}
        onMouseMove={handleMouseMove}
        ref={articleRef}
        style={cursorStyle}
        transition={transition}
      >
        <p className="font-mono text-[12px] leading-[16px] font-medium text-[color:var(--paper-muted)]">
          {memo.number}
        </p>
        <p className="mt-5 text-[22px] leading-[32px] font-medium tracking-[-0.01em] text-[color:var(--paper-ink)] italic">
          {memo.quote}
        </p>
        <p className="mt-5 text-[15px] leading-[24px] text-[color:var(--paper-ink)]/85">
          {memo.body}
        </p>
        <p className="mt-6 text-sm leading-5 font-semibold text-[color:var(--paper-ink)]">
          {memo.role}
        </p>
        <p className="mt-0.5 text-[13px] leading-5 text-[color:var(--paper-muted)] italic">
          {memo.school}
        </p>
      </motion.article>
    </div>
  )
}
