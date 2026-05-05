/**
 * Paper-card backdrop subscriber. Owns the paper-card stage frame,
 * the lush-hill hero backdrop, the hand-drawn sketch overlays, and
 * the aspect-locked hero stage frame that anchors the product-screen
 * morph to the same ruler the SVGs live on.
 *
 * Rendered ONLY in choreography mode (the orchestrator early-returns
 * <StaticChoreographyFallback /> when reduced/mobile per D-02).
 *
 * Bundle architecture:
 *   - Outer motion.div carries `scale` + `transformOrigin` only — never
 *     fades. Shared transform parent that <ProductScreen> piggybacks on
 *     via `paperCardScale` published in ScrollChoreographyContext.
 *   - Inner backdrop motion.div (absolute inset-0) carries `opacity` +
 *     the full-bleed visuals (hill image + dark gradient overlay). This
 *     is the layer that fades during the wow plateau.
 *   - Hero stage frame (absolute, centered, aspect 16:10, container-type
 *     inline-size). Inside the frame, the SVG sketches are anchored by
 *     percentage and <ProductScreen> uses cqi-based translate values
 *     (see stages.ts). Container queries decouple the morph offsets from
 *     vw/vh so the product-screen stays on the laptop at any aspect.
 *   - Caller-supplied `children` render on top (z-index 10+) and are NOT
 *     affected by the opacity fade — that's where SiteHeader and the
 *     hero copy live.
 *
 * `paperCardScale` is computed at the orchestrator level (ChoreographyTree)
 * so both this component and <ProductScreen> consume the same MotionValue
 * instance. PaperBackdrop reads it via useScrollChoreography().
 *
 * Other invariants:
 *   - PERF-04: transform/opacity only — no width/height/top/left
 *
 * The opacityFadeStart / opacityFadeEnd values come from
 * usePaperCardConfig() so the dev tuner can live-edit the fade window.
 */
import { motion, useTransform } from "motion/react"
import type { ReactNode } from "react"

import { useScrollChoreography } from "./context"
import { usePaperCardConfig, useSketchesConfig } from "./dev-flow-context"
import { ProductScreen } from "./product-screen"

export function PaperBackdrop({ children }: { children?: ReactNode }) {
  const { scrollYProgress, paperCardScale } = useScrollChoreography()
  const paper = usePaperCardConfig()
  const sketches = useSketchesConfig()

  // clamp:false disables motion 12's accelerate/WAAPI path on opacity, which
  // hijacks scroll-linked opacity into an independent native animation that
  // ignores scrollYProgress (motion-dom use-transform.mjs:31-43). The keyframe
  // range covers [0, 1] so disabling clamp is safe — scrollYProgress is
  // bounded by useScroll and never extrapolates.
  const stageOpacity = useTransform(
    scrollYProgress,
    [0, paper.opacityFadeStart, paper.opacityFadeEnd, 1],
    [1, 1, 0, 0],
    { clamp: false }
  )

  return (
    <motion.div
      className="paper-card relative mx-auto flex w-full max-w-[110rem] flex-1 flex-col items-center overflow-hidden rounded-[20px] shadow-[0_10px_60px_-30px_rgb(15_23_42/0.18)]"
      style={{
        scale: paperCardScale,
        transformOrigin: "50% 92%",
      }}
    >
      <motion.div
        aria-hidden
        className="absolute inset-0 overflow-hidden rounded-[20px]"
        style={{ opacity: stageOpacity }}
      >
        <picture>
          <source
            type="image/webp"
            srcSet="/hero/hill-640.webp 640w, /hero/hill-960.webp 960w, /hero/hill-1280.webp 1280w, /hero/hill-1600.webp 1600w"
            sizes="(min-width:1280px) 1280px, 100vw"
          />
          <img
            alt=""
            aria-hidden
            className="absolute inset-0 block h-full w-full object-cover select-none"
            decoding="async"
            fetchPriority="high"
            src="/hero/hill-1280.jpg"
          />
        </picture>
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-[42%] bg-gradient-to-b from-[rgb(15_23_42/0.32)] via-[rgb(15_23_42/0.12)] to-transparent"
        />
      </motion.div>

      <div className="absolute inset-0 grid place-items-center">
        <div
          className="relative aspect-[16/10] w-full max-w-[calc(100svh*1.6)] [container-type:inline-size]"
          style={
            {
              "--cards-top": `${sketches.cardsTop}%`,
              "--cards-width": `${sketches.cardsWidth}cqi`,
              "--teacher-top": `${sketches.teacherTop}%`,
              "--teacher-width": `${sketches.teacherWidth}cqi`,
            } as React.CSSProperties
          }
        >
          <img
            alt=""
            aria-hidden
            className="pointer-events-none absolute top-[var(--cards-top)] left-1/2 w-[var(--cards-width)] -translate-x-1/2 select-none"
            src="/hero/hero-cards-sketch.svg"
          />
          <img
            alt=""
            aria-hidden
            className="pointer-events-none absolute top-[var(--teacher-top)] left-1/2 w-[var(--teacher-width)] -translate-x-1/2 select-none"
            src="/hero/hero-teacher-sketch.svg"
          />
          <ProductScreen />
        </div>
      </div>

      {children}
    </motion.div>
  )
}
