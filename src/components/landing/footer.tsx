import { footerCopy } from "@/content/landing"

/**
 * Minimal footer per CONTEXT.md D-05: copyright + trust line + single
 * mailto support link. Privacy and Terms are deferred until real policies
 * exist — fabricating policy stubs adds legal risk for an early-access
 * marketing site. (This is the documented departure from Phase 1 success
 * criterion #5's literal phrasing.)
 */
export function SiteFooter() {
  return (
    <footer className="border-t border-[color:var(--paper-rule)]/55 px-5 py-10 sm:px-8 lg:py-14">
      <div className="mx-auto flex max-w-[110rem] flex-col items-center gap-4 text-sm text-[color:var(--paper-muted)] sm:flex-row sm:justify-between">
        <p>{footerCopy.copyright}</p>
        <p className="font-mono text-xs tracking-[0.18em] uppercase">
          {footerCopy.trustLine}
        </p>
        <a
          className="transition-colors hover:text-primary focus-visible:rounded focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          href={`mailto:${footerCopy.supportEmail}`}
        >
          {footerCopy.supportEmail}
        </a>
      </div>
    </footer>
  )
}
