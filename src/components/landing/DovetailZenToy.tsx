"use client"

import * as React from "react"
import {
  playWoodThock,
  playWoodLift,
  playWoodSettle,
  playPentatonicHarmony,
} from "@/lib/audio/wood-thock-synth"
import { getSvgPoint } from "@/lib/drag/declarative-drag"
import {
  DOVETAIL_PIECES,
  SNAP_CAPTURE_RADIUS,
  ELEVATION_OFFSET_Y,
  ELEVATION_SCALE,
  type DovetailPieceConfig,
} from "@/lib/math/dovetail-constants"

export {
  DOVETAIL_PIECES,
  SNAP_CAPTURE_RADIUS,
  ELEVATION_OFFSET_Y,
  ELEVATION_SCALE,
  type DovetailPieceConfig,
}

export interface DovetailSnapDetail {
  blockId: string
  targetSlotId: string
  snappedAt: number
  clientX: number
  clientY: number
}

export type DovetailSnapEvent = DovetailSnapDetail

export interface DovetailZenToyProps {
  /** Callback fired when a dovetail tenon successfully locks into a mortise recess */
  onSnap?: (detail: DovetailSnapDetail) => void
  /** Master sound enabled flag (default: true) */
  soundEnabled?: boolean
  /** Optional custom CSS class */
  className?: string
  /** Optional callback fired on ripple reverberation */
  onRipple?: (ripple: { x: number; y: number; color: string; strength: number }) => void
  /** Optional callback when all 5 pieces are assembled */
  onComplete?: () => void
  /** Compact mode toggle for sidebars / embed cards */
  compact?: boolean
}

interface PieceState {
  x: number
  y: number
  isSnapped: boolean
  isElevated: boolean
}

interface LocalRipple {
  id: number
  x: number
  y: number
  color: string
}

