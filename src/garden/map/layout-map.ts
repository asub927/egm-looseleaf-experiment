import { DECOR } from "./decor"
import { clamp, el, svgIn } from "./svg-dom"

export const OWL_WALK_MS = 280 as const

export interface Spot {
  x: number
  y: number
}

export interface GardenLayoutRefs {
  mapRoot: HTMLElement
  garden: HTMLElement
  bar: HTMLElement
  maptalk: HTMLElement
  scenery: SVGSVGElement
  pathsvg: SVGSVGElement
  critters: HTMLElement
  owl: HTMLElement
  beds: HTMLButtonElement[]
}

type RectObs = { x: number; y: number; w: number; h: number }

export interface Placer {
  find: (
    w: number,
    h: number,
    px: number,
    py: number,
    box: [number, number, number, number],
    o?: Record<string, unknown>,
  ) => { x: number; y: number } | null
  free: (r: RectObs, o?: Record<string, unknown>) => boolean
  add: (r: RectObs) => void
}

let HILL0 = 0.355

export function chromeH(refs: GardenLayoutRefs): number {
  const g = refs.garden
  void refs.mapRoot
  const bar = refs.bar
  const talk = refs.maptalk
  const gr = g.getBoundingClientRect()
  return (
    Math.max(bar.getBoundingClientRect().bottom, talk.getBoundingClientRect().bottom) - gr.top + 10
  )
}

function bedSpots(W: number, H: number, chromePx: number): Spot[] {
  const top = Math.max(0.18, chromePx / H)
  const bot = W / H >= 1.05 ? 0.07 : 0.1
  const span = 1 - top - bot
  const Y = (t: number) => top + t * span
  const wide = W >= 820 && W / H >= 1.05
  if (wide) {
    return [
      { x: 0.16, y: Y(0.56) },
      { x: 0.34, y: Y(0.18) },
      { x: 0.52, y: Y(0.48) },
      { x: 0.68, y: Y(0.14) },
      { x: 0.84, y: Y(0.44) },
      { x: 0.7, y: Y(0.84) },
    ]
  }
  return [
    { x: 0.28, y: Y(0.07) },
    { x: 0.72, y: Y(0.23) },
    { x: 0.28, y: Y(0.41) },
    { x: 0.72, y: Y(0.58) },
    { x: 0.28, y: Y(0.75) },
    { x: 0.72, y: Y(0.91) },
  ]
}

function curvePath(P: number[][]): string {
  let d = `M${P[0][0]} ${P[0][1]}`
  for (let i = 0; i < P.length - 1; i++) {
    const p0 = P[Math.max(0, i - 1)]
    const p1 = P[i]
    const p2 = P[i + 1]
    const p3 = P[Math.min(P.length - 1, i + 2)]
    d += ` C${p1[0] + (p2[0] - p0[0]) / 6} ${p1[1] + (p2[1] - p0[1]) / 6} ${p2[0] - (p3[0] - p1[0]) / 6} ${p2[1] - (p3[1] - p1[1]) / 6} ${p2[0]} ${p2[1]}`
  }
  return d
}

function gardenEnds(P: number[][], W: number, H: number, plot: number) {
  void H
  const a = P[0]
  const z = P[P.length - 1]
  const gw = Math.round(clamp(plot * (W < 520 ? 0.4 : 0.5), 30, 58))
  const s: [number, number] = [
    Math.max(gw * 0.62 + 6, a[0] - plot * 0.5 - gw * 0.95),
    a[1] + plot * 0.1,
  ]
  const e: [number, number] = [
    Math.min(W - gw * 0.72 - 6, z[0] + plot * 0.5 + gw * 1.05),
    z[1] - plot * 0.02,
  ]
  return { s, e, gw }
}

function hillBase(k: number): number {
  return k === 0 ? HILL0 : HILL0 + (1 - HILL0) * (k === 1 ? 0.26 : 0.54)
}

function hillY(k: number, x: number, W: number, H: number): number {
  const f = [
    [0.03, 1.15, 0.4],
    [0.028, 0.95, 2.1],
    [0.022, 0.8, 4],
  ][k]
  return H * (hillBase(k) + f[0] * Math.sin(2 * Math.PI * (x / W) * f[1] + f[2]))
}

