import { useEffect, useState } from "react"
import { useHydrated } from "@tanstack/react-router"

const DESKTOP_MQ = "(min-width: 1024px)"

/**
 * Optimistic-desktop SSR hook.
 *
 * Mechanism:
 * - `useHydrated()` from @tanstack/react-router is implemented as
 *   `useSyncExternalStore(subscribe, () => true, () => false)`. Its server
 *   snapshot is `false`, its client snapshot is `true`. During hydration React
 *   uses the server snapshot first to keep markup in sync, then transitions
 *   the value to `true`.
 * - During SSR and the hydrating first client render `useHydrated()` is
 *   therefore `false`; the outer ternary short-circuits to the literal `true`
 *   so server and client render the same desktop layout (no "did not match"
 *   warning).
 * - Once `useHydrated()` flips to `true`, the `useState` value (driven by the
 *   effect's `matchMedia(DESKTOP_MQ)` read + change subscription) becomes
 *   authoritative.
 *
 * Pairs with the `.scroll-choreography-only { display: none }` CSS backstop
 * Plan 05 lands in styles.css so mobile users never see a one-frame flash
 * of the desktop choreography subtree.
 *
 * Verified via Context7 /websites/tanstack_start docs:
 * `useHydrated` is exported from `@tanstack/react-router`.
 */
export function useIsDesktop(): boolean {
  const hydrated = useHydrated()
  const [isDesktop, setIsDesktop] = useState(true)

  useEffect(() => {
    if (!hydrated) return
    const mq = window.matchMedia(DESKTOP_MQ)
    const update = () => setIsDesktop(mq.matches)
    update()
    mq.addEventListener("change", update)
    return () => mq.removeEventListener("change", update)
  }, [hydrated])

  return hydrated ? isDesktop : true
}
