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

const INK = "#2B2A3A"

export function ModelStage({
  bedId,
  problem,
  modelState,
  live,
  showCue,
  revealTotal,
  onChange,
  reducedMotion,
}: {
  bedId: BedId
  problem: ProblemSpec
  modelState: ModelState
  live: boolean
  showCue: boolean
  revealTotal: boolean
  onChange: (next: ModelState, via: "tap" | "drag") => void
  reducedMotion: boolean
}) {
  const bed = bedById(bedId)
  const narrow = typeof window !== "undefined" && window.innerWidth <= 600

  switch (bed.modelKind) {
    case "bead-rack":
      return (
        <BeadRack
          problem={problem}
          state={modelState as BeadState}
          live={live}
          showCue={showCue}
          onChange={onChange}
        />
      )
    case "train":
      return (
        <TrainModel
          problem={problem}
          state={modelState as TrainState}
          live={live}
          showCue={showCue}
          pacing={bed.pacing}
          revealTotal={revealTotal}
          narrow={narrow}
          reducedMotion={reducedMotion}
          onChange={onChange}
        />
      )
    case "cut":
      return (
        <CutModel
          problem={problem}
          state={modelState as CutState}
          live={live}
          showCue={showCue}
          onChange={onChange}
        />
      )
    case "seesaw":
      return (
        <SeesawModel
          problem={problem}
          state={modelState as SeesawState}
          live={live}
          showCue={showCue}
          onChange={onChange}
        />
      )
    case "fact-house":
      return (
        <FactHouseModel
          problem={problem}
          state={modelState as FactState}
          live={live}
          showCue={showCue}
          locked={!live}
          narrow={narrow}
          onChange={onChange}
        />
      )
    case "hop-line":
      return (
        <HopLineModel
          problem={problem}
          state={modelState as HopState}
          live={live}
          showCue={showCue}
          pacing={bed.pacing}
          revealTotal={revealTotal}
          reducedMotion={reducedMotion}
          onChange={onChange}
        />
      )
    default: {
      const _exhaustive: never = bed.modelKind
      return _exhaustive
    }
  }
}

function BeadRack({
  problem,
  state,
  live,
  showCue,
  onChange,
}: {
  problem: ProblemSpec
  state: BeadState
  live: boolean
  showCue: boolean
  onChange: (n: ModelState, via: "tap" | "drag") => void
}) {
  if (problem.kind !== "add") return null
  const top = problem.a + state.moved
  const bottom = problem.b - state.moved
  const max = beadMaxMove(problem, state.moved)
  return (
    <svg viewBox="0 0 400 220" width="100%" style={{ maxWidth: 640 }} aria-hidden="true">
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
          cx={40 + i * 34}
          cy={70}
          r="16"
          fill="none"
          stroke={showCue && i >= problem.a ? "#7C6BFF" : "transparent"}
          strokeWidth="2"
          strokeDasharray="4 4"
        />
      ))}
      {Array.from({ length: top }).map((_, i) => (
        <circle key={`t-${i}`} cx={40 + i * 34} cy={70} r="12" fill="#FF9FB0" stroke={INK} />
      ))}
      {Array.from({ length: bottom }).map((_, i) => (
        <circle key={`b-${i}`} cx={40 + i * 34} cy={150} r="12" fill="#FFF8EC" stroke={INK} />
      ))}
      <g>
        <rect
          x="20"
          y="120"
          width="360"
          height="56"
          fill="transparent"
          style={{ cursor: live ? "pointer" : "default" }}
          data-testid="band-bottom"
          onClick={() => {
            if (!live || state.moved >= max) return
            onChange({ moved: state.moved + 1 }, "tap")
          }}
        />
        <rect
          x="20"
          y="44"
          width="360"
          height="56"
          fill="transparent"
          style={{ cursor: live ? "pointer" : "default" }}
          data-testid="band-top"
          onClick={() => {
            if (!live || state.moved <= 0) return
            onChange({ moved: state.moved - 1 }, "tap")
          }}
        />
      </g>
    </svg>
  )
}

