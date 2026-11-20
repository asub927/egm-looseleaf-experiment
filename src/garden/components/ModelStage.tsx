import * as React from "react"
import type { BedId } from "../types"
import {
  type ModelState,
  beadMaxMove,
  type BeadState,
  type TrainState,
  type CutState,
  type SeesawState,
  type FactState,
  type HopState,
} from "../models/engine"
import { GARDEN_DEMO, GARDEN_INK, GARDEN_PALETTE, SEESAW_CROSS_MAX } from "../types"
import type { ProblemSpec } from "../models/problems"
import { bedById } from "../beds/registry"
import { useSvgDrag, type SvgPoint } from "../hooks/use-drag-kit"

const INK = GARDEN_INK
const P = GARDEN_PALETTE

type AddProblem = Extract<ProblemSpec, { kind: "add" }>
type SubProblem = Extract<ProblemSpec, { kind: "sub" }>
type FactProblem = Extract<ProblemSpec, { kind: "fact" }>
type OnChange = (next: ModelState, via: "tap" | "drag") => void

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v))
}

function nearestBy(lo: number, hi: number, dist: (n: number) => number): number {
  let best = lo
  for (let n = lo + 1; n <= hi; n++) if (dist(n) < dist(best)) best = n
  return best
}

function svgT(p: SvgPoint): string {
  return `translate(${p.x} ${p.y})`
}

function pieceClass(live: boolean, still: boolean): string | undefined {
  return [live && "grab", !still && "motion-move"].filter(Boolean).join(" ") || undefined
}

export function ModelStage({
  bedId,
  problem,
  modelState,
  live,
  showCue,
  revealTotal,
  onChange,
  reducedMotion,
  equationsRevealed = false,
  watchState = null,
  snapMotion = false,
  flowOut = false,
}: {
  bedId: BedId
  problem: ProblemSpec
  modelState: ModelState
  live: boolean
  showCue: boolean
  revealTotal: boolean
  onChange: OnChange
  reducedMotion: boolean
  equationsRevealed?: boolean
  watchState?: ModelState | null
  snapMotion?: boolean
  flowOut?: boolean
}) {
  const bed = bedById(bedId)
  const narrow =
    typeof window !== "undefined" &&
    window.innerWidth <= 600 &&
    window.innerHeight > window.innerWidth
  const shown = watchState ?? modelState
  const interactive = live && watchState === null
  const still = reducedMotion || snapMotion

  switch (bed.modelKind) {
    case "bead-rack":
      if (problem.kind !== "add") return null
      return (
        <BeadRack
          problem={problem}
          state={shown as BeadState}
          live={interactive}
          showCue={showCue}
          onChange={onChange}
        />
      )
    case "train":
      if (problem.kind !== "add") return null
      return (
        <TrainModel
          problem={problem}
          state={shown as TrainState}
          live={interactive}
          pacing={bed.pacing}
          revealTotal={revealTotal}
          narrow={narrow}
          still={still}
          showCue={showCue}
          flowOut={flowOut}
          onChange={onChange}
        />
      )
    case "cut":
      if (problem.kind !== "sub") return null
      return (
        <CutModel
          problem={problem}
          state={shown as CutState}
          live={interactive}
          still={still}
          onChange={onChange}
        />
      )
    case "seesaw":
      if (problem.kind !== "add") return null
      return (
        <SeesawModel
          problem={problem}
          state={shown as SeesawState}
          live={interactive}
          showCue={showCue}
          still={still}
          onChange={onChange}
        />
      )
    case "fact-house":
      if (problem.kind !== "fact") return null
      return (
        <FactHouseModel
          problem={problem}
          state={shown as FactState}
          live={interactive}
          narrow={narrow}
          still={still}
          equationsRevealed={equationsRevealed}
          onChange={onChange}
        />
      )
    case "hop-line":
      if (problem.kind !== "add") return null
      return (
        <HopLineModel
          problem={problem}
          state={shown as HopState}
          live={interactive}
          pacing={bed.pacing}
          revealTotal={revealTotal}
          still={still}
          onChange={onChange}
        />
      )
    default: {
      const _exhaustive: never = bed.modelKind
      return _exhaustive
    }
  }
}

