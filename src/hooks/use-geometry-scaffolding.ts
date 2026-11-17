"use client"

import * as React from "react"
import type { NC2GItem } from "../curriculum/invariants.ts"
import { NC2_G_SEEDS } from "../curriculum/items/nc2-g.ts"
import { evaluatePartition, type GeometryDiagnostic } from "../lib/math/geometry-evaluator.ts"
import type { ScaffoldingTier, ScaffoldingStatus } from "./use-socratic-scaffolding.ts"
import type { MascotPose } from "../lib/ink/art/mascots/index.ts"
import {
  scaffoldingReducer,
  createInitialScaffoldingState,
  type ScaffoldingState,
  type ScaffoldingEvent,
} from "../lib/state/scaffolding-machine.ts"

export type { ScaffoldingTier, ScaffoldingStatus, ScaffoldingState, ScaffoldingEvent }

export interface GeometryScaffoldingConfig {
  spec: NC2GItem
  cuts: number[]
  onCutsChange: (cuts: number[]) => void
  onIsomorphicRetry?: (newSpec: NC2GItem) => void
}

export interface GeometryScaffoldingReturn {
  tier: ScaffoldingTier
  status: ScaffoldingStatus
  failureCount: number
  isGhostVisible: boolean
  ghostCuts: number[]
  feedback: string | null
  mascotPose: MascotPose
  tierBadge: string
  wasDemonstrated: boolean
  masteryEligible: boolean
  isValidated: boolean
  checkAnswer: (overrideCuts?: number[]) => GeometryDiagnostic
  requestDemonstration: () => void
  autoPlaceStep: () => void
  triggerIsomorphicRetry: () => void
  resetScaffolding: () => void
  /** Explicit State Machine snapshot for Agent (AX) and Developer (DX) introspection */
  machineState: ScaffoldingState
  /** Dispatch explicit state machine event */
  dispatch: (event: ScaffoldingEvent) => void
}

/**
 * Returns canonical demonstration cut coordinates for a given problem spec.
 * - Rectangles: 2 shares -> [0.5]; 3 shares -> [1/3, 2/3]; 4 shares -> [0.25, 0.5, 0.75].
 * - Circles: 2 shares -> [0, 180]; 3 shares -> [0, 120, 240]; 4 shares -> [0, 90, 180, 270].
 */
export function demonstrateGeometryStep(spec: NC2GItem): number[] {
  if (spec.shapeType === "rectangle") {
    switch (spec.targetShares) {
      case 2:
        return [0.5]
      case 3:
        return [1 / 3, 2 / 3]
      case 4:
        return [0.25, 0.5, 0.75]
      default:
        return [0.5]
    }
  }

  // Circular radial angles (in degrees [0..360))
  switch (spec.targetShares) {
    case 2:
      return [0, 180]
    case 3:
      return [0, 120, 240]
    case 4:
      return [0, 90, 180, 270]
    default:
      return [0, 180]
  }
}

/**
 * Selects an isomorphic problem seed matching the current target shares but offering
 * an alternate context or complementary shape type for mastery re-qualification.
 *
 * Algorithm:
 * - Filters seed bank for items with matching `targetShares` but different `id`.
 * - Prefers alternate shapeType (rectangle <-> circle).
 * - Falls back to another seed with same targetShares, or returns current if no siblings exist.
 */
export function getIsomorphicGeometrySpec(
  current: NC2GItem,
  seeds: readonly NC2GItem[] = NC2_G_SEEDS,
): NC2GItem {
  const pool = seeds ?? NC2_G_SEEDS
  const candidates = pool.filter(
    (s) => s.targetShares === current.targetShares && s.id !== current.id,
  )

  if (candidates.length === 0) {
    return current
  }

  const oppositeShape = current.shapeType === "rectangle" ? "circle" : "rectangle"
  const oppositeCandidates = candidates.filter((s) => s.shapeType === oppositeShape)

  if (oppositeCandidates.length > 0) {
    return oppositeCandidates[0]
  }

  return candidates[0]
}

function getInitialTierBadge(item: NC2GItem): string {
  const capitalized = item.verbalShareName.charAt(0).toUpperCase() + item.verbalShareName.slice(1)
  return `Step 1: Cut ${item.targetShares} ${capitalized}`
}