export function DovetailZenToy({
  onSnap,
  soundEnabled = true,
  className = "",
  onRipple,
  onComplete,
  compact = false,
}: DovetailZenToyProps) {
  const svgRef = React.useRef<SVGSVGElement | null>(null)
  const pieceRefs = React.useRef<Map<string, SVGGElement>>(new Map())

  // Piece positions & states
  const [pieces, setPieces] = React.useState<Record<string, PieceState>>(() => {
    const initial: Record<string, PieceState> = {}
    DOVETAIL_PIECES.forEach((p) => {
      initial[p.id] = {
        x: p.originX,
        y: p.originY,
        isSnapped: false,
        isElevated: false,
      }
    })
    return initial
  })

  // Currently focused piece for keyboard accessibility
  const [focusedPieceId, setFocusedPieceId] = React.useState<string>(DOVETAIL_PIECES[0].id)

  // Drag interaction tracking
  const activeDragRef = React.useRef<{
    pieceId: string
    pointerId: number
    startPointerX: number
    startPointerY: number
    startPieceX: number
    startPieceY: number
  } | null>(null)

  // Screen reader announcement message
  const [announcement, setAnnouncement] = React.useState<string>(
    "Montessori Dovetail Joinery Toy ready. Use Tab to select pieces, Enter or Space to pick up, and arrow keys to move.",
  )

  // Local expanding SVG sand ripples
  const [ripples, setRipples] = React.useState<LocalRipple[]>([])
  const nextRippleId = React.useRef(1)

  // Check completion
  const snappedCount = Object.values(pieces).filter((p) => p.isSnapped).length
  const allSnapped = snappedCount === DOVETAIL_PIECES.length

  const triggerSnap = React.useCallback(
    (pieceId: string, clientX: number, clientY: number) => {
      const config = DOVETAIL_PIECES.find((p) => p.id === pieceId)
      if (!config) return

      setPieces((prev) => ({
        ...prev,
        [pieceId]: {
          x: config.targetX,
          y: config.targetY,
          isSnapped: true,
          isElevated: false,
        },
      }))

      // 1. Procedural Hollow Wood Block THOCK synthesizer
      if (soundEnabled) {
        playWoodThock(null, config.pitchMultiplier)
      }

      // 2. Dispatch snap event detail
      const snapDetail: DovetailSnapDetail = {
        blockId: pieceId,
        targetSlotId: config.slotId,
        snappedAt: Date.now(),
        clientX,
        clientY,
      }
      onSnap?.(snapDetail)

      // 3. Dispatch sand ripple callback & window CustomEvent
      onRipple?.({
        x: config.targetX,
        y: config.targetY,
        color: config.baseColor,
        strength: 1.0,
      })

      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("zen-garden-ripple", {
            detail: {
              ...snapDetail,
              x: config.targetX,
              y: config.targetY,
              color: config.baseColor,
            },
          }),
        )
      }

      // 4. Spawn local SVG ripple ring
      const rippleId = nextRippleId.current++
      setRipples((prev) => [
        ...prev.slice(-4),
        { id: rippleId, x: config.targetX, y: config.targetY, color: config.baseColor },
      ])
      setTimeout(() => {
        setRipples((prev) => prev.filter((r) => r.id !== rippleId))
      }, 950)

      // 5. Accessible announcement
      setAnnouncement(
        `${config.name} tenon locked into mortise recess. ${snappedCount + 1} of ${DOVETAIL_PIECES.length} joined.`,
      )

      // 6. Check completion
      if (snappedCount + 1 === DOVETAIL_PIECES.length) {
        if (soundEnabled) {
          setTimeout(() => {
            playPentatonicHarmony()
          }, 180)
        }
        onComplete?.()
        setAnnouncement(
          "Dovetail joinery complete! All 5 dyed wood pieces locked in perfect harmony.",
        )
      }
    },
    [onComplete, onRipple, onSnap, snappedCount, soundEnabled],
  )

  // Reset / Disassemble action
  const handleDisassemble = React.useCallback(() => {
    setPieces(() => {
      const reset: Record<string, PieceState> = {}
      DOVETAIL_PIECES.forEach((p) => {
        reset[p.id] = {
          x: p.originX,
          y: p.originY,
          isSnapped: false,
          isElevated: false,
        }
      })
      return reset
    })

    if (soundEnabled) {
      playWoodSettle()
    }

    setAnnouncement("Dovetail joinery disassembled. Blocks returned to workbench supply bay.")
  }, [soundEnabled])

  // Pointer Down: Grabs and elevates piece (translateY(-14px))
  const handlePointerDown = (pieceId: string, e: React.PointerEvent<SVGGElement>) => {
    // Only primary button
    if (e.button !== 0) return

    const config = DOVETAIL_PIECES.find((p) => p.id === pieceId)
    const currentState = pieces[pieceId]
    if (!config || !currentState) return

    e.preventDefault()
    e.stopPropagation()

    // Elevate piece
    setPieces((prev) => ({
      ...prev,
      [pieceId]: {
        ...prev[pieceId],
        isElevated: true,
      },
    }))
    setFocusedPieceId(pieceId)

    if (soundEnabled) {
      playWoodLift()
    }

    try {
      e.currentTarget.setPointerCapture(e.pointerId)
    } catch {
      // Ignore if pointer capture unavailable
    }

    activeDragRef.current = {
      pieceId,
      pointerId: e.pointerId,
      startPointerX: e.clientX,
      startPointerY: e.clientY,
      startPieceX: currentState.x,
      startPieceY: currentState.y,
    }

    setAnnouncement(`Lifted ${config.name}. Drag within 50px of matching mortise slot to snap.`)
  }

  // Pointer Move: 60fps compositor-friendly SVG delta calculation
  const handlePointerMove = (pieceId: string, e: React.PointerEvent<SVGGElement>) => {
    const drag = activeDragRef.current
    if (!drag || drag.pieceId !== pieceId || drag.pointerId !== e.pointerId) return

    const svg = svgRef.current
    if (!svg) return

    // Calculate delta in SVG viewBox coordinates
    const startPt = getSvgPoint(svg, drag.startPointerX, drag.startPointerY)
    const currentPt = getSvgPoint(svg, e.clientX, e.clientY)

    if (!startPt || !currentPt) return

    const deltaX = currentPt.x - startPt.x
    const deltaY = currentPt.y - startPt.y

    const newX = Math.max(70, Math.min(730, drag.startPieceX + deltaX))
    const newY = Math.max(60, Math.min(410, drag.startPieceY + deltaY))

    setPieces((prev) => ({
      ...prev,
      [pieceId]: {
        ...prev[pieceId],
        x: newX,
        y: newY,
      },
    }))
  }

  // Pointer Up: Magnetic snap basin check or gentle spring settle
  const handlePointerUp = (pieceId: string, e: React.PointerEvent<SVGGElement>) => {
    const drag = activeDragRef.current
    if (!drag || drag.pieceId !== pieceId) return

    activeDragRef.current = null

    try {
      e.currentTarget.releasePointerCapture(e.pointerId)
    } catch {
      // Ignore
    }

    const config = DOVETAIL_PIECES.find((p) => p.id === pieceId)
    const current = pieces[pieceId]
    if (!config || !current) return

    // Magnetic snap attraction basin test (±50px Euclidean distance)
    const distanceToTarget = Math.hypot(current.x - config.targetX, current.y - config.targetY)

    if (distanceToTarget <= SNAP_CAPTURE_RADIUS) {
      // Magnetic Snap Success!
      triggerSnap(pieceId, e.clientX, e.clientY)
    } else {
      // Released outside capture basin: return smoothly to origin or remain in tray
      const distanceToOrigin = Math.hypot(current.x - config.originX, current.y - config.originY)
      const shouldReturnToOrigin = distanceToOrigin > 80 || current.isSnapped

      setPieces((prev) => ({
        ...prev,
        [pieceId]: {
          x: shouldReturnToOrigin ? config.originX : current.x,
          y: shouldReturnToOrigin ? config.originY : current.y,
          isSnapped: false,
          isElevated: false,
        },
      }))

      if (soundEnabled) {
        playWoodSettle()
      }
      setAnnouncement(`${config.name} settled onto workbench.`)
    }
  }

  // Keyboard navigation & accessibility
  const handleKeyDown = (pieceId: string, e: React.KeyboardEvent<SVGGElement>) => {
    const config = DOVETAIL_PIECES.find((p) => p.id === pieceId)
    const current = pieces[pieceId]
    if (!config || !current) return

    const currentIndex = DOVETAIL_PIECES.findIndex((p) => p.id === pieceId)

    // Space or Enter: Pick up / Place
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault()

      if (!current.isElevated) {
        // Pick up
        setPieces((prev) => ({
          ...prev,
          [pieceId]: {
            ...prev[pieceId],
            isElevated: true,
          },
        }))
        if (soundEnabled) {
          playWoodLift()
        }
        setAnnouncement(
          `Picked up ${config.name}. Use arrow keys to position, or press Enter to snap.`,
        )
      } else {
        // Place / Snap check
        const distanceToTarget = Math.hypot(current.x - config.targetX, current.y - config.targetY)
        if (distanceToTarget <= SNAP_CAPTURE_RADIUS || !current.isSnapped) {
          // Snap directly if placed
          const rect = svgRef.current?.getBoundingClientRect()
          const clientX = rect ? rect.left + (config.targetX / 800) * rect.width : 400
          const clientY = rect ? rect.top + (config.targetY / 480) * rect.height : 300
          triggerSnap(pieceId, clientX, clientY)
        } else {
          setPieces((prev) => ({
            ...prev,
            [pieceId]: {
              ...prev[pieceId],
              isElevated: false,
            },
          }))
          if (soundEnabled) {
            playWoodSettle()
          }
          setAnnouncement(`${config.name} placed.`)
        }
      }
      return
    }

    // Escape: Return piece to tray origin
    if (e.key === "Escape") {
      e.preventDefault()
      setPieces((prev) => ({
        ...prev,
        [pieceId]: {
          x: config.originX,
          y: config.originY,
          isSnapped: false,
          isElevated: false,
        },
      }))
      if (soundEnabled) {
        playWoodSettle()
      }
      setAnnouncement(`Returned ${config.name} to supply bay.`)
      return
    }

    // Arrow keys: Spatial nudge when elevated, or roving focus when resting
    const step = e.shiftKey ? 40 : 15

    if (current.isElevated) {
      let dx = 0
      let dy = 0
      if (e.key === "ArrowLeft") dx = -step
      if (e.key === "ArrowRight") dx = step
      if (e.key === "ArrowUp") dy = -step
      if (e.key === "ArrowDown") dy = step

      if (dx !== 0 || dy !== 0) {
        e.preventDefault()
        const newX = Math.max(70, Math.min(730, current.x + dx))
        const newY = Math.max(60, Math.min(410, current.y + dy))

        setPieces((prev) => ({
          ...prev,
          [pieceId]: {
            ...prev[pieceId],
            x: newX,
            y: newY,
          },
        }))

        const dist = Math.hypot(newX - config.targetX, newY - config.targetY)
        if (dist <= SNAP_CAPTURE_RADIUS) {
          setAnnouncement(
            `${config.name} aligned near magnetic mortise basin! Press Enter to lock.`,
          )
        }
      }
    } else {
      // Roving focus when not elevated
      if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        e.preventDefault()
        const nextIndex = (currentIndex + 1) % DOVETAIL_PIECES.length
        const nextPieceId = DOVETAIL_PIECES[nextIndex].id
        setFocusedPieceId(nextPieceId)
        pieceRefs.current.get(nextPieceId)?.focus()
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault()
        const prevIndex = (currentIndex - 1 + DOVETAIL_PIECES.length) % DOVETAIL_PIECES.length
        const prevPieceId = DOVETAIL_PIECES[prevIndex].id
        setFocusedPieceId(prevPieceId)
        pieceRefs.current.get(prevPieceId)?.focus()
      }
    }
  }

  return (
    <div
      className={`relative w-full select-none font-sans overflow-hidden rounded-2xl border border-amber-900/20 bg-[#f7efe4] shadow-[0_12px_32px_rgba(44,39,36,0.14)] ${className}`}
      role="region"
      aria-label="Montessori Dovetail Joinery Tactile Toy"
    >
      {/* Screen Reader Live Region */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {announcement}
      </div>

      {/* Top Workbench Header Bar */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-2.5 bg-amber-100/60 border-b border-amber-900/15 backdrop-blur-xs">
        <div className="flex items-center gap-2">
          {/* Authentic Brass Stamp Icon */}
          <span className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-amber-800/15 border border-amber-800/30 text-amber-900 text-xs font-semibold">
            榫
          </span>
          <div>
            <h3 className="text-xs sm:text-sm font-semibold tracking-wide text-amber-950/90 uppercase">
              Montessori Dovetail Joinery
            </h3>
            <p className="text-[10px] text-amber-800/80 hidden sm:block">
              Grimm’s dyed birch wood &bull; Magnetic snap haptics &bull; NC Grade 2
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Progress / Harmony Counter */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50/80 border border-amber-900/15 text-xs text-amber-950 font-medium shadow-xs">
            <span
              className={`inline-block w-2 h-2 rounded-full transition-colors ${
                allSnapped ? "bg-emerald-600 animate-pulse" : "bg-amber-600"
              }`}
            />
            <span>
              {snappedCount} / {DOVETAIL_PIECES.length} {allSnapped ? "Harmonized" : "Joined"}
            </span>
          </div>

          {/* Disassemble / Reset Button */}
          <button
            type="button"
            onClick={handleDisassemble}
            className="cursor-pointer inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-amber-900 hover:text-amber-950 bg-amber-200/50 hover:bg-amber-200/80 active:bg-amber-300/80 rounded-md border border-amber-900/20 transition-all focus:outline-none focus:ring-2 focus:ring-amber-700/50"
            title="Disassemble pieces back to supply bay"
            aria-label="Disassemble pieces back to supply bay"
          >
            <svg
              className="w-3.5 h-3.5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
              <path d="M3 3v5h5" />
            </svg>
            <span className="hidden sm:inline">Disassemble</span>
          </button>
        </div>
      </div>

      {/* Main Tactile Interactive SVG Canvas */}
      <div className={`w-full relative ${compact ? "aspect-[8/5]" : "aspect-[8/4.8]"}`}>
        <svg
          ref={svgRef}
          viewBox="0 0 800 480"
          className="w-full h-full block touch-none"
          preserveAspectRatio="xMidYMid meet"
          aria-hidden="true"
        >
          <defs>
            {/* Subtle Natural Wood Grain Filter */}
            <filter id="wood-grain-subtle" x="0%" y="0%" width="100%" height="100%">
              <feTurbulence
                type="fractalNoise"
                baseFrequency="0.035 0.007"
                numOctaves="3"
                result="grainNoise"
              />
              <feColorMatrix
                type="matrix"
                values="0.3 0 0 0 0.85
                        0 0.25 0 0 0.75
                        0 0 0.2 0 0.65
                        0 0 0 0.12 0"
                result="grainColor"
              />
              <feBlend mode="multiply" in="SourceGraphic" in2="grainColor" />
            </filter>

            {/* Resting Wood Block Drop Shadow */}
            <filter id="shadow-resting" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow
                dx="0"
                dy="3"
                stdDeviation="3"
                floodColor="#2c2724"
                floodOpacity="0.25"
              />
              <feDropShadow
                dx="0"
                dy="1"
                stdDeviation="1"
                floodColor="#2c2724"
                floodOpacity="0.15"
              />
            </filter>

            {/* Elevated 3D Drag Shadow (Dynamic Cast Expansion: Invariant 2) */}
            <filter id="shadow-elevated" x="-40%" y="-20%" width="180%" height="180%">
              <feDropShadow
                dx="0"
                dy="22"
                stdDeviation="14"
                floodColor="#2c2724"
                floodOpacity="0.38"
              />
              <feDropShadow
                dx="0"
                dy="10"
                stdDeviation="6"
                floodColor="#2c2724"
                floodOpacity="0.20"
              />
            </filter>

            {/* Routed Mortise Pocket Inset Shadow */}
            <filter id="mortise-inset-shadow" x="-10%" y="-10%" width="120%" height="120%">
              <feOffset dx="0" dy="4" />
              <feGaussianBlur stdDeviation="3.5" result="offset-blur" />
              <feComposite operator="out" in="SourceGraphic" in2="offset-blur" result="inverse" />
              <feFlood floodColor="#2c2724" floodOpacity="0.45" result="color" />
              <feComposite operator="in" in="color" in2="inverse" result="shadow" />
              <feComposite operator="over" in="shadow" in2="SourceGraphic" />
            </filter>

            {/* Raked Sand Wave Pattern for Garden Ambient Reverberation */}
            <pattern id="raked-sand-waves" width="40" height="20" patternUnits="userSpaceOnUse">
              <path
                d="M 0 10 Q 10 5, 20 10 T 40 10"
                fill="none"
                stroke="#cbbba6"
                strokeWidth="1.2"
                strokeOpacity="0.35"
              />
            </pattern>

            {/* Cedar Workbench Linear Gradients */}
            <linearGradient id="workbench-gradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f7efe4" />
              <stop offset="50%" stopColor="#eedcc7" />
              <stop offset="100%" stopColor="#e2cdb2" />
            </linearGradient>

            <linearGradient id="mortise-tray-gradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#dfcaaf" />
              <stop offset="100%" stopColor="#cfb89a" />
            </linearGradient>

            <linearGradient id="mortise-pocket-gradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#8d6b4f" />
              <stop offset="100%" stopColor="#b48c69" />
            </linearGradient>

            {/* Dovetail Tenon Shapes (Trapezoidal Interlocking Profiles) */}
            <g id="dovetail-shape-single">
              {/* Canonical 1:6 dovetail tail */}
              <path
                d="M -36 -42 
                   C -36 -46, 36 -46, 36 -42
                   L 36 -12 
                   L 46 36 
                   C 46 42, 38 44, 30 44
                   L -30 44
                   C -38 44, -46 42, -46 36
                   L -36 -12 Z"
              />
            </g>

            <g id="dovetail-shape-double">
              {/* Twin pin dovetail tail */}
              <path
                d="M -38 -42 L 38 -42 L 38 -15 
                   L 46 12 L 36 14 L 46 36 C 46 42, 38 44, 32 44
                   L -32 44 C -38 44, -46 42, -46 36
                   L -36 14 L -46 12 L -38 -15 Z"
              />
            </g>

            <g id="dovetail-shape-keystone">
              {/* Stepped array keystone dovetail */}
              <path
                d="M -36 -42 L 36 -42 L 36 -8
                   L 44 6 L 40 18 L 47 38 C 47 43, 38 44, 30 44
                   L -30 44 C -38 44, -47 43, -47 38
                   L -40 18 L -44 6 L -36 -8 Z"
              />
            </g>

            <g id="dovetail-shape-split">
              {/* Geometric half-lap split dovetail */}
              <path
                d="M -38 -42 C -20 -44, 20 -44, 38 -42
                   L 38 -10 L 46 34 C 46 42, 38 44, 28 44
                   L -28 44 C -38 44, -46 42, -46 34
                   L -38 -10 Z"
              />
            </g>

            <g id="dovetail-shape-crown">
              {/* Master compound crown dovetail */}
              <path
                d="M -38 -42 L 38 -42 L 38 -12
                   L 48 10 L 42 22 L 48 36 C 48 42, 38 44, 32 44
                   L -32 44 C -38 44, -48 42, -48 36
                   L -42 22 L -48 10 L -38 -12 Z"
              />
            </g>
          </defs>

          {/* Workbench Wooden Surface & Background Texture */}
          <rect x="0" y="0" width="800" height="480" fill="url(#workbench-gradient)" />
          <rect x="0" y="0" width="800" height="480" fill="url(#raked-sand-waves)" opacity="0.6" />

          {/* Perimeter Beveled Hinoki / Cedar Frame */}
          <rect
            x="14"
            y="14"
            width="772"
            height="452"
            rx="14"
            fill="none"
            stroke="#bfa282"
            strokeWidth="3"
            strokeOpacity="0.4"
          />
          <rect
            x="16"
            y="16"
            width="768"
            height="448"
            rx="12"
            fill="none"
            stroke="#fefcf8"
            strokeWidth="1.5"
            strokeOpacity="0.6"
          />

          {/* Supply Bay Shelf Label */}
          <text
            x="40"
            y="52"
            fill="#7d5c3f"
            fontSize="11"
            fontWeight="600"
            letterSpacing="1.5"
            className="uppercase select-none"
          >
            Supply Bay &bull; Dyed Lime Wood Tenons
          </text>

          {/* Resting Indentations in Supply Bay (Where unsnapped pieces rest) */}
          {DOVETAIL_PIECES.map((p) => (
            <g key={`rest-socket-${p.id}`} transform={`translate(${p.originX}, ${p.originY})`}>
              <ellipse
                cx="0"
                cy="18"
                rx="42"
                ry="36"
                fill="#d8c5ad"
                fillOpacity="0.35"
                stroke="#c4af96"
                strokeWidth="1"
                strokeDasharray="3 3"
              />
              <text
                x="0"
                y="48"
                textAnchor="middle"
                fontSize="9"
                fill="#8f7256"
                fontWeight="500"
                className="select-none"
              >
                {p.name.split(" ")[0]}
              </text>
            </g>
          ))}

          {/* Concentric Sand Ripples from Successful Snaps */}
          {ripples.map((r) => (
            <g key={`ripple-${r.id}`} transform={`translate(${r.x}, ${r.y})`}>
              <circle
                r="18"
                fill="none"
                stroke={r.color}
                strokeWidth="2.5"
                strokeOpacity="0.75"
                className="animate-ping"
              />
              <circle
                r="36"
                fill="none"
                stroke={r.color}
                strokeWidth="1.5"
                strokeOpacity="0.45"
                strokeDasharray="4 4"
              />
              <circle
                r="58"
                fill="none"
                stroke={r.color}
                strokeWidth="1"
                strokeOpacity="0.25"
                strokeDasharray="2 3"
              />
            </g>
          ))}

          {/* Lower Milled Mortise Tray (The Target Bench) */}
          <g id="milled-mortise-bench">
            {/* Wooden Base Tray for Mortises */}
            <rect
              x="45"
              y="265"
              width="710"
              height="160"
              rx="16"
              fill="url(#mortise-tray-gradient)"
              stroke="#b3997b"
              strokeWidth="2"
            />
            {/* Top Light Bevel Highlight */}
            <line
              x1="55"
              y1="267"
              x2="745"
              y2="267"
              stroke="#fff9f0"
              strokeWidth="2"
              strokeLinecap="round"
              strokeOpacity="0.8"
            />
            {/* Bottom Dark Bevel Shadow */}
            <line
              x1="55"
              y1="423"
              x2="745"
              y2="423"
              stroke="#8c6c4c"
              strokeWidth="2"
              strokeLinecap="round"
              strokeOpacity="0.6"
            />

            {/* Mortise Tray Header Badge */}
            <text
              x="65"
              y="287"
              fill="#5a3d24"
              fontSize="10"
              fontWeight="700"
              letterSpacing="1.2"
              className="uppercase select-none"
            >
              Milled Mortise Base &bull; Magnetic Latch Basin (&plusmn;50px)
            </text>

            {/* 5 Routed Dovetail Mortise Recesses (Pockets) */}
            {DOVETAIL_PIECES.map((p) => {
              const current = pieces[p.id]
              const distance = Math.hypot(current.x - p.targetX, current.y - p.targetY)
              const isAttracted = current.isElevated && distance <= SNAP_CAPTURE_RADIUS

              return (
                <g key={`pocket-${p.slotId}`} transform={`translate(${p.targetX}, ${p.targetY})`}>
                  {/* Outer Magnetic Attraction Basin Halo (glows when draggable enters ±50px) */}
                  <circle
                    r={SNAP_CAPTURE_RADIUS}
                    fill="none"
                    stroke={p.baseColor}
                    strokeWidth={isAttracted ? "2.5" : "1"}
                    strokeDasharray="4 4"
                    strokeOpacity={isAttracted ? "0.85" : "0.18"}
                    className={isAttracted ? "animate-pulse" : ""}
                  />

                  {/* Carved Mortise Pocket (Negative Cut into Wood) */}
                  <g
                    filter="url(#mortise-inset-shadow)"
                    fill="url(#mortise-pocket-gradient)"
                    stroke="#503722"
                    strokeWidth="1.5"
                  >
                    <use href={`#dovetail-shape-${p.shapeType}`} />
                  </g>

                  {/* Mortise Socket Floor Inset Contour */}
                  <use
                    href={`#dovetail-shape-${p.shapeType}`}
                    fill="none"
                    stroke="#ffe0b2"
                    strokeWidth="1.5"
                    strokeOpacity="0.35"
                  />

                  {/* Subtle Slot Dot Pattern for Math Correlation */}
                  <g opacity="0.6">
                    {Array.from({ length: Math.min(p.dots, 6) }).map((_, i) => (
                      <circle
                        key={`dot-slot-${p.id}-${i}`}
                        cx={(i - (Math.min(p.dots, 6) - 1) / 2) * 9}
                        cy="14"
                        r="2.2"
                        fill="#3e2714"
                      />
                    ))}
                  </g>

                  {/* Slot Label */}
                  <text
                    x="0"
                    y="58"
                    textAnchor="middle"
                    fontSize="9.5"
                    fill="#4a311b"
                    fontWeight="600"
                    className="select-none"
                  >
                    {p.name}
                  </text>
                </g>
              )
            })}
          </g>

          {/* Draggable & Snappable Dovetail Blocks (Rendered last so elevated pieces render on top) */}
          {DOVETAIL_PIECES.map((p) => {
            const current = pieces[p.id]
            const isElevated = current.isElevated
            const isSnapped = current.isSnapped
            const isFocused = focusedPieceId === p.id

            // Invariant 2: Elevation translateY(-14px) and scale(1.06) on interaction
            const elevationY = isElevated ? -14 : 0
            const elevationScale = isElevated ? 1.06 : 1.0

            return (
              <g
                key={`piece-${p.id}`}
                ref={(el) => {
                  if (el) pieceRefs.current.set(p.id, el)
                  else pieceRefs.current.delete(p.id)
                }}
                tabIndex={0}
                role="button"
                aria-roledescription="Dovetail Joinery Tenon"
                aria-label={`${p.name} dovetail block (${p.mathStandard}): ${
                  isSnapped
                    ? "Locked in mortise recess"
                    : isElevated
                      ? "Elevated and dragging"
                      : "In supply bay"
                }`}
                aria-grabbed={isElevated}
                onKeyDown={(e) => handleKeyDown(p.id, e)}
                onPointerDown={(e) => handlePointerDown(p.id, e)}
                onPointerMove={(e) => handlePointerMove(p.id, e)}
                onPointerUp={(e) => handlePointerUp(p.id, e)}
                onFocus={() => setFocusedPieceId(p.id)}
                className="cursor-grab active:cursor-grabbing focus:outline-none"
                style={{
                  transform: `translate3d(${current.x}px, ${current.y + elevationY}px, 0px) scale(${elevationScale})`,
                  transformOrigin: "center center",
                  transition: isElevated
                    ? "none"
                    : "transform 180ms cubic-bezier(0.34, 1.56, 0.64, 1)",
                  touchAction: "none",
                }}
              >
                {/* Dynamic Cast Drop Shadow (Expands to 22px blur on elevation) */}
                <g filter={isElevated ? "url(#shadow-elevated)" : "url(#shadow-resting)"}>
                  {/* Main Dyed Wood Body */}
                  <g fill={p.baseColor}>
                    <use href={`#dovetail-shape-${p.shapeType}`} />
                  </g>
                </g>

                {/* Subtle Stained Wood Fiber Overlay */}
                <g opacity="0.16" filter="url(#wood-grain-subtle)" fill="#ffffff">
                  <use href={`#dovetail-shape-${p.shapeType}`} />
                </g>

                {/* Top/Left Chamfered Light Highlight */}
                <use
                  href={`#dovetail-shape-${p.shapeType}`}
                  fill="none"
                  stroke={p.highlightColor}
                  strokeWidth="2"
                  strokeOpacity="0.85"
                />

                {/* Bottom/Right Beveled Shadow Contour */}
                <use
                  href={`#dovetail-shape-${p.shapeType}`}
                  fill="none"
                  stroke={p.deepColor}
                  strokeWidth="2"
                  strokeOpacity="0.75"
                />

                {/* Tactile Inlaid Wood Pattern / Math Dots */}
                <g opacity="0.9">
                  {Array.from({ length: Math.min(p.dots, 6) }).map((_, i) => (
                    <circle
                      key={`tenon-dot-${p.id}-${i}`}
                      cx={(i - (Math.min(p.dots, 6) - 1) / 2) * 9}
                      cy="14"
                      r="2.5"
                      fill="#ffffff"
                      fillOpacity="0.85"
                    />
                  ))}
                </g>

                {/* Tactile Finger Grip Center Concave Recess */}
                <circle
                  cx="0"
                  cy="-12"
                  r="7"
                  fill="#000000"
                  fillOpacity="0.14"
                  stroke="#ffffff"
                  strokeWidth="1"
                  strokeOpacity="0.3"
                />

                {/* Focus Ring Indicator for Keyboard Roving Focus */}
                {isFocused && (
                  <circle
                    cx="0"
                    cy="0"
                    r="46"
                    fill="none"
                    stroke="#ffffff"
                    strokeWidth="2.5"
                    strokeDasharray="4 3"
                    className="animate-pulse"
                  />
                )}
              </g>
            )
          })}
        </svg>
      </div>

      {/* Tactile Bottom Interaction Hint */}
      <div className="flex flex-wrap items-center justify-between px-4 sm:px-6 py-2 bg-amber-100/40 border-t border-amber-900/10 text-[11px] text-amber-900/75">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1 font-medium text-amber-950">
            <kbd className="px-1.5 py-0.5 rounded-sm bg-amber-50 border border-amber-900/20 font-mono text-[10px]">
              Drag
            </kbd>{" "}
            or{" "}
            <kbd className="px-1.5 py-0.5 rounded-sm bg-amber-50 border border-amber-900/20 font-mono text-[10px]">
              Space
            </kbd>
            : Lift piece
          </span>
          <span className="hidden md:inline text-amber-800/60">&bull;</span>
          <span className="hidden md:inline">
            <kbd className="px-1.5 py-0.5 rounded-sm bg-amber-50 border border-amber-900/20 font-mono text-[10px]">
              Arrows
            </kbd>
            : Navigate / Nudge
          </span>
          <span className="hidden md:inline text-amber-800/60">&bull;</span>
          <span className="hidden md:inline">
            <kbd className="px-1.5 py-0.5 rounded-sm bg-amber-50 border border-amber-900/20 font-mono text-[10px]">
              Esc
            </kbd>
            : Return
          </span>
        </div>

        <div className="flex items-center gap-2 font-mono text-[10px] text-amber-900/70">
          <span>Attraction Basin: &plusmn;50px</span>
          <span>&bull;</span>
          <span>Elevation: -14px</span>
        </div>
      </div>
    </div>
  )
}

export default DovetailZenToy