const BEAD_MID = 110
const beadX = (i: number) => 40 + i * 34

type BeadCarry = { from: "top" | "bottom" }

function BeadRack({
  problem,
  state,
  live,
  showCue,
  onChange,
}: {
  problem: AddProblem
  state: BeadState
  live: boolean
  showCue: boolean
  onChange: OnChange
}) {
  const svgRef = React.useRef<SVGSVGElement>(null)
  const topRef = React.useRef<SVGRectElement>(null)
  const bottomRef = React.useRef<SVGRectElement>(null)
  const [carry, setCarry] = React.useState<(BeadCarry & { pt: SvgPoint }) | null>(null)
  const top = problem.a + state.moved
  const bottom = problem.b - state.moved
  const max = beadMaxMove(problem, state.moved)

  const { bindTarget, isDragging } = useSvgDrag<BeadCarry>(svgRef, live, {
    start: (pt) => {
      if (pt.y >= BEAD_MID) return state.moved < max ? { from: "bottom" } : false
      const onMovedBead = pt.x >= beadX(problem.a) - 20 && pt.x <= beadX(top - 1) + 20
      return state.moved > 0 && onMovedBead ? { from: "top" } : false
    },
    move: (pt, ctx) => setCarry({ ...ctx, pt }),
    end: (pt, ctx, moved, cancel) => {
      setCarry(null)
      if (cancel) return
      const crossed = ctx.from === "bottom" ? pt.y < BEAD_MID : pt.y > BEAD_MID
      if (moved && !crossed) return
      const next = clamp(state.moved + (ctx.from === "bottom" ? 1 : -1), 0, max)
      if (next !== state.moved) onChange({ moved: next }, moved ? "drag" : "tap")
    },
  })

  React.useEffect(() => {
    const offTop = bindTarget(topRef.current)
    const offBottom = bindTarget(bottomRef.current)
    return () => {
      offTop()
      offBottom()
    }
  }, [bindTarget])

  return (
    <svg
      ref={svgRef}
      viewBox="0 0 400 220"
      width="100%"
      className={isDragging ? "drag" : undefined}
      style={{ maxWidth: 640 }}
      aria-hidden="true"
    >
      <rect
        x="8"
        y="8"
        width="384"
        height="204"
        rx="20"
        fill={P.butter}
        stroke={INK}
        strokeWidth="2"
      />
      {[0, 1].map((row) => (
        <line
          key={row}
          x1="24"
          x2="376"
          y1={row ? 150 : 70}
          y2={row ? 150 : 70}
          stroke={P.lavender}
          strokeWidth="6"
          strokeLinecap="round"
        />
      ))}
      <text x="16" y="44" fontSize="16" fontWeight="800">
        top wire · {top}
      </text>
      <text x="16" y="190" fontSize="16" fontWeight="800">
        bottom wire · {bottom}
      </text>
      {Array.from({ length: 10 }).map((_, i) => (
        <circle
          key={`ring-${i}`}
          cx={beadX(i)}
          cy={70}
          r="16"
          fill="none"
          stroke={showCue && i >= problem.a ? P.lavender : "transparent"}
          strokeWidth="2"
          strokeDasharray="4 4"
        />
      ))}
      {Array.from({ length: top }).map((_, i) => (
        <circle
          key={`t-${i}`}
          cx={beadX(i)}
          cy={70}
          r="12"
          fill={P.rose}
          stroke={INK}
          opacity={carry?.from === "top" && i === top - 1 ? 0.3 : 1}
        />
      ))}
      {Array.from({ length: bottom }).map((_, i) => (
        <g key={`b-${i}`}>
          <circle
            cx={beadX(i)}
            cy={150}
            r="12"
            fill={P.cream}
            stroke={INK}
            opacity={carry?.from === "bottom" && i === bottom - 1 ? 0.3 : 1}
          />
          {live && i === bottom - 1 && (
            <circle cx={beadX(i)} cy={150} r="28" fill="transparent" pointerEvents="all" />
          )}
        </g>
      ))}
      <g>
        <rect
          ref={bottomRef}
          x="20"
          y="120"
          width="360"
          height="80"
          fill="transparent"
          className={live ? "grab" : undefined}
          data-testid="band-bottom"
        />
        <rect
          ref={topRef}
          x="20"
          y="32"
          width="360"
          height="80"
          fill="transparent"
          className={live ? "grab" : undefined}
          data-testid="band-top"
        />
      </g>
      {carry && (
        <circle
          cx={carry.pt.x}
          cy={carry.pt.y}
          r="12"
          fill={carry.from === "bottom" ? P.cream : P.rose}
          stroke={INK}
          opacity={0.9}
          pointerEvents="none"
        />
      )}
    </svg>
  )
}

