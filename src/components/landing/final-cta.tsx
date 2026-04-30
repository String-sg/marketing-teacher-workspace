import { finalCtaCopy } from "@/content/landing"

export function FinalCta() {
  return (
    <section
      className="relative overflow-hidden px-5 py-24 sm:px-8 lg:py-32"
      id="pricing"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -top-12 left-[-3rem] w-[min(28vw,320px)] sm:-left-12"
      >
        <img
          alt=""
          className="cloud-drift-left block w-full opacity-75 mix-blend-multiply select-none"
          src="/hero/cloud-halftone.png"
        />
      </div>
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-16 right-[-3rem] w-[min(26vw,300px)] sm:-right-12"
      >
        <img
          alt=""
          className="cloud-drift-right block w-full opacity-75 mix-blend-multiply select-none"
          src="/hero/cloud-halftone.png"
        />
      </div>

      <div className="paper-card relative mx-auto w-full max-w-5xl overflow-hidden rounded-[20px] border border-black/5 px-6 py-14 text-center shadow-[0_10px_60px_-30px_rgb(15_23_42/0.2)] sm:px-12 sm:py-20 lg:px-16 lg:py-24">
        <p className="text-xs font-medium tracking-[0.18em] text-[color:var(--paper-muted)] uppercase sm:text-sm">
          {finalCtaCopy.kicker}
        </p>
        <h2 className="mt-4 font-heading text-[clamp(1.75rem,4.4vw,4rem)] leading-[1.05] font-medium tracking-tight text-balance text-[color:var(--paper-ink)]">
          {finalCtaCopy.headline}
        </h2>
      </div>
    </section>
  )
}