function hillD(k: number, W: number, H: number): string {
  let d = `M0 ${hillY(k, 0, W, H)}`
  for (let x = 12; x <= W + 12; x += 12) {
    d += ` L${Math.min(x, W)} ${hillY(k, Math.min(x, W), W, H).toFixed(1)}`
  }
  return `${d} L${W} ${H} L0 ${H} Z`
}

function bedAnchor(refs: GardenLayoutRefs, beds: HTMLButtonElement[], i: number) {
  const g = refs.garden.getBoundingClientRect()
  const plot = beds[i].querySelector(".plot") ?? beds[i]
  const r = plot.getBoundingClientRect()
  return {
    cx: r.left - g.left + r.width / 2,
    cy: r.top - g.top + r.height / 2,
    top: r.top - g.top,
  }
}

function owlXY(refs: GardenLayoutRefs, beds: HTMLButtonElement[], i: number, topChrome: number) {
  const a = bedAnchor(refs, beds, i)
  const w = refs.owl.offsetWidth || 64
  const g = refs.garden
  const pr = (beds[i].querySelector(".plot") as HTMLElement).getBoundingClientRect()
  if (a.top - w * 1.0 < topChrome - 12 && a.cx + pr.width / 2 + w + 4 <= g.clientWidth) {
    return { x: a.cx + pr.width / 2 + 2, y: a.top + pr.height * 0.02 }
  }
  return {
    x: clamp(a.cx - w * 1.02, 4, g.clientWidth - w - 4),
    y: clamp(a.top - w * 1.0, topChrome - 12, g.clientHeight - w * 0.35),
  }
}

function makePlacer(
  refs: GardenLayoutRefs,
  beds: HTMLButtonElement[],
  W: number,
  H: number,
  topY: number,
  pathEl: SVGPathElement | null,
  extra: RectObs[] | undefined,
  topChrome: number,
): Placer {
  const obs: RectObs[] = []
  const samples: number[][] = []
  const gr = refs.garden.getBoundingClientRect()
  beds.forEach((b, j) => {
    const r = b.getBoundingClientRect()
    obs.push({ x: r.left - gr.left, y: r.top - gr.top, w: r.width, h: r.height + 10 })
    const o = owlXY(refs, beds, j, topChrome)
    const ow = refs.owl.offsetWidth || 64
    obs.push({ x: o.x, y: o.y, w: ow, h: ow })
  })
  ;(extra ?? []).forEach((r) => {
    obs.push(r)
  })
  if (pathEl) {
    const len = pathEl.getTotalLength()
    for (let i = 0; i <= len; i += 14) {
      const p = pathEl.getPointAtLength(i)
      samples.push([p.x, p.y])
    }
  }
  const hits = (a: RectObs, b: RectObs, pad: number) =>
    a.x < b.x + b.w + pad && a.x + a.w + pad > b.x && a.y < b.y + b.h + pad && a.y + a.h + pad > b.y
  const free = (r: RectObs, o?: Record<string, unknown>) => {
    const opt = o ?? {}
    if (r.x < 2 || r.x + r.w > W - 2 || r.y + r.h > H - 1) return false
    if (!opt.sky && r.y < topY) return false
    for (let j = 0; j < obs.length; j++) {
      if (hits(r, obs[j], opt.pad == null ? 6 : (opt.pad as number))) return false
    }
    if (!opt.overPath) {
      const R = (opt.pathR as number) || 22
      for (let j = 0; j < samples.length; j++) {
        const sx = samples[j][0]
        const sy = samples[j][1]
        const dx = Math.max(r.x - sx, 0, sx - (r.x + r.w))
        const dy = Math.max(r.y - sy, 0, sy - (r.y + r.h))
        if (dx * dx + dy * dy < R * R) return false
      }
    }
    return true
  }
  const find: Placer["find"] = (w, h, px, py, box, o) => {
    const c: [number, number, number][] = []
    const step = 8
    for (let y = box[2]; y <= box[3]; y += step) {
      for (let x = box[0]; x <= box[1]; x += step) {
        c.push([x, y, (x - px) * (x - px) + (y - py) * (y - py) * 1.4])
      }
    }
    c.sort((a, b) => a[2] - b[2])
    for (let j = 0; j < c.length; j++) {
      const r = { x: c[j][0] - w / 2, y: c[j][1] - h, w, h }
      if (free(r, o)) {
        if (!(o && o.ghost)) obs.push(r)
        return { x: c[j][0], y: c[j][1] }
      }
    }
    return null
  }
  return { find, free, add: (r) => obs.push(r) }
}

