import { mkdir, writeFile } from "node:fs/promises"
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

async function runConfig(browserType, vp) {
  const browser = await browserType.launch()
  const context = await browser.newContext({ viewport: { width: vp.width, height: vp.height } })
  const page = await context.newPage()
  await page.goto(BASE, { waitUntil: "networkidle" })
  await page.waitForSelector('[data-testid="ready"]', { timeout: 15000 })
  record(`${vp.name}: ready`, true)

  const gate = await page.locator('[data-testid="gate"]').boundingBox()
  record(
    `${vp.name}: gate visible`,
    !!gate && gate.width >= 56 && gate.height >= 56,
    gate ? `${gate.width}x${gate.height}` : "missing",
  )

  for (const sel of ['[data-testid="calm-mode"]', '[data-testid="done-today"]']) {
    const { w, h } = await minTapTarget(page, sel)
    record(`${vp.name}: 56px ${sel}`, w >= 56 && h >= 56, `${w}x${h}`)
  }

  await page.screenshot({ path: path.join(OUT, `${vp.name}-map.png`) })

  for (const bed of beds) {
    await page.click(`[data-testid="bed-${bed}"]`)
    await page.waitForTimeout(500)
    await page.waitForSelector('[data-testid="start-try"]', { timeout: 12000 })
    record(`${vp.name}: open ${bed}`, true)
    await page.click('[data-testid="start-try"]')
    await page.waitForSelector('[data-testid^="chip-"]', { timeout: 5000 })
    await page.locator('[data-testid^="chip-"]').first().click()
    await page.waitForSelector("#stage", { state: "visible" })
    const treeBefore = await page.locator("#aria").innerText()
    record(
      `${vp.name}: no answer in aria before lock ${bed}`,
      !treeBefore.includes("=") || treeBefore.includes("?"),
      treeBefore.slice(0, 80),
    )
    for (let i = 0; i < 15; i++) {
      const lock = page.locator('[data-testid="lock"]')
      if (await lock.isEnabled()) break
      const plus = page.locator("#step-plus")
      if (await plus.isEnabled()) await plus.click()
      else break
    }
    const lockBox = await minTapTarget(page, '[data-testid="lock"]')
    record(`${vp.name}: lock 56px ${bed}`, lockBox.w >= 56 && lockBox.h >= 56)
    if (await page.locator('[data-testid="lock"]').isEnabled()) {
      await page.locator('[data-testid="lock"]').click()
    }
    await page.screenshot({ path: path.join(OUT, `${vp.name}-${bed}-model.png`) })
    await page.click('[data-testid="to-map"]')
    await page.waitForSelector('[data-testid="done-count"]')
  }

  await browser.close()
}

async function main() {
  await mkdir(OUT, { recursive: true })
  for (const vp of viewports) {
    await runConfig(chromium, vp)
    try {
      await runConfig(webkit, vp)
    } catch (e) {
      record(`${vp.name}: webkit`, false, String(e))
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
