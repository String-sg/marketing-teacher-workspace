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
      <RevealOnScroll delay={120}>
        <p>hello</p>
      </RevealOnScroll>
    )

    expect(screen.getByText("hello")).not.toBeNull()

    // Confirm the reduced-motion branch was actually taken. Without this the
    // negative-only style assertions below would trivially pass even if the
    // branch were deleted (an empty inline `style` matches no nonzero values).
    expect(mocks.useReducedMotion).toHaveBeenCalled()

    // Wrapper is the first child. Assert opacity is "" (motion did not write
    // it because target == initial-skip == final) or explicitly "1" — both
    // observable proofs that we are *not* sitting at opacity 0.
    const wrapper = container.firstElementChild as HTMLElement
    expect(wrapper).not.toBeNull()
    expect(wrapper.style.opacity === "" || wrapper.style.opacity === "1").toBe(
      true
    )
    // No Y translation lingering on the wrapper (positive observable).
    expect(wrapper.style.transform).not.toMatch(/translate(3d|Y)\(/)
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
