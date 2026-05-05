/**
 * Paper-card backdrop subscriber. Owns the paper-card stage frame,
 * the two cloud parallax layers, and the static hero illustration.
 *
 * Rendered ONLY in choreography mode (the orchestrator early-returns
 * <StaticChoreographyFallback /> when reduced/mobile per D-02).
 *
 * Bundle architecture (2026-04-30):
 *   - Outer motion.div carries `scale` + `transformOrigin` only — never
 *     fades. This is the shared transform parent that <ProductScreen>
 *     piggybacks on (via `paperCardScale` published in
 *     ScrollChoreographyContext) so the UI overlay stays locked to the
 *     cartoon laptop throughout the morph zone.
 *   - Inner backdrop motion.div (absolute inset-0) carries `opacity` +
 *     the cartoon visuals (paper-card bg color, shadow, clouds, hero
 *     illustration). This is the layer that fades during the wow plateau.
 *   - Caller-supplied `children` render on top of the backdrop layer
 *     (z-index 10+) and are NOT affected by the opacity fade — that's
 *     where the bundled <ProductScreen> + hero copy live.
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
import { usePaperCardConfig } from "./dev-flow-context"

const CLOUD_LEFT_TRAVEL_PX = "-160px"
const CLOUD_RIGHT_TRAVEL_PX = "-110px"

export function PaperBackdrop({ children }: { children?: ReactNode }) {
  const { scrollYProgress, paperCardScale } = useScrollChoreography()
  const paper = usePaperCardConfig()

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
  const cloudYLeft = useTransform(
    scrollYProgress,
    [0, 1],
    ["0px", CLOUD_LEFT_TRAVEL_PX]
  )
  const cloudYRight = useTransform(
    scrollYProgress,
    [0, 1],
    ["0px", CLOUD_RIGHT_TRAVEL_PX]
  )

  return (
    <motion.div
      className="paper-card relative mx-auto flex w-full max-w-[110rem] flex-1 flex-col items-center overflow-hidden rounded-[20px]"
      style={{
        scale: paperCardScale,
        transformOrigin: "50% 92%",
      }}
    >
      {/* Backdrop layer — bg + clouds + illustration, fades with stageOpacity.
          Sits behind caller-supplied children (which render at z-10+ and
          stay fully opaque so the bundled ProductScreen is unaffected
          by the cartoon fade). */}
      <motion.div
        aria-hidden
        className="absolute inset-0 rounded-[20px] bg-[color:var(--paper-card)] shadow-[0_10px_60px_-30px_rgb(15_23_42/0.18)]"
        style={{ opacity: stageOpacity }}
      >
        <motion.div
          aria-hidden
          className="pointer-events-none absolute -bottom-8 -left-10 w-[min(28vw,300px)] sm:-left-12"
          style={{ y: cloudYLeft }}
        >
          <img
            alt=""
            className="cloud-drift-left block w-full opacity-80 mix-blend-multiply select-none"
            src="/hero/cloud-halftone.png"
          />
        </motion.div>
        <motion.div
          aria-hidden
          className="pointer-events-none absolute -top-4 -right-10 w-[min(26vw,280px)] sm:-right-12"
          style={{ y: cloudYRight }}
        >
          <img
            alt=""
            className="cloud-drift-right block w-full opacity-80 mix-blend-multiply select-none"
            src="/hero/cloud-halftone.png"
          />
        </motion.div>
        <div className="absolute inset-x-0 bottom-0 flex w-full justify-center">
          <div className="relative w-full max-w-[360px] px-4 sm:max-w-[400px]">
            <img
              alt="Teacher working at her desk with a laptop and lamp"
              className="hero-media block h-auto w-full select-none"
              src="/hero/teacher-illustration.png"
            />
          </div>
        </div>
      </motion.div>

      {/* Caller-supplied foreground (hero copy slot + bundled
          ProductScreen wrapper). Renders above the backdrop layer
          and outside its opacity fade. */}
      {children}
    </motion.div>
  )
}
