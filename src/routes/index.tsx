import { createFileRoute } from "@tanstack/react-router"

import { SiteFooter } from "@/components/landing/footer"
import { ScrollChoreography } from "@/components/landing/scroll-choreography/scroll-choreography"

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
      <main id="main" className="paper-page">
        <ScrollChoreography />
      </main>
      <SiteFooter />
    </>
  )
}
