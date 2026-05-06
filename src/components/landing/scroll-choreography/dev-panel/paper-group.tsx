/**
 * Per-layer paper-card lanes for the unified timeline. Each lane is a
 * single row sharing the same horizontal time axis as the property
 * tracks above it. No outer container or group header — the panel
 * stacks these lanes flat with the per-stage SCALE/X/Y lanes so the
 * timeline reads as one continuous surface.
 *
 * Lanes:
 *   - <LayerScaleLane layer="bg" />
 *   - <LayerScaleLane layer="cards" />
 *   - <LayerScaleLane layer="teacher" />
 *       Each shows a polyline of the layer's scale curve plus a single
 *       draggable mid-progress dot. Vertical drag on the mid dot edits
 *       the SHARED scaleMidValue (so all three layers track each other).
 *       Horizontal drag edits THIS layer's midProgress only — that's
 *       how the user creates the depth-stagger.
 *
 *   - <OpacityLane />
 *       Two diamond markers driving opacityFadeStart / opacityFadeEnd.
 *
 * Each lane carries a live-value label at the right edge that updates
 * with scroll scrub.
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
import type { PointerEvent as ReactPointerEvent } from "react"

const LANE_HEIGHT = 28
const PAPER_SCALE_RANGE = [0, 6] as const

const LAYER_COLORS = {
  bg: "#0ea5e9",
  cards: "#7c3aed",
  teacher: "#db2777",
} as const

type LayerKey = keyof typeof LAYER_COLORS

function valueToTopPct(v: number, range: readonly [number, number]) {
  const [lo, hi] = range
  const t = Math.max(0, Math.min(1, (v - lo) / (hi - lo)))
  return (1 - t) * 100
}

/** Live scale at scroll progress p for one layer (linear hold→ramp→hold). */
function liveScaleAt(
  progress: number,
  heroHoldEnd: number,
  midProgress: number,
  midValue: number,
  endValue: number
): number {
  if (progress <= heroHoldEnd) return 1
  if (progress <= midProgress) {
    const t =
      (progress - heroHoldEnd) / Math.max(midProgress - heroHoldEnd, 1e-6)
    return 1 + t * (midValue - 1)
  }
  const t = (progress - midProgress) / Math.max(1 - midProgress, 1e-6)
  return midValue + t * (endValue - midValue)
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

type ScaleDragInit = {
  rect: DOMRect
  startProgress: number
  startValue: number
  progressField: keyof PaperCardConfig
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

type LayerScaleLaneProps = {
  layer: LayerKey
  paper: PaperCardConfig
  setPaperCard: (patch: PaperCardPatch) => void
  heroHoldEnd: number
  view: TimelineView
  progress: number
}

const LAYER_PROGRESS_FIELD: Record<LayerKey, keyof PaperCardConfig> = {
  bg: "bgMidProgress",
  cards: "cardsMidProgress",
  teacher: "teacherMidProgress",
}

export function LayerScaleLane({
  layer,
  paper,
  setPaperCard,
  heroHoldEnd,
  view,
  progress,
}: LayerScaleLaneProps) {
  const trackRef = useRef<HTMLDivElement>(null)
  const span = viewSpan(view)
  const color = LAYER_COLORS[layer]
  const progressField = LAYER_PROGRESS_FIELD[layer]
  const layerProgress = paper[progressField] as number

  const live = liveScaleAt(
    progress,
    heroHoldEnd,
    layerProgress,
    paper.scaleMidValue,
    paper.scaleEndValue
  )

  const beginScaleMidDrag = useDragHandler<ScaleDragInit>({
    onMove(state) {
      const dpRaw = (state.dx / state.initial.rect.width) * span
      const dp = quantize(dpRaw, state.mods.shift, state.mods.alt)
      const nextProgress = clamp01(state.initial.startProgress + dp)
      const range = PAPER_SCALE_RANGE
      const dvRaw = -(state.dy / LANE_HEIGHT) * (range[1] - range[0])
      const step = state.mods.alt ? 0 : state.mods.shift ? 0.01 : 0.1
      const dv = step > 0 ? Math.round(dvRaw / step) * step : dvRaw
      const nextValue = state.initial.startValue + dv
      setPaperCard({
        [state.initial.progressField]: nextProgress,
        scaleMidValue: nextValue,
      } as PaperCardPatch)
    },
  })

  const beginScaleEndDrag = useDragHandler<ScaleVerticalDragInit>({
    onMove(state) {
      const range = PAPER_SCALE_RANGE
      const dvRaw = -(state.dy / LANE_HEIGHT) * (range[1] - range[0])
      const step = state.mods.alt ? 0 : state.mods.shift ? 0.01 : 0.1
      const dv = step > 0 ? Math.round(dvRaw / step) * step : dvRaw
      setPaperCard({ scaleEndValue: state.initial.startValue + dv })
    },
  })

  const handleMidDown = (e: ReactPointerEvent<HTMLSpanElement>) => {
    const t = trackRef.current
    if (!t) return
    beginScaleMidDrag(e, {
      initial: {
        rect: t.getBoundingClientRect(),
        startProgress: layerProgress,
        startValue: paper.scaleMidValue,
        progressField,
      },
    })
  }

  const handleEndDown = (e: ReactPointerEvent<HTMLSpanElement>) => {
    const t = trackRef.current
    if (!t) return
    beginScaleEndDrag(e, {
      initial: {
        rect: t.getBoundingClientRect(),
        startValue: paper.scaleEndValue,
      },
    })
  }

  const ptStart = `${pToVisual(0, view)},${valueToTopPct(1, PAPER_SCALE_RANGE)}`
  const ptHero = `${pToVisual(heroHoldEnd, view)},${valueToTopPct(1, PAPER_SCALE_RANGE)}`
  const ptMid = `${pToVisual(layerProgress, view)},${valueToTopPct(paper.scaleMidValue, PAPER_SCALE_RANGE)}`
  const ptEnd = `${pToVisual(1, view)},${valueToTopPct(paper.scaleEndValue, PAPER_SCALE_RANGE)}`

  return (
    <div className="grid grid-cols-[44px_1fr_56px] items-stretch gap-2">
      <div className="flex items-center text-[10px] tracking-wider text-black/55 uppercase">
        <span
          aria-hidden
          className="mr-1.5 inline-block size-2 rounded-sm"
          style={{ backgroundColor: color }}
        />
        {layer}
      </div>
      <div
        ref={trackRef}
        className="relative w-full overflow-hidden rounded bg-white/40"
        style={{ height: LANE_HEIGHT }}
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
            stroke={color}
            strokeWidth="0.7"
            strokeOpacity="0.85"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
        <KeyframeDot
          color={color}
          shape="ghost"
          title={`heroHoldEnd: ${fmtNumber(heroHoldEnd)} (auto)`}
          style={{
            left: `${pToVisual(heroHoldEnd, view)}%`,
            top: `${valueToTopPct(1, PAPER_SCALE_RANGE)}%`,
          }}
        />
        <KeyframeDot
          color={color}
          title={`${layer} mid: p=${fmtNumber(layerProgress)} v=${fmtNumber(paper.scaleMidValue)} (shared)`}
          cursor="grab"
          onPointerDown={handleMidDown}
          style={{
            left: `${pToVisual(layerProgress, view)}%`,
            top: `${valueToTopPct(paper.scaleMidValue, PAPER_SCALE_RANGE)}%`,
          }}
        />
        <KeyframeDot
          color={color}
          title={`scale end: ${fmtNumber(paper.scaleEndValue)} (shared)`}
          cursor="ns-resize"
          onPointerDown={handleEndDown}
          style={{
            left: `${pToVisual(1, view)}%`,
            top: `${valueToTopPct(paper.scaleEndValue, PAPER_SCALE_RANGE)}%`,
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
