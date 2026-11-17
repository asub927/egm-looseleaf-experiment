import { mkdir, writeFile } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { chromium } from "playwright"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const OUT = path.join(__dirname, "artifacts", "fluid-sweep")
const BASE = process.env.PREVIEW_URL ?? "http://127.0.0.1:4173"
const WIDTHS = [360, 414, 600, 744, 834, 1024, 1180, 1440]
const MIN_TARGET = 56

const SELECTORS = [
  '[data-testid="garden-path"]',
  '[data-testid="garden-gate"]',
  '[data-testid="pip-owl-map"]',
  '[data-testid^="bed-plot-"]',
  '[data-testid^="bed-plaque-"]',
  '[data-testid^="bed-tile-"]',
].join(", ")

function boxesOverlap(a, b) {
  return a.x + a.width > b.x && b.x + b.width > a.x && a.y + a.height > b.y && b.y + b.height > a.y
}

async function main() {
  const browser = await chromium.launch()
  const results = []

  for (const width of WIDTHS) {
    for (const landscape of [false, true]) {
      const w = landscape ? Math.max(width, 640) : width
      const h = landscape ? width : Math.max(800, Math.round(width * 1.4))
      const tag = `${w}x${h}-${landscape ? "landscape" : "portrait"}`
      const context = await browser.newContext({ viewport: { width: w, height: h } })
      const page = await context.newPage()
      await page.goto(`${BASE}/`)
      const loc = page.locator(SELECTORS)
      const count = await loc.count()
      const boxes = []
      let smallTargets = []
      for (let i = 0; i < count; i++) {
        const id =
          (await loc.nth(i).getAttribute("data-testid")) ??
          (await loc.nth(i).getAttribute("id")) ??
          `el-${i}`
        const box = await loc.nth(i).boundingBox()
        if (!box) continue
        if (box.width < MIN_TARGET || box.height < MIN_TARGET) {
          smallTargets.push({ id, box })
        }
        boxes.push({ id, box })
      }
      let overlaps = []
      for (let i = 0; i < boxes.length; i++) {
        for (let j = i + 1; j < boxes.length; j++) {
          if (boxesOverlap(boxes[i].box, boxes[j].box)) {
            overlaps.push([boxes[i].id, boxes[j].id])
          }
        }
      }
      await mkdir(OUT, { recursive: true })
      await page.screenshot({ path: path.join(OUT, `map-${tag}.png`), fullPage: true })
      results.push({
        tag,
        overlaps,
        smallTargets,
        pass: overlaps.length === 0 && smallTargets.length === 0,
      })
      await context.close()
    }
  }
  await browser.close()
  const summary = {
    at: new Date().toISOString(),
    minTarget: MIN_TARGET,
    widths: WIDTHS,
    results,
    pass: results.every((r) => r.pass),
  }
  await writeFile(
    path.join(__dirname, "fluid-sweep-results.json"),
    JSON.stringify(summary, null, 2),
  )
  console.log(JSON.stringify(summary, null, 2))
  process.exit(summary.pass ? 0 : 1)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
