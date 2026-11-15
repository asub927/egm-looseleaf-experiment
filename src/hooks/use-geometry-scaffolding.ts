"use client"

import * as React from "react"
import type { NC2GItem } from "../curriculum/invariants.ts"
import { NC2_G_SEEDS } from "../curriculum/items/nc2-g.ts"
import {
  evaluatePartition,
  type GeometryDiagnostic,
} from "../lib/math/geometry-evaluator.ts"
import type {
  ScaffoldingTier,
  ScaffoldingStatus,
} from "./use-socratic-scaffolding.ts"
import type { MascotPose } from "../lib/ink/art/mascots/index.ts"

export type { ScaffoldingTier, ScaffoldingStatus }

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
  seeds: readonly NC2GItem[] = NC2_G_SEEDS
): NC2GItem {
  const pool = seeds ?? NC2_G_SEEDS
  const candidates = pool.filter(
    (s) => s.targetShares === current.targetShares && s.id !== current.id
  )

  if (candidates.length === 0) {
    return current
  }

  const oppositeShape =
    current.shapeType === "rectangle" ? "circle" : "rectangle"
  const oppositeCandidates = candidates.filter(
    (s) => s.shapeType === oppositeShape
  )

  if (oppositeCandidates.length > 0) {
    return oppositeCandidates[0]
  }

  return candidates[0]
}

function getInitialTierBadge(item: NC2GItem): string {
  const capitalized =
    item.verbalShareName.charAt(0).toUpperCase() + item.verbalShareName.slice(1)
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
  config: GeometryScaffoldingConfig
): GeometryScaffoldingReturn {
  const { spec } = config

  const [tier, setTier] = React.useState<ScaffoldingTier>(0)
  const [status, setStatus] = React.useState<ScaffoldingStatus>("constructing")
  const [failureCount, setFailureCount] = React.useState<number>(0)
  const [isGhostVisible, setIsGhostVisible] = React.useState<boolean>(false)
  const [feedback, setFeedback] = React.useState<string | null>(null)
  const [mascotPose, setMascotPose] = React.useState<MascotPose>("idle")
  const [tierBadge, setTierBadge] = React.useState<string>(() =>
    getInitialTierBadge(spec)
  )
  const [wasDemonstrated, setWasDemonstrated] = React.useState<boolean>(false)
  const [masteryEligible, setMasteryEligible] = React.useState<boolean>(true)
  const [isValidated, setIsValidated] = React.useState<boolean>(false)

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
    if (isValidated) {
      setIsValidated(false)
      setStatus("constructing")
      setMascotPose("idle")
      setTierBadge(getInitialTierBadge(config.spec))
      setFeedback(null)
      return
    }

    if (status === "tier1_prompt") {
      setStatus("constructing")
      setFeedback(null)
      return
    }

    if (status === "tier2_ghost") {
      setStatus("constructing")
      // isGhostVisible remains true so student can follow ghost lines
      return
    }

    if (status === "tier3_demonstrate") {
      setStatus("constructing")
      return
    }

    setStatus("constructing")
  }, [config.spec, isValidated, status])

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
    setTier(0)
    setStatus("constructing")
    setFailureCount(0)
    setIsGhostVisible(false)
    setFeedback(null)
    setWasDemonstrated(false)
    setMasteryEligible(true)
    setIsValidated(false)
    setMascotPose("idle")
    setTierBadge(getInitialTierBadge(spec))
  }, [spec])

  // ==========================================================================
  // Tier 3 Demonstrator Step
  // ==========================================================================
  const autoPlaceStep = React.useCallback(() => {
    const demoCuts = demonstrateGeometryStep(config.spec)
    setTier(3)
    setStatus("tier3_demonstrate")
    setWasDemonstrated(true)
    setMasteryEligible(false)
    setIsGhostVisible(true)
    setMascotPose("sketch")
    setTierBadge("Step 3: Step Demonstration")
    setFeedback(
      `Pencil Pal demonstrated the cut for ${config.spec.targetShares} equal ${config.spec.verbalShareName}! Try another challenge to earn your star.`
    )
    isDemonstratingRef.current = true
    config.onCutsChange(demoCuts)
  }, [config])

  const requestDemonstration = React.useCallback(() => {
    autoPlaceStep()
  }, [autoPlaceStep])

  // ==========================================================================
  // Isomorphic Seed Retry
  // ==========================================================================
  const triggerIsomorphicRetry = React.useCallback(() => {
    const nextSpec = getIsomorphicGeometrySpec(config.spec)
    setTier(0)
    setStatus("constructing")
    setFailureCount(0)
    setIsGhostVisible(false)
    setFeedback(null)
    setWasDemonstrated(false)
    setMasteryEligible(true)
    setIsValidated(false)
    setMascotPose("wave")
    setTierBadge(getInitialTierBadge(nextSpec))
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
        setTier(0)
        setStatus("validated")
        setIsValidated(true)
        setMascotPose("celebrate")
        const capitalized =
          config.spec.verbalShareName.charAt(0).toUpperCase() +
          config.spec.verbalShareName.slice(1)
        setTierBadge(`${config.spec.targetShares} Equal ${capitalized}! 🌟`)
        setFeedback(diagnostic.feedback)
        return diagnostic
      }

      // Failure detected: escalate progressive hint ladder
      const nextFail = failureCount + 1
      setFailureCount(nextFail)
      setIsValidated(false)

      if (nextFail === 1) {
        // Tier 1: Targeted Socratic Prompt
        setTier(1)
        setStatus("tier1_prompt")
        setTierBadge("Step 1: Check Equal Shares")
        setMascotPose("think")
        setFeedback(diagnostic.feedback)
      } else if (nextFail === 2) {
        // Tier 2: Visual Assist Ghost Lines
        setTier(2)
        setStatus("tier2_ghost")
        setIsGhostVisible(true)
        setMascotPose("sketch")
        setTierBadge("Step 2: Ghost Assist")
        setFeedback(
          `Pencil Pal drew dotted guide lines for ${config.spec.targetShares} equal ${config.spec.verbalShareName}! Can you snap the cutter to the dotted lines?`
        )
      } else {
        // Tier 3: Step Demonstration with Isomorphic Retry
        autoPlaceStep()
      }

      return diagnostic
    },
    [config, failureCount, autoPlaceStep]
  )

  const resetScaffolding = React.useCallback(() => {
    setTier(0)
    setStatus("constructing")
    setFailureCount(0)
    setIsGhostVisible(false)
    setFeedback(null)
    setWasDemonstrated(false)
    setMasteryEligible(true)
    setIsValidated(false)
    setMascotPose("idle")
    setTierBadge(getInitialTierBadge(config.spec))
  }, [config.spec])

  return {
    tier,
    status,
    failureCount,
    isGhostVisible,
    ghostCuts,
    feedback,
    mascotPose,
    tierBadge,
    wasDemonstrated,
    masteryEligible,
    isValidated,
    checkAnswer,
    requestDemonstration,
    autoPlaceStep,
    triggerIsomorphicRetry,
    resetScaffolding,
  }
}
