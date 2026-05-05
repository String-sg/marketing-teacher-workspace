/**
 * Fixed bottom-strip inspector. Shows exact numeric values for the
 * currently selected `(stageId, property)` keyframe and writes back via
 * setStage. Hint text when nothing is selected.
 */
import {
  PROPERTY_BY_KEY,
  formatCssLength,
  splitCssLength,
} from "./property-adapters"
import { useSelection } from "./selection-context"
import { fmtNumber } from "./timeline-math"
import type { ChangeEvent } from "react"

import type { StageRectPatch } from "../dev-flow-context"
import type { StageDef, StageId } from "../types"

export function KeyframeInspector({
  stages,
  setStage,
}: {
  stages: ReadonlyArray<StageDef>
  setStage: (id: StageId, patch: StageRectPatch) => void
}) {
  const { selection, setSelection } = useSelection()
  if (!selection) {
    return (
      <div className="border-t border-black/10 bg-white/70 px-3 py-1.5 font-mono text-[10px] text-black/45">
        Click a keyframe to inspect. ⇧ fine · ⌥ raw · ←/→ time · ↑/↓ value · Esc deselect
      </div>
    )
  }
  const stage = stages.find((s) => s.id === selection.stageId)
  if (!stage) return null
  const adapter = PROPERTY_BY_KEY[selection.property]
  const value = adapter.read(stage)
  const w = stage.window

  return (
    <div className="flex flex-wrap items-center gap-2 border-t border-black/10 bg-white/80 px-3 py-1.5 font-mono text-[10px] text-black/75">
      <span className="rounded bg-black/5 px-1.5 py-0.5 font-medium tracking-wide text-black/70">
        {selection.stageId} · {selection.property}
      </span>
      <label className="flex items-center gap-1">
        <span className="text-black/50">w0</span>
        <input
          className="w-16 rounded border border-black/15 bg-white px-1 py-0.5 tabular-nums"
          max={1}
          min={0}
          onChange={(e: ChangeEvent<HTMLInputElement>) =>
            setStage(stage.id, {
              window: [Number(e.target.value), w[1]] as const,
            })
          }
          step={0.001}
          type="number"
          value={fmtNumber(w[0])}
        />
      </label>
      <label className="flex items-center gap-1">
        <span className="text-black/50">w1</span>
        <input
          className="w-16 rounded border border-black/15 bg-white px-1 py-0.5 tabular-nums"
          max={1}
          min={0}
          onChange={(e: ChangeEvent<HTMLInputElement>) =>
            setStage(stage.id, {
              window: [w[0], Number(e.target.value)] as const,
            })
          }
          step={0.001}
          type="number"
          value={fmtNumber(w[1])}
        />
      </label>
      <label className="flex items-center gap-1">
        <span className="text-black/50">{adapter.label}</span>
        {adapter.key === "x" || adapter.key === "y" ? (
          <input
            className="w-24 rounded border border-black/15 bg-white px-1 py-0.5 tabular-nums"
            onChange={(e) =>
              setStage(stage.id, adapter.write(stage, splitCssLength(e.target.value).num))
            }
            type="text"
            value={adapter.key === "x" ? stage.x : stage.y}
          />
        ) : (
          <input
            className="w-20 rounded border border-black/15 bg-white px-1 py-0.5 tabular-nums"
            onChange={(e) =>
              setStage(stage.id, adapter.write(stage, Number(e.target.value)))
            }
            step={adapter.coarseStep}
            type="number"
            value={value}
          />
        )}
      </label>
      <span className="font-mono text-[10px] text-black/40">
        {adapter.format(value)}
      </span>
      <button
        className="ml-auto rounded border border-black/10 px-1.5 py-0.5 text-black/60 hover:bg-black/5 hover:text-black"
        onClick={() => setSelection(null)}
        type="button"
      >
        Esc
      </button>
    </div>
  )
}

export { formatCssLength }
