import { useEffect, useState } from "react"
import { useHydrated } from "@tanstack/react-router"

const DESKTOP_MQ = "(min-width: 1024px)"

// Optimistic-desktop SSR hook. Returns `true` during SSR and the hydrating
// first client render to keep server/client markup in sync; matchMedia takes
// over once `useHydrated()` flips. Pairs with the `.scroll-choreography-only`
// CSS gate that hides the subtree on mobile.
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
