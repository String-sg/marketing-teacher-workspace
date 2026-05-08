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
      className="relative px-5 py-14 sm:px-8 sm:py-20 lg:py-28"
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
                  className="group/audience relative flex h-[520px] flex-col items-center overflow-clip rounded-[28px] px-8 pt-10"
                  style={{ backgroundColor: CARD_BG[i] }}
                >
                  <h3 className="text-center font-heading text-[clamp(1.5rem,2.2vw,2rem)] leading-[1.12] font-medium tracking-tight text-[color:var(--paper-ink)]">
                    {column.label}
                  </h3>
                  <p className="mt-4 max-w-[280px] text-center text-base leading-[26px] text-pretty text-[color:var(--paper-muted)]">
                    {column.body}
                  </p>
                  <div className="mt-auto h-[260px] w-full max-w-[440px]">
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
    <p className="text-[10px] font-semibold tracking-wider text-black/55 uppercase">
      {children}
    </p>
  )
}

function FormTeachersPeek() {
  const rows = [
    {
      idx: "1",
      name: "Chua Li Wei",
      classCode: "3A",
      tag: "FAS",
      tagClass: "bg-rose-50 text-rose-600",
    },
    {
      idx: "2",
      name: "Rahman Tan",
      classCode: "3B",
      tag: "TCI",
      tagClass: "bg-emerald-50 text-emerald-700",
    },
    {
      idx: "3",
      name: "Siti Putri",
      classCode: "3D",
      tag: "LSM",
      tagClass: "bg-sky-50 text-sky-700",
    },
  ]

  return (
    <div className="flex h-full flex-col rounded-t-2xl border border-black/10 bg-white p-4 pb-5 shadow-[var(--paper-shadow-peek)]">
      <PeekKicker>Class · Sec 3.1</PeekKicker>
      <ul className="mt-3 flex flex-col">
        {rows.map((row, i) => (
          <li
            className={[
              "flex items-center gap-3 py-2",
              i < rows.length - 1 ? "border-b border-black/5" : "",
            ].join(" ")}
            key={row.idx}
          >
            <span className="w-3 shrink-0 text-[11px] text-black/45">
              {row.idx}
            </span>
            <span className="flex-1 truncate text-[12px] font-medium text-[color:var(--paper-ink)]">
              {row.name}
            </span>
            <span className="shrink-0 text-[12px] text-[color:var(--paper-ink)]/70">
              {row.classCode}
            </span>
            <span
              className={`shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-medium ${row.tagClass}`}
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
    <div className="flex h-full flex-col rounded-t-2xl border border-black/10 bg-white p-4 pb-5 shadow-[var(--paper-shadow-peek)]">
      <PeekKicker>Cohort filter</PeekKicker>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {chips.map((chip, i) => (
          <span
            className={[
              "inline-flex h-6 items-center rounded-full px-2.5 text-[11px] font-medium",
              i === 0
                ? "bg-[color:var(--cta-blue)] text-white"
                : "border border-black/10 bg-white text-[color:var(--paper-ink)]",
            ].join(" ")}
            key={chip}
          >
            {chip}
          </span>
        ))}
      </div>
      <div className="mt-4 flex items-baseline gap-2">
        <span className="text-2xl leading-none font-semibold tracking-tight text-[color:var(--paper-ink)]">
          17
        </span>
        <span className="text-[12px] leading-4 text-black/55">
          students matched · saved as &ldquo;Bursary nominees&rdquo;
        </span>
      </div>
      <div className="mt-3 flex items-center gap-2 border-t border-black/10 pt-2.5">
        <span
          aria-hidden
          className="size-1.5 rounded-full bg-[color:var(--cta-blue)]"
        />
        <span className="flex-1 truncate text-[12px] leading-4 text-[color:var(--paper-ink)]">
          Sec 3.1 · Chua Li Wei
        </span>
        <span className="rounded-md bg-rose-50 px-1.5 py-0.5 text-[10px] font-medium text-rose-600">
          FAS
        </span>
      </div>
    </div>
  )
}

function SchoolLeadersPeek() {
  const cohorts = [
    { label: "Sec 1", students: 312, flagged: 24 },
    { label: "Sec 2", students: 305, flagged: 18 },
    { label: "Sec 3", students: 298, flagged: 31 },
    { label: "Sec 4", students: 296, flagged: 22 },
  ]
  const max = Math.max(...cohorts.map((c) => c.flagged))
  return (
    <div className="flex h-full flex-col rounded-t-2xl border border-black/10 bg-white p-4 pb-5 shadow-[var(--paper-shadow-peek)]">
      <div className="flex items-center justify-between">
        <PeekKicker>Whole school · 4 cohorts</PeekKicker>
        <span className="text-[10px] font-medium text-emerald-600">
          <span aria-hidden>↗</span> Improving
        </span>
      </div>
      <div className="mt-2 flex items-baseline gap-2">
        <span className="text-[32px] leading-none font-semibold tracking-tight text-[color:var(--paper-ink)]">
          1,211
        </span>
        <span className="rounded-md bg-[color:var(--cta-blue)]/10 px-1.5 py-0.5 text-[10px] font-semibold text-[color:var(--cta-blue)]">
          95 flagged
        </span>
      </div>
      <p className="mt-1 text-[11px] leading-4 text-black/55">
        students across Sec 1–4
      </p>
      <div
        aria-hidden
        className="mt-4 flex h-12 items-end gap-1.5"
      >
        {cohorts.map((c) => (
          <span
            className="flex-1 rounded-t-sm bg-[color:var(--cta-blue)]"
            key={c.label}
            style={{ height: `${(c.flagged / max) * 48}px` }}
          />
        ))}
      </div>
      <div className="mt-1.5 flex gap-1.5">
        {cohorts.map((c) => (
          <span
            className="flex-1 text-center text-[10px] leading-3 text-black/55"
            key={c.label}
          >
            {c.label}
          </span>
        ))}
      </div>
    </div>
  )
}