function drawPath(
  svg: SVGSVGElement,
  W: number,
  H: number,
  spots: Spot[],
  ends: ReturnType<typeof gardenEnds>,
): SVGPathElement {
  svg.setAttribute("viewBox", `0 0 ${W} ${H}`)
  svg.innerHTML = ""
  const P = [ends.s].concat(spots.map((s) => [s.x * W, s.y * H])).concat([ends.e])
  const d = curvePath(P)
  el(
    "path",
    {
      d,
      fill: "none",
      stroke: "#2B2A3A",
      "stroke-width": 40,
      "stroke-linecap": "round",
      opacity: 0.06,
      transform: "translate(0 4)",
    },
    svg,
  )
  el(
    "path",
    { d, fill: "none", stroke: "#D9C9A8", "stroke-width": 36, "stroke-linecap": "round" },
    svg,
  )
  el(
    "path",
    { d, fill: "none", stroke: "#F3E6C8", "stroke-width": 28, "stroke-linecap": "round" },
    svg,
  )
  el(
    "path",
    {
      d,
      fill: "none",
      stroke: "#E9DAB9",
      "stroke-width": 17,
      "stroke-linecap": "round",
      "stroke-dasharray": "9 17",
      opacity: 0.95,
    },
    svg,
  )
  const main = el(
    "path",
    {
      d,
      fill: "none",
      stroke: "#FFF8F0",
      "stroke-width": 6,
      "stroke-linecap": "round",
      "stroke-dasharray": "7 19",
      "stroke-dashoffset": "-1",
      "data-testid": "garden-path",
      opacity: 0.55,
      transform: "translate(-1 -3)",
    },
    svg,
  ) as SVGPathElement
  const gw = ends.gw
  svgIn(svg, ends.s[0], ends.s[1] + gw * 0.32, 1, DECOR.gate(gw), { "data-testid": "garden-gate" })
  svgIn(svg, ends.e[0], ends.e[1] + gw * 0.36, 1, DECOR.arbor(gw), { "data-testid": "arbor" })
  return main
}

