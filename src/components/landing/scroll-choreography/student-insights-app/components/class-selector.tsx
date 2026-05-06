import { CLASSES } from "../data"
import { Popover } from "./popover"

export function ClassSelector({
  classId,
  onChange,
}: {
  classId: string
  onChange: (id: string) => void
}) {
  const active = CLASSES.find((c) => c.id === classId) ?? CLASSES[0]
  return (
    <Popover
      align="start"
      panelClassName="w-[180px] p-1.5"
      role="listbox"
      trigger={({ isOpen, toggle }) => (
        <button
          type="button"
          aria-expanded={isOpen}
          onClick={toggle}
          className="inline-flex items-center gap-1.5 rounded-md px-1.5 py-0.5 text-xl font-semibold tracking-tight text-[color:var(--paper-ink)] transition-colors hover:bg-black/[0.04] aria-expanded:bg-black/[0.04]"
        >
          {active.label}
          <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden className="text-black/45">
            <path d="M4 6.5l4 4 4-4" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      )}
    >
      {({ close }) => (
        <ul role="listbox">
          {CLASSES.map((cls) => (
            <li key={cls.id}>
              <button
                type="button"
                role="option"
                aria-selected={cls.id === classId}
                className={`flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-[12px] hover:bg-black/[0.04] ${
                  cls.id === classId
                    ? "font-semibold text-[color:var(--paper-ink)]"
                    : "text-[color:var(--paper-ink)]"
                }`}
                onClick={() => {
                  onChange(cls.id)
                  close()
                }}
              >
                <span>{cls.label}</span>
                {cls.id === classId ? (
                  <span aria-hidden className="text-[color:var(--cta-blue)]">
                    ✓
                  </span>
                ) : null}
              </button>
            </li>
          ))}
        </ul>
      )}
    </Popover>
  )
}
