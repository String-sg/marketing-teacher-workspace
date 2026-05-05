/**
 * Reusable time ruler. 0→1 with tick marks; honors the current view zoom.
 * Tick set is fixed; off-screen ticks are filtered out.
 */
import { pToVisual } from "./timeline-math"
import type { TimelineView } from "../dev-flow-context"

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

export function TimeRuler({ view }: { view: TimelineView }) {
  const visible = TICKS.filter(
    (t) => t.p >= view.start - 1e-9 && t.p <= view.end + 1e-9
  )
  return (
    <div>
      <div className="relative mb-0.5 h-3 font-mono text-[9px] text-black/40">
        {visible.map((t) =>
          t.label ? (
            <span
              className="absolute top-0 -translate-x-1/2"
              key={`l-${t.p}`}
              style={{ left: `${pToVisual(t.p, view)}%` }}
            >
              {t.label}
            </span>
          ) : null
        )}
      </div>
      <div className="relative mb-1 h-1.5">
        {visible.map((t) => (
          <span
            aria-hidden
            className={`absolute top-0 w-px ${
              t.label ? "h-1.5 bg-black/30" : "h-1 bg-black/15"
            }`}
            key={`t-${t.p}`}
            style={{ left: `${pToVisual(t.p, view)}%` }}
          />
        ))}
      </div>
    </div>
  )
}
