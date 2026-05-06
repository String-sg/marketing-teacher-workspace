export function PlaceholderView({ title }: { title: string }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-2 px-6 text-center">
      <div className="grid size-10 place-items-center rounded-full bg-black/[0.04] text-black/40">
        <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
          <rect
            x="4"
            y="4"
            width="16"
            height="16"
            rx="3"
            stroke="currentColor"
            strokeWidth="1.5"
            fill="none"
          />
          <path
            d="M8 12h8M8 8h6M8 16h4"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      </div>
      <h2 className="text-[14px] font-semibold tracking-tight text-[color:var(--paper-ink)]">
        {title}
      </h2>
      <p className="max-w-[260px] text-[11px] text-black/55">
        This area is part of the live app — switch back to{" "}
        <em className="not-italic font-medium text-[color:var(--paper-ink)]">
          Student Insights
        </em>{" "}
        to keep exploring.
      </p>
    </div>
  )
}
