/**
 * Phase 2 Wave-0 fail-loudly stub for PERF-04.
 *
 * Rule (RESEARCH § Anti-Patterns): scroll-driven `motion.*` elements MUST
 * NOT animate `width`, `height`, `top`, `left`, or `box-shadow` via motion
 * values. Allowed style targets: scale, rotate, x, y (collectively
 * `transform`), opacity, clipPath.
 *
 * RED state in Wave 0: paper-backdrop.tsx and product-screen.tsx do not
 * exist yet, and scroll-choreography.tsx exists but has no animated
 * `motion.*` style props (return-null stub). expect.fail() turns each
 * missing file into a loud failure, so this test is RED until Wave 1
 * lands the source files AND Wave 2 honors the transform/opacity-only
 * rule.
 */
import { describe, expect, it } from "vitest"
import { existsSync, readFileSync } from "node:fs"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import { parse } from "@typescript-eslint/parser"

const __dirname_local = dirname(fileURLToPath(import.meta.url))
const FILES = [
  "paper-backdrop.tsx",
  "product-screen.tsx",
  "scroll-choreography.tsx",
] as const

const FORBIDDEN_KEYS = new Set([
  "width",
  "height",
  "top",
  "left",
  "boxShadow",
  "box-shadow",
])

type AstNode = {
  type: string
  [key: string]: unknown
}

function walk(node: unknown, visit: (n: AstNode) => void): void {
  if (!node || typeof node !== "object") return
  if (Array.isArray(node)) {
    for (const child of node) walk(child, visit)
    return
  }
  const n = node as AstNode
  if (typeof n.type === "string") visit(n)
  for (const key of Object.keys(n)) {
    if (key === "parent" || key === "loc" || key === "range") continue
    walk(n[key], visit)
  }
}

function getPropertyKeyName(prop: AstNode): string | undefined {
  const key = (prop as { key?: AstNode }).key
  if (!key) return undefined
  if (key.type === "Identifier") return (key as { name?: string }).name
  if (key.type === "Literal") {
    const v = (key as { value?: unknown }).value
    return typeof v === "string" ? v : undefined
  }
  return undefined
}

describe("PERF-04 transform/opacity-only rule (RESEARCH § Anti-Patterns)", () => {
  it.each(FILES)(
    "%s — does not animate forbidden CSS properties via motion values",
    (file) => {
      const filePath = resolve(__dirname_local, file)
      if (!existsSync(filePath)) {
        expect.fail(
          `Wave-0 RED contract: ${file} does not exist yet. Wave 1 must create it.`
        )
      }
      const src = readFileSync(filePath, "utf8")
      const ast = parse(src, {
        loc: true,
        range: true,
        jsx: true,
        tokens: false,
        ecmaVersion: "latest",
        sourceType: "module",
      })

      const violations: string[] = []
      walk(ast, (node) => {
        if (node.type !== "JSXAttribute") return
        const name = (node as { name?: AstNode }).name
        if (!name || (name as { name?: string }).name !== "style") return
        const value = (node as { value?: AstNode }).value
        if (!value || value.type !== "JSXExpressionContainer") return
        const expr = (value as { expression?: AstNode }).expression
        if (!expr || expr.type !== "ObjectExpression") return

        const properties = (expr as { properties?: AstNode[] }).properties ?? []
        for (const prop of properties) {
          if (!prop) continue
          if (prop.type !== "Property") continue
          const keyName = getPropertyKeyName(prop)
          if (!keyName) continue
          if (!FORBIDDEN_KEYS.has(keyName)) continue
          // Forbidden key. Static string/number literal values are
          // allowed (e.g. style={{ width: "100%" }}); only motion-value
          // bindings (Identifier / non-Literal expressions) are violations.
          const propValue = (prop as { value?: AstNode }).value
          if (!propValue) continue
          if (propValue.type === "Literal") continue
          const loc = (prop as { loc?: { start?: { line?: number } } }).loc
          const line = loc?.start?.line ?? 0
          violations.push(
            `${file}:${line} animates forbidden property '${keyName}' via motion value`
          )
        }
      })

      if (violations.length > 0) {
        expect.fail(violations.join("\n"))
      }
    }
  )
})
