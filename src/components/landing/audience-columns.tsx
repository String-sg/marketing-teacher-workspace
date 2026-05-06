import { audienceCopy } from "@/content/landing"

import { RevealOnScroll } from "./reveal-on-scroll"

const CARD_BG = [
  "var(--audience-sky)",
  "var(--audience-sky)",
  "var(--audience-sky)",
] as const

const PEEKS = [FormTeachersPeek, YearHeadsPeek, SchoolLeadersPeek] as const

export function AudienceColumns() {
  return (
    <section
      className="relative px-5 py-20 sm:px-8 lg:py-28"
      id="audiences"
    >
      <div className="mx-auto w-full max-w-[1248px]">
        <RevealOnScroll>
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-heading text-[clamp(1.75rem,4vw,3.5rem)] leading-[1.08] font-medium tracking-tight text-balance text-[color:var(--paper-ink)]">
              {audienceCopy.heading}
            </h2>
            <p className="mt-6 text-base leading-[1.7] text-balance text-[color:var(--paper-muted)] sm:text-lg">
              {audienceCopy.subheading}
            </p>
          </div>
        </RevealOnScroll>

        <div className="mt-14 grid grid-cols-1 gap-7 lg:mt-20 lg:grid-cols-3">
          {audienceCopy.columns.map((column, i) => {
            const Peek = PEEKS[i]
            return (
              <RevealOnScroll delay={i * 100} key={column.label}>
                <article
                  className="group/audience relative flex h-[520px] flex-col items-center overflow-clip rounded-[28px] px-8 pt-9 transition-transform duration-300 ease-out hover:-translate-y-1"
                  style={{ backgroundColor: CARD_BG[i] }}
                >
                  <h3 className="text-center font-heading text-[clamp(1.5rem,2.2vw,2rem)] leading-[1.12] font-medium tracking-tight text-[color:var(--paper-ink)]">
                    {column.label}
                  </h3>
                  <p className="mt-4 max-w-[280px] text-center text-base leading-[26px] text-[color:var(--paper-muted)]">
                    {column.body}
                  </p>
                  <div className="mt-auto h-[210px] w-full max-w-[349px] transition-transform duration-300 ease-out group-hover/audience:translate-y-[-4px]">
                    <Peek />
                  </div>
                </article>
              </RevealOnScroll>
            )
          })}
        </div>
      </div>
    </section>
  )
}

function PeekKicker({ children }: { children: React.ReactNode }) {
  return (
    <p className="font-mono text-[11px] leading-4 font-medium text-[color:var(--paper-muted)]">
      {children}
    </p>
  )
}

