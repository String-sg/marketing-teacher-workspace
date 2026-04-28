import { describe, expect, it } from "vitest"
import { renderHook } from "@testing-library/react"

import { useIsDesktop } from "./use-is-desktop"

describe("useIsDesktop", () => {
  it("returns the optimistic-desktop default (true) on first render", () => {
    // Per RESEARCH.md § SSR Contract: SSR + first-client-render returns true
    // so server and client agree, no hydration warning.
    const { result } = renderHook(() => useIsDesktop())
    expect(result.current).toBe(true)
  })
})
