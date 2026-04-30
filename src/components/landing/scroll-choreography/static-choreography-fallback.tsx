import { AudienceColumns } from "@/components/landing/audience-columns"
import { FeatureSection } from "@/components/landing/feature-section"
import { FinalCta } from "@/components/landing/final-cta"
import { PaperHero } from "@/components/landing/paper-hero"
import { SchoolsToday } from "@/components/landing/schools-today"

/**
 * Renders the choreography stages as a stacked, normal-scroll layout
 * (per CONTEXT.md D-01/D-02). Used by:
 *
 *   - Phase 1: directly in `routes/index.tsx` as the entire homepage body.
 *   - Phase 5 cutover: by `<ScrollChoreography>` when `mode === "static"`
 *     (mobile or `prefers-reduced-motion: reduce`).
 *
 * The docked stage's copy lives in stages.docked (Student Insights) and
 * renders here as a normal FeatureSection so static-mode users see the
 * same content tree the choreography presents inline.
 */
export function StaticChoreographyFallback() {
  return (
    <>
      <PaperHero />
      <FeatureSection stage="docked" />
      <SchoolsToday />
      <AudienceColumns />
      <FinalCta />
    </>
  )
}
