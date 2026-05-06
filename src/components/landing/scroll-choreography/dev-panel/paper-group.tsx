/**
 * Paper-card opacity lane for the unified timeline. Sits flat with the
 * per-stage SCALE/X/Y lanes so the timeline reads as one continuous
 * surface.
 *
 * The previous per-layer scale lanes (bg / cards / teacher) are gone:
 * scenery scale is now derived by ratio from the product-screen scale
 * curve in scroll-choreography.tsx, locking the screen visually to the
 * laptop drawn in the SVG. There's nothing per-layer to tune any more.
 *
 * <OpacityLane /> drives opacityFadeStart / opacityFadeEnd via two
 * draggable diamond markers, with a live-value label at the right edge
 * that updates with scroll scrub.
 */
import { useRef } from "react"

import { useDragHandler } from "./drag"
import { KeyframeDot } from "./keyframe-dot"
import {
  clamp01,
  fmtNumber,
  pToVisual,
  quantize,
  viewSpan,
} from "./timeline-math"
import type {
  PaperCardConfig,
  PaperCardPatch,
  TimelineView,
} from "../dev-flow-context"
import type { ChangeEvent, PointerEvent as ReactPointerEvent } from "react"

const LANE_HEIGHT = 28

type OpacityDragInit = {
  rect: DOMRect
  startProgress: number
  key: "opacityFadeStart" | "opacityFadeEnd"
}

function liveOpacityAt(
  progress: number,
  fadeStart: number,
  fadeEnd: number
): number {
  if (progress <= fadeStart) return 1
  if (progress >= fadeEnd) return 0
  const t = (progress - fadeStart) / Math.max(fadeEnd - fadeStart, 1e-6)
  return 1 - t
}

export function OpacityLane({
  paper,
  setPaperCard,
  view,
  progress,
}: {
  paper: PaperCardConfig
  setPaperCard: (patch: PaperCardPatch) => void
  view: TimelineView
  progress: number
}) {
  const trackRef = useRef<HTMLDivElement>(null)
  const span = viewSpan(view)
  const live = liveOpacityAt(progress, paper.opacityFadeStart, paper.opacityFadeEnd)

  const beginOpacityDrag = useDragHandler<OpacityDragInit>({
    onMove(state) {
      const dpRaw = (state.dx / state.initial.rect.width) * span
      const dp = quantize(dpRaw, state.mods.shift, state.mods.alt)
      const nextProgress = clamp01(state.initial.startProgress + dp)
      setPaperCard({ [state.initial.key]: nextProgress })
    },
  })

  const handleDown = (
    e: ReactPointerEvent<HTMLSpanElement>,
    key: "opacityFadeStart" | "opacityFadeEnd"
  ) => {
    const t = trackRef.current
    if (!t) return
    beginOpacityDrag(e, {
      initial: {
        rect: t.getBoundingClientRect(),
        startProgress: paper[key],
        key,
      },
    })
  }

  return (
    <div className="grid grid-cols-[44px_1fr_56px] items-stretch gap-2">
      <div className="flex items-center text-[10px] tracking-wider text-black/55 uppercase">
        <span
          aria-hidden
          className="mr-1.5 inline-block size-2 rounded-sm"
          style={{ backgroundColor: "#0ea5e9" }}
        />
        opacity
      </div>
      <div
        ref={trackRef}
        className="relative w-full overflow-hidden rounded bg-white/40"
        style={{ height: LANE_HEIGHT }}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute top-1/2 h-1 -translate-y-1/2 rounded bg-sky-500/25"
          style={{
            left: `${pToVisual(0, view)}%`,
            width: `${(paper.opacityFadeStart / span) * 100}%`,
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute top-1/2 h-1 -translate-y-1/2 rounded bg-gradient-to-r from-sky-500/25 to-transparent"
          style={{
            left: `${pToVisual(paper.opacityFadeStart, view)}%`,
            width: `${(Math.max(0, paper.opacityFadeEnd - paper.opacityFadeStart) / span) * 100}%`,
          }}
        />
        <KeyframeDot
          shape="diamond"
          color="#0ea5e9"
          title={`fade in: ${fmtNumber(paper.opacityFadeStart)}`}
          cursor="ew-resize"
          onPointerDown={(e) => handleDown(e, "opacityFadeStart")}
          style={{
            left: `${pToVisual(paper.opacityFadeStart, view)}%`,
            top: "50%",
          }}
        />
        <KeyframeDot
          shape="diamond"
          color="#0f172a"
          title={`fade out: ${fmtNumber(paper.opacityFadeEnd)}`}
          cursor="ew-resize"
          onPointerDown={(e) => handleDown(e, "opacityFadeEnd")}
          style={{
            left: `${pToVisual(paper.opacityFadeEnd, view)}%`,
            top: "50%",
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute top-0 h-full w-px bg-black/30"
          style={{ left: `${pToVisual(progress, view)}%` }}
        />
      </div>
      <div className="flex items-center justify-end pr-1 font-mono text-[10px] tabular-nums text-black/65">
        {live.toFixed(2)}
      </div>
    </div>
  )
}

/**
 * Focal-point Y for the layered scenery (cards + teacher) — tunes the
 * transform-origin Y the camera dollies into. Default 68% lands on the
 * laptop in the SVG so the screen-on-laptop stays in viewport as
 * teacher scales up. Pull lower (≈62) if the laptop reads too high in
 * a future SVG revision; pull higher (≈74) if it reads too low.
 */
export function FocalPointField({
  paper,
  setPaperCard,
}: {
  paper: PaperCardConfig
  setPaperCard: (patch: PaperCardPatch) => void
}) {
  const onChange = (e: ChangeEvent<HTMLInputElement>) => {
    setPaperCard({ paperOriginY: Number(e.target.value) })
  }
  return (
    <details className="rounded border border-black/10">
      <summary className="cursor-pointer px-2 py-1 font-medium tracking-wide select-none">
        focal point
        <span className="ml-2 font-mono text-[10px] text-black/45">
          origin Y {fmtNumber(paper.paperOriginY)}%
        </span>
      </summary>
      <div className="space-y-2 px-2 pt-1 pb-2">
        <label className="flex items-center gap-2 text-[10px] tracking-wider text-black/55 uppercase">
          <span className="w-24">paperOriginY %</span>
          <input
            aria-label="Paper card focal-point Y"
            className="w-full"
            max={90}
            min={50}
            onChange={onChange}
            step={0.5}
            type="range"
            value={paper.paperOriginY}
          />
          <input
            className="w-14 rounded border border-black/15 bg-white px-1.5 py-0.5 font-mono"
            max={100}
            min={0}
            onChange={onChange}
            step={0.5}
            type="number"
            value={paper.paperOriginY}
          />
        </label>
      </div>
    </details>
  )
}
