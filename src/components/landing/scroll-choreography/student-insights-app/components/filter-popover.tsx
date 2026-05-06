import { useState } from "react"

import { CCA_OPTIONS } from "../data"
import { Popover } from "./popover"
import type { AttentionTag } from "../data"

export type FilterState = {
  cca: string | null
  lateComingMin: number | null
  attentionTag: AttentionTag | null
}

export const EMPTY_FILTER: FilterState = {
  cca: null,
  lateComingMin: null,
  attentionTag: null,
}

export function FilterPopover({
  value,
  onChange,
  open,
  onOpenChange,
}: {
  value: FilterState
  onChange: (next: FilterState) => void
  open?: boolean
  onOpenChange?: (open: boolean) => void
}) {
  return (
    <Popover
      align="start"
      panelClassName="w-[420px]"
      role="dialog"
      open={open}
      onOpenChange={onOpenChange}
      trigger={({ isOpen, toggle }) => (
        <button
          type="button"
          aria-expanded={isOpen}
          onClick={toggle}
          className="inline-flex h-7 items-center gap-1.5 rounded-full border border-black/10 px-2.5 text-[11px] font-medium text-[color:var(--paper-ink)] transition-colors hover:bg-black/[0.03] aria-expanded:bg-black/[0.04]"
        >
          <FunnelIcon />
          Filter
          {filterCount(value) > 0 ? (
            <span className="ml-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-[color:var(--cta-blue)] px-1 text-[9px] font-semibold text-white">
              {filterCount(value)}
            </span>
          ) : null}
        </button>
      )}
    >
      {() => (
        <div className="flex flex-col gap-2">
          <div className="text-[10px] font-semibold tracking-wider text-black/55 uppercase">
            Show records
          </div>

          <FilterRow leading="Where" label="CCA" operator="is">
            <CcaSelect
              value={value.cca}
              onChange={(cca) => onChange({ ...value, cca })}
            />
          </FilterRow>

          <FilterRow leading="and" label="Late-coming(%)" operator="greater than">
            <NumberInput
              value={value.lateComingMin}
              onChange={(lateComingMin) =>
                onChange({ ...value, lateComingMin })
              }
            />
          </FilterRow>

          <div className="mt-1 flex items-center justify-between">
            <button
              type="button"
              className="inline-flex h-6 items-center gap-1 rounded-full border border-dashed border-black/15 px-2 text-[10px] font-medium text-black/55 hover:bg-black/[0.03]"
              onClick={() => {
                /* visual-only — kept simple */
              }}
            >
              + Add filter
            </button>
            <button
              type="button"
              className="inline-flex h-6 items-center gap-1 rounded-full px-2 text-[10px] font-medium text-black/55 hover:bg-black/[0.05]"
              onClick={() => onChange(EMPTY_FILTER)}
            >
              ↺ Reset
            </button>
          </div>
        </div>
      )}
    </Popover>
  )
}

function FilterRow({
  leading,
  label,
  operator,
  children,
}: {
  leading: string
  label: string
  operator: string
  children: React.ReactNode
}) {
  return (
    <div className="grid grid-cols-[40px_120px_110px_1fr_auto] items-center gap-2">
      <span className="text-[11px] text-black/55">{leading}</span>
      <span className="inline-flex h-7 items-center justify-between rounded-full border border-black/10 bg-white px-2.5 text-[11px] text-[color:var(--paper-ink)]">
        <span className="truncate">{label}</span>
        <Caret />
      </span>
      <span className="inline-flex h-7 items-center justify-between rounded-full border border-black/10 bg-white px-2.5 text-[11px] text-[color:var(--paper-ink)]">
        <span className="truncate">{operator}</span>
        <Caret />
      </span>
      {children}
      <span className="text-black/35" aria-hidden>
        ✕
      </span>
    </div>
  )
}

function CcaSelect({
  value,
  onChange,
}: {
  value: string | null
  onChange: (next: string | null) => void
}) {
  return (
    <select
      value={value ?? ""}
      onChange={(event) => onChange(event.target.value || null)}
      className="h-7 w-full appearance-none rounded-full border border-black/10 bg-white px-2.5 text-[11px] text-[color:var(--paper-ink)] outline-none focus-visible:border-[color:var(--cta-blue)]"
    >
      <option value="">Select option</option>
      {CCA_OPTIONS.map((cca) => (
        <option key={cca} value={cca}>
          {cca}
        </option>
      ))}
    </select>
  )
}

function NumberInput({
  value,
  onChange,
}: {
  value: number | null
  onChange: (next: number | null) => void
}) {
  const [draft, setDraft] = useState(value === null ? "" : String(value))
  return (
    <input
      type="number"
      min={0}
      max={100}
      placeholder="Enter number"
      value={draft}
      onChange={(event) => {
        const next = event.target.value
        setDraft(next)
        if (next === "") {
          onChange(null)
        } else {
          const parsed = Number(next)
          if (!Number.isNaN(parsed)) onChange(parsed)
        }
      }}
      className="h-7 w-full rounded-full border border-black/10 bg-white px-2.5 text-[11px] text-[color:var(--paper-ink)] outline-none focus-visible:border-[color:var(--cta-blue)] [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
    />
  )
}

function Caret() {
  return (
    <svg width="9" height="9" viewBox="0 0 12 12" aria-hidden className="ml-1.5 text-black/40">
      <path d="M3 4.5l3 3 3-3" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function FunnelIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 12 12" aria-hidden className="text-black/55">
      <path d="M2 2h8l-3 4v3l-2 1V6L2 2z" stroke="currentColor" strokeWidth="1.2" fill="none" strokeLinejoin="round" />
    </svg>
  )
}

function filterCount(value: FilterState) {
  let n = 0
  if (value.cca) n += 1
  if (value.lateComingMin !== null) n += 1
  if (value.attentionTag) n += 1
  return n
}
