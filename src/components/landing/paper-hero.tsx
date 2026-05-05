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
      className="relative min-h-svh overflow-hidden p-3"
    >
      <div className="paper-card relative mx-auto flex w-full max-w-[110rem] flex-1 flex-col items-center overflow-hidden rounded-[20px] shadow-[0_10px_60px_-30px_rgb(15_23_42/0.18)]">
        <div aria-hidden className="absolute inset-0 overflow-hidden rounded-[20px]">
          <picture>
            <source
              type="image/webp"
              srcSet="/hero/hill-640.webp 640w, /hero/hill-960.webp 960w, /hero/hill-1280.webp 1280w, /hero/hill-1600.webp 1600w"
              sizes="(min-width:1280px) 1280px, 100vw"
            />
            <img
              alt=""
              aria-hidden
              className="absolute inset-0 block h-full w-full object-cover select-none"
              decoding="async"
              fetchPriority="high"
              src="/hero/hill-1280.jpg"
            />
          </picture>
          <img
            alt=""
            aria-hidden
            className="pointer-events-none absolute top-[44%] left-1/2 w-[clamp(220px,28vw,420px)] -translate-x-1/2 select-none"
            src="/hero/hero-cards-sketch.svg"
          />
          <img
            alt=""
            aria-hidden
            className="pointer-events-none absolute top-[54%] left-1/2 w-[clamp(200px,22vw,360px)] -translate-x-1/2 select-none"
            src="/hero/hero-teacher-sketch.svg"
          />
        </div>

        <div className="relative z-10 flex w-full flex-col">
          <div className="px-4 pt-4 sm:px-6 sm:pt-6">
            <SiteHeader />
          </div>
          <div className="mx-auto mt-12 flex w-fit flex-col items-center px-4 text-center sm:mt-16">
            <h1
              className="font-heading text-[clamp(2rem,5vw,3.5rem)] leading-[1.05] font-semibold tracking-tight text-balance text-white drop-shadow-[0_2px_10px_rgb(15_23_42_/_0.22)]"
              id="hero-title-static"
            >
              {hero.headline}
            </h1>
            <Button
              asChild
              className="mt-7 h-10 rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-[0_8px_22px_-12px_rgb(36_90_219_/_0.7)] hover:bg-primary/90"
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
