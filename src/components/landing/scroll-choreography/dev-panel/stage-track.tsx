/**
 * Stage track: hero/wow/docked colored bands with move + edge-resize.
 * This is the canonical surface for editing each stage's `window`. The
 * property tracks below mirror the same windows (reading from the same
 * StageDef.window), so a drag here propagates everywhere automatically.
 *
 * Also hosts the playhead indicator and a click-to-scrub on the empty
 * track background.
 */
import { useRef, useState } from "react"
import {
  MIN_WIDTH,
  clamp01,
  fmtNumber,
  mouseToProgress,
  pToVisual,
  quantize,
} from "./timeline-math"
import type {
  KeyboardEvent as ReactKeyboardEvent,
  PointerEvent as ReactPointerEvent,
} from "react"

import type { FlowWindow, StageRectPatch, TimelineView  } from "../dev-flow-context"
import type { StageDef, StageId } from "../types"

const STAGE_COLORS: Record<StageId, string> = {
  hero: "#a3d4ff",
  wow: "#ffd28f",
  docked: "#9be0a8",
}

const STAGE_ORDER: ReadonlyArray<StageId> = ["hero", "wow", "docked"]

type DragMode = "move" | "left" | "right"
type DragHint = { id: StageId; lo: number; hi: number }

function applyEdgeMin(next: FlowWindow): FlowWindow {
  const lo = clamp01(next[0])
  const hi = clamp01(next[1])
  if (hi - lo >= MIN_WIDTH) return [lo, hi]
  if (lo + MIN_WIDTH <= 1) return [lo, lo + MIN_WIDTH]
  return [hi - MIN_WIDTH, hi]
}

function scrubToProgress(progress: number) {
  const section = document.querySelector<HTMLElement>(
    ".scroll-choreography-only"
  )
  if (!section) return
  const sectionTopOnPage = window.scrollY + section.getBoundingClientRect().top
  const scrollableSpan = section.offsetHeight - window.innerHeight
  const target = sectionTopOnPage + scrollableSpan * progress
  window.scrollTo({ top: target, behavior: "instant" })
}

