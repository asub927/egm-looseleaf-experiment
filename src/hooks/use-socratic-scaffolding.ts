"use client"

import * as React from "react"
import {
  evaluateArrayGrid,
  evaluatePairingMat,
  type ArrayProblemSpec,
  type ArrayDiagnostic,
  type ParityProblemSpec,
  type ParityDiagnostic,
  type PairingSlot,
} from "../lib/math/evaluator.ts"
import type { MascotPose } from "../lib/ink/art/mascots/index.ts"
import {
  scaffoldingReducer,
  createInitialScaffoldingState,
  type ScaffoldingTier,
  type ScaffoldingPhase,
  type ScaffoldingState,
  type ScaffoldingEvent,
} from "../lib/state/scaffolding-machine.ts"

export type { ArrayProblemSpec, ArrayDiagnostic, ParityProblemSpec, ParityDiagnostic, PairingSlot }

export type { ScaffoldingTier, ScaffoldingState, ScaffoldingEvent }
export type ScaffoldingStatus = ScaffoldingPhase

export interface GhostCoordinate {
  row: number
  col: number
}

// ============================================================================
// Isomorphic Seed Banks & Archetype Generators
// ============================================================================

export const ISOMORPHIC_ARRAY_SEEDS: readonly ArrayProblemSpec[] = [
  { targetRows: 3, targetCols: 4, totalTokens: 12 },
  { targetRows: 4, targetCols: 3, totalTokens: 12 },
  { targetRows: 2, targetCols: 5, totalTokens: 10 },
  { targetRows: 5, targetCols: 2, totalTokens: 10 },
  { targetRows: 3, targetCols: 5, totalTokens: 15 },
  { targetRows: 2, targetCols: 4, totalTokens: 8 },
  { targetRows: 4, targetCols: 2, totalTokens: 8 },
  { targetRows: 3, targetCols: 3, totalTokens: 9 },
] as const

export const ISOMORPHIC_PARITY_SEEDS: readonly ParityProblemSpec[] = [
  { totalTokens: 7, strategy: "pairing" },
  { totalTokens: 8, strategy: "pairing" },
  { totalTokens: 9, strategy: "pairing" },
  { totalTokens: 10, strategy: "pairing" },
  { totalTokens: 11, strategy: "pairing" },
  { totalTokens: 12, strategy: "pairing" },
  { totalTokens: 15, strategy: "pairing" },
  { totalTokens: 16, strategy: "pairing" },
] as const

/**
 * Returns an isomorphic array problem spec (preserving commutative pairing where possible).
 */
export function getIsomorphicArraySpec(current: ArrayProblemSpec): ArrayProblemSpec {
  // First attempt: commutative transposition (e.g. 3x4 -> 4x3)
  const transposed = ISOMORPHIC_ARRAY_SEEDS.find(
    (s) =>
      s.totalTokens === current.totalTokens &&
      s.targetRows === current.targetCols &&
      s.targetCols === current.targetRows,
  )
  if (transposed) return transposed

  // Second attempt: different spec with same token count
  const sameTotal = ISOMORPHIC_ARRAY_SEEDS.find(
    (s) =>
      s.totalTokens === current.totalTokens &&
      (s.targetRows !== current.targetRows || s.targetCols !== current.targetCols),
  )
  if (sameTotal) return sameTotal

  // Fallback: cycle to next spec in seed bank
  const currentIndex = ISOMORPHIC_ARRAY_SEEDS.findIndex(
    (s) => s.targetRows === current.targetRows && s.targetCols === current.targetCols,
  )
  const nextIndex = (currentIndex + 1) % ISOMORPHIC_ARRAY_SEEDS.length
  return ISOMORPHIC_ARRAY_SEEDS[nextIndex]
}

/**
 * Returns an isomorphic parity problem spec with matching parity and strategy.
 */
