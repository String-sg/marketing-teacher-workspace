/**
 * Header placement contract — header now lives INSIDE the hero scene.
 *
 * The earlier contract (banner outside <main>, banner outside any
 * transform parent) was a stacking-context guardrail for a persistent
 * site-wide nav. The current design intentionally pulls the header into
 * the paper-card so it scales/fades with the hero. The two stacking
 * concerns no longer apply because the header is part of the one-shot
 * hero scene rather than a persistent overlay.
 *
 * What still matters and is asserted here:
 *   - The page exposes exactly 1 banner, 1 main, 1 contentinfo landmark.
 *   - The banner sits inside <main> as part of the hero composition.
 *   - The choreography subtree mounts (non-empty <main>).
 */
import { describe, expect, it } from "vitest"
import { render, screen, within } from "@testing-library/react"

import { SiteFooter } from "../footer"
import { SkipLink } from "../skip-link"
import { ScrollChoreography } from "./scroll-choreography"

function HomePageFixture() {
  return (
    <>
      <SkipLink />
      <main id="main">
        <ScrollChoreography />
      </main>
      <SiteFooter />
    </>
  )
}

describe("Header placement (header is part of the hero scene)", () => {
  it("banner renders inside <main> as part of the hero composition", () => {
    render(<HomePageFixture />)
    const main = screen.getByRole("main")
    expect(within(main).queryByRole("banner")).not.toBeNull()
  })

  it("landmark count is exactly 1 banner / 1 main / 1 contentinfo", () => {
    render(<HomePageFixture />)
    expect(screen.getAllByRole("banner")).toHaveLength(1)
    expect(screen.getAllByRole("main")).toHaveLength(1)
    expect(screen.getAllByRole("contentinfo")).toHaveLength(1)
  })

  it("ScrollChoreography renders a non-empty subtree inside <main>", () => {
    const { container } = render(<HomePageFixture />)
    const main = container.querySelector("main#main") as HTMLElement | null
    expect(main).not.toBeNull()
    expect(main?.children.length).toBeGreaterThanOrEqual(1)
  })
})
