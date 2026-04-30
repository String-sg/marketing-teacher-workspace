/**
 * Floating dev-mode panel for tuning the choreography flow live.
 *
 * Renders only when wrapped in <DevFlowProvider> (the orchestrator gates
 * by import.meta.env.DEV). Provides:
 *   - A timeline strip with per-stage colored windows + the live
 *     scrollYProgress indicator + a click/drag scrubber.
 *   - A per-stage editor (hero / wow / docked) combining window inputs
 *     with the rect fields (scale / x / y / opacity) that update the
 *     STAGES override via <DevFlowProvider>'s React state — useTransform
 *     re-derives on each render so visual changes are immediate.
 *
 * Not exported in production: <ChoreographyTree> only mounts this when
 * import.meta.env.DEV is true. The panel itself is a single fixed-position
 * card with z-index above the choreography (z-[1000]).
 */
import { useMotionValueEvent } from "motion/react"
import { useRef, useState } from "react"
import type {
  ChangeEvent,
  KeyboardEvent as ReactKeyboardEvent,
  PointerEvent as ReactPointerEvent,
} from "react"

import { useScrollChoreography } from "./context"
import { useFlowControls } from "./dev-flow-context"
import type { FlowWindow, StageRectPatch } from "./dev-flow-context"
import { STAGES } from "./stages"
import type { StageDef, StageId } from "./types"

const STAGE_COLORS: Record<StageId, string> = {
  hero: "#a3d4ff",
  wow: "#ffd28f",
  docked: "#9be0a8",
}

const STAGE_ORDER: readonly StageId[] = STAGES.map((s) => s.id)

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

/** Strip trailing-zero noise from JS number→string round-trips so copied
 *  config reads cleanly (0.062 instead of 0.06200000000000001). */
function fmtNumber(n: number): string {
  return Number(n.toFixed(6)).toString()
}

const clamp01 = (v: number) => Math.max(0, Math.min(1, v))

/** Snap a [0,1] progress value to a grid. Default 0.01; shift = 0.001 (10× finer);
 *  alt = no snap (raw). Used both for pointer drag and keyboard nudge. */
function quantize(p: number, shift: boolean, alt: boolean): number {
  if (alt) return p
  const step = shift ? 0.001 : 0.01
  return Math.round(p / step) * step
}

/** Minimum band width — keeps a stage from collapsing to zero on edge drag. */
const MIN_WIDTH = 0.005

type Tick = { readonly p: number; readonly label?: string }

const TICKS: ReadonlyArray<Tick> = [
  { p: 0, label: "0" },
  { p: 0.1 },
  { p: 0.2 },
  { p: 0.25, label: "0.25" },
  { p: 0.3 },
  { p: 0.4 },
  { p: 0.5, label: "0.5" },
  { p: 0.6 },
  { p: 0.7 },
  { p: 0.75, label: "0.75" },
  { p: 0.8 },
  { p: 0.9 },
  { p: 1, label: "1" },
]

type DragHint = { id: StageId; lo: number; hi: number }

function serializeFlow(stages: readonly StageDef[]): string {
  const lines = [
    "export const STAGES = [",
    ...stages.map((s) => {
      return [
        "  {",
        `    id: "${s.id}",`,
        `    window: [${fmtNumber(s.window[0])}, ${fmtNumber(s.window[1])}] as const,`,
        `    scale: ${fmtNumber(s.scale)},`,
        `    x: "${s.x}",`,
        `    y: "${s.y}",`,
        `    opacity: ${fmtNumber(s.opacity)},`,
        "  },",
      ].join("\n")
    }),
    "] as const satisfies readonly StageDef[]",
  ]
  return lines.join("\n")
}

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    const ta = document.createElement("textarea")
    ta.value = text
    ta.style.position = "fixed"
    ta.style.opacity = "0"
    document.body.appendChild(ta)
    ta.select()
    const ok = document.execCommand("copy")
    ta.remove()
    return ok
  }
}

