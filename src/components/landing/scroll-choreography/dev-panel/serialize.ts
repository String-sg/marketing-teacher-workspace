/**
 * Stable text-config serializer for the "Copy config" button. Output is
 * meant to be pasted into stages.ts / dev-flow-context.ts. Format must
 * remain byte-identical to the previous implementation so existing tunes
 * round-trip cleanly.
 */
import { fmtNumber } from "./timeline-math"
import type { PaperCardConfig, SketchesConfig } from "../dev-flow-context"
import type { StageDef } from "../types"

export function serializeFlow(
  stages: ReadonlyArray<StageDef>,
  paper: PaperCardConfig,
  sketches: SketchesConfig
): string {
  const stageBlock = [
    "export const STAGES = [",
    ...stages.map((s) =>
      [
        "  {",
        `    id: "${s.id}",`,
        `    window: [${fmtNumber(s.window[0])}, ${fmtNumber(s.window[1])}] as const,`,
        `    scale: ${fmtNumber(s.scale)},`,
        `    x: "${s.x}",`,
        `    y: "${s.y}",`,
        `    opacity: ${fmtNumber(s.opacity)},`,
        "  },",
      ].join("\n")
    ),
    "] as const satisfies readonly StageDef[]",
  ]
  const paperBlock = [
    "export const PAPER_CARD_DEFAULTS: PaperCardConfig = {",
    `  bgMidProgress: ${fmtNumber(paper.bgMidProgress)},`,
    `  cardsMidProgress: ${fmtNumber(paper.cardsMidProgress)},`,
    `  teacherMidProgress: ${fmtNumber(paper.teacherMidProgress)},`,
    `  scaleMidValue: ${fmtNumber(paper.scaleMidValue)},`,
    `  scaleEndValue: ${fmtNumber(paper.scaleEndValue)},`,
    `  opacityFadeStart: ${fmtNumber(paper.opacityFadeStart)},`,
    `  opacityFadeEnd: ${fmtNumber(paper.opacityFadeEnd)},`,
    "}",
  ]
  const sketchesBlock = [
    "export const SKETCHES_DEFAULTS: SketchesConfig = {",
    `  cardsTop: ${fmtNumber(sketches.cardsTop)},`,
    `  cardsWidth: ${fmtNumber(sketches.cardsWidth)},`,
    `  teacherTop: ${fmtNumber(sketches.teacherTop)},`,
    `  teacherWidth: ${fmtNumber(sketches.teacherWidth)},`,
    "}",
  ]
  return [...stageBlock, "", ...paperBlock, "", ...sketchesBlock].join("\n")
}

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    const ta = document.createElement("textarea")
    ta.value = text
    ta.style.position = "fixed"
    ta.style.opacity = "0"
    document.body.appendChild(ta)
    ta.select()
    const ok = document.execCommand("copy")
    ta.remove()
    return ok
  }
}
