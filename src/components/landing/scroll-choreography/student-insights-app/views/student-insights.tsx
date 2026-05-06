import { useMemo } from "react"

import { ClassSelector } from "../components/class-selector"
import { EMPTY_FILTER, FilterPopover } from "../components/filter-popover"
import { KpiCard } from "../components/kpi-card"
import { StudentRow } from "../components/student-row"
import { getClassById } from "../data"
import type { FilterState } from "../components/filter-popover"

const COLUMN_HEADERS = [
  { label: "#", width: "w-[36px]" },
  { label: "Name", sortable: true },
  { label: "Class", sortable: true },
  { label: "CCA", sortable: true },
  { label: "Attention tag" },
  { label: "Attendance(%)", sortable: true },
  { label: "Late-coming(%)", sortable: true },
  { label: "Non-VR a…" },
] as const

export function StudentInsightsView({
  classId,
  onChangeClass,
  filter,
  onChangeFilter,
  onSelectStudent,
  filterOpen,
  onFilterOpenChange,
}: {
  classId: string
  onChangeClass: (id: string) => void
  filter: FilterState
  onChangeFilter: (next: FilterState) => void
  onSelectStudent: (id: string) => void
  filterOpen?: boolean
  onFilterOpenChange?: (open: boolean) => void
}) {
  const cls = getClassById(classId)
  const visibleStudents = useMemo(() => {
    return cls.students.filter((student) => {
      if (filter.cca && student.cca !== filter.cca) return false
      if (
        filter.lateComingMin !== null &&
        student.lateComingPct <= filter.lateComingMin
      )
        return false
      if (
        filter.attentionTag &&
        !student.attentionTags.includes(filter.attentionTag)
      )
        return false
      return true
    })
  }, [cls.students, filter])

  return (
    <div className="flex h-full flex-col gap-3 px-5 pt-4 pb-2">
      <header>
        <h1 className="text-xl leading-tight font-semibold tracking-tight text-[color:var(--paper-ink)]">
          Student Insights
        </h1>
        <p className="mt-0.5 text-[11px] text-black/55">
          Key data to understand your students holistically
        </p>
      </header>

      <ClassSelector classId={classId} onChange={onChangeClass} />

      <div className="grid grid-cols-3 gap-2">
        <KpiCard
          label="Attendance"
          value={`${cls.attendancePct}%`}
          caption="Current term"
          trend={cls.attendanceTrend}
        />
        <KpiCard
          label="Attendance"
          value={String(cls.lateComingCount)}
          caption="Late-coming"
          trend={cls.lateComingTrend}
        />
        <KpiCard
          label="Tier 2-3"
          value={String(cls.studentsNeedingSupport)}
          caption="Students needing support"
          trend={cls.supportTrend}
        />
      </div>

      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="relative">
            <span
              aria-hidden
              className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-black/40"
            >
              <SearchIcon />
            </span>
            <input
              type="search"
              placeholder="Search name"
              className="h-7 w-[180px] rounded-full border border-black/10 bg-white pr-2 pl-7 text-[11px] text-[color:var(--paper-ink)] placeholder:text-black/40 focus-visible:border-[color:var(--cta-blue)] outline-none"
            />
          </div>
          <FilterPopover
            value={filter}
            onChange={onChangeFilter}
            open={filterOpen}
            onOpenChange={onFilterOpenChange}
          />
          {filter.attentionTag ? (
            <button
              type="button"
              onClick={() =>
                onChangeFilter({ ...filter, attentionTag: null })
              }
              className="inline-flex h-7 items-center gap-1.5 rounded-full border border-[color:var(--cta-blue)]/30 bg-[color:var(--cta-blue)]/10 px-2.5 text-[11px] font-medium text-[color:var(--cta-blue)] hover:bg-[color:var(--cta-blue)]/15"
            >
              Saved: {filter.attentionTag}
              <span aria-hidden>✕</span>
            </button>
          ) : null}
          {filter.cca || filter.lateComingMin !== null ? (
            <button
              type="button"
              onClick={() => onChangeFilter(EMPTY_FILTER)}
              className="text-[10px] text-black/55 hover:text-[color:var(--paper-ink)] underline-offset-2 hover:underline"
            >
              Clear filters
            </button>
          ) : null}
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            aria-label="Toggle columns"
            className="inline-flex size-7 items-center justify-center rounded-full border border-black/10 text-black/55 hover:bg-black/[0.03]"
          >
            <ColumnsIcon />
          </button>
          <button
            type="button"
            aria-label="More options"
            className="inline-flex size-7 items-center justify-center rounded-full border border-black/10 text-black/55 hover:bg-black/[0.03]"
          >
            <DotsIcon />
          </button>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-auto rounded-lg border border-black/10 bg-white">
        <table className="w-full border-collapse text-left">
          <thead className="sticky top-0 bg-white">
            <tr className="border-b border-black/10 text-[10px] tracking-wider text-black/55">
              {COLUMN_HEADERS.map((col) => (
                <th
                  key={col.label}
                  scope="col"
                  className={`px-2 py-2 font-medium ${"width" in col ? col.width : ""}`}
                >
                  <span className="inline-flex items-center gap-1">
                    {col.label}
                    {"sortable" in col ? <Caret /> : null}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visibleStudents.length === 0 ? (
              <tr>
                <td
                  colSpan={COLUMN_HEADERS.length}
                  className="px-3 py-6 text-center text-[11px] text-black/45"
                >
                  No students match these filters.
                </td>
              </tr>
            ) : (
              visibleStudents.map((student, idx) => (
                <StudentRow
                  key={student.id}
                  index={idx + 1}
                  student={student}
                  onSelect={onSelectStudent}
                />
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function Caret() {
  return (
    <svg width="9" height="9" viewBox="0 0 12 12" aria-hidden className="text-black/40">
      <path d="M3 4.5l3 3 3-3" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function SearchIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 16 16" aria-hidden>
      <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.4" fill="none" />
      <path d="M10.5 10.5l3 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  )
}

function ColumnsIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 16 16" aria-hidden>
      <rect x="2" y="3" width="3.5" height="10" stroke="currentColor" strokeWidth="1.2" fill="none" />
      <rect x="6.5" y="3" width="3.5" height="10" stroke="currentColor" strokeWidth="1.2" fill="none" />
      <rect x="11" y="3" width="3" height="10" stroke="currentColor" strokeWidth="1.2" fill="none" />
    </svg>
  )
}

function DotsIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 16 16" aria-hidden>
      <circle cx="3.5" cy="8" r="1.2" fill="currentColor" />
      <circle cx="8" cy="8" r="1.2" fill="currentColor" />
      <circle cx="12.5" cy="8" r="1.2" fill="currentColor" />
    </svg>
  )
}
