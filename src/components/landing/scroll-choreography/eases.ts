/**
 * Shared scroll-choreography easing curves.
 *
 * Per Emil Kowalski's animation guidance:
 *   - LINEAR for hold segments and constant-rate progress.
 *   - ease-in-out for on-screen movement (camera-into-scene morph).
 *   - ease-out for exits (hero copy + background opacity fade).
 *
 * Paired animations (copyOpacity + copyY; the three layer scales) reuse
 * the same curves so they read as a single coordinated motion.
 */
import { cubicBezier } from "motion"

export const LINEAR = (t: number) => t

/**
 * ease-in-out cubic — first half of the camera ramp (hero hold → mid).
 * Matches the hero→wow segment of the product-screen morph so layer
 * scales and screen scale move on the same beat.
 */
export const EASE_HERO_TO_WOW = cubicBezier(0.32, 0, 0.67, 1)

/**
 * Material "standard" easing — second half of the camera ramp (mid →
 * docked plateau). Decelerates at the end, so layers settle into the
 * 5.2x hold rather than crashing into it.
 */
export const EASE_WOW_TO_DOCKED = cubicBezier(0.4, 0, 0.2, 1)

/**
 * ease-out-quart — Emil's recommended curve for elements leaving the
 * viewport. Used for the hero copy fade/lift and the background opacity
 * fade (both are exits). Snappy out-the-door feel without the harshness
 * of ease-out-expo.
 */
export const EASE_OUT_EXIT = cubicBezier(0.165, 0.84, 0.44, 1)

/**
 * Per-segment scale easing for the 3-stage product-screen morph (and the
 * locked teacher/cards/bg scenery layers that derive from it). Five
 * segments line up with [hero.start, hero.end, wow.start, wow.end,
 * docked.start, docked.end] keyframes:
 *   1. hero hold (LINEAR)
 *   2. hero→wow ramp (ease-in-out — camera into scene)
 *   3. wow hold (LINEAR)
 *   4. wow→docked ramp (decelerate so layers settle into the docked plateau)
 *   5. docked hold (LINEAR)
 */
export const SCALE_EASES = [
  LINEAR,
  EASE_HERO_TO_WOW,
  LINEAR,
  EASE_WOW_TO_DOCKED,
  LINEAR,
]
