import { GARDEN_INK, GARDEN_PALETTE } from "../types"

/** Map Pip (demo owlSVG false). */
export function PipOwlMap() {
  return (
    <svg viewBox="0 0 96 92" aria-hidden="true" width="100%" height="auto">
      <path
        d="M25 24 L30 6 L41 19 Z M71 24 L66 6 L55 19 Z"
        fill="#B8A6FF"
        stroke={GARDEN_INK}
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <ellipse
        cx="48"
        cy="52"
        rx="28"
        ry="32"
        fill={GARDEN_PALETTE.lavender}
        stroke={GARDEN_INK}
        strokeWidth="2.5"
      />
      <ellipse
        cx="48"
        cy="63"
        rx="16"
        ry="17"
        fill="#FFF8F0"
        stroke={GARDEN_INK}
        strokeWidth="1.5"
      />
      <path
        d="M22 50 q-6 14 4 22 M74 50 q6 14 -4 22"
        fill="#B8A6FF"
        stroke={GARDEN_INK}
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <circle cx="38" cy="39" r="9.5" fill="#fff" stroke={GARDEN_INK} strokeWidth="2" />
      <circle cx="58" cy="39" r="9.5" fill="#fff" stroke={GARDEN_INK} strokeWidth="2" />
      <circle cx="39" cy="40" r="4.3" fill={GARDEN_INK} />
      <circle cx="59" cy="40" r="4.3" fill={GARDEN_INK} />
      <circle cx="40.6" cy="38.4" r="1.4" fill="#fff" />
      <circle cx="60.6" cy="38.4" r="1.4" fill="#fff" />
      <path
        d="M44 47 L52 47 L48 54 Z"
        fill={GARDEN_PALETTE.butter}
        stroke={GARDEN_INK}
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M39 83 v6 M44 84 v5 M52 84 v5 M57 83 v6"
        stroke="#E8A24A"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <g transform="translate(68,58)">
        <rect
          x="0"
          y="8"
          width="14"
          height="13"
          rx="3"
          fill={GARDEN_PALETTE.peach}
          stroke={GARDEN_INK}
          strokeWidth="2"
        />
        <path
          d="M14 11 h6 l2 4 h-8"
          fill={GARDEN_PALETTE.peach}
          stroke={GARDEN_INK}
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <path
          d="M3 8 V4 h8 V8"
          fill="none"
          stroke={GARDEN_INK}
          strokeWidth="2"
          strokeLinecap="round"
        />
        <circle cx="7" cy="15" r="1.4" fill={GARDEN_INK} />
      </g>
    </svg>
  )
}

export function PipOwl({ sleep = false }: { sleep?: boolean }) {
  if (sleep) {
    return (
      <svg viewBox="0 0 80 92" aria-hidden="true" width="80" height="92">
        <path
          d="M17 24 L22 6 L33 19 Z M63 24 L58 6 L47 19 Z"
          fill="#B8A6FF"
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
  return <PipOwlMap />
}