export function getIsomorphicParitySpec(current: ParityProblemSpec): ParityProblemSpec {
  const isOdd = current.totalTokens % 2 !== 0
  const siblings = ISOMORPHIC_PARITY_SEEDS.filter(
    (s) => (s.totalTokens % 2 !== 0) === isOdd && s.totalTokens !== current.totalTokens,
  )
  if (siblings.length > 0) {
    const nextIdx = Math.floor(Math.random() * siblings.length)
    return siblings[nextIdx]
  }
  const nextCount = isOdd
    ? (current.totalTokens + 2) % 19 || 7
    : (current.totalTokens + 2) % 20 || 8
  return {
    totalTokens: nextCount,
    strategy: current.strategy,
  }
}

// ============================================================================
// Pure Pedagogical Coordinate & Step Demonstration Helpers
// ============================================================================

/**
 * Computes ghost target coordinates for array or parity specs.
 */
export function computeGhostCoordinates(
  spec: ArrayProblemSpec | ParityProblemSpec,
  type: "array" | "parity",
): GhostCoordinate[] {
  const coords: GhostCoordinate[] = []
  if (type === "array") {
    const arraySpec = spec as ArrayProblemSpec
    for (let r = 0; r < arraySpec.targetRows; r++) {
      for (let c = 0; c < arraySpec.targetCols; c++) {
        coords.push({ row: r, col: c })
      }
    }
  } else {
    const paritySpec = spec as ParityProblemSpec
    for (let i = 0; i < paritySpec.totalTokens; i++) {
      coords.push({
        row: Math.floor(i / 2),
        col: i % 2,
      })
    }
  }
  return coords
}

/**
 * Checks whether a specific grid cell or pairing slot matches the ghost assist outline.
 */
export function isGhostCell(
  row: number,
  col: number,
  spec: ArrayProblemSpec | ParityProblemSpec,
  type: "array" | "parity",
): boolean {
  if (type === "array") {
    const arraySpec = spec as ArrayProblemSpec
    return row >= 0 && row < arraySpec.targetRows && col >= 0 && col < arraySpec.targetCols
  }
  const paritySpec = spec as ParityProblemSpec
  return row >= 0 && (col === 0 || col === 1) && row * 2 + col < paritySpec.totalTokens
}

/**
 * Generates grid auto-placing Row 1 with targetCols tokens (NC.2.OA.4 Tier 3 demonstration).
 */
export function demonstrateArrayStep(
  spec: ArrayProblemSpec,
  maxRows: number = 5,
  maxCols: number = 5,
): boolean[][] {
  const grid: boolean[][] = Array(maxRows)
    .fill(null)
    .map(() => Array(maxCols).fill(false))

  for (let c = 0; c < spec.targetCols && c < maxCols; c++) {
    grid[0][c] = true
  }
  return grid
}

/**
 * Generates pairing slots auto-placing Pair 1 (Slot 0 left & right) (NC.2.OA.3 Tier 3 demonstration).
 */
export function demonstrateParityStep(
  spec: ParityProblemSpec,
  maxPairs: number = 10,
): PairingSlot[] {
  const slots: PairingSlot[] = Array(maxPairs)
    .fill(null)
    .map(() => ({ left: false, right: false }))

  if (spec.totalTokens >= 1) {
    slots[0].left = true
  }
  if (spec.totalTokens >= 2) {
    slots[0].right = true
  }
  return slots
}

// ============================================================================
// Hook Configuration & Return Interfaces
// ============================================================================

export interface ArrayScaffoldingConfig {
  type: "array"
  spec: ArrayProblemSpec
  grid?: boolean[][]
  onGridChange?: (newGrid: boolean[][]) => void
  onIsomorphicRetry?: (newSpec: ArrayProblemSpec) => void
}

export interface ParityScaffoldingConfig {
  type: "parity"
  spec: ParityProblemSpec
  slots?: PairingSlot[]
  onSlotsChange?: (newSlots: PairingSlot[]) => void
  onIsomorphicRetry?: (newSpec: ParityProblemSpec) => void
}

export type ScaffoldingConfig = ArrayScaffoldingConfig | ParityScaffoldingConfig

