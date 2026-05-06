import { AttentionTag } from "./attention-tag"
import type { Student } from "../data"

export function StudentRow({
  index,
  student,
  onSelect,
}: {
  index: number
  student: Student
  onSelect: (id: string) => void
}) {
  return (
    <tr
      className="cursor-pointer border-b border-black/5 transition-colors hover:bg-black/[0.02]"
      onClick={() => onSelect(student.id)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault()
          onSelect(student.id)
        }
      }}
      tabIndex={0}
      role="button"
      aria-label={`Open ${student.name} profile`}
    >
      <td className="px-2 py-2 text-[11px] text-black/55">{index}</td>
      <td className="px-2 py-2 text-[12px] font-medium text-[color:var(--paper-ink)]">
        <span className="inline-flex items-center gap-1">
          {student.name}
          <span aria-hidden className="text-black/35">
            ⊟
          </span>
        </span>
      </td>
      <td className="px-2 py-2 text-[12px] text-[color:var(--paper-ink)]">
        {student.classCode}
      </td>
      <td className="px-2 py-2 text-[12px] text-[color:var(--paper-ink)]">
        {student.cca}
      </td>
      <td className="px-2 py-2">
        {student.attentionTags.length === 0 ? (
          <span className="text-[12px] text-black/40">—</span>
        ) : (
          <span className="inline-flex flex-wrap gap-1">
            {student.attentionTags.map((tag) => (
              <AttentionTag key={tag} tag={tag} />
            ))}
          </span>
        )}
      </td>
      <td className="px-2 py-2 text-[12px] text-[color:var(--paper-ink)]">
        {student.attendancePct}%
      </td>
      <td className="px-2 py-2 text-[12px] text-[color:var(--paper-ink)]">
        {student.lateComingPct}
      </td>
      <td className="px-2 py-2 text-[12px] text-[color:var(--paper-ink)]">
        {student.nonVrAbsencesPct}
      </td>
    </tr>
  )
}
