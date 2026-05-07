// Split into <ScrollChoreography> (mode pick) + <ChoreographyTree> (calls
// useScroll) so useScroll only mounts in the choreography branch — rules of
// hooks forbid conditional calls.
import { ChevronDownIcon } from "lucide-react"
import {
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useTransform,
} from "motion/react"
import type { MotionValue } from "motion/react"
import { useRef, useState } from "react"
import type { ReactNode, RefObject } from "react"

import { ScrollChoreographyContext } from "./context"
import {
  DevFlowProvider,
  useFlowStages,
  useScrollHeightVh,
} from "./dev-flow-context"
import { DevFlowPanel } from "./dev-flow-panel"
import { EASE_OUT_EXIT, LINEAR, SCALE_EASES } from "./eases"
import { PaperBackdrop } from "./paper-backdrop"
import { ProductTabProvider } from "./product-tab-context"
import { StageCopy } from "./stage-copy"
import { STAGES } from "./stages"
import { StaticChoreographyFallback } from "./static-choreography-fallback"
import { useIsDesktop } from "./use-is-desktop"

import { AudienceColumns } from "@/components/landing/audience-columns"
import { FinalCta } from "@/components/landing/final-cta"
import { SchoolsToday } from "@/components/landing/schools-today"
import { SiteHeader } from "@/components/landing/site-header"
import { Button } from "@/components/ui/button"
import {
  siteCtaCopy,
  stages,
  TEACHER_WORKSPACE_APP_URL,
} from "@/content/landing"

const HERO_COPY_FADE_OUT_START = 0.06
const HERO_COPY_FADE_OUT_END = 0.14
const HERO_COPY_LIFT_PROGRESS = 0.14
const HERO_COPY_LIFT_TRAVEL_PX = "-72px"

export function ScrollChoreography() {
  const sectionRef = useRef<HTMLElement>(null)
  const prefersReducedMotion = useReducedMotion()
  const isDesktop = useIsDesktop()
  const reduced = prefersReducedMotion === true || !isDesktop

  if (reduced) return <StaticChoreographyFallback />

  return <ChoreographyTree sectionRef={sectionRef} />
}

function ChoreographyTree({
  sectionRef,
}: {
  sectionRef: RefObject<HTMLElement | null>
}) {
  // layoutEffect:false mitigates a production first-paint flash. motion's
  // public type omits the option; the cast spreads it through to runtime.
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
    layoutEffect: false,
  } as Parameters<typeof useScroll>[0])

  const heroEntry = stages.find((s) => s.id === "hero")
  if (!heroEntry || heroEntry.id !== "hero") {
    throw new Error(
      "ScrollChoreography: hero stage missing from content/landing stages"
    )
  }
  const hero = heroEntry.copy

  // ease-out on the active fade segment (Emil: "exits use ease-out").
  // Paired with copyY below — same curve so they read as one motion.
  // clamp:false: prevents motion's WAAPI path from hijacking scroll-linked opacity.
  const copyOpacity = useTransform(
    scrollYProgress,
    [0, HERO_COPY_FADE_OUT_START, HERO_COPY_FADE_OUT_END, 1],
    [1, 1, 0, 0],
    { ease: [LINEAR, EASE_OUT_EXIT, LINEAR], clamp: false }
  )
  const copyY = useTransform(
    scrollYProgress,
    [0, HERO_COPY_LIFT_PROGRESS, 1],
    ["0px", HERO_COPY_LIFT_TRAVEL_PX, HERO_COPY_LIFT_TRAVEL_PX],
    { ease: [EASE_OUT_EXIT, LINEAR] }
  )
  const [scrollHintHidden, setScrollHintHidden] = useState(false)
  useMotionValueEvent(scrollYProgress, "change", (v) => {
    const shouldHide = v > 0.001
    if (shouldHide !== scrollHintHidden) setScrollHintHidden(shouldHide)
  })

  return (
    <DevFlowProvider>
      <ChoreographyContextShell scrollYProgress={scrollYProgress}>
        <ChoreographySection sectionRef={sectionRef}>
          <ProductTabProvider>
            <div className="sticky top-0 flex h-svh items-stretch overflow-hidden">
              <PaperBackdrop>
                <div className="relative z-10 flex w-full flex-col">
                  <div className="px-4 pt-4 sm:px-8 sm:pt-6">
                    <SiteHeader />
                  </div>
                  <motion.div
                    className="mx-auto mt-12 flex w-full flex-col items-center px-4 text-center sm:mt-16"
                    style={{ opacity: copyOpacity, y: copyY }}
                  >
                    <h1
                      className="font-heading text-[clamp(2.25rem,5.5vw,3.75rem)] leading-[1.1] font-medium tracking-[-0.025em] text-[#0F1B33]"
                      id="hero-title"
                    >
                      {hero.headline}
                    </h1>
                    <p className="mt-5 max-w-[42rem] text-base leading-[1.6] text-balance text-[color:var(--paper-muted)] sm:text-lg">
                      {hero.description} {siteCtaCopy.access}.
                    </p>
                    <Button
                      asChild
                      className="mt-5 h-10 rounded-full border-0 bg-primary bg-clip-border px-5 text-sm font-semibold text-primary-foreground shadow-[var(--paper-shadow-cta)] transition-all duration-200 ease-out hover:-translate-y-px hover:bg-primary/90 hover:shadow-[var(--paper-shadow-cta-hover)]"
                    >
                      <a href={TEACHER_WORKSPACE_APP_URL} rel="noreferrer">
                        {siteCtaCopy.primary}
                      </a>
                    </Button>
                  </motion.div>
                </div>
                {scrollHintHidden ? null : (
                  <div
                    aria-hidden
                    className="pointer-events-none absolute bottom-6 left-1/2 z-20 -translate-x-1/2"
                  >
                    <div className="inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2 shadow-[0_0_0_1px_rgb(15_23_42/0.04),0_2px_6px_-1px_rgb(15_23_42/0.06),0_12px_32px_-8px_rgb(15_23_42/0.18)]">
                      <span className="text-[13px] font-medium text-[color:var(--paper-ink)]">
                        Scroll to learn more
                      </span>
                      <motion.span
                        animate={{ y: [0, 3, 0] }}
                        transition={{
                          duration: 1.6,
                          repeat: Infinity,
                          ease: "easeInOut",
                        }}
                      >
                        <ChevronDownIcon className="size-4 text-[color:var(--paper-muted)]" />
                      </motion.span>
                    </div>
                  </div>
                )}
              </PaperBackdrop>
              <StageCopy stage="docked" />
            </div>
          </ProductTabProvider>
        </ChoreographySection>
        <SchoolsToday />
        <AudienceColumns />
        <FinalCta />
        {import.meta.env.DEV && <DevFlowPanel />}
      </ChoreographyContextShell>
    </DevFlowProvider>
  )
}

