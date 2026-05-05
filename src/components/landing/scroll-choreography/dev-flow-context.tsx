/**
 * Dev-only override store for STAGES + paper-card envelope so the
 * floating <DevFlowPanel> can tune the choreography flow live without
 * a source edit + reload cycle.
 *
 * Production / test render paths render the choreography components
 * without a <DevFlowProvider>; useFlowStages() and usePaperCardConfig()
 * fall back to the compile-time defaults in that case, so this module
 * is purely additive.
 */
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react"
import type { ReactNode } from "react"

import { STAGES } from "./stages"
import type { StageDef, StageId } from "./types"

export type FlowWindow = readonly [number, number]

/** Mutable subset of a stage that the dev panel edits — everything except
 *  the immutable id. Window + rect fields can all be live-tuned. */
export type StageRectPatch = Partial<{
  window: FlowWindow
  scale: number
  x: string
  y: string
  opacity: number
}>

/**
 * Paper-card (cartoon video) zoom envelope. Drives the scale + opacity
 * curves on PaperBackdrop's outer motion.div. The curves are:
 *
 *   scale: [0, heroHoldEnd, scaleMidProgress, 1]
 *       -> [1, 1,           scaleMidValue,    scaleEndValue]
 *   opacity: [0, opacityFadeStart, opacityFadeEnd, 1]
 *         -> [1, 1,                0,              0]
 *
 * heroHoldEnd auto-tracks STAGES[hero].window[1] so the card stays at
 * scale 1 throughout the hero hold and only starts zooming once the
 * UI begins its hero→wow morph.
 */
export type PaperCardConfig = {
  readonly scaleMidProgress: number
  readonly scaleMidValue: number
  readonly scaleEndValue: number
  readonly opacityFadeStart: number
  readonly opacityFadeEnd: number
}

export const PAPER_CARD_DEFAULTS: PaperCardConfig = {
  scaleMidProgress: 0.19,
  scaleMidValue: 2.4,
  scaleEndValue: 5.2,
  opacityFadeStart: 0.19,
  opacityFadeEnd: 0.27,
}

export type PaperCardPatch = Partial<PaperCardConfig>

/**
 * SVG sketch placement inside the aspect-locked hero frame
 * (paper-backdrop.tsx). Positions are expressed in frame-relative units
 * so they hold across viewport aspects:
 *
 *   topPct: percentage of frame HEIGHT for the sketch's top edge
 *   widthCqi: percentage of frame WIDTH (cqi) for the sketch's width
 *
 * Tune live via the Flow tuner's "sketches" panel; values flow through
 * useSketchesConfig() into paper-backdrop.tsx as inline style.
 */
export type SketchesConfig = {
  readonly cardsTop: number
  readonly cardsWidth: number
  readonly teacherTop: number
  readonly teacherWidth: number
}

export const SKETCHES_DEFAULTS: SketchesConfig = {
  cardsTop: 44,
  cardsWidth: 28,
  teacherTop: 54,
  teacherWidth: 22,
}

export type SketchesPatch = Partial<SketchesConfig>

/** Tall outer-section height in lvh (large-viewport-heights). The sticky
 *  inner shell pins to viewport, so scrollable span = (this - 100) lvh.
 *  Default 220lvh = ~120lvh of scrollable distance, which paces the
 *  choreography without trailing empty hold once the docked stage ends. */
export const SCROLL_HEIGHT_DEFAULT_VH = 220

/** Timeline view window for the dev panel. [0, 1] shows the full timeline;
 *  narrower ranges zoom in on a sub-region for finer tuning of compact
 *  schedules (e.g. when all stages cluster in [0, 0.4]). */
export type TimelineView = { readonly start: number; readonly end: number }

export const TIMELINE_VIEW_DEFAULT: TimelineView = { start: 0, end: 1 }

type FlowStagesState = Record<StageId, StageDef>

type FlowControlsContextValue = {
  readonly stages: readonly StageDef[]
  readonly paperCard: PaperCardConfig
  readonly sketches: SketchesConfig
  readonly scrollHeightVh: number
  readonly view: TimelineView
  readonly setStage: (id: StageId, patch: StageRectPatch) => void
  readonly setPaperCard: (patch: PaperCardPatch) => void
  readonly setSketches: (patch: SketchesPatch) => void
  readonly setScrollHeightVh: (vh: number) => void
  readonly setView: (view: TimelineView) => void
  readonly resetAll: () => void
}

const FlowControlsContext = createContext<FlowControlsContextValue | null>(null)

const cloneStages = (): FlowStagesState => {
  const out = {} as FlowStagesState
  for (const s of STAGES) {
    out[s.id] = {
      ...s,
      window: [s.window[0], s.window[1]] as StageDef["window"],
    }
  }
  return out
}

const orderedFromState = (state: FlowStagesState): readonly StageDef[] =>
  STAGES.map((s) => state[s.id])

const clamp01 = (v: number) => Math.min(Math.max(v, 0), 1)

