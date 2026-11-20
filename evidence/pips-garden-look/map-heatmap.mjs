/**
 * Region histogram for a single baseline vs build diff (default: desk 01-map chromium).
 */
import { readFile, writeFile, mkdir } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"
import pixelmatch from "pixelmatch"
import { PNG } from "pngjs"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const BASELINE = path.join(__dirname, "baseline", "shots", "desk-1280x800-mouse-01-map.png")
const BUILD = path.join(
  __dirname,
  "artifacts",
  "diff",
  "build-desk-1280x800-mouse-01-map-chromium.png",
)
const OUT = path.join(__dirname, "artifacts", "heatmap")

const ROWS = 8
const COLS = 8

async function main() {
  const imgA = PNG.sync.read(await readFile(BASELINE))
  const imgB = PNG.sync.read(await readFile(BUILD))
  const { width, height } = imgA
  const diff = new PNG({ width, height })
  const mismatched = pixelmatch(imgA.data, imgB.data, diff.data, width, height, { threshold: 0.1 })
  const total = width * height
  const percent = (mismatched / total) * 100

  const cellW = Math.ceil(width / COLS)
  const cellH = Math.ceil(height / ROWS)
  const cells = []
  for (let ry = 0; ry < ROWS; ry++) {
    for (let cx = 0; cx < COLS; cx++) {
      const x0 = cx * cellW
      const y0 = ry * cellH
      const x1 = Math.min(width, x0 + cellW)
      const y1 = Math.min(height, y0 + cellH)
      let count = 0
      for (let y = y0; y < y1; y++) {
        for (let x = x0; x < x1; x++) {
          const i = (width * y + x) << 2
          if (diff.data[i] || diff.data[i + 1] || diff.data[i + 2]) count++
        }
      }
      const cellArea = (x1 - x0) * (y1 - y0)
      cells.push({
        id: `r${ry}c${cx}`,
        x0,
        y0,
        x1,
        y1,
        mismatched: count,
        percentOfFrame: (count / total) * 100,
        percentOfCell: (count / cellArea) * 100,
      })
    }
  }
  cells.sort((a, b) => b.mismatched - a.mismatched)
  await mkdir(OUT, { recursive: true })
  await writeFile(path.join(OUT, "01-map-desk-chromium-diff.png"), PNG.sync.write(diff))
  const report = {
    at: new Date().toISOString(),
    baseline: path.basename(BASELINE),
    build: path.relative(__dirname, BUILD),
    framePercent: percent,
    topRegions: cells.slice(0, 12),
  }
  await writeFile(path.join(OUT, "01-map-regions.json"), JSON.stringify(report, null, 2))
  console.log(JSON.stringify(report, null, 2))
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})