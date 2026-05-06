import { createContext, useContext } from "react"
import { motionValue } from "motion/react"

import { STAGES } from "./stages"
import type { ScrollChoreographyContextValue } from "./types"

const stubScrollYProgress = motionValue(0)
const stubBgScale = motionValue(1)
const stubCardsScale = motionValue(1)
const stubTeacherScale = motionValue(1)

const defaultContextValue: ScrollChoreographyContextValue = {
  scrollYProgress: stubScrollYProgress,
  bgScale: stubBgScale,
  cardsScale: stubCardsScale,
  teacherScale: stubTeacherScale,
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
