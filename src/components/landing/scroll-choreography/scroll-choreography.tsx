/**
 * Scroll-choreography orchestrator. Owns the master useScroll, the tall
 * sticky shell, and the ScrollChoreographyContext provider.
 *
 * Two-component split (per RESEARCH.md Pattern 1):
 *   <ScrollChoreography> picks mode and early-returns <StaticChoreographyFallback />
 *     when reduced/mobile (D-02). useScroll never runs in that branch.
 *   <ChoreographyTree> calls useScroll, mounts the provider, and renders the
 *     paper-card + product-screen morph layer + hero copy.
 *
 * The split is required by React's rules-of-hooks: useScroll cannot be
 * called conditionally, and CONTEXT.md D-02 mandates it only run in the
 * choreography branch. Splitting moves useScroll into a child that mounts
 * only when mode === "choreography".
 *
 * FOUND-04: useScroll is called with `layoutEffect: false` to mitigate the
 * production-build first-paint flash documented in motion#2452. Per
 * RESEARCH.md OQ-1 the option may not be recognised by motion@12.38 — the
 * value spreads through the options bag harmlessly. Plan 05 runs a
 * `pnpm preview` smoke test to verify whether the bug still reproduces; if
 * not, motion 12.x fixed it internally and this comment + option may be
 * removed in a follow-up phase.
 *
 * D-18 / CHOREO-07 / D-09: outer = h-[400lvh] (Phase 3 retune from
 * Phase 2's 280lvh — 4× viewport for 4-stage choreography), inner
 * sticky = h-svh. The outer also carries `.scroll-choreography-only` so
 * the styles.css:226-230 mobile gate becomes defense-in-depth alongside
 * the JS branch.
 */
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react"
import { useRef } from "react"
import type { RefObject } from "react"

import { ScrollChoreographyContext } from "./context"
import { PaperBackdrop } from "./paper-backdrop"
import { ProductScreen } from "./product-screen"
import { StageCopy } from "./stage-copy"
import { STAGES } from "./stages"
import { StaticChoreographyFallback } from "./static-choreography-fallback"
import { useIsDesktop } from "./use-is-desktop"

import { FinalCta } from "@/components/landing/final-cta"
import { ProofStrip } from "@/components/landing/proof-strip"
import { Button } from "@/components/ui/button"
import {
  finalCtaCopy,
  stages,
  TEACHER_WORKSPACE_APP_URL,
} from "@/content/landing"

// Intra-stage hero-copy timing — D-13 named local consts. Replaces the
// paper-hero.tsx:56-60 inline [0, 0.14, 1] magic-number tuple.
const HERO_COPY_FADE_OUT_START = 0.06
const HERO_COPY_FADE_OUT_END = 0.14
const HERO_COPY_LIFT_PROGRESS = 0.14
const HERO_COPY_LIFT_TRAVEL_PX = "-72px"

export function ScrollChoreography() {
  const sectionRef = useRef<HTMLElement>(null)
  const prefersReducedMotion = useReducedMotion()
  const isDesktop = useIsDesktop()
  // D-02: mode = (isDesktop && !prefersReducedMotion) ? "choreography" : "static"
  const reduced = prefersReducedMotion === true || !isDesktop

  // Early-return in static mode means useScroll never runs — see
  // ChoreographyTree below for the choreography branch.
  if (reduced) return <StaticChoreographyFallback />

  return <ChoreographyTree sectionRef={sectionRef} />
}

function ChoreographyTree({
  sectionRef,
}: {
  sectionRef: RefObject<HTMLElement | null>
}) {
  // FOUND-04: layoutEffect:false — see file header docstring + Plan 05 smoke.
  // The Parameters<...> cast accepts the option through motion's narrower
  // public type signature; motion's source spreads `...options`, so the value
  // is accepted at runtime even when the static type does not list it. If
  // motion@12.38 ignores the option the call is harmless; if it honors it,
  // the production flicker bug (motion#2452) is mitigated. Plan 05 verifies.
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
    layoutEffect: false,
  } as Parameters<typeof useScroll>[0])

  // Hero copy data lookup — discriminated-union narrow per the in-repo
  // pattern (paper-hero.tsx:21-25). Throws on misshapen data so a future
  // landing.ts edit that drops the hero stage is a hard runtime error,
  // not a silent rendering bug.
  const heroEntry = stages.find((s) => s.id === "hero")
  if (!heroEntry || heroEntry.id !== "hero") {
    throw new Error(
      "ScrollChoreography: hero stage missing from content/landing stages"
    )
  }
  const hero = heroEntry.copy

  // Hero copy useTransforms — D-07 (copy renders inline in the orchestrator)
  // + D-13 (intra-stage timing as named local consts). Replaces the
  // paper-hero.tsx:56-60 inline [0, 0.14, 1] magic-number tuples + the
  // paper-hero.tsx:66 useState/useMotionValueEvent driven copyOpacity.
  // clamp:false disables motion 12's accelerate/WAAPI path on opacity (see
  // motion-dom use-transform.mjs:31-43). Without it the WAAPI animation
  // hijacks the scroll-linked opacity and plays on its own timeline. Input
  // range covers [0, 1] so clamp:false is safe — scrollYProgress is bounded.
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

  // Provider value object — inline literal per RESEARCH Pattern 4 / Pitfall 6.
  // Phase 2 has no consumers reading `mode` / `reducedMotion`; PaperBackdrop
  // and ProductScreen consume `scrollYProgress` only (a stable MotionValue
  // ref captured on mount). Phase 4 may wrap with useMemo when copy-track
  // consumers land that read the non-MotionValue fields.
  return (
    <ScrollChoreographyContext.Provider
      value={{
        scrollYProgress,
        stages: STAGES,
        reducedMotion: false,
        mode: "choreography",
      }}
    >
      <section
        aria-labelledby="hero-title"
        className="scroll-choreography-only relative h-[400lvh]"
        ref={sectionRef}
      >
        <div className="sticky top-0 flex h-svh items-stretch overflow-hidden p-3">
          <PaperBackdrop>
            <motion.div
              className="mt-14 flex flex-col items-center text-center sm:mt-20"
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
                  {finalCtaCopy.cta}
                </a>
              </Button>
            </motion.div>
          </PaperBackdrop>
          <ProductScreen />
          <StageCopy stage="feature-a" />
          <StageCopy stage="feature-b" />
        </div>
      </section>
      {/* Page-tail sections are siblings of the choreography per
          research/ARCHITECTURE.md System Overview. The choreography section
          owns hero+wow only; ProofStrip and FinalCta render after it
          regardless of mode. (Static branch reaches them via
          <StaticChoreographyFallback />, which composes them itself —
          this branch reaches them here.) */}
      <ProofStrip />
      <FinalCta />
    </ScrollChoreographyContext.Provider>
  )
}
