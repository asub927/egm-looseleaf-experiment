import { copyFile, mkdir, writeFile } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { chromium, webkit } from "playwright"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const OUT = __dirname
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
  await page.waitForTimeout(200)
  return true
}

async function completeBedByTap(page, bed, vp, browserTag) {
  await page.click(`[data-testid="bed-${bed}"]`)
  await page.waitForTimeout(400)
  await page.waitForSelector('[data-testid="start-try"]', { timeout: 12000 })
  record(`${vp.name} ${browserTag}: open ${bed} tap`, true)
  await page.click('[data-testid="start-try"]')
  await page.waitForSelector('[data-testid^="chip-"]', { timeout: 5000 })
  const chips = await page.locator('[data-testid^="chip-"]').all()
  await chips[1]?.click()
  await page.waitForSelector("#stage", { state: "visible" })
  for (let i = 0; i < 20; i++) {
    const lock = page.locator('[data-testid="lock"]')
    if (await lock.isEnabled()) break
    const plus = page.locator("#step-plus")
    if (await plus.isEnabled()) await plus.click()
    else break
  }
  if (await page.locator('[data-testid="lock"]').isEnabled()) {
    await page.locator('[data-testid="lock"]').click()
  }
  await page.waitForTimeout(300)
  await page.click('[data-testid="to-map"]')
  await page.waitForSelector('[data-testid="done-count"]')
}

async function completeBedByKeyboard(page, bed, vp, browserTag) {
  await page.click(`[data-testid="bed-${bed}"]`)
  await page.waitForTimeout(400)
  await page.click('[data-testid="start-try"]')
  await page.locator('[data-testid^="chip-"]').first().click()
  const stage = page.locator("#stage")
  await stage.focus()
  for (let i = 0; i < 25; i++) {
    if (await page.locator('[data-testid="lock"]').isEnabled()) break
    await stage.press("ArrowRight")
    await page.waitForTimeout(40)
  }
  record(
    `${vp.name} ${browserTag}: keyboard ${bed} lock enabled`,
    await page.locator('[data-testid="lock"]').isEnabled(),
  )
  if (await page.locator('[data-testid="lock"]').isEnabled()) {
    await stage.press("Enter")
  }
  await page.click('[data-testid="to-map"]')
  await page.waitForSelector('[data-testid="done-count"]')
}

async function completeMakingTenByDrag(page, vp, browserTag) {
  await page.click('[data-testid="bed-making-ten"]')
  await page.waitForTimeout(400)
  await page.click('[data-testid="start-try"]')
  await page.locator('[data-testid^="chip-"]').first().click()
  const dragged = await dragOn(page, '[data-testid="band-bottom"]', '[data-testid="band-top"]', 20)
  record(`${vp.name} ${browserTag}: making-ten drag`, dragged)
  for (let i = 0; i < 10; i++) {
    if (await page.locator('[data-testid="lock"]').isEnabled()) break
    await dragOn(page, '[data-testid="band-bottom"]', '[data-testid="band-top"]', 12)
  }
  record(
    `${vp.name} ${browserTag}: making-ten drag lock enabled`,
    await page.locator('[data-testid="lock"]').isEnabled(),
  )
  if (await page.locator('[data-testid="lock"]').isEnabled()) {
    await page.locator('[data-testid="lock"]').click()
  }
  await page.click('[data-testid="to-map"]')
}

