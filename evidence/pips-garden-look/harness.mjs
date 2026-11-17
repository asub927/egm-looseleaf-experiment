import { access, mkdir, readdir, readFile, writeFile } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { chromium, webkit } from "playwright"
import pixelmatch from "pixelmatch"
import { PNG } from "pngjs"
import {
  CONFIGS,
  EXAMPLE_NAV,
  MAP_SNAPSHOTS,
  parseBaselineFilename,
  runMainScenario,
  runMapSnapshots,
} from "./garden-scenario.mjs"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const BASELINE_REPO = path.join(__dirname, "baseline")
const DEMO_BASELINE = path.join(
  process.env.HOME ?? "/home/ubuntu",
  "garden-design/design/garden-map-demo",
)
const ARTIFACTS = path.join(__dirname, "artifacts", "diff")
const BASE = process.env.PREVIEW_URL ?? "http://127.0.0.1:4173"
const MAX_PERCENT = 1.0
const PIXELMATCH_THRESHOLD = 0.1

/**
 * Allowed diff masks (animated / nondeterministic). React app may not render separate
 * layers for these yet; when absent, comparison runs unmasked (documented in results).
 */
const MASK_IDS = ["butterflies", "bee", "clouds", "text-caret"]
const MASK_SELECTORS = [
  "[data-testid='butterflies']",
  "[data-testid='bee']",
  "[data-testid='clouds']",
  ".butterflies",
  ".bee",
  ".clouds",
  "input:focus",
  "[contenteditable]:focus",
]

const ENGINES = [
  { name: "chromium", launcher: chromium },
  { name: "webkit", launcher: webkit },
]

/** Screens with no automated navigation (demo error capture only). */
const UNMAPPED_SCREEN_IDS = new Set(["zz-error"])

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

function configByTag(tag) {
  return CONFIGS.find((c) => c.tag === tag)
}

function fillRect(data, width, x0, y0, w, h) {
  for (let y = y0; y < y0 + h; y++) {
    for (let x = x0; x < x0 + w; x++) {
      const i = (width * y + x) << 2
      data[i] = 0
      data[i + 1] = 0
      data[i + 2] = 0
      data[i + 3] = 255
    }
  }
}

async function collectMaskRects(page) {
  return page.evaluate((sels) => {
    const out = []
    for (const sel of sels) {
      for (const el of document.querySelectorAll(sel)) {
        const r = el.getBoundingClientRect()
        if (r.width < 1 || r.height < 1) continue
        out.push({
          x: Math.floor(r.x),
          y: Math.floor(r.y),
          w: Math.ceil(r.width),
          h: Math.ceil(r.height),
        })
      }
    }
    return out
  }, MASK_SELECTORS)
}

function applyMasksToPng(png, rects) {
  for (const r of rects) {
    const x0 = Math.max(0, r.x)
    const y0 = Math.max(0, r.y)
    const w = Math.min(png.width - x0, r.w)
    const h = Math.min(png.height - y0, r.h)
    if (w > 0 && h > 0) fillRect(png.data, png.width, x0, y0, w, h)
  }
}

function percentDiff(imgA, imgB, diffPng, maskRects) {
  const { width, height } = imgA
  if (imgB.width !== width || imgB.height !== height) {
    return { percent: 100, mismatchedDimensions: true }
  }
  const a = PNG.sync.write(imgA)
  const b = PNG.sync.write(imgB)
  const imgAc = PNG.sync.read(a)
  const imgBc = PNG.sync.read(b)
  if (maskRects?.length) {
    applyMasksToPng(imgAc, maskRects)
    applyMasksToPng(imgBc, maskRects)
  }
  const mismatched = pixelmatch(imgAc.data, imgBc.data, diffPng.data, width, height, {
    threshold: PIXELMATCH_THRESHOLD,
  })
  const total = width * height
  return { percent: (mismatched / total) * 100, mismatchedPixels: mismatched, total }
}

