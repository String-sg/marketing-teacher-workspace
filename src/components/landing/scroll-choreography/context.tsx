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

const defaultContextValue: ScrollChoreographyContextValue = {
  scrollYProgress: stubScrollYProgress,
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
