/**
 * Stage copy track for the docked feature-a stage.
 *
 * Renders the kicker / heading / paragraph / bullets / CTA on the side of
 * the viewport opposite where <ProductScreen> docks:
 *   - feature-a: screen docked-left → copy ml-auto (right side)
 *
 * Opacity is scroll-linked via useTransform: the copy fades in during the
 * wow→feature-a morph zone (so it arrives just as the screen finishes
 * docking) and holds through the rest of the timeline.
 *
 *   feature-a: fade in [wow.window[1] → fa.window[0]] = [0.55, 0.65]
 *              hold   [0.65, 1.00]
 *
 * clamp:false on opacity disables motion 12's WAAPI accelerate path that
 * otherwise hijacks scroll-linked opacity (see paper-backdrop.tsx).
 */
import { ArrowUpRightIcon, CheckIcon } from "lucide-react"
import { motion, useTransform } from "motion/react"

import { useScrollChoreography } from "./context"
import { useFlowStages } from "./dev-flow-context"

import { Button } from "@/components/ui/button"
import { stages, TEACHER_WORKSPACE_APP_URL } from "@/content/landing"

type StageCopyProps = { stage: "feature-a" }

export function StageCopy({ stage }: StageCopyProps) {
  const { scrollYProgress } = useScrollChoreography()
  const flowStages = useFlowStages()
  const byFlowId = (id: "wow" | "feature-a") =>
    flowStages.find((s) => s.id === id)

  const entry = stages.find((s) => s.id === stage)
  if (!entry || entry.id !== "feature-a") {
    throw new Error(`StageCopy: unknown stage "${stage}"`)
  }
  const { kicker, heading, paragraph, bullets } = entry.copy

  const fadeInStart = byFlowId("wow")!.window[1]
  const holdStart = byFlowId("feature-a")!.window[0]

  const opacity = useTransform(
    scrollYProgress,
    [0, fadeInStart, holdStart, 1],
    [0, 0, 1, 1],
    { clamp: false }
  )

  return (
    <motion.div
      className="pointer-events-none absolute inset-0 z-30 flex items-center justify-end px-4 sm:px-10 lg:px-16"
      style={{ opacity }}
    >
      <div className="pointer-events-auto w-full max-w-xl px-4 sm:px-6 lg:w-[44%] lg:max-w-2xl lg:px-8">
        <p className="text-xs font-medium tracking-[0.18em] text-[color:var(--paper-muted)] uppercase sm:text-sm">
          {kicker}
        </p>
        <h2 className="mt-4 font-heading text-[clamp(1.5rem,3.2vw,3rem)] leading-[1.08] font-medium tracking-tight text-balance text-[color:var(--paper-ink)]">
          {heading}
        </h2>
        <p className="mt-6 text-base leading-7 text-[color:var(--paper-muted)] sm:text-lg sm:leading-8">
          {paragraph}
        </p>

        <div className="mt-8 flex flex-col">
          {bullets.map((bullet) => (
            <article
              className="border-t border-[color:var(--paper-rule)]/55 py-5 first:border-t-0 first:pt-0"
              key={bullet}
            >
              <div className="flex gap-4">
                <span className="mt-1 grid size-6 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
                  <CheckIcon aria-hidden className="size-3.5" />
                </span>
                <p className="leading-7 text-[color:var(--paper-ink)]">
                  {bullet}
                </p>
              </div>
            </article>
          ))}
        </div>

        <Button
          asChild
          className="mt-8 h-11 rounded-full bg-primary px-7 text-base text-primary-foreground hover:bg-primary/90"
        >
          <a href={TEACHER_WORKSPACE_APP_URL} rel="noreferrer">
            See it live
            <ArrowUpRightIcon data-icon="inline-end" />
          </a>
        </Button>
      </div>
    </motion.div>
  )
}
