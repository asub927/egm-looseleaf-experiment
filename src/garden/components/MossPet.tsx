export function mossStage(leaves: number): string {
  if (leaves <= 0) return "seed"
  if (leaves < 4) return "sprout"
  if (leaves < 8) return "leafy"
  if (leaves < 12) return "bud"
  return "bloom"
}

export function MossPet({ leaves }: { leaves: number }) {
  const stage = mossStage(leaves)
  const lv = Math.min(leaves, 10)
  return (
    <svg
      className="pet"
      viewBox="0 0 64 64"
      width={48}
      height={48}
      aria-label={`Moss the plant pet: ${stage}, ${leaves} ${leaves === 1 ? "leaf" : "leaves"}`}
      data-testid="pet"
      data-leaves={leaves}
    >
      <ellipse cx="32" cy="56" rx="22" ry="6" fill="#E8D9C4" stroke="#2B2A3A" strokeWidth="2" />
      {lv > 0 &&
        Array.from({ length: lv }).map((_, j) => {
          const y = 36 - j * 3
          const sd = j % 2 ? 1 : -1
          const x = 32 + sd * 8
          return (
            <ellipse
              key={j}
              cx={x}
              cy={y}
              rx={7.5}
              ry={3.6}
              fill="#7BC47F"
              stroke="#2B2A3A"
              strokeWidth={1.5}
              transform={`rotate(${sd * -28} ${x} ${y})`}
            />
          )
        })}
      <ellipse cx="32" cy="49" rx="13" ry="10" fill="#C9F2DD" stroke="#2B2A3A" strokeWidth="2" />
      {stage === "bloom" && (
        <circle cx="32" cy="28" r="5" fill="#FFD1E3" stroke="#2B2A3A" strokeWidth="1.2" />
      )}
    </svg>
  )
}