function ChoreographyContextShell({
  scrollYProgress,
  children,
}: {
  scrollYProgress: MotionValue<number>
  children: ReactNode
}) {
  const stages = useFlowStages()

  // Lock scenery scale (bg + cards + teacher) to the product-screen scale
  // by ratio. The hero baseline ratio is screen=STAGES[0].scale (0.05) /
  // teacher=1, so dividing the screen scale curve by HERO_SCREEN_SCALE
  // yields a teacher curve that grows in lock-step with the screen and
  // keeps the screen visually glued to the laptop drawn into the SVG
  // (compensatedScale = scale / teacherScale collapses to a constant
  // HERO_SCREEN_SCALE — see product-screen.tsx).
  const HERO_SCREEN_SCALE = stages[0].scale
  const screenScale = useTransform(
    scrollYProgress,
    [
      stages[0].window[0],
      stages[0].window[1],
      stages[1].window[0],
      stages[1].window[1],
      stages[2].window[0],
      stages[2].window[1],
    ],
    [
      stages[0].scale,
      stages[0].scale,
      stages[1].scale,
      stages[1].scale,
      stages[2].scale,
      stages[2].scale,
    ],
    { ease: SCALE_EASES }
  )
  const teacherScale = useTransform(
    screenScale,
    (s) => s / HERO_SCREEN_SCALE
  )
  // bg + cards live on the same plane as the teacher under the lock —
  // any other choice breaks the "screen glued to laptop" invariant.
  const bgScale = teacherScale
  const cardsScale = teacherScale

  return (
    <ScrollChoreographyContext.Provider
      value={{
        scrollYProgress,
        bgScale,
        cardsScale,
        teacherScale,
        stages: STAGES,
        reducedMotion: false,
        mode: "choreography",
      }}
    >
      {children}
    </ScrollChoreographyContext.Provider>
  )
}

function ChoreographySection({
  sectionRef,
  children,
}: {
  sectionRef: RefObject<HTMLElement | null>
  children: ReactNode
}) {
  const heightVh = useScrollHeightVh()
  // Height binds through a CSS custom property so the literal-style audit
  // (no template literals on layout properties) sees a constant `var(...)`.
  return (
    <section
      aria-labelledby="hero-title"
      className="scroll-choreography-only relative"
      ref={sectionRef}
      style={
        {
          "--scroll-h": `${heightVh}lvh`,
          height: "var(--scroll-h)",
        } as React.CSSProperties
      }
    >
      {/* Anchor for #features nav link — positioned where the docked stage
          is fully visible (≈ scroll progress 0.65). The smooth-scroll on
          html lands the user mid-docked. */}
      <span
        aria-hidden
        className="pointer-events-none absolute top-[35%] left-0 block h-px w-px"
        id="features"
      />
      {children}
    </section>
  )
}
