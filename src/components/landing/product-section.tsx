import { ArrowUpRightIcon, CheckIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { ProductInterfaceFrame } from "@/components/landing/product-interface-frame"
import { modules, productCopy } from "@/content/landing"

export function ProductSection() {
  return (
    <section
      className="bg-[color:var(--interface-ink)] px-5 py-24 text-white sm:px-8 lg:py-32"
      id="today"
    >
      <div className="mx-auto grid max-w-7xl gap-14 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
        <div className="max-w-xl">
          <p className="text-sm font-medium tracking-[0.16em] text-[color:var(--interface-accent)] uppercase">
            {productCopy.kicker}
          </p>
          <h2 className="mt-5 font-heading text-4xl leading-tight font-semibold text-balance sm:text-6xl">
            {productCopy.headline}
          </h2>
          <p className="mt-6 text-lg leading-8 text-white/64">
            {productCopy.body}
          </p>

          <div className="mt-12 flex flex-col gap-5">
            {modules.map((module) => (
              <article
                className="border-t border-white/12 pt-5"
                key={module.title}
              >
                <div className="flex gap-4">
                  <span className="mt-1 grid size-6 shrink-0 place-items-center rounded-full bg-[color:var(--interface-accent-soft)] text-[color:var(--interface-accent)]">
                    <CheckIcon aria-hidden className="size-3.5" />
                  </span>
                  <div>
                    <h3 className="text-lg font-medium">{module.title}</h3>
                    <p className="mt-2 leading-7 text-white/58">
                      {module.body}
                    </p>
                  </div>
                </div>
              </article>
            ))}
          </div>

          <Button className="mt-10 h-11 rounded-full bg-white text-[color:var(--interface-ink)] hover:bg-white/90">
            {productCopy.cta}
            <ArrowUpRightIcon data-icon="inline-end" />
          </Button>
        </div>

        <div className="relative">
          <div className="absolute inset-8 bg-[radial-gradient(circle,var(--interface-accent-soft),transparent_62%)] blur-3xl" />
          <div className="relative translate-x-0 lg:translate-x-8">
            <ProductInterfaceFrame />
          </div>
        </div>
      </div>
    </section>
  )
}
