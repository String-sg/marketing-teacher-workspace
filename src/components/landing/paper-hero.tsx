import { SiteHeader } from "@/components/landing/site-header"
import { Button } from "@/components/ui/button"
import {
  siteCtaCopy,
  stages,
  TEACHER_WORKSPACE_APP_URL,
} from "@/content/landing"

// Static-fallback hero (rendered by StaticChoreographyFallback when the user
// prefers reduced motion or is on mobile per D-02). The choreography path in
// scroll-choreography.tsx renders its own hero stage; both must stay in
// visual lock-step so reduced-motion users see the same brand impression.
export function PaperHero() {
  const heroEntry = stages.find((s) => s.id === "hero")
  if (!heroEntry || heroEntry.id !== "hero") {
    throw new Error("PaperHero: hero stage missing from content/landing stages")
  }
  const hero = heroEntry.copy

  return (
    <section
      aria-labelledby="hero-title-static"
      className="relative min-h-svh overflow-hidden px-5 py-3 sm:px-8"
    >
      <div className="paper-card relative mx-auto flex w-full max-w-[1412px] flex-1 flex-col items-center overflow-hidden rounded-[28px] shadow-[0_10px_60px_-30px_rgb(15_23_42/0.18)] sm:rounded-[44px]">
        <div
          aria-hidden
          className="absolute inset-0 overflow-hidden rounded-[28px] bg-gradient-to-b from-[#cfe5f7] from-0% via-[#e8f1fa] via-35% to-white to-75% sm:rounded-[44px]"
        >
          {/* Halftone cloud overlays — match Paper "Hero V2 — Cloud Notes". */}
          <img
            alt=""
            aria-hidden
            className="pointer-events-none absolute top-[2%] left-[78%] w-[18%] mix-blend-lighten select-none"
            src="/hero/cloud-halftone.png"
          />
          <img
            alt=""
            aria-hidden
            className="pointer-events-none absolute top-[16%] left-[60%] w-[40%] mix-blend-lighten select-none"
            src="/hero/cloud-halftone.png"
          />
          <img
            alt=""
            aria-hidden
            className="pointer-events-none absolute top-[28%] -left-[8%] w-[36%] mix-blend-lighten select-none"
            src="/hero/cloud-halftone.png"
          />
          <div className="absolute inset-0 grid place-items-center">
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
          <div className="mx-auto mt-12 flex w-fit flex-col items-center px-4 text-center sm:mt-16">
            <h1
              className="font-heading text-[clamp(2.25rem,5.5vw,3.75rem)] leading-[1.1] font-medium tracking-[-0.025em] text-balance text-[#0F1B33]"
              id="hero-title-static"
            >
              {hero.headline}
            </h1>
            <p className="mt-5 text-[14px] text-[color:var(--paper-muted)]">
              {siteCtaCopy.access}
            </p>
            <Button
              asChild
              className="mt-5 h-10 rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-[var(--paper-shadow-cta)] transition-all duration-200 ease-out hover:-translate-y-px hover:bg-primary/90 hover:shadow-[var(--paper-shadow-cta-hover)]"
            >
              <a href={TEACHER_WORKSPACE_APP_URL} rel="noreferrer">
                {siteCtaCopy.primary}
              </a>
            </Button>
          </div>
          <div className="h-[42vh] sm:h-[48vh]" aria-hidden />
        </div>
      </div>
    </section>
  )
}
