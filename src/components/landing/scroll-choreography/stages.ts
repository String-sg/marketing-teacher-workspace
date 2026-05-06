import type { StageDef, StageId } from "./types"

// Stage offsets are in cqi (1 cqi = 1% of the hero-stage frame width).
// The frame is an aspect-locked 16:10 container inside paper-card with
// `container-type: inline-size`, so cqi resolves against the frame's
// layout box and stays invariant across viewport aspect ratios. See
// paper-backdrop.tsx for the frame definition.
//
// At hero stage the product-screen sits on the laptop in the SVG
// illustration. Both the SVG (top:54%, w:22cqi) and the screen translate
// reference the same ruler, so the alignment holds at any window size
// without retuning.
export const STAGES = [
  {
    id: "hero",
    window: [0, 0.21] as const,
    scale: 0.05,
    x: "0cqi",
    y: "+6.5cqi",
    opacity: 1,
  },
  {
    id: "wow",
    window: [0.57, 0.62] as const,
    scale: 1,
    x: "0cqi",
    y: "0cqi",
    opacity: 1,
  },
  {
    id: "docked",
    window: [0.63, 0.98] as const,
    scale: 0.5,
    x: "+28cqi",
    y: "0cqi",
    opacity: 1,
  },
] as const satisfies readonly StageDef[]

export function byId(id: StageId): StageDef {
  const stage = STAGES.find((s) => s.id === id)
  if (!stage) throw new Error(`Unknown stage id: ${id}`)
  return stage
}
