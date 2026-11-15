"use client"

import * as React from "react"
import { useDeclarativeDrag, type SnapTarget } from "@/lib/drag/declarative-drag"
import { playSliceThud } from "@/lib/audio/sfx"
import { cn } from "@/lib/utils"

export interface BakingPanProps {
  cuts: number[] // Normalized divider positions [c_1, ..., c_{k-1}] in [0, 1]
  targetShares: 2 | 3 | 4
  isGhostVisible?: boolean
  onCutsChange: (cuts: number[]) => void
  svgRef: React.RefObject<SVGSVGElement | null>
  className?: string
  context?: string
  icon?: string
}

const PAN_X = 120
const PAN_Y = 70
const PAN_W = 560
const PAN_H = 360
const PAN_MAX_X = PAN_X + PAN_W // 680

const WATERCOLOR_FILLS = [
  "rgba(251, 207, 232, 0.55)", // pastel rose strawberry
  "rgba(254, 240, 138, 0.55)", // pastel lemon chiffon
  "rgba(187, 247, 208, 0.55)", // pastel pistachio mint
  "rgba(233, 213, 255, 0.55)", // pastel blueberry lilac
]

export function BakingPan({
  cuts,
  targetShares,
  isGhostVisible = false,
  onCutsChange,
  svgRef,
  className,
  context = "brownies",
  icon = "🍫",
}: BakingPanProps) {
  // Local state for smooth drag visualization
  const [dragVal, setDragVal] = React.useState<number | null>(null)

  const targetValue = 1 / targetShares

  const targets = React.useMemo<SnapTarget[]>(() => {
    const label =
      targetShares === 2
        ? "2 Halves"
        : targetShares === 3
          ? "3 Thirds"
          : "4 Fourths"
    return [
      {
        id: `equal-${targetShares}`,
        value: targetValue,
        shares: targetShares,
        label,
      },
    ]
  }, [targetShares, targetValue])

  const drag = useDeclarativeDrag({
    mode: "linear-horizontal",
    svgRef,
    bounds: { min: PAN_X, max: PAN_MAX_X },
    targets,
    snapThreshold: 0.05,
    releaseThreshold: 0.10,
    onSnap: () => {
      playSliceThud()
    },
    onTransform: (val) => {
      setDragVal(val)
    },
    onCommit: (val, snapped) => {
      const primary = snapped ? snapped.value : val
      const newCuts: number[] = []
      for (let i = 1; i < targetShares; i++) {
        newCuts.push(Math.round(i * primary * 1000) / 1000)
      }
      setDragVal(null)
      onCutsChange(newCuts)
    },
  })

  // Determine current active cut positions
  const isDragging = dragVal !== null
  const activeSpacing = isDragging
    ? dragVal
    : cuts.length > 0
      ? cuts[0]
      : 0

  const activeCuts = React.useMemo(() => {
    if (isDragging) {
      const result: number[] = []
      for (let i = 1; i < targetShares; i++) {
        result.push(Math.max(0.01, Math.min(0.99, i * activeSpacing)))
      }
      return result
    }
    return cuts.map((c) => Math.max(0.01, Math.min(0.99, c))).sort((a, b) => a - b)
  }, [isDragging, activeSpacing, targetShares, cuts])

  // Slice intervals [0, c_1, ..., 1]
  const sliceBounds = React.useMemo(() => {
    if (activeCuts.length === 0) return [0, 1]
    return [0, ...activeCuts, 1]
  }, [activeCuts])

  // Ghost guide positions
  const ghostPositions = React.useMemo(() => {
    if (!isGhostVisible) return []
    const positions: number[] = []
    for (let i = 1; i < targetShares; i++) {
      positions.push(PAN_X + (i / targetShares) * PAN_W)
    }
    return positions
  }, [isGhostVisible, targetShares])

  const singularShareName =
    targetShares === 2 ? "half" : targetShares === 3 ? "third" : "fourth"

  // Primary handle position
  const handleX = PAN_X + activeSpacing * PAN_W
  const handleY = 48

  // Surface texture / fill according to context
  const isCake = context.toLowerCase().includes("cake")
  const isCornbread = context.toLowerCase().includes("cornbread")

  const rimMetallicColor = "#b8d9cf"
  const rimInnerColor = "#e7f3ef"

  return (
    <svg
      ref={svgRef}
      viewBox="0 0 800 500"
      className={cn("w-full h-full select-none touch-none", className)}
      onPointerMove={drag.handlePointerMove}
      onPointerUp={drag.handlePointerUp}
      onPointerCancel={drag.handlePointerUp}
    >
      <defs>
        {/* Soft Drop Shadows */}
        <filter id="pan-shadow" x="-5%" y="-5%" width="110%" height="115%">
          <feDropShadow dx="0" dy="6" stdDeviation="6" floodOpacity="0.14" />
        </filter>
        <filter id="badge-shadow" x="-10%" y="-10%" width="120%" height="125%">
          <feDropShadow dx="0" dy="2" stdDeviation="2.5" floodOpacity="0.12" />
        </filter>
        <filter id="handle-shadow" x="-15%" y="-15%" width="130%" height="135%">
          <feDropShadow dx="0" dy="3" stdDeviation="3" floodOpacity="0.18" />
        </filter>

        {/* Pastel Ceramic Pan Rim Gradients */}
        <linearGradient id="metallic-rim" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#f3faf7" />
          <stop offset="50%" stopColor="#e7f3ef" />
          <stop offset="100%" stopColor="#b8d9cf" />
        </linearGradient>

        {/* Pastel Sponge & Cake Texture */}
        <linearGradient id="brownie-surface" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fef3c7" />
          <stop offset="50%" stopColor="#fde68a" />
          <stop offset="100%" stopColor="#fcd34d" />
        </linearGradient>

        {/* Sheet Cake Texture */}
        <linearGradient id="cake-surface" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#fffbeb" />
          <stop offset="100%" stopColor="#fef08a" />
        </linearGradient>

        {/* Cornbread Texture */}
        <linearGradient id="cornbread-surface" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fef9c3" />
          <stop offset="100%" stopColor="#fde047" />
        </linearGradient>

        {/* Pastel Coral / Rose Handle */}
        <linearGradient id="wood-handle" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#fbcfe8" />
          <stop offset="50%" stopColor="#f472b6" />
          <stop offset="100%" stopColor="#fb7185" />
        </linearGradient>
      </defs>

      {/* 1. Outer Ceramic Baking Dish Rim */}
      <g id="pan-frame" filter="url(#pan-shadow)">
        {/* Outer Heavy Rim */}
        <rect
          x={PAN_X - 14}
          y={PAN_Y - 14}
          width={PAN_W + 28}
          height={PAN_H + 28}
          rx={20}
          fill="url(#metallic-rim)"
          stroke="#9fc3b8"
          strokeWidth={2.5}
        />
        {/* Inner Pan Bevel */}
        <rect
          x={PAN_X - 6}
          y={PAN_Y - 6}
          width={PAN_W + 12}
          height={PAN_H + 12}
          rx={15}
          fill={rimInnerColor}
          stroke={rimMetallicColor}
          strokeWidth={1.5}
        />
        {/* Pan Corner Accents */}
        <circle cx={PAN_X - 2} cy={PAN_Y - 2} r={3.5} fill="#a7cdc2" />
        <circle cx={PAN_MAX_X + 2} cy={PAN_Y - 2} r={3.5} fill="#a7cdc2" />
        <circle cx={PAN_X - 2} cy={PAN_Y + PAN_H + 2} r={3.5} fill="#a7cdc2" />
        <circle cx={PAN_MAX_X + 2} cy={PAN_Y + PAN_H + 2} r={3.5} fill="#a7cdc2" />
      </g>

      {/* 2. Baking Pan Interior Surface */}
      <g id="pan-interior">
        <rect
          x={PAN_X}
          y={PAN_Y}
          width={PAN_W}
          height={PAN_H}
          rx={10}
          fill={
            isCake
              ? "url(#cake-surface)"
              : isCornbread
                ? "url(#cornbread-surface)"
                : "url(#brownie-surface)"
          }
          stroke="#1e293b"
          strokeWidth={1}
        />

        {/* Tactile Crumb / Crinkle Texture */}
        {!isCake && (
          <g opacity={0.35} fill="#1c1917">
            <circle cx={PAN_X + 60} cy={PAN_Y + 50} r={2} />
            <circle cx={PAN_X + 180} cy={PAN_Y + 120} r={1.5} />
            <circle cx={PAN_X + 280} cy={PAN_Y + 70} r={2.5} />
            <circle cx={PAN_X + 390} cy={PAN_Y + 140} r={2} />
            <circle cx={PAN_X + 480} cy={PAN_Y + 90} r={1.5} />
            <circle cx={PAN_X + 120} cy={PAN_Y + 220} r={2} />
            <circle cx={PAN_X + 230} cy={PAN_Y + 290} r={2.5} />
            <circle cx={PAN_X + 340} cy={PAN_Y + 240} r={1.5} />
            <circle cx={PAN_X + 450} cy={PAN_Y + 310} r={2} />
            <circle cx={PAN_X + 510} cy={PAN_Y + 210} r={2.5} />
          </g>
        )}
      </g>

      {/* 3. Slice Regions with Soft Watercolor Fills & Verbal Badges */}
      {sliceBounds.length > 2 && (
        <g id="pan-slices">
          {sliceBounds.slice(0, -1).map((startBound, idx) => {
            const endBound = sliceBounds[idx + 1]
            const sliceLeft = PAN_X + startBound * PAN_W
            const sliceRight = PAN_X + endBound * PAN_W
            const sliceWidth = sliceRight - sliceLeft
            const sliceCenter = sliceLeft + sliceWidth / 2
            const fillColor = WATERCOLOR_FILLS[idx % WATERCOLOR_FILLS.length]

            return (
              <g key={`slice-${idx}`}>
                {/* Watercolor Fill Rect */}
                <rect
                  x={sliceLeft}
                  y={PAN_Y}
                  width={sliceWidth}
                  height={PAN_H}
                  fill={fillColor}
                  stroke="rgba(120, 53, 15, 0.45)"
                  strokeWidth={1.5}
                />

                {/* Verbal Badge: [1 half], [1 third], [1 fourth] */}
                {sliceWidth >= 56 && (
                  <g
                    transform={`translate(${sliceCenter}, ${PAN_Y + PAN_H / 2})`}
                    filter="url(#badge-shadow)"
                  >
                    <rect
                      x={-38}
                      y={-14}
                      width={76}
                      height={28}
                      rx={14}
                      fill="#ffffff"
                      stroke="#f472b6"
                      strokeWidth={1.5}
                    />
                    <text
                      x={0}
                      y={0}
                      textAnchor="middle"
                      dominantBaseline="central"
                      fontSize={12}
                      fontWeight="bold"
                      fill="#9d174d"
                    >
                      [1 {singularShareName}]
                    </text>
                  </g>
                )}
              </g>
            )
          })}
        </g>
      )}

      {/* 4. Dotted Guide Lines (Ghost Visual Assist on Tier 2 Scaffolding) */}
      {isGhostVisible && (
        <g id="ghost-guides">
          {ghostPositions.map((gx, idx) => (
            <g key={`ghost-${idx}`}>
              <line
                x1={gx}
                y1={PAN_Y}
                x2={gx}
                y2={PAN_Y + PAN_H}
                stroke="#2563eb"
                strokeWidth={3}
                strokeDasharray="8 6"
                strokeLinecap="round"
                opacity={0.85}
              />
              {/* Ghost Badge Guide Marker */}
              <g transform={`translate(${gx}, ${PAN_Y - 14})`}>
                <rect
                  x={-20}
                  y={-10}
                  width={40}
                  height={20}
                  rx={10}
                  fill="#eff6ff"
                  stroke="#2563eb"
                  strokeWidth={1.5}
                />
                <text
                  x={0}
                  y={0}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize={10}
                  fontWeight="bold"
                  fill="#1d4ed8"
                >
                  Guide
                </text>
              </g>
            </g>
          ))}
        </g>
      )}

      {/* 5. Accordion Multi-Cutter Mechanism & Divider Blades */}
      <g id="accordion-cutter">
        {/* Accordion Scissor Linkage Arms at Top Rim */}
        {activeSpacing > 0.02 && (
          <g opacity={0.9}>
            {Array.from({ length: targetShares }).map((_, i) => {
              const xStart = PAN_X + i * activeSpacing * PAN_W
              const xEnd = PAN_X + (i + 1) * activeSpacing * PAN_W
              if (xEnd > PAN_MAX_X + 10) return null

              return (
                <g key={`scissor-${i}`}>
                  <line
                    x1={xStart}
                    y1={38}
                    x2={xEnd}
                    y2={58}
                    stroke="#b45309"
                    strokeWidth={2.5}
                    strokeLinecap="round"
                  />
                  <line
                    x1={xStart}
                    y1={58}
                    x2={xEnd}
                    y2={38}
                    stroke="#d97706"
                    strokeWidth={2.5}
                    strokeLinecap="round"
                  />
                  <circle
                    cx={(xStart + xEnd) / 2}
                    cy={48}
                    r={3}
                    fill="#78350f"
                    stroke="#fde68a"
                    strokeWidth={1}
                  />
                </g>
              )
            })}
          </g>
        )}

        {/* Stainless Steel Divider Blades */}
        {activeCuts.map((cut, idx) => {
          const cutX = PAN_X + cut * PAN_W
          return (
            <g key={`blade-${idx}`}>
              {/* Cut Line Shadow */}
              <line
                x1={cutX + 1}
                y1={PAN_Y}
                x2={cutX + 1}
                y2={PAN_Y + PAN_H}
                stroke="rgba(0,0,0,0.3)"
                strokeWidth={2}
              />
              {/* Main Stainless Cutting Blade */}
              <line
                x1={cutX}
                y1={PAN_Y}
                x2={cutX}
                y2={PAN_Y + PAN_H}
                stroke="#334155"
                strokeWidth={3}
                strokeLinecap="round"
              />
              {/* Blade Shine Highlight */}
              <line
                x1={cutX - 0.75}
                y1={PAN_Y}
                x2={cutX - 0.75}
                y2={PAN_Y + PAN_H}
                stroke="#f1f5f9"
                strokeWidth={1}
                strokeLinecap="round"
                opacity={0.8}
              />
              {/* Bottom Wheel Guide Knob */}
              <circle
                cx={cutX}
                cy={PAN_Y + PAN_H + 4}
                r={5.5}
                fill="#475569"
                stroke="#cbd5e1"
                strokeWidth={1.5}
              />
            </g>
          )
        })}

        {/* Primary Accordion Cutter Handle with 48px × 48px Touch Boundary */}
        <g
          transform={`translate(${handleX}, ${handleY})`}
          filter="url(#handle-shadow)"
          className="cursor-ew-resize"
        >
          {/* Connector Rod down to Blade */}
          <line
            x1={0}
            y1={16}
            x2={0}
            y2={PAN_Y - handleY}
            stroke="#78350f"
            strokeWidth={4}
            strokeLinecap="round"
          />

          {/* Tactile Pastel Handle Knob (Visual Boundary ~44px x 38px) */}
          <rect
            x={-22}
            y={-19}
            width={44}
            height={38}
            rx={9}
            fill="url(#wood-handle)"
            stroke="#f472b6"
            strokeWidth={2}
          />

          {/* Grip Grooves */}
          <line x1={-14} y1={-7} x2={14} y2={-7} stroke="#ffffff" strokeWidth={1.5} opacity={0.8} />
          <line x1={-14} y1={0} x2={14} y2={0} stroke="#ffffff" strokeWidth={1.5} opacity={0.8} />
          <line x1={-14} y1={7} x2={14} y2={7} stroke="#ffffff" strokeWidth={1.5} opacity={0.8} />

          {/* Horizontal Drag Arrows Icon */}
          <text
            x={0}
            y={0}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize={13}
            fontWeight="bold"
            fill="#ffffff"
          >
            ↔
          </text>

          {/* 48px × 48px Interactive Touch Target */}
          <rect
            x={-24}
            y={-24}
            width={48}
            height={48}
            rx={10}
            fill="transparent"
            cursor={drag.isDragging ? "grabbing" : "grab"}
            className="touch-none"
            onPointerDown={drag.handlePointerDown}
            aria-label={`Slide to partition into ${targetShares} ${targetShares === 2 ? "halves" : targetShares === 3 ? "thirds" : "fourths"}`}
          />
        </g>

        {/* Resting Affordance Callout when unpartitioned */}
        {activeSpacing === 0 && (
          <g transform={`translate(${PAN_X + 28}, ${handleY})`} pointerEvents="none">
            <rect
              x={0}
              y={-12}
              width={124}
              height={24}
              rx={12}
              fill="#fef3c7"
              stroke="#d97706"
              strokeWidth={1.5}
              filter="url(#badge-shadow)"
            />
            <text
              x={62}
              y={0}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize={11}
              fontWeight="bold"
              fill="#92400e"
            >
              {icon} Slide to cut ➔
            </text>
          </g>
        )}
      </g>
    </svg>
  )
}