async function recordBedVideo(context, bed, vp, browserTag) {
  const vidPage = await context.newPage()
  await vidPage.goto(BASE, { waitUntil: "networkidle" })
  await vidPage.waitForSelector('[data-testid="ready"]')
  await vidPage.click(`[data-testid="bed-${bed}"]`)
  await vidPage.waitForTimeout(250)
  await vidPage.click('[data-testid="start-try"]')
  await vidPage.locator('[data-testid^="chip-"]').first().click()
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

async function checkReloadProgress(page, vp, browserTag) {
  const countBefore = await page.locator('[data-testid="done-count"]').innerText()
  const nBefore = parseInt(countBefore.match(/(\d+)/)?.[1] ?? "0", 10)
  const storageBefore = await page.evaluate(() => {
    try {
      return localStorage.getItem("pips_math_garden_progress_v1") ?? ""
    } catch {
      return ""
    }
  })
  await page.reload({ waitUntil: "networkidle" })
  await page.waitForSelector('[data-testid="ready"]', { timeout: 15000 })
  const countAfter = await page.locator('[data-testid="done-count"]').innerText()
  const nAfter = parseInt(countAfter.match(/(\d+)/)?.[1] ?? "0", 10)
  const storageAfter = await page.evaluate(() => {
    try {
      return localStorage.getItem("pips_math_garden_progress_v1") ?? ""
    } catch {
      return ""
    }
  })
  record(
    `${vp.name} ${browserTag}: progress survives reload`,
    countAfter === countBefore &&
      nAfter === nBefore &&
      storageAfter.length > 0 &&
      storageAfter === storageBefore,
    `${countBefore} -> ${countAfter}`,
  )
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

  const gate = await page.locator('[data-testid="gate"]').boundingBox()
  const gateOk =
    !!gate &&
    gate.x >= -2 &&
    gate.y >= -2 &&
    gate.width >= 56 &&
    gate.height >= 56 &&
    gate.x + gate.width <= vp.width + 2 &&
    gate.y + gate.height <= vp.height + 2
  record(
    `${vp.name} ${browserTag}: gate visible`,
    gateOk,
    gate ? `${gate.width}x${gate.height}` : "missing",
  )

  for (const sel of ['[data-testid="calm-mode"]', '[data-testid="done-today"]']) {
    const { w, h } = await minTapTarget(page, sel)
    record(`${vp.name} ${browserTag}: 56px ${sel}`, w >= 56 && h >= 56, `${w}x${h}`)
  }

  await page.screenshot({ path: path.join(OUT, `${vp.name}-map-${browserTag}.png`) })

  for (const bed of beds) {
    await page.click(`[data-testid="bed-${bed}"]`)
    await page.waitForTimeout(500)
    await page.waitForSelector('[data-testid="start-try"]', { timeout: 12000 })
    record(`${vp.name} ${browserTag}: open ${bed}`, true)
    await page.click('[data-testid="start-try"]')
    await page.waitForSelector('[data-testid^="chip-"]', { timeout: 5000 })
    await page.locator('[data-testid^="chip-"]').first().click()
    await page.waitForSelector("#stage", { state: "visible" })
    const treeBefore = await page.locator("#aria").innerText()
    const ariaOk =
      !/\d+\s*\+\s*\d+\s*=\s*\d+/.test(treeBefore) && !treeBefore.match(/\d+ − \d+ = \d+/)
    record(
      `${vp.name} ${browserTag}: no answer in aria before lock ${bed}`,
      ariaOk,
      treeBefore.slice(0, 80),
    )
    if (bed === "relationship") {
      const eq0 = await page.locator('[data-testid="eq-0"]').innerText()
      record(
        `${vp.name} ${browserTag}: fact tentative before lock`,
        eq0.includes("?") && !eq0.match(/\d+ \+ \d+ make/),
        eq0,
      )
    }
    for (let i = 0; i < 15; i++) {
      const lock = page.locator('[data-testid="lock"]')
      if (await lock.isEnabled()) break
      const plus = page.locator("#step-plus")
      if (await plus.isEnabled()) await plus.click()
      else break
    }
    const lockBox = await minTapTarget(page, '[data-testid="lock"]')
    record(`${vp.name} ${browserTag}: lock 56px ${bed}`, lockBox.w >= 56 && lockBox.h >= 56)
    if (await page.locator('[data-testid="lock"]').isEnabled()) {
      await page.locator('[data-testid="lock"]').click()
    }
    await page.screenshot({
      path: path.join(OUT, `${vp.name}-${bed}-model-${browserTag}.png`),
    })
    await page.click('[data-testid="to-map"]')
    await page.waitForSelector('[data-testid="done-count"]')
  }

  if (vp.name === "phone-390x844" && browserTag === "chromium") {
    await completeMakingTenByDrag(page, vp, browserTag)
    for (const bed of beds) {
      await recordBedVideo(context, bed, vp, browserTag)
    }
    for (const bed of beds) {
      await completeBedByKeyboard(page, bed, vp, browserTag)
    }
    await checkReloadProgress(page, vp, browserTag)
  }

  await context.close()
  await browser.close()
}

async function main() {
  await mkdir(OUT, { recursive: true })
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
