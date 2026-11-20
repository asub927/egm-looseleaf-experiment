/**
 * Playwright navigation for each baseline screen id (ported from garden-map-demo verify.mjs
 * with React app data-testid selectors from evidence/pips-math-garden/verify.mjs).
 */

export const BED_ORDER = [
  "making-ten",
  "counting-on",
  "decomposing",
  "equivalent-sums",
  "relationship",
  "number-line",
]

const GUESS_WRONG = {
  "making-ten": 12,
  "counting-on": 11,
  decomposing: 7,
  "equivalent-sums": 11,
  relationship: 4,
  "number-line": 14,
}

const WRONG_DRAG = {
  "making-ten": {
    moves: [{ from: '[data-testid="band-bottom"]', to: '[data-testid="band-top"]' }],
  },
  "counting-on": { from: '[data-testid="engine"]', to: '[data-testid="car-11"]', repeats: 1 },
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
    ],
  },
  relationship: { from: '[data-testid="tile-4"]', to: '[data-testid="slot"]', repeats: 1 },
  "number-line": { from: '[data-testid="flag"]', to: '[data-testid="tick-14"]', repeats: 1 },
}

const RIGHT_DRAG = {
  "making-ten": {
    moves: [{ from: '[data-testid="band-bottom"]', to: '[data-testid="band-top"]' }],
  },
  "counting-on": { from: '[data-testid="engine"]', to: '[data-testid="car-12"]', repeats: 1 },
  decomposing: { moves: [{ from: '[data-testid="cut"]', to: '[data-testid="dot-8"]' }] },
  "equivalent-sums": {
    moves: [{ from: '[data-testid="apple-l-6"]', to: '[data-testid="apple-l-0"]' }],
  },
  relationship: { from: '[data-testid="tile-5"]', to: '[data-testid="slot"]', repeats: 1 },
  "number-line": { from: '[data-testid="flag"]', to: '[data-testid="tick-15"]', repeats: 1 },
}

const ANS = {
  "making-ten:8+5": 13,
  "making-ten:9+4": 13,
  "counting-on:9+3": 12,
  "counting-on:12+2": 14,
  "decomposing:13-5": 8,
  "decomposing:14-6": 8,
  "equivalent-sums:7+5": 12,
  "equivalent-sums:9+7": 16,
  "relationship:13-8": 5,
  "relationship:15-9": 6,
  "number-line:8+7": 15,
  "number-line:9+5": 14,
}

export const CONFIGS = [
  { tag: "desk-1280x800-mouse", width: 1280, height: 800, touch: false, rm: false },
  { tag: "ipad-1024x768-touch", width: 1024, height: 768, touch: true, rm: false },
  { tag: "ipad-768x1024-touch", width: 768, height: 1024, touch: true, rm: false },
  { tag: "phone-390x844-touch", width: 390, height: 844, touch: true, rm: false },
  { tag: "rm-1280x800-mouse", width: 1280, height: 800, touch: false, rm: true },
]

export const MAP_SNAPSHOTS = [
  { tag: "ipad-1024x768", width: 1024, height: 768, touch: true },
  { tag: "ipad-768x1024", width: 768, height: 1024, touch: true },
  { tag: "phone-390x844", width: 390, height: 844, touch: true },
]

const PROGRESS_KEY = "pips_math_garden_progress_v1"

export function bedShotPrefix(index) {
  const bed = BED_ORDER[index]
  return `b${index + 1}-${bed}`
}

export function parseBaselineFilename(name) {
  for (const c of CONFIGS) {
    if (name.startsWith(`${c.tag}-`) && name.endsWith(".png")) {
      return {
        kind: "shots",
        configTag: c.tag,
        screenId: name.slice(c.tag.length + 1, -4),
        baselineName: name,
      }
    }
  }
  for (const m of MAP_SNAPSHOTS) {
    if (name.startsWith(`${m.tag}-`) && name.endsWith(".png")) {
      return {
        kind: "shots-map",
        configTag: m.tag,
        screenId: name.slice(m.tag.length + 1, -4),
        baselineName: name,
        mapConfig: m,
      }
    }
  }
  return null
}

function waitMs(page, ms, rm) {
  return page.waitForTimeout(rm ? Math.max(40, Math.floor(ms * 0.35)) : ms)
}

