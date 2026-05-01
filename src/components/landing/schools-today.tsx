import { schoolsTodayCopy } from "@/content/landing"

import { RevealOnScroll } from "./reveal-on-scroll"

export function SchoolsToday() {
  return (
    <section
      className="relative px-5 py-20 sm:px-8 lg:py-24"
      id="schools"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -top-10 right-[-3rem] hidden w-[min(22vw,260px)] sm:block lg:right-[-2rem]"
      >
        <img
          alt=""
          className="cloud-drift-right block w-full opacity-70 mix-blend-multiply select-none"
          src="/hero/cloud-halftone.png"
        />
      </div>

      <div className="mx-auto w-[1024px] max-w-full">
        <RevealOnScroll>
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-medium tracking-[0.18em] text-[color:var(--paper-muted)] uppercase sm:text-sm">
              {schoolsTodayCopy.kicker}
            </p>
            <h2 className="mt-4 font-heading text-[clamp(1.5rem,3.6vw,3.25rem)] leading-[1.08] font-medium tracking-tight text-balance text-[color:var(--paper-ink)]">
              {schoolsTodayCopy.heading}
            </h2>
            <p className="mt-6 text-base italic leading-7 text-[color:var(--paper-muted)] sm:text-lg sm:leading-8">
              {schoolsTodayCopy.subheading}
            </p>
          </div>
        </RevealOnScroll>

        <div className="mt-12 grid grid-cols-1 gap-6 lg:mt-16 lg:grid-cols-3">
          {schoolsTodayCopy.cases.map((item, i) => (
            <RevealOnScroll delay={i * 80} key={item.number}>
              <article className="paper-card flex flex-col rounded-[20px] border border-black/5 bg-white p-6 shadow-[0_10px_60px_-30px_rgb(15_23_42/0.18)] sm:p-8">
                <p className="font-mono text-xs tracking-[0.2em] text-[color:var(--paper-muted)] uppercase">
                  {item.number}
                </p>
                <h3 className="mt-4 font-heading text-xl leading-[1.2] font-medium tracking-tight text-[color:var(--paper-ink)] sm:text-2xl">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm italic text-[color:var(--paper-muted)]">
                  {item.source}
                </p>
                <p className="mt-4 text-base leading-7 text-[color:var(--paper-ink)]/85">
                  {item.body}
                </p>
              </article>
            </RevealOnScroll>
          ))}
        </div>
      </div>
    </section>
  )
}
