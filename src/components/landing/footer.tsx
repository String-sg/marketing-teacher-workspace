import { footerCopy } from "@/content/landing"

/**
 * Minimal footer: copyright + trust line + feedback link. The feedback
 * link replaced the prior mailto support address with the canonical
 * go.gov.sg short URL — see CONTENT-07 in the rewrite spec.
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
          href={footerCopy.feedbackUrl}
          rel="noreferrer"
          target="_blank"
        >
          {footerCopy.feedbackLabel}
        </a>
      </div>
    </footer>
  )
}
