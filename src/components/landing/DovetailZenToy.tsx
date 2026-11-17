"use client"

import * as React from "react"
import {
  playWoodThock,
  playWoodLift,
  playWoodSettle,
  playPentatonicHarmony,
  playSequentialThocks,
} from "@/lib/audio/wood-thock-synth"
import { getSvgPoint } from "@/lib/drag/declarative-drag"
import {
  DOVETAIL_PIECES,
  SNAP_CAPTURE_RADIUS,
  ELEVATION_OFFSET_Y,
  ELEVATION_SCALE,
  CURRICULUM_STATIONS,
  type DovetailPieceConfig,
  type CurriculumStationId,
  type CurriculumStationConfig,
} from "@/lib/math/dovetail-constants"

export {
  DOVETAIL_PIECES,
  SNAP_CAPTURE_RADIUS,
  ELEVATION_OFFSET_Y,
  ELEVATION_SCALE,
  CURRICULUM_STATIONS,
  type DovetailPieceConfig,
  type CurriculumStationId,
  type CurriculumStationConfig,
}

export interface DovetailSnapDetail {
  blockId: string
  targetSlotId: string
  snappedAt: number
  clientX: number
  clientY: number
  stationId?: CurriculumStationId
}

export type DovetailSnapEvent = DovetailSnapDetail

