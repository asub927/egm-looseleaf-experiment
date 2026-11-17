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
import type { ProblemSpec } from "../models/problems"
import { bedById } from "../beds/registry"
import { useSvgDrag, type SvgPoint } from "../hooks/use-drag-kit"

const INK = "#2B2A3A"

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

function translate(p: SvgPoint): React.CSSProperties {
  return { transform: `translate(${p.x}px, ${p.y}px)` }
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
}) {
  const bed = bedById(bedId)
  const narrow = typeof window !== "undefined" && window.innerWidth <= 600
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
        fill="#FFF1B8"
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
          stroke="#B9A6F2"
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
          stroke={showCue && i >= problem.a ? "#7C6BFF" : "transparent"}
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
          fill="#FF9FB0"
          stroke={INK}
          opacity={carry?.from === "top" && i === top - 1 ? 0.3 : 1}
        />
      ))}
      {Array.from({ length: bottom }).map((_, i) => (
        <circle
          key={`b-${i}`}
          cx={beadX(i)}
          cy={150}
          r="12"
          fill="#FFF8EC"
          stroke={INK}
          opacity={carry?.from === "bottom" && i === bottom - 1 ? 0.3 : 1}
        />
      ))}
      <g>
        <rect
          ref={bottomRef}
          x="20"
          y="120"
          width="360"
          height="56"
          fill="transparent"
          className={live ? "grab" : undefined}
          data-testid="band-bottom"
        />
        <rect
          ref={topRef}
          x="20"
          y="44"
          width="360"
          height="56"
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
          fill={carry.from === "bottom" ? "#FFF8EC" : "#FF9FB0"}
          stroke={INK}
          opacity={0.9}
          pointerEvents="none"
        />
      )}
    </svg>
  )
}

const TRAIN_FIRST = 5
const TRAIN_LAST = 20

