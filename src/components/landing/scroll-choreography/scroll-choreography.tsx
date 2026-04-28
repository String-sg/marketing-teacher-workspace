/**
 * Phase 1 stub. Phase 2 will replace this body with a `useScroll`-driven
 * orchestrator that picks between the static fallback and the choreography
 * tree based on `useIsDesktop()` + `useReducedMotion()`.
 *
 * PHASE-2 REQUIREMENT (FOUND-04): the future `useScroll()` call MUST pass
 * `layoutEffect: false` to avoid the production-build first-paint flash
 * (motion #2452). Do NOT omit. See:
 *   - REQUIREMENTS.md FOUND-04
 *   - .planning/research/PITFALLS.md Pitfall #1
 *   - .planning/phases/01-foundation-types-static-fallback-ssr-contract/01-RESEARCH.md
 *     § "useScroll({ layoutEffect: false }) — production-build correctness fix"
 *
 * Phase 5 wires this component into routes/index.tsx as the swap target.
 * Plan 05 of Phase 1 wires `<StaticChoreographyFallback />` into
 * routes/index.tsx directly so this stub stays inert until Phase 2 fills it.
 */
export function ScrollChoreography() {
  return null
}
