import { motion, useReducedMotion, useScroll, useTransform } from "motion/react"
import { useRef } from "react"
import type { MotionValue } from "motion/react"

import { EmailCapture } from "@/components/landing/email-capture"
import { heroCopy } from "@/content/landing"

export function CinematicHero() {
  const sectionRef = useRef<HTMLElement>(null)
  const prefersReducedMotion = useReducedMotion()
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  })

  const mediaScale = useTransform(
    scrollYProgress,
    [0, 0.56, 1],
    [1, 1.16, 1.34]
  )
  const mediaY = useTransform(
    scrollYProgress,
    [0, 0.56, 1],
    ["0%", "-4%", "-10%"]
  )
  const videoOpacity = useTransform(
    scrollYProgress,
    [0, 0.5, 0.7],
    [1, 0.88, 0]
  )
  const endFrameOpacity = useTransform(
    scrollYProgress,
    [0.45, 0.7, 1],
    [0, 0.76, 1]
  )
  const copyOpacity = useTransform(
    scrollYProgress,
    [0, 0.002, 0.006],
    [1, 0.58, 0]
  )
  const copyY = useTransform(scrollYProgress, [0, 0.014], ["0px", "-72px"])
  const interfaceOpacity = useTransform(
    scrollYProgress,
    [0.64, 0.8, 0.94],
    [0, 0.86, 1]
  )
  const interfaceScale = useTransform(
    scrollYProgress,
    [0.62, 0.82, 1],
    [0.82, 1.04, 1.14]
  )
  const veilOpacity = useTransform(scrollYProgress, [0.44, 0.84], [0, 0.7])

  return (
    <section
      aria-labelledby="hero-title"
      className={
        prefersReducedMotion
          ? "relative min-h-svh overflow-hidden bg-[color:var(--interface-ink)]"
          : "relative h-[320vh] bg-[color:var(--interface-ink)]"
      }
      ref={sectionRef}
    >
      <div
        className={
          prefersReducedMotion
            ? "relative min-h-svh overflow-hidden"
            : "sticky top-0 h-svh overflow-hidden"
        }
      >
        <motion.div
          aria-hidden
          className="absolute inset-0 origin-center"
          style={
            prefersReducedMotion
              ? undefined
              : {
                  scale: mediaScale,
                  y: mediaY,
                }
          }
        >
          <HeroMedia
            endFrameOpacity={prefersReducedMotion ? undefined : endFrameOpacity}
            videoOpacity={prefersReducedMotion ? undefined : videoOpacity}
          />
        </motion.div>

        <motion.div
          className="absolute inset-0 bg-[color:var(--interface-ink)]"
          style={{ opacity: veilOpacity }}
        />

        <motion.div
          className="absolute inset-x-0 top-[14svh] z-10 mx-auto flex max-w-5xl flex-col items-center px-5 text-center text-white sm:top-[15svh]"
          style={
            prefersReducedMotion
              ? undefined
              : {
                  opacity: copyOpacity,
                  y: copyY,
                }
          }
        >
          <h1
            id="hero-title"
            className="font-heading text-5xl leading-[0.9] font-semibold text-balance sm:text-7xl lg:text-[7.75rem]"
          >
            {heroCopy.eyebrow}
          </h1>
          <p className="mt-5 max-w-4xl font-heading text-2xl leading-tight font-medium text-balance text-white/88 sm:text-3xl lg:text-4xl">
            {heroCopy.headline}
          </p>
          <p className="mt-4 max-w-2xl text-base leading-7 text-white/74 sm:text-lg sm:leading-8">
            {heroCopy.body}
          </p>
          <div className="mt-8 w-full">
            <EmailCapture />
          </div>
        </motion.div>

        <motion.div
          className="pointer-events-none absolute inset-x-3 top-[18svh] z-20 mx-auto max-w-5xl origin-center sm:inset-x-8"
          style={
            prefersReducedMotion
              ? {
                  opacity: 0,
                }
              : {
                  opacity: interfaceOpacity,
                  scale: interfaceScale,
                }
          }
        >
          <ProductInterfaceFrame />
        </motion.div>
      </div>
    </section>
  )
}

function HeroMedia({
  endFrameOpacity,
  videoOpacity,
}: {
  endFrameOpacity?: MotionValue<number>
  videoOpacity?: MotionValue<number>
}) {
  return (
    <div className="hero-media hero-placeholder absolute inset-0">
      <div className="hero-placeholder-base absolute inset-0" />
      <motion.div
        className="hero-placeholder-scrub absolute inset-0"
        style={videoOpacity ? { opacity: videoOpacity } : undefined}
      />
      <motion.div
        className="hero-placeholder-end absolute inset-0"
        style={endFrameOpacity ? { opacity: endFrameOpacity } : { opacity: 0 }}
      />
      <div className="hero-placeholder-workspace absolute inset-x-0 bottom-[-8svh] h-[58svh]">
        <div className="hero-placeholder-desk" />
        <div className="hero-placeholder-seat" />
        <div className="hero-placeholder-device">
          <div className="hero-placeholder-device-screen" />
        </div>
      </div>
    </div>
  )
}

export function ProductInterfaceFrame() {
  return (
    <div className="overflow-hidden rounded-[1.4rem] border border-white/10 bg-[color:var(--interface-panel)] p-4 shadow-2xl shadow-black/40 backdrop-blur-sm">
      <div className="grid min-h-[56svh] gap-4 rounded-[1rem] border border-white/8 bg-[color:var(--interface-surface)] p-4 text-white sm:grid-cols-[15rem_1fr]">
        <aside className="hidden flex-col gap-3 border-r border-white/8 pr-4 text-sm text-white/54 sm:flex">
          <p className="text-white/82">Teacher Workspace</p>
          {["Today", "Classes", "To grade", "Students", "Library"].map(
            (item, index) => (
              <span
                className={
                  index === 0
                    ? "rounded-lg bg-white/10 px-3 py-2 text-white"
                    : "px-3 py-2"
                }
                key={item}
              >
                {item}
              </span>
            )
          )}
        </aside>
        <div className="flex min-w-0 flex-col gap-4">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm text-[color:var(--interface-accent)]">
                Today's workspace
              </p>
              <h2 className="mt-2 max-w-xl text-3xl font-semibold text-balance sm:text-5xl">
                Good morning, Sam. Here's today.
              </h2>
            </div>
            <div className="rounded-full bg-[color:var(--interface-accent-soft)] px-4 py-2 text-sm text-[color:var(--interface-accent)]">
              12 to grade
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-[1fr_18rem]">
            <div className="rounded-xl border border-white/8 bg-white/[0.045] p-4">
              <div className="mb-4 flex items-center justify-between text-sm text-white/54">
                <span>Today at a glance</span>
                <span>4 classes</span>
              </div>
              <div className="chart-path" />
            </div>
            <div className="rounded-xl border border-white/8 bg-white/[0.045] p-4">
              <p className="text-sm text-white/54">Next up</p>
              <p className="mt-3 text-2xl font-medium">Bio Period 3 quiz</p>
              <p className="mt-5 text-sm leading-6 text-white/62">
                Attendance is ready, the rubric is attached, and yesterday's
                parent note is waiting for review.
              </p>
            </div>
          </div>

          <div className="grid gap-3 text-sm text-white/68 sm:grid-cols-3">
            {["Attendance", "Grading", "Messages"].map((label) => (
              <div
                className="rounded-xl border border-white/8 bg-white/[0.035] p-4"
                key={label}
              >
                <p>{label}</p>
                <div className="mt-4 h-2 rounded-full bg-white/10">
                  <div className="h-full w-4/5 rounded-full bg-[color:var(--interface-accent)]" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
