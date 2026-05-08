import { AudienceColumns } from "@/components/landing/audience-columns"
import { FeatureSection } from "@/components/landing/feature-section"
import { FinalCta } from "@/components/landing/final-cta"
import { PaperHero } from "@/components/landing/paper-hero"
import { SchoolsToday } from "@/components/landing/schools-today"
import { SiteHeader } from "@/components/landing/site-header"

// Stacked, normal-scroll fallback rendered by <ScrollChoreography> when
// the viewport is mobile or the user prefers reduced motion. Mirrors the
// content tree the choreography presents inline so static-mode users see
// the same sections in the same order.
export function StaticChoreographyFallback() {
  return (
    <>
      <SiteHeader />
      <PaperHero />
      <FeatureSection stage="docked" />
      <SchoolsToday />
      <AudienceColumns />
      <FinalCta />
    </>
  )
}
