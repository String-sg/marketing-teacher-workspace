import { ArrowUpRightIcon, CheckIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import type {
  BulletItem,
  CtaLink,
} from "@/components/landing/scroll-choreography/types"
import { stages, TEACHER_WORKSPACE_APP_URL } from "@/content/landing"

export type FeatureSectionContent = {
  readonly kicker: string
  readonly heading: string
  readonly paragraph: string
  readonly bullets: readonly [BulletItem, BulletItem, BulletItem]
  readonly cta: CtaLink
}

type FeatureSectionProps = {
  readonly id?: string
  readonly reverse?: boolean
} & (
  | { readonly stage: "docked"; readonly content?: never }
  | { readonly stage?: never; readonly content: FeatureSectionContent }
)

function resolveContent(
  props: FeatureSectionProps
): FeatureSectionContent {
  if (props.content) return props.content
  const entry = stages.find((s) => s.id === "docked")
  if (!entry || entry.id !== "docked") {
    throw new Error("FeatureSection: docked stage missing from stages")
  }
  return entry.copy
}

export function FeatureSection(props: FeatureSectionProps) {
  const content = resolveContent(props)
  const sectionId = props.id ?? (props.stage === "docked" ? "features" : undefined)

  return (
    <section
      className="relative px-5 py-24 sm:px-8 lg:py-32"
      id={sectionId}
    >
      <div
        className={[
          "mx-auto grid max-w-[110rem] gap-12 lg:items-center lg:gap-20",
          props.reverse
            ? "lg:grid-cols-[1.15fr_0.85fr]"
            : "lg:grid-cols-[0.85fr_1.15fr]",
        ].join(" ")}
      >
        <div
          className={[
            "max-w-xl",
            props.reverse ? "lg:order-2 lg:ml-auto" : "",
          ].join(" ")}
        >
          <p className="text-xs font-medium tracking-[0.18em] text-[color:var(--paper-muted)] uppercase sm:text-sm">
            {content.kicker}
          </p>
          <h2 className="mt-4 font-heading text-[clamp(1.5rem,3.6vw,3.25rem)] leading-[1.08] font-medium tracking-tight text-balance text-[color:var(--paper-ink)]">
            {content.heading}
          </h2>
          <p className="mt-6 text-base leading-7 text-[color:var(--paper-muted)] sm:text-lg sm:leading-8">
            {content.paragraph}
          </p>

          <div className="mt-10 flex flex-col">
            {content.bullets.map((bullet) => (
              <article
                className="border-t border-[color:var(--paper-rule)]/55 py-5 first:border-t-0 first:pt-0"
                key={bullet.title}
              >
                <div className="flex gap-4">
                  <span className="mt-1 grid size-6 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
                    <CheckIcon aria-hidden className="size-3.5" />
                  </span>
                  <div>
                    <p className="font-medium leading-7 text-[color:var(--paper-ink)]">
                      {bullet.title}
                    </p>
                    <p className="mt-1 leading-7 text-[color:var(--paper-muted)]">
                      {bullet.body}
                    </p>
                  </div>
                </div>
              </article>
            ))}
          </div>

          <Button
            asChild
            className="mt-10 h-11 rounded-full bg-primary px-7 text-base text-primary-foreground hover:bg-primary/90"
          >
            <a href={content.cta.href} rel="noreferrer">
              {content.cta.label}
              <ArrowUpRightIcon data-icon="inline-end" />
            </a>
          </Button>
        </div>

        <div className={["relative hidden lg:block", props.reverse ? "lg:order-1" : ""].join(" ")}>
          <div className="paper-card relative overflow-hidden rounded-[20px] border border-black/10 bg-white shadow-[0_30px_120px_-40px_rgb(15_23_42/0.45)]">
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
      </div>
    </section>
  )
}
