import { ArrowRightIcon, ChevronDownIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { navItems } from "@/content/landing"

export function SiteHeader() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-white/10 bg-[color:var(--nav-surface)] text-white backdrop-blur-xl">
      <nav
        aria-label="Primary navigation"
        className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 sm:px-8"
      >
        <a
          className="flex items-center gap-3 font-heading text-lg font-medium"
          href="/"
        >
          <span className="grid size-10 place-items-center rounded-full border border-white/20 bg-white/10">
            <span className="size-4 rounded-full bg-[color:var(--brand-orbit)] shadow-[0_0_0_6px_color-mix(in_oklab,var(--brand-orbit)_22%,transparent)]" />
          </span>
          <span className="hidden sm:inline">Marketing Teacher</span>
          <span className="sm:hidden">MT</span>
        </a>

        <div className="hidden items-center gap-7 text-sm text-white/78 lg:flex">
          {navItems.map((item, index) => (
            <a
              className="inline-flex items-center gap-1 transition-colors hover:text-white focus-visible:ring-3 focus-visible:ring-white/40 focus-visible:outline-none"
              href={`#${item.toLowerCase()}`}
              key={item}
            >
              {item}
              {index < 3 ? <ChevronDownIcon aria-hidden /> : null}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <a
            className="hidden text-sm text-white/78 transition-colors hover:text-white sm:inline-flex"
            href="#practice"
          >
            Log in
          </a>
          <Button className="h-11 rounded-full bg-primary px-5 text-primary-foreground hover:bg-primary/90">
            Start practicing
            <ArrowRightIcon data-icon="inline-end" />
          </Button>
        </div>
      </nav>
    </header>
  )
}
