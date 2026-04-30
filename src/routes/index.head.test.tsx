/**
 * Phase 3 Wave-0 fail-loudly stub for VISUAL-03 / D-12 (LCP preload).
 *
 * OQ-04 falsification gate: asserts that routes/index.tsx's createFileRoute
 * `head()` callback emits exactly one <link rel="preload" as="image">
 * for the AVIF variant set, using React 19 camelCase prop keys
 * (imageSrcSet, imageSizes, fetchPriority).
 *
 * Why test the route config object instead of the rendered DOM:
 *   - TanStack Start's head() runs at SSR; testing via render() would
 *     require a full router harness (overkill for a head-config check).
 *   - The Route.options.head() callback is a pure function returning
 *     a plain object — direct introspection is the cheapest assertion.
 *
 * RED state in Wave 0: routes/index.tsx has no head() yet. Plan 04
 * (Wave 1c) lands the head() body. If a developer changes the contract
 * (e.g., reverts to lowercase keys) this test catches the regression.
 *
 * Critical: web.dev says imagesizes on <link> MUST byte-match sizes
 * on <picture>/<source>/<img>. We assert that contract here.
 *
 * Type erasure note: TanStack Start's head signature is
 *   head: (ctx: HeadContext) => Awaitable<HeadContent>
 * Calling it as `head?.()` (0 args) trips strict typecheck, and the
 * `Awaitable<...>` return type hides `.links` behind a Promise union.
 * `getHeadLinks()` casts via a minimal HeadShape type so each test
 * stays readable while typecheck stays green at Wave 0 (when head is
 * undefined) and after Plan 04 lands the head() body (when head returns
 * a synchronous object).
 */
import { describe, expect, it } from "vitest"

import { Route } from "./index"

const EXPECTED_SIZES = "(min-width:1280px) 1280px, 100vw"

type HeadShape = {
  options: {
    head?: (ctx?: unknown) => { links?: Array<Record<string, unknown>> }
  }
}

function getHeadLinks(): Array<Record<string, unknown>> | undefined {
  const route = Route as unknown as HeadShape
  return route.options.head?.()?.links
}

describe("index route head() preload (D-12 / VISUAL-03)", () => {
  it("Route.options.head() is defined and returns a links array", () => {
    const links = getHeadLinks()
    expect(links).toBeDefined()
    expect(Array.isArray(links)).toBe(true)
  })

  it("emits exactly one <link rel='preload' as='image'>", () => {
    const links = getHeadLinks() ?? []
    const preloads = links.filter(
      (l) => l.rel === "preload" && l.as === "image"
    )
    expect(preloads).toHaveLength(1)
  })

  it("uses React 19 camelCase keys (imageSrcSet, imageSizes, fetchPriority)", () => {
    const link = (getHeadLinks() ?? [])[0] ?? {}
    expect(link.imageSrcSet).toEqual(expect.stringContaining(".avif 1280w"))
    expect(link.imageSizes).toBe(EXPECTED_SIZES)
    expect(link.fetchPriority).toBe("high")
    expect(link.type).toBe("image/avif")
  })

  it("imageSizes byte-matches the <picture> sizes contract (web.dev)", () => {
    // Literal repeat (not via EXPECTED_SIZES) — guards against accidental
    // const-only edits silently changing the public contract.
    const link = (getHeadLinks() ?? [])[0] ?? {}
    expect(link.imageSizes).toBe("(min-width:1280px) 1280px, 100vw")
  })

  it("imageSrcSet enumerates all 4 AVIF widths (640/960/1280/1600)", () => {
    const link = (getHeadLinks() ?? [])[0] ?? {}
    const srcset = String(link.imageSrcSet ?? "")
    expect(srcset).toMatch(/profiles-screen-640\.avif 640w/)
    expect(srcset).toMatch(/profiles-screen-960\.avif 960w/)
    expect(srcset).toMatch(/profiles-screen-1280\.avif 1280w/)
    expect(srcset).toMatch(/profiles-screen-1600\.avif 1600w/)
  })
})
