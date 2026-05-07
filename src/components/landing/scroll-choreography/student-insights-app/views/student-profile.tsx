import { KpiCard } from "../components/kpi-card"
import type { Student } from "../data"

const JUMP_TO_ITEMS = [
  "Attendance",
  "Behaviour",
  "Wellbeing",
  "Academic",
  "Family",
  "Reports",
] as const

export function StudentProfileView({
  student,
  onBack,
  onPrev,
  onNext,
}: {
  student: Student
  onBack: () => void
  onPrev: () => void
  onNext: () => void
}) {
  return (
    <div className="flex h-full flex-col gap-3 px-5 pt-3 pb-2">
      <div className="flex items-center justify-between text-[11px]">
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-black/55">
          <button
            type="button"
            className="hover:text-[color:var(--paper-ink)]"
            onClick={onBack}
          >
            Home
          </button>
          <Chevron />
          <button
            type="button"
            className="hover:text-[color:var(--paper-ink)]"
            onClick={onBack}
          >
            Profile
          </button>
          <Chevron />
          <span className="text-[color:var(--paper-ink)]">{student.name}</span>
        </nav>
      </div>

      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex h-7 items-center gap-1.5 rounded-full px-2 text-[12px] text-[color:var(--paper-ink)] hover:bg-black/[0.04]"
        >
          <span aria-hidden>←</span> Dashboard
        </button>
        <div className="flex items-center gap-1">
          <RoundIconButton ariaLabel="Previous student" onClick={onPrev}>
            <ChevronIcon dir="left" />
          </RoundIconButton>
          <RoundIconButton ariaLabel="Next student" onClick={onNext}>
            <ChevronIcon dir="right" />
          </RoundIconButton>
          <RoundIconButton ariaLabel="Download" onClick={() => {}}>
            <DownloadIcon />
          </RoundIconButton>
        </div>
      </div>

      <div className="pointer-events-none grid min-h-0 flex-1 grid-cols-[1fr_140px] gap-3 overflow-hidden">
        <div className="min-h-0 overflow-hidden pr-1">
          <div className="flex flex-col gap-3">
            <section className="flex items-center gap-3 rounded-xl border border-black/10 bg-white px-3 py-3">
              <div className="grid size-12 place-items-center rounded-full bg-black/[0.04] text-black/40">
                <UserIcon />
              </div>
              <div className="flex-1">
                <div className="text-[15px] font-semibold tracking-tight text-[color:var(--paper-ink)]">
                  {student.name}
                </div>
                <div className="text-[11px] text-black/55">
                  Class {student.classCode} · {student.cca}
                </div>
              </div>
              <button
                type="button"
                className="inline-flex h-7 items-center gap-1.5 rounded-full border border-black/15 px-2.5 text-[11px] text-[color:var(--paper-ink)] hover:bg-black/[0.03]"
              >
                <PhoneIcon /> Primary contact
              </button>
            </section>

            <div className="grid grid-cols-3 gap-2">
              <KpiCard
                label="Attendance"
                value={`${student.attendancePct}%`}
                caption="Current term"
                trend={student.attendanceTrend}
              />
              <KpiCard
                label="Academics"
                value={`${student.academicsPct}%`}
                caption="Overall %"
                trend={student.academicsTrend}
              />
              <KpiCard
                label="Wellbeing"
                value={String(student.tciRiskIndicators)}
                caption="TCI risk indicators"
                trend={student.wellbeingTrend}
              />
            </div>

            <Section
              icon={<CalendarIcon />}
              iconBg="bg-amber-50 text-amber-600"
              title="Attendance"
            >
              <Stat label="Attendance(%)" value={String(student.attendancePct)} />
              <Stat label="Late-coming(%)" value={String(student.lateComingPct)} />
              <Stat
                label="Non-VR absences(%)"
                value={String(student.nonVrAbsencesPct)}
              />
              <Stat
                label="CCA attendance(%)"
                value={String(student.ccaAttendancePct)}
              />
            </Section>

            <Section
              icon={<BookIcon />}
              iconBg="bg-violet-50 text-violet-600"
              title="Behaviour"
            >
              <Stat label="Offences" value={String(student.offences)} />
              <Stat
                label="Counselling cases"
                value={String(student.counsellingCases)}
              />
              <Stat
                label="SEN"
                value={
                  student.attentionTags.length === 0
                    ? "—"
                    : student.attentionTags.join(", ")
                }
              />
              <Stat label="Conduct grade" value={student.conductGrade} />
            </Section>

            <Section
              icon={<HeartIcon />}
              iconBg="bg-rose-50 text-rose-500"
              title="Wellbeing"
            >
              <Stat
                label="TCI risk indicators"
                value={String(student.tciRiskIndicators)}
              />
              <Stat
                label="Counsellor"
                value={student.counsellingCases > 0 ? "Active case" : "—"}
              />
            </Section>
          </div>
        </div>

        <aside className="overflow-hidden">
          <div className="text-[10px] tracking-wider text-black/55 uppercase">
            Jump to
          </div>
          <ul className="mt-1.5 flex flex-col gap-1">
            {JUMP_TO_ITEMS.map((item) => (
              <li key={item}>
                <a
                  href={`#${item.toLowerCase()}`}
                  className="block rounded-full bg-black/[0.03] px-3 py-1 text-[11px] text-[color:var(--paper-ink)] hover:bg-black/[0.06]"
                  onClick={(event) => event.preventDefault()}
                >
                  {item}
                </a>
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </div>
  )
}

function Section({
  icon,
  iconBg,
  title,
  children,
}: {
  icon: React.ReactNode
  iconBg: string
  title: string
  children: React.ReactNode
}) {
  return (
    <section className="rounded-xl border border-black/10 bg-white p-3">
      <header className="mb-2.5 flex items-center gap-2">
        <span
          className={`grid size-7 place-items-center rounded-md ${iconBg}`}
        >
          {icon}
        </span>
        <h2 className="text-[13px] font-semibold tracking-tight text-[color:var(--paper-ink)]">
          {title}
        </h2>
      </header>
      <div className="grid grid-cols-3 gap-2">{children}</div>
    </section>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] text-black/55">{label}</span>
      <span className="text-[13px] font-semibold text-[color:var(--paper-ink)]">
        {value}
      </span>
    </div>
  )
}

function RoundIconButton({
  ariaLabel,
  onClick,
  children,
}: {
  ariaLabel: string
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      onClick={onClick}
      className="inline-flex size-7 items-center justify-center rounded-full border border-black/10 text-black/60 hover:bg-black/[0.03]"
    >
      {children}
    </button>
  )
}

function Chevron() {
  return (
    <span aria-hidden className="text-black/35">
      ›
    </span>
  )
}

function ChevronIcon({ dir }: { dir: "left" | "right" }) {
  return (
    <svg width="11" height="11" viewBox="0 0 12 12" aria-hidden>
      <path
        d={dir === "left" ? "M7.5 2.5l-3 3.5 3 3.5" : "M4.5 2.5l3 3.5-3 3.5"}
        stroke="currentColor"
        strokeWidth="1.4"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function DownloadIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 12 12" aria-hidden>
      <path
        d="M6 2v6m0 0l-2.5-2.5M6 8l2.5-2.5M2.5 10h7"
        stroke="currentColor"
        strokeWidth="1.4"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function PhoneIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 12 12" aria-hidden>
      <path
        d="M3 2.5C3 2 3.5 1.5 4 1.5h.7c.4 0 .8.3.9.7l.4 1.5c.1.4 0 .8-.3 1l-.6.6c.6 1.3 1.7 2.4 3 3l.6-.6c.3-.3.7-.4 1.1-.3l1.5.4c.4.1.7.5.7.9V9c0 .5-.5 1-1 1A7 7 0 0 1 3 2.5z"
        stroke="currentColor"
        strokeWidth="1.2"
        fill="none"
      />
    </svg>
  )
}

function UserIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden>
      <circle cx="12" cy="9" r="3.2" stroke="currentColor" strokeWidth="1.6" fill="none" />
      <path
        d="M5 19c1.5-3 4-4.5 7-4.5s5.5 1.5 7 4.5"
        stroke="currentColor"
        strokeWidth="1.6"
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  )
}

function CalendarIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden>
      <rect x="2.5" y="3.5" width="11" height="10" rx="1.4" stroke="currentColor" strokeWidth="1.3" fill="none" />
      <path d="M5 2v3M11 2v3M2.5 6.5h11" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  )
}

function BookIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden>
      <path
        d="M3 3h4.5c.8 0 1.5.7 1.5 1.5v9c0-.8-.7-1.5-1.5-1.5H3V3zM13 3H8.5C7.7 3 7 3.7 7 4.5v9c0-.8.7-1.5 1.5-1.5H13V3z"
        stroke="currentColor"
        strokeWidth="1.3"
        fill="none"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function HeartIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden>
      <path
        d="M8 13s-5-3-5-6.5C3 4.5 4.5 3 6.5 3 7.7 3 8 4 8 4s.3-1 1.5-1c2 0 3.5 1.5 3.5 3.5C13 10 8 13 8 13z"
        stroke="currentColor"
        strokeWidth="1.3"
        fill="none"
        strokeLinejoin="round"
      />
    </svg>
  )
}
