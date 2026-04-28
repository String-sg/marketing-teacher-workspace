import { createFileRoute } from "@tanstack/react-router"

import { SiteFooter } from "@/components/landing/footer"
import { SiteHeader } from "@/components/landing/site-header"
import { StaticChoreographyFallback } from "@/components/landing/scroll-choreography/static-choreography-fallback"

export const Route = createFileRoute("/")({ component: HomePage })

function HomePage() {
  return (
    <>
      <SiteHeader />
      <main id="main" className="paper-page">
        <StaticChoreographyFallback />
      </main>
      <SiteFooter />
    </>
  )
}
