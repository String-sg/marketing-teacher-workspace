import type { ScreenTarget, ScreenTargetRect, StageDef, StageId } from "./types"

/**
 * The four choreography stages.
 *
 * Phase 3 retune (D-02): monotonic non-overlapping windows. Each stage
 * holds at its peak target between window[0] and window[1]; the morph
 * happens in the gap between adjacent windows (prev.window[1] →
 * next.window[0]). The 35% wow plateau (0.20→0.55) is the centerpiece
 * reveal; hero is a 10% setup; docked stages get ~13–15% each — enough
 * for Phase 4's 200–300ms-staggered 3-bullet reveals.
 *
 * Window-edge holds → useTransform's keyframe stops array is built by
 * STAGES.flatMap(s => [s.window[0], s.window[1]]) (8 stops, value at
 * window[0] === value at window[1] = the hold).
 *
 * Phase 2 windows (overlapping) are explicitly revised:
 *   wow:       [0.20, 0.78] → [0.20, 0.55]
 *   feature-a: [0.50, 0.78] → [0.65, 0.78]
 *   feature-b: [0.75, 1.00] → [0.85, 1.00]
 *
 * Cascade: PaperBackdrop's VIDEO_GATE_THRESHOLD = byId("wow").window[1]
 * auto-tracks 0.78 → 0.55. PaperBackdrop intra-stage timing consts
 * (STAGE_OPACITY_FADE_*, STAGE_SCALE_*) retune in Plan 04 alongside this.
 */
export const STAGES = [
  { id: "hero", window: [0.0, 0.15] as const, screen: "tiny" },
  { id: "wow", window: [0.25, 0.55] as const, screen: "centered" },
  { id: "feature-a", window: [0.65, 1.0] as const, screen: "docked-left" },
] as const satisfies readonly StageDef[]

/** Throws on unknown id — see CONTEXT.md note that strict-types philosophy
 *  prefers a thrown error over `find(...)!` non-null assertions everywhere. */
export function byId(id: StageId): StageDef {
  const stage = STAGES.find((s) => s.id === id)
  if (!stage) throw new Error(`Unknown stage id: ${id}`)
  return stage
}

/**
 * Runtime per-target rect map (D-04 / D-08). Replaces the Phase 1
 * `ScreenTargetsMap` type alias with the actual values <ProductScreen>
 * consumes.
 *
 * Conventions:
 *   - x sign convention (D-07): negative = leftward (docked-left toward
 *     viewport left), positive = rightward (docked-right toward viewport
 *     right). String values include CSS units (vw / vh) so motion's mix()
 *     interpolates them as units, not numbers.
 *   - tiny: positioned over the laptop screen in the paper-card
 *     illustration (offset right + down from viewport center, scaled to
 *     fit inside the cartoon laptop's screen). The hero→wow morph
 *     enlarges it to "centered" while moving it back to viewport center.
 *   - y values express vertical translate in vh; non-zero only on tiny
 *     (the laptop sits well below viewport center).
 *   - clipPath stays undefined (D-03 — no shape morph in Phase 3).
 */
export const SCREEN_TARGETS: Record<ScreenTarget, ScreenTargetRect> = {
  tiny: { scale: 0.062, x: "+2.2vw", y: "+26vh", opacity: 1 },
  centered: { scale: 1.0, x: "0", y: "0", opacity: 1 },
  "docked-left": { scale: 0.5, x: "-28vw", y: "0", opacity: 1 },
} as const
