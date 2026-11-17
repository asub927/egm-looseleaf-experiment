import { access, copyFile, mkdir, readdir, readFile, writeFile } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { chromium, webkit } from "playwright"
import pixelmatch from "pixelmatch"
import { PNG } from "pngjs"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, "..", "..")
const BASELINE_REPO = path.join(__dirname, "baseline")
const DEMO_BASELINE = path.join(
  process.env.HOME ?? "/home/ubuntu",
  "garden-design/design/garden-map-demo",
)
const ARTIFACTS = path.join(__dirname, "artifacts", "diff")
const BASE = process.env.PREVIEW_URL ?? "http://127.0.0.1:4173"
const MAX_PERCENT = 1.0
const PIXELMATCH_THRESHOLD = 0.1

/** Animated / nondeterministic regions — mask in diff (document in report). */
const MASK_IDS = ["butterflies", "bee", "clouds", "text-caret"]

const VIEWPORTS = [
  { tag: "desk-1280x800", width: 1280, height: 800 },
  { tag: "ipad-1024x768", width: 1024, height: 768 },
  { tag: "ipad-768x1024", width: 768, height: 1024 },
  { tag: "phone-390x844", width: 390, height: 844 },
]

const ENGINES = [
  { name: "chromium", launcher: chromium },
  { name: "webkit", launcher: webkit },
]

async function exists(p) {
  try {
    await access(p)
    return true
  } catch {
    return false
  }
}

async function resolveBaselineRoot() {
  if (await exists(path.join(BASELINE_REPO, "shots"))) return BASELINE_REPO
  if (await exists(path.join(DEMO_BASELINE, "shots"))) return DEMO_BASELINE
  return null
}

async function ensureBaselineMirrored(fromRoot) {
  if (fromRoot === BASELINE_REPO) return
  await mkdir(path.join(BASELINE_REPO, "shots"), { recursive: true })
  await mkdir(path.join(BASELINE_REPO, "shots-map"), { recursive: true })
  for (const sub of ["shots", "shots-map"]) {
    const srcDir = path.join(fromRoot, sub)
    if (!(await exists(srcDir))) continue
    const names = await readdir(srcDir)
    for (const name of names) {
      if (!name.endsWith(".png")) continue
      await copyFile(path.join(srcDir, name), path.join(BASELINE_REPO, sub, name))
    }
  }
}

function percentDiff(imgA, imgB, diffPng) {
  const { width, height } = imgA
  if (imgB.width !== width || imgB.height !== height) {
    return { percent: 100, mismatchedDimensions: true }
  }
  const mismatched = pixelmatch(
    imgA.data,
    imgB.data,
    diffPng.data,
    width,
    height,
    { threshold: PIXELMATCH_THRESHOLD },
  )
  const total = width * height
  return { percent: (mismatched / total) * 100, mismatchedPixels: mismatched, total }
}

async function loadPng(filePath) {
  const buf = await readFile(filePath)
  return PNG.sync.read(buf)
}

/**
 * Screens and states are driven by filenames in baseline/shots/*.png
 * (e.g. map__desk-1280x800__chromium.png). extend NAV below when demo shot manifest is present.
 */
const NAV = [
  { screen: "map", goto: async (page) => page.goto(`${BASE}/`) },
]

async function capture(page, outPath) {
  await mkdir(path.dirname(outPath), { recursive: true })
  await page.screenshot({ path: outPath, fullPage: true })
}

async function main() {
  const baselineRoot = await resolveBaselineRoot()
  if (!baselineRoot) {
    const msg =
      "BLOCKED: no baseline. Extract garden-design-v2.tar.gz to ~/garden-design and commit evidence/pips-garden-look/baseline/ before visual changes."
    console.error(msg)
    await writeFile(
      path.join(__dirname, "harness-results.json"),
      JSON.stringify({ blocked: true, reason: msg, at: new Date().toISOString() }, null, 2),
    )
    process.exit(2)
  }

  if (baselineRoot !== BASELINE_REPO) {
    await ensureBaselineMirrored(baselineRoot)
    console.log(`Mirrored baselines from ${baselineRoot} → ${BASELINE_REPO}`)
  }

  const shotsDir = path.join(BASELINE_REPO, "shots")
  const manifest = (await readdir(shotsDir)).filter((f) => f.endsWith(".png"))
  if (manifest.length === 0) {
    console.error("BLOCKED: baseline/shots is empty — regenerate from garden-map-demo shot script.")
    process.exit(2)
  }

  const rows = []
  let failed = 0

  for (const engine of ENGINES) {
    const browser = await engine.launcher.launch()
  for (const vp of VIEWPORTS) {
      const context = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
      })
      const page = await context.newPage()
      for (const { screen, goto } of NAV) {
        await goto(page)
        const buildPath = path.join(ARTIFACTS, `build-${screen}-${vp.tag}-${engine.name}.png`)
        await capture(page, buildPath)
        const baselineName = manifest.find(
          (f) => f.includes(screen) && f.includes(vp.tag) && f.includes(engine.name),
        )
        if (!baselineName) {
          rows.push({
            screen,
            size: vp.tag,
            engine: engine.name,
            percent: null,
            pass: false,
            detail: "missing baseline file",
          })
          failed++
          continue
        }
        const baselinePath = path.join(shotsDir, baselineName)
        const imgA = await loadPng(baselinePath)
        const imgB = await loadPng(buildPath)
        const diff = new PNG({ width: imgA.width, height: imgA.height })
        const { percent, mismatchedDimensions } = percentDiff(imgA, imgB, diff)
        const diffPath = path.join(ARTIFACTS, `diff-${screen}-${vp.tag}-${engine.name}.png`)
        if (!mismatchedDimensions) {
          await writeFile(diffPath, PNG.sync.write(diff))
        }
        const pass = !mismatchedDimensions && percent <= MAX_PERCENT
        if (!pass) failed++
        rows.push({
          screen,
          size: vp.tag,
          engine: engine.name,
          percent: mismatchedDimensions ? 100 : percent,
          pass,
          baseline: baselineName,
          masks: MASK_IDS,
        })
      }
      await context.close()
    }
    await browser.close()
  }

  const out = {
    at: new Date().toISOString(),
    threshold: PIXELMATCH_THRESHOLD,
    maxPercent: MAX_PERCENT,
    masks: MASK_IDS,
    rows,
    pass: failed === 0,
  }
  await writeFile(path.join(__dirname, "harness-results.json"), JSON.stringify(out, null, 2))
  console.log(JSON.stringify(out, null, 2))
  process.exit(failed === 0 ? 0 : 1)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})