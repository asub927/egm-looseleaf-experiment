import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { chromium, webkit } from "playwright"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const OUT = __dirname
const ROOT = path.join(__dirname, "..", "..")
const BASE = process.env.PREVIEW_URL ?? "http://127.0.0.1:4173"
const beds = [
  "making-ten",
  "counting-on",
  "decomposing",
  "equivalent-sums",
  "relationship",
  "number-line",
]

const viewports = [
  { name: "phone-390x844", width: 390, height: 844 },
  { name: "ipad-1180x820", width: 1180, height: 820 },
  { name: "ipad-744x1133", width: 744, height: 1133 },
]

const ALLOWED_HEX = new Set([
  "#2b2a3a",
  "#ffd6c9",
  "#d9ccff",
  "#c9f2dd",
  "#cde8ff",
  "#fff1b8",
  "#ffd1e3",
  "#fffdf8",
  "#f6f1e4",
  "#e8c4b8",
  "#9bd4b5",
  "#ffffff",
  "#fff",
])

const results = { checks: [], pass: 0, fail: 0, at: new Date().toISOString() }

function record(name, ok, detail = "") {
  results.checks.push({ name, ok, detail })
  if (ok) results.pass++
  else results.fail++
}

async function minTapTarget(page, selector) {
  const box = await page.locator(selector).first().boundingBox()
  if (!box) return { w: 0, h: 0 }
  return { w: box.width, h: box.height }
}

function boxesOverlap(a, b) {
  const pad = 0.5
  return (
    a.x + a.width > b.x + pad &&
    b.x + b.width > a.x + pad &&
    a.y + a.height > b.y + pad &&
    b.y + b.height > a.y + pad
  )
}

async function checkMapBedLayout(page, vp, browserTag) {
  const canvas = await page.locator('[data-testid="garden-canvas"]').boundingBox()
  const loc = page.locator('[data-testid^="bed-plot-"], [data-testid^="bed-plaque-"]')
  const count = await loc.count()
  const boxes = []
  for (let i = 0; i < count; i++) {
    const id = await loc.nth(i).getAttribute("data-testid")
    const box = await loc.nth(i).boundingBox()
    if (box) boxes.push({ id, box })
  }
  let ok = true
  let detail = ""
  if (!canvas) {
    record(`${vp.name} ${browserTag}: map bed layout no overlap`, false, "missing canvas")
    return
  }
  for (const { id, box } of boxes) {
    const clipped =
      box.x < canvas.x - 1 ||
      box.y < canvas.y - 1 ||
      box.x + box.width > canvas.x + canvas.width + 1 ||
      box.y + box.height > canvas.y + canvas.height + 1
    if (clipped) {
      ok = false
      detail = `clipped ${id}`
      break
    }
  }
  if (ok) {
    for (let i = 0; i < boxes.length; i++) {
      for (let j = i + 1; j < boxes.length; j++) {
        if (boxesOverlap(boxes[i].box, boxes[j].box)) {
          ok = false
          detail = `${boxes[i].id} vs ${boxes[j].id}`
          break
        }
      }
      if (!ok) break
    }
  }
  record(
    `${vp.name} ${browserTag}: map bed layout no overlap`,
    ok,
    detail || `${boxes.length} parts`,
  )
}

async function dragOn(page, fromSel, toSel, steps = 16) {
  const from = page.locator(fromSel).first()
  const to = page.locator(toSel).first()
  await from.scrollIntoViewIfNeeded()
  const a = await from.boundingBox()
  const b = await to.boundingBox()
  if (!a || !b) return false
  const fx = a.x + a.width / 2
  const fy = a.y + a.height / 2
  const tx = b.x + b.width / 2
  const ty = b.y + b.height / 2
  await page.mouse.move(fx, fy)
  await page.mouse.down()
  for (let i = 1; i <= steps; i++) {
    const t = i / steps
    await page.mouse.move(fx + (tx - fx) * t, fy + (ty - fy) * t)
  }
  await page.mouse.up()
  await page.waitForTimeout(250)
  return true
}