/**
 * Headless Socratic Scaffolding State Machine for NC.2.G.3 Equal Partitioning.
 *
 * Hint Ladder Progression:
 * - Tier 0 (Constructing): Active direct manipulation with cutter or tool badges.
 * - Tier 1 (Targeted Socratic Prompt): 1st error. Pencil Pal adopts think pose and highlights unequal shares.
 * - Tier 2 (Visual Assist Ghost Lines): 2nd error. Dotted guide lines appear over exact target fractional cuts.
 * - Tier 3 (Demonstrative Snap & Isomorphic Retry): 3rd error or student help request.
 *   Cutter snaps to canonical demonstration cuts (`demonstrateGeometryStep`).
 *   Mastery credit is revoked for the current seed, unlocking isomorphic retry (`getIsomorphicGeometrySpec`).
 */
export function useGeometryScaffolding(
  config: GeometryScaffoldingConfig,
): GeometryScaffoldingReturn {
  const { spec } = config
  const initialTierBadge = React.useMemo(() => getInitialTierBadge(spec), [spec])

  // Explicit State Machine Reducer
  const [state, dispatch] = React.useReducer(
    (st: ScaffoldingState, ev: ScaffoldingEvent) => scaffoldingReducer(st, ev, initialTierBadge),
    initialTierBadge,
    createInitialScaffoldingState,
  )

  // Ghost cut coordinates derived from canonical demonstration
  const ghostCuts = React.useMemo(() => {
    return demonstrateGeometryStep(spec)
  }, [spec])

  // Track state mutations via cuts array serialization
  const cutsHash = React.useMemo(() => {
    return (config.cuts || []).join(",")
  }, [config.cuts])

  const prevCutsHashRef = React.useRef(cutsHash)
  const isDemonstratingRef = React.useRef(false)

  const onCutsMutated = React.useCallback(() => {
    dispatch({ type: "TOKEN_MUTATED" })
  }, [])

  React.useEffect(() => {
    if (prevCutsHashRef.current !== cutsHash) {
      prevCutsHashRef.current = cutsHash
      if (isDemonstratingRef.current) {
        isDemonstratingRef.current = false
        return
      }
      onCutsMutated()
    }
  }, [cutsHash, onCutsMutated])

  // Reset when spec changes
  React.useEffect(() => {
    dispatch({ type: "RESET", initialBadge: initialTierBadge })
  }, [spec, initialTierBadge])

  // ==========================================================================
  // Tier 3 Demonstrator Step
  // ==========================================================================
  const autoPlaceStep = React.useCallback(() => {
    const demoCuts = demonstrateGeometryStep(config.spec)
    isDemonstratingRef.current = true
    config.onCutsChange(demoCuts)
    dispatch({
      type: "REQUEST_DEMONSTRATION",
      feedback: `Pencil Pal demonstrated the cut for ${config.spec.targetShares} equal ${config.spec.verbalShareName}! Try another challenge to earn your star.`,
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
    const nextSpec = getIsomorphicGeometrySpec(config.spec)
    dispatch({ type: "TRIGGER_ISOMORPHIC_RETRY", initialBadge: getInitialTierBadge(nextSpec) })
    config.onCutsChange([])
    config.onIsomorphicRetry?.(nextSpec)
  }, [config])

  // ==========================================================================
  // Answer Evaluator & Ladder Progression
  // ==========================================================================
  const checkAnswer = React.useCallback(
    (overrideCuts?: number[]): GeometryDiagnostic => {
      const cutsToEvaluate = overrideCuts ?? config.cuts ?? []
      const diagnostic = evaluatePartition(cutsToEvaluate, config.spec)

      if (diagnostic.status === "correct") {
        const capitalized =
          config.spec.verbalShareName.charAt(0).toUpperCase() + config.spec.verbalShareName.slice(1)
        dispatch({
          type: "EVALUATION_SUCCESS",
          feedback: diagnostic.feedback,
          badge: `${config.spec.targetShares} Equal ${capitalized}! 🌟`,
        })
        return diagnostic
      }

      // Failure detected: escalate progressive hint ladder
      const nextFail = state.failureCount + 1

      if (nextFail >= 3) {
        autoPlaceStep()
      } else {
        const tierFeedback =
          nextFail === 1
            ? diagnostic.feedback
            : `Pencil Pal drew dotted guide lines for ${config.spec.targetShares} equal ${config.spec.verbalShareName}! Can you snap the cutter to the dotted lines?`
        const tierBadge = nextFail === 1 ? "Step 1: Check Equal Shares" : "Step 2: Ghost Assist"

        dispatch({
          type: "EVALUATION_FAILURE",
          feedback: tierFeedback,
          tierBadge,
          tier1Pose: "think",
        })
      }

      return diagnostic
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
    ghostCuts,
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
    resetScaffolding,
    machineState: state,
    dispatch,
  }
}