export function StageTrack({
  stages,
  setStage,
  view,
  progress,
}: {
  stages: ReadonlyArray<StageDef>
  setStage: (id: StageId, patch: StageRectPatch) => void
  view: TimelineView
  progress: number
}) {
  const trackRef = useRef<HTMLDivElement>(null)
  const [dragHint, setDragHint] = useState<DragHint | null>(null)

  const stageById = (id: StageId) => stages.find((s) => s.id === id)!

  const beginDrag = (
    e: ReactPointerEvent<HTMLElement>,
    id: StageId,
    mode: DragMode
  ) => {
    e.preventDefault()
    e.stopPropagation()
    const track = trackRef.current
    if (!track) return
    const rect = track.getBoundingClientRect()
    const startWindow = stageById(id).window
    const rawStart = mouseToProgress(e.clientX, rect, view)

    const onMove = (ev: PointerEvent) => {
      const raw = mouseToProgress(ev.clientX, rect, view)
      const p = quantize(raw, ev.shiftKey, ev.altKey)
      let next: FlowWindow
      if (mode === "left") {
        next = applyEdgeMin([p, startWindow[1]])
      } else if (mode === "right") {
        next = applyEdgeMin([startWindow[0], p])
      } else {
        const delta =
          quantize(raw, ev.shiftKey, ev.altKey) -
          quantize(rawStart, ev.shiftKey, ev.altKey)
        const width = startWindow[1] - startWindow[0]
        const lo = clamp01(startWindow[0] + delta)
        const loClamped = Math.min(lo, 1 - width)
        next = [Math.max(0, loClamped), Math.max(0, loClamped) + width]
      }
      setStage(id, { window: next })
      setDragHint({ id, lo: next[0], hi: next[1] })
    }
    const onUp = () => {
      setDragHint(null)
      window.removeEventListener("pointermove", onMove)
      window.removeEventListener("pointerup", onUp)
      window.removeEventListener("pointercancel", onUp)
    }
    setDragHint({ id, lo: startWindow[0], hi: startWindow[1] })
    window.addEventListener("pointermove", onMove)
    window.addEventListener("pointerup", onUp)
    window.addEventListener("pointercancel", onUp)
  }

  const onTrackPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.target !== e.currentTarget) return
    const track = trackRef.current
    if (!track) return
    const rect = track.getBoundingClientRect()
    scrubToProgress(mouseToProgress(e.clientX, rect, view))
  }

  const onBandKeyDown = (
    e: ReactKeyboardEvent<HTMLDivElement>,
    id: StageId
  ) => {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return
    e.preventDefault()
    const sign = e.key === "ArrowRight" ? 1 : -1
    const step = (e.shiftKey ? 0.001 : 0.01) * sign
    const w = stageById(id).window
    let next: FlowWindow
    if (e.altKey) {
      next = applyEdgeMin([w[0] + step, w[1]])
    } else {
      const width = w[1] - w[0]
      const lo = clamp01(w[0] + step)
      const loClamped = Math.min(lo, 1 - width)
      next = [Math.max(0, loClamped), Math.max(0, loClamped) + width]
    }
    setStage(id, { window: next })
  }

  const span = Math.max(view.end - view.start, 1e-6)

  return (
    <div
      className="relative h-7 w-full overflow-hidden rounded bg-black/5"
      onPointerDown={onTrackPointerDown}
      ref={trackRef}
    >
      {STAGE_ORDER.map((id) => {
        const w = stageById(id).window
        const left = `${pToVisual(w[0], view)}%`
        const width = `${((w[1] - w[0]) / span) * 100}%`
        return (
          <div
            className="group absolute top-0 flex h-full cursor-grab items-center justify-center rounded text-[9px] font-medium text-black/70 outline-none ring-offset-1 focus-visible:ring-2 focus-visible:ring-black/60 active:cursor-grabbing"
            key={id}
            onKeyDown={(e) => onBandKeyDown(e, id)}
            onPointerDown={(e) => beginDrag(e, id, "move")}
            role="slider"
            aria-label={`${id} stage window`}
            aria-valuemin={0}
            aria-valuemax={1}
            aria-valuenow={w[0]}
            tabIndex={0}
            style={{ left, width, backgroundColor: STAGE_COLORS[id] }}
            title={`${id}: ${w[0].toFixed(3)}–${w[1].toFixed(3)} (${(w[1] - w[0]).toFixed(3)})`}
          >
            <span className="pointer-events-none truncate px-1">{id}</span>
            <span
              aria-hidden
              className="absolute top-0 -left-1 z-10 flex h-full w-2 cursor-ew-resize items-center justify-center"
              onPointerDown={(e) => beginDrag(e, id, "left")}
            >
              <span className="block h-full w-0.5 rounded-sm bg-black/40 group-hover:bg-black/70" />
            </span>
            <span
              aria-hidden
              className="absolute top-0 -right-1 z-10 flex h-full w-2 cursor-ew-resize items-center justify-center"
              onPointerDown={(e) => beginDrag(e, id, "right")}
            >
              <span className="block h-full w-0.5 rounded-sm bg-black/40 group-hover:bg-black/70" />
            </span>
          </div>
        )
      })}

      {dragHint ? (
        <div
          className="pointer-events-none absolute -top-7 z-20 rounded bg-black/85 px-1.5 py-0.5 font-mono text-[10px] whitespace-nowrap text-white"
          style={{
            left: `${pToVisual((dragHint.lo + dragHint.hi) / 2, view)}%`,
            transform: "translateX(-50%)",
          }}
        >
          {fmtNumber(dragHint.lo)} → {fmtNumber(dragHint.hi)} (
          {fmtNumber(dragHint.hi - dragHint.lo)})
        </div>
      ) : null}

      <div
        aria-hidden
        className="pointer-events-none absolute top-0 h-full w-[2px] bg-black"
        style={{ left: `${pToVisual(progress, view)}%` }}
      />
    </div>
  )
}

export { STAGE_COLORS, STAGE_ORDER }
