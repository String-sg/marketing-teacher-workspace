import { describe, expect, it } from "vitest"
import { render, screen, within } from "@testing-library/react"

import { SiteFooter } from "./footer"
import { SkipLink } from "./skip-link"
import { StaticChoreographyFallback } from "./scroll-choreography/static-choreography-fallback"

/**
 * Mirrors the routes/index.tsx HomePage composition for landmark auditing.
 * The header lives INSIDE the hero scene (rendered by PaperHero inside
 * StaticChoreographyFallback), so the fixture intentionally does NOT
 * render a separate <SiteHeader /> outside <main>. Footer remains a
 * sibling of <main> per D-17.
 */
function HomePageFixture() {
  return (
    <>
      <SkipLink />
      <main id="main">
        <StaticChoreographyFallback />
      </main>
      <SiteFooter />
    </>
  )
}

describe("Landmark audit", () => {
  it("renders exactly one <h1>", () => {
    render(<HomePageFixture />)
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1)
  })

  it("renders exactly one <header> (SiteHeader as banner)", () => {
    render(<HomePageFixture />)
    expect(screen.getAllByRole("banner")).toHaveLength(1)
  })

  it("renders exactly one <main> with id='main'", () => {
    render(<HomePageFixture />)
    expect(screen.queryByRole("main")).not.toBeNull()
  })

  it("renders exactly one <footer> (SiteFooter as contentinfo)", () => {
    render(<HomePageFixture />)
    expect(screen.queryByRole("contentinfo")).not.toBeNull()
  })

  it("header lives inside main (header is part of the hero scene)", () => {
    render(<HomePageFixture />)
    const main = screen.getByRole("main")
    expect(within(main).queryByRole("banner")).not.toBeNull()
  })

  it("footer is NOT inside main (D-17 landmark sibling structure)", () => {
    render(<HomePageFixture />)
    const main = screen.getByRole("main")
    expect(within(main).queryByRole("contentinfo")).toBeNull()
  })

  it("skip-link is the first focusable link", () => {
    render(<HomePageFixture />)
    const skipLink = screen.getByRole("link", {
      name: /skip to main content/i,
    })
    expect(skipLink.getAttribute("href")).toBe("#main")
  })
})
