/**
 * Generates responsive image variants for the product screenshot.
 *
 * Reads public/hero/profiles-screen.png (source — 1600×1000, sRGB)
 * and writes 12 variants to public/hero/:
 *   profiles-screen-{640,960,1280,1600}.{avif,webp,png}
 *
 * Idempotent: skips outputs newer than the input mtime, so repeated
 * `pnpm gen:hero-images` runs are cheap. Source PNG is preserved.
 *
 * Per CONTEXT.md D-10: manual + commit (no prebuild hook). Per D-11:
 * widths 640/960/1280/1600. Quality settings per RESEARCH.md Pattern 2.
 *
 * Usage: node scripts/gen-hero-images.mjs (or pnpm gen:hero-images)
 */
import sharp from "sharp"
import { existsSync, statSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { dirname, resolve } from "node:path"

const __dirname = dirname(fileURLToPath(import.meta.url))
const SOURCE = resolve(__dirname, "..", "public", "hero", "profiles-screen.png")
const OUT_DIR = resolve(__dirname, "..", "public", "hero")
const WIDTHS = [640, 960, 1280, 1600]
const FORMATS = [
  { ext: "avif", method: "avif", opts: { quality: 60, effort: 4 } },
  { ext: "webp", method: "webp", opts: { quality: 78, effort: 4 } },
  { ext: "png", method: "png", opts: { compressionLevel: 9 } },
]

function shouldRegenerate(inPath, outPath) {
  if (!existsSync(outPath)) return true
  return statSync(inPath).mtimeMs > statSync(outPath).mtimeMs
}

if (!existsSync(SOURCE)) {
  console.error(`ERROR: source not found: ${SOURCE}`)
  process.exit(1)
}

for (const width of WIDTHS) {
  for (const { ext, method, opts } of FORMATS) {
    const outPath = resolve(OUT_DIR, `profiles-screen-${width}.${ext}`)
    if (!shouldRegenerate(SOURCE, outPath)) {
      console.log(`✓ skip ${outPath}`)
      continue
    }
    await sharp(SOURCE)
      .resize(width, null, { withoutEnlargement: true })
      .withMetadata()
      [method](opts)
      .toFile(outPath)
    console.log(`✓ wrote ${outPath}`)
  }
}
