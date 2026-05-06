import { useMemo, useState } from "react"

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
  posts: "Posts",
  reports: "Reports",
}

export function StudentInsightsApp() {
  const [route, setRoute] = useState<AppRoute>("students")
  const [classId, setClassId] = useState<string>(DEFAULT_CLASS_ID)
  const [filter, setFilter] = useState<FilterState>(EMPTY_FILTER)
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null)

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
    <div className="grid h-full grid-cols-[180px_1fr] bg-[#fafafa] text-[color:var(--paper-ink)]">
      <Sidebar
        active={route}
        onChange={(id) => {
          setRoute(id)
          setSelectedStudentId(null)
        }}
      />
      <div className="grid min-h-0 grid-rows-[auto_1fr]">
        <TopBar heading={heading} />
        <main className="min-h-0 overflow-hidden">
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
              />
            )
          ) : (
            <PlaceholderView title={HEADINGS[route]} />
          )}
        </main>
      </div>
    </div>
  )
}