function TrainModel({
  problem,
  state,
  live,
  pacing,
  revealTotal,
  narrow,
  still,
  onChange,
}: {
  problem: AddProblem
  state: TrainState
  live: boolean
  pacing: boolean
  revealTotal: boolean
  narrow: boolean
  still: boolean
  onChange: OnChange
}) {
  const svgRef = React.useRef<SVGSVGElement>(null)
  const engineRef = React.useRef<SVGGElement>(null)
  const [dragPt, setDragPt] = React.useState<SvgPoint | null>(null)
  const cols = narrow ? 5 : 10
  const pitch = narrow ? 76 : 62
  const car = (n: number): SvgPoint => {
    const i = n - TRAIN_FIRST
    return { x: 48 + (i % cols) * pitch, y: 44 + Math.floor(i / cols) * 140 }
  }
  const track = (n: number): SvgPoint => ({ x: car(n).x, y: car(n).y + 38 })
  const enginePos = (n: number): SvgPoint => ({ x: car(n).x, y: car(n).y + 78 })
  const nearestCar = (pt: SvgPoint) =>
    Math.max(
      problem.a,
      nearestBy(TRAIN_FIRST, TRAIN_LAST, (n) => {
        const t = track(n)
        return Math.hypot(t.x - pt.x, t.y - pt.y)
      }),
    )
  const at = dragPt ? nearestCar(dragPt) : state.at
  const counted = state.at - problem.a

  const { bindTarget, isDragging } = useSvgDrag<true>(svgRef, live, {
    start: () => true,
    move: (pt) => setDragPt(pt),
    end: (pt, _ctx, moved, cancel) => {
      setDragPt(null)
      if (cancel || !moved) return
      const n = nearestCar(pt)
      if (n !== state.at) onChange({ at: n }, "drag")
    },
  })

  React.useEffect(() => bindTarget(engineRef.current), [bindTarget])

  return (
    <div>
      {pacing && (
        <div className="flowcounts" data-testid="flow-counts">
          <FlowCount label="Step" value={String(counted)} testId="flow-step" />
          <FlowCount
            label="Total"
            value={revealTotal ? String(state.at) : "—"}
            testId="flow-total"
            pending={!revealTotal}
          />
        </div>
      )}
      <svg
        ref={svgRef}
        viewBox={narrow ? "0 0 400 584" : "0 0 654 304"}
        width="100%"
        className={isDragging ? "drag" : undefined}
        style={{ maxWidth: 720 }}
      >
        {Array.from({ length: TRAIN_LAST - TRAIN_FIRST + 1 }).map((_, i) => {
          const n = i + TRAIN_FIRST
          const c = car(n)
          const tappable = live && n >= problem.a
          return (
            <g
              key={n}
              data-testid={`car-${n}`}
              style={{ cursor: tappable ? "pointer" : "default" }}
              onClick={() => {
                if (tappable && n !== state.at) onChange({ at: n }, "tap")
              }}
            >
              <rect
                x={c.x - 28}
                y={c.y - 28}
                width={56}
                height={56}
                rx="12"
                fill={n > problem.a && n <= at ? "#CDE8FF" : n <= problem.a ? "#D9CCFF" : "#fff"}
                stroke={INK}
                strokeWidth="2"
              />
              <text x={c.x} y={c.y + 7} textAnchor="middle" fontSize="20" fontWeight="900">
                {n}
              </text>
              <rect x={c.x - pitch / 2} y={c.y - 36} width={pitch} height={72} fill="transparent" />
            </g>
          )
        })}
        <circle
          className={still ? undefined : "motion-move"}
          data-testid="lead-dot"
          style={translate(track(at))}
          r="8"
          fill="#FFD1E3"
          stroke={INK}
          strokeWidth="2"
          pointerEvents="none"
        />
        <g
          ref={engineRef}
          data-testid="engine"
          className={pieceClass(live, still)}
          style={translate(dragPt ?? enginePos(state.at))}
        >
          <rect
            x={-44}
            y={-28}
            width={88}
            height={56}
            rx="16"
            fill="#FFD1E3"
            stroke={INK}
            strokeWidth="3"
          />
          <path d="M-12 0 l-12 -10 v20 z M12 0 l12 -10 v20 z" fill={INK} />
          <rect x={-48} y={-36} width={96} height={72} fill="transparent" />
        </g>
      </svg>
    </div>
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
      const next: CutState =
        state.phase === "toTen" && q <= 10
          ? { position: 10, phase: "rest" }
          : { position: q, phase: state.phase }
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
          fill={i >= position ? "none" : i < 10 ? "#FFB59E" : "#B8A6FF"}
          stroke={INK}
          strokeWidth="2"
          opacity={i >= position ? 0.35 : 1}
          data-testid={`dot-${i}`}
          style={{ cursor: live ? "pointer" : "default" }}
          onClick={() => {
            if (!live) return
            if (state.phase === "toTen") {
              if (i + 1 >= 10 && i + 1 <= n) onChange({ position: 10, phase: "rest" }, "tap")
              else if (i + 1 > 10) onChange({ position: i + 1, phase: "toTen" }, "tap")
            } else if (i + 1 < 10) {
              onChange({ position: i + 1, phase: "rest" }, "tap")
            }
          }}
        />
      ))}
      <g
        ref={cutRef}
        data-testid="cut"
        className={pieceClass(live, still)}
        style={translate({ x: dragX ?? cutX(state.position), y: 0 })}
      >
        <line x1={0} x2={0} y1={20} y2={100} stroke={INK} strokeWidth="4" strokeDasharray="4 8" />
        <circle cx={0} cy={132} r={22} fill="#FFD1E3" stroke={INK} strokeWidth="2" />
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

