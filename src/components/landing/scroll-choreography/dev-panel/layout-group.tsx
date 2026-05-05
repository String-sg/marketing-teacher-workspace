/**
 * Layout group: SVG sketch placement (cards + teacher) inside the
 * aspect-locked hero frame. Sketches are static layout, not animated, so
 * they live below the timeline as a collapsed numeric form rather than
 * as a track.
 */
import { fmtNumber } from "./timeline-math"
import type { ChangeEvent } from "react"

import type { SketchesConfig, SketchesPatch } from "../dev-flow-context"

export function LayoutGroup({
  config,
  onChange,
}: {
  config: SketchesConfig
  onChange: (patch: SketchesPatch) => void
}) {
  return (
    <details className="rounded border border-black/10">
      <summary className="cursor-pointer px-2 py-1 font-medium tracking-wide select-none">
        sketches
        <span className="ml-2 font-mono text-[10px] text-black/45">
          cards {fmtNumber(config.cardsTop)}% · {fmtNumber(config.cardsWidth)}cqi
          · teacher {fmtNumber(config.teacherTop)}% ·{" "}
          {fmtNumber(config.teacherWidth)}cqi
        </span>
      </summary>
      <div className="space-y-2 px-2 pt-1 pb-2">
        <div className="text-[10px] tracking-wider text-black/45 uppercase">
          cards
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          <NumField
            label="top %"
            max={100}
            min={0}
            onChange={(v) => onChange({ cardsTop: v })}
            step={0.5}
            value={config.cardsTop}
          />
          <NumField
            label="w cqi"
            max={100}
            min={0}
            onChange={(v) => onChange({ cardsWidth: v })}
            step={0.5}
            value={config.cardsWidth}
          />
        </div>
        <div className="text-[10px] tracking-wider text-black/45 uppercase">
          teacher
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          <NumField
            label="top %"
            max={100}
            min={0}
            onChange={(v) => onChange({ teacherTop: v })}
            step={0.5}
            value={config.teacherTop}
          />
          <NumField
            label="w cqi"
            max={100}
            min={0}
            onChange={(v) => onChange({ teacherWidth: v })}
            step={0.5}
            value={config.teacherWidth}
          />
        </div>
      </div>
    </details>
  )
}

function NumField({
  label,
  value,
  step,
  min,
  max,
  onChange,
}: {
  label: string
  value: number
  step: number
  min?: number
  max?: number
  onChange: (v: number) => void
}) {
  return (
    <label className="flex items-center gap-1.5">
      <span className="w-12 text-black/60">{label}</span>
      <input
        className="w-full rounded border border-black/15 bg-white px-1.5 py-0.5 font-mono"
        max={max}
        min={min}
        onChange={(e: ChangeEvent<HTMLInputElement>) =>
          onChange(Number(e.target.value))
        }
        step={step}
        type="number"
        value={value}
      />
    </label>
  )
}
