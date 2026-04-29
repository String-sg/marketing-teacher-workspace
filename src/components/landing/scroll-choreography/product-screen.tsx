/**
 * Product-UI shared element — Phase 2 stub.
 *
 * Carries the browser-frame chrome + product-UI screenshot. Owns
 * `screenScale` and `screenOpacity` as scroll-derived motion values —
 * both subscribe to scrollYProgress through useScrollChoreography()
 * (D-05). Phase 2 scope: hero → wow transition only (D-09). Phase 3
 * expands this to all four stage targets (the dock-left and dock-right
 * end positions) and lands responsive srcset + LCP preload
 * (D-11 / VISUAL-03).
 *
 * CHOREO-01: this is THE single shared motion.div — never unmounted,
 * with NO shared-element layout-id attribute. Mount stability is the
 * contract; Phase 3 reshapes the scroll-derived inputs but does NOT
 * remount.
 *
 * Phase 2 fixes:
 *   - MIGRATE-02 / CHOREO-06: screenOpacity is now a scroll-derived
 *     motion value flowing into style (paper-hero.tsx had it as
 *     React state updated by an imperative event handler).
 *   - MIGRATE-03 / D-12: keyframe endpoints bind to byId("wow").window
 *     entries, not magic numbers.
 *   - PERF-04: transform/opacity only.
 *
 * The outer wrapper has pointer events disabled in Phase 2 per
 * RESEARCH.md OQ-3 (the live app at TEACHER_WORKSPACE_APP_URL is the
 * conversion target; this image is decorative). Phase 3 may toggle
 * once the screen becomes interactive.
 */
import { motion, useTransform } from "motion/react"

import { useScrollChoreography } from "./context"
import { byId } from "./stages"

import { TEACHER_WORKSPACE_APP_URL } from "@/content/landing"

// Stage-aligned endpoints — D-12: bind to STAGES via byId()
const SCREEN_FADE_START = byId("wow").window[0]
const SCREEN_FADE_END = byId("wow").window[1]

// Intra-stage scale curve — D-13: named local consts (visual tuning,
// not a stage window). Phase 2 ramps from hero to wow; Phase 3 will
// replace this with a multi-stage stitched curve.
const SCREEN_SCALE_HERO = 0.55
const SCREEN_SCALE_WOW_PEAK = 1
const SCREEN_SCALE_OVERSHOOT = 1.04

export function ProductScreen() {
  const { scrollYProgress } = useScrollChoreography()

  // Phase 2 hero→wow ramp (D-09). Keyframe endpoints stage-aligned via
  // byId(); intra-stage scale values as named local consts (D-13). The
  // motion library's default clamp removes any need for a manual clamp.
  const screenScale = useTransform(
    scrollYProgress,
    [0, SCREEN_FADE_START, SCREEN_FADE_END, 1],
    [
      SCREEN_SCALE_HERO,
      SCREEN_SCALE_HERO,
      SCREEN_SCALE_WOW_PEAK,
      SCREEN_SCALE_OVERSHOOT,
    ],
  )
  // MIGRATE-02 / CHOREO-06 fix: screenOpacity is now a scroll-derived
  // motion value flowing direct into style (was previously React state
  // mutated from an imperative scroll callback).
  const screenOpacity = useTransform(
    scrollYProgress,
    [SCREEN_FADE_START, SCREEN_FADE_END],
    [0, 1],
  )

  return (
    <motion.div
      aria-hidden
      className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center px-4 sm:px-10 lg:px-16"
      style={{ opacity: screenOpacity }}
    >
      <motion.div
        className="relative w-full max-w-[1280px] overflow-hidden rounded-2xl border border-black/10 bg-white shadow-[0_30px_120px_-40px_rgb(15_23_42/0.45)]"
        style={{ scale: screenScale }}
      >
        <div className="flex items-center gap-2 border-b border-black/5 bg-[#f7f7f5] px-4 py-2.5">
          <span className="size-3 rounded-full bg-[#ff5f57]" />
          <span className="size-3 rounded-full bg-[#febc2e]" />
          <span className="size-3 rounded-full bg-[#28c840]" />
          <span className="ml-4 truncate text-xs text-black/55">
            {TEACHER_WORKSPACE_APP_URL.replace("https://", "")}
          </span>
        </div>
        <img
          alt="Teacher Workspace student insights dashboard"
          className="block h-auto w-full select-none"
          src="/hero/profiles-screen.png"
        />
      </motion.div>
    </motion.div>
  )
}
