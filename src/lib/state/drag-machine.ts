/**
 * Elephant-Goldfish: Tactile Elementary Math
 * Explicit Finite State Machine for Declarative Pointer Drag & Magnetic Snapping.
 *
 * Models the pointer interaction lifecycle:
 *  - idle: Pointer up; resting at stable position.
 *  - dragging_free: Pointer down; dragging freely without snap capture.
 *  - dragging_snapped: Pointer down; captured within magnetic Schmitt-trigger basin.
 *  - committed: Pointer up; value committed to parent.
 */

import type { SnapTarget } from "../drag/declarative-drag.ts"

export type DragPhase = "idle" | "dragging_free" | "dragging_snapped" | "committed"

export interface DragState {
  readonly phase: DragPhase
  readonly activeValue: number
  readonly snappedTarget: SnapTarget | null
  readonly isDragging: boolean
}

export type DragEvent =
  | { type: "POINTER_DOWN"; initialValue: number }
  | { type: "MOVE_FREE"; value: number }
  | { type: "SNAP"; target: SnapTarget; value: number }
  | { type: "RELEASE_SNAP"; value: number }
  | { type: "POINTER_UP"; finalValue: number; target: SnapTarget | null }
  | { type: "PROGRAMMATIC_SNAP"; target: SnapTarget }
  | { type: "RESET"; value?: number }

export function createInitialDragState(initialValue: number = 0): DragState {
  return {
    phase: "idle",
    activeValue: initialValue,
    snappedTarget: null,
    isDragging: false,
  }
}

export function dragReducer(state: DragState, event: DragEvent): DragState {
  switch (event.type) {
    case "POINTER_DOWN": {
      return {
        ...state,
        phase: state.snappedTarget ? "dragging_snapped" : "dragging_free",
        activeValue: event.initialValue,
        isDragging: true,
      }
    }

    case "MOVE_FREE": {
      if (!state.isDragging) return state
      return {
        ...state,
        phase: "dragging_free",
        activeValue: event.value,
        snappedTarget: null,
      }
    }

    case "SNAP": {
      if (!state.isDragging) return state
      return {
        ...state,
        phase: "dragging_snapped",
        activeValue: event.value,
        snappedTarget: event.target,
      }
    }

    case "RELEASE_SNAP": {
      if (!state.isDragging) return state
      return {
        ...state,
        phase: "dragging_free",
        activeValue: event.value,
        snappedTarget: null,
      }
    }

    case "POINTER_UP": {
      return {
        phase: "committed",
        activeValue: event.finalValue,
        snappedTarget: event.target,
        isDragging: false,
      }
    }

    case "PROGRAMMATIC_SNAP": {
      return {
        phase: "idle",
        activeValue: event.target.value,
        snappedTarget: event.target,
        isDragging: false,
      }
    }

    case "RESET": {
      return {
        phase: "idle",
        activeValue: event.value ?? 0,
        snappedTarget: null,
        isDragging: false,
      }
    }

    default:
      return state
  }
}
