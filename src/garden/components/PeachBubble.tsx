import * as React from "react"
import type { PictureRow, WrongBubble } from "../types"
import { GARDEN_DEMO, GARDEN_INK, GARDEN_PALETTE } from "../types"
import { ReadAloudButton } from "./ReadAloudButton"

function SproutFace() {
  const INK = GARDEN_INK
  const LEAFC = GARDEN_DEMO.leaf
  const SOIL = GARDEN_DEMO.soil
  return (
    <svg className="face" viewBox="0 0 34 34" aria-hidden="true">
      <path d="M17 30 V16" stroke={INK} strokeWidth="2.5" strokeLinecap="round" />
      <ellipse
        cx="11"
        cy="14"
        rx="7"
        ry="4"
        fill={LEAFC}
        stroke={INK}
        strokeWidth="1.8"
        transform="rotate(-25 11 14)"
      />
      <ellipse
        cx="23"
        cy="12"
        rx="7"
        ry="4"
        fill={LEAFC}
        stroke={INK}
        strokeWidth="1.8"
        transform="rotate(25 23 12)"
      />
      <ellipse cx="17" cy="30" rx="10" ry="3" fill={SOIL} />
    </svg>
  )
}

function ObservationDots({ rows }: { rows: PictureRow[] }) {
  const max = Math.max(1, ...rows.map((r) => r.of))
  const w = 84 + max * 20
  const h = rows.length * 30 + 8
  return (
    <svg viewBox={`0 0 ${w} ${h}`} aria-hidden="true" width="100%">
      {rows.map((r, ri) => {
        const y = 19 + ri * 30
        return (
          <g key={r.label}>
            <text x={4} y={y + 5} fontSize={14} fontWeight={800} fill={GARDEN_INK}>
              {r.label}
            </text>
            {Array.from({ length: r.of }).map((_, i) =>
              i < r.n ? (
                <circle
                  key={i}
                  cx={86 + i * 20}
                  cy={y}
                  r={8}
                  fill={r.fill ?? GARDEN_PALETTE.peach}
                  stroke={GARDEN_INK}
                  strokeWidth={1.8}
                />
              ) : (
                <circle
                  key={i}
                  cx={86 + i * 20}
                  cy={y}
                  r={8}
                  fill="none"
                  stroke={GARDEN_INK}
                  strokeWidth={1.5}
                  strokeDasharray="3 3"
                  opacity={0.45}
                />
              ),
            )}
          </g>
        )
      })}
    </svg>
  )
}

export function PeachBubble({ guess, bubble }: { guess: number | null; bubble: WrongBubble }) {
  const [on, setOn] = React.useState(false)
  React.useEffect(() => {
    let inner = 0
    const outer = requestAnimationFrame(() => {
      inner = requestAnimationFrame(() => setOn(true))
    })
    return () => {
      cancelAnimationFrame(outer)
      cancelAnimationFrame(inner)
    }
  }, [])

  return (
    <div className={`bubble${on ? " on" : ""}`} data-testid="bubble" role="status">
      <SproutFace />
      <div className="msg">
        {guess !== null && (
          <span className="guess-tag" data-testid="guess-tag">
            Your guess was {guess}.
          </span>
        )}
        <strong>{bubble.title}</strong>
        <div>{bubble.body}</div>
        <div className="diag-art" data-testid="diag-art">
          <ObservationDots rows={bubble.pictureRows} />
        </div>
      </div>
      <ReadAloudButton
        className="read"
        getText={() => `${bubble.title} ${bubble.body}`}
        testId="read-bubble"
        label="Read bubble aloud"
      />
    </div>
  )
}
