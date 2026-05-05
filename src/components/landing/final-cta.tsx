import { ArrowRightIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { finalCtaCopy, siteCtaCopy, TEACHER_WORKSPACE_APP_URL } from "@/content/landing"

import { RevealOnScroll } from "./reveal-on-scroll"

export function FinalCta() {
  return (
    <section
      className="relative overflow-hidden px-5 py-24 sm:px-8 lg:py-32"
      id="pricing"
    >
      <RevealOnScroll>
        <div className="mx-auto flex w-full max-w-[1024px] flex-col items-center gap-5 px-4 text-center sm:px-10">
          <h2 className="font-heading text-[clamp(1.75rem,4vw,3.5rem)] leading-[1.21] font-medium tracking-[-0.025em] text-balance text-[color:#0e1729]">
            {finalCtaCopy.headline}
          </h2>
          <p className="max-w-[34rem] text-base leading-[1.7] text-balance text-[color:var(--paper-muted)] sm:text-lg">
            {finalCtaCopy.subtitle}
          </p>
          <Button
            asChild
            className="mt-2 h-10 rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-[0_8px_22px_-12px_rgb(36_90_219_/_0.7)] hover:bg-primary/90"
          >
            <a href={TEACHER_WORKSPACE_APP_URL} rel="noreferrer">
              {siteCtaCopy.primary}
              <ArrowRightIcon data-icon="inline-end" />
            </a>
          </Button>
        </div>
      </RevealOnScroll>
    </section>
  )
}
