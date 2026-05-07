/**
 * Paper-card backdrop. Owns the hero-stage frame (16:10, container-type
 * inline-size), the hill backdrop, and the hand-drawn sketch overlays
 * that the product-screen morph aligns against. Rendered only on the
 * choreography path; <StaticChoreographyFallback /> handles the rest.
 *
 * Layer stack (back-to-front):
 *   - Background (absolute inset-0): carries `bgScale` + the wow-plateau
 *     `stageOpacity` fade + full-bleed hill + dark gradient overlay.
 *   - Hero stage frame (absolute, centered, 16:10). Inside, two scale
 *     wrappers split the illustration into depth planes that share
 *     transformOrigin `50% ${paperOriginY}%` so they scale around the
 *     laptop in the SVG (keeping the screen-on-laptop in viewport):
 *       · Cards layer — carries `cardsScale`, holds hero-cards-sketch.svg.
 *       · Teacher layer — carries `teacherScale`, holds
 *         hero-teacher-sketch.svg + <ProductScreen>. The screen
 *         counter-scales against `teacherScale` so it lands in viewport
 *         space while still riding the same depth plane as the teacher.
 *   - Caller-supplied `children` render on top (z 10+), unaffected by
 *     layer scale/opacity — SiteHeader and hero copy live there.
 *
 * Only transform/opacity animate — no width/height/top/left writes.
 *
 * `bgScale` / `cardsScale` / `teacherScale` come from the orchestrator
 * (ChoreographyTree) as shared MotionValues. opacityFadeStart/End come
 * from usePaperCardConfig() so the dev tuner can live-edit the fade.
 */
import { motion, useTransform } from "motion/react"
import type { ReactNode } from "react"

import { useScrollChoreography } from "./context"
import { usePaperCardConfig, useSketchesConfig } from "./dev-flow-context"
import { EASE_OUT_EXIT, LINEAR } from "./eases"
import { ProductScreen } from "./product-screen"

export function PaperBackdrop({ children }: { children?: ReactNode }) {
  const { scrollYProgress, bgScale, cardsScale, teacherScale } =
    useScrollChoreography()
  const paper = usePaperCardConfig()
  const sketches = useSketchesConfig()

  // ease-out on the active fade segment (Emil: "exits use ease-out");
  // LINEAR on the surrounding holds. clamp:false disables motion 12's
  // accelerate/WAAPI path on opacity, which would otherwise hijack
  // scroll-linked opacity into an independent native animation that
  // ignores scrollYProgress (motion-dom use-transform.mjs:31-43). The
  // keyframe range covers [0, 1] so disabling clamp is safe — scrollYProgress
  // is bounded by useScroll and never extrapolates.
  const stageOpacity = useTransform(
    scrollYProgress,
    [0, paper.opacityFadeStart, paper.opacityFadeEnd, 1],
    [1, 1, 0, 0],
    { ease: [LINEAR, EASE_OUT_EXIT, LINEAR], clamp: false }
  )

  return (
    <div className="paper-card relative mx-auto flex w-full max-w-[1412px] flex-1 flex-col items-center overflow-hidden rounded-[28px] sm:rounded-[44px]">
      <motion.div
        aria-hidden
        className="absolute inset-0 overflow-hidden rounded-[28px] bg-gradient-to-b from-[#cfe5f7] from-0% via-[#e8f1fa] via-35% to-white to-75% sm:rounded-[44px]"
        style={{
          scale: bgScale,
          opacity: stageOpacity,
          transformOrigin: "50% 92%",
        }}
      >
        {/* Halftone cloud overlays — positioned per Paper "Hero V2 — Cloud
            Notes" design. Mix-blend-lighten lets the white halftone cloud
            sit on the sky gradient without a hard edge. Each cloud drifts
            on its own period so the sky feels alive without any one
            element catching the eye. Choreography path is reduced-motion
            gated upstream (see ScrollChoreography), so no extra check
            here. */}
        {/* Two-keyframe loops with repeatType "reverse" — Motion ping-pongs
            A↔B forever with no seam at the boundary. Speed: durations are
            tuned so a ~50px cloud shift takes 4-7s, which reads as gentle
            but unmistakably "drifting". Phase desync comes from different
            durations + opposite starting directions. */}
        <motion.img
          alt=""
          aria-hidden
          animate={{ x: ["-8%", "8%"] }}
          className="pointer-events-none absolute top-[2%] left-[78%] w-[18%] mix-blend-lighten select-none"
          src="/hero/cloud-halftone.png"
          transition={{
            duration: 9,
            ease: "easeInOut",
            repeat: Infinity,
            repeatType: "reverse",
          }}
        />
        <motion.img
          alt=""
          aria-hidden
          animate={{ x: ["5%", "-5%"] }}
          className="pointer-events-none absolute top-[16%] left-[60%] w-[40%] mix-blend-lighten select-none"
          src="/hero/cloud-halftone.png"
          transition={{
            duration: 13,
            ease: "easeInOut",
            repeat: Infinity,
            repeatType: "reverse",
          }}
        />
        <motion.img
          alt=""
          aria-hidden
          animate={{ x: ["-12%", "12%"] }}
          className="pointer-events-none absolute top-[28%] -left-[8%] w-[36%] mix-blend-lighten select-none"
          src="/hero/cloud-halftone.png"
          transition={{
            duration: 11,
            ease: "easeInOut",
            repeat: Infinity,
            repeatType: "reverse",
          }}
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
          <motion.div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              scale: cardsScale,
              transformOrigin: `50% ${paper.paperOriginY}%`,
            }}
          >
            <motion.img
              alt=""
              aria-hidden
              className="pointer-events-none absolute top-[var(--cards-top)] left-1/2 w-[var(--cards-width)] -translate-x-1/2 select-none"
              src="/hero/hero-cards-sketch.svg"
              style={{ opacity: stageOpacity }}
            />
          </motion.div>
          <motion.div
            className="absolute inset-0"
            style={{
              scale: teacherScale,
              transformOrigin: `50% ${paper.paperOriginY}%`,
            }}
          >
            <motion.img
              alt=""
              aria-hidden
              className="pointer-events-none absolute top-[var(--teacher-top)] left-1/2 w-[var(--teacher-width)] -translate-x-1/2 select-none"
              src="/hero/hero-teacher-sketch.svg"
              style={{ opacity: stageOpacity }}
            />
            <ProductScreen />
          </motion.div>
        </div>
      </div>

      {children}
    </div>
  )
}