function drawScene(
  svg: SVGSVGElement,
  W: number,
  H: number,
  topY: number,
  place: Placer,
  ends: ReturnType<typeof gardenEnds>,
): { x: number; y: number } | null {
  svg.setAttribute("viewBox", `0 0 ${W} ${H}`)
  svg.innerHTML =
    '<defs><linearGradient id="g-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#BFDFF5"/><stop offset=".45" stop-color="#DDEFFF"/><stop offset="1" stop-color="#F6F1E4"/></linearGradient></defs>'
  el("rect", { width: W, height: H, fill: "url(#g-sky)" }, svg)
  const wide = W >= 820 && W / H >= 1.05
  HILL0 = clamp(topY / H + (wide ? 0.17 : 0.045), 0.2, 0.4)
  const k = clamp(Math.min(W, H) / 760, 0.62, 1.12)
  const sunR = Math.round(clamp(Math.min(W, H) * 0.055, 20, 42))
  const p = place.find(
    sunR * 2.8,
    sunR * 2.8,
    W - sunR * 1.8,
    topY + sunR * 2.6,
    [W * 0.55, W - sunR * 1.4, topY + sunR * 2.4, Math.max(topY + sunR * 2.4, H * 0.42)],
    { pathR: 10 },
  )
  if (p) {
    const cy = p.y - sunR * 1.4
    el("circle", { cx: p.x, cy, r: sunR * 1.45, fill: "#FFF1B8", opacity: 0.45 }, svg)
    el(
      "circle",
      { cx: p.x, cy, r: sunR, fill: "#FFF1B8", stroke: "#F3D98A", "stroke-width": 1.5 },
      svg,
    )
  }
  const cloud = (cx: number, cy: number, sc: number) => {
    const g = el(
      "g",
      {
        fill: "#fff",
        opacity: 0.85,
        transform: `translate(${cx} ${cy}) scale(${sc})`,
        "data-testid": "clouds",
        class: "clouds",
      },
      svg,
    )
    el("ellipse", { cx: 0, cy: 0, rx: 30, ry: 12 }, g)
    el("ellipse", { cx: -16, cy: 3, rx: 15, ry: 9 }, g)
    el("ellipse", { cx: 18, cy: 3, rx: 14, ry: 9 }, g)
    el("ellipse", { cx: 2, cy: -7, rx: 14, ry: 10 }, g)
  }
  ;[
    [0.22, 0.1],
    [0.52, 0.16],
  ].forEach((c) => {
    const q = place.find(
      64 * k,
      26 * k,
      W * c[0],
      topY + H * c[1],
      [30, W - 30, topY + 20, Math.max(topY + 20, hillY(0, W / 2, W, H) - 6)],
      { pathR: 16, ghost: false },
    )
    if (q) cloud(q.x, q.y - 13 * k, k)
  })
  el("path", { d: hillD(0, W, H), fill: "#D9CCFF", opacity: 0.42 }, svg)
  const nT = W >= 820 ? 5 : W >= 600 ? 4 : 2
  let placedT = 0
  for (let i = 0; i < 24 && placedT < nT; i++) {
    const x = W * (((i * 0.37 + 0.08) % 1) as number)
    const ty = hillY(0, x, W, H) + 10 * k
    if (place.free({ x: x - 24 * k, y: ty - 56 * k, w: 48 * k, h: 56 * k }, { pad: 4 })) {
      svgIn(svg, x, ty, k * 0.9, DECOR.tree(placedT % 2 ? "#BFE6C9" : "#B2DDBE"), { opacity: 0.85 })
      place.add({ x: x - 24 * k, y: ty - 56 * k, w: 48 * k, h: 56 * k })
      placedT++
    }
  }
  el("path", { d: hillD(1, W, H), fill: "#C9F2DD", opacity: 0.95 }, svg)
  el("path", { d: hillD(2, W, H), fill: "#D8EBC4" }, svg)
  const ground = Math.max(hillY(1, W / 2, W, H), topY + H * 0.2)
  const put = (
    name: keyof typeof DECOR,
    w: number,
    h: number,
    px: number,
    py: number,
    sc: number,
    arg?: string,
    box?: [number, number, number, number],
  ) => {
    const q = place.find(
      w * sc,
      h * sc,
      px,
      py,
      box ?? [(w * sc) / 2 + 4, W - (w * sc) / 2 - 4, ground, H - 4],
    )
    if (q) {
      const html =
        name === "flowers" || name === "tree"
          ? (DECOR[name] as (c: string) => string)(arg ?? "#FFD1E3")
          : (DECOR[name] as () => string)()
      svgIn(svg, q.x, q.y, sc, html, { "data-decor": name })
    }
    return q
  }
  const s1 = clamp(k, 0.68, 1.05)
  put("shed", 80, 64, ends.e[0] + ends.gw * 1.2, ends.e[1] + ends.gw * 0.2, s1, undefined, [
    Math.max(40 * s1, ends.e[0] - W * 0.3),
    W - 40 * s1,
    Math.max(topY + 70, ends.e[1] - H * 0.2),
    Math.min(H - 4, ends.e[1] + H * 0.12),
  ])
  const pond = put("pond", 170, 40, W * 0.5, H * 0.86, s1)
  put("bench", 70, 38, W * (W >= 820 ? 0.36 : 0.14), H * 0.62, s1)
  put("canRest", 52, 40, W * (W >= 820 ? 0.94 : 0.86), H * 0.66, s1)
  put("bush", 44, 24, W * 0.06, H * 0.5, s1)
  put("bush", 44, 24, W * 0.94, H * 0.84, s1)
  put("bush", 44, 24, W * 0.5, hillY(1, W * 0.5, W, H) + 8, s1)
  const fc = ["#FFD1E3", "#FFD6C9", "#D9CCFF", "#FFF1B8"]
  const fpref: [number, number][] = [
    [0.08, 0.72],
    [0.58, 0.66],
    [0.92, 0.56],
    [0.3, 0.92],
    [0.78, 0.94],
    [0.46, 0.78],
  ]
  for (let i = 0; i < (W >= 700 ? 6 : 4); i++) {
    put("flowers", 30, 18, W * fpref[i][0], H * fpref[i][1], s1, fc[i % 4])
  }
  const fy = H - 3
  const ph = Math.round(22 * s1)
  const pw = Math.round(13 * s1)
  let run: [number, number] | null = null
  const runs: [number, number][] = []
  for (let x = 4; x < W - pw; x += pw) {
    const ok = place.free({ x, y: fy - ph, w: pw, h: ph }, { pad: 2, pathR: 22 })
    if (ok) {
      if (!run) {
        run = [x, x]
        runs.push(run)
      }
      run[1] = x + pw
    } else run = null
  }
  const fg = el("g", { "data-decor": "fence" }, svg)
  runs.forEach((r) => {
    if (r[1] - r[0] < pw * 3) return
    el(
      "path",
      {
        d: `M${r[0]} ${fy - ph * 0.35} H${r[1]} M${r[0]} ${fy - ph * 0.72} H${r[1]}`,
        stroke: "#D4B98F",
        "stroke-width": 3,
        "stroke-linecap": "round",
      },
      fg,
    )
    for (let x = r[0] + pw / 2; x < r[1]; x += pw) {
      el(
        "path",
        {
          d: `M${x - pw * 0.3} ${fy} V${fy - ph + 4} l${pw * 0.3} -4 l${pw * 0.3} 4 V${fy} Z`,
          fill: "#FFF8F0",
          stroke: "#2B2A3A",
          "stroke-width": 1.1,
          "stroke-opacity": 0.7,
          "stroke-linejoin": "round",
        },
        fg,
      )
    }
  })
  return pond
}

