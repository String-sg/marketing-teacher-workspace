import type { ScreenTarget, ScreenTargetRect, StageDef, StageId } from "./types"

/**
 * The four choreography stages.
 *
 * Window numbers are FIRST-PASS — Phase 2/3 will tune them once the
 * orchestrator and product screen are running. Overlapping windows are
 * intentional (per CONTEXT.md D-12): neighboring stages cross-fade.
 *
 * Ordering is significant — `STAGES.map(...)` iterates in narrative beat.
 * Per RESEARCH.md OQ-1 we use `readonly StageDef[]` + `byId()` helper
 * (Option B) instead of `Record<StageId, StageDef>` so iteration is the
 * default and there is one source of truth for ordering.
 */
export const STAGES = [
  { id: "hero", window: [0.0, 0.25] as const, screen: "tiny" },
  { id: "wow", window: [0.2, 0.78] as const, screen: "centered" },
  { id: "feature-a", window: [0.5, 0.78] as const, screen: "docked-left" },
  { id: "feature-b", window: [0.75, 1.0] as const, screen: "docked-right" },
] as const satisfies readonly StageDef[]

/** Throws on unknown id — see CONTEXT.md note that strict-types philosophy
 *  prefers a thrown error over `find(...)!` non-null assertions everywhere. */
export function byId(id: StageId): StageDef {
  const stage = STAGES.find((s) => s.id === id)
  if (!stage) throw new Error(`Unknown stage id: ${id}`)
  return stage
}

/**
 * Phase 3 fills the rect values — Phase 1 ships only the type contract.
 *
 * Exporting just the TYPE (not a `declare const` value) means any Phase 1
 * value-import (`import { SCREEN_TARGETS } from "./stages"`) is a hard
 * TypeScript error rather than a silent `undefined` at runtime. This makes
 * the phase-gating contract enforceable by tsc instead of by hand-review.
 *
 * Phase 3 replaces this type alias with `export const SCREEN_TARGETS` of
 * the same shape. Consumers should import the type today and update the
 * import to a value once Phase 3 lands.
 */
export type ScreenTargetsMap = Record<ScreenTarget, ScreenTargetRect>
