import { createContext, useContext } from "react"
import { motionValue } from "motion/react"

import { STAGES } from "./stages"
import type { ScrollChoreographyContextValue } from "./types"

const stubScrollYProgress = motionValue(0)
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
