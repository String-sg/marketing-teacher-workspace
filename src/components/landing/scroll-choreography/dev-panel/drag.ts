/**
 * Drag handler hook. Wires global pointermove/up/cancel listeners with
 * modifier-key snapshotting so each drag site doesn't repeat the boilerplate.
 *
 * Usage:
 *   const begin = useDragHandler({ onMove, onEnd })
 *   <button onPointerDown={(e) => begin(e, { initialState })} />
 */
import { useCallback, useEffect, useRef } from "react"
import type { PointerEvent as ReactPointerEvent } from "react"

export type DragModifiers = {
  readonly shift: boolean
  readonly alt: boolean
  readonly meta: boolean
}

export type DragState<T> = {
  readonly initial: T
  readonly startX: number
  readonly startY: number
  readonly dx: number
  readonly dy: number
  readonly mods: DragModifiers
  readonly event: PointerEvent
}

export type DragOptions<T> = {
  /** Called for every pointermove during the drag. */
  onMove: (state: DragState<T>) => void
  /** Called once on pointerup / pointercancel. */
  onEnd?: (state: DragState<T>) => void
  /** Stop the event from bubbling past the panel (default true). */
  stopPropagation?: boolean
}

export function useDragHandler<T = void>(opts: DragOptions<T>) {
  const optsRef = useRef(opts)
  optsRef.current = opts
  const activeRef = useRef<{
    cleanup: () => void
  } | null>(null)

  useEffect(() => {
    return () => {
      activeRef.current?.cleanup()
    }
  }, [])

  return useCallback(
    (e: ReactPointerEvent<HTMLElement>, ctx: { initial: T }) => {
      e.preventDefault()
      if (optsRef.current.stopPropagation !== false) e.stopPropagation()
      const startX = e.clientX
      const startY = e.clientY
      const initial = ctx.initial

      const onMove = (ev: PointerEvent) => {
        optsRef.current.onMove({
          initial,
          startX,
          startY,
          dx: ev.clientX - startX,
          dy: ev.clientY - startY,
          mods: { shift: ev.shiftKey, alt: ev.altKey, meta: ev.metaKey },
          event: ev,
        })
      }
      const onUp = (ev: PointerEvent) => {
        optsRef.current.onEnd?.({
          initial,
          startX,
          startY,
          dx: ev.clientX - startX,
          dy: ev.clientY - startY,
          mods: { shift: ev.shiftKey, alt: ev.altKey, meta: ev.metaKey },
          event: ev,
        })
        cleanup()
      }
      const cleanup = () => {
        window.removeEventListener("pointermove", onMove)
        window.removeEventListener("pointerup", onUp)
        window.removeEventListener("pointercancel", onUp)
        activeRef.current = null
      }
      activeRef.current?.cleanup()
      activeRef.current = { cleanup }
      window.addEventListener("pointermove", onMove)
      window.addEventListener("pointerup", onUp)
      window.addEventListener("pointercancel", onUp)
    },
    []
  )
}