const TRAIN_FIRST = 1
const TRAIN_LAST = 20
const TRAIN_COLS = ["#FFF1B8", "#C9F2DD", "#CDE8FF", "#FFD6C9", "#FFD1E3"]

function TrainModel({
  problem,
  state,
  live,
  narrow,
  still,
  showCue,
  flowOut,
  onChange,
}: {
  problem: AddProblem
  state: TrainState
  live: boolean
  pacing?: boolean
  revealTotal?: boolean
  narrow: boolean
  still: boolean
  showCue: boolean
  flowOut: boolean
  onChange: OnChange
}) {
  const svgRef = React.useRef<SVGSVGElement>(null)
  const engineRef = React.useRef<SVGGElement>(null)
  const [dragPt, setDragPt] = React.useState<SvgPoint | null>(null)
  const perRow = narrow ? 5 : 10
  const car = (n: number): SvgPoint => ({
    x: narrow ? 70 + ((n - 1) % 5) * 100 : 100 + ((n - 1) % 10) * 84,
    y: narrow ? 92 + Math.floor((n - 1) / 5) * 172 : n <= 10 ? 112 : 318,
  })
  const leadPos = (n: number): SvgPoint => ({ x: car(n).x, y: car(n).y + 38 })
  const enginePos = (n: number): SvgPoint => ({ x: car(n).x, y: car(n).y + 78 })
  const nearestEngine = (pt: SvgPoint) =>
    nearestBy(problem.a, TRAIN_LAST, (n) => {
      const e = enginePos(n)
      return Math.hypot(e.x - pt.x, e.y - pt.y)
    })
  const paintAt = dragPt ? nearestEngine(dragPt) : state.at

  const carFill = (n: number, at: number) => {
    if (n <= problem.a) return "#D9CCFF"
    if (n <= at) return TRAIN_COLS[(n - problem.a) % TRAIN_COLS.length] ?? P.cream
    return "#fff"
  }

  const { bindTarget, isDragging } = useSvgDrag<true>(svgRef, live, {
    start: () => true,
    move: (pt) => setDragPt(pt),
    end: (pt, _ctx, moved, cancel) => {
      setDragPt(null)
      if (cancel || !moved) return
      const n = nearestEngine(pt)
      if (n !== state.at) onChange({ at: n }, "drag")
    },
  })

  React.useEffect(() => bindTarget(engineRef.current), [bindTarget])

  const enginePt = dragPt ?? enginePos(state.at)
  const leadAt = dragPt ? paintAt : state.at

  return (
    <svg
      ref={svgRef}
      viewBox={narrow ? "0 0 540 740" : "0 0 960 480"}
      preserveAspectRatio="xMidYMid meet"
      width="100%"
      data-model="counting-on"
      className={
        [flowOut ? "flow-out" : undefined, isDragging ? "drag" : undefined]
          .filter(Boolean)
          .join(" ") || undefined
      }
      aria-hidden="true"
    >
      {Array.from({ length: TRAIN_LAST / perRow }).map((_, rr) => {
        const yy = car(rr * perRow + 1).y
        return (
          <rect
            key={`rail-${rr}`}
            x={narrow ? 20 : 50}
            y={yy + 38}
            width={narrow ? 500 : 860}
            height={9}
            rx={4}
            fill={GARDEN_DEMO.trackRail}
          />
        )
      })}
      {Array.from({ length: TRAIN_LAST - TRAIN_FIRST + 1 }).map((_, i) => {
        const n = i + TRAIN_FIRST
        const c = car(n)
        const tappable = live && n >= problem.a
        const showBadge = n > problem.a && n <= paintAt
        const ringOn = showCue && n > problem.a && n <= problem.a + problem.b
        return (
          <React.Fragment key={n}>
            <g
              data-testid={`car-${n}`}
              style={{ cursor: tappable ? "pointer" : "default" }}
              onClick={() => {
                if (tappable && n !== state.at) onChange({ at: n }, "tap")
              }}
            >
              <rect
                x={c.x - 36}
                y={c.y - 30}
                width={72}
                height={60}
                rx="14"
                fill={carFill(n, paintAt)}
                stroke={INK}
                strokeWidth="2.5"
              />
              <text
                x={c.x}
                y={c.y + 11}
                textAnchor="middle"
                fontSize="30"
                fontWeight="900"
                fill={INK}
              >
                {n}
              </text>
              <circle cx={c.x - 18} cy={c.y + 34} r="7" fill={INK} />
              <circle cx={c.x + 18} cy={c.y + 34} r="7" fill={INK} />
              <rect x={c.x - 42} y={c.y - 52} width={84} height={100} fill="transparent" />
            </g>
            {showBadge && (
              <g className="motion-fade" style={{ opacity: 1 }}>
                <circle cx={c.x} cy={c.y - 56} r="19" fill="#FFF1B8" stroke={INK} strokeWidth="2" />
                <text
                  x={c.x}
                  y={c.y - 49}
                  textAnchor="middle"
                  fontSize="20"
                  fontWeight="900"
                  fill={INK}
                >
                  {n - problem.a}
                </text>
              </g>
            )}
            <circle
              cx={c.x}
              cy={c.y}
              r="48"
              className={ringOn ? "ring on" : "ring"}
              pointerEvents="none"
            />
          </React.Fragment>
        )
      })}
      <g
        className={[still ? undefined : "motion-move", isDragging ? "drag" : undefined]
          .filter(Boolean)
          .join(" ")}
        data-testid="lead-dot"
        transform={svgT(leadPos(leadAt))}
        opacity={leadAt > problem.a ? 1 : 0.5}
        pointerEvents="none"
      >
        <circle r="11" fill={P.rose} stroke={INK} strokeWidth="3" />
        <circle r="4.5" fill={INK} />
      </g>
      <g
        ref={engineRef}
        data-testid="engine"
        className={pieceClass(live, still)}
        transform={svgT(enginePt)}
      >
        <rect
          x={-48}
          y={-28}
          width={96}
          height={56}
          rx="18"
          fill={P.rose}
          stroke={INK}
          strokeWidth="3"
        />
        <rect
          x={-34}
          y={-50}
          width={18}
          height={24}
          rx="5"
          fill={P.rose}
          stroke={INK}
          strokeWidth="3"
        />
        <path d="M-14 0 l-12 -10 v20 z M14 0 l12 -10 v20 z" fill={INK} />
        <circle cx={0} cy={0} r="66" fill="transparent" />
      </g>
    </svg>
  )
}

