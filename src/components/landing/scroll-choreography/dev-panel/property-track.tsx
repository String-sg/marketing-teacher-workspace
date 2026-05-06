/**
 * Per-stage property lane — one row in the unified timeline.
 *
 * Visual: a non-interactive "hold rail" bar spans each stage's window at
 * the value's vertical position; a single draggable dot sits at the
 * stage's window center. Diagonal connectors between consecutive stage
 * dots visualise the implied morph in the gaps. A live-value label sits
 * at the right edge and updates with the scroll scrub.
 *
 * Drag semantics (simplified vs prior bar-segment model):
 *   - Vertical drag on the dot → edits the stage's value via adapter.write
 *   - Horizontal drag is ignored (window editing lives on the stage strip)
 *   - ⇧ fine step · ⌥ raw / unsnapped
 *
 * Window editing was previously available on the bar body and edge dots
 * — that gesture is now consolidated to the stage strip at the top of
 * the panel, so each lane has exactly one thing to drag.
 */
import { useMemo, useRef, useState } from "react"

import { useDragHandler } from "./drag"
import { KeyframeDot } from "./keyframe-dot"
import {
  laneTToValue,
  pickStep,
  snapValue,
  splitCssLength,
  valueToLaneT,
} from "./property-adapters"
import { isSelected, useSelection } from "./selection-context"
import { pToVisual, viewSpan } from "./timeline-math"
import type { PropertyAdapter } from "./property-adapters"
import type { StageDef, StageId } from "../types"
import type { StageRectPatch, TimelineView } from "../dev-flow-context"
import type {
  KeyboardEvent as ReactKeyboardEvent,
  PointerEvent as ReactPointerEvent,
} from "react"

function parseAdapterInput(
  adapter: PropertyAdapter,
  raw: string
): number | null {
  const trimmed = raw.trim()
  if (!trimmed) return null
  if (adapter.key === "x" || adapter.key === "y") {
    const { num } = splitCssLength(trimmed)
    return Number.isFinite(num) ? num : null
  }
  const n = parseFloat(trimmed)
  return Number.isFinite(n) ? n : null
}

const STAGE_BAND_BG: Record<StageId, string> = {
  hero: "rgba(163, 212, 255, 0.15)",
  wow: "rgba(255, 210, 143, 0.15)",
  docked: "rgba(155, 224, 168, 0.15)",
}

const LANE_HEIGHT = 28

type DragInitial = {
  readonly stageId: StageId
  readonly value: number
}

/** Linearly interpolate the property's value at scroll progress p, using
 *  stage windows as keyframes (held during each window, linear in gaps). */
function liveValueAt(
  adapter: PropertyAdapter,
  stages: ReadonlyArray<StageDef>,
  p: number
): number {
  for (const s of stages) {
    if (p >= s.window[0] && p <= s.window[1]) return adapter.read(s)
  }
  for (let i = 0; i < stages.length - 1; i++) {
    const a = stages[i]
    const b = stages[i + 1]
    if (p > a.window[1] && p < b.window[0]) {
      const t = (p - a.window[1]) / (b.window[0] - a.window[1])
      const va = adapter.read(a)
      const vb = adapter.read(b)
      return va + t * (vb - va)
    }
  }
  if (p < stages[0].window[0]) return adapter.read(stages[0])
  return adapter.read(stages[stages.length - 1])
}

