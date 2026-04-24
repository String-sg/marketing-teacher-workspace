import { proofPoints } from "@/content/landing"

export function ProofStrip() {
  return (
    <section
      className="bg-[color:var(--paper)] px-5 py-20 text-[color:var(--paper-ink)] sm:px-8"
      id="reviews"
    >
      <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
        <div>
          <p className="text-sm font-medium tracking-[0.16em] text-[color:var(--paper-muted)] uppercase">
            Built for careful launches
          </p>
          <h2 className="mt-4 max-w-2xl font-heading text-4xl leading-tight font-semibold text-balance sm:text-6xl">
            A second brain for the moment before the campaign goes live.
          </h2>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          {proofPoints.map((point, index) => (
            <article
              className="border-l border-[color:var(--paper-rule)] pl-5"
              key={point}
            >
              <p className="text-sm text-[color:var(--paper-muted)]">
                0{index + 1}
              </p>
              <h3 className="mt-4 text-xl leading-7 font-medium">{point}</h3>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
