import { FeatureSection } from "@/components/landing/feature-section"
import { FinalCta } from "@/components/landing/final-cta"
import { PaperHero } from "@/components/landing/paper-hero"
import { ProofStrip } from "@/components/landing/proof-strip"

/**
 * Renders the four choreography stages as a stacked, normal-scroll layout
 * (per CONTEXT.md D-01/D-02). Used by:
 *
 *   - Phase 1: directly in `routes/index.tsx` as the entire homepage body.
 *   - Phase 5 cutover: by `<ScrollChoreography>` when `mode === "static"`
 *     (mobile or `prefers-reduced-motion: reduce`).
 *
 * Same content tree, two consumers — Phase 5's only edit is swapping the
 * route's mount point, not restructuring the static path.
 *
 * Wow stage gap (per RESEARCH.md § Wow stage gap analysis): the Wow stage
 * has no dedicated section because the product screenshot it would carry
 * appears 3× in this tree already (PaperHero reduced branch + the two
 * FeatureSection instances). Phase 4 may add a `<WowCaptionStatic>` if a
 * caption is authored.
 */
export function StaticChoreographyFallback() {
  return (
    <>
      <PaperHero />
      <FeatureSection stage="feature-a" />
      <FeatureSection stage="feature-b" />
      <ProofStrip />
      <FinalCta />
    </>
  )
}