async function tap(page, selector, touch) {
  const loc = page.locator(selector).first()
  await loc.scrollIntoViewIfNeeded()
  if (touch) await loc.tap()
  else await loc.click()
  await page.waitForTimeout(180)
}

async function touchCdp(page, touch) {
  if (!touch) return null
  if (page._gardenTouchCdp === false) return null
  if (!page._gardenTouchCdp) {
    try {
      page._gardenTouchCdp = await page.context().newCDPSession(page)
    } catch {
      page._gardenTouchCdp = false
      return null
    }
  }
  return page._gardenTouchCdp
}

async function dragOn(page, fromSel, toSel, steps = 18, touch = false) {
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
  const cdp = await touchCdp(page, touch)
  if (touch && !cdp) {
    await from.dragTo(to, { steps })
    await page.waitForTimeout(420)
    return true
  }
  if (touch && cdp) {
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchStart",
      touchPoints: [{ x: fx, y: fy, id: 1 }],
    })
    for (let i = 1; i <= steps; i++) {
      const t = i / steps
      const px = fx + (tx - fx) * t
      const py = fy + (ty - fy) * t
      await cdp.send("Input.dispatchTouchEvent", {
        type: "touchMove",
        touchPoints: [{ x: px, y: py, id: 1 }],
      })
      await page.waitForTimeout(12)
    }
    for (let k = 0; k < 3; k++) {
      await cdp.send("Input.dispatchTouchEvent", {
        type: "touchMove",
        touchPoints: [{ x: tx, y: ty, id: 1 }],
      })
      await page.waitForTimeout(60)
    }
    await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] })
  } else {
    await page.mouse.move(fx, fy)
    await page.mouse.down()
    for (let i = 1; i <= steps; i++) {
      const t = i / steps
      await page.mouse.move(fx + (tx - fx) * t, fy + (ty - fy) * t, { steps: 1 })
      await page.waitForTimeout(12)
    }
    await page.mouse.up()
  }
  await page.waitForTimeout(touch ? 420 : 320)
  return true
}

async function runDragPlan(page, plan, touch = false) {
  const moves =
    plan.moves ?? (plan.from ? Array.from({ length: plan.repeats ?? 1 }, () => plan) : [])
  for (const move of moves) {
    await dragOn(page, move.from, move.to, 20, touch)
  }
}