function TrainModel({
  problem,
  state,
  live,
  pacing,
  revealTotal,
  narrow,
  reducedMotion,
  onChange,
}: {
  problem: ProblemSpec
  state: TrainState
  live: boolean
  showCue: boolean
  pacing: boolean
  revealTotal: boolean
  narrow: boolean
  reducedMotion: boolean
  onChange: (n: ModelState, via: "tap" | "drag") => void
}) {
  if (problem.kind !== "add") return null
  const counted = state.at - problem.a
  const cols = narrow ? 5 : 10
  return (
    <div>
      {pacing && (
        <div
          className="flow-counts"
          data-testid="flow-counts"
          style={{ display: "flex", gap: 24, marginBottom: 8 }}
        >
          <FlowCount label="Step" value={String(counted)} testId="flow-step" />
          <FlowCount
            label="Total"
            value={revealTotal ? String(state.at) : "—"}
            testId="flow-total"
            pending={!revealTotal}
          />
        </div>
      )}
      <svg viewBox={narrow ? "0 0 400 200" : "0 0 520 200"} width="100%" style={{ maxWidth: 720 }}>
        {Array.from({ length: 16 }).map((_, i) => {
          const n = i + 5
          if (n > 20) return null
          const row = narrow ? Math.floor(i / 5) : n > 14 ? 1 : 0
          const col = narrow ? i % 5 : n <= 14 ? n - 5 : n - 15
          const cx = 36 + col * (narrow ? 72 : 48)
          const cy = 50 + row * 80
          const filled = n <= problem.a || n <= state.at
          return (
            <g key={n} data-testid={`car-${n}`}>
              <rect
                x={cx - 28}
                y={cy - 22}
                width={56}
                height={44}
                rx="10"
                fill={n <= state.at && n > problem.a ? "#CDE8FF" : filled ? "#D9CCFF" : "#fff"}
                stroke={INK}
                strokeWidth="2"
                style={{ cursor: live && n >= problem.a ? "pointer" : "default" }}
                onClick={() => {
                  if (!live || n < problem.a) return
                  onChange({ at: n }, "tap")
                }}
              />
              <text x={cx} y={cy + 6} textAnchor="middle" fontSize="18" fontWeight="900">
                {n}
              </text>
            </g>
          )
        })}
        <circle
          className={reducedMotion ? "" : "motion-move"}
          data-testid="lead-dot"
          cx={36 + ((state.at - 5) % cols) * (narrow ? 72 : 48)}
          cy={state.at > 14 && !narrow ? 130 : 50}
          r="8"
          fill="#FFD1E3"
          stroke={INK}
          strokeWidth="2"
        />
        <g data-testid="engine">
          <rect
            x={36 + ((problem.a - 5) % cols) * (narrow ? 72 : 48) - 32}
            y={problem.a > 14 && !narrow ? 108 : 28}
            width={64}
            height={36}
            rx="12"
            fill="#FFD1E3"
            stroke={INK}
            strokeWidth="2"
          />
        </g>
      </svg>
    </div>
  )
}

