import { createContext, useContext } from "react"
import { motionValue } from "motion/react"

import { STAGES } from "./stages"
import type { ScrollChoreographyContextValue } from "./types"

/**
 * Phase 1 placeholder. Phase 2 replaces this with the real
 * `useScroll().scrollYProgress`. Module-level singleton — never mutated,
 * never read in Phase 1 (no consumers exist yet).
 */
const stubScrollYProgress = motionValue(0)
/** Default paper-card scale = 1 for any consumer rendered without the
 *  orchestrator (e.g. unit tests of ProductScreen via the Phase 1 stub
 *  context). The orchestrator overrides with the live derived value. */
const stubPaperCardScale = motionValue(1)

const defaultContextValue: ScrollChoreographyContextValue = {
  scrollYProgress: stubScrollYProgress,
  paperCardScale: stubPaperCardScale,
  stages: STAGES,
  reducedMotion: false,
  mode: "static",
}

const ScrollChoreographyContext =
  createContext<ScrollChoreographyContextValue>(defaultContextValue)

export function useScrollChoreography(): ScrollChoreographyContextValue {
  return useContext(ScrollChoreographyContext)
}

export { ScrollChoreographyContext }