export interface SocraticScaffoldingReturn {
  /** Current progressive hint ladder tier (0 = constructing, 1 = prompt, 2 = ghost, 3 = demonstration) */
  tier: ScaffoldingTier
  /** State machine status */
  status: ScaffoldingStatus
  /** Cumulative consecutive failure count for active problem */
  failureCount: number
  /** Whether the Tier 2 visual assist ghost outline is active */
  isGhostVisible: boolean
  /** Target outline coordinates for ghost rendering */
  ghostCoordinates: GhostCoordinate[]
  /** Helper checking whether a cell/slot is within the target ghost outline */
  isGhostCell: (row: number, col: number) => boolean
  /** Current pedagogical feedback string */
  feedback: string | null
  /** Mascot pose reflecting current cognitive / feedback state */
  mascotPose: MascotPose
  /** Tier badge label */
  tierBadge: string
  /** Whether this problem instance was completed with Tier 3 demonstrator assistance */
  wasDemonstrated: boolean
  /** Whether student is eligible for mastery stars/badges on this seed */
  masteryEligible: boolean
  /** Whether current manipulative configuration is validated correct */
  isValidated: boolean
  /** Socratic Answer Checker: evaluates active tokens and escalates ladder if incorrect */
  checkAnswer: (overrideTokens?: boolean[][] | PairingSlot[]) => ArrayDiagnostic | ParityDiagnostic
  /** Student-initiated help request (escalates to Tier 3 demonstration) */
  requestDemonstration: () => void
  /** Auto-place demonstration step (Row 1 or Pair 1) */
  autoPlaceStep: () => void
  /** Trigger retry on an isomorphic problem seed */
  triggerIsomorphicRetry: () => void
  /** State mutation guard: call whenever any token is added, removed, or moved */
  onTokenMutated: () => void
  /** Reset scaffolding ladder for active spec */
  resetScaffolding: () => void
  /** Explicit State Machine snapshot for Agent (AX) and Developer (DX) introspection */
  machineState: ScaffoldingState
  /** Dispatch explicit state machine event */
  dispatch: (event: ScaffoldingEvent) => void
}

// ============================================================================
// Headless Socratic Scaffolding State Machine Hook
// ============================================================================

/**
 * Headless Socratic Scaffolding State Machine implementing the deterministic
 * 3-tier progressive hint ladder for NC.2.OA.3 and NC.2.OA.4.
 *
 * Ladder progression:
 *  - Tier 1 (Socratic Prompt): Triggered on 1st failure. Returns targeted pedagogical feedback.
 *  - Tier 2 (Visual Assist Ghost Outline): Triggered on 2nd failure (failureCount >= 2).
 *    Exposes isGhostVisible: boolean and target outline coordinates.
 *  - Tier 3 (Step Demonstration with Isomorphic Retry): Triggered on 3rd failure (failureCount >= 3)
 *    or student asking for help. Demonstrates auto-placement of Row 1 / Pair 1, marks problem
 *    as demonstrated (revoking mastery credit), and enables isomorphic retry.
 *  - State Mutation Guard: If the student modifies any token, immediately resets to active construction.
 */
