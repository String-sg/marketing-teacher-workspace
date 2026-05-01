// Split into <ScrollChoreography> (mode pick) + <ChoreographyTree> (calls
// useScroll) so useScroll only mounts in the choreography branch — rules of
// hooks forbid conditional calls.
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from "motion/react"
import type { MotionValue } from "motion/react"
import { useRef } from "react"
import type { ReactNode, RefObject } from "react"

import { ScrollChoreographyContext } from "./context"
import {
  DevFlowProvider,
  useFlowStages,
  usePaperCardConfig,
  useScrollHeightVh,
} from "./dev-flow-context"
import { DevFlowPanel } from "./dev-flow-panel"
import { PaperBackdrop } from "./paper-backdrop"
import { ProductScreen } from "./product-screen"
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

  // clamp:false: prevents motion's WAAPI path from hijacking scroll-linked opacity.
  const copyOpacity = useTransform(
    scrollYProgress,
    [0, HERO_COPY_FADE_OUT_START, HERO_COPY_FADE_OUT_END, 1],
    [1, 1, 0, 0],
    { clamp: false }
  )
  const copyY = useTransform(
    scrollYProgress,
    [0, HERO_COPY_LIFT_PROGRESS, 1],
    ["0px", HERO_COPY_LIFT_TRAVEL_PX, HERO_COPY_LIFT_TRAVEL_PX]
  )

  return (
    <DevFlowProvider>
      <ChoreographyContextShell scrollYProgress={scrollYProgress}>
        <ChoreographySection sectionRef={sectionRef}>
          <div className="sticky top-0 flex h-svh items-stretch overflow-hidden p-3">
            <PaperBackdrop>
              <div className="relative z-10 flex w-full flex-col">
                <div className="px-4 pt-4 sm:px-6 sm:pt-6">
                  <SiteHeader />
                </div>
                <motion.div
                  className="mx-auto mt-10 flex w-fit flex-col items-center text-center sm:mt-14"
                  style={{ opacity: copyOpacity, y: copyY }}
                >
                  <h1
                    className="font-heading text-[clamp(1.75rem,4.4vw,4rem)] leading-[1.05] font-medium tracking-tight text-[color:var(--paper-ink)]"
                    id="hero-title"
                  >
                    {hero.headline}
                  </h1>
                  <p className="mt-3 max-w-xl text-base leading-7 text-balance text-[color:var(--paper-muted)] sm:text-lg sm:leading-8">
                    {hero.subline}
                  </p>
                  <Button
                    asChild
                    className="mt-6 h-11 rounded-full bg-primary px-7 text-base text-primary-foreground hover:bg-primary/90 sm:mt-7"
                  >
                    <a href={TEACHER_WORKSPACE_APP_URL} rel="noreferrer">
                      {siteCtaCopy.primary}
                    </a>
                  </Button>
                </motion.div>
              </div>
              <ProductScreen />
            </PaperBackdrop>
            <StageCopy stage="docked" />
          </div>
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
  const paper = usePaperCardConfig()
  const heroHoldEnd = stages.find((s) => s.id === "hero")?.window[1] ?? 0.15
  const dockedStart = stages.find((s) => s.id === "docked")?.window[0] ?? 0.3

  const scaleEndAt = Math.max(dockedStart, paper.scaleMidProgress + 0.0001)
  const paperCardScale = useTransform(
    scrollYProgress,
    [0, heroHoldEnd, paper.scaleMidProgress, scaleEndAt, 1],
    [1, 1, paper.scaleMidValue, paper.scaleEndValue, paper.scaleEndValue]
  )

  return (
    <ScrollChoreographyContext.Provider
      value={{
        scrollYProgress,
        paperCardScale,
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
  // Bind height through a CSS custom property: PERF-04's literal-style check
  // rejects template literals on `height`, but accepts the literal var(...).
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
      {children}
    </section>
  )
}
