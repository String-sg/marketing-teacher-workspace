import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"

import { SiteFooter } from "./footer"

describe("SiteFooter", () => {
  it("renders a <footer> landmark", () => {
    render(<SiteFooter />)
    expect(screen.getByRole("contentinfo")).not.toBeNull()
  })

  it("renders a mailto support link", () => {
    render(<SiteFooter />)
    const mailto = screen
      .getAllByRole("link")
      .find((a) => a.getAttribute("href")?.startsWith("mailto:"))
    expect(mailto).not.toBeUndefined()
  })

  it("renders the trust line text", () => {
    render(<SiteFooter />)
    expect(screen.getByText(/Built with teachers/i)).not.toBeNull()
  })
})
