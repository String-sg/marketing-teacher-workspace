import type { MouseEvent as ReactMouseEvent } from "react"

import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  navItems,
  siteCtaCopy,
  TEACHER_WORKSPACE_APP_URL,
} from "@/content/landing"

// Force "instant" (not "auto") so hash jumps bypass the global CSS
// smooth-scroll, which otherwise strands users mid-flight inside the
// 220lvh pinned choreography.
function handleHashClick(
  event: ReactMouseEvent<HTMLAnchorElement>,
  href: string
) {
  if (!href.startsWith("#")) return
  const id = href.slice(1)
  if (!id) return
  const target =
    typeof document === "undefined" ? null : document.getElementById(id)
  if (!target) return
  event.preventDefault()
  target.scrollIntoView({ behavior: "instant", block: "start" })
  if (typeof history !== "undefined") {
    history.replaceState(null, "", href)
  }
}

export function SiteHeader() {
  return (
    <header className="pointer-events-none fixed inset-x-0 top-[var(--masthead-h,0px)] z-50 px-4 pt-4 transition-[top] duration-200 ease-out sm:px-8">
      <nav
        aria-label="Primary navigation"
        className="nav-pill pointer-events-auto mx-auto flex w-full max-w-[940px] items-center justify-between gap-6 rounded-full py-2.5 pr-2.5 pl-5 shadow-[0_0_0_1px_rgb(15_23_42/0.04),0_2px_6px_-1px_rgb(15_23_42/0.06)] sm:gap-12"
      >
        <a
          className="flex items-center gap-2.5 rounded-full font-heading text-[color:var(--paper-ink)] transition-opacity duration-200 hover:opacity-80 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-primary/40"
          href="/"
        >
          <img
            alt=""
            aria-hidden
            className="size-9 select-none"
            src="/hero/tw-icon.png"
          />
          <span className="hidden text-[13px] leading-[1.05] font-medium sm:flex sm:flex-col">
            <span>Teacher</span>
            <span>Workspace</span>
          </span>
        </a>

        <div className="hidden items-center gap-8 text-sm font-semibold text-[color:var(--paper-ink)] md:flex">
          {navItems.map((item) => (
            <a
              className="inline-flex h-10 items-center rounded-sm transition-colors duration-200 ease-out hover:text-primary focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-primary/40"
              href={item.href}
              key={item.label}
              onClick={(event) => handleHashClick(event, item.href)}
            >
              {item.label}
            </a>
          ))}
        </div>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              asChild
              className="h-10 rounded-full border-primary bg-transparent px-5 text-sm font-semibold text-primary transition-[background-color,scale] duration-200 ease-out hover:bg-primary/[0.06] active:scale-[0.96]"
              variant="outline"
            >
              <a href={TEACHER_WORKSPACE_APP_URL} rel="noreferrer">
                {siteCtaCopy.primary}
              </a>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            Accessible on MOE-issued devices
          </TooltipContent>
        </Tooltip>
      </nav>
    </header>
  )
}
