import { motion, useReducedMotion, useScroll, useTransform } from "motion/react"
import { useRef } from "react"

import { EmailCapture } from "@/components/landing/email-capture"
import { heroCopy } from "@/content/landing"

export function CinematicHero() {
  const sectionRef = useRef<HTMLElement>(null)
  const prefersReducedMotion = useReducedMotion()
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  })

  const sceneScale = useTransform(
    scrollYProgress,
    [0, 0.48, 1],
    [1, 1.26, 1.52]
  )
  const sceneY = useTransform(
    scrollYProgress,
    [0, 0.55, 1],
    ["0%", "-8%", "-15%"]
  )
  const foregroundScale = useTransform(
    scrollYProgress,
    [0, 0.45, 0.82],
    [1, 1.42, 2.28]
  )
  const foregroundY = useTransform(
    scrollYProgress,
    [0, 0.45, 0.82],
    ["0%", "-8%", "-18%"]
  )
  const copyOpacity = useTransform(
    scrollYProgress,
    [0, 0.2, 0.36],
    [1, 0.72, 0]
  )
  const copyY = useTransform(scrollYProgress, [0, 0.32], ["0px", "-56px"])
  const interfaceOpacity = useTransform(
    scrollYProgress,
    [0.42, 0.66, 0.86],
    [0, 0.72, 1]
  )
  const interfaceScale = useTransform(
    scrollYProgress,
    [0.38, 0.7, 1],
    [0.72, 1.08, 1.22]
  )
  const veilOpacity = useTransform(scrollYProgress, [0.46, 0.82], [0, 0.74])

  return (
    <section
      aria-labelledby="hero-title"
      className="relative h-[330vh] bg-[color:var(--interface-ink)]"
      ref={sectionRef}
    >
      <div className="sticky top-0 h-svh overflow-hidden">
        <motion.div
          aria-hidden
          className="absolute inset-0 origin-center"
          style={
            prefersReducedMotion
              ? undefined
              : {
                  scale: sceneScale,
                  y: sceneY,
                }
          }
        >
          <SceneBackdrop />
        </motion.div>

        <motion.div
          aria-hidden
          className="absolute inset-x-0 bottom-0 h-[58svh] origin-bottom"
          style={
            prefersReducedMotion
              ? undefined
              : {
                  scale: foregroundScale,
                  y: foregroundY,
                }
          }
        >
          <SceneForeground />
        </motion.div>

        <motion.div
          className="absolute inset-0 bg-[color:var(--interface-ink)]"
          style={{ opacity: veilOpacity }}
        />

        <motion.div
          className="absolute inset-x-0 top-[17svh] z-10 mx-auto flex max-w-5xl flex-col items-center px-5 text-center text-white sm:top-[20svh]"
          style={
            prefersReducedMotion
              ? undefined
              : {
                  opacity: copyOpacity,
                  y: copyY,
                }
          }
        >
          <p className="mb-4 text-sm font-medium tracking-[0.18em] text-white/72 uppercase">
            {heroCopy.eyebrow}
          </p>
          <h1
            id="hero-title"
            className="max-w-4xl font-heading text-5xl leading-[0.94] font-semibold text-balance sm:text-7xl lg:text-8xl"
          >
            {heroCopy.headline}
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-white/78 sm:text-xl">
            {heroCopy.body}
          </p>
          <div className="mt-10 w-full">
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

function SceneBackdrop() {
  return (
    <div className="scene-backdrop absolute inset-0">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_22%,var(--dawn-glow),transparent_30%),radial-gradient(circle_at_78%_24%,var(--sky-glow),transparent_32%),linear-gradient(180deg,var(--sky-top),var(--sky-middle)_42%,var(--forest-deep)_100%)]" />
      <div className="mountain mountain-a" />
      <div className="mountain mountain-b" />
      <div className="mountain mountain-c" />
      <div className="mist mist-a" />
      <div className="mist mist-b" />
      <div className="valley-line" />
    </div>
  )
}

function SceneForeground() {
  return (
    <div className="absolute inset-0">
      <div className="absolute inset-x-[-8%] bottom-0 h-[82%] rounded-[50%_50%_0_0/28%_28%_0_0] bg-[radial-gradient(circle_at_52%_8%,var(--grass-lit),transparent_26%),linear-gradient(180deg,var(--grass-mid),var(--grass-dark))]" />
      <div className="grass-field" />
      <div className="desk-scene">
        <div className="chair" />
        <div className="desk">
          <div className="laptop">
            <ProductInterfaceMini />
          </div>
        </div>
      </div>
    </div>
  )
}

function ProductInterfaceMini() {
  return (
    <div className="mini-ui">
      <div className="mini-sidebar" />
      <div className="mini-main">
        <span />
        <strong />
        <em />
      </div>
    </div>
  )
}

export function ProductInterfaceFrame() {
  return (
    <div className="overflow-hidden rounded-[1.4rem] border border-white/10 bg-[color:var(--interface-panel)] p-4 shadow-2xl shadow-black/40 backdrop-blur-sm">
      <div className="grid min-h-[56svh] gap-4 rounded-[1rem] border border-white/8 bg-[color:var(--interface-surface)] p-4 text-white sm:grid-cols-[15rem_1fr]">
        <aside className="hidden flex-col gap-3 border-r border-white/8 pr-4 text-sm text-white/54 sm:flex">
          <p className="text-white/82">Marketing Teacher</p>
          {["Brief", "Audience", "Positioning", "Creative", "Launch"].map(
            (item, index) => (
              <span
                className={
                  index === 2
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
                Positioning rehearsal
              </p>
              <h2 className="mt-2 max-w-xl text-3xl font-semibold text-balance sm:text-5xl">
                Launch a sharper offer before you spend.
              </h2>
            </div>
            <div className="rounded-full bg-[color:var(--interface-accent-soft)] px-4 py-2 text-sm text-[color:var(--interface-accent)]">
              84% stronger
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-[1fr_18rem]">
            <div className="rounded-xl border border-white/8 bg-white/[0.045] p-4">
              <div className="mb-4 flex items-center justify-between text-sm text-white/54">
                <span>Campaign confidence</span>
                <span>12 week trend</span>
              </div>
              <div className="chart-path" />
            </div>
            <div className="rounded-xl border border-white/8 bg-white/[0.045] p-4">
              <p className="text-sm text-white/54">Next critique</p>
              <p className="mt-3 text-2xl font-medium">Landing page promise</p>
              <p className="mt-5 text-sm leading-6 text-white/62">
                Tighten the proof, name the audience, and make the moment of
                value unmistakable.
              </p>
            </div>
          </div>

          <div className="grid gap-3 text-sm text-white/68 sm:grid-cols-3">
            {["Audience clarity", "Offer tension", "Proof quality"].map(
              (label) => (
                <div
                  className="rounded-xl border border-white/8 bg-white/[0.035] p-4"
                  key={label}
                >
                  <p>{label}</p>
                  <div className="mt-4 h-2 rounded-full bg-white/10">
                    <div className="h-full w-4/5 rounded-full bg-[color:var(--interface-accent)]" />
                  </div>
                </div>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
