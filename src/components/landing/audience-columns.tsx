import { audienceCopy } from "@/content/landing"

import { RevealOnScroll } from "./reveal-on-scroll"

export function AudienceColumns() {
  return (
    <section
      className="relative px-5 py-20 sm:px-8 lg:py-24"
      id="audiences"
    >
      <div className="mx-auto w-[1024px] max-w-full">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-medium tracking-[0.18em] text-[color:var(--paper-muted)] uppercase sm:text-sm">
            {audienceCopy.kicker}
          </p>
          <h2 className="mt-4 font-heading text-[clamp(1.5rem,3.6vw,3.25rem)] leading-[1.08] font-medium tracking-tight text-balance text-[color:var(--paper-ink)]">
            {audienceCopy.heading}
          </h2>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-10 lg:mt-16 lg:grid-cols-3">
          {audienceCopy.columns.map((column, i) => (
            <RevealOnScroll delay={i * 100} key={column.label}>
              <article className="border-t border-[color:var(--paper-rule)]/55 pt-6">
                <p className="font-heading text-lg font-medium leading-[1.2] tracking-tight text-[color:var(--paper-ink)] sm:text-xl">
                  {column.label}
                </p>
                <p className="mt-3 text-base leading-7 text-[color:var(--paper-muted)]">
                  {column.body}
                </p>
              </article>
            </RevealOnScroll>
          ))}
        </div>
      </div>
    </section>
  )
}
