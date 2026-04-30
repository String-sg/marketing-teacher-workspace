import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"

import { SiteFooter } from "./footer"

describe("SiteFooter", () => {
  it("renders a <footer> landmark", () => {
    render(<SiteFooter />)
    expect(screen.getByRole("contentinfo")).not.toBeNull()
  })

  it("renders a feedback link to the go.gov.sg URL", () => {
    render(<SiteFooter />)
    const feedback = screen
      .getAllByRole("link")
      .find((a) => a.getAttribute("href")?.startsWith("https://go.gov.sg/"))
    expect(feedback).not.toBeUndefined()
  })

  it("renders the trust line text", () => {
    render(<SiteFooter />)
    expect(screen.getByText(/Built with teachers/i)).not.toBeNull()
  })
})
