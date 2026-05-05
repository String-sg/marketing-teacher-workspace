/**
 * Single-source selection for the dev panel: which keyframe is focused,
 * shared between the property tracks and the bottom inspector. Lives in
 * its own context so neither layer prop-drills.
 */
import { createContext, useContext, useMemo, useState } from "react"
import type { ReactNode } from "react"

import type { StageId } from "../types"
import type { PropertyKey } from "./property-adapters"

export type SelectionEdge = "start" | "end" | "body"

export type Selection = {
  readonly stageId: StageId
  readonly property: PropertyKey
  readonly edge: SelectionEdge
}

type Ctx = {
  readonly selection: Selection | null
  readonly setSelection: (sel: Selection | null) => void
}

const SelectionContext = createContext<Ctx | null>(null)

export function SelectionProvider({ children }: { children: ReactNode }) {
  const [selection, setSelection] = useState<Selection | null>(null)
  const value = useMemo(() => ({ selection, setSelection }), [selection])
  return (
    <SelectionContext.Provider value={value}>
      {children}
    </SelectionContext.Provider>
  )
}

export function useSelection(): Ctx {
  const ctx = useContext(SelectionContext)
  if (!ctx) {
    return { selection: null, setSelection: () => {} }
  }
  return ctx
}

export function isSelected(
  selection: Selection | null,
  stageId: StageId,
  property: PropertyKey
): boolean {
  if (!selection) return false
  return selection.stageId === stageId && selection.property === property
}