const cutDotX = (i: number) => 30 + i * 32
const cutX = (q: number) => cutDotX(q) - 16

function CutModel({
  problem,
  state,
  live,
  still,
  onChange,
}: {
  problem: SubProblem
  state: CutState
  live: boolean
  still: boolean
  onChange: OnChange
}) {
  const svgRef = React.useRef<SVGSVGElement>(null)
  const cutRef = React.useRef<SVGGElement>(null)
  const [dragX, setDragX] = React.useState<number | null>(null)
  const n = problem.n
  const [lo, hi] = state.phase === "toTen" ? [10, n] : [1, 10]
  const nearestCut = (x: number) => nearestBy(lo, hi, (q) => Math.abs(cutX(q) - x))
  const position = dragX === null ? state.position : nearestCut(dragX)

  const { bindTarget, isDragging } = useSvgDrag<true>(svgRef, live, {
    start: () => true,
    move: (pt) => setDragX(clamp(pt.x, cutX(lo), cutX(hi))),
    end: (pt, _ctx, moved, cancel) => {
      setDragX(null)
      if (cancel || !moved) return
      const q = nearestCut(pt.x)
      const next: CutState = {
        position: q,
        phase: state.phase === "toTen" && q === 10 ? "rest" : state.phase,
      }
      if (next.position !== state.position || next.phase !== state.phase) onChange(next, "drag")
    },
  })

  React.useEffect(() => bindTarget(cutRef.current), [bindTarget])

  return (
    <svg
      ref={svgRef}
      viewBox="0 0 480 186"
      width="100%"
      className={isDragging ? "drag" : undefined}
      style={{ maxWidth: 640 }}
    >
      {Array.from({ length: n }).map((_, i) => (
        <circle
          key={i}
          cx={cutDotX(i)}
          cy={60}
          r="14"
          fill={i >= position ? "none" : i < 10 ? P.peach : P.lavender}
          stroke={INK}
          strokeWidth="2"
          opacity={i >= position ? 0.35 : 1}
          data-testid={`dot-${i}`}
          style={{ cursor: live ? "pointer" : "default" }}
          onClick={() => {
            if (!live) return
            const pos = i + 1
            if (state.phase === "toTen") {
              if (pos >= 10 && pos <= n) {
                onChange({ position: pos, phase: pos === 10 ? "rest" : "toTen" }, "tap")
              }
            } else if (pos < 10) {
              onChange({ position: pos, phase: "rest" }, "tap")
            }
          }}
        />
      ))}
      <g
        ref={cutRef}
        data-testid="cut"
        className={pieceClass(live, still)}
        transform={svgT({ x: dragX ?? cutX(state.position), y: 0 })}
      >
        <line x1={0} x2={0} y1={20} y2={100} stroke={INK} strokeWidth="4" strokeDasharray="4 8" />
        <circle cx={0} cy={132} r={22} fill={P.rose} stroke={INK} strokeWidth="2" />
        <path d="M-8 132 l-8 -7 v14 z M8 132 l8 -7 v14 z" fill={INK} />
        <rect x={-12} y={14} width={24} height={92} fill="transparent" />
        <circle cx={0} cy={132} r={38} fill="transparent" />
      </g>
      <text x="240" y="180" textAnchor="middle" fontSize="14">
        {state.position} left · {state.phase === "toTen" ? "cut down to ten" : "take the rest"}
      </text>
    </svg>
  )
}