export interface DovetailZenToyProps {
  /** Optional controlled active curriculum station tab */
  activeStation?: CurriculumStationId
  /** Initial active curriculum station tab */
  initialStation?: CurriculumStationId
  /** Callback fired on station change */
  onStationChange?: (station: CurriculumStationId) => void
  /** Callback fired when a dovetail tenon or piece successfully locks into a mortise recess */
  onSnap?: (detail: DovetailSnapDetail) => void
  /** Master sound enabled flag (default: true) */
  soundEnabled?: boolean
  /** Optional custom CSS class */
  className?: string
  /** Optional callback fired on ripple reverberation */
  onRipple?: (ripple: { x: number; y: number; color: string; strength: number }) => void
  /** Optional callback when a station or all pieces are completed */
  onComplete?: () => void
  /** Compact mode toggle for sidebars / embed cards */
  compact?: boolean
  /** Optional flag to hide station navigation tabs */
  hideTabs?: boolean
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
  activeStation: controlledStation,
  initialStation = "making-ten",
  onStationChange,
  onSnap,
  soundEnabled = true,
  className = "",
  onRipple,
  onComplete,
  compact = false,
  hideTabs = false,
}: DovetailZenToyProps) {
  // Current active station tab (controlled or internal)
  const [internalStation, setInternalStation] = React.useState<CurriculumStationId>(initialStation)
  const activeStation = controlledStation ?? internalStation

  // Top SVG ref
  const svgRef = React.useRef<SVGSVGElement | null>(null)
  const pieceRefs = React.useRef<Map<string, SVGGElement>>(new Map())

  // ==========================================
  // STATION 1: MAKING TEN STATE
  // ==========================================
  const [is10Snapped, setIs10Snapped] = React.useState(false)
  const [pos10, setPos10] = React.useState({ x: 0, y: 0 })
  const [is10Elevated, setIs10Elevated] = React.useState(false)

  // ==========================================
  // STATION 2: ARRAYS STATE
  // ==========================================
  const [isArraySnapped, setIsArraySnapped] = React.useState(false)
  const [posArray, setPosArray] = React.useState({ x: 0, y: 0 })
  const [isArrayElevated, setIsArrayElevated] = React.useState(false)

  // ==========================================
  // STATION 3: PARITY STATE
  // ==========================================
  const [isParitySnapped, setIsParitySnapped] = React.useState(false)
  const [posParity, setPosParity] = React.useState({ x: 0, y: 0 })
  const [isParityElevated, setIsParityElevated] = React.useState(false)

  // ==========================================
  // STATION 4: GEOMETRY PARTITIONING STATE
  // ==========================================
  const [isGeoSnapped, setIsGeoSnapped] = React.useState(false)
  const [posGeo, setPosGeo] = React.useState({ x: 0, y: 0 })
  const [isGeoElevated, setIsGeoElevated] = React.useState(false)

  // ==========================================
  // STATION 5: MASTER DOVETAIL JOINERY STATE
  // ==========================================
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
  const [focusedPieceId, setFocusedPieceId] = React.useState<string>(DOVETAIL_PIECES[0].id)
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
    "Montessori Wooden Math Toy ready. Use Tab to select pieces, Enter or Space to pick up, and arrow keys to move.",
  )

  // Local expanding SVG sand ripples
  const [ripples, setRipples] = React.useState<LocalRipple[]>([])
  const nextRippleId = React.useRef(1)

  // Generic Dragging state for Stations 1-4
  const stationDragRef = React.useRef<{
    station: CurriculumStationId
    pointerId: number
    startX: number
    startY: number
    initialPosX: number
    initialPosY: number
  } | null>(null)

  // Current station configuration
  const stationConfig =
    CURRICULUM_STATIONS.find((s) => s.id === activeStation) ?? CURRICULUM_STATIONS[0]

  // Switch station with optional View Transition
  const handleSwitchStation = React.useCallback(
    (stationId: CurriculumStationId) => {
      if (typeof document !== "undefined" && "startViewTransition" in document) {
        // Modern Web View Transition
        ;(
          document as unknown as { startViewTransition: (cb: () => void) => void }
        ).startViewTransition(() => {
          setInternalStation(stationId)
        })
      } else {
        setInternalStation(stationId)
      }

      onStationChange?.(stationId)
      if (soundEnabled) {
        playWoodThock(null, 0.95)
      }
      const targetConfig = CURRICULUM_STATIONS.find((s) => s.id === stationId)
      if (targetConfig) {
        setAnnouncement(`Switched to ${targetConfig.title}`)
      }
    },
    [onStationChange, soundEnabled],
  )

  // Reset current station piece
  const handleResetCurrentStation = React.useCallback(() => {
    if (activeStation === "making-ten") {
      setIs10Snapped(false)
      setPos10({ x: 0, y: 0 })
      setIs10Elevated(false)
    } else if (activeStation === "arrays") {
      setIsArraySnapped(false)
      setPosArray({ x: 0, y: 0 })
      setIsArrayElevated(false)
    } else if (activeStation === "parity") {
      setIsParitySnapped(false)
      setPosParity({ x: 0, y: 0 })
      setIsParityElevated(false)
    } else if (activeStation === "geometry") {
      setIsGeoSnapped(false)
      setPosGeo({ x: 0, y: 0 })
      setIsGeoElevated(false)
    } else if (activeStation === "dovetail") {
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
    }

    if (soundEnabled) {
      playWoodSettle()
    }
    setAnnouncement(`Station ${stationConfig.number} reset. Piece returned to resting position.`)
  }, [activeStation, soundEnabled, stationConfig.number])

  // Helper to dispatch snap details & ripples
  const dispatchSnap = React.useCallback(
    (
      blockId: string,
      targetSlotId: string,
      clientX: number,
      clientY: number,
      color: string,
      x: number,
      y: number,
    ) => {
      const snapDetail: DovetailSnapDetail = {
        blockId,
        targetSlotId,
        snappedAt: Date.now(),
        clientX,
        clientY,
        stationId: activeStation,
      }
      onSnap?.(snapDetail)

      onRipple?.({
        x,
        y,
        color,
        strength: 1.0,
      })

      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("zen-garden-ripple", {
            detail: {
              ...snapDetail,
              x,
              y,
              color,
            },
          }),
        )
      }

      // Local SVG ripple
      const rippleId = nextRippleId.current++
      setRipples((prev) => [...prev.slice(-4), { id: rippleId, x, y, color }])
      setTimeout(() => {
        setRipples((prev) => prev.filter((r) => r.id !== rippleId))
      }, 950)
    },
    [activeStation, onRipple, onSnap],
  )

  // ==========================================
  // STATION 1 DRAG HANDLERS (Making Ten)
  // ==========================================
  const handle10PointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (is10Snapped || e.button !== 0) return
    e.preventDefault()
    setIs10Elevated(true)
    if (soundEnabled) playWoodLift()

    try {
      e.currentTarget.setPointerCapture(e.pointerId)
    } catch {
      // Ignore
    }

    stationDragRef.current = {
      station: "making-ten",
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      initialPosX: pos10.x,
      initialPosY: pos10.y,
    }
    setAnnouncement(
      "Lifted Mint 4-peg block. Drag into ten-frame snap zone or press Enter to lock.",
    )
  }

  const handle10PointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const drag = stationDragRef.current
    if (!drag || drag.station !== "making-ten" || drag.pointerId !== e.pointerId) return
    const dx = e.clientX - drag.startX
    const dy = e.clientY - drag.startY
    setPos10({ x: drag.initialPosX + dx, y: drag.initialPosY + dy })
  }

  const handle10PointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    const drag = stationDragRef.current
    if (!drag || drag.station !== "making-ten") return
    stationDragRef.current = null
    setIs10Elevated(false)

    try {
      e.currentTarget.releasePointerCapture(e.pointerId)
    } catch {
      // Ignore
    }

    // Target is right side of ten-frame (offset dy < -80 and dx between -60 and 80)
    const dist = Math.hypot(pos10.x, pos10.y + 140)
    if (dist <= 90 || pos10.y < -90) {
      setIs10Snapped(true)
      setPos10({ x: 0, y: 0 })
      if (soundEnabled) playWoodThock(null, 0.85)
      dispatchSnap("block-mint-4", "slot-ten-frame-4", e.clientX, e.clientY, "#10ac84", 510, 180)
      setAnnouncement("Mint 4-peg block locked into ten-frame. Ten complete! 6 + 4 = 10.")
      onComplete?.()
    } else {
      setPos10({ x: 0, y: 0 })
      if (soundEnabled) playWoodSettle()
      setAnnouncement("Mint block returned to rest.")
    }
  }

  // ==========================================
  // STATION 2 DRAG HANDLERS (Arrays)
  // ==========================================
  const handleArrayPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isArraySnapped || e.button !== 0) return
    e.preventDefault()
    setIsArrayElevated(true)
    if (soundEnabled) playWoodLift()

    try {
      e.currentTarget.setPointerCapture(e.pointerId)
    } catch {
      // Ignore
    }

    stationDragRef.current = {
      station: "arrays",
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      initialPosX: posArray.x,
      initialPosY: posArray.y,
    }
    setAnnouncement(
      "Lifted Coral Row 3 array slat. Drag into third row groove or press Enter to lock.",
    )
  }

  const handleArrayPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const drag = stationDragRef.current
    if (!drag || drag.station !== "arrays" || drag.pointerId !== e.pointerId) return
    const dx = e.clientX - drag.startX
    const dy = e.clientY - drag.startY
    setPosArray({ x: drag.initialPosX + dx, y: drag.initialPosY + dy })
  }

  const handleArrayPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    const drag = stationDragRef.current
    if (!drag || drag.station !== "arrays") return
    stationDragRef.current = null
    setIsArrayElevated(false)

    try {
      e.currentTarget.releasePointerCapture(e.pointerId)
    } catch {
      // Ignore
    }

    const dist = Math.hypot(posArray.x, posArray.y + 110)
    if (dist <= 85 || posArray.y < -75) {
      setIsArraySnapped(true)
      setPosArray({ x: 0, y: 0 })
      if (soundEnabled) playSequentialThocks(null, [1.0, 1.18, 1.35])
      dispatchSnap("array-row-3", "array-slot-3", e.clientX, e.clientY, "#ee5253", 400, 240)
      setAnnouncement("Coral Row 3 locked into array matrix! 3 Rows of 4 = 12 total.")
      onComplete?.()
    } else {
      setPosArray({ x: 0, y: 0 })
      if (soundEnabled) playWoodSettle()
      setAnnouncement("Array row returned to rest.")
    }
  }

  // ==========================================
  // STATION 3 DRAG HANDLERS (Odd & Even Parity)
  // ==========================================
  const handleParityPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isParitySnapped || e.button !== 0) return
    e.preventDefault()
    setIsParityElevated(true)
    if (soundEnabled) playWoodLift()

    try {
      e.currentTarget.setPointerCapture(e.pointerId)
    } catch {
      // Ignore
    }

    stationDragRef.current = {
      station: "parity",
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      initialPosX: posParity.x,
      initialPosY: posParity.y,
    }
    setAnnouncement(
      "Lifted Sky Blue parity peg. Drag to buddy pairing socket or press Enter to lock.",
    )
  }

  const handleParityPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const drag = stationDragRef.current
    if (!drag || drag.station !== "parity" || drag.pointerId !== e.pointerId) return
    const dx = e.clientX - drag.startX
    const dy = e.clientY - drag.startY
    setPosParity({ x: drag.initialPosX + dx, y: drag.initialPosY + dy })
  }

  const handleParityPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    const drag = stationDragRef.current
    if (!drag || drag.station !== "parity") return
    stationDragRef.current = null
    setIsParityElevated(false)

    try {
      e.currentTarget.releasePointerCapture(e.pointerId)
    } catch {
      // Ignore
    }

    const dist = Math.hypot(posParity.x, posParity.y + 115)
    if (dist <= 85 || posParity.y < -75) {
      setIsParitySnapped(true)
      setPosParity({ x: 0, y: 0 })
      if (soundEnabled) playWoodThock(null, 0.9)
      dispatchSnap("parity-peg-sky", "parity-slot-4", e.clientX, e.clientY, "#1e90ff", 440, 240)
      setAnnouncement("Sky Blue peg paired with partner! 8 is EVEN with 4 balanced pairs.")
      onComplete?.()
    } else {
      setPosParity({ x: 0, y: 0 })
      if (soundEnabled) playWoodSettle()
      setAnnouncement("Parity peg returned to rest.")
    }
  }

  // ==========================================
  // STATION 4 DRAG HANDLERS (Geometry Shares)
  // ==========================================
  const handleGeoPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isGeoSnapped || e.button !== 0) return
    e.preventDefault()
    setIsGeoElevated(true)
    if (soundEnabled) playWoodLift()

    try {
      e.currentTarget.setPointerCapture(e.pointerId)
    } catch {
      // Ignore
    }

    stationDragRef.current = {
      station: "geometry",
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      initialPosX: posGeo.x,
      initialPosY: posGeo.y,
    }
    setAnnouncement(
      "Lifted Mint 1/3 fruit tart wedge. Drag into empty sector or press Enter to lock.",
    )
  }

  const handleGeoPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const drag = stationDragRef.current
    if (!drag || drag.station !== "geometry" || drag.pointerId !== e.pointerId) return
    const dx = e.clientX - drag.startX
    const dy = e.clientY - drag.startY
    setPosGeo({ x: drag.initialPosX + dx, y: drag.initialPosY + dy })
  }

  const handleGeoPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    const drag = stationDragRef.current
    if (!drag || drag.station !== "geometry") return
    stationDragRef.current = null
    setIsGeoElevated(false)

    try {
      e.currentTarget.releasePointerCapture(e.pointerId)
    } catch {
      // Ignore
    }

    const dist = Math.hypot(posGeo.x, posGeo.y + 120)
    if (dist <= 95 || posGeo.y < -80) {
      setIsGeoSnapped(true)
      setPosGeo({ x: 0, y: 0 })
      if (soundEnabled) playWoodThock(null, 0.8)
      dispatchSnap(
        "wedge-mint-third",
        "wedge-slot-third",
        e.clientX,
        e.clientY,
        "#10ac84",
        400,
        210,
      )
      setAnnouncement("Mint wedge locked into fruit tart! 3 equal thirds make one whole.")
      onComplete?.()
    } else {
      setPosGeo({ x: 0, y: 0 })
      if (soundEnabled) playWoodSettle()
      setAnnouncement("Wedge returned to rest.")
    }
  }

  // ==========================================
  // STATION 5: MASTER DOVETAIL JOINERY HANDLERS
  // ==========================================
  const triggerDovetailSnap = React.useCallback(
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

      if (soundEnabled) {
        playWoodThock(null, config.pitchMultiplier)
      }

      dispatchSnap(
        pieceId,
        config.slotId,
        clientX,
        clientY,
        config.baseColor,
        config.targetX,
        config.targetY,
      )

      const updatedSnappedCount = Object.entries(pieces).filter(([id, p]) =>
        id === pieceId ? true : p.isSnapped,
      ).length

      setAnnouncement(
        `${config.name} tenon locked into mortise recess. ${updatedSnappedCount} of ${DOVETAIL_PIECES.length} joined.`,
      )

      if (updatedSnappedCount === DOVETAIL_PIECES.length) {
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
    [dispatchSnap, onComplete, pieces, soundEnabled],
  )

  const handleDovetailPointerDown = (pieceId: string, e: React.PointerEvent<SVGGElement>) => {
    if (e.button !== 0) return
    const config = DOVETAIL_PIECES.find((p) => p.id === pieceId)
    const currentState = pieces[pieceId]
    if (!config || !currentState) return

    e.preventDefault()
    e.stopPropagation()

    setPieces((prev) => ({
      ...prev,
      [pieceId]: { ...prev[pieceId], isElevated: true },
    }))
    setFocusedPieceId(pieceId)

    if (soundEnabled) playWoodLift()

    try {
      e.currentTarget.setPointerCapture(e.pointerId)
    } catch {
      // Ignore
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

  const handleDovetailPointerMove = (pieceId: string, e: React.PointerEvent<SVGGElement>) => {
    const drag = activeDragRef.current
    if (!drag || drag.pieceId !== pieceId || drag.pointerId !== e.pointerId) return
    const svg = svgRef.current
    if (!svg) return

    const startPt = getSvgPoint(svg, drag.startPointerX, drag.startPointerY)
    const currentPt = getSvgPoint(svg, e.clientX, e.clientY)
    if (!startPt || !currentPt) return

    const deltaX = currentPt.x - startPt.x
    const deltaY = currentPt.y - startPt.y

    const newX = Math.max(70, Math.min(730, drag.startPieceX + deltaX))
    const newY = Math.max(60, Math.min(410, drag.startPieceY + deltaY))

    setPieces((prev) => ({
      ...prev,
      [pieceId]: { ...prev[pieceId], x: newX, y: newY },
    }))
  }

  const handleDovetailPointerUp = (pieceId: string, e: React.PointerEvent<SVGGElement>) => {
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

    const distanceToTarget = Math.hypot(current.x - config.targetX, current.y - config.targetY)
    if (distanceToTarget <= SNAP_CAPTURE_RADIUS) {
      triggerDovetailSnap(pieceId, e.clientX, e.clientY)
    } else {
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

      if (soundEnabled) playWoodSettle()
      setAnnouncement(`${config.name} settled onto workbench.`)
    }
  }

  // Keyboard accessibility for Station 5 (Dovetail Joinery)
  const handleDovetailKeyDown = (pieceId: string, e: React.KeyboardEvent<SVGGElement>) => {
    const config = DOVETAIL_PIECES.find((p) => p.id === pieceId)
    const current = pieces[pieceId]
    if (!config || !current) return
    const currentIndex = DOVETAIL_PIECES.findIndex((p) => p.id === pieceId)

    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault()
      if (!current.isElevated) {
        setPieces((prev) => ({
          ...prev,
          [pieceId]: { ...prev[pieceId], isElevated: true },
        }))
        if (soundEnabled) playWoodLift()
        setAnnouncement(
          `Picked up ${config.name}. Use arrow keys to position, or press Enter to snap.`,
        )
      } else {
        const rect = svgRef.current?.getBoundingClientRect()
        const clientX = rect ? rect.left + (config.targetX / 800) * rect.width : 400
        const clientY = rect ? rect.top + (config.targetY / 480) * rect.height : 300
        triggerDovetailSnap(pieceId, clientX, clientY)
      }
      return
    }

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
      if (soundEnabled) playWoodSettle()
      setAnnouncement(`Returned ${config.name} to supply bay.`)
      return
    }

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
          [pieceId]: { ...prev[pieceId], x: newX, y: newY },
        }))
      }
    } else {
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

  // Active station status for equation badge
  const isStationSolved =
    activeStation === "making-ten"
      ? is10Snapped
      : activeStation === "arrays"
        ? isArraySnapped
        : activeStation === "parity"
          ? isParitySnapped
          : activeStation === "geometry"
            ? isGeoSnapped
            : Object.values(pieces).every((p) => p.isSnapped)

  return (
    <div
      className={`relative w-full select-none font-sans overflow-hidden rounded-3xl border-2 border-amber-900/15 bg-radial from-[#fdfbf7] to-[#ece5d8] shadow-[0_24px_70px_rgba(70,55,40,0.12),0_4px_16px_rgba(70,55,40,0.04)] @container ${className}`}
      role="region"
      aria-label="Montessori Handcrafted Wooden Math Toy"
      style={{ containerType: "inline-size" }}
    >
      {/* Screen Reader Live Region */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {announcement}
      </div>

      {/* Top Curriculum Tab Switcher */}
      {!hideTabs && (
        <div className="flex items-center justify-center gap-1.5 p-2 bg-white/70 backdrop-blur-md border-b border-amber-900/10 overflow-x-auto scrollbar-none">
          {CURRICULUM_STATIONS.map((station) => {
            const isActive = activeStation === station.id
            return (
              <button
                key={station.id}
                type="button"
                onClick={() => handleSwitchStation(station.id)}
                className={`cursor-pointer px-3.5 py-1.5 rounded-full text-xs font-bold tracking-tight transition-all flex items-center gap-1.5 shrink-0 focus:outline-none focus:ring-2 focus:ring-amber-700/50 ${
                  isActive
                    ? "bg-[#201e2b] text-white shadow-md scale-102"
                    : "text-[#635b54] hover:text-[#111] hover:bg-black/5"
                }`}
                aria-pressed={isActive}
              >
                <span>{station.icon}</span>
                <span>{station.name}</span>
                <span
                  className={`text-[9.5px] font-mono px-1.5 py-0.5 rounded-full ${
                    isActive ? "bg-white/20 text-white" : "bg-black/5 text-amber-950"
                  }`}
                >
                  {station.badge}
                </span>
              </button>
            )
          })}
        </div>
      )}

      {/* Workbench Header Bar */}
      <div className="flex items-center justify-between px-5 py-3 bg-amber-100/40 border-b border-amber-900/10">
        <div className="flex items-center gap-2.5">
          <span className="text-xl">{stationConfig.icon}</span>
          <div>
            <h3
              className="text-xs sm:text-sm font-bold tracking-tight text-amber-950 uppercase"
              style={{ textWrap: "balance" }}
            >
              {stationConfig.title}
            </h3>
            <p className="text-[11px] text-amber-800/80 hidden sm:block">
              NC Grade 2 Mathematics &bull; Grimm’s dyed wood &bull; Tactile 3D elevation
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleResetCurrentStation}
          className="cursor-pointer inline-flex items-center gap-1 px-3 py-1 text-xs font-bold text-amber-900 hover:text-amber-950 bg-amber-200/50 hover:bg-amber-200/80 active:bg-amber-300/80 rounded-full border border-amber-900/20 transition-all focus:outline-none focus:ring-2 focus:ring-amber-700/50"
          title="Reset piece back to resting position"
          aria-label="Reset piece back to resting position"
        >
          <svg
            className="w-3.5 h-3.5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
          >
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
            <path d="M3 3v5h5" />
          </svg>
          <span>Reset Piece</span>
        </button>
      </div>

      {/* Main Viewport Stage Host */}
      <div
        className={`w-full relative flex items-center justify-center p-6 ${compact ? "min-h-[360px]" : "min-h-[440px]"}`}
      >
        {/* =========================================================
            STATION 1: MAKING TEN (NC.2.OA.2)
            ========================================================= */}
        {activeStation === "making-ten" && (
          <div className="w-full flex flex-col items-center justify-center gap-10 py-4">
            {/* 10-Frame Recessed Inset Tray */}
            <div className="w-full max-w-[640px] h-24 bg-[#e4dcce] rounded-3xl p-2.5 flex items-center gap-2 shadow-[inset_0_4px_12px_rgba(60,48,36,0.22)] border border-[#d6ccbe] relative">
              {/* 6 Known Coral Pegs */}
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={`known-coral-${i}`}
                  className="flex-1 h-full rounded-2xl bg-gradient-to-b from-[#ff6b81] to-[#ee5253] shadow-[0_4px_10px_rgba(238,82,83,0.45),inset_0_1px_1px_rgba(255,255,255,0.6)] flex items-center justify-center"
                >
                  <div className="w-4 h-4 rounded-full bg-[#b33939] shadow-[inset_0_1px_3px_rgba(0,0,0,0.4)]" />
                </div>
              ))}

              {/* 4 Empty Recessed Slots */}
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={`empty-pocket-${i}`}
                  className="flex-1 h-full rounded-2xl bg-[#d6ccbe] shadow-[inset_0_2px_6px_rgba(60,48,36,0.25)] flex items-center justify-center"
                />
              ))}

              {/* Snap Target Zone (Right 4 Slots) */}
              <div
                className={`absolute right-2.5 top-2.5 bottom-2.5 w-[242px] rounded-2xl border-2.5 border-dashed border-[#10ac84] transition-all pointer-events-none ${
                  is10Elevated && pos10.y < -70
                    ? "bg-[#2ed573]/30 shadow-[0_0_24px_rgba(16,172,132,0.45)]"
                    : "bg-[#2ed573]/12"
                }`}
              />

              {/* Snapped Mint 4-Peg Block */}
              {is10Snapped && (
                <div className="absolute right-2.5 top-2.5 bottom-2.5 w-[242px] rounded-2xl bg-gradient-to-b from-[#2ed573] to-[#10ac84] shadow-[0_4px_10px_rgba(16,172,132,0.45),inset_0_1px_1px_rgba(255,255,255,0.5)] flex items-center justify-around px-4 animate-in fade-in zoom-in-95 duration-200">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div
                      key={`snapped-dot-${i}`}
                      className="w-4.5 h-4.5 rounded-full bg-[#065f46] shadow-[inset_0_1px_3px_rgba(0,0,0,0.35)]"
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Draggable 4-Peg Block (Sage Emerald Mint) */}
            {!is10Snapped && (
              <div
                tabIndex={0}
                role="button"
                aria-label="Mint 4-peg block: 4 units to make 10. Press Enter or Space to lock into ten-frame."
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault()
                    setIs10Snapped(true)
                    if (soundEnabled) playWoodThock(null, 0.85)
                    dispatchSnap("block-mint-4", "slot-ten-frame-4", 510, 180, "#10ac84", 510, 180)
                    setAnnouncement("Mint 4-peg block locked into ten-frame! 6 + 4 = 10.")
                    onComplete?.()
                  }
                }}
                onPointerDown={handle10PointerDown}
                onPointerMove={handle10PointerMove}
                onPointerUp={handle10PointerUp}
                className={`w-[242px] h-[76px] rounded-2xl bg-gradient-to-b from-[#2ed573] to-[#10ac84] flex items-center justify-around px-4 cursor-grab active:cursor-grabbing touch-none select-none transition-transform focus:outline-none focus:ring-4 focus:ring-[#10ac84]/50 ${
                  is10Elevated
                    ? "scale-108 -translate-y-4 shadow-[0_32px_60px_rgba(16,172,132,0.5),inset_0_2px_2px_rgba(255,255,255,0.8)]"
                    : "shadow-[0_10px_24px_rgba(16,172,132,0.45),inset_0_2px_2px_rgba(255,255,255,0.65)]"
                }`}
                style={{
                  transform: `translate3d(${pos10.x}px, ${pos10.y + (is10Elevated ? -16 : 0)}px, 0px) scale(${
                    is10Elevated ? 1.08 : 1.0
                  })`,
                }}
              >
                {Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={`mint-dot-${i}`}
                    className="w-4.5 h-4.5 rounded-full bg-[#065f46] shadow-[inset_0_1px_3px_rgba(0,0,0,0.35)]"
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* =========================================================
            STATION 2: ARRAYS (NC.2.OA.4)
            ========================================================= */}
        {activeStation === "arrays" && (
          <div className="w-full flex flex-col items-center justify-center gap-8 py-2">
            {/* 3x4 Array Tray Inset */}
            <div className="w-[420px] h-[250px] bg-[#e4dcce] rounded-3xl p-3.5 flex flex-col gap-3 shadow-[inset_0_4px_12px_rgba(60,48,36,0.22)] border border-[#d6ccbe] relative">
              {/* Row 1: Honey Gold */}
              <div className="w-full h-16 rounded-2xl bg-gradient-to-b from-[#ffa502] to-[#ff7f50] shadow-[0_4px_12px_rgba(255,127,80,0.45),inset_0_1px_1px_rgba(255,255,255,0.6)] flex items-center justify-around px-5">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={`row1-peg-${i}`}
                    className="w-4.5 h-4.5 rounded-full bg-[#c0392b] shadow-[inset_0_1px_3px_rgba(0,0,0,0.35)]"
                  />
                ))}
              </div>

              {/* Row 2: Sky Blue */}
              <div className="w-full h-16 rounded-2xl bg-gradient-to-b from-[#70a1ff] to-[#1e90ff] shadow-[0_4px_12px_rgba(30,144,255,0.45),inset_0_1px_1px_rgba(255,255,255,0.6)] flex items-center justify-around px-5">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={`row2-peg-${i}`}
                    className="w-4.5 h-4.5 rounded-full bg-[#0c2461] shadow-[inset_0_1px_3px_rgba(0,0,0,0.35)]"
                  />
                ))}
              </div>

              {/* Row 3 Drop Zone or Locked Slat */}
              {isArraySnapped ? (
                <div className="w-full h-16 rounded-2xl bg-gradient-to-b from-[#ff6b81] to-[#ee5253] shadow-[0_4px_10px_rgba(238,82,83,0.45),inset_0_1px_1px_rgba(255,255,255,0.5)] flex items-center justify-around px-5 animate-in fade-in zoom-in-95 duration-200">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div
                      key={`row3-peg-${i}`}
                      className="w-4.5 h-4.5 rounded-full bg-[#b33939] shadow-[inset_0_1px_3px_rgba(0,0,0,0.35)]"
                    />
                  ))}
                </div>
              ) : (
                <div
                  className={`w-full h-16 rounded-2xl border-2.5 border-dashed border-[#ee5253] transition-all pointer-events-none ${
                    isArrayElevated && posArray.y < -50
                      ? "bg-[#ee5253]/25 shadow-[0_0_24px_rgba(238,82,83,0.45)]"
                      : "bg-[#ee5253]/10"
                  }`}
                />
              )}
            </div>

            {/* Draggable Row 3 Slat (Strawberry Coral) */}
            {!isArraySnapped && (
              <div
                tabIndex={0}
                role="button"
                aria-label="Strawberry Coral Row 3 array slat. Press Enter or Space to lock into 3x4 array."
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault()
                    setIsArraySnapped(true)
                    if (soundEnabled) playSequentialThocks(null, [1.0, 1.18, 1.35])
                    dispatchSnap("array-row-3", "array-slot-3", 400, 240, "#ee5253", 400, 240)
                    setAnnouncement("Coral Row 3 locked into array matrix! 3 Rows of 4 = 12 total.")
                    onComplete?.()
                  }
                }}
                onPointerDown={handleArrayPointerDown}
                onPointerMove={handleArrayPointerMove}
                onPointerUp={handleArrayPointerUp}
                className={`w-[392px] h-16 rounded-2xl bg-gradient-to-b from-[#ff6b81] to-[#ee5253] flex items-center justify-around px-5 cursor-grab active:cursor-grabbing touch-none select-none transition-transform focus:outline-none focus:ring-4 focus:ring-[#ee5253]/50 ${
                  isArrayElevated
                    ? "scale-108 -translate-y-4 shadow-[0_32px_60px_rgba(238,82,83,0.5),inset_0_2px_2px_rgba(255,255,255,0.8)]"
                    : "shadow-[0_10px_24px_rgba(238,82,83,0.45),inset_0_2px_2px_rgba(255,255,255,0.6)]"
                }`}
                style={{
                  transform: `translate3d(${posArray.x}px, ${posArray.y + (isArrayElevated ? -16 : 0)}px, 0px) scale(${
                    isArrayElevated ? 1.08 : 1.0
                  })`,
                }}
              >
                {Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={`coral-peg-${i}`}
                    className="w-4.5 h-4.5 rounded-full bg-[#b33939] shadow-[inset_0_1px_3px_rgba(0,0,0,0.35)]"
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* =========================================================
            STATION 3: ODD & EVEN PARITY (NC.2.OA.3)
            ========================================================= */}
        {activeStation === "parity" && (
          <div className="w-full flex flex-col items-center justify-center gap-8 py-2">
            {/* Parity Board Inset */}
            <div className="w-[480px] h-[270px] bg-[#e4dcce] rounded-3xl p-6 flex items-center justify-center gap-9 shadow-[inset_0_4px_12px_rgba(60,48,36,0.22)] border border-[#d6ccbe] relative">
              {/* Left Column (Team Royal Lavender) */}
              <div className="flex flex-col gap-3.5">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={`team-lavender-${i}`}
                    className="w-[60px] h-12 rounded-2xl bg-gradient-to-b from-[#a55eea] to-[#8854d0] shadow-[0_4px_10px_rgba(136,84,208,0.45),inset_0_1px_1px_rgba(255,255,255,0.55)] flex items-center justify-center"
                  >
                    <div className="w-4.5 h-4.5 rounded-full bg-[#4a148c]" />
                  </div>
                ))}
              </div>

              {/* Right Column (Team Honey + Target Socket) */}
              <div className="flex flex-col gap-3.5">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={`team-honey-${i}`}
                    className="w-[60px] h-12 rounded-2xl bg-gradient-to-b from-[#ffa502] to-[#ff7f50] shadow-[0_4px_10px_rgba(255,127,80,0.45),inset_0_1px_1px_rgba(255,255,255,0.55)] flex items-center justify-center"
                  >
                    <div className="w-4.5 h-4.5 rounded-full bg-[#b71540]" />
                  </div>
                ))}

                {/* 4th Socket: Snapped or Dashed Target */}
                {isParitySnapped ? (
                  <div className="w-[60px] h-12 rounded-2xl bg-gradient-to-b from-[#70a1ff] to-[#1e90ff] shadow-[0_4px_10px_rgba(30,144,255,0.45),inset_0_1px_1px_rgba(255,255,255,0.5)] flex items-center justify-center animate-in fade-in zoom-in-95 duration-200">
                    <div className="w-4.5 h-4.5 rounded-full bg-[#0c2461]" />
                  </div>
                ) : (
                  <div
                    className={`w-[60px] h-12 rounded-2xl border-2.5 border-dashed border-[#1e90ff] transition-all pointer-events-none ${
                      isParityElevated && posParity.y < -50
                        ? "bg-[#1e90ff]/30 shadow-[0_0_20px_rgba(30,144,255,0.45)]"
                        : "bg-[#1e90ff]/12"
                    }`}
                  />
                )}
              </div>
            </div>

            {/* Draggable Sky Blue Peg */}
            {!isParitySnapped && (
              <div
                tabIndex={0}
                role="button"
                aria-label="Sky Blue buddy peg. Press Enter or Space to complete 8 is EVEN pair."
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault()
                    setIsParitySnapped(true)
                    if (soundEnabled) playWoodThock(null, 0.9)
                    dispatchSnap("parity-peg-sky", "parity-slot-4", 440, 240, "#1e90ff", 440, 240)
                    setAnnouncement(
                      "Sky Blue peg paired with partner! 8 is EVEN with 4 balanced pairs.",
                    )
                    onComplete?.()
                  }
                }}
                onPointerDown={handleParityPointerDown}
                onPointerMove={handleParityPointerMove}
                onPointerUp={handleParityPointerUp}
                className={`w-[60px] h-12 rounded-2xl bg-gradient-to-b from-[#70a1ff] to-[#1e90ff] flex items-center justify-center cursor-grab active:cursor-grabbing touch-none select-none transition-transform focus:outline-none focus:ring-4 focus:ring-[#1e90ff]/50 ${
                  isParityElevated
                    ? "scale-118 -translate-y-4 shadow-[0_30px_50px_rgba(30,144,255,0.5),inset_0_1px_1px_rgba(255,255,255,0.8)]"
                    : "shadow-[0_8px_20px_rgba(30,144,255,0.45),inset_0_1px_1px_rgba(255,255,255,0.65)]"
                }`}
                style={{
                  transform: `translate3d(${posParity.x}px, ${posParity.y + (isParityElevated ? -16 : 0)}px, 0px) scale(${
                    isParityElevated ? 1.18 : 1.0
                  })`,
                }}
              >
                <div className="w-4.5 h-4.5 rounded-full bg-[#0c2461]" />
              </div>
            )}
          </div>
        )}

        {/* =========================================================
            STATION 4: GEOMETRY EQUAL SHARES (NC.2.G.3)
            ========================================================= */}
        {activeStation === "geometry" && (
          <div className="w-full flex flex-col items-center justify-center gap-6 py-2">
            {/* Circular Fruit Tart Pan */}
            <div className="w-[270px] h-[270px] rounded-full bg-[#e4dcce] shadow-[inset_0_4px_12px_rgba(60,48,36,0.22)] border border-[#d6ccbe] flex items-center justify-center relative">
              <svg className="w-full h-full block" viewBox="0 0 270 270">
                <defs>
                  <linearGradient id="coralGrad" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#ff6b81" />
                    <stop offset="100%" stopColor="#ee5253" />
                  </linearGradient>
                  <linearGradient id="skyGrad" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#70a1ff" />
                    <stop offset="100%" stopColor="#1e90ff" />
                  </linearGradient>
                  <linearGradient id="mintGrad" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#2ed573" />
                    <stop offset="100%" stopColor="#10ac84" />
                  </linearGradient>
                </defs>

                {/* Wedge 1: Coral (0 to 120 deg) */}
                <path
                  d="M 135 135 L 135 15 A 120 120 0 0 1 238.92 195 Z"
                  fill="url(#coralGrad)"
                  stroke="#c0392b"
                  strokeWidth="2"
                />

                {/* Wedge 2: Sky Blue (120 to 240 deg) */}
                <path
                  d="M 135 135 L 238.92 195 A 120 120 0 0 1 31.08 195 Z"
                  fill="url(#skyGrad)"
                  stroke="#0c2461"
                  strokeWidth="2"
                />

                {/* Target Snap Zone (240 to 360 deg) */}
                {isGeoSnapped ? (
                  <path
                    d="M 135 135 L 31.08 195 A 120 120 0 0 1 135 15 Z"
                    fill="url(#mintGrad)"
                    stroke="#065f46"
                    strokeWidth="2.5"
                    className="animate-in fade-in zoom-in-95 duration-200"
                  />
                ) : (
                  <path
                    d="M 135 135 L 31.08 195 A 120 120 0 0 1 135 15 Z"
                    className={`transition-all ${
                      isGeoElevated && posGeo.y < -50
                        ? "fill-[#2ed573]/35 stroke-[#10ac84] stroke-2.5 stroke-dashed"
                        : "fill-[#2ed573]/12 stroke-[#10ac84] stroke-2.5 stroke-dashed"
                    }`}
                    strokeDasharray="6 5"
                  />
                )}
              </svg>
            </div>

            {/* Draggable 3rd Wedge (Sage Emerald Mint) */}
            {!isGeoSnapped && (
              <div
                tabIndex={0}
                role="button"
                aria-label="Mint 1/3 fruit tart wedge. Press Enter or Space to complete 1 whole tart."
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault()
                    setIsGeoSnapped(true)
                    if (soundEnabled) playWoodThock(null, 0.8)
                    dispatchSnap(
                      "wedge-mint-third",
                      "wedge-slot-third",
                      400,
                      210,
                      "#10ac84",
                      400,
                      210,
                    )
                    setAnnouncement(
                      "Mint wedge locked into fruit tart! 3 equal thirds make one whole.",
                    )
                    onComplete?.()
                  }
                }}
                onPointerDown={handleGeoPointerDown}
                onPointerMove={handleGeoPointerMove}
                onPointerUp={handleGeoPointerUp}
                className={`w-[140px] h-[140px] flex items-center justify-center cursor-grab active:cursor-grabbing touch-none select-none transition-transform focus:outline-none focus:ring-4 focus:ring-[#10ac84]/50 ${
                  isGeoElevated
                    ? "scale-115 -translate-y-4 filter drop-shadow-[0_24px_40px_rgba(16,172,132,0.5)]"
                    : "filter drop-shadow-[0_10px_20px_rgba(16,172,132,0.4)]"
                }`}
                style={{
                  transform: `translate3d(${posGeo.x}px, ${posGeo.y + (isGeoElevated ? -16 : 0)}px, 0px) scale(${
                    isGeoElevated ? 1.15 : 1.0
                  })`,
                }}
              >
                <svg width="140" height="140" viewBox="0 0 140 140">
                  <path
                    d="M 125 125 L 25 180 A 120 120 0 0 1 125 10 Z"
                    fill="url(#mintGrad)"
                    stroke="#065f46"
                    strokeWidth="2.5"
                  />
                </svg>
              </div>
            )}
          </div>
        )}

        {/* =========================================================
            STATION 5: MASTER DOVETAIL JOINERY STUDIO
            ========================================================= */}
        {activeStation === "dovetail" && (
          <div className="w-full relative aspect-[8/4.8]">
            <svg
              ref={svgRef}
              viewBox="0 0 800 480"
              className="w-full h-full block touch-none"
              preserveAspectRatio="xMidYMid meet"
              aria-hidden="true"
            >
              <defs>
                <filter id="wood-grain-subtle" x="0%" y="0%" width="100%" height="100%">
                  <feTurbulence
                    type="fractalNoise"
                    baseFrequency="0.035 0.007"
                    numOctaves="3"
                    result="grainNoise"
                  />
                  <feColorMatrix
                    type="matrix"
                    values="0.3 0 0 0 0.85 0 0.25 0 0 0.75 0 0 0.2 0 0.65 0 0 0 0.12 0"
                    result="grainColor"
                  />
                  <feBlend mode="multiply" in="SourceGraphic" in2="grainColor" />
                </filter>
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
                    floodOpacity="0.2"
                  />
                </filter>
                <filter id="mortise-inset-shadow" x="-10%" y="-10%" width="120%" height="120%">
                  <feOffset dx="0" dy="4" />
                  <feGaussianBlur stdDeviation="3.5" result="offset-blur" />
                  <feComposite
                    operator="out"
                    in="SourceGraphic"
                    in2="offset-blur"
                    result="inverse"
                  />
                  <feFlood floodColor="#2c2724" floodOpacity="0.45" result="color" />
                  <feComposite operator="in" in="color" in2="inverse" result="shadow" />
                  <feComposite operator="over" in="shadow" in2="SourceGraphic" />
                </filter>
                <pattern id="raked-sand-waves" width="40" height="20" patternUnits="userSpaceOnUse">
                  <path
                    d="M 0 10 Q 10 5, 20 10 T 40 10"
                    fill="none"
                    stroke="#cbbba6"
                    strokeWidth="1.2"
                    strokeOpacity="0.35"
                  />
                </pattern>
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

                <g id="dovetail-shape-single">
                  <path d="M -36 -42 C -36 -46, 36 -46, 36 -42 L 36 -12 L 46 36 C 46 42, 38 44, 30 44 L -30 44 C -38 44, -46 42, -46 36 L -36 -12 Z" />
                </g>
                <g id="dovetail-shape-double">
                  <path d="M -38 -42 L 38 -42 L 38 -15 L 46 12 L 36 14 L 46 36 C 46 42, 38 44, 32 44 L -32 44 C -38 44, -46 42, -46 36 L -36 14 L -46 12 L -38 -15 Z" />
                </g>
                <g id="dovetail-shape-keystone">
                  <path d="M -36 -42 L 36 -42 L 36 -8 L 44 6 L 40 18 L 47 38 C 47 43, 38 44, 30 44 L -30 44 C -38 44, -47 43, -47 38 L -40 18 L -44 6 L -36 -8 Z" />
                </g>
                <g id="dovetail-shape-split">
                  <path d="M -38 -42 C -20 -44, 20 -44, 38 -42 L 38 -10 L 46 34 C 46 42, 38 44, 28 44 L -28 44 C -38 44, -46 42, -46 34 L -38 -10 Z" />
                </g>
                <g id="dovetail-shape-crown">
                  <path d="M -38 -42 L 38 -42 L 38 -12 L 48 10 L 42 22 L 48 36 C 48 42, 38 44, 32 44 L -32 44 C -38 44, -48 42, -48 36 L -42 22 L -48 10 L -38 -12 Z" />
                </g>
              </defs>

              <rect x="0" y="0" width="800" height="480" fill="url(#workbench-gradient)" />
              <rect
                x="0"
                y="0"
                width="800"
                height="480"
                fill="url(#raked-sand-waves)"
                opacity="0.6"
              />

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

              {/* Resting Indentations */}
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

              {/* Concentric Sand Ripples */}
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

              {/* Milled Mortise Base */}
              <g id="milled-mortise-bench">
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

                {DOVETAIL_PIECES.map((p) => {
                  const current = pieces[p.id]
                  const distance = Math.hypot(current.x - p.targetX, current.y - p.targetY)
                  const isAttracted = current.isElevated && distance <= SNAP_CAPTURE_RADIUS

                  return (
                    <g
                      key={`pocket-${p.slotId}`}
                      transform={`translate(${p.targetX}, ${p.targetY})`}
                    >
                      <circle
                        r={SNAP_CAPTURE_RADIUS}
                        fill="none"
                        stroke={p.baseColor}
                        strokeWidth={isAttracted ? "2.5" : "1"}
                        strokeDasharray="4 4"
                        strokeOpacity={isAttracted ? "0.85" : "0.18"}
                        className={isAttracted ? "animate-pulse" : ""}
                      />
                      <g
                        filter="url(#mortise-inset-shadow)"
                        fill="url(#mortise-pocket-gradient)"
                        stroke="#503722"
                        strokeWidth="1.5"
                      >
                        <use href={`#dovetail-shape-${p.shapeType}`} />
                      </g>
                      <use
                        href={`#dovetail-shape-${p.shapeType}`}
                        fill="none"
                        stroke="#ffe0b2"
                        strokeWidth="1.5"
                        strokeOpacity="0.35"
                      />
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

              {/* Draggable Dovetail Blocks */}
              {DOVETAIL_PIECES.map((p) => {
                const current = pieces[p.id]
                const isElevated = current.isElevated
                const isSnapped = current.isSnapped
                const isFocused = focusedPieceId === p.id
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
                    aria-label={`${p.name} dovetail block (${p.mathStandard}): ${
                      isSnapped
                        ? "Locked in mortise recess"
                        : isElevated
                          ? "Elevated and dragging"
                          : "In supply bay"
                    }`}
                    aria-grabbed={isElevated}
                    onKeyDown={(e) => handleDovetailKeyDown(p.id, e)}
                    onPointerDown={(e) => handleDovetailPointerDown(p.id, e)}
                    onPointerMove={(e) => handleDovetailPointerMove(p.id, e)}
                    onPointerUp={(e) => handleDovetailPointerUp(p.id, e)}
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
                    <g filter={isElevated ? "url(#shadow-elevated)" : "url(#shadow-resting)"}>
                      <g fill={p.baseColor}>
                        <use href={`#dovetail-shape-${p.shapeType}`} />
                      </g>
                    </g>
                    <use
                      href={`#dovetail-shape-${p.shapeType}`}
                      fill="none"
                      stroke={p.highlightColor}
                      strokeWidth="2"
                      strokeOpacity="0.85"
                    />
                    <use
                      href={`#dovetail-shape-${p.shapeType}`}
                      fill="none"
                      stroke={p.deepColor}
                      strokeWidth="2"
                      strokeOpacity="0.75"
                    />
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
        )}
      </div>

      {/* Engraved Brass Equation Badge */}
      <div className="flex items-center justify-between px-6 py-3.5 bg-amber-100/50 border-t border-amber-900/15">
        <div
          className={`text-sm sm:text-base font-extrabold tracking-tight transition-all duration-300 ${
            isStationSolved ? "text-emerald-800 scale-102" : "text-[#7d7266]"
          }`}
          style={{ textWrap: "balance" }}
        >
          {isStationSolved ? stationConfig.solvedEquation : stationConfig.normalEquation}
        </div>

        <div className="flex items-center gap-2 font-mono text-[10.5px] text-amber-900/70 hidden sm:flex">
          <span>Kinetic Elevation: -16px</span>
          <span>&bull;</span>
          <span>Magnetic Snap Basin: &plusmn;50px</span>
        </div>
      </div>
    </div>
  )
}

export default DovetailZenToy
