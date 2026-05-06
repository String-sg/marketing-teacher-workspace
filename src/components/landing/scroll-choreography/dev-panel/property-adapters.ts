/**
 * Per-property adapters: read a value from a StageDef, write a patch back,
 * map between the property's value range and the track's vertical lane,
 * format for display, and provide step granularity. The adapter is what
 * lets a single <PropertyTrack> handle scale / opacity / x / y uniformly.
 */
import type { StageRectPatch } from "../dev-flow-context"
import type { StageDef } from "../types"

export type PropertyKey = "scale" | "opacity" | "x" | "y"

export type PropertyAdapter = {
  readonly key: PropertyKey
  readonly label: string
  readonly color: string
  /** Visible vertical range. Values outside still render but pin to lane edge. */
  readonly range: readonly [min: number, max: number]
  readonly coarseStep: number
  readonly fineStep: number
  /** Read a numeric value from a stage. For x/y this parses the CSS string. */
  read: (stage: StageDef) => number
  /** Build a patch that writes `value` back. For x/y this preserves the unit. */
  write: (stage: StageDef, value: number) => StageRectPatch
  /** Display string for badges/inspector. */
  format: (value: number) => string
}

/** Parse a CSS length like "+6.3cqi" / "0" / "-2vw" into [number, unit]. */
export function splitCssLength(value: string): { num: number; unit: string } {
  const match = value.trim().match(/^([+-]?\d+(?:\.\d+)?)([a-z%]*)$/i)
  if (!match) return { num: 0, unit: "cqi" }
  return { num: parseFloat(match[1]), unit: match[2] || "" }
}

/** Format a number + unit back into the canonical signed string. */
export function formatCssLength(num: number, unit: string): string {
  const trimmed = Number(num.toFixed(4)).toString()
  const sign = num > 0 ? "+" : ""
  return `${sign}${trimmed}${unit}`
}

const SCALE: PropertyAdapter = {
  key: "scale",
  label: "scale",
  color: "#0ea5e9",
  range: [0, 1.5],
  coarseStep: 0.05,
  fineStep: 0.001,
  read: (s) => s.scale,
  write: (_s, v) => ({ scale: v }),
  format: (v) => v.toFixed(v < 0.1 ? 3 : 2),
}

const OPACITY: PropertyAdapter = {
  key: "opacity",
  label: "opacity",
  color: "#a855f7",
  range: [0, 1],
  coarseStep: 0.05,
  fineStep: 0.001,
  read: (s) => s.opacity,
  write: (_s, v) => ({ opacity: Math.max(0, Math.min(1, v)) }),
  format: (v) => v.toFixed(2),
}

const X: PropertyAdapter = {
  key: "x",
  label: "x",
  color: "#f59e0b",
  range: [-50, 50],
  coarseStep: 0.5,
  fineStep: 0.05,
  read: (s) => splitCssLength(s.x).num,
  write: (s, v) => {
    const { unit } = splitCssLength(s.x)
    return { x: formatCssLength(v, unit || "cqi") }
  },
  format: (v) => formatCssLength(v, "cqi"),
}

const Y: PropertyAdapter = {
  key: "y",
  label: "y",
  color: "#10b981",
  range: [-50, 50],
  coarseStep: 0.5,
  fineStep: 0.05,
  read: (s) => splitCssLength(s.y).num,
  write: (s, v) => {
    const { unit } = splitCssLength(s.y)
    return { y: formatCssLength(v, unit || "cqi") }
  },
  format: (v) => formatCssLength(v, "cqi"),
}

// Stage opacity is always 1 today (every stage carries opacity:1), so the
// per-stage OPACITY lane never moves and just adds visual noise. Keep the
// OPACITY adapter in PROPERTY_BY_KEY for type completeness / future use,
// but exclude it from the rendered timeline.
export const PROPERTY_ADAPTERS: ReadonlyArray<PropertyAdapter> = [SCALE, X, Y]

export const PROPERTY_BY_KEY: Record<PropertyKey, PropertyAdapter> = {
  scale: SCALE,
  opacity: OPACITY,
  x: X,
  y: Y,
}

/** Map value → 0..1 within the lane (top=1, bottom=0). Pins outside range. */
export function valueToLaneT(adapter: PropertyAdapter, v: number): number {
  const [lo, hi] = adapter.range
  const span = hi - lo
  if (span <= 0) return 0.5
  return Math.max(0, Math.min(1, (v - lo) / span))
}

/** Inverse of valueToLaneT. Caller decides whether to clamp/quantize. */
export function laneTToValue(adapter: PropertyAdapter, t: number): number {
  const [lo, hi] = adapter.range
  return lo + t * (hi - lo)
}

/** Property step appropriate for the active modifier keys. */
export function pickStep(
  adapter: PropertyAdapter,
  shift: boolean,
  alt: boolean
): number {
  if (alt) return 0
  return shift ? adapter.fineStep : adapter.coarseStep
}

/** Snap a value to the adapter's step grid. step=0 means raw. */
export function snapValue(value: number, step: number): number {
  if (step <= 0) return value
  return Math.round(value / step) * step
}
