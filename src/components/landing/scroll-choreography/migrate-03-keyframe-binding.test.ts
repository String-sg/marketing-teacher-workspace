/**
 * Phase 2 Wave-0 fail-loudly stub for MIGRATE-03 / D-12 / D-13.
 *
 * Rule: every `useTransform(motionValue, [keyframes], [outputs])` keyframe
 * array entry MUST be either a numeric literal `0` or `1`, or a reference
 * to `STAGES`/`byId('...').window[N]`, or a named local `const`. Forbid
 * anonymous numeric literals like `0.6`, `0.78` in keyframe positions.
 * Names like `HERO_COPY_LIFT_PROGRESS = 0.14` are fine because they are
 * extracted to a const declaration.
 *
 * RED state in Wave 0: paper-backdrop.tsx and product-screen.tsx do not
 * exist yet, and scroll-choreography.tsx exists but contains no
 * useTransform calls (return-null stub). expect.fail() turns each missing
 * file into a loud failure, so this test is RED until Wave 1 lands the
 * source files AND Wave 2 honors the endpoint-only binding rule.
 *
 * AST: TypeScript ESLint AST is an ESTree superset; CallExpression args
 * map directly to ESTree shape. We only walk for `useTransform(...)` calls
 * and inspect args[1] (the keyframes ArrayExpression).
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

const ALLOWED_NUMERIC_LITERALS = new Set([0, 1])

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

function isAllowedKeyframeEntry(node: AstNode): {
  ok: boolean
  reason?: string
} {
  if (node.type === "Literal") {
    const value = (node as { value?: unknown }).value
    if (typeof value === "number" && ALLOWED_NUMERIC_LITERALS.has(value)) {
      return { ok: true }
    }
    return {
      ok: false,
      reason: `inline numeric literal ${String(value)} (only 0 or 1 are allowed)`,
    }
  }
  if (node.type === "Identifier") {
    // Named local const reference (intra-stage timing per D-13).
    return { ok: true }
  }
  if (node.type === "MemberExpression") {
    // STAGES[i].window[j] OR byId(...).window[j] — both are MemberExpressions.
    // We accept any MemberExpression because the AST shape for both forms
    // resolves through STAGES / byId. This is intentionally permissive:
    // the false-positive shape (object.foo[bar]) is acceptable here because
    // the stricter form would require dataflow analysis.
    return { ok: true }
  }
  if (node.type === "UnaryExpression") {
    // e.g. `-0.5` — treat as a numeric literal for safety.
    return {
      ok: false,
      reason: "unary numeric expression in keyframe position",
    }
  }
  return {
    ok: false,
    reason: `unsupported keyframe entry type: ${node.type}`,
  }
}

describe("MIGRATE-03 keyframe-binding rule (D-12 / D-13)", () => {
  it.each(FILES)(
    "%s — every useTransform keyframe entry is a STAGES ref, named const, or 0/1",
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
        if (node.type !== "CallExpression") return
        const callee = (node as { callee?: AstNode }).callee
        if (!callee) return
        if (callee.type !== "Identifier") return
        if ((callee as { name?: string }).name !== "useTransform") return

        const args = (node as { arguments?: AstNode[] }).arguments ?? []
        if (args.length < 2) return
        const keyframes = args[1]
        if (!keyframes || keyframes.type !== "ArrayExpression") {
          violations.push(
            `useTransform call's second arg is not an ArrayExpression (got ${keyframes?.type ?? "undefined"})`
          )
          return
        }
        const elements = (keyframes as { elements?: AstNode[] }).elements ?? []
        for (const el of elements) {
          if (!el) continue
          const check = isAllowedKeyframeEntry(el)
          if (!check.ok) {
            violations.push(
              `${file}: forbidden keyframe entry — ${check.reason}`
            )
          }
        }
      })

      if (violations.length > 0) {
        expect.fail(violations.join("\n"))
      }
      // If we reach here with zero useTransform calls in the file, that's
      // also a Wave-0 RED signal: scroll-choreography.tsx in Wave 0 has no
      // useTransform calls (the orchestrator body is `return null`), so
      // there is nothing to check yet. Wave 2 fills it in. We accept zero
      // calls as a non-failing pass for this file because the file itself
      // exists; Phase 2 success is when the file has useTransform calls
      // that pass this rule. The file-missing case above is the loud RED.
    }
  )
})
