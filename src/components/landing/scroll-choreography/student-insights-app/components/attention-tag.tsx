import type { AttentionTag as AttentionTagId } from "../data"

const STYLE_BY_TAG: Record<AttentionTagId, string> = {
  FAS: "bg-rose-50 text-rose-600",
  SwAN: "bg-amber-50 text-amber-700",
  LSM: "bg-sky-50 text-sky-700",
  LSP: "bg-violet-50 text-violet-700",
  TCI: "bg-emerald-50 text-emerald-700",
}

export function AttentionTag({ tag }: { tag: AttentionTagId }) {
  return (
    <span
      className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-medium ${STYLE_BY_TAG[tag]}`}
    >
      {tag}
    </span>
  )
}