type AppleCarry = { dir: 1 | -1 }

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
  const need = Math.abs(problem.a - problem.b) / 2
  const left = problem.a - state.movesAcross
  const right = problem.b + state.movesAcross
  const tilt = clamp((right - left) * 3, -8, 8)
  const carried = carry ? (carry.dir > 0 ? left - 1 : left) : -1

  const { bindTarget, isDragging } = useSvgDrag<AppleCarry>(svgRef, live, {
    start: (pt) => {
      if (pt.x < SEESAW_PIVOT.x) return state.movesAcross < need ? { dir: 1 } : false
      return state.movesAcross > 0 ? { dir: -1 } : false
    },
    move: (pt, ctx) => setCarry({ ...ctx, pt }),
    end: (pt, ctx, moved, cancel) => {
      setCarry(null)
      if (cancel) return
      const crossed = ctx.dir > 0 ? pt.x > SEESAW_PIVOT.x : pt.x < SEESAW_PIVOT.x
      if (moved && !crossed) return
      const next = clamp(state.movesAcross + ctx.dir, 0, need)
      if (next !== state.movesAcross) onChange({ movesAcross: next }, moved ? "drag" : "tap")
    },
  })

  React.useEffect(() => {
    const offs = appleRefs.current.slice(0, problem.a).map((el) => bindTarget(el))
    return () => offs.forEach((off) => off())
  }, [bindTarget, problem.a])

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
          fill="#FFF1B8"
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
              fill="#9CCBF5"
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
            style={translate(j < left ? appleSlot(-1, j) : appleSlot(1, problem.b + j - left))}
            opacity={j === carried ? 0.3 : 1}
          >
            <circle r="16" fill="#FFB59E" stroke={INK} strokeWidth="2" />
            <circle r="20" fill="transparent" />
          </g>
        ))}
        {showCue && state.movesAcross < need && (
          <circle
            cx={appleSlot(1, right).x}
            cy={appleSlot(1, right).y}
            r="20"
            fill="none"
            stroke="#7C6BFF"
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
          fill="#FFB59E"
          stroke={INK}
          strokeWidth="2"
          opacity={0.9}
          pointerEvents="none"
        />
      )}
      <text x="200" y="210" textAnchor="middle" fontSize="14">
        Move {need} apple{need === 1 ? "" : "s"} across to level the seesaw
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
        <path d="M120 80 L200 40 L280 80 Z" fill="#FFD1E3" stroke={INK} strokeWidth="2" />
        <text x="200" y="68" textAnchor="middle" fontSize="28" fontWeight="900">
          {problem.whole}
        </text>
        <circle cx="150" cy="140" r="36" fill="#CDE8FF" stroke={INK} strokeWidth="2" />
        <text x="150" y="150" textAnchor="middle" fontSize="24" fontWeight="900">
          {problem.part}
        </text>
        <circle
          cx={FACT_SLOT.x}
          cy={FACT_SLOT.y}
          r="36"
          fill="#fff"
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
          fill="rgba(255,255,255,.7)"
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
            style={translate(dragTile?.v === v ? dragTile.pt : home(i))}
          >
            <rect
              x={-32}
              y={-32}
              width={64}
              height={64}
              rx="16"
              fill="#FFF1B8"
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
  pacing,
  revealTotal,
  still,
  onChange,
}: {
  problem: AddProblem
  state: HopState
  live: boolean
  pacing: boolean
  revealTotal: boolean
  still: boolean
  onChange: OnChange
}) {
  const svgRef = React.useRef<SVGSVGElement>(null)
  const flagRef = React.useRef<SVGGElement>(null)
  const [dragX, setDragX] = React.useState<number | null>(null)
  const nearestTick = (x: number) => nearestBy(5, 20, (n) => Math.abs(hopX(n) - x))
  const land = dragX === null ? state.land : nearestTick(dragX)
  const hops = state.land - problem.a
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
      {pacing && (
        <div className="flowcounts" data-testid="flow-counts">
          <FlowCount label="Hop" value={String(Math.max(0, hops))} testId="flow-step" />
          <FlowCount
            label="Land"
            value={revealTotal ? String(state.land) : "—"}
            testId="flow-total"
            pending={!revealTotal}
          />
        </div>
      )}
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
            stroke="#FF8FA8"
            strokeWidth="4"
            pointerEvents="none"
          />
        )}
        <g
          ref={flagRef}
          data-testid="flag"
          className={pieceClass(live, still)}
          style={translate({ x: dragX ?? hopX(state.land), y: HOP_Y })}
        >
          <line x1="0" y1="-80" x2="0" y2="0" stroke={INK} strokeWidth="3" />
          <path d="M2 -80 L40 -68 L2 -56 Z" fill="#FFD1E3" stroke={INK} strokeWidth="2" />
          <circle cx={0} cy={91} r={24} fill="#FFD1E3" stroke={INK} strokeWidth="2" />
          <path d="M-8 91 l-8 -7 v14 z M8 91 l8 -7 v14 z" fill={INK} />
          <rect x={-12} y={-84} width={54} height={34} fill="transparent" />
          <rect x={-12} y={-84} width={24} height={84} fill="transparent" />
          <circle cx={0} cy={91} r={45} fill="transparent" />
        </g>
        <circle
          className={still ? undefined : "motion-move"}
          data-testid="lead-dot"
          style={translate(lead)}
          r="8"
          fill="#FFD1E3"
          stroke={INK}
          pointerEvents="none"
        />
      </svg>
    </div>
  )
}

function FlowCount({
  label,
  value,
  testId,
  pending,
}: {
  label: string
  value: string
  testId: string
  pending?: boolean
}) {
  return (
    <div
      className={`flowcount ${label === "Total" || label === "Land" ? "total" : "step"}${pending ? "" : " revealed"}`}
      data-testid={`pill-${label === "Hop" || label === "Step" ? 0 : 1}`}
    >
      <span className="flowlabel">{label}</span>
      <span className={`flownum${pending ? " pending" : ""}`} data-testid={testId}>
        {value}
      </span>
    </div>
  )
}
