import { createFileRoute } from "@tanstack/react-router"

import { SiteFooter } from "@/components/landing/footer"
import { SiteHeader } from "@/components/landing/site-header"
import { ScrollChoreography } from "@/components/landing/scroll-choreography/scroll-choreography"

/**
 * Phase 3 D-12 / VISUAL-03: LCP preload for the product-UI AVIF variant set.
 *
 * Lives only on the `/` route — index-route head, not __root.tsx, so future
 * routes don't pay the cost. Browsers without AVIF support fall through to
 * <picture>'s WebP/PNG sources at render time (this preload is a fast-path
 * for AVIF-capable browsers; the <picture> handles negotiation for the rest).
 *
 * Critical contract (web.dev/preload-responsive-images): the `imageSizes`
 * value MUST byte-match the `sizes` attribute on every <source>/<img> in
 * <ProductScreen>'s <picture> element. If they drift, the browser preloads
 * one variant and renders another (wasted bandwidth + LCP regression).
 *
 * Critical React 19 contract: prop keys MUST be camelCase (imageSrcSet,
 * imageSizes, fetchPriority). React 19 serializes them to lowercase HTML
 * attributes (imagesrcset, imagesizes, fetchpriority) on output. Lowercase
 * props on JSX <link> are silently dropped (no warning in production).
 */
export const Route = createFileRoute("/")({
  component: HomePage,
  head: () => ({
    links: [
      {
        rel: "preload",
        as: "image",
        type: "image/avif",
        imageSrcSet:
          "/hero/profiles-screen-640.avif 640w, /hero/profiles-screen-960.avif 960w, /hero/profiles-screen-1280.avif 1280w, /hero/profiles-screen-1600.avif 1600w",
        imageSizes: "(min-width:1280px) 1280px, 100vw",
        fetchPriority: "high",
      },
    ],
  }),
})

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
