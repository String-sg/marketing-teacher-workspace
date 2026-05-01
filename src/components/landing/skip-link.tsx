export function SkipLink() {
  return (
    <a
      className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:rounded-full focus:border focus:border-[color:var(--paper-rule)] focus:bg-[color:var(--paper-card)] focus:px-4 focus:py-2 focus:font-heading focus:text-sm focus:text-[color:var(--paper-ink)] focus:shadow-[0_10px_40px_-20px_rgb(15_23_42/0.18)] focus:outline-2 focus:outline-offset-2 focus:outline-primary"
      href="#main"
    >
      Skip to main content
    </a>
  )
}
