"use client"

import * as React from "react"
import {
  dragReducer,
  createInitialDragState,
  type DragState,
  type DragEvent,
  type DragPhase,
} from "../state/drag-machine.ts"

export type { DragState, DragEvent, DragPhase }

export interface SnapTarget {
  id: string
  value: number // Normalized coordinate (0..1) or radial angle in degrees (0..360)
  shares: 2 | 3 | 4
  label: string
}

export interface DeclarativeDragOptions {
  mode: "linear-horizontal" | "radial"
  svgRef: React.RefObject<SVGSVGElement | null>
  center?: { x: number; y: number } // Required for radial mode (viewBox center coordinates)
  bounds?: { min: number; max: number } // Linear pixel bounds [minX, maxX] in viewBox
  targets: SnapTarget[]
  snapThreshold?: number // Default 0.05 (5% attraction basin)
  releaseThreshold?: number // Default 0.10 (10% Schmitt-trigger release)
  onTransform?: (value: number, pixelOffset: number) => void // Imperative RAF transform callback
  onSnap?: (target: SnapTarget) => void
  onRelease?: () => void
  onCommit?: (value: number, snappedTarget: SnapTarget | null) => void // Discrete state commit on pointerup
}

export interface DeclarativeDragReturn {
  activeValue: number
  snappedTarget: SnapTarget | null
  isDragging: boolean
  phase: DragPhase
  machineState: DragState
  dispatch: (event: DragEvent) => void
  handlePointerDown: (e: React.PointerEvent) => void
  handlePointerMove: (e: React.PointerEvent) => void
  handlePointerUp: (e: React.PointerEvent) => void
  snapTo: (targetId: string) => void
}

const DEFAULT_SNAP_THRESHOLD = 0.05
const DEFAULT_RELEASE_THRESHOLD = 0.1
const SFX_COOLDOWN_MS = 250

/**
 * Transforms client coordinates to SVG viewBox coordinate space
 * using svg.getScreenCTM()?.inverse(), with resilient fallbacks for detached or test DOM.
 */
export function getSvgPoint(
  svg: SVGSVGElement | null,
  clientX: number,
  clientY: number,
): { x: number; y: number } | null {
  if (!svg) return null

  try {
    const ctm = svg.getScreenCTM?.()
    if (ctm) {
      const inverse = ctm.inverse?.()
      if (inverse) {
        if (typeof svg.createSVGPoint === "function") {
          const pt = svg.createSVGPoint()
          pt.x = clientX
          pt.y = clientY
          const transformed = pt.matrixTransform(inverse)
          return { x: transformed.x, y: transformed.y }
        }
        if (typeof DOMPoint !== "undefined") {
          const pt = new DOMPoint(clientX, clientY)
          const transformed = pt.matrixTransform(inverse)
          return { x: transformed.x, y: transformed.y }
        }
      }
    }
  } catch {
    // getScreenCTM may throw in detached trees or test environments
  }

  try {
    const rect = svg.getBoundingClientRect?.()
    if (rect && rect.width > 0 && rect.height > 0) {
      const viewBox = svg.viewBox?.baseVal
      if (viewBox && viewBox.width > 0 && viewBox.height > 0) {
        return {
          x: viewBox.x + ((clientX - rect.left) / rect.width) * viewBox.width,
          y: viewBox.y + ((clientY - rect.top) / rect.height) * viewBox.height,
        }
      }
      return { x: clientX - rect.left, y: clientY - rect.top }
    }
  } catch {
    // Fallback to client coordinates
  }

  return { x: clientX, y: clientY }
}

/**
 * Normalizes an angle in degrees into [0, 360).
 */
export function normalizeAngle(deg: number): number {
  return ((deg % 360) + 360) % 360
}

/**
 * Computes shortest distance between two values.
 * For radial mode, accounts for angular wrap-around across 360 -> 0.
 */
export function computeDistance(
  val: number,
  targetVal: number,
  mode: "linear-horizontal" | "radial",
): number {
  if (mode === "radial") {
    const a = normalizeAngle(val)
    const b = normalizeAngle(targetVal)
    const diff = Math.abs(a - b)
    return diff > 180 ? 360 - diff : diff
  }
  return Math.abs(val - targetVal)
}

/**
 * Resolves snap and release distance thresholds for linear vs radial modes.
 * In radial mode, normalized threshold <= 1 is scaled by 360 to degrees.
 */
export function getThresholds(options: DeclarativeDragOptions): {
  snapThresh: number
  releaseThresh: number
} {
  const isRadial = options.mode === "radial"
  const rawSnap = options.snapThreshold ?? DEFAULT_SNAP_THRESHOLD
  const rawRelease = options.releaseThreshold ?? DEFAULT_RELEASE_THRESHOLD

  if (isRadial) {
    const snapThresh = rawSnap <= 1 ? rawSnap * 360 : rawSnap
    const releaseThresh = rawRelease <= 1 ? rawRelease * 360 : rawRelease
    return { snapThresh, releaseThresh }
  }

  return { snapThresh: rawSnap, releaseThresh: rawRelease }
}

