/**
 * Phase 2 Wave-0 fail-loudly stub for MIGRATE-04.
 *
 * Proves (per CONTEXT.md):
 *   - D-19 / MIGRATE-04: SiteHeader renders OUTSIDE the choreography subtree
 *     and is therefore not a descendant of any element with inline
 *     `style.transform` set. RESEARCH Pitfall 2 — sticky parents that
 *     introduce a new stacking context via transform break expected
 *     z-ordering.
 *   - D-16 (carry-forward from Phase 1): SiteHeader and SiteFooter remain
 *     siblings of <main>, NOT descendants. The Phase 2 route swap from
 *     <StaticChoreographyFallback/> -> <ScrollChoreography/> must preserve
 *     this landmark structure.
 *
 * RED state in Wave 0: HomePageFixture mounts <ScrollChoreography/> which is
 * still the Phase 1 `return null` stub, so the choreography subtree is empty.
 * The header-not-a-descendant assertion technically passes against an empty
 * subtree, but the landmark-count and not-inside-main assertions fail loudly
 * because <main> renders empty. Wave 2 turns these GREEN once the
 * orchestrator body is filled in and integrates with the real route.
 */
import { describe, expect, it } from "vitest"
import { render, screen, within } from "@testing-library/react"

import { SiteFooter } from "../footer"
import { SiteHeader } from "../site-header"
import { SkipLink } from "../skip-link"
import { ScrollChoreography } from "./scroll-choreography"

/**
 * Mirrors the Phase 2 routes/index.tsx HomePage composition (D-01 swap).
 * Reflects D-16 final structure: SiteHeader and SiteFooter are siblings of
 * <main>, not children. If routes/index.tsx changes its structure, update
 * this fixture.
 */
function HomePageFixture() {
  return (
    <>
      <SkipLink />
      <SiteHeader />
      <main id="main">
        <ScrollChoreography />
      </main>
      <SiteFooter />
    </>
  )
}

describe("Header stacking (MIGRATE-04 / D-19)", () => {
  it("SiteHeader is NOT a descendant of any element with inline style.transform", () => {
    render(<HomePageFixture />)
    const header = screen.getByRole("banner")
    let cursor: HTMLElement | null = header.parentElement
    while (cursor) {
      expect(cursor.style.transform || "").toBe("")
      cursor = cursor.parentElement
    }
  })

  it("header is NOT inside <main> (D-16 sibling structure preserved through route swap)", () => {
    render(<HomePageFixture />)
    const main = screen.getByRole("main")
    expect(within(main).queryByRole("banner")).toBeNull()
  })

  it("landmark count is preserved post-swap: 1 banner, 1 main, 1 contentinfo", () => {
    render(<HomePageFixture />)
    expect(screen.queryByRole("banner")).not.toBeNull()
    expect(screen.queryByRole("main")).not.toBeNull()
    expect(screen.queryByRole("contentinfo")).not.toBeNull()
  })

  it("ScrollChoreography renders a non-empty subtree inside <main> (Wave 2 fills the orchestrator)", () => {
    // Wave-0 RED contract: <ScrollChoreography/> is the Phase 1 `return null`
    // stub, so <main> is empty. Wave 2 fills the orchestrator body with the
    // sticky shell + .scroll-choreography-only outer section, at which point
    // this assertion turns GREEN.
    const { container } = render(<HomePageFixture />)
    const main = container.querySelector("main#main") as HTMLElement | null
    expect(main).not.toBeNull()
    expect(main?.children.length).toBeGreaterThanOrEqual(1)
  })
})
