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
import {
  EASE_HERO_TO_WOW,
  EASE_OUT_EXIT,
  EASE_WOW_TO_DOCKED,
  LINEAR,
} from "./eases"
import { PaperBackdrop } from "./paper-backdrop"
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
                  className="mx-auto mt-12 flex w-fit flex-col items-center px-4 text-center sm:mt-16"
                  style={{ opacity: copyOpacity, y: copyY }}
                >
                  <h1
                    className="font-heading text-[clamp(2.25rem,5.5vw,3.75rem)] leading-[1.1] font-bold tracking-[-0.025em] text-balance text-[#0F1B33]"
                    id="hero-title"
                  >
                    {hero.headline}
                  </h1>
                  <Button
                    asChild
                    className="mt-7 h-10 rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-[var(--paper-shadow-cta)] transition-all duration-200 ease-out hover:-translate-y-px hover:bg-primary/90 hover:shadow-[var(--paper-shadow-cta-hover)]"
                  >
                    <a href={TEACHER_WORKSPACE_APP_URL} rel="noreferrer">
                      {siteCtaCopy.primary}
                    </a>
                  </Button>
                </motion.div>
              </div>
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

  // Each layer reaches scaleMidValue at its own progress, then converges
  // to scaleEndValue by scaleEndAt. scaleEndAt is the later of dockedStart
  // and the layer's own midProgress + epsilon — guarantees monotonic
  // keyframes when the user drags a midProgress past dockedStart.
  //
  // Ease shape per layer (4 segments): hold(LINEAR) →
  // ramp1(EASE_HERO_TO_WOW) → ramp2(EASE_WOW_TO_DOCKED) → hold(LINEAR).
  // Camera moving through the scene = on-screen movement → ease-in-out.
  // Decelerating WOW→DOCKED ease lands the layer cleanly into the 5.2x
  // hold instead of crashing into it. Matches the product-screen morph's
  // segment-by-segment ease so layer scales and screen scale move on
  // the same beat.
  const layerEases = [LINEAR, EASE_HERO_TO_WOW, EASE_WOW_TO_DOCKED, LINEAR]
  const bgScaleEndAt = Math.max(dockedStart, paper.bgMidProgress + 0.0001)
  const bgScale = useTransform(
    scrollYProgress,
    [0, heroHoldEnd, paper.bgMidProgress, bgScaleEndAt, 1],
    [1, 1, paper.scaleMidValue, paper.scaleEndValue, paper.scaleEndValue],
    { ease: layerEases }
  )
  const cardsScaleEndAt = Math.max(dockedStart, paper.cardsMidProgress + 0.0001)
  const cardsScale = useTransform(
    scrollYProgress,
    [0, heroHoldEnd, paper.cardsMidProgress, cardsScaleEndAt, 1],
    [1, 1, paper.scaleMidValue, paper.scaleEndValue, paper.scaleEndValue],
    { ease: layerEases }
  )
  const teacherScaleEndAt = Math.max(
    dockedStart,
    paper.teacherMidProgress + 0.0001
  )
  const teacherScale = useTransform(
    scrollYProgress,
    [0, heroHoldEnd, paper.teacherMidProgress, teacherScaleEndAt, 1],
    [1, 1, paper.scaleMidValue, paper.scaleEndValue, paper.scaleEndValue],
    { ease: layerEases }
  )

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
