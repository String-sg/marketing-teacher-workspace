import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"

import { SkipLink } from "./skip-link"

describe("SkipLink", () => {
  it("renders an <a href='#main'> element", () => {
    render(<SkipLink />)
    const link = screen.getByRole("link", { name: /skip to main content/i })
    expect(link.getAttribute("href")).toBe("#main")
  })

  it("is sr-only by default (visually hidden until focus)", () => {
    render(<SkipLink />)
    const link = screen.getByRole("link", { name: /skip to main content/i })
    expect(link.className).toMatch(/\bsr-only\b/)
  })
})
