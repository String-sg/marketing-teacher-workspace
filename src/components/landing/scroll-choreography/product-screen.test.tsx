/**
 * Unit tests for <ProductScreen>.
 *
 * Covers:
 *   - CHOREO-01 mount stability: single motion.div, never unmounts, no
 *     shared-element layout-id attribute
 *   - 3-stage stitched morph (hero/wow/docked all emit visible state)
 *   - CHOREO-06 / D-10: visual props flow direct from useTransform into style
 *   - VISUAL-03 / D-10 / D-11: <picture> renders 3 image-format sources
 *   - A11Y-05 / D-13: alt text is the spec-verbatim string
 *
 * Note on jsdom: <picture> source negotiation does not happen in jsdom (no
 * AVIF capability detection), but the element tree is parsed. Tests assert
 * structural presence (element exists, srcSet attribute set, sizes attribute
 * set), not the variant a real browser would pick.
 */
import { describe, expect, it } from "vitest"
import { render } from "@testing-library/react"
import { motionValue } from "motion/react"

import { ScrollChoreographyContext } from "./context"
import { ProductScreen } from "./product-screen"
import { STAGES } from "./stages"
import type { ScrollChoreographyContextValue } from "./types"

const D_13_ALT_TEXT =
  "Teacher Workspace student view showing attendance, behavior notes, and family messages"

const FALLBACK_IMG_SRC = "/hero/profiles-screen-1280.png"

function renderWithMockProgress(progress = 0) {
  const mv = motionValue(progress)
  const value: ScrollChoreographyContextValue = {
    scrollYProgress: mv,
    paperCardScale: motionValue(1),
    stages: STAGES,
    reducedMotion: false,
    mode: "choreography",
  }
  const utils = render(
    <ScrollChoreographyContext.Provider value={value}>
      <ProductScreen />
    </ScrollChoreographyContext.Provider>
  )
  return { ...utils, scrollYProgress: mv }
}

// The fallback <img> sits inside a <picture>, which sits inside the inner
// motion.div (the one carrying `style={{ scale }}`). Walk two parents up
// from the img to reach the inner morph node.
function innerMorphFromImg(img: Element | null): HTMLElement | null {
  return img?.parentElement?.parentElement ?? null
}

describe("ProductScreen mount stability (CHOREO-01)", () => {
  it("the morphing element instance is the same node across scroll updates spanning all 3 stages", () => {
    const { scrollYProgress, container } = renderWithMockProgress(0)
    const initialNode = innerMorphFromImg(
      container.querySelector(`img[src='${FALLBACK_IMG_SRC}']`)
    )
    expect(initialNode).not.toBeNull()

    // Probe one progress value inside each stage's hold + one mid-morph
    for (const p of [0.05, 0.35, 0.6, 0.8]) {
      scrollYProgress.set(p)
    }

    const currentNode = innerMorphFromImg(
      container.querySelector(`img[src='${FALLBACK_IMG_SRC}']`)
    )
    expect(currentNode).toBe(initialNode)
  })

  it("contains no layoutId attribute on any rendered element", () => {
    const { container } = renderWithMockProgress(0)
    expect(container.querySelector("[layoutid]")).toBeNull()
    expect(container.querySelector("[data-layoutid]")).toBeNull()
    expect(container.innerHTML).not.toContain("layoutId=")
  })
})

describe("ProductScreen motion-value shape (CHOREO-06 / D-10)", () => {
  it("renders inline styles carrying motion-value-driven opacity, x (outer) and scale (inner)", () => {
    // Probe at progress=0.6 — inside the wow→docked morph zone
    // ([wow.window[1]=0.55, docked.window[0]=0.65]) where scale
    // interpolates 1.0→0.5 and x interpolates 0→+28vw, so both axes
    // are guaranteed to emit non-identity transform values into the
    // inline style attribute.
    const { container } = renderWithMockProgress(0.6)
    const innerMorph = innerMorphFromImg(
      container.querySelector(`img[src='${FALLBACK_IMG_SRC}']`)
    )
    expect(innerMorph).not.toBeNull()

    const innerStyle = innerMorph?.getAttribute("style") ?? ""
    expect(innerStyle).toMatch(/transform|scale/)

    const outerWrap = innerMorph?.parentElement as HTMLElement | null
    const outerStyle = outerWrap?.getAttribute("style") ?? ""
    expect(`${innerStyle} ${outerStyle}`).toMatch(/opacity/)
  })
})

