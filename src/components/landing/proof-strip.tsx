import { proofPoints } from "@/content/landing"

export function ProofStrip() {
  return (
    <section
      className="relative px-5 py-20 sm:px-8 lg:py-24"
      id="reviews"
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

      <div className="paper-card relative mx-auto w-full max-w-[110rem] overflow-hidden rounded-[20px] border border-black/5 px-6 py-10 shadow-[0_10px_60px_-30px_rgb(15_23_42/0.18)] sm:px-10 sm:py-14 lg:px-16 lg:py-20">
        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start lg:gap-16">
          <div>
            <p className="text-xs font-medium tracking-[0.18em] text-[color:var(--paper-muted)] uppercase sm:text-sm">
              Built around the student
            </p>
            <h2 className="mt-4 max-w-2xl font-heading text-[clamp(1.5rem,3.6vw,3.25rem)] leading-[1.08] font-medium tracking-tight text-balance text-[color:var(--paper-ink)]">
              The grade, the absence, the parent message — finally on the
              same page.
            </h2>
          </div>

          <div className="grid gap-6 sm:grid-cols-3 sm:gap-4">
            {proofPoints.map((point, index) => (
              <article
                className="border-l border-[color:var(--paper-rule)] pl-5"
                key={point}
              >
                <p className="font-mono text-xs tracking-[0.2em] text-[color:var(--paper-muted)] uppercase">
                  0{index + 1}
                </p>
                <h3 className="mt-4 text-lg leading-7 font-medium text-[color:var(--paper-ink)] sm:text-xl">
                  {point}
                </h3>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
