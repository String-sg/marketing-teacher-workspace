import { createFileRoute } from "@tanstack/react-router"

import { FinalCta } from "@/components/landing/final-cta"
import { PaperHero } from "@/components/landing/paper-hero"
import { ProductSection } from "@/components/landing/product-section"
import { ProofStrip } from "@/components/landing/proof-strip"
import { SiteHeader } from "@/components/landing/site-header"

export const Route = createFileRoute("/")({ component: HomePage })

function HomePage() {
  return (
    <>
      <SiteHeader />
      <main>
        <PaperHero />
        <ProductSection />
        <ProofStrip />
        <FinalCta />
      </main>
    </>
  )
}