const dragPlan = {
  "making-ten": { from: '[data-testid="band-bottom"]', to: '[data-testid="band-top"]', repeats: 3 },
  "counting-on": { from: '[data-testid="engine"]', to: '[data-testid="car-12"]', repeats: 1 },
  decomposing: {
    moves: [
      { from: '[data-testid="cut"]', to: '[data-testid="dot-9"]' },
      { from: '[data-testid="cut"]', to: '[data-testid="dot-7"]' },
    ],
  },
  "equivalent-sums": {
    moves: [
      { from: '[data-testid="apple-l-6"]', to: '[data-testid="apple-r-0"]' },
      { from: '[data-testid="apple-l-5"]', to: '[data-testid="apple-r-1"]' },
      { from: '[data-testid="apple-l-6"]', to: '[data-testid="apple-l-0"]' },
    ],
  },
  relationship: { from: '[data-testid="tile-5"]', to: '[data-testid="slot"]', repeats: 1 },
  "number-line": {
    chip: 0,
    from: '[data-testid="flag"]',
    to: '[data-testid="tick-15"]',
    repeats: 2,
  },
}

async function openBedTry(page, bed, chipIndex = 0) {
  await page.goto(BASE, { waitUntil: "networkidle" })
  await page.waitForSelector('[data-testid="ready"]')
  await page.click(`[data-testid="bed-${bed}"]`)
  await page.waitForTimeout(350)
  await page.click('[data-testid="start-try"]')
  await page.locator('[data-testid^="chip-"]').nth(chipIndex).click()
  await page.waitForSelector("#stage", { state: "visible" })
}

async function runDragMoves(page, plan) {
  let dragged = false
  const moves =
    plan.moves ?? (plan.from ? Array.from({ length: plan.repeats ?? 1 }, () => plan) : [])
  for (const move of moves) {
    dragged = (await dragOn(page, move.from, move.to, 24)) || dragged
    if (await page.locator('[data-testid="lock"]').isEnabled()) break
  }
  return dragged
}

async function completeBedByDrag(page, bed, vp, browserTag) {
  const plan = dragPlan[bed]
  const chip = plan?.chip ?? 1
  await openBedTry(page, bed, chip)
  let dragged = false
  if (plan) {
    dragged = await runDragMoves(page, plan)
  }
  record(`${vp.name} ${browserTag}: drag ${bed}`, dragged)
  const via = await page.locator("#stage").getAttribute("data-via")
  record(`${vp.name} ${browserTag}: drag ${bed} via`, via === "drag", `via=${via}`)
  const lockOn = await page.locator('[data-testid="lock"]').isEnabled()
  record(`${vp.name} ${browserTag}: drag ${bed} lock enabled`, lockOn)
  if (lockOn) await page.locator('[data-testid="lock"]').click()
  await page.click('[data-testid="to-map"]')
  await page.waitForSelector('[data-testid="done-count"]')
}

async function completeBedByTap(page, bed, vp, browserTag) {
  await openBedTry(page, bed, 0)
  if (bed !== "equivalent-sums") {
    await page.locator("#stage svg").click({ position: { x: 120, y: 120 }, force: true })
  }
  for (let i = 0; i < 16; i++) {
    if (await page.locator('[data-testid="lock"]').isEnabled()) break
    const stepSel = bed === "equivalent-sums" && i === 2 ? "#step-minus" : "#step-plus"
    const step = page.locator(stepSel)
    if (await step.isEnabled()) await step.click()
    else break
  }
  record(
    `${vp.name} ${browserTag}: tap ${bed} lock enabled`,
    await page.locator('[data-testid="lock"]').isEnabled(),
  )
  if (await page.locator('[data-testid="lock"]').isEnabled()) {
    await page.locator('[data-testid="lock"]').click()
  }
  await page.click('[data-testid="to-map"]')
}

async function completeBedByKeyboard(page, bed, vp, browserTag) {
  await openBedTry(page, bed, 0)
  const stage = page.locator("#stage")
  await stage.focus()
  const maxKeys = bed === "equivalent-sums" ? 8 : 25
  for (let i = 0; i < maxKeys; i++) {
    if (await page.locator('[data-testid="lock"]').isEnabled()) break
    const key = bed === "equivalent-sums" && i === 2 ? "ArrowLeft" : "ArrowRight"
    await stage.press(key)
    await page.waitForTimeout(40)
  }
  record(
    `${vp.name} ${browserTag}: keyboard ${bed} lock enabled`,
    await page.locator('[data-testid="lock"]').isEnabled(),
  )
  const trans = await stage.evaluate((el) => {
    const svg = el.querySelector("svg")
    return svg ? getComputedStyle(svg).transitionProperty : ""
  })
  record(
    `${vp.name} ${browserTag}: keyboard ${bed} no svg transform transition`,
    !trans.includes("transform"),
    trans,
  )
  if (await page.locator('[data-testid="lock"]').isEnabled()) {
    await stage.press("Enter")
  }
  await page.click('[data-testid="to-map"]')
}

