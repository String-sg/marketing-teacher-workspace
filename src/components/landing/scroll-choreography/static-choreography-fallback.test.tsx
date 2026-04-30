import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"

import { StaticChoreographyFallback } from "./static-choreography-fallback"

describe("StaticChoreographyFallback", () => {
  it("renders the hero h1 (single)", () => {
    render(<StaticChoreographyFallback />)
    const h1s = screen.getAllByRole("heading", { level: 1 })
    expect(h1s).toHaveLength(1)
  })

  it("renders the docked-stage h2 alongside proof and final-cta h2s", () => {
    render(<StaticChoreographyFallback />)
    const h2s = screen.getAllByRole("heading", { level: 2 })
    // h2 candidates: docked, proof-strip, final-cta = at least 3
    expect(h2s.length).toBeGreaterThanOrEqual(3)
  })

  it("renders the product screenshot at least once (paper-hero reduced + feature section)", () => {
    render(<StaticChoreographyFallback />)
    const productImages = screen
      .getAllByRole("img")
      .filter((img) =>
        img.getAttribute("src")?.includes("profiles-screen.png")
      )
    expect(productImages.length).toBeGreaterThanOrEqual(1)
  })
})
