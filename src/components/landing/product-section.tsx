import { FeatureSection } from "./feature-section"

/**
 * Phase 1 transition shim. routes/index.tsx still imports `ProductSection` —
 * Plan 05 of Phase 1 swaps the route to render `<StaticChoreographyFallback />`
 * directly and deletes this shim. Until then, this re-exports the new
 * FeatureSection bound to the feature-a stage so the page renders identically.
 */
export function ProductSection() {
  return <FeatureSection stage="feature-a" />
}
