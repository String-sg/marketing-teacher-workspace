/**
 * Dev-only override store for SCREEN_TARGETS and STAGES windows so the
 * floating <DevFlowPanel> can tune the choreography flow live without a
 * source edit + reload cycle.
 *
 * Production / test render paths render the choreography components
 * without a <DevFlowProvider>; useFlowTargets() / useFlowStages() fall
 * back to the compile-time STAGES + SCREEN_TARGETS in that case, so this
 * module is purely additive.
 */
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react"
import type { ReactNode } from "react"

import { SCREEN_TARGETS, STAGES } from "./stages"
import type {
  ScreenTarget,
  ScreenTargetRect,
  StageDef,
  StageId,
} from "./types"

export type FlowTargets = Record<ScreenTarget, ScreenTargetRect>
export type FlowWindow = readonly [number, number]
export type FlowStageWindows = Record<StageId, FlowWindow>

type FlowControlsContextValue = {
  readonly targets: FlowTargets
  readonly stageWindows: FlowStageWindows
  readonly setTarget: (
    key: ScreenTarget,
    patch: Partial<ScreenTargetRect>
  ) => void
  readonly setStageWindow: (id: StageId, window: FlowWindow) => void
  readonly resetAll: () => void
}

const FlowControlsContext = createContext<FlowControlsContextValue | null>(null)

const cloneTargets = (): FlowTargets => ({
  tiny: { ...SCREEN_TARGETS.tiny },
  centered: { ...SCREEN_TARGETS.centered },
  "docked-left": { ...SCREEN_TARGETS["docked-left"] },
  "docked-right": { ...SCREEN_TARGETS["docked-right"] },
})

const cloneWindows = (): FlowStageWindows => ({
  hero: [STAGES[0].window[0], STAGES[0].window[1]],
  wow: [STAGES[1].window[0], STAGES[1].window[1]],
  "feature-a": [STAGES[2].window[0], STAGES[2].window[1]],
  "feature-b": [STAGES[3].window[0], STAGES[3].window[1]],
})

export function DevFlowProvider({ children }: { children: ReactNode }) {
  const [targets, setTargets] = useState<FlowTargets>(cloneTargets)
  const [stageWindows, setStageWindows] =
    useState<FlowStageWindows>(cloneWindows)

  const setTarget = useCallback(
    (key: ScreenTarget, patch: Partial<ScreenTargetRect>) => {
      setTargets((prev) => ({ ...prev, [key]: { ...prev[key], ...patch } }))
    },
    []
  )

  const setStageWindow = useCallback((id: StageId, window: FlowWindow) => {
    // Clamp to [0, 1] and ensure window[0] < window[1] with a tiny epsilon.
    const lo = Math.min(Math.max(window[0], 0), 1)
    const hi = Math.min(Math.max(window[1], 0), 1)
    const ordered: FlowWindow = lo < hi ? [lo, hi] : [hi, lo + 0.001]
    setStageWindows((prev) => ({ ...prev, [id]: ordered }))
  }, [])

  const resetAll = useCallback(() => {
    setTargets(cloneTargets())
    setStageWindows(cloneWindows())
  }, [])

  const value = useMemo(
    () => ({
      targets,
      stageWindows,
      setTarget,
      setStageWindow,
      resetAll,
    }),
    [targets, stageWindows, setTarget, setStageWindow, resetAll]
  )

  return (
    <FlowControlsContext.Provider value={value}>
      {children}
    </FlowControlsContext.Provider>
  )
}

/** Read SCREEN_TARGETS, falling back to compile-time defaults when no
 *  provider is mounted (production builds + unit-test render paths). */
export function useFlowTargets(): FlowTargets {
  return useContext(FlowControlsContext)?.targets ?? SCREEN_TARGETS
}

/** Read STAGES (potentially with overridden windows) — same shape as the
 *  compile-time STAGES const so consumers can keep referencing s.window[0]
 *  / s.window[1] / s.screen / s.id. Falls back to STAGES outside dev. */
export function useFlowStages(): readonly StageDef[] {
  const ctx = useContext(FlowControlsContext)
  if (!ctx) return STAGES
  return STAGES.map((s) => ({ ...s, window: ctx.stageWindows[s.id] }))
}

/** Returns null when no provider is mounted (so the panel can no-op). */
export function useFlowControls(): FlowControlsContextValue | null {
  return useContext(FlowControlsContext)
}