function FormTeachersPeek() {
  const rows = [
    {
      class: "3.1",
      initials: "CL",
      avatarBg: "var(--audience-cream)",
      name: "Chua Li Wei",
      tag: "FAS",
      tagBg: "rgb(36 90 219 / 0.1)",
      tagInk: "var(--cta-blue)",
    },
    {
      class: "3.2",
      initials: "RT",
      avatarBg: "var(--audience-sky)",
      name: "Rahman Tan",
      tag: "SEN",
      tagBg: "rgb(124 196 138 / 0.2)",
      tagInk: "#1f6b34",
    },
    {
      class: "3.4",
      initials: "SP",
      avatarBg: "var(--audience-mint)",
      name: "Siti Putri",
      tag: "Counsel",
      tagBg: "rgb(245 198 86 / 0.30)",
      tagInk: "#7a5b18",
    },
  ]

  return (
    <div className="flex h-full flex-col rounded-t-2xl border border-[color:var(--paper-rule)] bg-white/85 p-4 pb-5 shadow-[var(--paper-shadow-peek)] backdrop-blur-sm">
      <PeekKicker>Class · Sec 3.1</PeekKicker>
      <ul className="mt-3 flex flex-col gap-2.5">
        {rows.map((row) => (
          <li
            className="flex items-center gap-3"
            key={row.initials}
          >
            <span className="w-6 shrink-0 font-mono text-[11px] text-[color:var(--paper-muted)]">
              {row.class}
            </span>
            <span
              aria-hidden
              className="grid size-7 shrink-0 place-items-center rounded-full text-[10px] font-semibold tracking-wide text-[color:var(--paper-ink)]/80"
              style={{ backgroundColor: row.avatarBg }}
            >
              {row.initials}
            </span>
            <span className="flex-1 truncate text-[13px] leading-5 text-[color:var(--paper-ink)]">
              {row.name}
            </span>
            <span
              className="shrink-0 rounded-md px-2 py-[3px] text-[11px] leading-[14px] font-semibold"
              style={{ backgroundColor: row.tagBg, color: row.tagInk }}
            >
              {row.tag}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function YearHeadsPeek() {
  const chips = ["FAS", "SEN", "Low att.", "Pre-LTA"]
  return (
    <div className="flex h-full flex-col rounded-t-2xl border border-[color:var(--paper-rule)] bg-white/85 p-4 pb-5 shadow-[var(--paper-shadow-peek)] backdrop-blur-sm">
      <PeekKicker>Cohort filter</PeekKicker>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {chips.map((chip, i) => (
          <span
            className={[
              "rounded-md px-2 py-[3px] text-[11px] leading-[14px] font-semibold",
              i === 0
                ? "bg-primary text-white"
                : "border border-[color:var(--paper-rule-strong)] bg-white text-[color:var(--paper-ink)]/80",
            ].join(" ")}
            key={chip}
          >
            {chip}
          </span>
        ))}
      </div>
      <div className="mt-4 flex items-baseline gap-2">
        <span className="font-heading text-[28px] leading-[32px] font-semibold text-[color:var(--paper-ink)]">
          17
        </span>
        <span className="text-[13px] leading-[18px] text-[color:var(--paper-muted)]">
          students matched · saved as &ldquo;Bursary nominees&rdquo;
        </span>
      </div>
      <div className="mt-3 flex items-center gap-2 border-t border-[color:var(--paper-rule)] pt-2.5">
        <span aria-hidden className="size-1.5 rounded-full bg-primary" />
        <span className="flex-1 truncate text-[12px] leading-4 text-[color:var(--paper-ink)]">
          Sec 3.1 · Chua Li Wei
        </span>
        <span className="rounded-md bg-primary/10 px-1.5 py-[2px] text-[10px] leading-3 font-semibold text-primary">
          FAS
        </span>
      </div>
    </div>
  )
}

function SchoolLeadersPeek() {
  const bars = [9, 14, 19, 22, 25, 28, 31]
  const days = ["M", "T", "W", "T", "F", "S", "S"]
  return (
    <div className="flex h-full flex-col rounded-t-2xl border border-[color:var(--paper-rule)] bg-white/85 p-4 pb-5 shadow-[var(--paper-shadow-peek)] backdrop-blur-sm">
      <PeekKicker>Adoption · this week</PeekKicker>
      <div className="mt-3 flex items-baseline gap-2">
        <span className="font-heading text-[36px] leading-[40px] font-semibold tracking-tight text-[color:var(--paper-ink)]">
          86%
        </span>
        <span className="rounded-md bg-primary/10 px-1.5 py-[2px] text-[11px] leading-[14px] font-semibold text-primary">
          ↑ 12 pp
        </span>
      </div>
      <p className="mt-1 text-[13px] leading-5 text-[color:var(--paper-muted)]">
        teachers active in last 7 days
      </p>
      <div
        aria-hidden
        className="mt-4 flex h-12 items-end gap-1.5"
      >
        {bars.map((h, i) => (
          <span
            className="flex-1 rounded-t-sm bg-primary/85"
            key={i}
            style={{ height: `${h * 1.4}px` }}
          />
        ))}
      </div>
      <div className="mt-1.5 flex gap-1.5">
        {days.map((d, i) => (
          <span
            className="flex-1 text-center text-[10px] leading-3 text-[color:var(--paper-muted)]"
            key={i}
          >
            {d}
          </span>
        ))}
      </div>
    </div>
  )
}
