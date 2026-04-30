/**
 * Dev-only override store for STAGES so the floating <DevFlowPanel> can
 * tune the choreography flow live without a source edit + reload cycle.
 *
 * Production / test render paths render the choreography components
 * without a <DevFlowProvider>; useFlowStages() falls back to the
 * compile-time STAGES const in that case, so this module is purely
 * additive.
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

type FlowStagesState = Record<StageId, StageDef>

type FlowControlsContextValue = {
  readonly stages: readonly StageDef[]
  readonly setStage: (id: StageId, patch: StageRectPatch) => void
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

export function DevFlowProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<FlowStagesState>(cloneStages)

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

  const resetAll = useCallback(() => {
    setState(cloneStages())
  }, [])

  const stages = useMemo(() => orderedFromState(state), [state])

  const value = useMemo(
    () => ({ stages, setStage, resetAll }),
    [stages, setStage, resetAll]
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

/** Returns null when no provider is mounted (so the panel can no-op). */
export function useFlowControls(): FlowControlsContextValue | null {
  return useContext(FlowControlsContext)
}
