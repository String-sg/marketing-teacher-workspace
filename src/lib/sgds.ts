const sgdsComponentLoads = new Map<string, Promise<void>>()

export function ensureSgdsComponent(
  tagName: string,
  loadComponent: () => Promise<unknown>
) {
  if (typeof customElements === "undefined") return Promise.resolve()
  if (customElements.get(tagName)) return Promise.resolve()

  let load = sgdsComponentLoads.get(tagName)
  if (!load) {
    load = loadComponent()
      .then(() => customElements.whenDefined(tagName))
      .then(() => undefined)
    sgdsComponentLoads.set(tagName, load)
  }

  return load
}
