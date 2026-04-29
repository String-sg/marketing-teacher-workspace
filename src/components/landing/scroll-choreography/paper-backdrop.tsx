/**
 * Paper-card backdrop subscriber. Owns the paper-card stage frame
 * (with stageScale + opacity), the two cloud parallax layers, the
 * autoplay-loop hero video, and the CHOREO-08 video gate.
 *
 * Rendered ONLY in choreography mode (the orchestrator early-returns
 * <StaticChoreographyFallback /> when reduced/mobile per D-02).
 *
 * Phase 2 fixes:
 *   - MIGRATE-01: extracted from paper-hero.tsx:112-194
 *   - MIGRATE-02 / CHOREO-06: useState→useTransform for stageOpacity
 *   - MIGRATE-03 / D-12 / D-13: every useTransform keyframe is a
 *     STAGES ref or a named local const; zero anonymous numbers
 *   - CHOREO-08 / D-15 / D-16 (revised 2026-04-29): video autoplay-loops
 *     during stage 1; on crossing byId("wow").window[1] the gate calls
 *     video.pause() so no GPU/decoder work runs while the screen covers
 *     it. On scroll-back below threshold the gate calls video.play() to
 *     resume the loop.
 *   - PERF-04: transform/opacity only — no width/height/top/left
 *
 * 2026-04-29 scope shift (user direction): the original CHOREO-02 / CHOREO-08
 * specified scroll-linked currentTime scrubbing. After production-preview
 * smoke the user requested a continuously-playing loop instead — same intent
 * (background motion in the paper world during hero) with a simpler primitive
 * and consistent tempo regardless of scroll speed. The pause-when-covered
 * GPU-relief intent of CHOREO-08 is preserved; only the active behavior
 * (scrub vs loop) changed. The `loadedmetadata` effect and `videoDurationRef`
 * are gone — duration is no longer needed because we don't write currentTime.
 *
 * Accepts children (D-06) — orchestrator passes hero copy block here
 * so it nests inside the paper-card frame and scales together.
 */
import { motion, useMotionValueEvent, useTransform } from "motion/react"
import { useRef } from "react"
import type { ReactNode } from "react"

import { useScrollChoreography } from "./context"
import { byId } from "./stages"

// Stage-aligned endpoints — D-12: bind to STAGES via byId(). The video gate
// fires when scrollYProgress crosses out of the wow window's exit edge.
const VIDEO_GATE_THRESHOLD = byId("wow").window[1]

// Intra-stage timing constants — D-13: named local constants in component file
// (cannot live in stages.ts because they are not stage windows). Values are
// preserved verbatim from paper-hero.tsx:50, 61, 62 — the stage-scale
// progression ships unchanged through the extraction.
const STAGE_SCALE_MID_PROGRESS = 0.6
const STAGE_SCALE_MID_VALUE = 2.4
const STAGE_SCALE_END_VALUE = 5.2
// stageOpacity fade range matches paper-hero.tsx:69's `1 - (p - 0.6) / 0.18`
// (= fade from 0.6 to 0.78). Endpoint `0.78` is intra-stage timing, NOT
// `byId("wow").window[1]` — the video gate threshold is independent of
// the stageOpacity fade, even though both happen near the wow→feature-a
// boundary.
const STAGE_OPACITY_FADE_START = 0.6
const STAGE_OPACITY_FADE_END = 0.78
const CLOUD_LEFT_TRAVEL_PX = "-160px"
const CLOUD_RIGHT_TRAVEL_PX = "-110px"

export function PaperBackdrop({ children }: { children?: ReactNode }) {
  const { scrollYProgress } = useScrollChoreography()
  const videoRef = useRef<HTMLVideoElement>(null)

  // useTransform replaces paper-hero.tsx:50 useTransform AND paper-hero.tsx:64
  // useState/useMotionValueEvent (D-10 + CHOREO-06). useTransform's clamp:true
  // default removes the clamp01 helper that paper-hero.tsx:18 declared.
  const stageScale = useTransform(
    scrollYProgress,
    [0, STAGE_SCALE_MID_PROGRESS, 1],
    [1, STAGE_SCALE_MID_VALUE, STAGE_SCALE_END_VALUE]
  )
  const stageOpacity = useTransform(
    scrollYProgress,
    [STAGE_OPACITY_FADE_START, STAGE_OPACITY_FADE_END],
    [1, 0]
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
    if (p >= VIDEO_GATE_THRESHOLD) {
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
      className="paper-card relative mx-auto flex w-full max-w-[110rem] flex-1 flex-col items-center overflow-hidden rounded-[20px] bg-[color:var(--paper-card)] shadow-[0_10px_60px_-30px_rgb(15_23_42/0.18)]"
      style={{
        scale: stageScale,
        opacity: stageOpacity,
        transformOrigin: "50% 92%",
      }}
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

      {/* D-06: children nest between cloud layers and the video container,
          matching paper-hero.tsx:147-170's slot exactly. */}
      <div className="relative z-10 mx-auto flex w-fit flex-col pt-8 sm:pt-10">
        {children}
      </div>

      <div className="relative z-0 mt-auto flex w-full justify-center pb-0">
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
  )
}
