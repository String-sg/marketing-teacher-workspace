import { motion, useInView, useReducedMotion, cubicBezier } from "motion/react"
import { useRef } from "react"
import type { ReactNode } from "react"

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

// Fade + lift reveal. Fires once per element; honors prefers-reduced-motion.
export function RevealOnScroll({
  children,
  delay = 0,
  className,
  id,
}: RevealOnScrollProps) {
  const ref = useRef<HTMLDivElement | null>(null)
  // === true: hydration null must not skip the animation
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
