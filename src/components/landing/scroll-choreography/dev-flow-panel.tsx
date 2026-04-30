/**
 * Floating dev-mode panel for tuning the choreography flow live.
 *
 * Renders only when wrapped in <DevFlowProvider> (the orchestrator gates
 * by import.meta.env.DEV). Provides:
 *   - A timeline strip with per-stage colored windows + the live
 *     scrollYProgress indicator + a click/drag scrubber.
 *   - A per-target editor (tiny / centered / docked-left / docked-right)
 *     with scale, x, y, opacity inputs that update SCREEN_TARGETS via
 *     <DevFlowProvider>'s React state — useTransform re-derives on each
 *     render so visual changes are immediate.
 *
 * Not exported in production: <ChoreographyTree> only mounts this when
 * import.meta.env.DEV is true. The panel itself is a single fixed-position
 * card with z-index above the choreography (z-[1000]).
 */
import { useMotionValueEvent } from "motion/react"
import { useState } from "react"
import type { ChangeEvent } from "react"

import { useScrollChoreography } from "./context"
import { useFlowControls } from "./dev-flow-context"
import { STAGES } from "./stages"
import type { ScreenTarget, ScreenTargetRect, StageId } from "./types"

const STAGE_COLORS: Record<StageId, string> = {
  hero: "#a3d4ff",
  wow: "#ffd28f",
  "feature-a": "#9be0a8",
  "feature-b": "#e0c1ff",
}

const TARGET_ORDER: readonly ScreenTarget[] = [
  "tiny",
  "centered",
  "docked-left",
  "docked-right",
] as const

function scrubToProgress(progress: number) {
  const section = document.querySelector(
    ".scroll-choreography-only"
  ) as HTMLElement | null
  if (!section) return
  const sectionTopOnPage = window.scrollY + section.getBoundingClientRect().top
  const scrollableSpan = section.offsetHeight - window.innerHeight
  const target = sectionTopOnPage + scrollableSpan * progress
  window.scrollTo({ top: target, behavior: "instant" })
}

export function DevFlowPanel() {
  const controls = useFlowControls()
  const { scrollYProgress } = useScrollChoreography()
  const [progress, setProgress] = useState(() => scrollYProgress.get())
  const [open, setOpen] = useState(true)

  useMotionValueEvent(scrollYProgress, "change", (p) => setProgress(p))

  if (!controls) return null

  return (
    <aside className="fixed right-4 bottom-4 z-[1000] w-[360px] max-h-[80vh] overflow-auto rounded-xl border border-black/15 bg-white/95 text-xs text-black shadow-2xl backdrop-blur">
      <header className="flex items-center justify-between gap-2 border-b border-black/10 px-3 py-2">
        <span className="font-semibold tracking-wide">Flow tuner</span>
        <span className="font-mono text-[10px] text-black/60">
          p={progress.toFixed(3)}
        </span>
        <button
          aria-label={open ? "Collapse" : "Expand"}
          className="ml-auto rounded px-2 py-0.5 text-black/60 hover:bg-black/5 hover:text-black"
          onClick={() => setOpen(!open)}
          type="button"
        >
          {open ? "−" : "+"}
        </button>
      </header>

      {open && (
        <div className="space-y-3 p-3">
          <Timeline progress={progress} />

          <div className="space-y-2">
            {TARGET_ORDER.map((key) => (
              <TargetEditor
                key={key}
                onChange={(patch) => controls.setTarget(key, patch)}
                stageKey={key}
                target={controls.targets[key]}
              />
            ))}
          </div>

          <button
            className="w-full rounded border border-black/10 bg-black/5 py-1 text-black/70 hover:bg-black/10 hover:text-black"
            onClick={controls.resetAll}
            type="button"
          >
            Reset all
          </button>
        </div>
      )}
    </aside>
  )
}

function Timeline({ progress }: { progress: number }) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-[10px] tracking-wider text-black/50 uppercase">
        <span>Timeline</span>
        <span className="font-mono normal-case">
          {STAGES.map((s) => s.id).join(" · ")}
        </span>
      </div>
      <div className="relative h-7 w-full overflow-hidden rounded bg-black/5">
        {STAGES.map((s) => {
          const left = `${s.window[0] * 100}%`
          const width = `${(s.window[1] - s.window[0]) * 100}%`
          return (
            <div
              className="absolute top-0 flex h-full items-center justify-center text-[9px] font-medium text-black/70"
              key={s.id}
              style={{ left, width, backgroundColor: STAGE_COLORS[s.id] }}
              title={`${s.id}: ${s.window[0].toFixed(2)}–${s.window[1].toFixed(2)}`}
            >
              {s.id}
            </div>
          )
        })}
        <div
          aria-hidden
          className="pointer-events-none absolute top-0 h-full w-[2px] bg-black"
          style={{ left: `${progress * 100}%` }}
        />
      </div>
      <input
        aria-label="Scroll progress"
        className="mt-2 w-full"
        max={1}
        min={0}
        onChange={(e) => scrubToProgress(Number(e.target.value))}
        step={0.001}
        type="range"
        value={progress}
      />
    </div>
  )
}

function TargetEditor({
  stageKey,
  target,
  onChange,
}: {
  stageKey: ScreenTarget
  target: ScreenTargetRect
  onChange: (patch: Partial<ScreenTargetRect>) => void
}) {
  return (
    <details className="rounded border border-black/10" open={stageKey === "tiny"}>
      <summary className="cursor-pointer px-2 py-1 font-medium tracking-wide select-none">
        {stageKey}
      </summary>
      <div className="grid grid-cols-2 gap-1.5 px-2 pt-1 pb-2">
        <NumberField
          label="scale"
          onChange={(v) => onChange({ scale: v })}
          step={0.005}
          value={target.scale}
        />
        <NumberField
          label="opacity"
          max={1}
          min={0}
          onChange={(v) => onChange({ opacity: v })}
          step={0.05}
          value={target.opacity}
        />
        <StringField
          label="x"
          onChange={(v) => onChange({ x: v })}
          placeholder="0 / +Nvw"
          value={target.x}
        />
        <StringField
          label="y"
          onChange={(v) => onChange({ y: v })}
          placeholder="0 / +Nvh"
          value={target.y}
        />
      </div>
    </details>
  )
}

function NumberField({
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

function StringField({
  label,
  value,
  placeholder,
  onChange,
}: {
  label: string
  value: string
  placeholder?: string
  onChange: (v: string) => void
}) {
  return (
    <label className="flex items-center gap-1.5">
      <span className="w-12 text-black/60">{label}</span>
      <input
        className="w-full rounded border border-black/15 bg-white px-1.5 py-0.5 font-mono"
        onChange={(e: ChangeEvent<HTMLInputElement>) =>
          onChange(e.target.value)
        }
        placeholder={placeholder}
        type="text"
        value={value}
      />
    </label>
  )
}
