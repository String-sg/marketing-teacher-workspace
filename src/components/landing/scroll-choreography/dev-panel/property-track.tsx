/**
 * Generic property track row. Renders one horizontal lane with three
 * segment bars (one per stage) at the height that maps to that stage's
 * value, plus diagonal connectors across the gaps to visualize the
 * morph. Each segment has two grab dots at its window edges.
 *
 * Drag semantics:
 *   - bar body: horizontal moves both edges (preserves stage width),
 *     vertical drag updates value
 *   - left/right dot: horizontal moves that edge, vertical updates value
 *   - ⇧ axis-locks to dominant axis after a 4px deadzone
 *   - ⌥ disables quantize (raw)
 */
import { useMemo, useRef } from "react"

import { useDragHandler } from "./drag"
import { KeyframeDot } from "./keyframe-dot"
import {
  laneTToValue,
  pickStep,
  snapValue,
  valueToLaneT,
} from "./property-adapters"
import { isSelected, useSelection } from "./selection-context"
import {
  MIN_WIDTH,
  clamp01,
  pToVisual,
  quantize,
  viewSpan,
} from "./timeline-math"
import type { PropertyAdapter } from "./property-adapters"
import type { StageDef, StageId } from "../types"
import type { FlowWindow, StageRectPatch, TimelineView  } from "../dev-flow-context"
import type {
  KeyboardEvent as ReactKeyboardEvent,
  PointerEvent as ReactPointerEvent,
} from "react"

const STAGE_BAND_BG: Record<StageId, string> = {
  hero: "rgba(163, 212, 255, 0.15)",
  wow: "rgba(255, 210, 143, 0.15)",
  docked: "rgba(155, 224, 168, 0.15)",
}

type DragInitial = {
  readonly stageId: StageId
  readonly mode: "body" | "start" | "end"
  readonly window: FlowWindow
  readonly value: number
  readonly rect: DOMRect
  readonly axis: "free" | "x" | "y"
}

const DEAD_ZONE = 4

function applyEdgeMin(next: FlowWindow): FlowWindow {
  const lo = clamp01(next[0])
  const hi = clamp01(next[1])
  if (hi - lo >= MIN_WIDTH) return [lo, hi]
  if (lo + MIN_WIDTH <= 1) return [lo, lo + MIN_WIDTH]
  return [hi - MIN_WIDTH, hi]
}

