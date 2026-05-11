import { AnimatePresence, motion, useReducedMotion } from "motion/react"
import type { MotionValue } from "motion/react"
import { useEffect, useMemo, useState } from "react"

import { EMPTY_FILTER } from "./components/filter-popover"
import { DEFAULT_CLASS_ID, getClassById } from "./data"
import { Sidebar } from "./sidebar"
import { TopBar } from "./top-bar"
import { PlaceholderView } from "./views/placeholder"
import { StudentInsightsView } from "./views/student-insights"
import { StudentProfileView } from "./views/student-profile"
import type { FilterState } from "./components/filter-popover"
import type { AppRoute } from "./types"

const HEADINGS: Record<AppRoute, string> = {
  home: "Home",
  students: "Student Insights",
}

const SAVED_GROUP_STUDENT_ID = "s3-01"

export function StudentInsightsApp({
  activeTab = 0,
  dockedReached = false,
  sidebarWidth,
  sidebarOpacity,
}: {
  activeTab?: 0 | 1 | 2
  dockedReached?: boolean
  sidebarWidth?: MotionValue<number>
  sidebarOpacity?: MotionValue<number>
} = {}) {
  const [route, setRoute] = useState<AppRoute>("students")
  const [classId, setClassId] = useState<string>(DEFAULT_CLASS_ID)
  const [filter, setFilter] = useState<FilterState>(EMPTY_FILTER)
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null)
  const [filterOpen, setFilterOpen] = useState(false)
  const reduce = useReducedMotion()

  useEffect(() => {
    if (activeTab === 0) {
      setRoute("students")
      setSelectedStudentId(null)
      setFilter(EMPTY_FILTER)
      // Hold the popover closed until scroll reaches the docked plateau,
      // so it doesn't render inside the tiny hero/wow laptop preview.
      setFilterOpen(dockedReached)
    } else if (activeTab === 1) {
      setRoute("students")
      setSelectedStudentId(null)
      setFilter({
        ...EMPTY_FILTER,
        attentionTag: "FAS",
        savedLabel: "Students for support",
      })
      setFilterOpen(false)
    } else {
      setRoute("students")
      setSelectedStudentId(SAVED_GROUP_STUDENT_ID)
      setFilterOpen(false)
    }
  }, [activeTab, dockedReached])

  const cls = getClassById(classId)
  const selectedStudent = useMemo(
    () => cls.students.find((s) => s.id === selectedStudentId) ?? null,
    [cls.students, selectedStudentId]
  )

  const heading =
    selectedStudent && route === "students"
      ? selectedStudent.name
      : HEADINGS[route]

  const cycleStudent = (delta: 1 | -1) => {
    if (!selectedStudent) return
    const idx = cls.students.findIndex((s) => s.id === selectedStudent.id)
    const next =
      cls.students[
        (idx + delta + cls.students.length) % cls.students.length
      ]
    setSelectedStudentId(next.id)
  }

  return (
    <div className="pointer-events-none flex h-full min-h-0 bg-[#fafafa] text-[color:var(--paper-ink)]">
      <motion.aside
        className="h-full shrink-0 overflow-hidden"
        style={{ width: sidebarWidth ?? 180, opacity: sidebarOpacity ?? 1 }}
      >
        <div className="h-full w-[180px]">
          <Sidebar
            active={route}
            onChange={(id) => {
              setRoute(id)
              setSelectedStudentId(null)
            }}
          />
        </div>
      </motion.aside>
      <div className="grid min-w-0 flex-1 grid-rows-[auto_1fr]">
        <TopBar heading={heading} />
        <main className="min-h-0 overflow-hidden">
          <AnimatePresence initial={false} mode="wait">
            <motion.div
              key={
                route !== "students"
                  ? `route-${route}`
                  : selectedStudent
                    ? `profile-${selectedStudent.id}`
                    : `insights-${filter.savedLabel ?? filter.attentionTag ?? "all"}`
              }
              className="h-full"
              initial={{ opacity: 0, y: reduce ? 0 : 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: reduce ? 0 : -6 }}
              transition={{
                duration: reduce ? 0 : 0.2,
                ease: [0.215, 0.61, 0.355, 1],
              }}
            >
              {route === "students" ? (
                selectedStudent ? (
                  <StudentProfileView
                    student={selectedStudent}
                    onBack={() => setSelectedStudentId(null)}
                    onPrev={() => cycleStudent(-1)}
                    onNext={() => cycleStudent(1)}
                  />
                ) : (
                  <StudentInsightsView
                    classId={classId}
                    onChangeClass={(id) => {
                      setClassId(id)
                      setFilter(EMPTY_FILTER)
                    }}
                    filter={filter}
                    onChangeFilter={setFilter}
                    onSelectStudent={setSelectedStudentId}
                    filterOpen={filterOpen}
                    onFilterOpenChange={setFilterOpen}
                  />
                )
              ) : (
                <PlaceholderView title={HEADINGS[route]} />
              )}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  )
}
