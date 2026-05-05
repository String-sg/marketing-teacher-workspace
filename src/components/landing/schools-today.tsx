import { schoolsTodayCopy } from "@/content/landing"

import { RevealOnScroll } from "./reveal-on-scroll"

const TAPE_BG: Record<1 | 2 | 3, string> = {
  1: "var(--memo-tape-1)",
  2: "var(--memo-tape-2)",
  3: "var(--memo-tape-3)",
}

const CARD_ROTATION: Record<number, string> = {
  0: "-1.4deg",
  1: "0.8deg",
  2: "-0.6deg",
}

export function SchoolsToday() {
  return (
    <section
      className="relative px-5 py-16 sm:px-8 lg:py-20"
      id="schools"
    >
      <div className="mx-auto w-full max-w-[1412px] rounded-[28px] bg-[color:var(--memo-section-bg)] px-6 py-20 sm:rounded-[44px] sm:px-12 sm:py-24 lg:px-24 lg:py-28">
        <RevealOnScroll>
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-heading text-[clamp(1.75rem,4vw,3.5rem)] leading-[1.08] font-medium tracking-tight text-balance text-[color:var(--paper-ink)]">
              {schoolsTodayCopy.heading}
            </h2>
            <p className="mt-6 text-base leading-[1.7] text-balance text-[color:var(--paper-muted)] sm:text-lg">
              {schoolsTodayCopy.subheading}
            </p>
          </div>
        </RevealOnScroll>

        <div className="mx-auto mt-14 grid w-full max-w-[1220px] grid-cols-1 gap-10 sm:gap-7 lg:mt-20 lg:grid-cols-3">
          {schoolsTodayCopy.cases.map((memo, i) => (
            <RevealOnScroll delay={i * 80} key={memo.number}>
              <article
                className="relative flex h-full flex-col rounded-[4px] border border-black/5 bg-[color:var(--memo-bg)] px-9 pt-14 pb-9 shadow-[0_18px_40px_-22px_rgb(15_23_42/0.30)]"
                style={{ rotate: CARD_ROTATION[i] }}
              >
                <span
                  aria-hidden
                  className="pointer-events-none absolute -top-3.5 left-1/2 inline-block h-7 w-[110px] -translate-x-1/2 border-x border-dashed border-black/10"
                  style={{ backgroundColor: TAPE_BG[memo.tape] }}
                />
                <p className="font-mono text-[12px] leading-[16px] font-medium text-[color:var(--paper-muted)]">
                  {memo.number}
                </p>
                <p className="mt-5 text-[22px] leading-[32px] font-medium tracking-[-0.01em] text-[color:var(--paper-ink)] italic">
                  {memo.quote}
                </p>
                <p className="mt-5 text-[15px] leading-[24px] text-[color:var(--paper-ink)]/85">
                  {memo.body}
                </p>
                <p className="mt-6 text-sm leading-5 font-semibold text-[color:var(--paper-ink)]">
                  {memo.role}
                </p>
                <p className="mt-0.5 text-[13px] leading-5 text-[color:var(--paper-muted)] italic">
                  {memo.school}
                </p>
              </article>
            </RevealOnScroll>
          ))}
        </div>
      </div>
    </section>
  )
}
