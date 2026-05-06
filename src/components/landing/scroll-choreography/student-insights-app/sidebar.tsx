import type * as React from "react"

import type { AppRoute } from "./types"

const NAV_ITEMS: Array<{ id: AppRoute; label: string; icon: () => React.ReactElement; badge?: string }> = [
  { id: "home", label: "Home", icon: HomeIcon },
  { id: "students", label: "Student Insights", icon: PeopleIcon },
]

export function Sidebar({
  active,
  onChange,
}: {
  active: AppRoute
  onChange: (id: AppRoute) => void
}) {
  return (
    <aside className="flex h-full flex-col border-r border-black/[0.06] bg-white">
      <div className="flex items-center justify-between gap-2 px-3 py-2.5">
        <span className="text-[13px] font-semibold tracking-tight text-[color:var(--paper-ink)]">
          Teacher Workspace
        </span>
        <button
          type="button"
          aria-label="Collapse sidebar"
          className="grid size-6 place-items-center rounded-md text-black/40 hover:bg-black/[0.04]"
        >
          <SidebarIcon />
        </button>
      </div>

      <nav aria-label="Primary" className="flex flex-1 flex-col gap-3 px-2 pt-1">
        <ul className="flex flex-col gap-0.5">
          {NAV_ITEMS.map((item) => (
            <li key={item.id}>
              <NavButton
                active={item.id === active}
                onClick={() => onChange(item.id)}
                icon={<item.icon />}
                label={item.label}
              />
            </li>
          ))}
        </ul>
      </nav>

      <div className="flex flex-col gap-0.5 border-t border-black/[0.06] px-2 py-2">
        <NavButton
          active={false}
          onClick={() => {}}
          icon={<GearIcon />}
          label="Settings"
        />
        <NavButton
          active={false}
          onClick={() => {}}
          icon={<HelpIcon />}
          label="Help"
        />
      </div>
    </aside>
  )
}

function NavButton({
  active,
  onClick,
  icon,
  label,
  badge,
}: {
  active: boolean
  onClick: () => void
  icon: React.ReactNode
  label: string
  badge?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-[12px] transition-colors ${
        active
          ? "bg-black/[0.05] font-medium text-[color:var(--paper-ink)]"
          : "text-black/70 hover:bg-black/[0.03] hover:text-[color:var(--paper-ink)]"
      }`}
    >
      <span className="grid size-4 place-items-center text-current">{icon}</span>
      <span className="flex-1 truncate">{label}</span>
      {badge ? (
        <span
          className={`rounded-md px-1.5 py-0.5 text-[9px] font-medium tracking-wide ${
            badge.toLowerCase().includes("experiment")
              ? "bg-violet-50 text-violet-600"
              : "bg-black/[0.04] text-black/55"
          }`}
        >
          {badge}
        </span>
      ) : null}
    </button>
  )
}

function HomeIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden>
      <path
        d="M2.5 7.5L8 3l5.5 4.5V13a1 1 0 0 1-1 1h-9a1 1 0 0 1-1-1V7.5z"
        stroke="currentColor"
        strokeWidth="1.3"
        fill="none"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function PeopleIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden>
      <circle cx="6" cy="6" r="2.2" stroke="currentColor" strokeWidth="1.3" fill="none" />
      <circle cx="11" cy="6.5" r="1.7" stroke="currentColor" strokeWidth="1.3" fill="none" />
      <path
        d="M2 13c.5-2 2-3 4-3s3.5 1 4 3M10 13c.4-1.5 1.4-2.3 3-2.3s2.6.8 3 2.3"
        stroke="currentColor"
        strokeWidth="1.3"
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  )
}

function GearIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden>
      <circle cx="8" cy="8" r="2.2" stroke="currentColor" strokeWidth="1.3" fill="none" />
      <path
        d="M8 1.5v2M8 12.5v2M14.5 8h-2M3.5 8h-2M12.6 3.4l-1.4 1.4M4.8 11.2l-1.4 1.4M12.6 12.6l-1.4-1.4M4.8 4.8L3.4 3.4"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
    </svg>
  )
}

function HelpIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden>
      <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.3" fill="none" />
      <path
        d="M6.5 6.3c0-.9.7-1.6 1.6-1.6s1.6.7 1.6 1.5c0 .9-1 1.2-1.5 1.6-.5.3-.7.7-.7 1.1"
        stroke="currentColor"
        strokeWidth="1.3"
        fill="none"
        strokeLinecap="round"
      />
      <circle cx="8" cy="11.5" r="0.8" fill="currentColor" />
    </svg>
  )
}

function SidebarIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" aria-hidden>
      <rect x="2" y="3" width="12" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.3" fill="none" />
      <path d="M6 3v10" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  )
}