function drawCritters(
  layer: HTMLElement,
  W: number,
  H: number,
  topY: number,
  place: Placer,
  pond: { x: number; y: number } | null,
  hideAnim: boolean,
) {
  layer.innerHTML = ""
  if (hideAnim) return
  const B =
    '<svg viewBox="0 0 24 20" aria-hidden="true"><g class="wing"><ellipse cx="7" cy="7" rx="6" ry="5" fill="#FFD1E3" stroke="#2B2A3A" stroke-width="1.1"/><ellipse cx="17" cy="7" rx="6" ry="5" fill="#FFD1E3" stroke="#2B2A3A" stroke-width="1.1"/><ellipse cx="8" cy="14" rx="4" ry="3.4" fill="#D9CCFF" stroke="#2B2A3A" stroke-width="1"/><ellipse cx="16" cy="14" rx="4" ry="3.4" fill="#D9CCFF" stroke="#2B2A3A" stroke-width="1"/></g><path d="M12 4 V17" stroke="#2B2A3A" stroke-width="1.8" stroke-linecap="round"/><path d="M12 4 q-2 -3 -4 -3 M12 4 q2 -3 4 -3" fill="none" stroke="#2B2A3A" stroke-width=".9"/></svg>'
  const Bee =
    '<svg viewBox="0 0 24 20" aria-hidden="true"><g class="wing"><ellipse cx="9" cy="6" rx="4" ry="3" fill="#fff" stroke="#2B2A3A" stroke-width="1" opacity=".9"/><ellipse cx="14" cy="5" rx="4" ry="3" fill="#fff" stroke="#2B2A3A" stroke-width="1" opacity=".9"/></g><ellipse cx="12" cy="12" rx="7" ry="5" fill="#FFE38A" stroke="#2B2A3A" stroke-width="1.2"/><path d="M10 7.6 V16.4 M13.5 7.4 V16.6" stroke="#2B2A3A" stroke-width="1.6"/><circle cx="18" cy="11" r=".9" fill="#2B2A3A"/></svg>'
  const sz = Math.round(clamp(Math.min(W, H) / 34, 20, 28))
  const wants: [string, number, number, string][] = [
    [B, W * 0.62, H * 0.42, "b1"],
    [B, W * 0.12, H * 0.8, "b2"],
    [Bee, pond ? pond.x + 50 : W * 0.5, pond ? pond.y - 60 : H * 0.7, "bee"],
  ]
  wants.forEach((w) => {
    const q = place.find(sz + 8, sz + 8, w[1], w[2], [sz, W - sz, topY + sz, H - sz], { pathR: 14 })
    if (!q) return
    const d = document.createElement("div")
    const kind = w[3]
    d.className = `critter ${kind}${kind === "b1" || kind === "b2" ? " butterflies" : ""}`
    if (kind === "bee") d.setAttribute("data-testid", "bee")
    if (kind === "b1" || kind === "b2") d.setAttribute("data-testid", "butterflies")
    d.setAttribute("aria-hidden", "true")
    d.style.width = `${sz}px`
    d.style.transform = `translate(${Math.round(q.x - sz / 2)}px,${Math.round(q.y - sz - 4)}px)`
    d.innerHTML = `<div class="drift">${w[0]}</div>`
    layer.appendChild(d)
  })
}

