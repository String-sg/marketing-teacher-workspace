/**
 * Visual primitive for a draggable keyframe handle. Square diamond when
 * locked, circle when free. Shared by property tracks and paper-group.
 *
 * Hit-zone strategy: the visible swatch is 14px (was 10px) but pointer
 * events fire on a transparent ::before pseudo wrapper that extends out
 * to ~24×24, so users don't have to land exactly on the visible dot.
 * Tailwind v4 lets us express the pseudo via the `before:` variant chain.
 */
import type {
  CSSProperties,
  KeyboardEvent as ReactKeyboardEvent,
  PointerEvent as ReactPointerEvent,
} from "react"

export type KeyframeShape = "circle" | "diamond" | "ghost"

export function KeyframeDot({
  shape = "circle",
  color,
  selected,
  title,
  cursor,
  onPointerDown,
  onKeyDown,
  className = "",
  style,
}: {
  shape?: KeyframeShape
  color: string
  selected?: boolean
  title?: string
  cursor?: string
  onPointerDown?: (e: ReactPointerEvent<HTMLSpanElement>) => void
  onKeyDown?: (e: ReactKeyboardEvent<HTMLSpanElement>) => void
  className?: string
  style?: CSSProperties
}) {
  const isGhost = shape === "ghost"
  const isDiamond = shape === "diamond"
  const base = isGhost
    ? "border border-dashed border-black/35 bg-white/70"
    : "border-2 border-white"
  const fill: CSSProperties = isGhost ? {} : { backgroundColor: color }
  const ring = selected ? "ring-2 ring-offset-1 ring-black/70" : ""
  const transform = isDiamond
    ? "translate(-50%, -50%) rotate(45deg)"
    : "translate(-50%, -50%)"
  // before:* gives the dot a generous transparent hit pad so drags don't
  // miss. The visible chip stays 14px; the pad extends 5px in every
  // direction (24x24 effective hit area).
  const hitPad =
    "before:absolute before:inset-[-5px] before:content-[''] before:rounded-full"
  return (
    <span
      role={onPointerDown ? "slider" : undefined}
      tabIndex={onPointerDown ? 0 : undefined}
      title={title}
      onPointerDown={onPointerDown}
      onKeyDown={onKeyDown}
      className={`absolute block size-3.5 rounded-[3px] shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-black/60 ${base} ${ring} ${hitPad} ${className}`}
      style={{
        ...fill,
        cursor: cursor ?? (onPointerDown ? "grab" : "default"),
        transform,
        ...style,
      }}
    />
  )
}
