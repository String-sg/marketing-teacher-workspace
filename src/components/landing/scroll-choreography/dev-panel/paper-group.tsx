/**
 * Paper-card track group. Two short tracks beneath the property tracks:
 *
 *   1) paper.scale — 4 anchors (0,1) ghost, (heroHoldEnd,1) ghost,
 *      (scaleMidProgress, scaleMidValue) draggable both axes,
 *      (1, scaleEndValue) y-only draggable.
 *   2) paper.opacity — two diamond markers (opacityFadeStart, end) with
 *      a gradient fade strip from 1→0.
 *
 * heroHoldEnd auto-tracks the hero stage's window[1].
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
import type { PaperCardConfig, PaperCardPatch, TimelineView  } from "../dev-flow-context"
import type { PointerEvent as ReactPointerEvent } from "react"

const SCALE_LANE_HEIGHT = 44
const OPACITY_LANE_HEIGHT = 18

const PAPER_SCALE_RANGE = [0, 6] as const

function valueToTopPct(v: number, range: readonly [number, number]) {
  const [lo, hi] = range
  const t = Math.max(0, Math.min(1, (v - lo) / (hi - lo)))
  return (1 - t) * 100
}

type ScaleDragInit = {
  rect: DOMRect
  startProgress: number
  startValue: number
}

type ScaleVerticalDragInit = {
  rect: DOMRect
  startValue: number
}

type OpacityDragInit = {
  rect: DOMRect
  startProgress: number
  key: "opacityFadeStart" | "opacityFadeEnd"
}

export function PaperGroup({
  paper,
  setPaperCard,
  heroHoldEnd,
  view,
  progress,
}: {
  paper: PaperCardConfig
  setPaperCard: (patch: PaperCardPatch) => void
  heroHoldEnd: number
  view: TimelineView
  progress: number
}) {
  const scaleTrackRef = useRef<HTMLDivElement>(null)
  const opacityTrackRef = useRef<HTMLDivElement>(null)
  const span = viewSpan(view)

  // Live scale/opacity for the inspector hint
  const liveScale = (() => {
    const heroEnd = heroHoldEnd
    if (progress <= heroEnd) return 1
    if (progress <= paper.scaleMidProgress) {
      const t = (progress - heroEnd) / Math.max(paper.scaleMidProgress - heroEnd, 1e-6)
      return 1 + t * (paper.scaleMidValue - 1)
    }
    const t = (progress - paper.scaleMidProgress) / Math.max(1 - paper.scaleMidProgress, 1e-6)
    return paper.scaleMidValue + t * (paper.scaleEndValue - paper.scaleMidValue)
  })()
  const liveOpacity = (() => {
    if (progress <= paper.opacityFadeStart) return 1
    if (progress >= paper.opacityFadeEnd) return 0
    const t =
      (progress - paper.opacityFadeStart) /
      Math.max(paper.opacityFadeEnd - paper.opacityFadeStart, 1e-6)
    return 1 - t
  })()

  const beginScaleMidDrag = useDragHandler<ScaleDragInit>({
    onMove(state) {
      // Horizontal: progress
      const dpRaw = (state.dx / state.initial.rect.width) * span
      const dp = quantize(dpRaw, state.mods.shift, state.mods.alt)
      const nextProgress = clamp01(state.initial.startProgress + dp)
      // Vertical: value
      const range = PAPER_SCALE_RANGE
      const dvRaw = -(state.dy / SCALE_LANE_HEIGHT) * (range[1] - range[0])
      const step = state.mods.alt ? 0 : state.mods.shift ? 0.01 : 0.1
      const dv = step > 0 ? Math.round(dvRaw / step) * step : dvRaw
      const nextValue = state.initial.startValue + dv
      setPaperCard({ scaleMidProgress: nextProgress, scaleMidValue: nextValue })
    },
  })

  const beginScaleEndDrag = useDragHandler<ScaleVerticalDragInit>({
    onMove(state) {
      const range = PAPER_SCALE_RANGE
      const dvRaw = -(state.dy / SCALE_LANE_HEIGHT) * (range[1] - range[0])
      const step = state.mods.alt ? 0 : state.mods.shift ? 0.01 : 0.1
      const dv = step > 0 ? Math.round(dvRaw / step) * step : dvRaw
      setPaperCard({ scaleEndValue: state.initial.startValue + dv })
    },
  })

  const beginOpacityDrag = useDragHandler<OpacityDragInit>({
    onMove(state) {
      const dpRaw = (state.dx / state.initial.rect.width) * span
      const dp = quantize(dpRaw, state.mods.shift, state.mods.alt)
      const nextProgress = clamp01(state.initial.startProgress + dp)
      setPaperCard({ [state.initial.key]: nextProgress })
    },
  })

  const handleScaleMidDown = (e: ReactPointerEvent<HTMLSpanElement>) => {
    const track = scaleTrackRef.current
    if (!track) return
    beginScaleMidDrag(e, {
      initial: {
        rect: track.getBoundingClientRect(),
        startProgress: paper.scaleMidProgress,
        startValue: paper.scaleMidValue,
      },
    })
  }

  const handleScaleEndDown = (e: ReactPointerEvent<HTMLSpanElement>) => {
    beginScaleEndDrag(e, {
      initial: {
        rect: scaleTrackRef.current!.getBoundingClientRect(),
        startValue: paper.scaleEndValue,
      },
    })
  }

  const handleOpacityDown = (
    e: ReactPointerEvent<HTMLSpanElement>,
    key: "opacityFadeStart" | "opacityFadeEnd"
  ) => {
    const track = opacityTrackRef.current
    if (!track) return
    beginOpacityDrag(e, {
      initial: {
        rect: track.getBoundingClientRect(),
        startProgress: paper[key],
        key,
      },
    })
  }

  // Polyline points for the scale envelope — computed in lane-relative %.
  const ptStart = `${pToVisual(0, view)},${valueToTopPct(1, PAPER_SCALE_RANGE)}`
  const ptHero = `${pToVisual(heroHoldEnd, view)},${valueToTopPct(1, PAPER_SCALE_RANGE)}`
  const ptMid = `${pToVisual(paper.scaleMidProgress, view)},${valueToTopPct(paper.scaleMidValue, PAPER_SCALE_RANGE)}`
  const ptEnd = `${pToVisual(1, view)},${valueToTopPct(paper.scaleEndValue, PAPER_SCALE_RANGE)}`

  return (
    <div className="space-y-1.5 rounded border border-black/10 bg-white/30 p-2">
      <div className="flex items-center gap-2">
        <span className="text-[10px] tracking-wider text-black/55 uppercase">
          paper card
        </span>
        <span className="font-mono text-[10px] text-black/45">
          live: scale {fmtNumber(Number(liveScale.toFixed(3)))} · opacity{" "}
          {fmtNumber(Number(liveOpacity.toFixed(2)))}
        </span>
      </div>

      {/* Scale envelope */}
      <div className="grid grid-cols-[60px_1fr] items-stretch gap-2">
        <div className="flex items-center text-[10px] text-black/55">
          paper.scale
        </div>
        <div
          ref={scaleTrackRef}
          className="relative w-full overflow-hidden rounded bg-white/40"
          style={{ height: SCALE_LANE_HEIGHT }}
        >
          <svg
            aria-hidden
            className="pointer-events-none absolute inset-0 h-full w-full"
            preserveAspectRatio="none"
            viewBox="0 0 100 100"
          >
            <polyline
              points={`${ptStart} ${ptHero} ${ptMid} ${ptEnd}`}
              fill="none"
              stroke="#7c3aed"
              strokeWidth="0.6"
              strokeOpacity="0.7"
              vectorEffect="non-scaling-stroke"
            />
          </svg>
          {/* anchors */}
          <KeyframeDot
            color="#7c3aed"
            shape="ghost"
            title={`heroHoldEnd: ${fmtNumber(heroHoldEnd)} (auto)`}
            style={{
              left: `${pToVisual(heroHoldEnd, view)}%`,
              top: `${valueToTopPct(1, PAPER_SCALE_RANGE)}%`,
            }}
          />
          <KeyframeDot
            color="#7c3aed"
            title={`scale mid: p=${fmtNumber(paper.scaleMidProgress)} v=${fmtNumber(paper.scaleMidValue)}`}
            cursor="grab"
            onPointerDown={handleScaleMidDown}
            style={{
              left: `${pToVisual(paper.scaleMidProgress, view)}%`,
              top: `${valueToTopPct(paper.scaleMidValue, PAPER_SCALE_RANGE)}%`,
            }}
          />
          <KeyframeDot
            color="#7c3aed"
            title={`scale end: ${fmtNumber(paper.scaleEndValue)}`}
            cursor="ns-resize"
            onPointerDown={handleScaleEndDown}
            style={{
              left: `${pToVisual(1, view)}%`,
              top: `${valueToTopPct(paper.scaleEndValue, PAPER_SCALE_RANGE)}%`,
            }}
          />
          {/* progress indicator */}
          <div
            aria-hidden
            className="pointer-events-none absolute top-0 h-full w-px bg-black/30"
            style={{ left: `${pToVisual(progress, view)}%` }}
          />
        </div>
      </div>

      {/* Opacity fade */}
      <div className="grid grid-cols-[60px_1fr] items-stretch gap-2">
        <div className="flex items-center text-[10px] text-black/55">
          paper.opacity
        </div>
        <div
          ref={opacityTrackRef}
          className="relative w-full overflow-hidden rounded bg-white/40"
          style={{ height: OPACITY_LANE_HEIGHT }}
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
            onPointerDown={(e) => handleOpacityDown(e, "opacityFadeStart")}
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
            onPointerDown={(e) => handleOpacityDown(e, "opacityFadeEnd")}
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
      </div>
    </div>
  )
}