export function PropertyTrack({
  adapter,
  stages,
  view,
  setStage,
  progress,
}: {
  adapter: PropertyAdapter
  stages: ReadonlyArray<StageDef>
  view: TimelineView
  setStage: (id: StageId, patch: StageRectPatch) => void
  progress: number
}) {
  const trackRef = useRef<HTMLDivElement>(null)
  const { selection, setSelection } = useSelection()

  const span = viewSpan(view)

  const beginDrag = useDragHandler<DragInitial>({
    onMove(state) {
      // Vertical-only drag: ignore horizontal motion entirely.
      const dt = -state.dy / LANE_HEIGHT
      const startT = valueToLaneT(adapter, state.initial.value)
      const nextT = Math.max(0, Math.min(1, startT + dt))
      const raw = laneTToValue(adapter, nextT)
      const step = pickStep(adapter, state.mods.shift, state.mods.alt)
      const snapped = snapValue(raw, step)
      const stage = stages.find((s) => s.id === state.initial.stageId)
      if (stage) setStage(state.initial.stageId, adapter.write(stage, snapped))
    },
  })

  const handleDotDown = (
    e: ReactPointerEvent<HTMLSpanElement>,
    stage: StageDef
  ) => {
    setSelection({
      stageId: stage.id,
      property: adapter.key,
      edge: "body",
    })
    beginDrag(e, {
      initial: { stageId: stage.id, value: adapter.read(stage) },
    })
  }

  const onKeyDown = (e: ReactKeyboardEvent<HTMLSpanElement>, stage: StageDef) => {
    if (e.key === "Escape") {
      setSelection(null)
      return
    }
    const vert = e.key === "ArrowUp" || e.key === "ArrowDown"
    if (!vert) return
    e.preventDefault()
    const sign = e.key === "ArrowUp" ? 1 : -1
    const factor = e.altKey ? 5 : 1
    const baseStep = e.shiftKey ? adapter.fineStep : adapter.coarseStep
    const next = adapter.read(stage) + baseStep * factor * sign
    setStage(stage.id, adapter.write(stage, next))
  }

  const segments = useMemo(
    () =>
      stages.map((stage) => {
        const v = adapter.read(stage)
        const t = valueToLaneT(adapter, v)
        const top = (1 - t) * 100
        const offTop = v > adapter.range[1]
        const offBottom = v < adapter.range[0]
        const center = (stage.window[0] + stage.window[1]) / 2
        return { stage, value: v, topPct: top, offTop, offBottom, center }
      }),
    [stages, adapter]
  )

  const live = liveValueAt(adapter, stages, progress)
  const activeStage =
    stages.find((s) => progress >= s.window[0] && progress <= s.window[1]) ??
    null

  return (
    <div className="grid grid-cols-[44px_1fr_64px] items-stretch gap-2">
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
        {/* Stage band tints (visual only, not interactive) */}
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
        {/* Reference guide: 1.0 for scale, 0 baseline for x/y */}
        {adapter.key === "scale" ? (
          <div
            aria-hidden
            className="pointer-events-none absolute right-0 left-0 border-t border-dashed border-black/15"
            style={{ top: `${(1 - valueToLaneT(adapter, 1)) * 100}%` }}
          />
        ) : null}
        {(adapter.key === "x" || adapter.key === "y") ? (
          <div
            aria-hidden
            className="pointer-events-none absolute right-0 left-0 border-t border-dashed border-black/15"
            style={{ top: `${(1 - valueToLaneT(adapter, 0)) * 100}%` }}
          />
        ) : null}
        {/* Hold rails: non-interactive bars showing this value's range */}
        {segments.map(({ stage, topPct, offTop, offBottom }) => {
          const safeTop = offTop ? 0 : offBottom ? 100 : topPct
          return (
            <div
              key={`rail-${stage.id}`}
              aria-hidden
              className="pointer-events-none absolute"
              style={{
                left: `${pToVisual(stage.window[0], view)}%`,
                width: `${((stage.window[1] - stage.window[0]) / span) * 100}%`,
                top: `${safeTop}%`,
                transform: "translateY(-50%)",
                height: 3,
                borderRadius: 9999,
                backgroundColor: adapter.color,
                opacity: offTop || offBottom ? 0.35 : 0.7,
              }}
            />
          )
        })}
        {/* Diagonal morph connectors between consecutive stages */}
        {segments.slice(0, -1).map((seg, i) => {
          const next = segments[i + 1]
          const x1 = pToVisual(seg.stage.window[1], view)
          const x2 = pToVisual(next.stage.window[0], view)
          if (x2 <= x1) return null
          const dx = x2 - x1
          const y1 = seg.topPct
          const y2 = next.topPct
          const dy = y2 - y1
          const lengthPct = Math.sqrt(dx * dx + (dy * dy) / 2)
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
                background: adapter.color,
                opacity: 0.5,
                transform: `rotate(${angle}deg)`,
              }}
            />
          )
        })}
        {/* Draggable dots — one per stage, at the stage center */}
        {segments.map(({ stage, value, topPct, offTop, offBottom, center }) => {
          const sel = isSelected(selection, stage.id, adapter.key)
          const safeTop = offTop ? 0 : offBottom ? 100 : topPct
          return (
            <KeyframeDot
              key={stage.id}
              color={adapter.color}
              selected={sel}
              title={`${stage.id} · ${adapter.label}: ${adapter.format(value)}`}
              cursor="ns-resize"
              onPointerDown={(e) => handleDotDown(e, stage)}
              onKeyDown={(e) => onKeyDown(e, stage)}
              style={{
                left: `${pToVisual(center, view)}%`,
                top: `${safeTop}%`,
              }}
            />
          )
        })}
        {/* Off-range badges */}
        {segments.map(({ stage, value, offTop, offBottom, center }) => {
          if (!offTop && !offBottom) return null
          return (
            <span
              key={`off-${stage.id}`}
              aria-hidden
              className="pointer-events-none absolute font-mono text-[9px] text-black/70"
              style={{
                left: `${pToVisual(center, view)}%`,
                top: offTop ? 4 : "calc(100% - 12px)",
                transform: "translateX(-50%)",
              }}
            >
              {adapter.format(value)}
            </span>
          )
        })}
        {/* Playhead */}
        <div
          aria-hidden
          className="pointer-events-none absolute top-0 h-full w-px bg-black/30"
          style={{ left: `${pToVisual(progress, view)}%` }}
        />
      </div>
      <LiveValueInput
        adapter={adapter}
        live={live}
        activeStage={activeStage}
        onCommit={(value) => {
          if (activeStage)
            setStage(activeStage.id, adapter.write(activeStage, value))
        }}
      />
    </div>
  )
}

