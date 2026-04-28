import { describe, expect, it, vi } from "vitest"
import { renderHook, waitFor } from "@testing-library/react"

import { useIsDesktop } from "./use-is-desktop"

describe("useIsDesktop", () => {
  it("returns the optimistic-desktop default (true) on first render", () => {
    // Per RESEARCH.md § SSR Contract: SSR + first-client-render returns true
    // so server and client agree, no hydration warning. The vitest.setup.ts
    // shim returns matches: true so the post-hydration value also stays true.
    const { result } = renderHook(() => useIsDesktop())
    expect(result.current).toBe(true)
  })

  it("returns false after the effect when matchMedia reports mobile", async () => {
    // Override the global desktop-true shim for this test only. Verifies the
    // post-hydration branch: once useHydrated() flips to true the effect runs
    // matchMedia(DESKTOP_MQ), and a non-matching media query flips state to
    // false. This is the branch the original test could not exercise.
    const original = window.matchMedia
    const mq = {
      matches: false,
      media: "(min-width: 1024px)",
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(() => false),
    }
    window.matchMedia = vi.fn().mockReturnValue(
      mq
    ) as unknown as typeof window.matchMedia
    try {
      const { result } = renderHook(() => useIsDesktop())
      await waitFor(() => expect(result.current).toBe(false))
    } finally {
      window.matchMedia = original
    }
  })

  it("subscribes on mount and unsubscribes on unmount", async () => {
    // Verifies the listener lifecycle: addEventListener is called once with
    // "change" + a handler on mount, and the same handler is passed to
    // removeEventListener on unmount. Without this, a Phase 2 refactor that
    // accidentally drops the cleanup would leak listeners across navigations.
    const original = window.matchMedia
    const addEventListener = vi.fn()
    const removeEventListener = vi.fn()
    window.matchMedia = vi.fn().mockReturnValue({
      matches: true,
      media: "(min-width: 1024px)",
      onchange: null,
      addEventListener,
      removeEventListener,
      dispatchEvent: vi.fn(() => false),
    }) as unknown as typeof window.matchMedia
    try {
      const { unmount } = renderHook(() => useIsDesktop())
      await waitFor(() => expect(addEventListener).toHaveBeenCalledTimes(1))
      const [event, handler] = addEventListener.mock.calls[0]!
      expect(event).toBe("change")
      unmount()
      expect(removeEventListener).toHaveBeenCalledTimes(1)
      expect(removeEventListener.mock.calls[0]![0]).toBe("change")
      expect(removeEventListener.mock.calls[0]![1]).toBe(handler)
    } finally {
      window.matchMedia = original
    }
  })
})
