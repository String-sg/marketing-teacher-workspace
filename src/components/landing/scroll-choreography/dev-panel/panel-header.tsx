/**
 * Panel header strip: title, live progress (p=0.xxx), zoom controls,
 * section-height input. Copy/reset move to the panel body since they're
 * less frequent than zoom.
 */
import { clamp01, fmtNumber } from "./timeline-math"
import type { ChangeEvent } from "react"

import type {
  PaperCardConfig,
  TimelineView,
} from "../dev-flow-context"
import type { StageDef } from "../types"

export function PanelHeader({
  progress,
  open,
  onToggleOpen,
  view,
  setView,
  scrollHeightVh,
  setScrollHeightVh,
  stages,
  paper,
}: {
  progress: number
  open: boolean
  onToggleOpen: () => void
  view: TimelineView
  setView: (v: TimelineView) => void
  scrollHeightVh: number
  setScrollHeightVh: (vh: number) => void
  stages: ReadonlyArray<StageDef>
  paper: PaperCardConfig
}) {
  const span = Math.max(view.end - view.start, 1e-6)

  const fitView = (): TimelineView => {
    const lo = Math.min(stages[0].window[0], paper.scaleMidProgress)
    const hi = Math.max(
      stages[stages.length - 1].window[1],
      paper.opacityFadeEnd
    )
    const margin = Math.max((hi - lo) * 0.08, 0.01)
    return { start: clamp01(lo - margin), end: clamp01(hi + margin) }
  }

  const zoomBy = (factor: number) => {
    const center = (view.start + view.end) / 2
    const half = (span * factor) / 2
    setView({ start: clamp01(center - half), end: clamp01(center + half) })
  }

  const isFullView = view.start <= 0 && view.end >= 1

  return (
    <header className="flex items-center gap-2 border-b border-black/10 bg-white/80 px-3 py-2 backdrop-blur">
      <span className="font-semibold tracking-wide">Flow tuner</span>
      <span className="font-mono text-[10px] text-black/60">
        p={progress.toFixed(3)}
      </span>
      <span className="ml-auto flex items-center gap-1 font-mono text-[10px] text-black/55">
        <button
          className="rounded border border-black/10 px-1.5 py-0.5 hover:bg-black/5 hover:text-black"
          onClick={() => setView(fitView())}
          title="Zoom to active region (stages + paper-card envelope)"
          type="button"
        >
          fit
        </button>
        <button
          className="rounded border border-black/10 px-1.5 py-0.5 hover:bg-black/5 hover:text-black disabled:cursor-not-allowed disabled:opacity-40"
          disabled={isFullView}
          onClick={() => setView({ start: 0, end: 1 })}
          title="Reset view to [0, 1]"
          type="button"
        >
          1:1
        </button>
        <button
          className="rounded border border-black/10 px-1.5 py-0.5 hover:bg-black/5 hover:text-black"
          onClick={() => zoomBy(0.6)}
          title="Zoom in"
          type="button"
        >
          +
        </button>
        <button
          className="rounded border border-black/10 px-1.5 py-0.5 hover:bg-black/5 hover:text-black disabled:cursor-not-allowed disabled:opacity-40"
          disabled={isFullView}
          onClick={() => zoomBy(1.5)}
          title="Zoom out"
          type="button"
        >
          −
        </button>
        <label
          className="ml-2 flex items-center gap-1"
          title="Total scroll-section height in lvh"
        >
          <span className="text-[10px] text-black/55">section</span>
          <input
            className="w-12 rounded border border-black/15 bg-white px-1 py-0.5 font-mono text-[10px] tabular-nums"
            max={1000}
            min={110}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              setScrollHeightVh(Number(e.target.value))
            }
            step={10}
            type="number"
            value={scrollHeightVh}
          />
          <span className="text-[10px] text-black/45">lvh</span>
        </label>
      </span>
      <button
        aria-label={open ? "Collapse" : "Expand"}
        className="ml-1 rounded px-2 py-0.5 text-black/60 hover:bg-black/5 hover:text-black"
        onClick={onToggleOpen}
        type="button"
      >
        {open ? "−" : "+"}
      </button>
    </header>
  )
}

export { fmtNumber }
