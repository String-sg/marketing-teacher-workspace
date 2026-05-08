import { createElement, useEffect, useRef, useState } from "react"

import { ensureSgdsComponent } from "@/lib/sgds"

const loadSgdsMasthead = () =>
  import("@govtechsg/sgds-web-component/components/Masthead/index.js")

const SGDS_MASTHEAD_TAG = "sgds-masthead"

const sgdsMastheadReady =
  typeof window === "undefined"
    ? null
    : ensureSgdsComponent(SGDS_MASTHEAD_TAG, loadSgdsMasthead)

type MastheadState = "loading" | "ready" | "failed"

function isSgdsMastheadDefined() {
  return (
    typeof customElements !== "undefined" &&
    customElements.get(SGDS_MASTHEAD_TAG) !== undefined
  )
}

export function MastheadSg() {
  const [state, setState] = useState<MastheadState>(() =>
    isSgdsMastheadDefined() ? "ready" : "loading"
  )
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (typeof customElements === "undefined") {
      setState("failed")
      return
    }
    if (customElements.get(SGDS_MASTHEAD_TAG)) {
      setState("ready")
      return
    }

    let cancelled = false
    const markReady = () => {
      if (!cancelled) setState("ready")
    }

    ;(
      sgdsMastheadReady ??
      ensureSgdsComponent(SGDS_MASTHEAD_TAG, loadSgdsMasthead)
    )
      .then(markReady)
      .catch((error: unknown) => {
        if (!cancelled) setState("failed")
        if (import.meta.env.DEV) {
          console.error("Failed to load SGDS masthead", error)
        }
      })

    return () => {
      cancelled = true
    }
  }, [])

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
  }, [state])

  return (
    <div ref={ref} className="fixed inset-x-0 top-0 z-[51] bg-[#f7f7f7]">
      {state === "ready" ? (
        createElement(SGDS_MASTHEAD_TAG)
      ) : (
        <MastheadFallback />
      )}
    </div>
  )
}

function MastheadFallback() {
  return (
    <div className="mx-auto flex min-h-7 w-full max-w-[1440px] flex-wrap items-center gap-x-3 gap-y-0 px-5 py-1 text-sm leading-5 text-[#1a1a1a] lg:px-8">
      <span aria-hidden className="text-sm leading-none text-[#db0000]">
        ◆
      </span>
      <span>A Singapore Government Agency Website</span>
      <a
        className="text-[#0269d0] underline-offset-2 hover:text-[#0151a0] hover:underline focus-visible:outline-4 focus-visible:outline-[#60aaf4]"
        href="https://www.gov.sg/trusted-sites#govsites"
        rel="noreferrer"
        target="_blank"
      >
        How to identify
      </a>
    </div>
  )
}