async function scanTapTargets(page, vp, browserTag) {
  const selectors = [
    '[data-testid="band-bottom"]',
    '[data-testid="cut"]',
    '[data-testid="flag-hit"]',
    '[data-testid="engine"]',
    ".grab circle[r='28']",
  ]
  for (const sel of selectors) {
    const loc = page.locator(sel).first()
    if ((await loc.count()) === 0) continue
    const { w, h } = await minTapTarget(page, sel)
    record(
      `${vp.name} ${browserTag}: hit area 56px ${sel}`,
      w >= 56 && h >= 56,
      `${Math.round(w)}x${Math.round(h)}`,
    )
  }
}

async function checkDecomposeNoSnap(page, vp, browserTag) {
  await openBedTry(page, "decomposing", 0)
  await dragOn(page, '[data-testid="cut"]', '[data-testid="dot-11"]', 20)
  const text = await page.locator("#stage").innerText()
  const okSnap =
    /cut down to ten/.test(text) && /(11|12|13) left/.test(text) && !/^10 left ·/.test(text.trim())
  record(`${vp.name} ${browserTag}: decompose no snap-to-10 on drag`, okSnap, text.slice(0, 80))
  await page.click('[data-testid="to-map"]')
}

async function checkReloadProgress(page, vp, browserTag) {
  await page.goto(BASE, { waitUntil: "networkidle" })
  await openBedTry(page, "making-ten", 1)
  await dragOn(page, '[data-testid="band-bottom"]', '[data-testid="band-top"]', 20)
  if (await page.locator('[data-testid="lock"]').isEnabled()) {
    await page.locator('[data-testid="lock"]').click()
  }
  await page.click('[data-testid="to-map"]')
  const storageBefore = await page.evaluate(
    () => localStorage.getItem("pips_math_garden_progress_v1") ?? "",
  )
  await page.reload({ waitUntil: "networkidle" })
  await page.waitForSelector('[data-testid="ready"]')
  const storageAfter = await page.evaluate(
    () => localStorage.getItem("pips_math_garden_progress_v1") ?? "",
  )
  record(
    `${vp.name} ${browserTag}: progress survives reload`,
    storageBefore.length > 0 && storageBefore === storageAfter,
  )
}

async function ensureLock(page) {
  const lock = page.locator('[data-testid="lock"]')
  for (let i = 0; i < 14; i++) {
    if (await lock.isEnabled()) return true
    const plus = page.locator("#step-plus")
    if (await plus.isEnabled()) await plus.click()
    else break
  }
  return await lock.isEnabled()
}

function planForBed(bed, chip) {
  if (bed === "making-ten") {
    return {
      from: '[data-testid="band-bottom"]',
      to: '[data-testid="band-top"]',
      repeats: chip === 0 ? 3 : 1,
    }
  }
  if (bed === "number-line" && chip === 1) {
    return { moves: [{ from: '[data-testid="flag"]', to: '[data-testid="tick-14"]' }] }
  }
  if (bed === "relationship" && chip === 1) {
    return { moves: [{ from: '[data-testid="tile-6"]', to: '[data-testid="slot"]' }] }
  }
  return dragPlan[bed]
}

async function solveOneProblem(page, bed, chip) {
  if (bed === "equivalent-sums") {
    for (let i = 0; i < 6; i++) {
      if (await page.locator('[data-testid="lock"]').isEnabled()) break
      const sel = i === 2 ? "#step-minus" : "#step-plus"
      const step = page.locator(sel)
      if (await step.isEnabled()) await step.click()
    }
  } else if (bed === "counting-on" && chip === 1) {
    for (let i = 0; i < 4; i++) {
      if (await page.locator('[data-testid="lock"]').isEnabled()) break
      if (await page.locator("#step-plus").isEnabled()) await page.locator("#step-plus").click()
    }
  } else {
    const plan = planForBed(bed, chip)
    if (plan) await runDragMoves(page, plan)
    await ensureLock(page)
  }
  await page.locator('[data-testid="lock"]').click()
  await page.waitForSelector('[data-testid="win"]', { timeout: 15000 })
}

