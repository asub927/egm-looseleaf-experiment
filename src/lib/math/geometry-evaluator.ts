/**
 * Headless Mathematical Diagnostic Evaluator for NC.2.G.3 (Equal Partitioning).
 *
 * Evaluates partition dividers against a target geometry specification.
 * Pure headless mathematical functions completely decoupled from React DOM,
 * window, or SVG APIs to support sub-millisecond execution in Node 26.
 */

import type {
  GeometryShapeType,
  GeometryShareCount,
  NC2GItem,
} from "../../curriculum/invariants.ts"

export type { GeometryShapeType, GeometryShareCount, NC2GItem }
export type GeometryProblemSpec = NC2GItem

export type GeometryDiagnostic =
  | {
      status: "correct"
      shapeType: GeometryShapeType
      shares: GeometryShareCount
      shareFractions: number[]
      verbalEquation: string
      feedback: string
    }
  | {
      status: "unequal_shares"
      shapeType: GeometryShapeType
      targetShares: GeometryShareCount
      actualShares: number
      largestShareRatio: number
      smallestShareRatio: number
      feedback: string
    }
  | {
      status: "wrong_share_count"
      shapeType: GeometryShapeType
      actualShares: number
      targetShares: GeometryShareCount
      feedback: string
    }
  | {
      status: "unpartitioned"
      feedback: string
    }

export const GEOMETRY_TOLERANCE = 0.05
const FLOAT_EPSILON = 1e-9

/**
 * Evaluates partition dividers against a target geometry specification.
 *
 * Mathematical Algorithm & Coordinate Transformations:
 * 1. Rectangular Partitioning:
 *    - Input `cuts` represents internal divider positions c_1, ..., c_{k-1} sorted in [0, 1].
 *    - Share sizes s_0, ..., s_{k-1} are calculated via interval differences:
 *      s_0 = c_1, s_i = c_{i+1} - c_i, s_{k-1} = 1 - c_{k-1}.
 * 2. Circular Radial Partitioning:
 *    - Input `cuts` represents radial spoke angles theta_0, ..., theta_{k-1} sorted in [0, 360).
 *    - Share fractions are angular differences modulo 360:
 *      s_i = (theta_{i+1} - theta_i) / 360, with wrap-around s_{k-1} = (360 - theta_{k-1} + theta_0) / 360.
 * 3. Tolerance & Status Resolution:
 *    - If cuts.length === 0, returns status: "unpartitioned".
 *    - If actualShares !== spec.targetShares, returns status: "wrong_share_count".
 *    - Equality threshold uses absolute tolerance: |s_i - 1 / spec.targetShares| <= 0.05 for all shares i.
 *    - If all shares satisfy tolerance, returns status: "correct"; otherwise status: "unequal_shares".
 *
 * Deterministic Feedback Templates:
 * - correct: "Great job! You cut the {context} into {targetShares} equal {verbalShareName}!"
 * - unequal_shares: "These pieces aren't equal yet! Slide the cutter to make each share the same size."
 * - wrong_share_count: "We need {targetShares} equal shares! Select the [{targetShares} {verbalShareName}] cutter."
 * - unpartitioned: "Use the cutter to partition the {context} into {targetShares} equal {verbalShareName}!"
 */
export function evaluatePartition(
  cuts: number[],
  spec: GeometryProblemSpec
): GeometryDiagnostic {
  const verbalShareName =
    spec.verbalShareName ||
    (spec.targetShares === 2
      ? "halves"
      : spec.targetShares === 3
        ? "thirds"
        : "fourths")
  const context = spec.context || "shape"

  // 1. Unpartitioned check
  if (!cuts || cuts.length === 0) {
    return {
      status: "unpartitioned",
      feedback: `Use the cutter to partition the ${context} into ${spec.targetShares} equal ${verbalShareName}!`,
    }
  }

  // 2. Share count check
  // For rectangles, k-1 cuts partition into k shares (actualShares = cuts.length + 1).
  // For circles, k radial spoke cuts partition into k wedge shares (actualShares = cuts.length).
  const actualShares =
    spec.shapeType === "rectangle" ? cuts.length + 1 : cuts.length

  if (actualShares !== spec.targetShares) {
    return {
      status: "wrong_share_count",
      shapeType: spec.shapeType,
      actualShares,
      targetShares: spec.targetShares,
      feedback: `We need ${spec.targetShares} equal shares! Select the [${spec.targetShares} ${verbalShareName}] cutter.`,
    }
  }

  // Guard against non-finite values (NaN, Infinity)
  if (cuts.some((c) => typeof c !== "number" || !Number.isFinite(c))) {
    return {
      status: "unequal_shares",
      shapeType: spec.shapeType,
      targetShares: spec.targetShares,
      actualShares,
      largestShareRatio: 1,
      smallestShareRatio: 0,
      feedback:
        "These pieces aren't equal yet! Slide the cutter to make each share the same size.",
    }
  }

  // 3. Compute share fractions
  const k = spec.targetShares
  const shareFractions: number[] = new Array(k)

  if (spec.shapeType === "rectangle") {
    // Sort cuts ascending. Clamp to [0, 1] to represent valid coordinate positions on the pan.
    const sortedCuts = cuts
      .map((c) => Math.max(0, Math.min(1, c)))
      .sort((a, b) => a - b)

    // s_0 = c_0
    shareFractions[0] = sortedCuts[0]
    // s_i = c_i - c_{i-1} for i in 1..k-2
    for (let i = 1; i < k - 1; i++) {
      shareFractions[i] = sortedCuts[i] - sortedCuts[i - 1]
    }
    // s_{k-1} = 1 - c_{k-2}
    shareFractions[k - 1] = 1 - sortedCuts[k - 2]
  } else {
    // Circular radial partitioning:
    // Normalize angles modulo 360 into [0, 360) and sort ascending.
    const sortedAngles = cuts
      .map((theta) => ((theta % 360) + 360) % 360)
      .sort((a, b) => a - b)

    // s_i = (theta_{i+1} - theta_i) / 360 for i in 0..k-2
    for (let i = 0; i < k - 1; i++) {
      shareFractions[i] = (sortedAngles[i + 1] - sortedAngles[i]) / 360
    }
    // s_{k-1} = (360 - theta_{k-1} + theta_0) / 360
    shareFractions[k - 1] =
      (360 - sortedAngles[k - 1] + sortedAngles[0]) / 360
  }

  // 4. Equality tolerance threshold: |s_i - 1/k| <= 0.05
  const targetShareFraction = 1 / spec.targetShares
  const isEqual = shareFractions.every(
    (s) => Math.abs(s - targetShareFraction) <= GEOMETRY_TOLERANCE + FLOAT_EPSILON
  )

  if (isEqual) {
    const verbalEquation =
      spec.equation || `${spec.targetShares} ${verbalShareName} = 1 whole`
    return {
      status: "correct",
      shapeType: spec.shapeType,
      shares: spec.targetShares,
      shareFractions,
      verbalEquation,
      feedback: `Great job! You cut the ${context} into ${spec.targetShares} equal ${verbalShareName}!`,
    }
  }

  // Unequal shares
  const largestShareRatio = Math.max(...shareFractions)
  const smallestShareRatio = Math.min(...shareFractions)

  return {
    status: "unequal_shares",
    shapeType: spec.shapeType,
    targetShares: spec.targetShares,
    actualShares,
    largestShareRatio,
    smallestShareRatio,
    feedback:
      "These pieces aren't equal yet! Slide the cutter to make each share the same size.",
  }
}
