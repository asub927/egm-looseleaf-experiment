import { GARDEN_DEMO, GARDEN_INK, GARDEN_PALETTE } from "../types"

const INK = GARDEN_INK
const SOIL = GARDEN_DEMO.soil
const LEAFC = GARDEN_DEMO.leaf
const MINT = GARDEN_PALETTE.mint
const ROSE = GARDEN_PALETTE.rose
const BUTTER = GARDEN_PALETTE.butter
const BLOOM = GARDEN_DEMO.bloomPetal

export function mossStage(leaves: number): string {
  if (leaves <= 0) return "seed"
  if (leaves < 4) return "sprout"
  if (leaves < 8) return "leafy"
  if (leaves < 12) return "bud"
  return "bloom"
}

/** Moss SVG ported from garden-map-demo `drawPet`. */
export function MossPet({ leaves }: { leaves: number }) {
  const stage = mossStage(leaves)
  const n = leaves
  const top = Math.max(8, 34 - Math.min(n, 12) * 2.2)
  const lv = Math.min(n, 10)
  const leafYs: { x: number; y: number; sd: number }[] = []
  for (let j = 0; j < lv; j++) {
    let y = 36 - j * ((36 - (top + 5)) / Math.max(lv - 1, 1))
    if (lv === 1) y = Math.max(top + 6, 30)
    const sd = j % 2 ? 1 : -1
    const x = 32 + sd * 8
    leafYs.push({ x, y, sd })
  }

  return (
    <svg
      className="pet"
      viewBox="0 0 64 64"
      aria-label={`Moss the plant pet: ${stage}, ${n} ${n === 1 ? "leaf" : "leaves"}`}
      data-testid="pet"
      data-leaves={n}
    >
      <ellipse cx="32" cy="56" rx="22" ry="6" fill={SOIL} stroke={INK} strokeWidth="2" />
      {n > 0 && (
        <path
          d={`M32 46 C30 40 34 ${top + 8} 32 ${top}`}
          fill="none"
          stroke={INK}
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      )}
      {leafYs.map(({ x, y, sd }, j) => (
        <ellipse
          key={j}
          cx={x}
          cy={y}
          rx="7.5"
          ry="3.6"
          fill={LEAFC}
          stroke={INK}
          strokeWidth="1.5"
          transform={`rotate(${sd * -28} ${x} ${y})`}
        />
      ))}
      {stage === "bud" && (
        <ellipse cx="32" cy={top - 3} rx="5" ry="6.5" fill={ROSE} stroke={INK} strokeWidth="1.8" />
      )}
      {stage === "bloom" && (
        <>
          {Array.from({ length: 5 }).map((_, a) => {
            const an = (a * 72 * Math.PI) / 180
            const cx = 32 + Math.cos(an) * 6
            const cy = top - 4 + Math.sin(an) * 6
            return (
              <circle key={a} cx={cx} cy={cy} r="4.5" fill={BLOOM} stroke={INK} strokeWidth="1.2" />
            )
          })}
          <circle cx="32" cy={top - 4} r="3" fill={BUTTER} stroke={INK} strokeWidth="1.2" />
        </>
      )}
      <ellipse cx="32" cy="49" rx="13" ry="10" fill={MINT} stroke={INK} strokeWidth="2" />
      <circle cx="27.5" cy="48" r="1.7" fill={INK} />
      <circle cx="36.5" cy="48" r="1.7" fill={INK} />
      <path
        d="M29.5 52 q2.5 2 5 0"
        fill="none"
        stroke={INK}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  )
}