const SEESAW_PIVOT: SvgPoint = { x: 200, y: 140 }
const appleSlot = (side: -1 | 1, k: number): SvgPoint => ({
  x: side * (54 + (k % 4) * 34),
  y: -30 - Math.floor(k / 4) * 32,
})

type AppleCarry = { index: number; back: boolean }

function seesawApplePos(problem: AddProblem, crossed: number[], j: number): SvgPoint {
  if (crossed.includes(j)) {
    const r = crossed.indexOf(j)
    return appleSlot(1, problem.b + r)
  }
  let rank = 0
  for (let q = 0; q < j; q++) if (!crossed.includes(q)) rank++
  return appleSlot(-1, rank)
}

function SeesawModel({
  problem,
  state,
  live,
  showCue,
  still,
  onChange,
}: {
  problem: AddProblem
  state: SeesawState
  live: boolean
  showCue: boolean
  still: boolean
  onChange: OnChange
}) {
  const svgRef = React.useRef<SVGSVGElement>(null)
  const appleRefs = React.useRef<(SVGGElement | null)[]>([])
  const [carry, setCarry] = React.useState<(AppleCarry & { pt: SvgPoint }) | null>(null)
  const left = problem.a - state.crossed.length
  const right = problem.b + state.crossed.length
  const tilt = clamp((right - left) * 3, -8, 8)

  const { bindTarget, isDragging } = useSvgDrag<AppleCarry>(svgRef, live, {
    start: (_pt, target) => {
      const j = appleRefs.current.findIndex((node) => node === target)
      if (j < 0) return false
      const back = state.crossed.includes(j)
      if (!back && state.crossed.length >= SEESAW_CROSS_MAX) return false
      return { index: j, back }
    },
    move: (pt, ctx) => setCarry({ ...ctx, pt }),
    end: (pt, ctx, moved, cancel) => {
      setCarry(null)
      if (cancel) return
      const crossedBeam = ctx.back ? pt.x < SEESAW_PIVOT.x : pt.x > SEESAW_PIVOT.x
      if (!moved || !crossedBeam) return
      let next = state.crossed
      if (ctx.back) {
        next = state.crossed.filter((k) => k !== ctx.index)
      } else if (!state.crossed.includes(ctx.index)) {
        next = [...state.crossed, ctx.index]
      }
      if (next !== state.crossed) {
        onChange({ crossed: next, steps: state.steps + 1 }, moved ? "drag" : "tap")
      }
    },
  })

  React.useEffect(() => {
    const offs = appleRefs.current.slice(0, problem.a).map((el) => bindTarget(el))
    return () => offs.forEach((off) => off())
  }, [bindTarget, problem.a, state.crossed.length])

  const cueApple =
    showCue && state.crossed.length < SEESAW_CROSS_MAX
      ? (Array.from({ length: problem.a })
          .map((_, j) => j)
          .reverse()
          .find((j) => !state.crossed.includes(j)) ?? null)
      : null

  return (
    <svg
      ref={svgRef}
      viewBox="0 0 400 220"
      width="100%"
      className={isDragging ? "drag" : undefined}
      style={{ maxWidth: 560 }}
    >
      <g
        transform={`translate(${SEESAW_PIVOT.x} ${SEESAW_PIVOT.y}) rotate(${tilt})`}
        data-testid="beam"
      >
        <rect
          x="-180"
          y="-8"
          width="360"
          height="16"
          rx="8"
          fill={P.butter}
          stroke={INK}
          strokeWidth="2"
        />
        <text x="-90" y="40" textAnchor="middle" fontSize="28" fontWeight="900">
          {left}
        </text>
        <text x="90" y="40" textAnchor="middle" fontSize="28" fontWeight="900">
          {right}
        </text>
        {Array.from({ length: problem.b }).map((_, i) => {
          const p = appleSlot(1, i)
          return (
            <circle
              key={`r-${i}`}
              cx={p.x}
              cy={p.y}
              r="16"
              fill={P.sky}
              stroke={INK}
              data-testid={`apple-r-${i}`}
            />
          )
        })}
        {Array.from({ length: problem.a }).map((_, j) => (
          <g
            key={`l-${j}`}
            ref={(el) => {
              appleRefs.current[j] = el
            }}
            data-testid={`apple-l-${j}`}
            className={pieceClass(live, still)}
            transform={svgT(seesawApplePos(problem, state.crossed, j))}
            opacity={carry?.index === j ? 0.3 : 1}
          >
            <circle r="16" fill={P.peach} stroke={INK} strokeWidth="2" />
            <circle r="28" fill="transparent" />
          </g>
        ))}
        {cueApple !== null && (
          <circle
            cx={seesawApplePos(problem, state.crossed, cueApple).x}
            cy={seesawApplePos(problem, state.crossed, cueApple).y}
            r="20"
            fill="none"
            stroke={P.lavender}
            strokeWidth="2"
            strokeDasharray="4 4"
          />
        )}
      </g>
      {carry && (
        <circle
          cx={carry.pt.x}
          cy={carry.pt.y}
          r="16"
          fill={P.peach}
          stroke={INK}
          strokeWidth="2"
          opacity={0.9}
          pointerEvents="none"
        />
      )}
      <text x="200" y="210" textAnchor="middle" fontSize="14">
        Move apples across until the seesaw is level
      </text>
    </svg>
  )
}