async function solveBedBothProblems(page, bed) {
  await openBedTry(page, bed, 0)
  await solveOneProblem(page, bed, 0)
  await page.click('[data-testid="next"]')
  await page.click('[data-testid="start-try"]')
  await page.locator('[data-testid^="chip-"]').nth(1).click()
  await page.waitForSelector("#stage", { state: "visible" })
  await solveOneProblem(page, bed, 1)
  await page.click('[data-testid="next"]')
  await page.waitForSelector('[data-testid="done-count"]', { timeout: 15000 })
}

async function finishBedOnPage(page, bed) {
  await page.click(`[data-testid="bed-${bed}"]`)
  await page.waitForTimeout(300)
  await page.click('[data-testid="start-try"]')
  for (const chip of [0, 1]) {
    if (chip) {
      await page.click('[data-testid="start-try"]')
      await page.locator('[data-testid^="chip-"]').nth(1).click()
    } else {
      await page.locator('[data-testid^="chip-"]').first().click()
    }
    await page.waitForSelector("#stage", { state: "visible" })
    if (bed === "making-ten") {
      const reps = chip === 0 ? 3 : 1
      for (let k = 0; k < reps; k++) {
        await dragOn(page, '[data-testid="band-bottom"]', '[data-testid="band-top"]', 20)
      }
    }
    if (bed === "counting-on" && chip === 0) {
      await dragOn(page, '[data-testid="engine"]', '[data-testid="car-12"]', 20)
    }
    if (bed === "counting-on" && chip === 1) {
      for (let i = 0; i < 3; i++) {
        if (await page.locator('[data-testid="lock"]').isEnabled()) break
        if (await page.locator("#step-plus").isEnabled()) await page.locator("#step-plus").click()
      }
    }
    if (bed === "equivalent-sums") {
      for (let i = 0; i < 6; i++) {
        if (await page.locator('[data-testid="lock"]').isEnabled()) break
        const sel = i === 2 ? "#step-minus" : "#step-plus"
        if (await page.locator(sel).isEnabled()) await page.locator(sel).click()
      }
    }
    if (!(await page.locator('[data-testid="lock"]').isEnabled())) {
      await ensureLock(page)
    }
    await page.locator('[data-testid="lock"]').click()
    await page.waitForSelector('[data-testid="win"]', { timeout: 20000 })
    await page.click('[data-testid="next"]')
  }
}

async function checkRestAfter3Beds(page, vp, browserTag) {
  await page.goto(BASE, { waitUntil: "networkidle" })
  await page.evaluate(() => {
    localStorage.setItem(
      "pips_math_garden_progress_v1",
      JSON.stringify({
        schemaVersion: 1,
        solvedBedIds: [],
        solvedProblemKeys: [],
        mossLeaves: 0,
        sessionBedsFinished: 0,
        restedThisSession: false,
        calmMode: false,
        owlBedIndex: 0,
      }),
    )
  })
  await page.reload({ waitUntil: "networkidle" })
  const order = ["making-ten", "counting-on", "equivalent-sums"]
  let onRest = false
  try {
    for (const bed of order) {
      await finishBedOnPage(page, bed)
    }
    onRest = await page.locator('[data-testid="rest-pip"]').isVisible()
  } catch (e) {
    record(`${vp.name} ${browserTag}: rest after 3 beds`, false, String(e).slice(0, 120))
    await page.goto(BASE, { waitUntil: "networkidle" }).catch(() => {})
    await page.waitForSelector('[data-testid="ready"]', { timeout: 15000 }).catch(() => {})
    return
  }
  record(`${vp.name} ${browserTag}: rest after 3 beds`, onRest)
  if (onRest) await page.click('[data-testid="all-done"]')
  else await page.goto(BASE, { waitUntil: "networkidle" })
  await page.waitForSelector('[data-testid="ready"]', { timeout: 15000 })
}

