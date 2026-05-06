import { useEffect, useId, useRef, useState } from "react"
import type { ReactNode } from "react"

import { cn } from "@/lib/utils"

type PopoverProps = {
  trigger: (api: { isOpen: boolean; toggle: () => void }) => ReactNode
  children: (api: { close: () => void }) => ReactNode
  align?: "start" | "end"
  panelClassName?: string
  role?: "dialog" | "listbox"
}

export function Popover({
  trigger,
  children,
  align = "start",
  panelClassName,
  role = "dialog",
}: PopoverProps) {
  const [isOpen, setIsOpen] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const panelId = useId()

  useEffect(() => {
    if (!isOpen) return
    const onClick = (event: MouseEvent) => {
      if (!wrapperRef.current) return
      if (!wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false)
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
      {trigger({ isOpen, toggle: () => setIsOpen((v) => !v) })}
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
