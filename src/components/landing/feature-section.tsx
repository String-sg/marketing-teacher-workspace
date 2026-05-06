import { useState } from "react"

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

function resolveContent(props: FeatureSectionProps): FeatureSectionContent {
  if (props.content) return props.content
  const entry = stages.find((s) => s.id === "docked")
  if (!entry || entry.id !== "docked") {
    throw new Error("FeatureSection: docked stage missing from stages")
  }
  return entry.copy
}

export function FeatureSection(props: FeatureSectionProps) {
  const content = resolveContent(props)
  const sectionId =
    props.id ?? (props.stage === "docked" ? "features" : undefined)
  const [active, setActive] = useState(0)

  return (
    <section
      className="relative px-5 py-14 sm:px-8 sm:py-24 lg:py-32"
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
          <h2 className="font-heading text-[clamp(2rem,3.6vw,3.5rem)] leading-[1.21] font-medium tracking-tight whitespace-pre-line text-[color:var(--paper-ink)]">
            {content.heading}
          </h2>

          <div className="mt-8 border-t border-[color:var(--paper-rule)]">
            {content.bullets.map((bullet, idx) => (
              <button
                aria-expanded={idx === active}
                className="flex w-full gap-4 border-b border-[color:var(--paper-rule)] py-6 text-left transition-colors hover:bg-[color:var(--paper-ink)]/[0.02] focus-visible:outline-none focus-visible:bg-[color:var(--paper-ink)]/[0.03]"
                key={bullet.title}
                onClick={() => setActive(idx)}
                type="button"
              >
                <span
                  aria-hidden
                  className={[
                    "mt-[10px] size-2 shrink-0 rounded-full transition-colors",
                    idx === active
                      ? "bg-primary"
                      : "border border-[color:var(--paper-ink)]/25",
                  ].join(" ")}
                />
                <div className="min-w-0">
                  <p className="text-[17px] leading-[26px] font-semibold tracking-[-0.005em] text-[color:var(--paper-ink)]">
                    {bullet.title}
                  </p>
                  {idx === active ? (
                    <p className="mt-2 text-[15px] leading-[24px] text-[color:var(--paper-muted)]">
                      {bullet.body}
                    </p>
                  ) : null}
                </div>
              </button>
            ))}
          </div>

          <a
            className="mt-7 inline-block text-[15px] leading-[22px] font-semibold text-[color:var(--paper-ink)] underline underline-offset-[6px] decoration-[color:var(--paper-ink)]/40 transition-colors hover:decoration-[color:var(--paper-ink)] focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-primary/40"
            href={content.cta.href}
            rel="noreferrer"
          >
            {content.cta.label}
          </a>
        </div>

        <div
          className={[
            "relative hidden lg:block",
            props.reverse ? "lg:order-1" : "",
          ].join(" ")}
        >
          <div className="paper-card relative overflow-hidden rounded-2xl border border-black/10 bg-white">
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
