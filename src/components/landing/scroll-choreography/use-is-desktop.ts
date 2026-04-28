import { useEffect, useState } from "react"
import { useHydrated } from "@tanstack/react-router"

const DESKTOP_MQ = "(min-width: 1024px)"

/**
 * Optimistic-desktop SSR hook.
 *
 * - Returns `true` on the server and during the first client render so SSR
 *   markup matches the first hydrated render (no "did not match" warnings).
 * - After hydration, an effect reads `window.matchMedia(DESKTOP_MQ)` and
 *   subscribes to media-query changes for live updates.
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