/**
 * Zero-dependency declarative pointer snapping engine.
 *
 * Implements native PointerEvents drag manipulation with:
 * - Direct coordinate transformation via `svgRef.current.getScreenCTM()?.inverse()`.
 * - Linear horizontal coordinate normalization to [0, 1] using viewBox bounds.
 * - Radial angle computation with angular wrap-around across 360 -> 0.
 * - Schmitt-trigger magnetic snapping (snapThreshold basin capture, releaseThreshold release).
 * - Smooth 60 FPS: updates onTransform with requestAnimationFrame, commits discrete state on pointerup.
 * - Programmatic `snapTo(targetId)` helper for single-tap badges or demonstration steps.
 * - Cooldown debounce to prevent finger tremor sound spam near boundary edges.
 */
export function useDeclarativeDrag(options: DeclarativeDragOptions): DeclarativeDragReturn {
  const [state, dispatch] = React.useReducer(dragReducer, 0, createInitialDragState)

  // Mutable refs to prevent stale closures and avoid unnecessary re-renders
  const optionsRef = React.useRef(options)
  optionsRef.current = options

  const isDraggingRef = React.useRef(false)
  const snappedTargetRef = React.useRef<SnapTarget | null>(null)
  const activeValueRef = React.useRef<number>(0)
  const rafIdRef = React.useRef<number | null>(null)
  const lastSnapTimeRef = React.useRef<number>(0)
  const lastSnappedIdRef = React.useRef<string | null>(null)
  const capturedElementRef = React.useRef<Element | null>(null)
  const pointerIdRef = React.useRef<number | null>(null)
  const latestPointerRef = React.useRef<{ clientX: number; clientY: number } | null>(null)

  /**
   * Evaluates coordinate projection, Schmitt-trigger hysteresis, and triggers callbacks.
   */
  const processPointerPosition = React.useCallback((clientX: number, clientY: number) => {
    const opts = optionsRef.current
    const pt = getSvgPoint(opts.svgRef.current, clientX, clientY)
    if (!pt) return

    let rawVal = 0
    if (opts.mode === "linear-horizontal") {
      const min = opts.bounds?.min ?? 0
      const max = opts.bounds?.max ?? 1
      const span = max - min
      const raw = span > 0 ? (pt.x - min) / span : 0
      rawVal = Math.max(0, Math.min(1, raw))
    } else {
      const cx = opts.center?.x ?? 0
      const cy = opts.center?.y ?? 0
      const dx = pt.x - cx
      const dy = pt.y - cy
      rawVal = ((Math.atan2(dy, dx) * 180) / Math.PI + 360) % 360
    }

    const { snapThresh, releaseThresh } = getThresholds(opts)
    const currentSnapped = snappedTargetRef.current
    let nextSnapped: SnapTarget | null = currentSnapped
    let effectiveVal = rawVal

    if (currentSnapped) {
      const dist = computeDistance(rawVal, currentSnapped.value, opts.mode)
      if (dist > releaseThresh) {
        // Release active snap
        nextSnapped = null
        opts.onRelease?.()

        // Check if another target captures immediately
        let closest: SnapTarget | null = null
        let minDist = Infinity
        for (const t of opts.targets) {
          const d = computeDistance(rawVal, t.value, opts.mode)
          if (d < minDist) {
            minDist = d
            closest = t
          }
        }
        if (closest && minDist <= snapThresh) {
          nextSnapped = closest
          effectiveVal = closest.value
        } else {
          effectiveVal = rawVal
        }
      } else {
        // Stay snapped
        effectiveVal = currentSnapped.value
      }
    } else {
      // Unsnapped: check attraction basin
      let closest: SnapTarget | null = null
      let minDist = Infinity
      for (const t of opts.targets) {
        const d = computeDistance(rawVal, t.value, opts.mode)
        if (d < minDist) {
          minDist = d
          closest = t
        }
      }
      if (closest && minDist <= snapThresh) {
        nextSnapped = closest
        effectiveVal = closest.value
      } else {
        effectiveVal = rawVal
      }
    }

    // Handle onSnap trigger with 250ms tremor cooldown
    if (nextSnapped && nextSnapped.id !== currentSnapped?.id) {
      const now = Date.now()
      if (
        lastSnappedIdRef.current !== nextSnapped.id ||
        now - lastSnapTimeRef.current >= SFX_COOLDOWN_MS
      ) {
        lastSnapTimeRef.current = now
        lastSnappedIdRef.current = nextSnapped.id
        opts.onSnap?.(nextSnapped)
      }
    }

    // Discrete snap state synchronization to React State Machine
    if (nextSnapped !== currentSnapped) {
      if (nextSnapped) {
        dispatch({ type: "SNAP", target: nextSnapped, value: effectiveVal })
      } else {
        dispatch({ type: "RELEASE_SNAP", value: effectiveVal })
      }
    }

    snappedTargetRef.current = nextSnapped
    activeValueRef.current = effectiveVal

    // Compute pixel offset for imperative transform
    let pixelOffset = effectiveVal
    if (opts.mode === "linear-horizontal") {
      const min = opts.bounds?.min ?? 0
      const max = opts.bounds?.max ?? 1
      pixelOffset = min + effectiveVal * (max - min)
    }

    opts.onTransform?.(effectiveVal, pixelOffset)
  }, [])

  /**
   * Schedules an imperative RAF transform update.
   */
  const scheduleFrame = React.useCallback(() => {
    if (rafIdRef.current !== null) return
    const requestFrame =
      typeof requestAnimationFrame !== "undefined"
        ? requestAnimationFrame
        : (cb: FrameRequestCallback) => setTimeout(cb, 16) as unknown as number

    rafIdRef.current = requestFrame(() => {
      rafIdRef.current = null
      if (!isDraggingRef.current) return
      if (latestPointerRef.current) {
        processPointerPosition(latestPointerRef.current.clientX, latestPointerRef.current.clientY)
      }
    })
  }, [processPointerPosition])

  const handlePointerDown = React.useCallback(
    (e: React.PointerEvent) => {
      try {
        e.currentTarget.setPointerCapture?.(e.pointerId)
        capturedElementRef.current = e.currentTarget
        pointerIdRef.current = e.pointerId
      } catch {
        // Pointer capture may fail on simulated events
      }

      isDraggingRef.current = true
      dispatch({ type: "POINTER_DOWN", initialValue: activeValueRef.current })
      latestPointerRef.current = { clientX: e.clientX, clientY: e.clientY }

      processPointerPosition(e.clientX, e.clientY)
    },
    [processPointerPosition],
  )

  const handlePointerMove = React.useCallback(
    (e: React.PointerEvent) => {
      if (!isDraggingRef.current) return
      latestPointerRef.current = { clientX: e.clientX, clientY: e.clientY }
      scheduleFrame()
    },
    [scheduleFrame],
  )

  const handlePointerUp = React.useCallback(
    (e: React.PointerEvent) => {
      if (!isDraggingRef.current) return

      // Cancel pending RAF
      if (rafIdRef.current !== null) {
        const cancelFrame =
          typeof cancelAnimationFrame !== "undefined"
            ? cancelAnimationFrame
            : (id: number) => clearTimeout(id)
        cancelFrame(rafIdRef.current)
        rafIdRef.current = null
      }

      try {
        if (
          pointerIdRef.current !== null &&
          capturedElementRef.current?.hasPointerCapture?.(pointerIdRef.current)
        ) {
          capturedElementRef.current.releasePointerCapture(pointerIdRef.current)
        }
      } catch {
        // Ignore release errors
      }

      isDraggingRef.current = false
      capturedElementRef.current = null
      pointerIdRef.current = null

      // Process final position synchronously
      processPointerPosition(e.clientX, e.clientY)

      const finalValue = activeValueRef.current
      const finalSnapped = snappedTargetRef.current

      dispatch({ type: "POINTER_UP", finalValue, target: finalSnapped })

      optionsRef.current.onCommit?.(finalValue, finalSnapped)
    },
    [processPointerPosition],
  )

  /**
   * Programmatic snap helper (single-tap badges or Tier 3 demonstration steps).
   */
  const snapTo = React.useCallback((targetId: string) => {
    const opts = optionsRef.current
    const target = opts.targets.find((t) => t.id === targetId)
    if (!target) return

    // Cancel pending animation frame
    if (rafIdRef.current !== null) {
      const cancelFrame =
        typeof cancelAnimationFrame !== "undefined"
          ? cancelAnimationFrame
          : (id: number) => clearTimeout(id)
      cancelFrame(rafIdRef.current)
      rafIdRef.current = null
    }

    snappedTargetRef.current = target
    activeValueRef.current = target.value
    lastSnappedIdRef.current = target.id
    lastSnapTimeRef.current = Date.now()

    let pixelOffset = target.value
    if (opts.mode === "linear-horizontal") {
      const min = opts.bounds?.min ?? 0
      const max = opts.bounds?.max ?? 1
      pixelOffset = min + target.value * (max - min)
    }

    opts.onTransform?.(target.value, pixelOffset)
    opts.onSnap?.(target)

    dispatch({ type: "PROGRAMMATIC_SNAP", target })

    opts.onCommit?.(target.value, target)
  }, [])

  // Cleanup animation frame on unmount
  React.useEffect(() => {
    return () => {
      if (rafIdRef.current !== null) {
        const cancelFrame =
          typeof cancelAnimationFrame !== "undefined"
            ? cancelAnimationFrame
            : (id: number) => clearTimeout(id)
        cancelFrame(rafIdRef.current)
        rafIdRef.current = null
      }
    }
  }, [])

  return {
    activeValue: state.activeValue,
    snappedTarget: state.snappedTarget,
    isDragging: state.isDragging,
    phase: state.phase,
    machineState: state,
    dispatch,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    snapTo,
  }
}
