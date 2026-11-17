import type { PictureRow, WrongBubble } from "../types"
import { ReadAloudButton } from "./ReadAloudButton"

function ObservationDots({ rows }: { rows: PictureRow[] }) {
  const max = Math.max(1, ...rows.map((r) => r.of))
  const w = 84 + max * 20
  const h = rows.length * 30 + 8
  return (
    <svg viewBox={`0 0 ${w} ${h}`} aria-hidden="true" width="100%" style={{ maxWidth: 280 }}>
      {rows.map((r, ri) => {
        const y = 19 + ri * 30
        return (
          <g key={r.label}>
            <text x={4} y={y + 5} fontSize={14} fontWeight={800} fill="#2B2A3A">
              {r.label}
            </text>
            {Array.from({ length: r.of }).map((_, i) =>
              i < r.n ? (
                <circle
                  key={i}
                  cx={86 + i * 20}
                  cy={y}
                  r={8}
                  fill={r.fill ?? "#FFB59E"}
                  stroke="#2B2A3A"
                  strokeWidth={1.8}
                />
              ) : (
                <circle
                  key={i}
                  cx={86 + i * 20}
                  cy={y}
                  r={8}
                  fill="none"
                  stroke="#2B2A3A"
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
  return (
    <div className="peach-bubble motion-fade" data-testid="bubble" role="status">
      {guess !== null && (
        <div data-testid="guess-tag" style={{ fontWeight: 700, marginBottom: 8 }}>
          Your guess was {guess}.
        </div>
      )}
      <strong>{bubble.title}</strong>
      <p style={{ margin: "8px 0" }}>{bubble.body}</p>
      <ReadAloudButton getText={() => `${bubble.title} ${bubble.body}`} testId="read-bubble" />
      <div data-testid="diag-art">
        <ObservationDots rows={bubble.pictureRows} />
      </div>
    </div>
  )
}
