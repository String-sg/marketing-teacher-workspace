/**
 * Visual primitive for a draggable keyframe handle. Square diamond when
 * locked, circle when free. Shared by property tracks and paper-group.
 */
import type { CSSProperties, PointerEvent as ReactPointerEvent } from "react"

export type KeyframeShape = "circle" | "diamond" | "ghost"

export function KeyframeDot({
  shape = "circle",
  color,
  selected,
  title,
  cursor,
  onPointerDown,
  className = "",
  style,
}: {
  shape?: KeyframeShape
  color: string
  selected?: boolean
  title?: string
  cursor?: string
  onPointerDown?: (e: ReactPointerEvent<HTMLSpanElement>) => void
  className?: string
  style?: CSSProperties
}) {
  const isGhost = shape === "ghost"
  const isDiamond = shape === "diamond"
  const base = isGhost
    ? "border border-dashed border-black/35 bg-white/70"
    : "border border-white"
  const fill: CSSProperties = isGhost ? {} : { backgroundColor: color }
  const ring = selected ? "ring-2 ring-offset-1 ring-black/70" : ""
  const transform = isDiamond
    ? "translate(-50%, -50%) rotate(45deg)"
    : "translate(-50%, -50%)"
  return (
    <span
      role={onPointerDown ? "slider" : undefined}
      tabIndex={onPointerDown ? 0 : undefined}
      title={title}
      onPointerDown={onPointerDown}
      className={`absolute block size-2.5 rounded-[2px] shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-black/60 ${base} ${ring} ${className}`}
      style={{
        ...fill,
        cursor: cursor ?? (onPointerDown ? "grab" : "default"),
        transform,
        ...style,
      }}
    />
  )
}
