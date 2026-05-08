import { lazy, Suspense, useEffect, useRef, useState } from "react"

const SgdsMasthead = lazy(
  () => import("@govtechsg/sgds-web-component/react/masthead/index.js")
)

export function MastheadSg() {
  const [mounted, setMounted] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => setMounted(true), [])

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const root = document.documentElement
    const update = () =>
      root.style.setProperty("--masthead-h", `${el.offsetHeight}px`)
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => {
      ro.disconnect()
      root.style.removeProperty("--masthead-h")
    }
  }, [mounted])

  return (
    <div
      ref={ref}
      className="fixed inset-x-0 top-0 z-[51] min-h-[28px] bg-[#f7f7f7]"
    >
      {mounted && (
        <Suspense fallback={null}>
          <SgdsMasthead />
        </Suspense>
      )}
    </div>
  )
}