export function DevFlowPanel() {
  const controls = useFlowControls()
  const { scrollYProgress } = useScrollChoreography()
  const [progress, setProgress] = useState(() => scrollYProgress.get())
  const [open, setOpen] = useState(true)
  const [copyState, setCopyState] = useState<"idle" | "copied" | "failed">(
    "idle"
  )
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useMotionValueEvent(scrollYProgress, "change", (p) => setProgress(p))

  if (!controls) return null

  const configText = serializeFlow(controls.stages)

  const handleCopy = async () => {
    const ok = await copyText(configText)
    setCopyState(ok ? "copied" : "failed")
    if (copyTimerRef.current) clearTimeout(copyTimerRef.current)
    copyTimerRef.current = setTimeout(() => setCopyState("idle"), 1500)
  }

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
          <Timeline
            progress={progress}
            stages={controls.stages}
            setStage={controls.setStage}
          />

          <div className="space-y-2">
            {controls.stages.map((stage) => (
              <StageEditor
                key={stage.id}
                onChange={(patch) => controls.setStage(stage.id, patch)}
                stage={stage}
              />
            ))}
          </div>

          <div className="flex gap-2">
            <button
              className="flex-1 rounded border border-black/10 bg-black/5 py-1 text-black/70 hover:bg-black/10 hover:text-black"
              onClick={handleCopy}
              type="button"
            >
              {copyState === "copied"
                ? "Copied!"
                : copyState === "failed"
                  ? "Copy failed"
                  : "Copy config"}
            </button>
            <button
              className="flex-1 rounded border border-black/10 bg-black/5 py-1 text-black/70 hover:bg-black/10 hover:text-black"
              onClick={controls.resetAll}
              type="button"
            >
              Reset all
            </button>
          </div>

          <details className="rounded border border-black/10">
            <summary className="cursor-pointer px-2 py-1 font-medium tracking-wide select-none">
              Config preview
            </summary>
            <textarea
              className="h-40 w-full resize-none rounded-b border-t border-black/10 bg-black/[0.02] p-2 font-mono text-[10px] leading-relaxed"
              onClick={(e) => e.currentTarget.select()}
              readOnly
              value={configText}
            />
          </details>
        </div>
      )}
    </aside>
  )
}

type DragMode = "move" | "left" | "right"

