import { createFileRoute } from "@tanstack/react-router"

import { SiteFooter } from "@/components/landing/footer"
import { SiteHeader } from "@/components/landing/site-header"
import { ScrollChoreography } from "@/components/landing/scroll-choreography/scroll-choreography"

export const Route = createFileRoute("/")({ component: HomePage })

function HomePage() {
  return (
    <>
      <SiteHeader />
      <main id="main" className="paper-page">
        <ScrollChoreography />
      </main>
      <SiteFooter />
    </>
  )
}
