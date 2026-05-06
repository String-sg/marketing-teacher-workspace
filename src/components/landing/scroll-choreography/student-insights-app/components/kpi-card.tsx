import type { Trend } from "../data"

const TREND_COPY: Record<Trend, { label: string; className: string; arrow: string }> = {
  improving: {
    label: "Improving",
    className: "text-emerald-600",
    arrow: "↗",
  },
  declining: {
    label: "Declining",
    className: "text-rose-600",
    arrow: "↘",
  },
  stable: {
    label: "Stable",
    className: "text-black/55",
    arrow: "—",
  },
}

export function KpiCard({
  label,
  value,
  caption,
  trend,
}: {
  label: string
  value: string
  caption: string
  trend: Trend
}) {
  const t = TREND_COPY[trend]
  return (
    <div className="flex flex-col rounded-xl border border-black/10 bg-white px-3 py-2.5">
      <div className="flex items-center justify-between">
        <span className="text-[9px] font-semibold tracking-wider text-black/55 uppercase">
          {label}
        </span>
        <span className={`text-[10px] font-medium ${t.className}`}>
          <span aria-hidden>{t.arrow}</span> {t.label}
        </span>
      </div>
      <div className="mt-0.5 text-2xl leading-none font-semibold tracking-tight text-[color:var(--paper-ink)]">
        {value}
      </div>
      <div className="mt-1 text-[10px] text-black/55">{caption}</div>
    </div>
  )
}
