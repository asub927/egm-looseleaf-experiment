/**
 * Capture map-related baseline PNGs from unmodified garden-map-demo/garden.html.
 * Usage: node capture-map-baselines.mjs <engine> <outShotsDir> <outShotsMapDir> [screens...]
 * engine: chromium | webkit
 * Default screens: 01-map,02-map-3done,03-map-all-done,fresh,3done
 */
import { mkdir, writeFile } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { chromium, webkit } from "playwright"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DEMO =
  process.env.GARDEN_DEMO_DIR ??
  path.join(process.env.HOME ?? "/home/ubuntu", "garden-design/design/garden-map-demo")
const FILE = `file://${path.resolve(DEMO, "garden.html")}`

const SHOT_CONFIGS = [
  { tag: "desk-1280x800-mouse", width: 1280, height: 800, touch: false, rm: false },
  { tag: "ipad-1024x768-touch", width: 1024, height: 768, touch: true, rm: false },
  { tag: "ipad-768x1024-touch", width: 768, height: 1024, touch: true, rm: false },
  { tag: "phone-390x844-touch", width: 390, height: 844, touch: true, rm: false },
  { tag: "rm-1280x800-mouse", width: 1280, height: 800, touch: false, rm: true },
]

const MAP_ONLY_CONFIGS = [
  { tag: "ipad-1024x768", width: 1024, height: 768, touch: true },
  { tag: "ipad-768x1024", width: 768, height: 1024, touch: true },
  { tag: "phone-390x844", width: 390, height: 844, touch: true },
]

const STUB = `
  window.__spoken=[];window.__events=[];
  try{
    const synth={speak(u){window.__spoken.push(u&&u.text)},cancel(){},pause(){},resume(){},getVoices(){return[]},speaking:false,pending:false};
    Object.defineProperty(window,"speechSynthesis",{value:synth,configurable:true});
    window.SpeechSynthesisUtterance=function(t){this.text=t};
  }catch(e){}
`

const engineName = process.argv[2] ?? "chromium"
const outShots = path.resolve(process.argv[3] ?? path.join(__dirname, "chromium/shots"))
const outShotsMap = path.resolve(process.argv[4] ?? path.join(__dirname, "chromium/shots-map"))
const want = new Set(
  (process.argv[5] ?? "01-map,02-map-3done,03-map-all-done,fresh,3done").split(",").map((s) => s.trim()),
)

const launcher = engineName === "webkit" ? webkit : chromium

async function ready(page) {
  await page.waitForSelector('[data-testid="ready"]', { timeout: 15000 })
  await page.waitForTimeout(80)
}

async function layoutMap(page) {
  await page.evaluate(() => {
    if (typeof window.__app?.layoutMap === "function") window.__app.layoutMap(true)
  })
  await page.waitForTimeout(engineName === "webkit" ? 100 : 60)
}

async function seedFresh(page) {
  await page.evaluate(() => {
    const A = window.__app.APP
    A.done = {}
    A.leaves = 0
    A.owlAt = 0
    A.rested = false
    A.sessionDone = 0
    window.__app.refreshPets()
    window.__app.updateMap()
  })
}

async function seedThreeDone(page) {
  await page.evaluate(() => {
    const A = window.__app.APP
    A.done = { "making-ten": true, "counting-on": true, decomposing: true }
    A.leaves = 6
    A.owlAt = 0
    A.rested = true
    A.sessionDone = 3
    window.__app.refreshPets()
    window.__app.updateMap()
  })
}

async function seedAllDone(page) {
  await page.evaluate(() => {
    const A = window.__app.APP
    const keys = [
      "making-ten",
      "counting-on",
      "decomposing",
      "equivalent-sums",
      "relationship",
      "number-line",
    ]
    A.done = Object.fromEntries(keys.map((k) => [k, true]))
    A.leaves = 12
    A.owlAt = 0
    A.rested = true
    A.sessionDone = 6
    window.__app.refreshPets()
    window.__app.updateMap()
  })
}

async function snap(page, dest) {
  await mkdir(path.dirname(dest), { recursive: true })
  const buf = await page.screenshot({ fullPage: false })
  await writeFile(dest, buf)
  console.log("wrote", dest)
}

async function main() {
  await mkdir(outShots, { recursive: true })
  await mkdir(outShotsMap, { recursive: true })

  const launchOpts =
    engineName === "chromium"
      ? {
          executablePath: process.env.CHROME_PATH || "/usr/bin/google-chrome-stable",
          args: ["--allow-file-access-from-files"],
        }
      : {}

  const browser = await launcher.launch(launchOpts)

  for (const c of SHOT_CONFIGS) {
    const ctx = await browser.newContext({
      viewport: { width: c.width, height: c.height },
      hasTouch: c.touch,
      reducedMotion: c.rm ? "reduce" : "no-preference",
    })
    await ctx.addInitScript(STUB)
    const page = await ctx.newPage()
    page.on("pageerror", (e) => console.error(`PAGEERR ${c.tag}`, e.message))
    await page.goto(FILE)
    await ready(page)

    if (want.has("01-map")) {
      await seedFresh(page)
      await layoutMap(page)
      await snap(page, path.join(outShots, `${c.tag}-01-map.png`))
    }

    if (want.has("02-map-3done")) {
      await seedThreeDone(page)
      await layoutMap(page)
      await snap(page, path.join(outShots, `${c.tag}-02-map-3done.png`))
    }

    if (want.has("03-map-all-done")) {
      await seedAllDone(page)
      await layoutMap(page)
      await snap(page, path.join(outShots, `${c.tag}-03-map-all-done.png`))
    }

    await ctx.close()
  }

  for (const c of MAP_ONLY_CONFIGS) {
    const ctx = await browser.newContext({
      viewport: { width: c.width, height: c.height },
      hasTouch: c.touch,
      reducedMotion: "no-preference",
    })
    await ctx.addInitScript(STUB)
    const page = await ctx.newPage()
    await page.goto(FILE)
    await ready(page)

    if (want.has("fresh")) {
      await seedFresh(page)
      await layoutMap(page)
      await snap(page, path.join(outShotsMap, `${c.tag}-fresh.png`))
    }

    if (want.has("3done")) {
      await seedThreeDone(page)
      await layoutMap(page)
      await snap(page, path.join(outShotsMap, `${c.tag}-3done.png`))
    }

    await ctx.close()
  }

  await browser.close()
  console.log("done", engineName, outShots, outShotsMap)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})