import type { StageDef, StageId } from "./types"

export const STAGES = [
  {
    id: "hero",
    window: [0, 0.12] as const,
    scale: 0.068,
    x: "+0.09vw",
    y: "+22.9vh",
    opacity: 1,
  },
  {
    id: "wow",
    window: [0.24, 0.26] as const,
    scale: 1,
    x: "0",
    y: "0",
    opacity: 1,
  },
  {
    id: "docked",
    window: [0.3, 0.85] as const,
    scale: 0.5,
    x: "+28vw",
    y: "0",
    opacity: 1,
  },
] as const satisfies readonly StageDef[]

export function byId(id: StageId): StageDef {
  const stage = STAGES.find((s) => s.id === id)
  if (!stage) throw new Error(`Unknown stage id: ${id}`)
  return stage
}
