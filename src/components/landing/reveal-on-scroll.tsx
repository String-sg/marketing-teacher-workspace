import { motion, useInView, useReducedMotion, cubicBezier } from "motion/react"
import { useRef } from "react"
import type { ReactNode } from "react"

// Mirrors scroll-choreography/product-screen.tsx:51-77 easing precedent.
// Re-declared locally (not extracted to a shared module) to keep this
// reveal layer self-contained and additive — the contract with the
// scroll-choreography is "do not touch".
const EASE = cubicBezier(0.4, 0, 0.2, 1)

const DEFAULT_Y = 24
const DEFAULT_DURATION = 0.6

const IN_VIEW_OPTIONS = {
  once: true,
  margin: "0px 0px -15% 0px",
  amount: 0.25,
} as const

type RevealOnScrollProps = {
  children: ReactNode
  delay?: number
  className?: string
  id?: string
}

/**
 * Mercury-style reveal-on-scroll wrapper.
 *
 * Fades + lifts (~24px) into view once the element is ~85% inside the
 * viewport. Fires once per element; scrolling back up does not replay.
 *
 * Under prefers-reduced-motion, renders children at the final visual
 * state with no animation/transition. Children are in the DOM and
 * reachable from mount regardless of viewport state — only opacity and
 * transform animate.
 *
 * Always renders a <div>. The earlier polymorphic `as` prop was dropped:
 * no consumer used it, and the polymorphism forced a `Ref<never>` cast
 * that disabled every future ref-related TS check on this line.
 *
 * Defaults match the user-approved plan:
 *   y: 24px, duration: 600ms, ease: cubicBezier(0.4, 0, 0.2, 1),
 *   useInView({ once: true, margin: "0px 0px -15% 0px", amount: 0.25 })
 */
export function RevealOnScroll({
  children,
  delay = 0,
  className,
  id,
}: RevealOnScrollProps) {
  const ref = useRef<HTMLDivElement | null>(null)
  // Mirrors scroll-choreography.tsx:76 — `=== true` so a hydration-time
  // `null` does not erroneously skip the animation path.
  const reduced = useReducedMotion() === true
  const inView = useInView(ref, IN_VIEW_OPTIONS)

  const shouldAnimate = !reduced && inView

  return (
    <motion.div
      ref={ref}
      id={id}
      className={className}
      initial={reduced ? false : { opacity: 0, y: DEFAULT_Y }}
      animate={
        shouldAnimate || reduced
          ? { opacity: 1, y: 0 }
          : { opacity: 0, y: DEFAULT_Y }
      }
      transition={
        reduced
          ? { duration: 0 }
          : {
              duration: DEFAULT_DURATION,
              ease: EASE,
              delay: delay / 1000,
            }
      }
    >
      {children}
    </motion.div>
  )
}
