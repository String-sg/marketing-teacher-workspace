import { useEffect, useId, useRef, useState } from "react"
import type { ReactNode } from "react"

import { cn } from "@/lib/utils"

type PopoverProps = {
  trigger: (api: { isOpen: boolean; toggle: () => void }) => ReactNode
  children: (api: { close: () => void }) => ReactNode
  align?: "start" | "end"
  panelClassName?: string
  role?: "dialog" | "listbox"
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function Popover({
  trigger,
  children,
  align = "start",
  panelClassName,
  role = "dialog",
  open,
  onOpenChange,
}: PopoverProps) {
  const isControlled = open !== undefined
  const [internalOpen, setInternalOpen] = useState(false)
  const isOpen = isControlled ? open : internalOpen
  const setIsOpen = (next: boolean) => {
    if (!isControlled) setInternalOpen(next)
    onOpenChange?.(next)
  }
  const setIsOpenRef = useRef(setIsOpen)
  setIsOpenRef.current = setIsOpen
  const wrapperRef = useRef<HTMLDivElement>(null)
  const panelId = useId()

  useEffect(() => {
    if (!isOpen) return
    const close = () => setIsOpenRef.current(false)
    const onClick = (event: MouseEvent) => {
      if (!wrapperRef.current) return
      if (!wrapperRef.current.contains(event.target as Node)) close()
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") close()
    }
    document.addEventListener("mousedown", onClick)
    document.addEventListener("keydown", onKey)
    return () => {
      document.removeEventListener("mousedown", onClick)
      document.removeEventListener("keydown", onKey)
    }
  }, [isOpen])

  return (
    <div ref={wrapperRef} className="relative inline-flex">
      {trigger({ isOpen, toggle: () => setIsOpen(!isOpen) })}
      {isOpen ? (
        <div
          id={panelId}
          role={role}
          className={cn(
            "absolute top-full z-30 mt-2 rounded-xl border border-black/10 bg-white p-3 shadow-[0_18px_40px_-22px_rgb(15_23_42/0.3)]",
            align === "end" ? "right-0" : "left-0",
            panelClassName
          )}
        >
          {children({ close: () => setIsOpen(false) })}
        </div>
      ) : null}
    </div>
  )
}