async function loadPng(filePath) {
  const buf = await readFile(filePath)
  return PNG.sync.read(buf)
}

function sideBySide(baseline, build, diff) {
  const w = baseline.width + build.width + diff.width
  const h = Math.max(baseline.height, build.height, diff.height)
  const out = new PNG({ width: w, height: h })
  for (const src of [
    { img: baseline, x: 0 },
    { img: build, x: baseline.width },
    { img: diff, x: baseline.width + build.width },
  ]) {
    PNG.bitblt(src.img, out, 0, 0, src.img.width, src.img.height, src.x, 0)
  }
  return out
}

async function captureForConfig(engine, configTag, isMap) {
  const config = isMap ? MAP_SNAPSHOTS.find((m) => m.tag === configTag) : configByTag(configTag)
  if (!config) return { captures: new Map(), maskRects: [] }

  const browser = await engine.launcher.launch()
  const context = await browser.newContext({
    viewport: { width: config.width, height: config.height },
    hasTouch: config.touch ?? false,
    reducedMotion: config.rm ? "reduce" : "no-preference",
  })
  const page = await context.newPage()
  const captures = new Map()
  let maskRects = []

  const shot = async (id, buffer) => {
    captures.set(id, buffer)
    const rects = await collectMaskRects(page).catch(() => [])
    if (rects.length) maskRects = rects
  }

  let scenarioError = null
  try {
    if (isMap) {
      await runMapSnapshots(page, config, shot, BASE)
    } else {
      await runMainScenario(page, config, shot, BASE)
    }
  } catch (err) {
    scenarioError = String(err)
  } finally {
    await context.close()
    await browser.close()
  }

  return { captures, maskRects, error: scenarioError }
}

