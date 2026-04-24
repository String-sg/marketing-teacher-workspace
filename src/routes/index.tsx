import { createFileRoute } from "@tanstack/react-router"

import { CinematicHero } from "@/components/landing/cinematic-hero"
import { FinalCta } from "@/components/landing/final-cta"
import { ProductSection } from "@/components/landing/product-section"
import { ProofStrip } from "@/components/landing/proof-strip"
import { SiteHeader } from "@/components/landing/site-header"

export const Route = createFileRoute("/")({ component: HomePage })

function HomePage() {
  return (
    <>
      <SiteHeader />
      <main>
        <CinematicHero />
        <ProductSection />
        <ProofStrip />
        <FinalCta />
      </main>
    </>
  )
}
