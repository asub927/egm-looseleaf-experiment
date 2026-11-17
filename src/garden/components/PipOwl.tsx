import { GARDEN_INK, GARDEN_PALETTE } from "../types"

export function PipOwl({ sleep = false }: { sleep?: boolean }) {
  if (sleep) {
    return (
      <svg viewBox="0 0 80 92" aria-hidden="true" width="80" height="92">
        <path
          d="M17 24 L22 6 L33 19 Z M63 24 L58 6 L47 19 Z"
          fill={GARDEN_PALETTE.lavender}
          stroke={GARDEN_INK}
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
        <ellipse
          cx="40"
          cy="52"
          rx="28"
          ry="32"
          fill={GARDEN_PALETTE.lavender}
          stroke={GARDEN_INK}
          strokeWidth="2.5"
        />
        <path
          d="M23 40 q7 6 14 0 M43 40 q7 6 14 0"
          fill="none"
          stroke={GARDEN_INK}
          strokeWidth="2.8"
          strokeLinecap="round"
        />
      </svg>
    )
  }
  return (
    <svg viewBox="0 0 96 92" aria-hidden="true" width="96" height="92">
      <ellipse
        cx="48"
        cy="52"
        rx="28"
        ry="32"
        fill={GARDEN_PALETTE.lavender}
        stroke={GARDEN_INK}
        strokeWidth="2.5"
      />
      <circle
        cx="38"
        cy="39"
        r="9.5"
        fill={GARDEN_PALETTE.cream}
        stroke={GARDEN_INK}
        strokeWidth="2"
      />
      <circle
        cx="58"
        cy="39"
        r="9.5"
        fill={GARDEN_PALETTE.cream}
        stroke={GARDEN_INK}
        strokeWidth="2"
      />
      <circle cx="39" cy="40" r="4.3" fill={GARDEN_INK} />
      <circle cx="59" cy="40" r="4.3" fill={GARDEN_INK} />
      <path
        d="M44 47 L52 47 L48 54 Z"
        fill={GARDEN_PALETTE.butter}
        stroke={GARDEN_INK}
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  )
}