async function loadManifest(baselineRoot) {
  const manifest = []
  for (const [subdir, kind] of [
    ["shots", "shots"],
    ["shots-map", "shots-map"],
  ]) {
    const dir = path.join(baselineRoot, subdir)
    if (!(await exists(dir))) continue
    const names = (await readdir(dir)).filter((f) => f.endsWith(".png")).sort()
    for (const baselineName of names) {
      const parsed = parseBaselineFilename(baselineName)
      manifest.push({
        baselineName,
        baselinePath: path.join(dir, baselineName),
        kind: parsed?.kind ?? kind,
        configTag: parsed?.configTag,
        screenId: parsed?.screenId,
        subdir,
      })
    }
  }
  return manifest
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

  await mkdir(ARTIFACTS, { recursive: true })
  const manifest = await loadManifest(baselineRoot)

  const onlyConfig = process.env.HARNESS_CONFIG
  const configTagsNeeded = new Set()
  const mapTagsNeeded = new Set()
  for (const row of manifest) {
    if (onlyConfig && row.configTag !== onlyConfig) continue
    if (row.subdir === "shots-map") mapTagsNeeded.add(row.configTag)
    else configTagsNeeded.add(row.configTag)
  }

  const captureCache = new Map()
  const rows = []
  let failed = 0

  for (const engine of ENGINES) {
    for (const tag of configTagsNeeded) {
      const key = `${engine.name}:main:${tag}`
      if (!captureCache.has(key)) {
        try {
          captureCache.set(key, await captureForConfig(engine, tag, false))
        } catch (e) {
          captureCache.set(key, { captures: new Map(), maskRects: [], error: String(e) })
        }
      }
    }
    for (const tag of mapTagsNeeded) {
      const key = `${engine.name}:map:${tag}`
      if (!captureCache.has(key)) {
        try {
          captureCache.set(key, await captureForConfig(engine, tag, true))
        } catch (e) {
          captureCache.set(key, { captures: new Map(), maskRects: [], error: String(e) })
        }
      }
    }
  }

  for (const engine of ENGINES) {
    for (const item of manifest) {
      if (onlyConfig && item.configTag !== onlyConfig) continue
      const { baselineName, baselinePath, screenId, configTag, subdir } = item
      const cacheKey = `${engine.name}:${subdir === "shots-map" ? "map" : "main"}:${configTag}`
      const { captures, maskRects, error } = captureCache.get(cacheKey) ?? {
        captures: new Map(),
        maskRects: [],
      }

      if (UNMAPPED_SCREEN_IDS.has(screenId)) {
        rows.push({
          baseline: baselineName,
          engine: engine.name,
          screenId,
          configTag,
          pass: null,
          skipped: true,
          detail: "no navigation mapping (demo error shot only)",
          masks: MASK_IDS,
        })
        continue
      }

      const shotBuffer = captures.get(screenId)
      if (!shotBuffer) {
        rows.push({
          baseline: baselineName,
          engine: engine.name,
          screenId,
          configTag,
          percent: null,
          pass: false,
          detail: error ? `scenario failed: ${error.slice(0, 200)}` : "capture missing for screen",
          masks: MASK_IDS,
        })
        failed++
        continue
      }

      const buildPath = path.join(
        ARTIFACTS,
        `build-${baselineName.replace(/\.png$/, "")}-${engine.name}.png`,
      )
      await writeFile(buildPath, shotBuffer)

      const imgA = await loadPng(baselinePath)
      const imgB = PNG.sync.read(shotBuffer)
      const diff = new PNG({ width: imgA.width, height: imgA.height })
      const { percent, mismatchedDimensions } = percentDiff(imgA, imgB, diff, maskRects)
      const diffPath = path.join(
        ARTIFACTS,
        `diff-${baselineName.replace(/\.png$/, "")}-${engine.name}.png`,
      )
      const sidePath = path.join(
        ARTIFACTS,
        `side-${baselineName.replace(/\.png$/, "")}-${engine.name}.png`,
      )

      if (!mismatchedDimensions) {
        await writeFile(diffPath, PNG.sync.write(diff))
        const side = sideBySide(imgA, imgB, diff)
        await writeFile(sidePath, PNG.sync.write(side))
      }

      const pass = !mismatchedDimensions && percent <= MAX_PERCENT
      if (!pass) failed++
      rows.push({
        baseline: baselineName,
        engine: engine.name,
        screenId,
        configTag,
        percent: mismatchedDimensions ? 100 : percent,
        pass,
        mismatchedDimensions: !!mismatchedDimensions,
        build: path.relative(__dirname, buildPath),
        diff: mismatchedDimensions ? null : path.relative(__dirname, diffPath),
        side: mismatchedDimensions ? null : path.relative(__dirname, sidePath),
        masks: MASK_IDS,
        masksApplied: maskRects.length > 0,
      })
    }
  }

  const out = {
    at: new Date().toISOString(),
    previewUrl: BASE,
    threshold: PIXELMATCH_THRESHOLD,
    maxPercent: MAX_PERCENT,
    manifestCount: manifest.length,
    masks: MASK_IDS,
    maskNote:
      maskRectsNote(rows) ||
      "Mask selectors present but no matching DOM nodes in React app; full-frame compare.",
    exampleNav: EXAMPLE_NAV,
    unmappedScreenIds: [...UNMAPPED_SCREEN_IDS],
    missingBaselinesNote:
      "b6-number-line-5win and 03-map-all-done are absent from committed baseline/shots (demo verify gaps).",
    rows,
    pass: failed === 0,
  }
  await writeFile(path.join(__dirname, "harness-results.json"), JSON.stringify(out, null, 2))
  console.log(
    JSON.stringify(
      {
        manifestCount: manifest.length,
        pass: out.pass,
        failed,
        exampleNav: EXAMPLE_NAV,
        unmappedScreenIds: out.unmappedScreenIds,
      },
      null,
      2,
    ),
  )
  process.exit(failed === 0 ? 0 : 1)
}

function maskRectsNote(rows) {
  if (rows.some((r) => r.masksApplied)) {
    return "Element bounding boxes masked before pixelmatch when DOM nodes exist."
  }
  return null
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
