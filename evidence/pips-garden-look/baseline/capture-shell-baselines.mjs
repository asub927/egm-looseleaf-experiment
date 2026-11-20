/**
 * Capture counting-on shell parity rows from unmodified garden-map-demo/garden.html.
 * Usage: node capture-shell-baselines.mjs <engine> <outShotsDir>
 * engine: chromium | webkit (webkit rows are compared against React in WebKit)
 */
import { mkdir, writeFile } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { chromium, webkit } from "playwright"
import { CONFIGS, runShellScenario } from "../garden-scenario.mjs"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DEMO =
  process.env.GARDEN_DEMO_DIR ??
  path.join(process.env.HOME ?? "/home/ubuntu", "garden-design/design/garden-map-demo")
const FILE = `file://${path.resolve(DEMO, "garden.html")}`

const STUB = `
  window.__spoken=[];window.__events=[];
  try{
    const synth={speak(u){window.__spoken.push(u&&u.text)},cancel(){},pause(){},resume(){},getVoices(){return[]},speaking:false,pending:false};
    Object.defineProperty(window,"speechSynthesis",{value:synth,configurable:true});
    window.SpeechSynthesisUtterance=function(t){this.text=t};
  }catch(e){}
`

const engineName = process.argv[2] ?? "webkit"
const outShots = path.resolve(process.argv[3] ?? path.join(__dirname, "webkit/shots"))
const launcher = engineName === "webkit" ? webkit : chromium
const BLOCKING = new Set([
  "desk-1280x800-mouse",
  "rm-1280x800-mouse",
  "ipad-1024x768-touch",
  "ipad-768x1024-touch",
])
const WANT = new Set(["b2-counting-on-1story", "b2-counting-on-4sheet", "b2-counting-on-5win"])

async function resetDemo(page) {
  await page.evaluate(() => {
    if (!window.__app?.APP) return
    const A = window.__app.APP
    A.done = {}
    A.solved = {}
    A.leaves = 0
    A.owlAt = 0
    A.rested = false
    A.sessionDone = 0
    window.__app.refreshPets?.()
    window.__app.updateMap?.()
    if (typeof window.__app.showMap === "function") window.__app.showMap()
  })
}

async function main() {
  await mkdir(outShots, { recursive: true })
  const launchOpts =
    engineName === "chromium"
      ? {
          executablePath: process.env.CHROME_PATH || "/usr/bin/google-chrome-stable",
          args: ["--allow-file-access-from-files"],
        }
      : {}

  const browser = await launcher.launch(launchOpts)

  for (const config of CONFIGS.filter((c) => BLOCKING.has(c.tag))) {
    const ctx = await browser.newContext({
      viewport: { width: config.width, height: config.height },
      hasTouch: config.touch,
      reducedMotion: config.rm ? "reduce" : "no-preference",
    })
    await ctx.addInitScript(STUB)
    const page = await ctx.newPage()
    page.on("pageerror", (e) => console.error(`PAGEERR ${config.tag}`, e.message))

    const shot = async (id, buffer) => {
      if (!WANT.has(id)) return
      const dest = path.join(outShots, `${config.tag}-${id}.png`)
      await writeFile(dest, buffer)
      console.log("wrote", dest)
    }

    await page.goto(FILE, { waitUntil: "load" })
    await page.waitForSelector('[data-testid="ready"]', { timeout: 15000 })
    await resetDemo(page)
    await page.reload({ waitUntil: "load" })
    await page.waitForSelector('[data-testid="ready"]', { timeout: 15000 })

    await runShellScenario(page, config, shot, FILE)

    await ctx.close()
  }

  await browser.close()
  console.log("done", engineName, outShots)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})