import { EmailCapture } from "@/components/landing/email-capture"

export function FinalCta() {
  return (
    <section
      className="overflow-hidden bg-[color:var(--cta-ground)] px-5 py-24 text-white sm:px-8"
      id="pricing"
    >
      <div className="mx-auto max-w-5xl text-center">
        <p className="text-sm font-medium tracking-[0.16em] text-white/62 uppercase">
          Private beta
        </p>
        <h2 className="mt-5 font-heading text-4xl leading-tight font-semibold text-balance sm:text-7xl">
          Rehearse the work before the budget is on the line.
        </h2>
        <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-white/66">
          Join the early list for guided practice sessions, campaign critique,
          and a calmer path to better marketing.
        </p>
        <div className="mx-auto mt-10 max-w-xl">
          <EmailCapture />
        </div>
      </div>
    </section>
  )
}