export function placeOwl(
  refs: GardenLayoutRefs,
  beds: HTMLButtonElement[],
  i: number,
  topChrome: number,
  instant: boolean,
) {
  const o = refs.owl
  const p = owlXY(refs, beds, i, topChrome)
  if (instant) o.classList.add("instant")
  o.style.transform = `translate(${p.x}px,${p.y}px)`
  if (instant) {
    void o.offsetWidth
    o.classList.remove("instant")
  }
  return p
}

export function runLayoutMap(
  refs: GardenLayoutRefs,
  owlIndex: number,
  instant?: boolean,
  hideCritterAnim?: boolean,
): { x: number; y: number } {
  const g = refs.garden
  const W = g.clientWidth
  const H = g.clientHeight
  if (W < 8 || H < 8) return { x: 0, y: 0 }
  const wide = W >= 820 && W / H >= 1.05
  const pw = Math.round(clamp(wide ? W / 9.5 : Math.min(W, H) / 9.8, 80, 118))
  g.style.setProperty("--plot", `${pw}px`)
  g.style.setProperty("--plot-h", `${Math.round(pw * 0.8)}px`)
  g.style.setProperty(
    "--plaque",
    `${wide ? Math.round(clamp(W / 4.6, 170, 240)) : Math.round(clamp(W * 0.44, 132, 210))}px`,
  )
  const ow = Math.round(clamp(Math.min(W, H) / 13, 48, 72))
  g.style.setProperty("--owl", `${ow}px`)
  const top = chromeH(refs)
  const spots = bedSpots(W, H, top)
  const beds = refs.beds
  beds.forEach((b) => {
    b.setAttribute("data-hang", "center")
    b.style.left = "0px"
    b.style.top = "0px"
  })
  beds.forEach((b, i) => {
    const s = spots[i]
    const plot = b.querySelector(".plot") as HTMLElement
    const offX = plot.offsetLeft + plot.offsetWidth / 2
    const offY = plot.offsetTop + plot.offsetHeight / 2
    b.style.left = `${s.x * W - offX}px`
    b.style.top = `${s.y * H - offY}px`
  })
  beds.forEach((b) => {
    const r = b.getBoundingClientRect()
    const gr = g.getBoundingClientRect()
    const pad = 8
    let dx = 0
    let dy = 0
    if (r.left - gr.left < pad) dx = pad - (r.left - gr.left)
    if (r.right - gr.left > W - pad) dx -= r.right - gr.left - (W - pad)
    if (r.top - gr.top < top) dy = top - (r.top - gr.top)
    if (r.bottom - gr.top > H - pad) dy -= r.bottom - gr.top - (H - pad)
    if (dx || dy) {
      b.style.left = `${parseFloat(b.style.left) + dx}px`
      b.style.top = `${parseFloat(b.style.top) + dy}px`
    }
  })
  const ends = gardenEnds(
    spots.map((s) => [s.x * W, s.y * H]),
    W,
    H,
    pw,
  )
  const gw = ends.gw
  const pathEl = drawPath(refs.pathsvg, W, H, spots, ends)
  const place = makePlacer(
    refs,
    beds,
    W,
    H,
    top,
    pathEl,
    [
      { x: ends.s[0] - gw * 1.2, y: ends.s[1] + gw * 0.32 - gw * 1.15, w: gw * 2.4, h: gw * 1.2 },
      { x: ends.e[0] - gw * 0.65, y: ends.e[1] + gw * 0.36 - gw * 1.45, w: gw * 1.3, h: gw * 1.5 },
    ],
    top,
  )
  const pond = drawScene(refs.scenery, W, H, top, place, ends)
  drawCritters(refs.critters, W, H, top, place, pond, !!hideCritterAnim)
  return placeOwl(refs, beds, owlIndex, top, instant !== false)
}
