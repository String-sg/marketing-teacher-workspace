import { Button } from "@/components/ui/button"
import {
  navItems,
  siteCtaCopy,
  TEACHER_WORKSPACE_APP_URL,
} from "@/content/landing"

export function SiteHeader() {
  return (
    <header className="relative z-30 w-full">
      <nav
        aria-label="Primary navigation"
        className="nav-pill mx-auto flex w-full max-w-[940px] items-center justify-between gap-6 rounded-full border border-[#CBD5E1] px-3 py-2.5 sm:gap-12 sm:px-6"
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
              className="rounded-sm transition-colors duration-200 ease-out hover:text-primary focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-primary/40"
              href={item.href}
              key={item.label}
            >
              {item.label}
            </a>
          ))}
        </div>

        <Button
          asChild
          className="h-10 rounded-full border-primary bg-transparent px-5 text-sm font-semibold text-primary transition-all duration-200 ease-out hover:bg-primary/[0.06]"
          variant="outline"
        >
          <a href={TEACHER_WORKSPACE_APP_URL} rel="noreferrer">
            {siteCtaCopy.primary}
          </a>
        </Button>
      </nav>
    </header>
  )
}
