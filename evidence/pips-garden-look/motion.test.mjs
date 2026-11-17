/**
 * Garden motion budget — run against built preview with Playwright.
 * Full transition inventory requires garden-map-demo MOTION-REVIEW + ported CSS; extends when demo bundle is present.
 */
import { writeFile } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { chromium } from "playwright"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const BASE = process.env.PREVIEW_URL ?? "http://127.0.0.1:4173"
const MAX_MS = 300
const DEFAULT_EASE = "cubic-bezier(0.23, 1, 0.32, 1)"

async function parseTransitionMs(value) {
  if (!value || value === "none" || value === "all 0s ease 0s") return 0
  const m = value.match(/([\d.]+)m?s/)
  if (!m) return 0
  const n = parseFloat(m[1])
  return value.includes("ms") ? n : n * 1000
}

async function main() {
  const browser = await chromium.launch()
  const page = await browser.newPage()
  await page.goto(`${BASE}/`)
  await page.setViewportSize({ width: 1180, height: 820 })

  const violations = []

  const owl = page.locator('[data-testid="pip-owl-map"]').first()
  if (await owl.count()) {
    const tr = await owl.evaluate((el) => getComputedStyle(el).transition)
    const ms = await parseTransitionMs(tr)
    if (ms > MAX_MS) {
      violations.push({ selector: "pip-owl-map", transition: tr, ms, note: "PR16 baseline 400–480ms" })
    }
    if (tr && !/transform|opacity/i.test(tr) && tr !== "none") {
      violations.push({ selector: "pip-owl-map", transition: tr, note: "non transform/opacity" })
    }
  }

  await page.keyboard.press("ArrowRight")
  const stageSvg = page.locator("#stage svg").first()
  if (await stageSvg.count()) {
    const tr = await stageSvg.evaluate((el) => getComputedStyle(el).transition)
    if (tr && tr !== "none" && !/0s|0ms/.test(tr)) {
      violations.push({ selector: "#stage svg", transition: tr, note: "keyboard should not animate" })
    }
  }

  await browser.close()

  const reviewAnimationsVerdict =
    violations.length === 0
      ? "PASS (partial audit — full review-animations skill blocked: missing ~/garden-design/skills/)"
      : `FAIL (partial): ${violations.length} violation(s); run review-animations after demo port. Default ease target: ${DEFAULT_EASE}.`

  const out = {
    at: new Date().toISOString(),
    maxMs: MAX_MS,
    violations,
    reviewAnimationsVerdict,
    pass: violations.length === 0,
  }
  await writeFile(path.join(__dirname, "motion-results.json"), JSON.stringify(out, null, 2))
  console.log(JSON.stringify(out, null, 2))
  process.exit(out.pass ? 0 : 1)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})