export function TopBar({ heading }: { heading: string }) {
  return (
    <div className="flex items-center justify-between border-b border-black/[0.06] bg-white/95 px-4 py-2 backdrop-blur">
      <span className="text-[12px] font-medium text-[color:var(--paper-ink)]">
        {heading}
      </span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          aria-label="Notifications"
          className="relative grid size-7 place-items-center rounded-full text-black/55 hover:bg-black/[0.04]"
        >
          <BellIcon />
          <span className="absolute top-1 right-1 size-1.5 rounded-full bg-[color:var(--cta-blue)]" />
        </button>
        <button
          type="button"
          className="inline-flex h-7 items-center rounded-full border border-black/15 px-3 text-[11px] font-medium text-[color:var(--paper-ink)] hover:bg-black/[0.03]"
        >
          Sign in
        </button>
      </div>
    </div>
  )
}

function BellIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden>
      <path
        d="M8 2c2.2 0 4 1.8 4 4v2.5l1 1.5H3l1-1.5V6c0-2.2 1.8-4 4-4zM6.5 12.5a1.5 1.5 0 0 0 3 0"
        stroke="currentColor"
        strokeWidth="1.3"
        fill="none"
        strokeLinejoin="round"
      />
    </svg>
  )
}

