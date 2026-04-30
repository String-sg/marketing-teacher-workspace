/**
 * Dev-only override store for SCREEN_TARGETS so the floating <DevFlowPanel>
 * can tune the choreography flow live without a source edit + reload cycle.
 *
 * Production / test render paths render <ProductScreen> without a
 * <DevFlowProvider>; useFlowTargets() falls back to the compile-time
 * SCREEN_TARGETS in that case, so this module is purely additive.
 *
 * Scope: SCREEN_TARGETS only (the most-tuned values today). STAGES windows
 * and PaperBackdrop intra-stage timing are out of scope for v1 — extend if
 * the panel grows.
 */
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react"
import type { ReactNode } from "react"

import { SCREEN_TARGETS } from "./stages"
import type { ScreenTarget, ScreenTargetRect } from "./types"

export type FlowTargets = Record<ScreenTarget, ScreenTargetRect>

type FlowControlsContextValue = {
  readonly targets: FlowTargets
  readonly setTarget: (
    key: ScreenTarget,
    patch: Partial<ScreenTargetRect>
  ) => void
  readonly resetAll: () => void
}

const FlowControlsContext = createContext<FlowControlsContextValue | null>(null)

const cloneDefaults = (): FlowTargets => ({
  tiny: { ...SCREEN_TARGETS.tiny },
  centered: { ...SCREEN_TARGETS.centered },
  "docked-left": { ...SCREEN_TARGETS["docked-left"] },
  "docked-right": { ...SCREEN_TARGETS["docked-right"] },
})

export function DevFlowProvider({ children }: { children: ReactNode }) {
  const [targets, setTargets] = useState<FlowTargets>(cloneDefaults)

  const setTarget = useCallback(
    (key: ScreenTarget, patch: Partial<ScreenTargetRect>) => {
      setTargets((prev) => ({ ...prev, [key]: { ...prev[key], ...patch } }))
    },
    []
  )

  const resetAll = useCallback(() => setTargets(cloneDefaults()), [])

  const value = useMemo(
    () => ({ targets, setTarget, resetAll }),
    [targets, setTarget, resetAll]
  )

  return (
    <FlowControlsContext.Provider value={value}>
      {children}
    </FlowControlsContext.Provider>
  )
}

/** Read targets, falling back to compile-time SCREEN_TARGETS when no
 *  provider is mounted (production builds + unit-test render paths). */
export function useFlowTargets(): FlowTargets {
  return useContext(FlowControlsContext)?.targets ?? SCREEN_TARGETS
}

/** Returns null when no provider is mounted (so the panel can no-op). */
export function useFlowControls(): FlowControlsContextValue | null {
  return useContext(FlowControlsContext)
}
