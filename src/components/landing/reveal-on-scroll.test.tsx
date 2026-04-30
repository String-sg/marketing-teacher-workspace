import { describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"

// Per-test mocks of motion/react are configured via vi.hoisted() so each
// test can flip useInView / useReducedMotion independently while keeping
// the rest of the module (motion.div, cubicBezier) intact.
type InViewOptions = {
  once?: boolean
  margin?: string
  amount?: number | string
}
const mocks = vi.hoisted(() => ({
  useInView: vi.fn(
    (_ref: unknown, _options?: InViewOptions): boolean => false
  ),
  useReducedMotion: vi.fn((): boolean => false),
}))

vi.mock("motion/react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("motion/react")>()
  return {
    ...actual,
    useInView: mocks.useInView,
    useReducedMotion: mocks.useReducedMotion,
  }
})

import { RevealOnScroll } from "./reveal-on-scroll"

describe("RevealOnScroll", () => {
  it("renders children at final state under prefers-reduced-motion", () => {
    mocks.useReducedMotion.mockReturnValue(true)
    mocks.useInView.mockReturnValue(false)

    const { container } = render(
      <RevealOnScroll>
        <p>hello</p>
      </RevealOnScroll>
    )

    expect(screen.getByText("hello")).not.toBeNull()

    // The wrapper is the first child of the render container. Under reduced
    // motion the inline style must read opacity 1 with no Y translation.
    const wrapper = container.firstElementChild as HTMLElement
    expect(wrapper).not.toBeNull()
    const style = wrapper.getAttribute("style") ?? ""

    // opacity is 1 (or unset because animate target == initial-skip == final)
    expect(/opacity:\s*0(?!\.)/i.test(style)).toBe(false)
    // No nonzero Y translation lingering on the wrapper
    expect(/translateY\((?!0)/i.test(style)).toBe(false)
    expect(/translate3d\(0px,\s*(?!0px)/i.test(style)).toBe(false)
  })

  it("calls useInView with once: true and the documented margin", () => {
    mocks.useReducedMotion.mockReturnValue(false)
    mocks.useInView.mockReturnValue(false)

    render(
      <RevealOnScroll>
        <p>contract</p>
      </RevealOnScroll>
    )

    expect(mocks.useInView).toHaveBeenCalled()
    const call = mocks.useInView.mock.calls.at(-1)
    expect(call).not.toBeUndefined()
    const options = call?.[1] as InViewOptions | undefined
    expect(options).not.toBeUndefined()
    expect(options?.once).toBe(true)
    expect(options?.margin).toBe("0px 0px -15% 0px")
  })

  it("renders children from mount even before the in-view trigger fires", () => {
    mocks.useReducedMotion.mockReturnValue(false)
    mocks.useInView.mockReturnValue(false)

    render(
      <RevealOnScroll>
        <p data-testid="kid">hi</p>
      </RevealOnScroll>
    )

    expect(screen.getByTestId("kid")).not.toBeNull()
  })
})