function Timeline({
  progress,
  stages,
  setStage,
}: {
  progress: number
  stages: readonly StageDef[]
  setStage: (id: StageId, patch: StageRectPatch) => void
}) {
  const trackRef = useRef<HTMLDivElement>(null)
  const [dragHint, setDragHint] = useState<DragHint | null>(null)

  const stageById = (id: StageId) => stages.find((s) => s.id === id)!

  const applyEdgeMin = (next: FlowWindow): FlowWindow => {
    const lo = clamp01(next[0])
    const hi = clamp01(next[1])
    if (hi - lo >= MIN_WIDTH) return [lo, hi]
    if (lo + MIN_WIDTH <= 1) return [lo, lo + MIN_WIDTH]
    return [hi - MIN_WIDTH, hi]
  }

  const beginDrag = (
    e: ReactPointerEvent<HTMLElement>,
    id: StageId,
    mode: DragMode
  ) => {
    e.preventDefault()
    e.stopPropagation()
    const track = trackRef.current
    if (!track) return
    const rect = track.getBoundingClientRect()
    const startWindow = stageById(id).window
    const rawStart = clamp01((e.clientX - rect.left) / rect.width)

    const onMove = (ev: PointerEvent) => {
      const raw = clamp01((ev.clientX - rect.left) / rect.width)
      const p = quantize(raw, ev.shiftKey, ev.altKey)
      let next: FlowWindow
      if (mode === "left") {
        next = applyEdgeMin([p, startWindow[1]])
      } else if (mode === "right") {
        next = applyEdgeMin([startWindow[0], p])
      } else {
        const delta =
          quantize(raw, ev.shiftKey, ev.altKey) -
          quantize(rawStart, ev.shiftKey, ev.altKey)
        const width = startWindow[1] - startWindow[0]
        const lo = clamp01(startWindow[0] + delta)
        const loClamped = Math.min(lo, 1 - width)
        next = [Math.max(0, loClamped), Math.max(0, loClamped) + width]
      }
      setStage(id, { window: next })
      setDragHint({ id, lo: next[0], hi: next[1] })
    }
    const onUp = () => {
      setDragHint(null)
      window.removeEventListener("pointermove", onMove)
      window.removeEventListener("pointerup", onUp)
      window.removeEventListener("pointercancel", onUp)
    }
    setDragHint({ id, lo: startWindow[0], hi: startWindow[1] })
    window.addEventListener("pointermove", onMove)
    window.addEventListener("pointerup", onUp)
    window.addEventListener("pointercancel", onUp)
  }

  const onTrackPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.target !== e.currentTarget) return
    const track = trackRef.current
    if (!track) return
    const rect = track.getBoundingClientRect()
    const p = clamp01((e.clientX - rect.left) / rect.width)
    scrubToProgress(p)
  }

  const onBandKeyDown = (
    e: ReactKeyboardEvent<HTMLDivElement>,
    id: StageId
  ) => {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return
    e.preventDefault()
    const sign = e.key === "ArrowRight" ? 1 : -1
    const step = (e.shiftKey ? 0.001 : 0.01) * sign
    const w = stageById(id).window
    let next: FlowWindow
    if (e.altKey) {
      next = applyEdgeMin([w[0] + step, w[1]])
    } else {
      const width = w[1] - w[0]
      const lo = clamp01(w[0] + step)
      const loClamped = Math.min(lo, 1 - width)
      next = [Math.max(0, loClamped), Math.max(0, loClamped) + width]
    }
    setStage(id, { window: next })
  }

  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-[10px] tracking-wider text-black/50 uppercase">
        <span>Timeline</span>
        <span className="font-mono normal-case">
          drag · ⇧ fine · ⌥ raw · ⇥ then ←/→
        </span>
      </div>

      <div className="relative mb-0.5 h-3 font-mono text-[9px] text-black/40">
        {TICKS.map((t) =>
          t.label ? (
            <span
              className="absolute top-0 -translate-x-1/2"
              key={`l-${t.p}`}
              style={{ left: `${t.p * 100}%` }}
            >
              {t.label}
            </span>
          ) : null
        )}
      </div>
      <div className="relative mb-1 h-1.5">
        {TICKS.map((t) => (
          <span
            aria-hidden
            className={`absolute top-0 w-px ${
              t.label ? "h-1.5 bg-black/30" : "h-1 bg-black/15"
            }`}
            key={`t-${t.p}`}
            style={{ left: `${t.p * 100}%` }}
          />
        ))}
      </div>

      <div
        className="relative h-8 w-full overflow-visible rounded bg-black/5"
        onPointerDown={onTrackPointerDown}
        ref={trackRef}
      >
        {STAGE_ORDER.map((id) => {
          const w = stageById(id).window
          const left = `${w[0] * 100}%`
          const width = `${(w[1] - w[0]) * 100}%`
          return (
            <div
              className="group absolute top-0 flex h-full cursor-grab items-center justify-center rounded text-[9px] font-medium text-black/70 outline-none ring-offset-1 focus-visible:ring-2 focus-visible:ring-black/60 active:cursor-grabbing"
              key={id}
              onKeyDown={(e) => onBandKeyDown(e, id)}
              onPointerDown={(e) => beginDrag(e, id, "move")}
              role="slider"
              aria-label={`${id} stage window`}
              aria-valuemin={0}
              aria-valuemax={1}
              aria-valuenow={w[0]}
              tabIndex={0}
              style={{ left, width, backgroundColor: STAGE_COLORS[id] }}
              title={`${id}: ${w[0].toFixed(3)}–${w[1].toFixed(3)} (${(w[1] - w[0]).toFixed(3)})`}
            >
              <span className="pointer-events-none truncate px-1">{id}</span>
              <span
                aria-hidden
                className="absolute top-0 -left-1 z-10 flex h-full w-2 cursor-ew-resize items-center justify-center"
                onPointerDown={(e) => beginDrag(e, id, "left")}
              >
                <span className="block h-full w-0.5 rounded-sm bg-black/40 group-hover:bg-black/70" />
              </span>
              <span
                aria-hidden
                className="absolute top-0 -right-1 z-10 flex h-full w-2 cursor-ew-resize items-center justify-center"
                onPointerDown={(e) => beginDrag(e, id, "right")}
              >
                <span className="block h-full w-0.5 rounded-sm bg-black/40 group-hover:bg-black/70" />
              </span>
            </div>
          )
        })}

        {dragHint ? (
          <div
            className="pointer-events-none absolute -top-7 z-20 rounded bg-black/85 px-1.5 py-0.5 font-mono text-[10px] whitespace-nowrap text-white"
            style={{
              left: `${((dragHint.lo + dragHint.hi) / 2) * 100}%`,
              transform: "translateX(-50%)",
            }}
          >
            {fmtNumber(dragHint.lo)} → {fmtNumber(dragHint.hi)} (
            {fmtNumber(dragHint.hi - dragHint.lo)})
          </div>
        ) : null}

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

      <div className="mt-2 space-y-1 text-[10px]">
        {STAGE_ORDER.map((id) => {
          const w = stageById(id).window
          const width = w[1] - w[0]
          return (
            <div
              className="flex items-center gap-1.5"
              key={id}
              style={{ color: "rgba(0,0,0,0.7)" }}
            >
              <span
                aria-hidden
                className="inline-block size-2 rounded-sm"
                style={{ backgroundColor: STAGE_COLORS[id] }}
              />
              <span className="w-16 truncate">{id}</span>
              <input
                className="w-16 rounded border border-black/15 bg-white px-1 py-0.5 font-mono text-[10px] tabular-nums"
                max={1}
                min={0}
                onChange={(e) =>
                  setStage(id, { window: [Number(e.target.value), w[1]] })
                }
                step={0.001}
                type="number"
                value={fmtNumber(w[0])}
              />
              <span className="text-black/40">→</span>
              <input
                className="w-16 rounded border border-black/15 bg-white px-1 py-0.5 font-mono text-[10px] tabular-nums"
                max={1}
                min={0}
                onChange={(e) =>
                  setStage(id, { window: [w[0], Number(e.target.value)] })
                }
                step={0.001}
                type="number"
                value={fmtNumber(w[1])}
              />
              <span className="ml-auto font-mono text-[10px] tabular-nums text-black/40">
                {fmtNumber(width)}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function StageEditor({
  stage,
  onChange,
}: {
  stage: StageDef
  onChange: (patch: StageRectPatch) => void
}) {
  return (
    <details className="rounded border border-black/10" open={stage.id === "hero"}>
      <summary className="cursor-pointer px-2 py-1 font-medium tracking-wide select-none">
        {stage.id}
      </summary>
      <div className="grid grid-cols-2 gap-1.5 px-2 pt-1 pb-2">
        <NumberField
          label="scale"
          onChange={(v) => onChange({ scale: v })}
          step={0.001}
          value={stage.scale}
        />
        <NumberField
          label="opacity"
          max={1}
          min={0}
          onChange={(v) => onChange({ opacity: v })}
          step={0.05}
          value={stage.opacity}
        />
        <StringField
          label="x"
          onChange={(v) => onChange({ x: v })}
          placeholder="0 / +Nvw"
          value={stage.x}
        />
        <StringField
          label="y"
          onChange={(v) => onChange({ y: v })}
          placeholder="0 / +Nvh"
          value={stage.y}
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