async function checkPaletteStatic() {
  const HEX_RE = /#[0-9a-fA-F]{3,8}\b/g
  const bad = []
  const walk = async (dir) => {
    const { readdir } = await import("node:fs/promises")
    for (const entry of await readdir(dir, { withFileTypes: true })) {
      const p = path.join(dir, entry.name)
      if (entry.isDirectory()) await walk(p)
      else if (/\.(ts|tsx|css)$/.test(entry.name)) {
        const text = await readFile(p, "utf8")
        for (const m of text.match(HEX_RE) ?? []) {
          if (!ALLOWED_HEX.has(m.toLowerCase())) bad.push(`${path.relative(ROOT, p)}: ${m}`)
        }
      }
    }
  }
  await walk(path.join(ROOT, "src/garden"))
  record("static palette scan", bad.length === 0, bad.slice(0, 12).join("; "))
}

async function recordBedVideo(context, bed, vp, browserTag) {
  const vidPage = await context.newPage()
  await openBedTry(vidPage, bed, 0)
  await vidPage.waitForTimeout(900)
  const v = vidPage.video()
  await vidPage.close()
  const out = path.join(OUT, `video-${vp.name}-${browserTag}-${bed}.webm`)
  if (v) {
    const saved = await v.path().catch(() => null)
    if (saved) await copyFile(saved, out).catch(() => {})
  }
  record(`${vp.name} ${browserTag}: video ${bed}`, true, out)
}

async function runConfig(browserType, vp, browserTag) {
  const browser = await browserType.launch()
  const context = await browser.newContext({
    viewport: { width: vp.width, height: vp.height },
    recordVideo: { dir: OUT, size: { width: vp.width, height: vp.height } },
  })
  const page = await context.newPage()
  await page.goto(BASE, { waitUntil: "networkidle" })
  await page.waitForSelector('[data-testid="ready"]', { timeout: 15000 })
  record(`${vp.name} ${browserTag}: ready`, true)

  for (const sel of ['[data-testid="calm-mode"]', '[data-testid="done-today"]']) {
    const { w, h } = await minTapTarget(page, sel)
    record(`${vp.name} ${browserTag}: 56px ${sel}`, w >= 56 && h >= 56, `${w}x${h}`)
  }

  await page.screenshot({ path: path.join(OUT, `${vp.name}-map-${browserTag}.png`) })

  if (vp.name === "phone-390x844" || vp.name === "ipad-744x1133") {
    await checkMapBedLayout(page, vp, browserTag)
  }

  for (const bed of beds) {
    await openBedTry(page, bed, 0)
    const treeBefore = await page.locator("#aria").innerText()
    const ariaOk =
      !/\d+\s*\+\s*\d+\s*=\s*\d+/.test(treeBefore) && !treeBefore.match(/\d+ − \d+ = \d+/)
    record(`${vp.name} ${browserTag}: no answer in aria before lock ${bed}`, ariaOk)
    await page.screenshot({
      path: path.join(OUT, `${vp.name}-${bed}-model-${browserTag}.png`),
    })
    await page.click('[data-testid="to-map"]')
  }

  await checkDecomposeNoSnap(page, vp, browserTag)
  await openBedTry(page, "making-ten", 0)
  await scanTapTargets(page, vp, browserTag)
  await page.click('[data-testid="to-map"]')

  for (const bed of beds) {
    await completeBedByDrag(page, bed, vp, browserTag)
  }
  for (const bed of beds) {
    await completeBedByTap(page, bed, vp, browserTag)
  }
  for (const bed of beds) {
    await completeBedByKeyboard(page, bed, vp, browserTag)
  }
  await checkReloadProgress(page, vp, browserTag)
  for (const bed of beds) {
    await recordBedVideo(context, bed, vp, browserTag)
  }

  await context.close()
  await browser.close()
}

async function main() {
  await mkdir(OUT, { recursive: true })
  await checkPaletteStatic()
  {
    const browser = await chromium.launch()
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } })
    try {
      await checkRestAfter3Beds(page, { name: "phone-390x844" }, "chromium")
    } finally {
      await browser.close()
    }
  }
  for (const vp of viewports) {
    await runConfig(chromium, vp, "chromium")
    try {
      await runConfig(webkit, vp, "webkit")
    } catch (e) {
      record(`${vp.name}: webkit launch`, false, String(e))
    }
  }
  await writeFile(path.join(OUT, "verify-results.json"), JSON.stringify(results, null, 2))
  console.log(JSON.stringify({ pass: results.pass, fail: results.fail, out: OUT }))
  if (results.fail > 0) process.exit(1)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
