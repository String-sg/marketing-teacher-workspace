import { ArrowUpRightIcon } from "lucide-react"

import { footerCopy } from "@/content/landing"

export function SiteFooter() {
  return (
    <footer className="border-t border-[color:var(--paper-rule)] bg-[color:var(--footer-bg)] px-6 py-10 sm:px-12 sm:py-14 lg:px-20">
      <div className="mx-auto flex w-full max-w-[1280px] flex-col items-center gap-6 sm:grid sm:grid-cols-3 sm:items-center sm:gap-0">
        <p className="order-2 text-[13px] leading-[18px] text-[color:var(--paper-muted)] sm:order-none sm:justify-self-start">
          {footerCopy.copyright}
        </p>
        <a
          aria-label={footerCopy.brand}
          className="order-1 flex items-center gap-2.5 rounded-md font-heading text-[color:var(--paper-ink)] transition-opacity duration-200 ease-out hover:opacity-80 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-primary/40 sm:order-none sm:justify-self-center"
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
          className="group/feedback order-3 inline-flex items-center gap-1.5 rounded text-[13px] leading-[18px] text-[color:var(--paper-muted)] transition-colors duration-200 ease-out hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary sm:order-none sm:justify-self-end"
          href={footerCopy.feedbackUrl}
          rel="noreferrer"
          target="_blank"
        >
          {footerCopy.feedbackLabel}
          <ArrowUpRightIcon
            aria-hidden
            className="size-3.5 transition-transform duration-200 ease-out group-hover/feedback:translate-x-px group-hover/feedback:-translate-y-px"
          />
        </a>
      </div>
    </footer>
  )
}