export function PropertyTrack({
  adapter,
  stages,
  view,
  setStage,
}: {
  adapter: PropertyAdapter
  stages: ReadonlyArray<StageDef>
  view: TimelineView
  setStage: (id: StageId, patch: StageRectPatch) => void
}) {
  const trackRef = useRef<HTMLDivElement>(null)
  const { selection, setSelection } = useSelection()

  const span = viewSpan(view)

  const beginDrag = useDragHandler<DragInitial>({
    onMove(state) {
      const init = state.initial
      let axis = init.axis
      // Resolve axis lock after deadzone if shift was held at start.
      if (axis !== "free" && Math.abs(state.dx) + Math.abs(state.dy) < DEAD_ZONE) {
        return
      }
      if (init.axis === "free" && state.mods.shift) {
        axis = Math.abs(state.dx) > Math.abs(state.dy) ? "x" : "y"
      }
      // Horizontal: progress delta proportional to track width.
      if (axis !== "y") {
        const dpRaw = (state.dx / init.rect.width) * span
        const dp = quantize(dpRaw, state.mods.shift, state.mods.alt)
        let next: FlowWindow
        if (init.mode === "start") {
          next = applyEdgeMin([init.window[0] + dp, init.window[1]])
        } else if (init.mode === "end") {
          next = applyEdgeMin([init.window[0], init.window[1] + dp])
        } else {
          const width = init.window[1] - init.window[0]
          const lo = clamp01(init.window[0] + dp)
          const loClamp = Math.min(lo, 1 - width)
          const safeLo = Math.max(0, loClamp)
          next = [safeLo, safeLo + width]
        }
        setStage(init.stageId, { window: next })
      }
      // Vertical: invert dy because top of lane = max value.
      if (axis !== "x") {
        const laneHeight = LANE_HEIGHT
        const dt = -state.dy / laneHeight
        const startT = valueToLaneT(adapter, init.value)
        const nextT = Math.max(0, Math.min(1, startT + dt))
        const raw = laneTToValue(adapter, nextT)
        const step = pickStep(adapter, state.mods.shift, state.mods.alt)
        const snapped = snapValue(raw, step)
        const stage = stages.find((s) => s.id === init.stageId)
        if (stage) {
          setStage(init.stageId, adapter.write(stage, snapped))
        }
      }
    },
  })

  const handleEdgeDown = (
    e: ReactPointerEvent<HTMLSpanElement>,
    stage: StageDef,
    mode: "start" | "end" | "body"
  ) => {
    const track = trackRef.current
    if (!track) return
    setSelection({ stageId: stage.id, property: adapter.key, edge: mode === "body" ? "body" : mode })
    beginDrag(e, {
      initial: {
        stageId: stage.id,
        mode,
        window: stage.window,
        value: adapter.read(stage),
        rect: track.getBoundingClientRect(),
        axis: e.shiftKey ? "free" : "free",
      },
    })
  }

  const onKeyDown = (
    e: ReactKeyboardEvent<HTMLSpanElement>,
    stage: StageDef,
    mode: "start" | "end" | "body"
  ) => {
    const horiz = e.key === "ArrowLeft" || e.key === "ArrowRight"
    const vert = e.key === "ArrowUp" || e.key === "ArrowDown"
    if (!horiz && !vert) {
      if (e.key === "Escape") {
        setSelection(null)
      }
      return
    }
    e.preventDefault()
    if (horiz) {
      const sign = e.key === "ArrowRight" ? 1 : -1
      const dp = (e.shiftKey ? 0.001 : 0.01) * sign
      const w = stage.window
      let next: FlowWindow
      if (mode === "body" || (mode === "start" && !e.altKey) || (mode === "end" && !e.altKey)) {
        if (mode === "body") {
          const width = w[1] - w[0]
          const lo = clamp01(w[0] + dp)
          const loClamp = Math.min(lo, 1 - width)
          const safe = Math.max(0, loClamp)
          next = [safe, safe + width]
        } else if (mode === "start") {
          next = applyEdgeMin([w[0] + dp, w[1]])
        } else {
          next = applyEdgeMin([w[0], w[1] + dp])
        }
      } else {
        // Alt + arrow: limit motion to a single edge.
        next =
          mode === "end"
            ? applyEdgeMin([w[0], w[1] + dp])
            : applyEdgeMin([w[0] + dp, w[1]])
      }
      setStage(stage.id, { window: next })
    } else {
      const sign = e.key === "ArrowUp" ? 1 : -1
      const factor = e.altKey ? 5 : 1
      const step = (e.shiftKey ? adapter.fineStep : adapter.coarseStep) * factor * sign
      const next = adapter.read(stage) + step
      setStage(stage.id, adapter.write(stage, next))
    }
  }

  const segments = useMemo(
    () =>
      stages.map((stage) => {
        const v = adapter.read(stage)
        const t = valueToLaneT(adapter, v)
        const top = (1 - t) * 100
        const offTop = v > adapter.range[1]
        const offBottom = v < adapter.range[0]
        return { stage, value: v, topPct: top, offTop, offBottom }
      }),
    [stages, adapter]
  )

  return (
    <div className="grid grid-cols-[60px_1fr] items-stretch gap-2">
      <div className="flex items-center text-[10px] tracking-wider text-black/55 uppercase">
        <span
          aria-hidden
          className="mr-1.5 inline-block size-2 rounded-sm"
          style={{ backgroundColor: adapter.color }}
        />
        {adapter.label}
      </div>
      <div
        className="relative w-full overflow-hidden rounded bg-white/40"
        ref={trackRef}
        style={{ height: LANE_HEIGHT }}
      >
        {/* Stage band tints */}
        {stages.map((stage) => (
          <div
            key={stage.id}
            aria-hidden
            className="pointer-events-none absolute top-0 h-full"
            style={{
              left: `${pToVisual(stage.window[0], view)}%`,
              width: `${((stage.window[1] - stage.window[0]) / span) * 100}%`,
              backgroundColor: STAGE_BAND_BG[stage.id],
            }}
          />
        ))}
        {/* 1.0 guide for scale */}
        {adapter.key === "scale" ? (
          <div
            aria-hidden
            className="pointer-events-none absolute right-0 left-0 border-t border-dashed border-black/15"
            style={{ top: `${(1 - valueToLaneT(adapter, 1)) * 100}%` }}
          />
        ) : null}
        {/* 0 baseline for x/y */}
        {(adapter.key === "x" || adapter.key === "y") ? (
          <div
            aria-hidden
            className="pointer-events-none absolute right-0 left-0 border-t border-dashed border-black/15"
            style={{ top: `${(1 - valueToLaneT(adapter, 0)) * 100}%` }}
          />
        ) : null}
        {/* Diagonal connectors between segments */}
        {segments.slice(0, -1).map((seg, i) => {
          const next = segments[i + 1]
          const x1 = pToVisual(seg.stage.window[1], view)
          const x2 = pToVisual(next.stage.window[0], view)
          if (x2 <= x1) return null
          const dx = x2 - x1
          const y1 = seg.topPct
          const y2 = next.topPct
          const dy = y2 - y1
          const lengthPct = Math.sqrt(dx * dx + (dy * dy) / 2) // visual approx
          const angle = Math.atan2(dy, dx) * (180 / Math.PI)
          return (
            <div
              key={`gap-${seg.stage.id}`}
              aria-hidden
              className="pointer-events-none absolute origin-left"
              style={{
                left: `${x1}%`,
                top: `${y1}%`,
                width: `${lengthPct}%`,
                height: 1,
                background: `linear-gradient(90deg, ${adapter.color}66, ${adapter.color}66)`,
                transform: `rotate(${angle}deg)`,
              }}
            />
          )
        })}
        {/* Segment bars + dots */}
        {segments.map(({ stage, value, topPct, offTop, offBottom }) => {
          const left = `${pToVisual(stage.window[0], view)}%`
          const width = `${((stage.window[1] - stage.window[0]) / span) * 100}%`
          const sel = isSelected(selection, stage.id, adapter.key)
          const pinTop = offTop
          const pinBottom = offBottom
          const safeTop = pinTop ? 0 : pinBottom ? 100 : topPct
          return (
            <div
              key={stage.id}
              className="absolute"
              style={{
                left,
                width,
                top: `${safeTop}%`,
                transform: "translateY(-50%)",
                height: 0,
              }}
            >
              {/* Segment bar (clickable, draggable body) */}
              <span
                role="button"
                tabIndex={0}
                title={`${stage.id} · ${adapter.label}: ${adapter.format(value)}`}
                onPointerDown={(e) => handleEdgeDown(e, stage, "body")}
                onKeyDown={(e) => onKeyDown(e, stage, "body")}
                className={`absolute -translate-y-1/2 cursor-grab rounded-full active:cursor-grabbing ${
                  sel && selection?.edge === "body" ? "outline outline-2 outline-offset-1 outline-black/60" : ""
                }`}
                style={{
                  left: 0,
                  right: 0,
                  height: 4,
                  backgroundColor: adapter.color,
                  opacity: pinTop || pinBottom ? 0.4 : 0.9,
                }}
              />
              {/* Left edge dot */}
              <KeyframeDot
                color={adapter.color}
                selected={sel && selection?.edge === "start"}
                title={`${stage.id} start · ${adapter.format(value)}`}
                cursor="ew-resize"
                onPointerDown={(e) => handleEdgeDown(e, stage, "start")}
                style={{ left: 0, top: 0 }}
              />
              {/* Right edge dot */}
              <KeyframeDot
                color={adapter.color}
                selected={sel && selection?.edge === "end"}
                title={`${stage.id} end · ${adapter.format(value)}`}
                cursor="ew-resize"
                onPointerDown={(e) => handleEdgeDown(e, stage, "end")}
                style={{ left: "100%", top: 0 }}
              />
              {/* Off-range badge */}
              {(pinTop || pinBottom) ? (
                <span
                  aria-hidden
                  className="pointer-events-none absolute font-mono text-[9px] text-black/70"
                  style={{
                    left: "50%",
                    top: pinTop ? 6 : -14,
                    transform: "translateX(-50%)",
                  }}
                >
                  {adapter.format(value)}
                </span>
              ) : null}
            </div>
          )
        })}
      </div>
    </div>
  )
}

const LANE_HEIGHT = 36
