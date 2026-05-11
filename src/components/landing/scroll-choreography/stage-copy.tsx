/**
 * Stage copy track for the docked stage.
 *
 * Renders the heading, three-item feature list, and CTA on the side of
 * the viewport opposite where <ProductScreen> docks (docked: screen on
 * the right → copy on the left side).
 *
 * Opacity is scroll-linked via useTransform: the copy fades in during
 * the wow→docked morph zone (so it arrives just as the screen finishes
 * docking) and holds through the rest of the timeline.
 *
 *   docked: fade in [wow.window[1] → docked.window[0]] = [0.55, 0.65]
 *           hold   [0.65, 1.00]
 *
 * clamp:false on opacity disables motion 12's WAAPI accelerate path that
 * otherwise hijacks scroll-linked opacity (see paper-backdrop.tsx).
 */
import { ChevronRightIcon } from "lucide-react"
import {
  AnimatePresence,
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useTransform,
} from "motion/react"

import { useScrollChoreography } from "./context"
import { useFlowStages } from "./dev-flow-context"
import { EASE_OUT_EXIT } from "./eases"
import { useProductTab } from "./product-tab-context"
import type { ProductTabIndex } from "./product-tab-context"

import { stages } from "@/content/landing"
import { cn } from "@/lib/utils"

type StageCopyProps = { stage: "docked" }

export function StageCopy({ stage }: StageCopyProps) {
  const { scrollYProgress } = useScrollChoreography()
  const flowStages = useFlowStages()
  const byFlowId = (id: "wow" | "docked") =>
    flowStages.find((s) => s.id === id)

  const entry = stages.find((s) => s.id === stage)
  if (!entry || entry.id !== "docked") {
    throw new Error(`StageCopy: unknown stage "${stage}"`)
  }
  const { heading, bullets } = entry.copy
  const { activeTab, setActiveTab } = useProductTab()
  const reduce = useReducedMotion()

  const fadeInStart = byFlowId("wow")!.window[1]
  const holdStart = byFlowId("docked")!.window[0]
  const dockedEnd = byFlowId("docked")!.window[1]

  const opacity = useTransform(
    scrollYProgress,
    [0, fadeInStart, holdStart, 1],
    [0, 0, 1, 1],
    { clamp: false }
  )

  // Reveal blur. Enter animation (Emil: ease-out for elements entering
  // the viewport). Blurry → crisp (4px → 0px) over the same window the
  // copy fades in, so the focus pull is paired with the opacity fade.
  // Filter blur is GPU-composited and stays well under the 20px Safari
  // expense ceiling.
  const blurPx = useTransform(
    scrollYProgress,
    [fadeInStart, holdStart],
    [4, 0],
    { ease: EASE_OUT_EXIT }
  )
  const filter = useTransform(blurPx, (v) => `blur(${v}px)`)

  // Advance the active bullet as the user scrolls through the docked
  // window. Splits [holdStart, dockedEnd] into thirds — one segment per
  // bullet. Scroll is the sole driver; bullets are display-only so the
  // embedded demo reads as scroll-narrated, not click-driven.
  useMotionValueEvent(scrollYProgress, "change", (v) => {
    if (v < holdStart || v > dockedEnd) return
    const segment = (dockedEnd - holdStart) / 3
    const idx = Math.min(2, Math.floor((v - holdStart) / segment)) as ProductTabIndex
    if (idx !== activeTab) setActiveTab(idx)
  })

  return (
    <motion.div
      className="pointer-events-none absolute inset-0 z-30 mx-auto flex w-full max-w-[1412px] items-center justify-start px-4 sm:px-10 lg:px-16"
      style={{ opacity, filter }}
    >
      <div className="pointer-events-auto w-full max-w-xl px-4 sm:px-6 lg:w-[40%] lg:max-w-[520px] lg:px-8">
        <h2 className="font-heading text-[clamp(2rem,3.6vw,3.5rem)] leading-[1.21] font-medium tracking-tight text-balance whitespace-pre-line text-[color:var(--paper-ink)]">
          {heading}
        </h2>

        <div className="mt-8 border-t border-[color:var(--paper-rule)]">
          {bullets.map((bullet, idx) => (
            <div
              className={cn(
                "flex w-full items-start gap-4 border-b border-[color:var(--paper-rule)] px-4 py-6 transition-colors duration-200 ease-out",
                idx === activeTab && "bg-[color:var(--paper-hover-bg)]"
              )}
              key={bullet.title}
            >
              <div className="min-w-0 flex-1">
                <p className="text-[17px] leading-[26px] font-semibold tracking-[-0.005em] text-[color:var(--paper-ink)]">
                  {bullet.title}
                </p>
                <AnimatePresence initial={false}>
                  {idx === activeTab ? (
                    <motion.div
                      key="body"
                      initial={{ height: 0, opacity: 0, y: -4 }}
                      animate={{ height: "auto", opacity: 1, y: 0 }}
                      exit={{ height: 0, opacity: 0, y: -4 }}
                      transition={{
                        duration: reduce ? 0 : 0.22,
                        ease: [0.215, 0.61, 0.355, 1],
                      }}
                      style={{ overflow: "hidden" }}
                    >
                      <p className="mt-2 text-[15px] leading-[24px] text-pretty text-[color:var(--paper-muted)]">
                        {bullet.body}
                      </p>
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </div>
              <ChevronRightIcon
                aria-hidden
                className={cn(
                  "mt-[6px] size-5 shrink-0 transition-transform duration-200 ease-out",
                  idx === activeTab
                    ? "rotate-90 text-[color:var(--paper-ink)]/55"
                    : "text-[color:var(--paper-ink)]/30"
                )}
              />
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  )
}