const FACT_SLOT: SvgPoint = { x: 250, y: 140 }
const factTray = (i: number): SvgPoint => ({ x: 56 + i * 72, y: 232 })

type TileDrag = { v: number; inSlot: boolean }

function FactHouseModel({
  problem,
  state,
  live,
  narrow,
  still,
  equationsRevealed,
  onChange,
}: {
  problem: FactProblem
  state: FactState
  live: boolean
  narrow: boolean
  still: boolean
  equationsRevealed: boolean
  onChange: OnChange
}) {
  const svgRef = React.useRef<SVGSVGElement>(null)
  const tileRefs = React.useRef<(SVGGElement | null)[]>([])
  const [dragTile, setDragTile] = React.useState<{ v: number; pt: SvgPoint } | null>(null)
  const miss = problem.whole - problem.part
  const tiles = [miss - 2, miss - 1, miss, miss + 1, miss + 2]
  const home = (i: number) => (tiles[i] === state.tile ? FACT_SLOT : factTray(i))
  const X = equationsRevealed && state.tile !== null ? String(state.tile) : "?"
  const lines = [
    `${problem.part} + ${X} = ${problem.whole}`,
    `${X} + ${problem.part} = ${problem.whole}`,
    `${problem.whole} − ${problem.part} = ${X}`,
    `${problem.whole} − ${X} = ${problem.part}`,
  ]

  const { bindTarget, isDragging } = useSvgDrag<TileDrag>(svgRef, live, {
    start: (pt) => {
      const i = nearestBy(0, tiles.length - 1, (k) =>
        Math.hypot(home(k).x - pt.x, home(k).y - pt.y),
      )
      return { v: tiles[i], inSlot: tiles[i] === state.tile }
    },
    move: (pt, ctx) => setDragTile({ v: ctx.v, pt }),
    end: (pt, ctx, moved, cancel) => {
      setDragTile(null)
      if (cancel) return
      if (!moved) {
        onChange({ tile: ctx.inSlot ? null : ctx.v }, "tap")
        return
      }
      const near = Math.hypot(pt.x - FACT_SLOT.x, pt.y - FACT_SLOT.y) < 70
      if (near && state.tile !== ctx.v) onChange({ tile: ctx.v }, "drag")
      else if (!near && ctx.inSlot) onChange({ tile: null }, "drag")
    },
  })

  React.useEffect(() => {
    const offs = tileRefs.current.map((el) => bindTarget(el))
    return () => offs.forEach((off) => off())
  }, [bindTarget])

  return (
    <div>
      <svg
        ref={svgRef}
        viewBox="0 0 400 280"
        width="100%"
        className={isDragging ? "drag" : undefined}
        style={{ maxWidth: narrow ? 400 : 520 }}
      >
        <path d="M120 80 L200 40 L280 80 Z" fill={P.rose} stroke={INK} strokeWidth="2" />
        <text x="200" y="68" textAnchor="middle" fontSize="28" fontWeight="900">
          {problem.whole}
        </text>
        <circle cx="150" cy="140" r="36" fill={P.sky} stroke={INK} strokeWidth="2" />
        <text x="150" y="150" textAnchor="middle" fontSize="24" fontWeight="900">
          {problem.part}
        </text>
        <circle
          cx={FACT_SLOT.x}
          cy={FACT_SLOT.y}
          r="36"
          fill={P.cream}
          stroke={INK}
          strokeWidth="2"
          strokeDasharray="6 5"
          data-testid="slot"
        />
        {state.tile === null && (
          <text
            x={FACT_SLOT.x}
            y={FACT_SLOT.y + 10}
            textAnchor="middle"
            fontSize="24"
            fontWeight="900"
          >
            ?
          </text>
        )}
        <rect
          x="16"
          y="194"
          width="368"
          height="76"
          rx="20"
          fill={P.cream}
          fillOpacity={0.7}
          stroke={INK}
          strokeOpacity={0.18}
          strokeWidth="2"
        />
        {tiles.map((v, i) => (
          <g
            key={v}
            ref={(el) => {
              tileRefs.current[i] = el
            }}
            data-testid={`tile-${v}`}
            aria-label={`Tile ${v}`}
            className={pieceClass(live, still)}
            transform={svgT(dragTile?.v === v ? dragTile.pt : home(i))}
          >
            <rect
              x={-32}
              y={-32}
              width={64}
              height={64}
              rx="16"
              fill={P.butter}
              stroke={INK}
              strokeWidth="2"
            />
            <text y={9} textAnchor="middle" fontSize="26" fontWeight="900">
              {v}
            </text>
          </g>
        ))}
      </svg>
      <div style={{ marginTop: 12 }}>
        {lines.map((t, i) => (
          <p key={i} data-testid={`eq-${i}`} style={{ margin: "4px 0" }}>
            {t}
          </p>
        ))}
      </div>
    </div>
  )
}

