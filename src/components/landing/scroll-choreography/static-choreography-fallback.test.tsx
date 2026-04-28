import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"

import { StaticChoreographyFallback } from "./static-choreography-fallback"

describe("StaticChoreographyFallback", () => {
  it("renders the hero h1 (single)", () => {
    render(<StaticChoreographyFallback />)
    const h1s = screen.getAllByRole("heading", { level: 1 })
    expect(h1s).toHaveLength(1)
  })

  it("renders the two feature-section h2s (feature-a + feature-b)", () => {
    render(<StaticChoreographyFallback />)
    const h2s = screen.getAllByRole("heading", { level: 2 })
    // h2 candidates: feature-a, feature-b, proof-strip, final-cta = at least 4
    expect(h2s.length).toBeGreaterThanOrEqual(4)
  })

  it("renders the product screenshot at least twice (paper-hero reduced + feature sections)", () => {
    render(<StaticChoreographyFallback />)
    const productImages = screen
      .getAllByRole("img")
      .filter((img) =>
        img.getAttribute("src")?.includes("profiles-screen.png")
      )
    expect(productImages.length).toBeGreaterThanOrEqual(2)
  })
})
