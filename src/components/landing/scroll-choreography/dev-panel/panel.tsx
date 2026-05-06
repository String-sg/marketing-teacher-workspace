/**
 * Visual timeline animation editor for the scroll choreography. Each
 * animated property gets its own horizontal track; each stage's value
 * appears as a draggable segment bar across that track. Vertical drag
 * edits the value, horizontal drag edits the stage's window. The engine
 * (product-screen.tsx, paper-backdrop.tsx) is unchanged — this panel
 * only writes through the existing DevFlowProvider context.
 *
 * Mounted only inside <DevFlowProvider>, which itself is only mounted
 * when import.meta.env.DEV is true.
 */
import { useMotionValueEvent } from "motion/react"
import { useEffect, useRef, useState } from "react"

import { useScrollChoreography } from "../context"
import { useFlowControls } from "../dev-flow-context"
import { KeyframeInspector } from "./keyframe-inspector"
import { LayoutGroup } from "./layout-group"
import { LayerScaleLane, OpacityLane } from "./paper-group"
import { PanelHeader } from "./panel-header"
import { PROPERTY_ADAPTERS } from "./property-adapters"
import { PropertyTrack } from "./property-track"
import { SelectionProvider, useSelection } from "./selection-context"
import { copyText, serializeFlow } from "./serialize"
import { StageTrack } from "./stage-track"
import { TimeRuler } from "./time-ruler"

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

  const configText = serializeFlow(
    controls.stages,
    controls.paperCard,
    controls.sketches
  )

  const handleCopy = async () => {
    const ok = await copyText(configText)
    setCopyState(ok ? "copied" : "failed")
    if (copyTimerRef.current) clearTimeout(copyTimerRef.current)
    copyTimerRef.current = setTimeout(() => setCopyState("idle"), 1500)
  }

  return (
    <SelectionProvider>
      <PanelShell
        open={open}
        onToggleOpen={() => setOpen(!open)}
        progress={progress}
        controls={controls}
        configText={configText}
        copyState={copyState}
        onCopy={handleCopy}
      />
    </SelectionProvider>
  )
}

function PanelShell({
  open,
  onToggleOpen,
  progress,
  controls,
  configText,
  copyState,
  onCopy,
}: {
  open: boolean
  onToggleOpen: () => void
  progress: number
  controls: NonNullable<ReturnType<typeof useFlowControls>>
  configText: string
  copyState: "idle" | "copied" | "failed"
  onCopy: () => void
}) {
  const { setSelection } = useSelection()
  const heroHoldEnd = controls.stages[0]?.window[1] ?? 0.12

  // Esc anywhere clears selection
  useEffect(() => {
    const onKey = (ev: KeyboardEvent) => {
      if (ev.key === "Escape") setSelection(null)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [setSelection])

  return (
    <aside className="fixed right-4 bottom-4 z-[1000] flex max-h-[85vh] w-[520px] flex-col overflow-hidden rounded-xl border border-black/15 bg-white/95 text-xs text-black shadow-2xl backdrop-blur">
      <PanelHeader
        progress={progress}
        open={open}
        onToggleOpen={onToggleOpen}
        view={controls.view}
        setView={controls.setView}
        scrollHeightVh={controls.scrollHeightVh}
        setScrollHeightVh={controls.setScrollHeightVh}
        stages={controls.stages}
        paper={controls.paperCard}
      />

      {open && (
        <div className="flex min-h-0 flex-1 flex-col overflow-auto">
          <div className="space-y-2 p-3">
            <TimeRuler view={controls.view} />
            <StageTrack
              stages={controls.stages}
              setStage={controls.setStage}
              view={controls.view}
              progress={progress}
            />

            {/* Unified timeline — per-stage property lanes + paper-card layer
                lanes share the same time axis and visual rhythm. */}
            <div className="space-y-1 rounded border border-black/10 bg-white/30 p-2">
              {PROPERTY_ADAPTERS.map((adapter) => (
                <PropertyTrack
                  key={adapter.key}
                  adapter={adapter}
                  stages={controls.stages}
                  view={controls.view}
                  setStage={controls.setStage}
                  progress={progress}
                />
              ))}
              <div className="h-px bg-black/5" />
              {(["bg", "cards", "teacher"] as const).map((layer) => (
                <LayerScaleLane
                  key={layer}
                  layer={layer}
                  paper={controls.paperCard}
                  setPaperCard={controls.setPaperCard}
                  heroHoldEnd={heroHoldEnd}
                  view={controls.view}
                  progress={progress}
                />
              ))}
              <OpacityLane
                paper={controls.paperCard}
                setPaperCard={controls.setPaperCard}
                view={controls.view}
                progress={progress}
              />
            </div>

            <input
              aria-label="Scroll progress"
              className="w-full"
              max={1}
              min={0}
              onChange={(e) => scrubToProgress(Number(e.target.value))}
              step={0.001}
              type="range"
              value={progress}
            />

            <LayoutGroup
              config={controls.sketches}
              onChange={controls.setSketches}
            />

            <div className="flex gap-2">
              <button
                className="flex-1 rounded border border-black/10 bg-black/5 py-1 text-black/70 hover:bg-black/10 hover:text-black"
                onClick={onCopy}
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
          <KeyframeInspector
            stages={controls.stages}
            setStage={controls.setStage}
          />
        </div>
      )}
    </aside>
  )
}

function scrubToProgress(progress: number) {
  const section = document.querySelector<HTMLElement>(
    ".scroll-choreography-only"
  )
  if (!section) return
  const sectionTopOnPage = window.scrollY + section.getBoundingClientRect().top
  const scrollableSpan = section.offsetHeight - window.innerHeight
  const target = sectionTopOnPage + scrollableSpan * progress
  window.scrollTo({ top: target, behavior: "instant" })
}