const HOP_Y = 100
const hopX = (n: number) => 30 + (n - 5) * 34

function HopLineModel({
  problem,
  state,
  live,
  still,
  onChange,
}: {
  problem: AddProblem
  state: HopState
  live: boolean
  pacing?: boolean
  revealTotal?: boolean
  still: boolean
  onChange: OnChange
}) {
  const svgRef = React.useRef<SVGSVGElement>(null)
  const flagRef = React.useRef<SVGGElement>(null)
  const [dragX, setDragX] = React.useState<number | null>(null)
  const nearestTick = (x: number) => nearestBy(5, 20, (n) => Math.abs(hopX(n) - x))
  const land = dragX === null ? state.land : nearestTick(dragX)
  const x1 = hopX(problem.a)
  const x2 = hopX(land)
  const arcH = Math.min(70, 16 + Math.abs(x2 - x1) * 0.3)
  const lead: SvgPoint =
    land === problem.a ? { x: x1, y: HOP_Y } : { x: (x1 + x2) / 2, y: HOP_Y - arcH }

  const { bindTarget, isDragging } = useSvgDrag<true>(svgRef, live, {
    start: () => true,
    move: (pt) => setDragX(clamp(pt.x, hopX(5), hopX(20))),
    end: (pt, _ctx, moved, cancel) => {
      setDragX(null)
      if (cancel || !moved) return
      const n = nearestTick(pt.x)
      if (n !== state.land) onChange({ land: n }, "drag")
    },
  })

  React.useEffect(() => bindTarget(flagRef.current), [bindTarget])

  return (
    <div>
      <svg
        ref={svgRef}
        viewBox="0 0 570 240"
        width="100%"
        className={isDragging ? "drag" : undefined}
        style={{ maxWidth: 720 }}
      >
        <line
          x1="14"
          x2="556"
          y1={HOP_Y}
          y2={HOP_Y}
          stroke={INK}
          strokeWidth="4"
          strokeLinecap="round"
        />
        {Array.from({ length: 16 }).map((_, i) => {
          const n = i + 5
          return (
            <g
              key={n}
              data-testid={`tick-${n}`}
              style={{ cursor: live ? "pointer" : "default" }}
              onClick={() => live && onChange({ land: n }, "tap")}
            >
              <line
                x1={hopX(n)}
                x2={hopX(n)}
                y1={HOP_Y - 14}
                y2={HOP_Y + 14}
                stroke={INK}
                strokeWidth={n === 10 ? 4 : 2}
              />
              <text
                x={hopX(n)}
                y={HOP_Y + 36}
                textAnchor="middle"
                fontSize="16"
                fontWeight={n === 10 ? 900 : 800}
              >
                {n}
              </text>
              <rect x={hopX(n) - 17} y={HOP_Y - 30} width={34} height={74} fill="transparent" />
            </g>
          )
        })}
        {land !== problem.a && (
          <path
            d={`M ${x1} ${HOP_Y} Q ${(x1 + x2) / 2} ${HOP_Y - 2 * arcH} ${x2} ${HOP_Y}`}
            fill="none"
            stroke={P.rose}
            strokeWidth="4"
            pointerEvents="none"
          />
        )}
        <g
          ref={flagRef}
          data-testid="flag"
          className={pieceClass(live, still)}
          transform={svgT({ x: dragX ?? hopX(state.land), y: HOP_Y })}
        >
          <line x1="0" y1="-80" x2="0" y2="0" stroke={INK} strokeWidth="3" />
          <path d="M2 -80 L40 -68 L2 -56 Z" fill={P.rose} stroke={INK} strokeWidth="2" />
          <circle cx={0} cy={91} r={24} fill={P.rose} stroke={INK} strokeWidth="2" />
          <path d="M-8 91 l-8 -7 v14 z M8 91 l8 -7 v14 z" fill={INK} />
          <rect x={-28} y={-100} width={90} height={50} fill="transparent" />
          <rect x={-14} y={-84} width={28} height={190} fill="transparent" />
          <circle cx={0} cy={91} r={64} fill="transparent" data-testid="flag-hit" />
        </g>
        <g
          className={still ? undefined : "motion-move"}
          data-testid="lead-dot"
          transform={svgT(lead)}
          pointerEvents="none"
        >
          <circle r="8" fill={P.rose} stroke={INK} />
        </g>
      </svg>
    </div>
  )
}
