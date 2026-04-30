import type { StageDef, StageId } from "./types"

/**
 * The three choreography stages. Each carries:
 *   - window: the [start, end] scroll-progress range where this stage
 *     holds at its peak transform.
 *   - scale / x / y / opacity: the product-screen's peak-of-stage rect.
 *     ProductScreen's useTransform reads these directly (one fewer layer
 *     of indirection than the previous ScreenTarget preset map).
 *
 * Windows are monotonic non-overlapping: the morph between adjacent
 * stages happens in the gap (prev.window[1] → next.window[0]). The
 * useTransform keyframe array is built by
 * STAGES.flatMap(s => [s.window[0], s.window[1]]) (6 stops, value at
 * window[0] === value at window[1] = the hold).
 *
 *   hero:   tiny over the laptop in the cartoon illustration
 *   wow:    centered full-viewport reveal
 *   docked: parked on the right side at half scale
 *
 * Cascade: PaperBackdrop's VIDEO_GATE_THRESHOLD = byId("wow").window[1]
 * auto-tracks the wow exit point.
 */
export const STAGES = [
  {
    id: "hero",
    window: [0, 0.04] as const,
    scale: 0.068,
    x: "+0vw",
    y: "+23vh",
    opacity: 1,
  },
  {
    id: "wow",
    window: [0.24, 0.28] as const,
    scale: 1,
    x: "0",
    y: "0",
    opacity: 1,
  },
  {
    id: "docked",
    window: [0.33, 0.4] as const,
    scale: 0.5,
    x: "+28vw",
    y: "0",
    opacity: 1,
  },
] as const satisfies readonly StageDef[]

/** Throws on unknown id — see CONTEXT.md note that strict-types philosophy
 *  prefers a thrown error over `find(...)!` non-null assertions everywhere. */
export function byId(id: StageId): StageDef {
  const stage = STAGES.find((s) => s.id === id)
  if (!stage) throw new Error(`Unknown stage id: ${id}`)
  return stage
}
