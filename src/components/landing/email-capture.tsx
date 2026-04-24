import { ArrowRightIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { heroCopy } from "@/content/landing"

export function EmailCapture() {
  return (
    <form
      className="mx-auto flex w-full max-w-xl flex-col items-stretch gap-2 rounded-[1.6rem] border border-white/25 bg-white/20 p-2 shadow-2xl shadow-black/20 backdrop-blur-md sm:flex-row sm:items-center sm:rounded-full"
      onSubmit={(event) => event.preventDefault()}
    >
      <Input
        aria-label="Work email"
        className="h-12 flex-1 border-transparent bg-transparent px-5 text-white placeholder:text-white/68 focus-visible:border-white/35 focus-visible:ring-white/35"
        placeholder={heroCopy.emailPlaceholder}
        type="email"
      />
      <Button
        className="h-12 rounded-full bg-primary px-5 text-primary-foreground shadow-lg shadow-black/20 hover:bg-primary/90"
        type="submit"
      >
        {heroCopy.cta}
        <ArrowRightIcon data-icon="inline-end" />
      </Button>
    </form>
  )
}
