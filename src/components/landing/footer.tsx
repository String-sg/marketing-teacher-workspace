import { ArrowUpRightIcon } from "lucide-react"

import { footerCopy } from "@/content/landing"

export function SiteFooter() {
  return (
    <footer className="border-t border-[color:var(--paper-rule)] bg-[color:var(--footer-bg)] px-6 py-10 sm:px-12 sm:py-14 lg:px-20">
      <div className="mx-auto flex w-full max-w-[1280px] flex-col items-center gap-6 sm:flex-row sm:justify-between">
        <p className="order-2 text-[13px] leading-[18px] text-[color:var(--paper-muted)] sm:order-1">
          {footerCopy.copyright}
        </p>
        <a
          aria-label={footerCopy.brand}
          className="order-1 flex items-center gap-2.5 font-heading text-[color:var(--paper-ink)] sm:order-2"
          href="/"
        >
          <img
            alt=""
            aria-hidden
            className="size-7 select-none"
            src="/hero/tw-icon.png"
          />
          <span className="flex flex-col text-[13px] leading-[1.05] font-medium">
            <span>Teacher</span>
            <span>Workspace</span>
          </span>
        </a>
        <a
          className="order-3 inline-flex items-center gap-1.5 text-[13px] leading-[18px] text-[color:var(--paper-muted)] transition-colors hover:text-primary focus-visible:rounded focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          href={footerCopy.feedbackUrl}
          rel="noreferrer"
          target="_blank"
        >
          {footerCopy.feedbackLabel}
          <ArrowUpRightIcon aria-hidden className="size-3.5" />
        </a>
      </div>
    </footer>
  )
}
