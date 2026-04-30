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
import { useRef, useState } from "react"
import type { ChangeEvent, PointerEvent as ReactPointerEvent } from "react"

import { useScrollChoreography } from "./context"
import { useFlowControls } from "./dev-flow-context"
import type {
  FlowStageWindows,
  FlowTargets,
  FlowWindow,
} from "./dev-flow-context"
import type { ScreenTarget, ScreenTargetRect, StageId } from "./types"

const STAGE_COLORS: Record<StageId, string> = {
  hero: "#a3d4ff",
  wow: "#ffd28f",
  "feature-a": "#9be0a8",
  "feature-b": "#e0c1ff",
}

const STAGE_ORDER: readonly StageId[] = [
  "hero",
  "wow",
  "feature-a",
  "feature-b",
] as const

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

/** Strip trailing-zero noise from JS number→string round-trips so copied
 *  config reads cleanly (0.062 instead of 0.06200000000000001). */
function fmtNumber(n: number): string {
  return Number(n.toFixed(6)).toString()
}

function serializeFlow(
  targets: FlowTargets,
  windows: FlowStageWindows
): string {
  const stageScreenMap: Record<StageId, ScreenTarget> = {
    hero: "tiny",
    wow: "centered",
    "feature-a": "docked-left",
    "feature-b": "docked-right",
  }
  const stagesBlock = [
    "export const STAGES = [",
    ...STAGE_ORDER.map((id) => {
      const w = windows[id]
      const screen = stageScreenMap[id]
      return `  { id: "${id}", window: [${fmtNumber(w[0])}, ${fmtNumber(w[1])}] as const, screen: "${screen}" },`
    }),
    "] as const satisfies readonly StageDef[]",
  ]
  const targetsBlock = [
    "export const SCREEN_TARGETS: Record<ScreenTarget, ScreenTargetRect> = {",
    ...TARGET_ORDER.map((key) => {
      const t = targets[key]
      const k = key.includes("-") ? `"${key}"` : key
      return `  ${k}: { scale: ${fmtNumber(t.scale)}, x: "${t.x}", y: "${t.y}", opacity: ${fmtNumber(t.opacity)} },`
    }),
    "} as const",
  ]
  return [...stagesBlock, "", ...targetsBlock].join("\n")
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

  const configText = serializeFlow(controls.targets, controls.stageWindows)

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
            stageWindows={controls.stageWindows}
            setStageWindow={controls.setStageWindow}
          />

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
  stageWindows,
  setStageWindow,
}: {
  progress: number
  stageWindows: FlowStageWindows
  setStageWindow: (id: StageId, window: FlowWindow) => void
}) {
  const trackRef = useRef<HTMLDivElement>(null)

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
    const startWindow = stageWindows[id]
    const startProgress = (e.clientX - rect.left) / rect.width

    const onMove = (ev: PointerEvent) => {
      const p = Math.min(
        Math.max((ev.clientX - rect.left) / rect.width, 0),
        1
      )
      const delta = p - startProgress
      if (mode === "left") {
        setStageWindow(id, [p, startWindow[1]])
      } else if (mode === "right") {
        setStageWindow(id, [startWindow[0], p])
      } else {
        // Keep the window inside [0, 1] without changing its width.
        const width = startWindow[1] - startWindow[0]
        const lo = startWindow[0] + delta
        const loClamped = Math.max(0, Math.min(lo, 1 - width))
        setStageWindow(id, [loClamped, loClamped + width])
      }
    }
    const onUp = () => {
      window.removeEventListener("pointermove", onMove)
      window.removeEventListener("pointerup", onUp)
      window.removeEventListener("pointercancel", onUp)
    }
    window.addEventListener("pointermove", onMove)
    window.addEventListener("pointerup", onUp)
    window.addEventListener("pointercancel", onUp)
  }

  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-[10px] tracking-wider text-black/50 uppercase">
        <span>Timeline</span>
        <span className="font-mono normal-case">drag bands · drag edges</span>
      </div>
      <div
        className="relative h-8 w-full overflow-visible rounded bg-black/5"
        ref={trackRef}
      >
        {STAGE_ORDER.map((id) => {
          const w = stageWindows[id]
          const left = `${w[0] * 100}%`
          const width = `${(w[1] - w[0]) * 100}%`
          return (
            <div
              className="group absolute top-0 flex h-full cursor-grab items-center justify-center rounded text-[9px] font-medium text-black/70 active:cursor-grabbing"
              key={id}
              onPointerDown={(e) => beginDrag(e, id, "move")}
              style={{ left, width, backgroundColor: STAGE_COLORS[id] }}
              title={`${id}: ${w[0].toFixed(3)}–${w[1].toFixed(3)} (${(w[1] - w[0]).toFixed(3)})`}
            >
              <span className="pointer-events-none truncate px-1">{id}</span>
              <span
                aria-hidden
                className="absolute top-0 -left-1 h-full w-2 cursor-ew-resize rounded-l bg-black/0 group-hover:bg-black/20"
                onPointerDown={(e) => beginDrag(e, id, "left")}
              />
              <span
                aria-hidden
                className="absolute top-0 -right-1 h-full w-2 cursor-ew-resize rounded-r bg-black/0 group-hover:bg-black/20"
                onPointerDown={(e) => beginDrag(e, id, "right")}
              />
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
      <div className="mt-2 grid grid-cols-2 gap-x-2 gap-y-1 text-[10px]">
        {STAGE_ORDER.map((id) => {
          const w = stageWindows[id]
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
              <span className="w-14 truncate">{id}</span>
              <input
                className="w-12 rounded border border-black/15 bg-white px-1 py-0.5 font-mono text-[10px]"
                max={1}
                min={0}
                onChange={(e) =>
                  setStageWindow(id, [Number(e.target.value), w[1]])
                }
                step={0.005}
                type="number"
                value={fmtNumber(w[0])}
              />
              <span className="text-black/40">→</span>
              <input
                className="w-12 rounded border border-black/15 bg-white px-1 py-0.5 font-mono text-[10px]"
                max={1}
                min={0}
                onChange={(e) =>
                  setStageWindow(id, [w[0], Number(e.target.value)])
                }
                step={0.005}
                type="number"
                value={fmtNumber(w[1])}
              />
            </div>
          )
        })}
      </div>
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