export function useSocraticScaffolding(config: ScaffoldingConfig): SocraticScaffoldingReturn {
  const { type } = config
  const spec = config.spec

  // Derived initial badge
  const initialTierBadge = React.useMemo(() => {
    if (type === "array") {
      const arraySpec = spec as ArrayProblemSpec
      return `Step 1: Build ${arraySpec.targetRows} Rows`
    }
    return "Step 1: Pair Up"
  }, [type, spec])

  // Explicit State Machine Reducer
  const [state, dispatch] = React.useReducer(
    (st: ScaffoldingState, ev: ScaffoldingEvent) => scaffoldingReducer(st, ev, initialTierBadge),
    initialTierBadge,
    createInitialScaffoldingState,
  )

  // Target ghost coordinates
  const ghostCoordinates = React.useMemo(() => {
    return computeGhostCoordinates(spec, type)
  }, [spec, type])

  const checkGhostCell = React.useCallback(
    (row: number, col: number) => isGhostCell(row, col, spec, type),
    [spec, type],
  )

  // ==========================================================================
  // State Mutation Guard
  // ==========================================================================
  const onTokenMutated = React.useCallback(() => {
    dispatch({ type: "TOKEN_MUTATED" })
  }, [])

  // Automatic change detection guard when grid or slots are passed via props
  const tokensHash = React.useMemo(() => {
    if (config.type === "array" && config.grid) {
      return config.grid.map((r) => r.map((c) => (c ? "1" : "0")).join("")).join("")
    }
    if (config.type === "parity" && config.slots) {
      return config.slots.map((s) => `${s.left ? "1" : "0"}${s.right ? "1" : "0"}`).join("")
    }
    return ""
  }, [config])

  const prevTokensHashRef = React.useRef(tokensHash)

  React.useEffect(() => {
    if (prevTokensHashRef.current !== tokensHash) {
      prevTokensHashRef.current = tokensHash
      onTokenMutated()
    }
  }, [tokensHash, onTokenMutated])

  // Reset when spec changes
  React.useEffect(() => {
    dispatch({ type: "RESET", initialBadge: initialTierBadge })
  }, [spec, initialTierBadge])

  // ==========================================================================
  // Tier 3 Auto-Placement Demonstrator Step
  // ==========================================================================
  const autoPlaceStep = React.useCallback(() => {
    let demoFeedback = ""
    if (config.type === "array") {
      const arraySpec = config.spec
      const grid = config.grid || []
      const rows = grid.length || 5
      const cols = grid[0]?.length || 5
      const demonstrated = demonstrateArrayStep(arraySpec, rows, cols)
      config.onGridChange?.(demonstrated)
      demoFeedback = `Pencil Pal placed Row 1 with ${arraySpec.targetCols} cookies! Now can you finish Rows 2 and ${arraySpec.targetRows}?`
    } else {
      const paritySpec = config.spec
      const slots = config.slots || []
      const maxPairs = slots.length || 10
      const demonstrated = demonstrateParityStep(paritySpec, maxPairs)
      config.onSlotsChange?.(demonstrated)
      demoFeedback = "Pencil Pal paired up the first 2 counters! Can you pair up the rest?"
    }

    dispatch({
      type: "REQUEST_DEMONSTRATION",
      feedback: demoFeedback,
      tierBadge: "Step 3: Step Demonstration",
    })
  }, [config])

  const requestDemonstration = React.useCallback(() => {
    autoPlaceStep()
  }, [autoPlaceStep])

  // ==========================================================================
  // Isomorphic Seed Retry
  // ==========================================================================
  const triggerIsomorphicRetry = React.useCallback(() => {
    dispatch({ type: "TRIGGER_ISOMORPHIC_RETRY", initialBadge: initialTierBadge })

    if (config.type === "array") {
      const nextSpec = getIsomorphicArraySpec(config.spec)
      config.onIsomorphicRetry?.(nextSpec)
    } else {
      const nextSpec = getIsomorphicParitySpec(config.spec)
      config.onIsomorphicRetry?.(nextSpec)
    }
  }, [config, initialTierBadge])

  // ==========================================================================
  // Check Answer Evaluator & Ladder Progression
  // ==========================================================================
  const checkAnswer = React.useCallback(
    (overrideTokens?: boolean[][] | PairingSlot[]): ArrayDiagnostic | ParityDiagnostic => {
      if (config.type === "array") {
        const gridToEvaluate = (overrideTokens as boolean[][]) || config.grid || []
        const diagnostic = evaluateArrayGrid(gridToEvaluate, config.spec)

        if (diagnostic.status === "correct") {
          dispatch({
            type: "EVALUATION_SUCCESS",
            feedback: diagnostic.feedback,
            badge: `${config.spec.targetRows} Rows Verified! 🌟`,
          })
          return diagnostic
        }

        // Failure detected: escalate progressive hint ladder
        const nextFail = state.failureCount + 1

        if (nextFail >= 3) {
          autoPlaceStep()
        } else {
          const tier1Pose =
            diagnostic.status === "incomplete_inventory" || diagnostic.status === "empty"
              ? "point"
              : "think"
          const tierFeedback =
            nextFail === 1
              ? diagnostic.feedback
              : `Pencil Pal drew dotted ghost boxes for ${config.spec.targetRows} rows of ${config.spec.targetCols}! Can you fill the ghost boxes?`
          const tierBadge = nextFail === 1 ? "Step 1: Check Your Rows" : "Step 2: Ghost Assist"

          dispatch({
            type: "EVALUATION_FAILURE",
            feedback: tierFeedback,
            tierBadge,
            tier1Pose,
          })
        }

        return diagnostic
      } else {
        // Parity
        const slotsToEvaluate = (overrideTokens as PairingSlot[]) || config.slots || []
        const diagnostic = evaluatePairingMat(slotsToEvaluate, config.spec)

        if (diagnostic.status === "correct_even" || diagnostic.status === "correct_odd") {
          dispatch({
            type: "EVALUATION_SUCCESS",
            feedback: diagnostic.feedback,
            badge: "Buddy Pairs Verified! 🌟",
          })
          return diagnostic
        }

        // Failure detected
        const nextFail = state.failureCount + 1

        if (nextFail >= 3) {
          autoPlaceStep()
        } else {
          const tier1Pose =
            diagnostic.status === "incomplete_inventory" || diagnostic.status === "empty"
              ? "point"
              : "think"
          const tierFeedback =
            nextFail === 1
              ? diagnostic.feedback
              : "Pencil Pal drew dotted ghost boxes for your pairs! Can you place your counters into the buddy boxes?"
          const tierBadge = nextFail === 1 ? "Step 1: Buddy Check" : "Step 2: Ghost Assist"

          dispatch({
            type: "EVALUATION_FAILURE",
            feedback: tierFeedback,
            tierBadge,
            tier1Pose,
          })
        }

        return diagnostic
      }
    },
    [config, state.failureCount, autoPlaceStep],
  )

  const resetScaffolding = React.useCallback(() => {
    dispatch({ type: "RESET", initialBadge: initialTierBadge })
  }, [initialTierBadge])

  return {
    tier: state.tier,
    status: state.phase,
    failureCount: state.failureCount,
    isGhostVisible: state.isGhostVisible,
    ghostCoordinates,
    isGhostCell: checkGhostCell,
    feedback: state.feedback,
    mascotPose: state.mascotPose,
    tierBadge: state.tierBadge,
    wasDemonstrated: state.wasDemonstrated,
    masteryEligible: state.masteryEligible,
    isValidated: state.isValidated,
    checkAnswer,
    requestDemonstration,
    autoPlaceStep,
    triggerIsomorphicRetry,
    onTokenMutated,
    resetScaffolding,
    machineState: state,
    dispatch,
  }
}

/**
 * Specialized scaffolding hook for NC.2.OA.4 Rectangular Arrays.
 */
export function useArrayScaffolding(config: Omit<ArrayScaffoldingConfig, "type">): Omit<
  SocraticScaffoldingReturn,
  "checkAnswer"
> & {
  checkAnswer: (overrideGrid?: boolean[][]) => ArrayDiagnostic
} {
  const result = useSocraticScaffolding({ ...config, type: "array" })
  return {
    ...result,
    checkAnswer: (overrideGrid?: boolean[][]) =>
      result.checkAnswer(overrideGrid) as ArrayDiagnostic,
  }
}

/**
 * Specialized scaffolding hook for NC.2.OA.3 Parity Pairing.
 */
export function useParityScaffolding(config: Omit<ParityScaffoldingConfig, "type">): Omit<
  SocraticScaffoldingReturn,
  "checkAnswer"
> & {
  checkAnswer: (overrideSlots?: PairingSlot[]) => ParityDiagnostic
} {
  const result = useSocraticScaffolding({ ...config, type: "parity" })
  return {
    ...result,
    checkAnswer: (overrideSlots?: PairingSlot[]) =>
      result.checkAnswer(overrideSlots) as ParityDiagnostic,
  }
}
