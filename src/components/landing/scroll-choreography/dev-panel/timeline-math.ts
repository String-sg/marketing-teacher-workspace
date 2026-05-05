/**
 * Pure math helpers for the dev timeline. No React, no DOM (except the
 * one rect-relative converter). Used by every track that needs to map
 * progress in [0,1] onto a zoomed view window.
 */
import type { TimelineView } from "../dev-flow-context"

export const MIN_WIDTH = 0.005

export const clamp01 = (v: number): number => Math.max(0, Math.min(1, v))

/** Snap progress to a grid. Default 0.01; ⇧ = 0.001 (10× finer); ⌥ = raw. */
export function quantize(p: number, shift: boolean, alt: boolean): number {
  if (alt) return p
  const step = shift ? 0.001 : 0.01
  return Math.round(p / step) * step
}

/** Strip trailing-zero noise from JS number→string round-trips. */
export function fmtNumber(n: number): string {
  return Number(n.toFixed(6)).toString()
}

/** Visual width of the current view as a denominator-safe span. */
export function viewSpan(view: TimelineView): number {
  return Math.max(view.end - view.start, 1e-6)
}

/** Map progress in [0,1] to a horizontal CSS percent inside the visible
 *  view window. Identity when view = [0, 1]. */
export function pToVisual(p: number, view: TimelineView): number {
  return ((p - view.start) / viewSpan(view)) * 100
}

/** Inverse of pToVisual against a track DOMRect — for pointer events. */
export function mouseToProgress(
  clientX: number,
  rect: DOMRect,
  view: TimelineView
): number {
  return clamp01(view.start + ((clientX - rect.left) / rect.width) * viewSpan(view))
}