export function DevFlowProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<FlowStagesState>(cloneStages)
  const [paperCard, setPaperCardState] = useState<PaperCardConfig>(
    PAPER_CARD_DEFAULTS
  )
  const [sketches, setSketchesState] = useState<SketchesConfig>(
    SKETCHES_DEFAULTS
  )
  const [scrollHeightVh, setScrollHeightVhState] = useState<number>(
    SCROLL_HEIGHT_DEFAULT_VH
  )
  const [view, setViewState] = useState<TimelineView>(TIMELINE_VIEW_DEFAULT)

  const setStage = useCallback((id: StageId, patch: StageRectPatch) => {
    setState((prev) => {
      const current = prev[id]
      let nextWindow = current.window
      if (patch.window) {
        // Clamp to [0, 1] and ensure window[0] < window[1] with a tiny epsilon.
        const lo = Math.min(Math.max(patch.window[0], 0), 1)
        const hi = Math.min(Math.max(patch.window[1], 0), 1)
        nextWindow = lo < hi ? [lo, hi] : [hi, lo + 0.001]
      }
      const merged: StageDef = {
        ...current,
        ...patch,
        window: nextWindow as StageDef["window"],
      }
      return { ...prev, [id]: merged }
    })
  }, [])

  const setPaperCard = useCallback((patch: PaperCardPatch) => {
    setPaperCardState((prev) => {
      const next = { ...prev, ...patch }
      // Clamp progress-based fields to [0, 1]; keep scale/opacity values
      // free-form (negative/large values are nonsense but easy to spot in
      // tuning so we don't second-guess the dev).
      return {
        ...next,
        scaleMidProgress: clamp01(next.scaleMidProgress),
        opacityFadeStart: clamp01(next.opacityFadeStart),
        opacityFadeEnd: clamp01(next.opacityFadeEnd),
      }
    })
  }, [])

  const setSketches = useCallback((patch: SketchesPatch) => {
    setSketchesState((prev) => ({ ...prev, ...patch }))
  }, [])

  const setScrollHeightVh = useCallback((vh: number) => {
    // Section must always be taller than the viewport for sticky to work,
    // so floor at 110lvh. Cap at 1000lvh just to keep the input sane.
    setScrollHeightVhState(Math.min(Math.max(vh, 110), 1000))
  }, [])

  const setView = useCallback((next: TimelineView) => {
    const lo = clamp01(next.start)
    const hi = clamp01(next.end)
    // Keep at least a 1% window so dragging stays usable.
    const minSpan = 0.01
    if (hi - lo < minSpan) {
      const center = (lo + hi) / 2
      setViewState({
        start: clamp01(center - minSpan / 2),
        end: clamp01(center + minSpan / 2),
      })
      return
    }
    setViewState({ start: lo, end: hi })
  }, [])

  const resetAll = useCallback(() => {
    setState(cloneStages())
    setPaperCardState(PAPER_CARD_DEFAULTS)
    setSketchesState(SKETCHES_DEFAULTS)
    setScrollHeightVhState(SCROLL_HEIGHT_DEFAULT_VH)
    setViewState(TIMELINE_VIEW_DEFAULT)
  }, [])

  const stages = useMemo(() => orderedFromState(state), [state])

  const value = useMemo(
    () => ({
      stages,
      paperCard,
      sketches,
      scrollHeightVh,
      view,
      setStage,
      setPaperCard,
      setSketches,
      setScrollHeightVh,
      setView,
      resetAll,
    }),
    [
      stages,
      paperCard,
      sketches,
      scrollHeightVh,
      view,
      setStage,
      setPaperCard,
      setSketches,
      setScrollHeightVh,
      setView,
      resetAll,
    ]
  )

  return (
    <FlowControlsContext.Provider value={value}>
      {children}
    </FlowControlsContext.Provider>
  )
}

/** Read STAGES (potentially with overridden window/rect fields) — same
 *  shape as the compile-time STAGES const so consumers keep referencing
 *  s.window / s.scale / s.x / s.y / s.opacity. Falls back to STAGES
 *  outside dev. */
export function useFlowStages(): readonly StageDef[] {
  const ctx = useContext(FlowControlsContext)
  return ctx?.stages ?? STAGES
}

/** Read the paper-card zoom envelope. Falls back to PAPER_CARD_DEFAULTS
 *  outside dev so production renders the same curve without a provider. */
export function usePaperCardConfig(): PaperCardConfig {
  const ctx = useContext(FlowControlsContext)
  return ctx?.paperCard ?? PAPER_CARD_DEFAULTS
}

/** Read the SVG sketch placement (cards + teacher) inside the hero frame.
 *  Falls back to SKETCHES_DEFAULTS outside dev. */
export function useSketchesConfig(): SketchesConfig {
  const ctx = useContext(FlowControlsContext)
  return ctx?.sketches ?? SKETCHES_DEFAULTS
}

/** Read the tunable scroll-section height in lvh. Falls back to the
 *  compile-time default outside dev so production matches. */
export function useScrollHeightVh(): number {
  const ctx = useContext(FlowControlsContext)
  return ctx?.scrollHeightVh ?? SCROLL_HEIGHT_DEFAULT_VH
}

/** Returns null when no provider is mounted (so the panel can no-op). */
export function useFlowControls(): FlowControlsContextValue | null {
  return useContext(FlowControlsContext)
}