describe("ProductScreen <picture> element (VISUAL-03 / D-10 / D-11)", () => {
  it("renders a <picture> element with avif and webp <source> tags + a fallback <img>", () => {
    const { container } = renderWithMockProgress(0)
    const picture = container.querySelector("picture")
    expect(picture).not.toBeNull()

    const sources = picture?.querySelectorAll("source") ?? []
    expect(sources.length).toBe(2)

    const types = Array.from(sources).map((s) => s.getAttribute("type"))
    expect(types).toContain("image/avif")
    expect(types).toContain("image/webp")

    const img = picture?.querySelector("img")
    expect(img).not.toBeNull()
    expect(img?.getAttribute("src")).toBe(FALLBACK_IMG_SRC)
  })

  it("each <source> and the fallback <img> carries the spec sizes attribute", () => {
    const { container } = renderWithMockProgress(0)
    const expected = "(min-width:1280px) 1280px, 100vw"
    const elements = [
      ...Array.from(container.querySelectorAll("picture > source")),
      container.querySelector("picture > img"),
    ].filter(Boolean) as Array<Element>
    expect(elements.length).toBe(3)
    for (const el of elements) {
      expect(el.getAttribute("sizes")).toBe(expected)
    }
  })

  it("each <source> srcset enumerates all 4 widths (640/960/1280/1600)", () => {
    const { container } = renderWithMockProgress(0)
    const sources = container.querySelectorAll("picture > source")
    for (const source of sources) {
      const srcset = source.getAttribute("srcset") ?? ""
      expect(srcset).toMatch(/640w/)
      expect(srcset).toMatch(/960w/)
      expect(srcset).toMatch(/1280w/)
      expect(srcset).toMatch(/1600w/)
    }
  })
})

describe("ProductScreen alt text (A11Y-05 / D-13)", () => {
  it("the fallback <img> carries the spec-verbatim alt text", () => {
    const { container } = renderWithMockProgress(0)
    const img = container.querySelector(`img[src='${FALLBACK_IMG_SRC}']`)
    expect(img).not.toBeNull()
    expect(img?.getAttribute("alt")).toBe(D_13_ALT_TEXT)
  })

  it("alt text is identical across all 3 stage hold positions (mount-stable)", () => {
    const { scrollYProgress, container } = renderWithMockProgress(0.05)
    for (const p of [0.05, 0.35, 0.8]) {
      scrollYProgress.set(p)
      const img = container.querySelector(`img[src='${FALLBACK_IMG_SRC}']`)
      expect(img?.getAttribute("alt")).toBe(D_13_ALT_TEXT)
    }
  })
})

describe("ProductScreen browser-frame chrome (D-18 / VISUAL-02)", () => {
  it("renders the three Mac traffic-light dots (red/yellow/green)", () => {
    const { container } = renderWithMockProgress(0)
    const dots = container.querySelectorAll("span.size-3.rounded-full")
    expect(dots.length).toBeGreaterThanOrEqual(3)
  })

  it("renders the truncated TEACHER_WORKSPACE_APP_URL in the chrome", () => {
    const { container } = renderWithMockProgress(0)
    // The URL bar removes the leading https:// (D-18); we just assert that
    // *some* hostname-like text is present in a truncated slot.
    const urlSlot = container.querySelector("span.truncate")
    expect(urlSlot).not.toBeNull()
    expect(urlSlot?.textContent).toBeTruthy()
  })
})
