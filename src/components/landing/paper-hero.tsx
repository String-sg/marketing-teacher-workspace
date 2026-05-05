import {
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useTransform,
} from "motion/react"
import { useRef, useState } from "react"

import { useIsDesktop } from "@/components/landing/scroll-choreography/use-is-desktop"
import { SiteHeader } from "@/components/landing/site-header"
import { Button } from "@/components/ui/button"
import {
  siteCtaCopy,
  stages,
  TEACHER_WORKSPACE_APP_URL,
} from "@/content/landing"

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v)

export function PaperHero() {
  const heroEntry = stages.find((s) => s.id === "hero")
  if (!heroEntry || heroEntry.id !== "hero") {
    throw new Error("PaperHero: hero stage missing from content/landing stages")
  }
  const hero = heroEntry.copy

  const sectionRef = useRef<HTMLElement>(null)
  const prefersReducedMotion = useReducedMotion()
  const isDesktop = useIsDesktop()
  const reduced = prefersReducedMotion === true || !isDesktop
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  })

  // Phase 2 cleanup target — do not refactor in isolation.
  const stageScale = useTransform(scrollYProgress, [0, 0.6, 1], [1, 2.4, 5.2])
  const screenScale = useTransform(
    scrollYProgress,
    [0, 0.55, 0.85, 1],
    [0.55, 0.55, 1, 1.04]
  )
  const copyY = useTransform(
    scrollYProgress,
    [0, 0.14, 1],
    ["0px", "-72px", "-72px"]
  )
  const cloudYLeft = useTransform(scrollYProgress, [0, 1], ["0px", "-160px"])
  const cloudYRight = useTransform(scrollYProgress, [0, 1], ["0px", "-110px"])

  const [stageOpacity, setStageOpacity] = useState(1)
  const [screenOpacity, setScreenOpacity] = useState(0)
  const [copyOpacity, setCopyOpacity] = useState(1)

  useMotionValueEvent(scrollYProgress, "change", (p) => {
    setStageOpacity(p < 0.6 ? 1 : clamp01(1 - (p - 0.6) / 0.18))
    setScreenOpacity(p < 0.55 ? 0 : clamp01((p - 0.55) / 0.23))
    setCopyOpacity(p < 0.06 ? 1 : clamp01(1 - (p - 0.06) / 0.08))
  })

  return (
    <section
      aria-labelledby="hero-title"
      className={
        reduced ? "relative min-h-svh overflow-hidden" : "relative h-[280vh]"
      }
      ref={sectionRef}
    >
      <div
        className={
          reduced
            ? "relative p-3"
            : "sticky top-0 flex h-svh items-stretch overflow-hidden p-3"
        }
      >
        <motion.div
          className="paper-card relative mx-auto flex w-full max-w-[110rem] flex-1 flex-col items-center overflow-hidden rounded-[20px] bg-[color:var(--paper-card)] shadow-[0_10px_60px_-30px_rgb(15_23_42/0.18)]"
          style={
            reduced
              ? undefined
              : {
                  scale: stageScale,
                  opacity: stageOpacity,
                  transformOrigin: "50% 92%",
                }
          }
        >
          <motion.div
            aria-hidden
            className="pointer-events-none absolute -bottom-8 -left-10 w-[min(28vw,300px)] sm:-left-12"
            style={reduced ? undefined : { y: cloudYLeft }}
          >
            <img
              alt=""
              className="cloud-drift-left block w-full opacity-80 mix-blend-multiply select-none"
              src="/hero/cloud-halftone.png"
            />
          </motion.div>
          <motion.div
            aria-hidden
            className="pointer-events-none absolute -top-4 -right-10 w-[min(26vw,280px)] sm:-right-12"
            style={reduced ? undefined : { y: cloudYRight }}
          >
            <img
              alt=""
              className="cloud-drift-right block w-full opacity-80 mix-blend-multiply select-none"
              src="/hero/cloud-halftone.png"
            />
          </motion.div>

          <div className="relative z-10 flex w-full flex-col">
            <div className="px-4 pt-4 sm:px-6 sm:pt-6">
              <SiteHeader />
            </div>
            <motion.div
              className="mx-auto mt-10 flex w-fit flex-col items-center text-center sm:mt-14"
              style={reduced ? undefined : { opacity: copyOpacity, y: copyY }}
            >
              <h1
                className="font-heading text-[clamp(1.75rem,4.4vw,4rem)] leading-[1.05] font-medium tracking-tight text-[color:var(--paper-ink)]"
                id="hero-title"
              >
                {hero.headline}
              </h1>
              <p className="mt-3 max-w-xl text-base leading-7 text-balance text-[color:var(--paper-muted)] sm:text-lg sm:leading-8">
                {hero.subline}
              </p>
              <Button
                asChild
                className="mt-6 h-11 rounded-full bg-primary px-7 text-base text-primary-foreground hover:bg-primary/90 sm:mt-7"
              >
                <a href={TEACHER_WORKSPACE_APP_URL} rel="noreferrer">
                  {siteCtaCopy.primary}
                </a>
              </Button>
            </motion.div>
          </div>

          <div className="relative z-0 mt-auto flex w-full justify-center pb-0">
            <div className="relative w-full max-w-[360px] px-4 sm:max-w-[400px]">
              <img
                alt="Teacher working at her desk with a laptop and lamp"
                className="hero-media block h-auto w-full select-none"
                src="/hero/teacher-illustration.png"
              />
            </div>
          </div>
        </motion.div>

        {!reduced && (
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center px-4 sm:px-10 lg:px-16"
            style={{ opacity: screenOpacity }}
          >
            <motion.div
              className="relative w-full max-w-[1280px] overflow-hidden rounded-2xl border border-black/10 bg-white shadow-[0_30px_120px_-40px_rgb(15_23_42/0.45)]"
              style={{ scale: screenScale }}
            >
              <div className="flex items-center gap-2 border-b border-black/5 bg-[#f7f7f5] px-4 py-2.5">
                <span className="size-3 rounded-full bg-[#ff5f57]" />
                <span className="size-3 rounded-full bg-[#febc2e]" />
                <span className="size-3 rounded-full bg-[#28c840]" />
                <span className="ml-4 truncate text-xs text-black/55">
                  {TEACHER_WORKSPACE_APP_URL.replace("https://", "")}
                </span>
              </div>
              <img
                alt="Teacher Workspace student insights dashboard"
                className="block h-auto w-full select-none"
                src="/hero/profiles-screen.png"
              />
            </motion.div>
          </div>
        )}
      </div>

      {reduced ? (
        <div className="relative mx-auto mt-12 max-w-5xl px-4 pb-12 sm:px-6 lg:px-10">
          <div className="overflow-hidden rounded-2xl border border-black/10 bg-white shadow-[0_10px_40px_-20px_rgb(15_23_42/0.2)]">
            <div className="flex items-center gap-2 border-b border-black/5 bg-[#f7f7f5] px-4 py-2.5">
              <span className="size-3 rounded-full bg-[#ff5f57]" />
              <span className="size-3 rounded-full bg-[#febc2e]" />
              <span className="size-3 rounded-full bg-[#28c840]" />
              <span className="ml-4 truncate text-xs text-black/55">
                {TEACHER_WORKSPACE_APP_URL.replace("https://", "")}
              </span>
            </div>
            <img
              alt="Teacher Workspace student insights dashboard"
              className="block h-auto w-full select-none"
              src="/hero/profiles-screen.png"
            />
          </div>
        </div>
      ) : null}
    </section>
  )
}
