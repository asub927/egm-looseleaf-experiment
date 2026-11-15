"use client"

import * as React from "react"
import { useDeclarativeDrag, type SnapTarget } from "@/lib/drag/declarative-drag"
import { playSliceThud } from "@/lib/audio/sfx"
import { cn } from "@/lib/utils"

export interface TartPlateProps {
  radialAngles: number[] // Spoke angles in degrees [0, 360)
  targetShares: 2 | 3 | 4
  isGhostVisible?: boolean
  onAnglesChange: (angles: number[]) => void
  svgRef: React.RefObject<SVGSVGElement | null>
  className?: string
  context?: string
  icon?: string
}

const CENTER_X = 400
const CENTER_Y = 250
const PLATE_RADIUS = 195
const CRUST_RADIUS = 170
const FILLING_RADIUS = 150
const HANDLE_RADIUS = 175

const WEDGE_WATERCOLOR_FILLS = [
  "rgba(251, 207, 232, 0.55)", // pastel rose strawberry
  "rgba(254, 240, 138, 0.55)", // pastel lemon custard
  "rgba(187, 247, 208, 0.55)", // pastel pistachio mint
  "rgba(233, 213, 255, 0.55)", // pastel blueberry lilac
]

export function TartPlate({
  radialAngles,
  targetShares,
  isGhostVisible = false,
  onAnglesChange,
  svgRef,
  className,
  context = "fruit tart",
  icon = "🥧",
}: TartPlateProps) {
  // Local state for smooth drag visualization
  const [dragAngle, setDragAngle] = React.useState<number | null>(null)

  const equalStep = 360 / targetShares

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
        value: equalStep,
        shares: targetShares,
        label,
      },
    ]
  }, [targetShares, equalStep])

  const drag = useDeclarativeDrag({
    mode: "radial",
    svgRef,
    center: { x: CENTER_X, y: CENTER_Y },
    targets,
    snapThreshold: 0.05, // 5% of 360 = 18 degrees
    releaseThreshold: 0.10,
    onSnap: () => {
      playSliceThud()
    },
    onTransform: (val) => {
      setDragAngle(val)
    },
    onCommit: (val, snapped) => {
      const effectiveAngle = snapped ? snapped.value : val
      const newAngles: number[] = [0]
      for (let i = 1; i < targetShares; i++) {
        newAngles.push(Math.round(((i * effectiveAngle) % 360) * 10) / 10)
      }
      newAngles.sort((a, b) => a - b)
      setDragAngle(null)
      onAnglesChange(newAngles)
    },
  })

  const isDragging = dragAngle !== null
  const activeAngle = isDragging
    ? dragAngle
    : radialAngles.length > 1
      ? radialAngles[1]
      : 0

  // Active spoke angles
  const activeSpokes = React.useMemo(() => {
    if (isDragging) {
      const angles: number[] = []
      for (let i = 0; i < targetShares; i++) {
        angles.push(((i * activeAngle) % 360 + 360) % 360)
      }
      return angles.sort((a, b) => a - b)
    }
    if (radialAngles.length === 0) return []
    return radialAngles
      .map((a) => ((a % 360) + 360) % 360)
      .sort((a, b) => a - b)
  }, [isDragging, activeAngle, targetShares, radialAngles])

  // Ghost spoke angles
  const ghostAngles = React.useMemo(() => {
    if (!isGhostVisible) return []
    const angles: number[] = []
    for (let i = 0; i < targetShares; i++) {
      angles.push((i * (360 / targetShares)) % 360)
    }
    return angles
  }, [isGhostVisible, targetShares])

  const singularShareName =
    targetShares === 2 ? "half" : targetShares === 3 ? "third" : "fourth"

  // Primary handle position on the rim
  const handleRad = (activeAngle * Math.PI) / 180
  const handleX = CENTER_X + HANDLE_RADIUS * Math.cos(handleRad)
  const handleY = CENTER_Y + HANDLE_RADIUS * Math.sin(handleRad)

  // Context-specific food styling
  const isPizza = context.toLowerCase().includes("pizza")
  const isCookie = context.toLowerCase().includes("cookie")

  // Generate fluted pastry crust path (36 scalloped petals around CRUST_RADIUS)
  const flutedCrustPath = React.useMemo(() => {
    const petals = 36
    const path: string[] = []
    for (let i = 0; i < petals; i++) {
      const angle1 = (i * 2 * Math.PI) / petals
      const angle2 = ((i + 1) * 2 * Math.PI) / petals
      const midAngle = (angle1 + angle2) / 2
      const rOuter = CRUST_RADIUS + 4
      const rInner = CRUST_RADIUS - 2

      const x1 = CENTER_X + rInner * Math.cos(angle1)
      const y1 = CENTER_Y + rInner * Math.sin(angle1)
      const xm = CENTER_X + rOuter * Math.cos(midAngle)
      const ym = CENTER_Y + rOuter * Math.sin(midAngle)
      const x2 = CENTER_X + rInner * Math.cos(angle2)
      const y2 = CENTER_Y + rInner * Math.sin(angle2)

      if (i === 0) path.push(`M ${x1.toFixed(1)} ${y1.toFixed(1)}`)
      path.push(`Q ${xm.toFixed(1)} ${ym.toFixed(1)}, ${x2.toFixed(1)} ${y2.toFixed(1)}`)
    }
    path.push("Z")
    return path.join(" ")
  }, [])

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
        <filter id="plate-shadow" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="6" stdDeviation="7" floodOpacity="0.22" />
        </filter>
        <filter id="tart-badge-shadow" x="-15%" y="-15%" width="130%" height="130%">
          <feDropShadow dx="0" dy="2" stdDeviation="2.5" floodOpacity="0.2" />
        </filter>
        <filter id="wheel-shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="3" stdDeviation="3.5" floodOpacity="0.3" />
        </filter>

        {/* Ceramic Plate Rim Gradient */}
        <radialGradient id="plate-ceramic" cx="45%" cy="45%" r="55%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="70%" stopColor="#f8fafc" />
          <stop offset="90%" stopColor="#e2e8f0" />
          <stop offset="100%" stopColor="#cbd5e1" />
        </radialGradient>

        {/* Golden Baked Sablé Pastry Crust */}
        <radialGradient id="fluted-crust-grad" cx="40%" cy="40%" r="60%">
          <stop offset="0%" stopColor="#fefce8" />
          <stop offset="60%" stopColor="#fef08a" />
          <stop offset="85%" stopColor="#fde047" />
          <stop offset="100%" stopColor="#f59e0b" />
        </radialGradient>

        {/* Pastel Berry Fruit Filling Gradient */}
        <radialGradient id="berry-filling" cx="45%" cy="45%" r="55%">
          <stop offset="0%" stopColor="#fdf2f8" />
          <stop offset="50%" stopColor="#fbcfe8" />
          <stop offset="85%" stopColor="#f472b6" />
          <stop offset="100%" stopColor="#db2777" />
        </radialGradient>

        {/* Pastel Pizza Cheese & Sauce Gradient */}
        <radialGradient id="pizza-filling" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#fefce8" />
          <stop offset="65%" stopColor="#fef08a" />
          <stop offset="85%" stopColor="#fed7aa" />
          <stop offset="100%" stopColor="#fb923c" />
        </radialGradient>

        {/* Giant Cookie Dough Gradient */}
        <radialGradient id="cookie-filling" cx="45%" cy="45%" r="55%">
          <stop offset="0%" stopColor="#fffbeb" />
          <stop offset="60%" stopColor="#fef3c7" />
          <stop offset="90%" stopColor="#fde68a" />
          <stop offset="100%" stopColor="#f59e0b" />
        </radialGradient>

        {/* Pastel Coral / Rose Rotary Cutter Wheel */}
        <radialGradient id="cutter-wheel" cx="35%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="50%" stopColor="#fdf2f8" />
          <stop offset="85%" stopColor="#fbcfe8" />
          <stop offset="100%" stopColor="#f472b6" />
        </radialGradient>
      </defs>

      {/* 1. Outer Ceramic / Wooden Cutting Plate */}
      <g id="plate-base" filter="url(#plate-shadow)">
        {/* Outer Plate Rim */}
        <circle
          cx={CENTER_X}
          cy={CENTER_Y}
          r={PLATE_RADIUS}
          fill="url(#plate-ceramic)"
          stroke="#cbd5e1"
          strokeWidth={3}
        />
        {/* Inner Plate Bevel Ring */}
        <circle
          cx={CENTER_X}
          cy={CENTER_Y}
          r={PLATE_RADIUS - 12}
          fill="none"
          stroke="#e2e8f0"
          strokeWidth={2}
        />
      </g>

      {/* 2. Fluted Pastry Crust & Food Filling Base */}
      <g id="food-base">
        {/* Fluted Pastry Crust */}
        <path
          d={flutedCrustPath}
          fill="url(#fluted-crust-grad)"
          stroke="#b45309"
          strokeWidth={2.5}
        />

        {/* Inner Filling Surface */}
        <circle
          cx={CENTER_X}
          cy={CENTER_Y}
          r={FILLING_RADIUS}
          fill={
            isPizza
              ? "url(#pizza-filling)"
              : isCookie
                ? "url(#cookie-filling)"
                : "url(#berry-filling)"
          }
          stroke="#78350f"
          strokeWidth={1.5}
        />

        {/* Texture Details (Pepperoni/Berries/Choco-chips) */}
        {isPizza ? (
          <g id="pizza-toppings" opacity={0.9}>
            {/* Pepperoni Disks */}
            {[
              [350, 200],
              [440, 190],
              [390, 240],
              [350, 290],
              [450, 280],
              [400, 160],
              [410, 320],
            ].map(([px, py], i) => (
              <g key={`pep-${i}`}>
                <circle cx={px} cy={py} r={14} fill="#b91c1c" stroke="#7f1d1d" strokeWidth={1.5} />
                <circle cx={px - 3} cy={py - 3} r={1.5} fill="#450a0a" />
                <circle cx={px + 4} cy={py + 2} r={1.5} fill="#450a0a" />
              </g>
            ))}
            {/* Basil Flecks */}
            <circle cx={380} cy={195} r={3} fill="#15803d" />
            <circle cx={425} cy={235} r={3} fill="#15803d" />
            <circle cx={375} cy={265} r={3} fill="#15803d" />
            <circle cx={430} cy={300} r={3} fill="#15803d" />
          </g>
        ) : isCookie ? (
          <g id="cookie-chips" fill="#451a03">
            {[
              [360, 200],
              [430, 210],
              [380, 260],
              [440, 270],
              [350, 280],
              [400, 180],
              [400, 310],
              [415, 240],
            ].map(([cx, cy], i) => (
              <circle key={`chip-${i}`} cx={cx} cy={cy} r={6} />
            ))}
          </g>
        ) : (
          <g id="berry-toppings" opacity={0.85}>
            {/* Glistening Blueberries and Raspberries */}
            {[
              [360, 190, "#1e1b4b"],
              [430, 195, "#be123c"],
              [390, 220, "#1e1b4b"],
              [355, 270, "#be123c"],
              [435, 265, "#1e1b4b"],
              [400, 165, "#be123c"],
              [405, 310, "#1e1b4b"],
              [370, 320, "#be123c"],
              [445, 320, "#be123c"],
              [340, 230, "#1e1b4b"],
              [460, 230, "#be123c"],
            ].map(([bx, by, col], i) => (
              <g key={`berry-${i}`}>
                <circle cx={bx as number} cy={by as number} r={7} fill={col as string} />
                <circle
                  cx={(bx as number) - 2}
                  cy={(by as number) - 2}
                  r={2}
                  fill="#ffffff"
                  opacity={0.6}
                />
              </g>
            ))}
          </g>
        )}
      </g>

      {/* 3. Wedge Slice Regions with Soft Watercolor Fills & Verbal Badges */}
      {activeSpokes.length > 1 && (
        <g id="tart-wedges">
          {activeSpokes.map((startAngle, idx) => {
            const nextIdx = (idx + 1) % activeSpokes.length
            const endAngle = activeSpokes[nextIdx]
            const deltaTheta = ((endAngle - startAngle + 360) % 360) || 360

            const rad1 = (startAngle * Math.PI) / 180
            const rad2 = (endAngle * Math.PI) / 180
            const x1 = CENTER_X + FILLING_RADIUS * Math.cos(rad1)
            const y1 = CENTER_Y + FILLING_RADIUS * Math.sin(rad1)
            const x2 = CENTER_X + FILLING_RADIUS * Math.cos(rad2)
            const y2 = CENTER_Y + FILLING_RADIUS * Math.sin(rad2)
            const largeArcFlag = deltaTheta > 180 ? 1 : 0

            const wedgePath = `M ${CENTER_X} ${CENTER_Y} L ${x1.toFixed(1)} ${y1.toFixed(1)} A ${FILLING_RADIUS} ${FILLING_RADIUS} 0 ${largeArcFlag} 1 ${x2.toFixed(1)} ${y2.toFixed(1)} Z`

            // Mid angle for verbal badge placement
            const midAngle = ((startAngle + deltaTheta / 2) % 360)
            const midRad = (midAngle * Math.PI) / 180
            const badgeRadius = 88
            const bx = CENTER_X + badgeRadius * Math.cos(midRad)
            const by = CENTER_Y + badgeRadius * Math.sin(midRad)

            const fillColor =
              WEDGE_WATERCOLOR_FILLS[idx % WEDGE_WATERCOLOR_FILLS.length]

            return (
              <g key={`wedge-${idx}`}>
                {/* Translucent Watercolor Highlight */}
                <path
                  d={wedgePath}
                  fill={fillColor}
                  stroke="rgba(120, 53, 15, 0.45)"
                  strokeWidth={1.5}
                />

                {/* Verbal Badge: [1 half], [1 third], [1 fourth] */}
                {deltaTheta >= 32 && (
                  <g
                    transform={`translate(${bx.toFixed(1)}, ${by.toFixed(1)})`}
                    filter="url(#tart-badge-shadow)"
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

      {/* 4. Dotted Guide Radial Spokes (Ghost Visual Assist on Tier 2 Scaffolding) */}
      {isGhostVisible && (
        <g id="ghost-radial-spokes">
          {ghostAngles.map((phi, idx) => {
            const rad = (phi * Math.PI) / 180
            const gx = CENTER_X + CRUST_RADIUS * Math.cos(rad)
            const gy = CENTER_Y + CRUST_RADIUS * Math.sin(rad)

            return (
              <g key={`ghost-spoke-${idx}`}>
                <line
                  x1={CENTER_X}
                  y1={CENTER_Y}
                  x2={gx}
                  y2={gy}
                  stroke="#2563eb"
                  strokeWidth={3}
                  strokeDasharray="8 6"
                  strokeLinecap="round"
                  opacity={0.85}
                />
                {/* Ghost Rim Dot */}
                <circle
                  cx={gx}
                  cy={gy}
                  r={8}
                  fill="#eff6ff"
                  stroke="#2563eb"
                  strokeWidth={2}
                />
              </g>
            )
          })}
        </g>
      )}

      {/* 5. Rotary Wheel Cutter & Spoke Divider Blades */}
      <g id="rotary-cutter">
        {/* Radial Divider Spokes */}
        {activeSpokes.map((angle, idx) => {
          const rad = (angle * Math.PI) / 180
          const xEnd = CENTER_X + (CRUST_RADIUS + 4) * Math.cos(rad)
          const yEnd = CENTER_Y + (CRUST_RADIUS + 4) * Math.sin(rad)

          return (
            <g key={`spoke-${idx}`}>
              {/* Spoke Shadow */}
              <line
                x1={CENTER_X}
                y1={CENTER_Y + 1}
                x2={xEnd}
                y2={yEnd + 1}
                stroke="rgba(0,0,0,0.25)"
                strokeWidth={2.5}
              />
              {/* Main Cutting Spoke */}
              <line
                x1={CENTER_X}
                y1={CENTER_Y}
                x2={xEnd}
                y2={yEnd}
                stroke="#334155"
                strokeWidth={3}
                strokeLinecap="round"
              />
              {/* Spoke Highlight */}
              <line
                x1={CENTER_X}
                y1={CENTER_Y}
                x2={xEnd}
                y2={yEnd}
                stroke="#f1f5f9"
                strokeWidth={1}
                strokeLinecap="round"
                opacity={0.8}
              />
            </g>
          )
        })}

        {/* Center Pivot Brass Rivet */}
        <circle cx={CENTER_X} cy={CENTER_Y} r={8} fill="#d97706" stroke="#78350f" strokeWidth={2} />
        <circle cx={CENTER_X} cy={CENTER_Y} r={3} fill="#fef3c7" />

        {/* Rotary Wheel Cutter Handle on Rim with 48px × 48px Touch Target */}
        <g
          transform={`translate(${handleX.toFixed(1)}, ${handleY.toFixed(1)})`}
          filter="url(#wheel-shadow)"
        >
          {/* Extended Cutter Arm towards rim */}
          <line
            x1={-15 * Math.cos(handleRad)}
            y1={-15 * Math.sin(handleRad)}
            x2={30 * Math.cos(handleRad)}
            y2={30 * Math.sin(handleRad)}
            stroke="#78350f"
            strokeWidth={4}
            strokeLinecap="round"
          />

          {/* Wooden Grip Knob on outer end */}
          <circle
            cx={28 * Math.cos(handleRad)}
            cy={28 * Math.sin(handleRad)}
            r={10}
            fill="#b45309"
            stroke="#78350f"
            strokeWidth={2}
          />

          {/* Pastel Rotary Cutter Wheel (Visual boundary ~36px diameter) */}
          <circle
            cx={0}
            cy={0}
            r={17}
            fill="url(#cutter-wheel)"
            stroke="#f472b6"
            strokeWidth={2}
          />

          {/* Wheel Serration Bevel Ring */}
          <circle cx={0} cy={0} r={12} fill="none" stroke="#fbcfe8" strokeWidth={1} />

          {/* Center Axis Rivet */}
          <circle cx={0} cy={0} r={4} fill="#fde047" stroke="#f59e0b" strokeWidth={1} />

          {/* Rotation Affordance Icon */}
          <text
            x={0}
            y={0}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize={12}
            fontWeight="bold"
            fill="#9d174d"
          >
            ↻
          </text>

          {/* 48px × 48px Interactive Touch Target */}
          <circle
            cx={0}
            cy={0}
            r={24}
            fill="transparent"
            cursor={drag.isDragging ? "grabbing" : "grab"}
            className="touch-none"
            onPointerDown={drag.handlePointerDown}
            aria-label={`Rotate pastry wheel to partition into ${targetShares} ${targetShares === 2 ? "halves" : targetShares === 3 ? "thirds" : "fourths"}`}
          />
        </g>

        {/* Resting Affordance Callout when unpartitioned */}
        {activeAngle === 0 && (
          <g
            transform={`translate(${CENTER_X + HANDLE_RADIUS + 30}, ${CENTER_Y - 12})`}
            pointerEvents="none"
          >
            <rect
              x={0}
              y={0}
              width={130}
              height={24}
              rx={12}
              fill="#fef3c7"
              stroke="#d97706"
              strokeWidth={1.5}
              filter="url(#tart-badge-shadow)"
            />
            <text
              x={65}
              y={12}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize={11}
              fontWeight="bold"
              fill="#92400e"
            >
              {icon} Rotate to slice ↻
            </text>
          </g>
        )}
      </g>
    </svg>
  )
}
