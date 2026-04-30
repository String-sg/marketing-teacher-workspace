/**
 * Paper-card backdrop subscriber. Owns the paper-card stage frame,
 * the two cloud parallax layers, the autoplay-loop hero video, and
 * the CHOREO-08 video gate.
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
 *     the cartoon visuals (paper-card bg color, shadow, clouds, video).
 *     This is the layer that fades during the wow plateau.
 *   - Caller-supplied `children` render on top of the backdrop layer
 *     (z-index 10+) and are NOT affected by the opacity fade — that's
 *     where the bundled <ProductScreen> + hero copy live.
 *
 * `paperCardScale` is computed at the orchestrator level (ChoreographyTree)
 * so both this component and <ProductScreen> consume the same MotionValue
 * instance. PaperBackdrop reads it via useScrollChoreography().
 *
 * Other invariants:
 *   - CHOREO-08 / D-15 / D-16 (revised 2026-04-29): video autoplay-loops
 *     during stage 1; on crossing byId("wow").window[1] the gate calls
 *     video.pause() so no GPU/decoder work runs while the screen covers
 *     it. On scroll-back below threshold the gate calls video.play() to
 *     resume the loop.
 *   - PERF-04: transform/opacity only — no width/height/top/left
 *
 * The opacityFadeStart / opacityFadeEnd values come from
 * usePaperCardConfig() so the dev tuner can live-edit the fade window.
 */
import { motion, useMotionValueEvent, useTransform } from "motion/react"
import { useRef } from "react"
import type { ReactNode } from "react"

import { useScrollChoreography } from "./context"
import { useFlowStages, usePaperCardConfig } from "./dev-flow-context"

const CLOUD_LEFT_TRAVEL_PX = "-160px"
const CLOUD_RIGHT_TRAVEL_PX = "-110px"

export function PaperBackdrop({ children }: { children?: ReactNode }) {
  const { scrollYProgress, paperCardScale } = useScrollChoreography()
  const stages = useFlowStages()
  const paper = usePaperCardConfig()
  // Video gate fires when scrollYProgress crosses out of the wow exit edge.
  // Resolved per-render so dev tuning of the wow window is honored live.
  const videoGateThreshold =
    stages.find((s) => s.id === "wow")?.window[1] ?? 0.55
  const videoRef = useRef<HTMLVideoElement>(null)

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

  // CHOREO-08 video gate (D-15 + D-16, revised 2026-04-29). The video
  // autoplay-loops via the `loop` + `autoPlay` attributes; the gate only
  // pauses/resumes it on threshold crossings. useMotionValueEvent is the
  // only legitimate use after CHOREO-06's useState ban (DOM imperative,
  // not visual). play() rejection is harmless — the autoplay attribute
  // handles the next mount, and the failure mode is "video stays paused"
  // which is graceful (the poster image continues to display).
  useMotionValueEvent(scrollYProgress, "change", (p) => {
    const video = videoRef.current
    if (!video) return
    if (p >= videoGateThreshold) {
      if (!video.paused) video.pause()
    } else if (video.paused) {
      // Real browsers return a Promise from play(); jsdom returns undefined.
      // Wrap defensively so the gate never throws on a non-thenable return.
      const result = video.play()
      if (result && typeof result.catch === "function") {
        result.catch(() => undefined)
      }
    }
  })

  return (
    <motion.div
      className="paper-card relative mx-auto flex w-full max-w-[110rem] flex-1 flex-col items-center overflow-hidden rounded-[20px]"
      style={{
        scale: paperCardScale,
        transformOrigin: "50% 92%",
      }}
    >
      {/* Backdrop layer — bg + clouds + video, fades with stageOpacity.
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
            <video
              aria-label="A teacher slowly working at her desk"
              autoPlay
              className="hero-media block h-auto w-full select-none"
              loop
              muted
              playsInline
              poster="/hero/teacher-illustration.png"
              preload="auto"
              ref={videoRef}
              src="/hero/teacher-working.mp4"
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
