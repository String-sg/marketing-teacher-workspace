/**
 * Floating dev-mode panel for tuning the choreography flow live. The
 * implementation lives under `./dev-panel/` as a small set of focused
 * track + inspector components composed by `./dev-panel/panel.tsx`.
 *
 * Renders only when wrapped in <DevFlowProvider> (the orchestrator gates
 * by import.meta.env.DEV).
 */
export { DevFlowPanel } from "./dev-panel/panel"
