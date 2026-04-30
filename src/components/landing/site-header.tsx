import { ArrowRightIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  finalCtaCopy,
  navItems,
  TEACHER_WORKSPACE_APP_URL,
} from "@/content/landing"

export function SiteHeader() {
  return (
    <header className="relative z-30 w-full">
      <nav
        aria-label="Primary navigation"
        className="mx-auto flex w-[940px] items-start justify-center gap-12 rounded-full border border-slate-300 bg-white px-4 py-2.5 sm:gap-16 sm:px-6"
      >
        <a
          className="flex items-center gap-2.5 font-heading text-[color:var(--paper-ink)]"
          href="/"
        >
          <img
            alt=""
            aria-hidden
            className="size-9 select-none"
            src="/hero/tw-icon.png"
          />
          <span className="hidden text-sm leading-[1.05] font-medium sm:flex sm:flex-col">
            <span>Teacher</span>
            <span>Workspace</span>
          </span>
        </a>

        <div className="ml-auto flex items-center gap-6 sm:gap-8">
          <div className="hidden items-center gap-7 text-sm font-medium text-[color:var(--paper-ink)] lg:flex">
            {navItems.map((item) => (
              <a
                className="transition-colors hover:text-primary focus-visible:ring-3 focus-visible:ring-primary/40 focus-visible:outline-none"
                href={item.href}
                key={item.label}
              >
                {item.label}
              </a>
            ))}
          </div>

          <Button
            asChild
            className="h-10 rounded-full border-primary/40 px-5 text-primary hover:bg-primary/5"
            variant="outline"
          >
            <a href={TEACHER_WORKSPACE_APP_URL} rel="noreferrer">
              {finalCtaCopy.cta}
              <ArrowRightIcon data-icon="inline-end" />
            </a>
          </Button>
        </div>
      </nav>
    </header>
  )
}