async function resetProgress(page) {
  await page.evaluate((key) => {
    localStorage.setItem(
      key,
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
  }, PROGRESS_KEY)
}

async function setAllBedsDone(page, owlBedIndex = 0) {
  await page.evaluate(
    ([key, owl]) => {
      localStorage.setItem(
        key,
        JSON.stringify({
          schemaVersion: 1,
          solvedBedIds: [
            "making-ten",
            "counting-on",
            "decomposing",
            "equivalent-sums",
            "relationship",
            "number-line",
          ],
          solvedProblemKeys: [],
          mossLeaves: 12,
          sessionBedsFinished: 6,
          restedThisSession: true,
          calmMode: false,
          owlBedIndex: owl,
        }),
      )
    },
    [PROGRESS_KEY, owlBedIndex],
  )
}

async function seedRestScreen(page) {
  await page.evaluate((key) => {
    localStorage.setItem(
      key,
      JSON.stringify({
        schemaVersion: 1,
        solvedBedIds: ["making-ten", "counting-on", "decomposing"],
        solvedProblemKeys: [],
        mossLeaves: 6,
        sessionBedsFinished: 3,
        restedThisSession: false,
        calmMode: false,
        owlBedIndex: 0,
      }),
    )
  }, PROGRESS_KEY)
}

async function setThreeBedsDone(page, owlBedIndex = 0) {
  await page.evaluate(
    ([key, owl]) => {
      localStorage.setItem(
        key,
        JSON.stringify({
          schemaVersion: 1,
          solvedBedIds: ["making-ten", "counting-on", "decomposing"],
          solvedProblemKeys: [],
          mossLeaves: 6,
          sessionBedsFinished: 3,
          restedThisSession: true,
          calmMode: false,
          owlBedIndex: owl,
        }),
      )
    },
    [PROGRESS_KEY, owlBedIndex],
  )
}

async function waitMap(page, rm) {
  await page.waitForSelector('[data-testid="garden-canvas"]', { timeout: 12000 })
  await page.waitForFunction(
    () => {
      const g = document.querySelector('[data-testid="garden"]')
      return g && g.clientWidth > 48 && g.clientHeight > 48
    },
    { timeout: 12000 },
  )
  await page.evaluate(
    () =>
      new Promise((resolve) => {
        requestAnimationFrame(() => requestAnimationFrame(resolve))
      }),
  )
  await waitMs(page, rm ? 150 : 500, rm)
}

async function waitLesson(page, rm) {
  await page.waitForSelector('[data-testid="strategy-chip"]', { timeout: 12000 })
  await waitMs(page, rm ? 200 : 450, rm)
}

async function openBed(page, bed, touch, rm) {
  await tap(page, `[data-testid="bed-${bed}"]`, touch)
  await waitLesson(page, rm)
}

async function advanceWorksheet(page, touch) {
  for (let i = 0; i < 8; i++) {
    const next = page.locator('[data-testid="ws-next"]')
    if ((await next.count()) === 0) break
    if (!(await next.isVisible().catch(() => false))) break
    await tap(page, '[data-testid="ws-next"]', touch)
    await page.waitForTimeout(120)
  }
}

async function ensureLock(page, bed) {
  for (let i = 0; i < 16; i++) {
    if (await page.locator('[data-testid="lock"]').isEnabled()) return
    if (bed === "equivalent-sums") {
      const sel = i % 3 === 2 ? "#step-minus" : "#step-plus"
      if (await page.locator(sel).isEnabled()) await page.locator(sel).click()
    } else if (await page.locator("#step-plus").isEnabled()) {
      await page.locator("#step-plus").click()
    } else break
    await page.waitForTimeout(80)
  }
}

const PROBLEM2_ID = {
  "making-ten": "9+4",
  "counting-on": "12+2",
  decomposing: "14-6",
  "equivalent-sums": "9+7",
  relationship: "15-9",
  "number-line": "9+5",
}

async function finishProblemTwo(page, bed, touch) {
  await tap(page, '[data-testid="next"]', touch)
  await page.waitForSelector('[data-testid="start-try"]', { timeout: 12000 })
  await tap(page, '[data-testid="start-try"]', touch)
  const pid = `${bed}:${PROBLEM2_ID[bed]}`
  const ans = ANS[pid]
  if (ans) await tap(page, `[data-testid="chip-${ans}"]`, touch)
  await page.waitForSelector("#stage", { state: "visible" })
  await page.waitForTimeout(250)
  if (bed === "equivalent-sums") {
    for (let i = 0; i < 8; i++) {
      if (await page.locator('[data-testid="lock"]').isEnabled()) break
      const sel = i % 3 === 2 ? "#step-minus" : "#step-plus"
      if (await page.locator(sel).isEnabled()) await page.locator(sel).click()
    }
  } else {
    const p2Plan = {
      "making-ten": {
        moves: [{ from: '[data-testid="band-bottom"]', to: '[data-testid="band-top"]' }],
      },
      "counting-on": {
        moves: [{ from: '[data-testid="engine"]', to: '[data-testid="car-14"]' }],
      },
      decomposing: { moves: [{ from: '[data-testid="cut"]', to: '[data-testid="dot-8"]' }] },
      relationship: {
        moves: [{ from: '[data-testid="tile-6"]', to: '[data-testid="slot"]' }],
      },
      "number-line": {
        moves: [{ from: '[data-testid="flag"]', to: '[data-testid="tick-14"]' }],
      },
    }
    await runDragPlan(page, p2Plan[bed], touch)
    await ensureLock(page, bed)
  }
  if (await page.locator('[data-testid="lock"]').isEnabled()) {
    await tap(page, '[data-testid="lock"]', touch)
  }
  await page.waitForSelector('[data-testid="win"]', { timeout: 20000 })
  await tap(page, '[data-testid="next"]', touch)
  await waitMs(page, 400, false)
}

/** Counting-on shell rows + seeded rest (harness --only=shell). */
export async function runShellScenario(page, config, shot, baseUrl) {
  const { touch, rm } = config
  const bed = "counting-on"
  const prefix = "b2-counting-on"
  await page.goto(baseUrl, { waitUntil: "networkidle" })
  await resetProgress(page)
  await page.reload({ waitUntil: "networkidle" })
  await page.waitForSelector('[data-testid="ready"]', { timeout: 15000 })
  await waitMs(page, 300, rm)

  await openBed(page, bed, touch, rm)
  await shot(`${prefix}-1story`, await page.screenshot({ fullPage: true }))

  await tap(page, '[data-testid="start-try"]', touch)
  await tap(page, `[data-testid="chip-${GUESS_WRONG[bed]}"]`, touch)
  await page.waitForTimeout(300)
  await runDragPlan(page, WRONG_DRAG[bed], touch)
  await tap(page, '[data-testid="lock"]', touch)
  await waitMs(page, 300, rm)
  await tap(page, '[data-testid="lock"]', touch)
  await waitMs(page, 250, rm)
  await tap(page, '[data-testid="lock"]', touch)
  await waitMs(page, 250, rm)
  await advanceWorksheet(page, touch)
  await shot(`${prefix}-4sheet`, await page.screenshot({ fullPage: true }))

  if (await page.locator("#reset").isEnabled().catch(() => false)) {
    await page.locator("#reset").click()
    await page.waitForTimeout(200)
  }
  await runDragPlan(page, RIGHT_DRAG[bed], touch)
  await ensureLock(page, bed)
  await tap(page, '[data-testid="lock"]', touch)
  await waitMs(page, 350, rm)
  await page.waitForSelector('[data-testid="win"]', { timeout: 15000 })
  await shot(`${prefix}-5win`, await page.screenshot({ fullPage: true }))

  if (process.env.HARNESS_SKIP_REST === "1") return

  await seedRestScreen(page)
  await page.reload({ waitUntil: "networkidle" })
  await page.waitForSelector('[data-testid="ready"]', { timeout: 15000 })
  await page.waitForSelector('[data-testid="rest-pip"]', { timeout: 15000 })
  await waitMs(page, rm ? 150 : 400, rm)
  await shot("06-rest", await page.screenshot({ fullPage: true }))
}

/**
 * Run the full lesson walkthrough and invoke shot(id, buffer) for each captured PNG.
 */
export async function runMainScenario(page, config, shot, baseUrl) {
  const { touch, rm } = config
  await page.goto(baseUrl, { waitUntil: "networkidle" })
  await resetProgress(page)
  await page.reload({ waitUntil: "networkidle" })
  await page.waitForSelector('[data-testid="ready"]', { timeout: 15000 })
  await waitMs(page, 300, rm)

  await shot("01-map", await page.screenshot({ fullPage: true }))

  let bedsDone = 0
  for (let bi = 0; bi < BED_ORDER.length; bi++) {
    const bed = BED_ORDER[bi]
    const prefix = bedShotPrefix(bi)
    await openBed(page, bed, touch, rm)

    await shot(`${prefix}-1story`, await page.screenshot({ fullPage: true }))

    await tap(page, '[data-testid="start-try"]', touch)
    await tap(page, `[data-testid="chip-${GUESS_WRONG[bed]}"]`, touch)
    await page.waitForTimeout(300)

    await runDragPlan(page, WRONG_DRAG[bed], touch)
    await shot(`${prefix}-2drag`, await page.screenshot({ fullPage: true }))

    await tap(page, '[data-testid="lock"]', touch)
    await waitMs(page, 300, rm)
    await shot(`${prefix}-3wrong`, await page.screenshot({ fullPage: true }))

    await tap(page, '[data-testid="lock"]', touch)
    await waitMs(page, 250, rm)
    await tap(page, '[data-testid="lock"]', touch)
    await waitMs(page, 250, rm)
    await advanceWorksheet(page, touch)
    await shot(`${prefix}-4sheet`, await page.screenshot({ fullPage: true }))

    if (await page.locator("#reset").isEnabled().catch(() => false)) {
      await page.locator("#reset").click()
      await page.waitForTimeout(200)
    }
    await runDragPlan(page, RIGHT_DRAG[bed], touch)
    await ensureLock(page, bed)
    await tap(page, '[data-testid="lock"]', touch)
    await waitMs(page, 350, rm)
    await page.waitForSelector('[data-testid="win"]', { timeout: 15000 })
    await shot(`${prefix}-5win`, await page.screenshot({ fullPage: true }))

    await finishProblemTwo(page, bed, touch)
    bedsDone++

    if (bedsDone === 3) {
      await page.waitForSelector('[data-testid="rest-pip"]', { timeout: 15000 })
      await waitMs(page, rm ? 150 : 400, rm)
      await shot("06-rest", await page.screenshot({ fullPage: true }))
      await tap(page, '[data-testid="all-done"]', touch)
      await waitMap(page, rm)
      await shot("02-map-3done", await page.screenshot({ fullPage: true }))
    } else {
      await page.waitForSelector('[data-testid="garden-canvas"]', { timeout: 12000 })
      await waitMap(page, rm)
    }
  }
}

const MAP_SCREEN_IDS = new Set(["01-map", "02-map-3done", "03-map-all-done", "fresh", "3done"])

export function isMapScreenId(screenId) {
  return MAP_SCREEN_IDS.has(screenId)
}

/** Shell parity rows (counting-on vehicle + rest). */
const SHELL_SCREEN_SUFFIX = new Set(["1story", "4sheet", "5win"])

export function isShellScreenId(screenId) {
  if (screenId === "06-rest") return true
  if (!screenId.startsWith("b2-counting-on-")) return false
  const suffix = screenId.slice("b2-counting-on-".length)
  return SHELL_SCREEN_SUFFIX.has(suffix)
}

/** Map baselines only (no lesson walkthrough). */
export async function runMapOnlyForConfig(page, config, shot, baseUrl) {
  const { rm } = config
  await page.goto(baseUrl, { waitUntil: "networkidle" })
  await resetProgress(page)
  await page.reload({ waitUntil: "networkidle" })
  await page.waitForSelector('[data-testid="ready"]', { timeout: 15000 })
  await waitMap(page, rm)
  await shot("01-map", await page.screenshot({ fullPage: false }))
  await setThreeBedsDone(page, 0)
  await page.reload({ waitUntil: "networkidle" })
  await page.waitForSelector('[data-testid="ready"]', { timeout: 15000 })
  await waitMap(page, rm)
  await page.waitForTimeout(rm ? 80 : 200)
  await shot("02-map-3done", await page.screenshot({ fullPage: false }))
  await setAllBedsDone(page, 0)
  await page.reload({ waitUntil: "networkidle" })
  await page.waitForSelector('[data-testid="ready"]', { timeout: 15000 })
  await waitMap(page, rm)
  await page.waitForTimeout(rm ? 80 : 200)
  await shot("03-map-all-done", await page.screenshot({ fullPage: false }))
}

export async function runMapSnapshots(page, mapConfig, shot, baseUrl) {
  await page.goto(baseUrl, { waitUntil: "networkidle" })
  await resetProgress(page)
  await page.reload({ waitUntil: "networkidle" })
  await page.waitForSelector('[data-testid="ready"]', { timeout: 15000 })
  await waitMap(page, false)
  await shot("fresh", await page.screenshot({ fullPage: false }))
  // shot-map.mjs keeps Pip at the home perch (owl index 0) when capturing 3done.
  await setThreeBedsDone(page, 0)
  await page.reload({ waitUntil: "networkidle" })
  await page.waitForSelector('[data-testid="ready"]', { timeout: 15000 })
  await waitMap(page, false)
  await shot("3done", await page.screenshot({ fullPage: false }))
}

/** Example NAV row for one bed (making-ten / b1). */
export const EXAMPLE_NAV = [
  { screenId: "01-map", steps: "goto /, wait [data-testid=ready]" },
  {
    screenId: "b1-making-ten-1story",
    steps: "click [data-testid=bed-making-ten], wait [data-testid=strategy-chip]",
  },
  {
    screenId: "b1-making-ten-2drag",
    steps: "start-try → chip-12 → WRONG_DRAG making-ten",
  },
  {
    screenId: "b1-making-ten-3wrong",
    steps: "Lock it in (wrong) → peach bubble",
  },
  {
    screenId: "b1-making-ten-4sheet",
    steps: "Lock ×2 → ws-next through worksheet",
  },
  {
    screenId: "b1-making-ten-5win",
    steps: "RIGHT_DRAG → Lock → [data-testid=win]",
  },
]
