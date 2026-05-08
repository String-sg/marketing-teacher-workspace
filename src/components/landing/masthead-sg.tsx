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
    <div className="mx-auto min-h-7 w-full max-w-[1440px] px-5 py-1 text-sm leading-5 text-[#1a1a1a] lg:px-8">
      <div className="flex gap-1">
        <SgCrest />
        <div className="flex flex-wrap items-center gap-x-3 gap-y-0">
          <span>A Singapore Government Agency Website</span>
          <a
            className="flex items-center gap-1 text-[#0269d0] underline-offset-2 hover:text-[#0151a0] hover:underline focus-visible:outline-4 focus-visible:outline-[#60aaf4]"
            href="https://www.gov.sg/trusted-sites#govsites"
            rel="noreferrer"
            target="_blank"
          >
            <span>How to identify</span>
            <ChevronDown />
          </a>
        </div>
      </div>
    </div>
  )
}

function SgCrest() {
  return (
    <svg
      aria-hidden
      className="h-5 w-5 shrink-0 text-[#db0000]"
      fill="none"
      viewBox="0 0 20 20"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M4.31179 7.0109C4.31179 7.0109 3.78527 7.78129 4.4749 8.77746C4.4749 8.77746 4.58365 8.27018 5.67275 8.27018H6.97989C8.21435 8.27018 9.13979 7.04881 8.55889 5.78895C8.55889 5.78895 9.42995 5.88317 9.72123 5.31901C10.0114 4.75544 9.70292 4.52966 9.26739 4.52966H7.07088C7.07088 4.9341 6.32687 4.9904 6.32687 4.52966H5.09241C5.09241 4.52966 4.16643 4.52966 4.14867 5.33797C4.14867 5.33797 4.35784 5.20641 4.56589 5.18803V5.40346C4.56589 5.40346 4.31179 5.45057 4.19361 5.51664C4.07599 5.58213 3.90344 5.7608 4.06711 6.22154C4.23023 6.68171 4.29403 6.84142 4.29403 6.84142C4.29403 6.84142 4.55757 6.60588 4.98422 6.60588H5.48356C6.37237 6.60588 6.20925 7.49864 5.31989 7.49864C4.43052 7.49864 4.3129 7.01032 4.3129 7.01032L4.31179 7.0109Z"
        fill="currentColor"
      />
      <path
        d="M8.94948 6.0808C8.94948 6.0808 9.24908 6.09976 9.46657 5.90271C9.46657 5.90271 11.4362 7.49118 8.51395 10.6859C5.59118 13.8813 7.85094 15.9494 7.85094 15.9494C7.85094 15.9494 7.32498 16.4751 7.62402 17.5C7.62402 17.5 6.40843 16.7894 5.47856 15.5823C4.13479 13.8382 3.31367 11.1697 7.00374 9.04116C7.00374 9.04116 9.43938 7.77268 8.94948 6.0808Z"
        fill="currentColor"
      />
      <path
        d="M5.93914 4.22922C5.93914 4.22922 6.33251 3.50249 7.24573 3.50249C7.96588 3.50249 8.13011 3.11988 8.13011 3.11988C8.13011 3.11988 8.44413 2.5 10.0298 2.5C11.4829 2.5 12.4621 3.00153 13.2544 3.67139C13.2544 3.67139 11.1183 2.2995 9.01282 4.22922H5.93914Z"
        fill="currentColor"
      />
      <path
        d="M14.8217 8.828C14.7612 6.5599 13.0668 4.12922 9.42448 4.2671C12.9825 1.14703 19.1543 8.11333 14.0711 11.7734C14.0711 11.7734 14.9216 10.517 14.8217 8.828Z"
        fill="currentColor"
      />
      <path
        d="M9.96927 4.51761C14.4106 4.37973 15.9962 9.89315 13.1278 12.3744L10.2478 13.8158C10.2478 13.8158 9.87273 12.5628 11.2648 11.0961C12.6568 9.6306 13.9994 6.88625 10.1518 5.08177C10.1518 5.08177 10.2245 4.70605 9.97038 4.51819L9.96927 4.51761Z"
        fill="currentColor"
      />
      <path
        d="M9.73904 5.75795C9.73904 5.75795 9.95708 5.54481 10.0298 5.36959C13.3331 6.79778 12.8133 9.21697 10.8403 11.2467C9.63029 12.537 10.0053 13.9284 10.0053 13.9284C10.0053 13.9284 8.52954 14.8803 8.02078 15.7076C8.02078 15.7076 5.88363 13.8233 8.84357 10.6957C11.748 7.62563 9.73904 5.75795 9.73904 5.75795Z"
        fill="currentColor"
      />
    </svg>
  )
}

function ChevronDown() {
  return (
    <svg
      aria-hidden
      className="h-5 w-5 shrink-0 rotate-180"
      fill="currentColor"
      viewBox="0 0 20 20"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        clipRule="evenodd"
        d="M9.64645 7.14645C9.84171 6.95118 10.1583 6.95118 10.3536 7.14645L15.3536 12.1464C15.5488 12.3417 15.5488 12.6583 15.3536 12.8536C15.1583 13.0488 14.8417 13.0488 14.6464 12.8536L10 8.20711L5.35355 12.8536C5.15829 13.0488 4.84171 13.0488 4.64645 12.8536C4.45118 12.6583 4.45118 12.3417 4.64645 12.1464L9.64645 7.14645Z"
        fill="currentColor"
        fillRule="evenodd"
      />
    </svg>
  )
}