function LiveValueInput({
  adapter,
  live,
  activeStage,
  onCommit,
}: {
  adapter: PropertyAdapter
  live: number
  activeStage: StageDef | null
  onCommit: (value: number) => void
}) {
  const [draft, setDraft] = useState<string | null>(null)
  const editing = draft !== null
  const editable = activeStage !== null
  const display = editing ? (draft ?? "") : adapter.format(live)

  const commit = () => {
    if (draft !== null && editable) {
      const parsed = parseAdapterInput(adapter, draft)
      if (parsed !== null) onCommit(parsed)
    }
    setDraft(null)
  }

  return (
    <input
      aria-label={
        editable
          ? `${adapter.label} for ${activeStage.id} stage`
          : `${adapter.label} (interpolating)`
      }
      className={[
        "w-full bg-transparent pr-1 text-right font-mono text-[10px] tabular-nums outline-none",
        editable
          ? "cursor-text text-black/75 focus:text-black"
          : "cursor-not-allowed text-black/40",
      ].join(" ")}
      readOnly={!editable}
      title={
        editable
          ? `Edit ${adapter.label} for ${activeStage.id} (Enter to commit, Esc to cancel)`
          : "Read-only — scroll into a stage's hold window to edit"
      }
      type="text"
      value={display}
      onChange={(e) => setDraft(e.target.value)}
      onFocus={(e) => {
        if (!editable) return
        setDraft(adapter.format(live))
        // defer so React commits the new value before selecting
        const target = e.currentTarget
        requestAnimationFrame(() => target.select())
      }}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault()
          e.currentTarget.blur()
        } else if (e.key === "Escape") {
          e.preventDefault()
          setDraft(null)
          e.currentTarget.blur()
        }
      }}
    />
  )
}
