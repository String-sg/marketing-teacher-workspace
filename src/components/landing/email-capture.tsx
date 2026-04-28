import { ArrowRightIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { finalCtaCopy } from "@/content/landing"

export function EmailCapture() {
  return (
    <form
      className="paper-card mx-auto flex w-full max-w-xl flex-col items-stretch gap-2 rounded-[20px] border border-black/8 bg-white p-2 shadow-[0_10px_40px_-20px_rgb(15_23_42/0.18)] sm:flex-row sm:items-center sm:rounded-full"
      onSubmit={(event) => event.preventDefault()}
    >
      <Input
        aria-label="School email"
        className="h-12 flex-1 border-transparent bg-transparent px-5 text-[color:var(--paper-ink)] placeholder:text-[color:var(--paper-muted)] focus-visible:border-primary focus-visible:ring-3 focus-visible:ring-primary/40"
        placeholder={finalCtaCopy.emailPlaceholder}
        type="email"
      />
      <Button
        className="h-12 rounded-full bg-primary px-6 text-base text-primary-foreground hover:bg-primary/90"
        type="submit"
      >
        {finalCtaCopy.cta}
        <ArrowRightIcon data-icon="inline-end" />
      </Button>
    </form>
  )
}