function CutModel({
  problem,
  state,
  live,
  onChange,
}: {
  problem: ProblemSpec
  state: CutState
  live: boolean
  showCue: boolean
  onChange: (n: ModelState, via: "tap" | "drag") => void
}) {
  if (problem.kind !== "sub") return null
  const n = problem.n
  return (
    <svg viewBox="0 0 440 120" width="100%" style={{ maxWidth: 640 }}>
      {Array.from({ length: n }).map((_, i) => (
        <circle
          key={i}
          cx={24 + i * 32}
          cy={60}
          r="14"
          fill={i >= state.position ? "none" : i < 10 ? "#FFB59E" : "#B8A6FF"}
          stroke={INK}
          strokeWidth="2"
          opacity={i >= state.position ? 0.35 : 1}
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
      <line
        data-testid="cut"
        x1={24 + state.position * 32 - 16}
        x2={24 + state.position * 32 - 16}
        y1={20}
        y2={100}
        stroke={INK}
        strokeWidth="4"
        strokeDasharray="4 8"
      />
      <text x="200" y="110" textAnchor="middle" fontSize="14">
        {state.position} left · {state.phase === "toTen" ? "cut down to ten" : "take the rest"}
      </text>
    </svg>
  )
}

function SeesawModel({
  problem,
  state,
  live,
  showCue,
  onChange,
}: {
  problem: ProblemSpec
  state: SeesawState
  live: boolean
  showCue: boolean
  onChange: (n: ModelState, via: "tap" | "drag") => void
}) {
  if (problem.kind !== "add") return null
  const need = Math.abs(problem.a - problem.b) / 2
  const left = problem.a - state.movesAcross
  const right = problem.b + state.movesAcross
  const tilt = Math.max(-8, Math.min(8, (right - left) * 3))
  return (
    <svg viewBox="0 0 400 200" width="100%" style={{ maxWidth: 560 }}>
      <g transform={`translate(200 120) rotate(${tilt})`} data-testid="beam">
        <rect
          x="-160"
          y="-8"
          width="320"
          height="16"
          rx="8"
          fill="#FFF1B8"
          stroke={INK}
          strokeWidth="2"
        />
        <text x="-80" y="36" textAnchor="middle" fontSize="28" fontWeight="900">
          {left}
        </text>
        <text x="80" y="36" textAnchor="middle" fontSize="28" fontWeight="900">
          {right}
        </text>
        {Array.from({ length: problem.a }).map((_, i) => (
          <circle
            key={`l-${i}`}
            cx={-120 + (i % 4) * 28}
            cy={-28 - Math.floor(i / 4) * 26}
            r="14"
            fill={i >= problem.a - state.movesAcross ? "none" : "#FFB59E"}
            stroke={INK}
            strokeWidth="2"
            data-testid={`apple-l-${i}`}
            style={{ cursor: live && i >= problem.a - state.movesAcross ? "pointer" : "default" }}
            onClick={() => {
              if (!live || i < problem.a - state.movesAcross) return
              if (state.movesAcross < need) onChange({ movesAcross: state.movesAcross + 1 }, "tap")
            }}
          />
        ))}
        {Array.from({ length: problem.b }).map((_, i) => (
          <circle
            key={`r-${i}`}
            cx={100 + (i % 4) * 28}
            cy={-28 - Math.floor(i / 4) * 26}
            r="14"
            fill="#9CCBF5"
            stroke={INK}
            data-testid={`apple-r-${i}`}
          />
        ))}
        {showCue && state.movesAcross < need && (
          <circle
            cx={-60}
            cy={-40}
            r="20"
            fill="none"
            stroke="#7C6BFF"
            strokeWidth="2"
            strokeDasharray="4 4"
          />
        )}
      </g>
      <text x="200" y="185" textAnchor="middle" fontSize="14">
        Move {need} apple{need === 1 ? "" : "s"} across to level the seesaw
      </text>
    </svg>
  )
}

function FactHouseModel({
  problem,
  state,
  live,
  showCue: _showCue,
  locked,
  narrow,
  onChange,
}: {
  problem: ProblemSpec
  state: FactState
  live: boolean
  showCue: boolean
  locked: boolean
  narrow: boolean
  onChange: (n: ModelState, via: "tap" | "drag") => void
}) {
  if (problem.kind !== "fact") return null
  const miss = problem.whole - problem.part
  const tiles = [miss - 2, miss - 1, miss, miss + 1, miss + 2]
  const X = state.tile
  const lines =
    X === null || locked
      ? [
          `Does ${problem.part} + ? make ${problem.whole}?`,
          `Does ? + ${problem.part} make ${problem.whole}?`,
          `Does ${problem.whole} − ${problem.part} leave ?`,
          `Does ${problem.whole} − ? leave ${problem.part}?`,
        ]
      : [
          `Does ${problem.part} + ${X} make ${problem.whole}?`,
          `Does ${X} + ${problem.part} make ${problem.whole}?`,
          `Does ${problem.whole} − ${problem.part} leave ${X}?`,
          `Does ${problem.whole} − ${X} leave ${problem.part}?`,
        ]
  return (
    <div>
      <svg viewBox="0 0 400 220" width="100%" style={{ maxWidth: narrow ? 400 : 520 }}>
        <path d="M120 80 L200 40 L280 80 Z" fill="#FFD1E3" stroke={INK} strokeWidth="2" />
        <text x="200" y="68" textAnchor="middle" fontSize="28" fontWeight="900">
          {problem.whole}
        </text>
        <circle cx="150" cy="140" r="36" fill="#CDE8FF" stroke={INK} strokeWidth="2" />
        <text x="150" y="150" textAnchor="middle" fontSize="24" fontWeight="900">
          {problem.part}
        </text>
        <circle
          cx="250"
          cy="140"
          r="36"
          fill="#fff"
          stroke={INK}
          strokeWidth="2"
          strokeDasharray="6 5"
          data-testid="slot"
        />
        <text x="250" y="150" textAnchor="middle" fontSize="24" fontWeight="900">
          {X ?? "?"}
        </text>
      </svg>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
        {tiles.map((v) => (
          <button
            key={v}
            type="button"
            className="garden-tap"
            data-testid={`tile-${v}`}
            disabled={!live}
            aria-label={`Tile ${v}`}
            onClick={() => onChange({ tile: state.tile === v ? null : v }, "tap")}
          >
            {v}
          </button>
        ))}
      </div>
      <div style={{ marginTop: 12 }}>
        {lines.map((t, i) => (
          <p
            key={i}
            data-testid={`eq-${i}`}
            style={{
              fontStyle: X !== null && !locked ? "italic" : "normal",
              margin: "4px 0",
            }}
          >
            {t}
          </p>
        ))}
      </div>
    </div>
  )
}

function HopLineModel({
  problem,
  state,
  live,
  pacing,
  revealTotal,
  reducedMotion,
  onChange,
}: {
  problem: ProblemSpec
  state: HopState
  live: boolean
  showCue: boolean
  pacing: boolean
  revealTotal: boolean
  reducedMotion: boolean
  onChange: (n: ModelState, via: "tap" | "drag") => void
}) {
  if (problem.kind !== "add") return null
  const hops = state.land - problem.a
  const X = (n: number) => 40 + (n - 5) * 42
  const showSplit = state.land > 10 && problem.a < 10
  return (
    <div>
      {pacing && (
        <div
          className="flow-counts"
          data-testid="flow-counts"
          style={{ display: "flex", gap: 24, marginBottom: 8 }}
        >
          <FlowCount label="Hop" value={String(Math.max(0, hops))} testId="flow-step" />
          <FlowCount
            label="Land"
            value={revealTotal ? String(state.land) : "—"}
            testId="flow-total"
            pending={!revealTotal}
          />
        </div>
      )}
      <svg viewBox="0 0 480 160" width="100%" style={{ maxWidth: 720 }}>
        <line x1="30" x2="450" y1="90" y2="90" stroke={INK} strokeWidth="4" strokeLinecap="round" />
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
                x1={X(n)}
                x2={X(n)}
                y1={76}
                y2={104}
                stroke={INK}
                strokeWidth={n === 10 ? 4 : 2}
              />
              <text
                x={X(n)}
                y={124}
                textAnchor="middle"
                fontSize="16"
                fontWeight={n === 10 ? 900 : 800}
              >
                {n}
              </text>
            </g>
          )
        })}
        {showSplit ? (
          <>
            <path
              d={`M ${X(problem.a)} 90 Q ${(X(problem.a) + X(10)) / 2} 40 ${X(10)} 90`}
              fill="none"
              stroke="#FF8FA8"
              strokeWidth="4"
            />
            <path
              d={`M ${X(10)} 90 Q ${(X(10) + X(state.land)) / 2} 40 ${X(state.land)} 90`}
              fill="none"
              stroke="#FF8FA8"
              strokeWidth="4"
            />
          </>
        ) : (
          hops !== 0 && (
            <path
              d={`M ${X(problem.a)} 90 Q ${(X(problem.a) + X(state.land)) / 2} 50 ${X(state.land)} 90`}
              fill="none"
              stroke="#FF8FA8"
              strokeWidth="4"
            />
          )
        )}
        <g data-testid="flag" transform={`translate(${X(state.land)}, 90)`}>
          <line x1="0" y1="-70" x2="0" y2="0" stroke={INK} strokeWidth="3" />
          <path d="M2 -70 L40 -58 L2 -46 Z" fill="#FFD1E3" stroke={INK} strokeWidth="2" />
        </g>
        <circle
          className={reducedMotion ? "" : "motion-move"}
          data-testid="lead-dot"
          cx={X(state.land)}
          cy={55}
          r="8"
          fill="#FFD1E3"
          stroke={INK}
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
      <span className={`flow-count ${pending ? "pending" : ""}`} data-testid={testId}>
        {value}
      </span>
    </div>
  )
}
