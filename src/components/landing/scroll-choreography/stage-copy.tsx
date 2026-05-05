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
import { motion, useTransform } from "motion/react"
import { useState } from "react"

import { useScrollChoreography } from "./context"
import { useFlowStages } from "./dev-flow-context"

import { stages } from "@/content/landing"

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
  const { heading, bullets, cta } = entry.copy
  const [active, setActive] = useState(0)

  const fadeInStart = byFlowId("wow")!.window[1]
  const holdStart = byFlowId("docked")!.window[0]

  const opacity = useTransform(
    scrollYProgress,
    [0, fadeInStart, holdStart, 1],
    [0, 0, 1, 1],
    { clamp: false }
  )

  return (
    <motion.div
      className="pointer-events-none absolute inset-0 z-30 flex items-center justify-start px-4 sm:px-10 lg:px-16"
      style={{ opacity }}
    >
      <div className="pointer-events-auto w-full max-w-xl px-4 sm:px-6 lg:w-[40%] lg:max-w-[520px] lg:px-8">
        <h2 className="font-heading text-[clamp(2rem,3.6vw,3.5rem)] leading-[1.21] font-medium tracking-tight whitespace-pre-line text-[color:var(--paper-ink)]">
          {heading}
        </h2>

        <div className="mt-8 border-t border-[color:var(--paper-rule)]">
          {bullets.map((bullet, idx) => (
            <button
              aria-expanded={idx === active}
              className="flex w-full gap-4 border-b border-[color:var(--paper-rule)] py-6 text-left transition-colors hover:bg-[color:var(--paper-ink)]/[0.02] focus-visible:outline-none focus-visible:bg-[color:var(--paper-ink)]/[0.03]"
              key={bullet.title}
              onClick={() => setActive(idx)}
              type="button"
            >
              <span
                aria-hidden
                className={[
                  "mt-[10px] size-2 shrink-0 rounded-full transition-colors",
                  idx === active
                    ? "bg-primary"
                    : "border border-[color:var(--paper-ink)]/25",
                ].join(" ")}
              />
              <div className="min-w-0">
                <p className="text-[17px] leading-[26px] font-semibold tracking-[-0.005em] text-[color:var(--paper-ink)]">
                  {bullet.title}
                </p>
                {idx === active ? (
                  <p className="mt-2 text-[15px] leading-[24px] text-[color:var(--paper-muted)]">
                    {bullet.body}
                  </p>
                ) : null}
              </div>
            </button>
          ))}
        </div>

        <a
          className="mt-7 inline-block text-[15px] leading-[22px] font-semibold text-[color:var(--paper-ink)] underline underline-offset-[6px] decoration-[color:var(--paper-ink)]/40 transition-colors hover:decoration-[color:var(--paper-ink)] focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-primary/40"
          href={cta.href}
          rel="noreferrer"
        >
          {cta.label}
        </a>
      </div>
    </motion.div>
  )
}
