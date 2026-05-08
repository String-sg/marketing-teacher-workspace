import { ChevronDownIcon } from "lucide-react"

import { SiteHeader } from "@/components/landing/site-header"
import { Button } from "@/components/ui/button"
import {
  siteCtaCopy,
  stages,
  TEACHER_WORKSPACE_APP_URL,
} from "@/content/landing"

// Static-fallback hero. The choreography path in scroll-choreography.tsx
// renders its own hero stage; both must stay in visual lock-step so
// reduced-motion users see the same brand impression.
export function PaperHero() {
  const heroEntry = stages.find((s) => s.id === "hero")
  if (!heroEntry || heroEntry.id !== "hero") {
    throw new Error("PaperHero: hero stage missing from content/landing stages")
  }
  const hero = heroEntry.copy

  return (
    <section
      aria-labelledby="hero-title-static"
      className="relative overflow-hidden sm:min-h-svh"
    >
      <div className="paper-card relative flex w-full flex-1 flex-col items-center overflow-hidden">
        <div
          aria-hidden
          className="hero-sky-bg absolute inset-0 overflow-hidden"
        >
          {/* Halftone cloud overlays — match Paper "Hero V2 — Cloud Notes".
              Gentle left/right drift via CSS keyframes; each cloud uses a
              different period and phase so the sky never pulses in unison.
              prefers-reduced-motion is honored by the global reset in
              styles.css. */}
          <img
            alt=""
            aria-hidden
            className="pointer-events-none absolute top-[2%] left-[78%] w-[18%] mix-blend-lighten select-none [will-change:transform]"
            src="/hero/cloud-halftone.png"
            style={{
              animation:
                "cloud-drift-a 9s cubic-bezier(0.455, 0.03, 0.515, 0.955) 0s infinite alternate",
            }}
          />
          <img
            alt=""
            aria-hidden
            className="pointer-events-none absolute top-[16%] left-[60%] w-[40%] mix-blend-lighten select-none [will-change:transform]"
            src="/hero/cloud-halftone.png"
            style={{
              animation:
                "cloud-drift-b 13s cubic-bezier(0.455, 0.03, 0.515, 0.955) -3s infinite alternate",
            }}
          />
          <img
            alt=""
            aria-hidden
            className="pointer-events-none absolute top-[28%] -left-[8%] w-[36%] mix-blend-lighten select-none [will-change:transform]"
            src="/hero/cloud-halftone.png"
            style={{
              animation:
                "cloud-drift-c 11s cubic-bezier(0.455, 0.03, 0.515, 0.955) -5s infinite alternate",
            }}
          />
          <div className="absolute inset-0 flex items-end justify-center sm:items-center">
            <div className="relative aspect-[16/10] w-full max-w-[calc(100svh*1.6)] [container-type:inline-size]">
              <img
                alt=""
                aria-hidden
                className="pointer-events-none absolute top-[52%] left-1/2 w-[28cqi] -translate-x-1/2 select-none"
                src="/hero/hero-cards-sketch.svg"
              />
              <img
                alt=""
                aria-hidden
                className="pointer-events-none absolute top-[62%] left-1/2 w-[22cqi] -translate-x-1/2 select-none"
                src="/hero/hero-teacher-sketch.svg"
              />
            </div>
          </div>
        </div>

        <div className="relative z-10 flex w-full flex-col">
          <div className="px-4 pt-4 sm:px-6 sm:pt-6">
            <SiteHeader />
          </div>
          <div className="mx-auto mt-8 flex w-full flex-col items-center px-4 text-center sm:mt-16">
            <h1
              className="font-heading text-[clamp(2.25rem,5.5vw,3.75rem)] leading-[1.1] font-medium tracking-[-0.025em] text-balance text-[#0F1B33]"
              id="hero-title-static"
            >
              {hero.headline}
            </h1>
            <p className="mt-5 max-w-[42rem] text-base leading-[1.6] text-balance text-[color:var(--paper-muted)] sm:text-lg">
              {hero.description} {siteCtaCopy.access}.
            </p>
            <Button
              asChild
              className="mt-5 h-10 rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground transition-[background-color,translate,scale] duration-200 ease-out hover:-translate-y-px hover:bg-primary/90 active:scale-[0.96]"
            >
              <a href={TEACHER_WORKSPACE_APP_URL} rel="noreferrer">
                {siteCtaCopy.primary}
              </a>
            </Button>
          </div>
          <div className="h-[26vh] sm:h-[48vh]" aria-hidden />
        </div>

        <div
          aria-hidden
          className="pointer-events-none absolute bottom-6 left-1/2 z-20 -translate-x-1/2"
        >
          <div className="inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2 shadow-[0_0_0_1px_rgb(15_23_42/0.04),0_2px_6px_-1px_rgb(15_23_42/0.06),0_12px_32px_-8px_rgb(15_23_42/0.18)]">
            <span className="text-[13px] font-medium text-[color:var(--paper-ink)]">
              Scroll to learn more
            </span>
            <ChevronDownIcon className="size-4 text-[color:var(--paper-muted)] motion-safe:animate-[scroll-hint_1.6s_ease-in-out_infinite]" />
          </div>
        </div>
      </div>
    </section>
  )
}
