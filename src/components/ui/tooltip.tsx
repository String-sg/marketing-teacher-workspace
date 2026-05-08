import * as React from "react"
import { Tooltip as TooltipPrimitive } from "@base-ui/react/tooltip"

import { cn } from "@/lib/utils"

function TooltipProvider({
  delay = 0,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Provider>) {
  return <TooltipPrimitive.Provider delay={delay} {...props} />
}

// Self-wraps in Provider so callers don't need to mount one — every
// <Tooltip> is fully self-contained (works in tests without a global
// provider, and parallel <Tooltip>s never conflict).
function Tooltip(props: React.ComponentProps<typeof TooltipPrimitive.Root>) {
  return (
    <TooltipProvider>
      <TooltipPrimitive.Root {...props} />
    </TooltipProvider>
  )
}

type TooltipTriggerProps = React.ComponentProps<
  typeof TooltipPrimitive.Trigger
> & {
  asChild?: boolean
}

// `asChild` translates to Base UI's `render` prop: when set and given a
// single ReactElement, the trigger forwards its props to that element
// instead of rendering its own <button>.
function TooltipTrigger({
  asChild,
  children,
  ...props
}: TooltipTriggerProps) {
  if (asChild && React.isValidElement(children)) {
    return (
      <TooltipPrimitive.Trigger
        render={children as React.ReactElement<Record<string, unknown>>}
        {...props}
      />
    )
  }
  return (
    <TooltipPrimitive.Trigger {...props}>{children}</TooltipPrimitive.Trigger>
  )
}

type TooltipContentProps = React.ComponentProps<
  typeof TooltipPrimitive.Popup
> & {
  side?: "top" | "right" | "bottom" | "left"
  sideOffset?: number
}

function TooltipContent({
  className,
  side = "top",
  sideOffset = 6,
  children,
  ...props
}: TooltipContentProps) {
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Positioner
        className="z-[60]"
        side={side}
        sideOffset={sideOffset}
      >
        <TooltipPrimitive.Popup
          className={cn(
            "inline-flex w-fit max-w-xs items-center gap-1.5 rounded-md bg-foreground px-3 py-1.5 text-xs text-background transition-[opacity,scale] duration-150 ease-out data-[ending-style]:scale-95 data-[ending-style]:opacity-0 data-[starting-style]:scale-95 data-[starting-style]:opacity-0",
            className
          )}
          {...props}
        >
          {children}
        </TooltipPrimitive.Popup>
      </TooltipPrimitive.Positioner>
    </TooltipPrimitive.Portal>
  )
}

export { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger }
