import test from "node:test"
import assert from "node:assert/strict"
import {
  computeGhostCoordinates,
  isGhostCell,
  demonstrateArrayStep,
  demonstrateParityStep,
  getIsomorphicArraySpec,
  getIsomorphicParitySpec,
  type ArrayProblemSpec,
  type ParityProblemSpec,
} from "../../src/hooks/use-socratic-scaffolding.ts"
import {
  demonstrateGeometryStep,
  getIsomorphicGeometrySpec,
} from "../../src/hooks/use-geometry-scaffolding.ts"
import { NC2_G_SEEDS } from "../../src/curriculum/items/nc2-g.ts"
import { evaluateArrayGrid } from "../../src/lib/math/evaluator.ts"
import { evaluatePartition } from "../../src/lib/math/geometry-evaluator.ts"

const SPEC_3x4: ArrayProblemSpec = {
  targetRows: 3,
  targetCols: 4,
  totalTokens: 12,
}

const SPEC_PARITY_7: ParityProblemSpec = {
  totalTokens: 7,
  strategy: "pairing",
}

test("Ghost Coordinates: 3x4 Array must produce exactly 12 coordinates", () => {
  const coords = computeGhostCoordinates(SPEC_3x4, "array")
  assert.equal(coords.length, 12)
  assert.deepEqual(coords[0], { row: 0, col: 0 })
  assert.deepEqual(coords[11], { row: 2, col: 3 })

  assert.equal(isGhostCell(0, 0, SPEC_3x4, "array"), true)
  assert.equal(isGhostCell(2, 3, SPEC_3x4, "array"), true)
  assert.equal(isGhostCell(3, 0, SPEC_3x4, "array"), false)
  assert.equal(isGhostCell(0, 4, SPEC_3x4, "array"), false)
})

test("Ghost Coordinates: 7 Acorn Parity must produce exactly 7 coordinates", () => {
  const coords = computeGhostCoordinates(SPEC_PARITY_7, "parity")
  assert.equal(coords.length, 7)
  // Row 0: left (0,0), right (0,1)
  assert.deepEqual(coords[0], { row: 0, col: 0 })
  assert.deepEqual(coords[1], { row: 0, col: 1 })
  // Row 3 (leftover): left (3, 0)
  assert.deepEqual(coords[6], { row: 3, col: 0 })

  assert.equal(isGhostCell(0, 0, SPEC_PARITY_7, "parity"), true)
  assert.equal(isGhostCell(3, 0, SPEC_PARITY_7, "parity"), true)
  assert.equal(isGhostCell(3, 1, SPEC_PARITY_7, "parity"), false) // no 8th token
})

test("Tier 3 Demonstration: Array Step auto-places Row 1 with targetCols tokens", () => {
  const grid = demonstrateArrayStep(SPEC_3x4, 5, 5)
  // Row 0 must have exactly targetCols (4) tokens
  assert.equal(grid[0].filter(Boolean).length, 4)
  assert.equal(grid[0][0], true)
  assert.equal(grid[0][1], true)
  assert.equal(grid[0][2], true)
  assert.equal(grid[0][3], true)
  assert.equal(grid[0][4], false)

  // Subsequent rows must be empty
  for (let r = 1; r < 5; r++) {
    assert.equal(grid[r].every((c) => !c), true)
  }
})

test("Tier 3 Demonstration: Parity Step auto-places Pair 1", () => {
  const slots = demonstrateParityStep(SPEC_PARITY_7, 10)
  assert.equal(slots[0].left, true)
  assert.equal(slots[0].right, true)
  for (let i = 1; i < 10; i++) {
    assert.equal(slots[i].left, false)
    assert.equal(slots[i].right, false)
  }
})

test("Isomorphic Spec Generator: 3x4 Array returns an isomorphic sibling", () => {
  const next = getIsomorphicArraySpec(SPEC_3x4)
  assert.notEqual(`${next.targetRows}x${next.targetCols}`, "3x4")
  assert.equal(next.targetRows <= 5, true)
  assert.equal(next.targetCols <= 5, true)
})

test("Isomorphic Spec Generator: Odd Parity 7 returns another odd spec", () => {
  const next = getIsomorphicParitySpec(SPEC_PARITY_7)
  assert.notEqual(next.totalTokens, 7)
  assert.equal(next.totalTokens % 2 !== 0, true)
})

test("Deterministic 3-Tier Progressive Hint Ladder Progression Logic", () => {
  // Simulate 3 successive failures on 3x4 spec
  let failureCount = 0
  let tier: 0 | 1 | 2 | 3 = 0
  let isGhostVisible = false
  let wasDemonstrated = false
  let masteryEligible = true
  let status: string = "constructing"

  // Attempt 1: student checks empty or unequal grid -> fail
  const badGrid = Array(5).fill(null).map(() => Array(5).fill(false))
  badGrid[0][0] = true // 1 token placed (incomplete_inventory)

  const diag1 = evaluateArrayGrid(badGrid, SPEC_3x4)
  assert.notEqual(diag1.status, "correct")

  failureCount++
  if (failureCount === 1) {
    tier = 1
    status = "tier1_prompt"
    isGhostVisible = false
  }

  assert.equal(failureCount, 1)
  assert.equal(tier, 1)
  assert.equal(status, "tier1_prompt")
  assert.equal(isGhostVisible, false)
  assert.match(diag1.feedback, /Check your tray|cookies on the paper/i)

  // State Mutation Guard: student moves/adds a token
  status = "constructing"
  assert.equal(status, "constructing")

  // Attempt 2: student checks orientation error (4 rows of 3) -> fail
  const transposedGrid = Array(5).fill(null).map(() => Array(5).fill(false))
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 3; c++) transposedGrid[r][c] = true
  }
  const diag2 = evaluateArrayGrid(transposedGrid, SPEC_3x4)
  assert.equal(diag2.status, "orientation_error")

  failureCount++
  if (failureCount === 2) {
    tier = 2
    status = "tier2_ghost"
    isGhostVisible = true
  }

  assert.equal(failureCount, 2)
  assert.equal(tier, 2)
  assert.equal(status, "tier2_ghost")
  assert.equal(isGhostVisible, true)

  // State Mutation Guard in Tier 2: student edits token, ghost MUST stay visible
  status = "constructing"
  assert.equal(status, "constructing")
  assert.equal(isGhostVisible, true) // Ghost assist persists

  // Attempt 3: third failure -> escalates to Tier 3 Step Demonstration
  failureCount++
  if (failureCount >= 3) {
    tier = 3
    status = "tier3_demonstrate"
    wasDemonstrated = true
    masteryEligible = false
    const demoGrid = demonstrateArrayStep(SPEC_3x4)
    assert.equal(demoGrid[0].filter(Boolean).length, 4)
  }

  assert.equal(failureCount, 3)
  assert.equal(tier, 3)
  assert.equal(status, "tier3_demonstrate")
  assert.equal(wasDemonstrated, true)
  assert.equal(masteryEligible, false)

  // Isomorphic retry resets ladder
  const nextSpec = getIsomorphicArraySpec(SPEC_3x4)
  failureCount = 0
  tier = 0
  status = "constructing"
  isGhostVisible = false
  wasDemonstrated = false
  masteryEligible = true

  assert.equal(failureCount, 0)
  assert.equal(tier, 0)
  assert.equal(status, "constructing")
  assert.equal(isGhostVisible, false)
  assert.equal(wasDemonstrated, false)
  assert.equal(masteryEligible, true)
  assert.notEqual(nextSpec.targetRows * nextSpec.targetCols, 0)
})

test("Tier 3 Demonstration: Geometry Step auto-places canonical cuts for rectangles and circles", () => {
  // Rectangle halves
  const rectHalves = NC2_G_SEEDS.find((s) => s.id === "nc2-g-halves-brownies")!
  assert.deepEqual(demonstrateGeometryStep(rectHalves), [0.5])

  // Rectangle thirds
  const rectThirds = NC2_G_SEEDS.find((s) => s.id === "nc2-g-thirds-cake")!
  assert.deepEqual(demonstrateGeometryStep(rectThirds), [1 / 3, 2 / 3])

  // Rectangle fourths
  const rectFourths = NC2_G_SEEDS.find((s) => s.id === "nc2-g-fourths-sheet")!
  assert.deepEqual(demonstrateGeometryStep(rectFourths), [0.25, 0.5, 0.75])

  // Circle halves
  const circHalves = NC2_G_SEEDS.find((s) => s.id === "nc2-g-halves-pizza")!
  assert.deepEqual(demonstrateGeometryStep(circHalves), [0, 180])

  // Circle thirds
  const circThirds = NC2_G_SEEDS.find((s) => s.id === "nc2-g-thirds-tart")!
  assert.deepEqual(demonstrateGeometryStep(circThirds), [0, 120, 240])

  // Circle fourths
  const circFourths = NC2_G_SEEDS.find((s) => s.id === "nc2-g-fourths-pie")!
  assert.deepEqual(demonstrateGeometryStep(circFourths), [0, 90, 180, 270])
})

test("Isomorphic Spec Generator: Geometry returns complementary shape with matching targetShares", () => {
  for (const seed of NC2_G_SEEDS) {
    const next = getIsomorphicGeometrySpec(seed)
    assert.equal(next.targetShares, seed.targetShares)
    assert.notEqual(next.id, seed.id)
    assert.equal(
      next.shapeType,
      seed.shapeType === "rectangle" ? "circle" : "rectangle"
    )
  }
})

test("Deterministic 3-Tier Progressive Hint Ladder for Geometry", () => {
  const seed = NC2_G_SEEDS.find((s) => s.id === "nc2-g-thirds-cake")! // 3 thirds
  let failureCount = 0
  let tier: 0 | 1 | 2 | 3 = 0
  let isGhostVisible = false
  let wasDemonstrated = false
  let masteryEligible = true
  let status = "constructing"

  // Attempt 1: 1 cut provided (wrong_share_count) -> fail
  const diag1 = evaluatePartition([0.5], seed)
  assert.equal(diag1.status, "wrong_share_count")

  failureCount++
  if (failureCount === 1) {
    tier = 1
    status = "tier1_prompt"
  }
  assert.equal(tier, 1)
  assert.equal(status, "tier1_prompt")
  assert.equal(isGhostVisible, false)

  // Student modifies cut -> constructing
  status = "constructing"

  // Attempt 2: 2 cuts provided but unequal ([0.2, 0.4]) -> fail
  const diag2 = evaluatePartition([0.2, 0.4], seed)
  assert.equal(diag2.status, "unequal_shares")

  failureCount++
  if (failureCount === 2) {
    tier = 2
    status = "tier2_ghost"
    isGhostVisible = true
  }
  assert.equal(tier, 2)
  assert.equal(status, "tier2_ghost")
  assert.equal(isGhostVisible, true)

  // Student moves cutter, ghost guide remains active
  status = "constructing"
  assert.equal(isGhostVisible, true)

  // Attempt 3: 3rd failure -> Tier 3 Demonstration
  failureCount++
  let demoCuts: number[] = []
  if (failureCount >= 3) {
    tier = 3
    status = "tier3_demonstrate"
    wasDemonstrated = true
    masteryEligible = false
    demoCuts = demonstrateGeometryStep(seed)
  }
  assert.equal(tier, 3)
  assert.equal(status, "tier3_demonstrate")
  assert.equal(wasDemonstrated, true)
  assert.equal(masteryEligible, false)
  assert.deepEqual(demoCuts, [1 / 3, 2 / 3])

  const demoDiag = evaluatePartition(demoCuts, seed)
  assert.equal(demoDiag.status, "correct")
})

