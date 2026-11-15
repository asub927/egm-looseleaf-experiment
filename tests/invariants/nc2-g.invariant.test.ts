import test from "node:test"
import assert from "node:assert/strict"
import {
  evaluatePartition,
  type GeometryProblemSpec,
} from "../../src/lib/math/geometry-evaluator.ts"
import { NC2_G_SEEDS } from "../../src/curriculum/items/nc2-g.ts"
import {
  demonstrateGeometryStep,
  getIsomorphicGeometrySpec,
} from "../../src/hooks/use-geometry-scaffolding.ts"

const SPEC_RECT_HALVES: GeometryProblemSpec = {
  id: "test-rect-halves",
  standard: "NC.2.G.3",
  label: "2 Halves (Brownie Pan)",
  shapeType: "rectangle",
  targetShares: 2,
  context: "brownies",
  itemSingular: "brownie",
  narrative: "Cut the brownies into 2 equal halves.",
  verbalShareName: "halves",
  equation: "2 halves = 1 whole",
}

const SPEC_RECT_THIRDS: GeometryProblemSpec = {
  id: "test-rect-thirds",
  standard: "NC.2.G.3",
  label: "3 Thirds (Sheet Cake)",
  shapeType: "rectangle",
  targetShares: 3,
  context: "sheet cake",
  itemSingular: "slice",
  narrative: "Cut the sheet cake into 3 equal thirds.",
  verbalShareName: "thirds",
  equation: "3 thirds = 1 whole",
}

const SPEC_RECT_FOURTHS: GeometryProblemSpec = {
  id: "test-rect-fourths",
  standard: "NC.2.G.3",
  label: "4 Fourths (Brownie Pan)",
  shapeType: "rectangle",
  targetShares: 4,
  context: "brownies",
  itemSingular: "brownie",
  narrative: "Partition the brownies into 4 equal fourths.",
  verbalShareName: "fourths",
  equation: "4 fourths = 1 whole",
}

const SPEC_CIRC_HALVES: GeometryProblemSpec = {
  id: "test-circ-halves",
  standard: "NC.2.G.3",
  label: "2 Halves (Personal Pizza)",
  shapeType: "circle",
  targetShares: 2,
  context: "pizza",
  itemSingular: "slice",
  narrative: "Cut the pizza into 2 equal halves.",
  verbalShareName: "halves",
  equation: "2 halves = 1 whole",
}

const SPEC_CIRC_THIRDS: GeometryProblemSpec = {
  id: "test-circ-thirds",
  standard: "NC.2.G.3",
  label: "3 Thirds (Fruit Tart)",
  shapeType: "circle",
  targetShares: 3,
  context: "fruit tart",
  itemSingular: "wedge",
  narrative: "Divide the fruit tart into 3 equal thirds.",
  verbalShareName: "thirds",
  equation: "3 thirds = 1 whole",
}

const SPEC_CIRC_FOURTHS: GeometryProblemSpec = {
  id: "test-circ-fourths",
  standard: "NC.2.G.3",
  label: "4 Fourths (Berry Pie)",
  shapeType: "circle",
  targetShares: 4,
  context: "berry pie",
  itemSingular: "slice",
  narrative: "Divide the berry pie into 4 equal fourths.",
  verbalShareName: "fourths",
  equation: "4 fourths = 1 whole",
}

test("NC.2.G.3 Invariant 1: Valid halves, thirds, and fourths for rectangles must PASS as correct", () => {
  // 1. Halves: 1 cut at 0.5
  const resHalves = evaluatePartition([0.5], SPEC_RECT_HALVES)
  assert.equal(resHalves.status, "correct")
  if (resHalves.status === "correct") {
    assert.equal(resHalves.shares, 2)
    assert.deepEqual(resHalves.shareFractions, [0.5, 0.5])
    assert.equal(resHalves.verbalEquation, "2 halves = 1 whole")
    assert.equal(resHalves.feedback, "Great job! You cut the brownies into 2 equal halves!")
  }

  // 2. Thirds: 2 cuts at 1/3 and 2/3
  const resThirds = evaluatePartition([1 / 3, 2 / 3], SPEC_RECT_THIRDS)
  assert.equal(resThirds.status, "correct")
  if (resThirds.status === "correct") {
    assert.equal(resThirds.shares, 3)
    assert.equal(resThirds.verbalEquation, "3 thirds = 1 whole")
    assert.equal(resThirds.feedback, "Great job! You cut the sheet cake into 3 equal thirds!")
  }

  // Approximate thirds: [0.333, 0.667]
  const resThirdsApprox = evaluatePartition([0.333, 0.667], SPEC_RECT_THIRDS)
  assert.equal(resThirdsApprox.status, "correct")

  // 3. Fourths: 3 cuts at 0.25, 0.5, 0.75
  const resFourths = evaluatePartition([0.25, 0.5, 0.75], SPEC_RECT_FOURTHS)
  assert.equal(resFourths.status, "correct")
  if (resFourths.status === "correct") {
    assert.equal(resFourths.shares, 4)
    assert.deepEqual(resFourths.shareFractions, [0.25, 0.25, 0.25, 0.25])
    assert.equal(resFourths.verbalEquation, "4 fourths = 1 whole")
    assert.equal(resFourths.feedback, "Great job! You cut the brownies into 4 equal fourths!")
  }

  // 4. Out-of-order cuts must sort and still PASS
  const resUnsorted = evaluatePartition([0.75, 0.25, 0.5], SPEC_RECT_FOURTHS)
  assert.equal(resUnsorted.status, "correct")
})

test("NC.2.G.3 Invariant 2: Valid halves, thirds, and fourths for circles with angular wrap-around must PASS as correct", () => {
  // 1. Halves - Canonical [0, 180]
  const resHalves = evaluatePartition([0, 180], SPEC_CIRC_HALVES)
  assert.equal(resHalves.status, "correct")
  if (resHalves.status === "correct") {
    assert.equal(resHalves.shares, 2)
    assert.deepEqual(resHalves.shareFractions, [0.5, 0.5])
    assert.equal(resHalves.feedback, "Great job! You cut the pizza into 2 equal halves!")
  }

  // Halves - Rotated [45, 225]
  const resHalvesRot = evaluatePartition([45, 225], SPEC_CIRC_HALVES)
  assert.equal(resHalvesRot.status, "correct")
  if (resHalvesRot.status === "correct") {
    assert.deepEqual(resHalvesRot.shareFractions, [0.5, 0.5])
  }

  // Halves - Wrap-around [170, 350]
  const resHalvesWrap = evaluatePartition([170, 350], SPEC_CIRC_HALVES)
  assert.equal(resHalvesWrap.status, "correct")
  if (resHalvesWrap.status === "correct") {
    assert.deepEqual(resHalvesWrap.shareFractions, [0.5, 0.5])
  }

  // 2. Thirds - Canonical [0, 120, 240]
  const resThirds = evaluatePartition([0, 120, 240], SPEC_CIRC_THIRDS)
  assert.equal(resThirds.status, "correct")
  if (resThirds.status === "correct") {
    assert.equal(resThirds.shares, 3)
    assert.equal(resThirds.feedback, "Great job! You cut the fruit tart into 3 equal thirds!")
  }

  // Thirds - Rotated wrap-around [60, 180, 300]
  const resThirdsRot = evaluatePartition([60, 180, 300], SPEC_CIRC_THIRDS)
  assert.equal(resThirdsRot.status, "correct")

  // Thirds - Rotated cross-zero [110, 230, 350]
  const resThirdsCross = evaluatePartition([110, 230, 350], SPEC_CIRC_THIRDS)
  assert.equal(resThirdsCross.status, "correct")

  // 3. Fourths - Canonical [0, 90, 180, 270]
  const resFourths = evaluatePartition([0, 90, 180, 270], SPEC_CIRC_FOURTHS)
  assert.equal(resFourths.status, "correct")
  if (resFourths.status === "correct") {
    assert.equal(resFourths.shares, 4)
    assert.deepEqual(resFourths.shareFractions, [0.25, 0.25, 0.25, 0.25])
    assert.equal(resFourths.feedback, "Great job! You cut the berry pie into 4 equal fourths!")
  }

  // Fourths - Rotated [45, 135, 225, 315]
  const resFourthsRot = evaluatePartition([45, 135, 225, 315], SPEC_CIRC_FOURTHS)
  assert.equal(resFourthsRot.status, "correct")

  // Fourths - Rotated cross-zero [80, 170, 260, 350]
  const resFourthsWrap = evaluatePartition([80, 170, 260, 350], SPEC_CIRC_FOURTHS)
  assert.equal(resFourthsWrap.status, "correct")

  // Out-of-order circular spoke angles [240, 0, 120]
  const resUnsortedCirc = evaluatePartition([240, 0, 120], SPEC_CIRC_THIRDS)
  assert.equal(resUnsortedCirc.status, "correct")
})

test("NC.2.G.3 Invariant 3: Tolerance boundaries (+/- 5% absolute) must resolve correctly", () => {
  // Rectangular Halves: Target share = 0.50
  // Lower boundary: 0.50 - 0.05 = 0.45 (shares 0.45 and 0.55) -> PASS
  const resLowerBound = evaluatePartition([0.45], SPEC_RECT_HALVES)
  assert.equal(resLowerBound.status, "correct", "0.45 is within 5% tolerance")

  // Upper boundary: 0.50 + 0.05 = 0.55 (shares 0.55 and 0.45) -> PASS
  const resUpperBound = evaluatePartition([0.55], SPEC_RECT_HALVES)
  assert.equal(resUpperBound.status, "correct", "0.55 is within 5% tolerance")

  // Out of lower boundary: 0.44 (|0.44 - 0.50| = 0.06 > 0.05) -> FAIL
  const resBelowBound = evaluatePartition([0.44], SPEC_RECT_HALVES)
  assert.equal(resBelowBound.status, "unequal_shares", "0.44 is outside 5% tolerance")

  // Out of upper boundary: 0.56 (|0.56 - 0.50| = 0.06 > 0.05) -> FAIL
  const resAboveBound = evaluatePartition([0.56], SPEC_RECT_HALVES)
  assert.equal(resAboveBound.status, "unequal_shares", "0.56 is outside 5% tolerance")

  // Circular Halves: Target = 180 deg (5% of 360 is 18 deg)
  // Within bound: 180 + 18 = 198 deg -> PASS
  const resCircInBound = evaluatePartition([0, 198], SPEC_CIRC_HALVES)
  assert.equal(resCircInBound.status, "correct", "198 deg is within 5% angular tolerance")

  // Within bound: 180 - 18 = 162 deg -> PASS
  const resCircInBoundMinus = evaluatePartition([0, 162], SPEC_CIRC_HALVES)
  assert.equal(resCircInBoundMinus.status, "correct", "162 deg is within 5% angular tolerance")

  // Outside bound: 180 + 20 = 200 deg (20/360 = 5.56% > 5%) -> FAIL
  const resCircOutOfBound = evaluatePartition([0, 200], SPEC_CIRC_HALVES)
  assert.equal(
    resCircOutOfBound.status,
    "unequal_shares",
    "200 deg is outside 5% angular tolerance",
  )

  // Rectangular Fourths: Target share = 0.25 (tolerance [0.20, 0.30])
  // Boundary shares: [0.20, 0.25, 0.25, 0.30] -> PASS
  const resFourthsLimit = evaluatePartition([0.2, 0.45, 0.7], SPEC_RECT_FOURTHS)
  assert.equal(resFourthsLimit.status, "correct")

  // Exceeding tolerance: [0.19, 0.45, 0.70] (share 0 is 0.19, dev = 0.06) -> FAIL
  const resFourthsExceed = evaluatePartition([0.19, 0.45, 0.7], SPEC_RECT_FOURTHS)
  assert.equal(resFourthsExceed.status, "unequal_shares")
})

test("NC.2.G.3 Invariant 4: Unequal shares must FAIL as unequal_shares with accurate share ratios", () => {
  // Rectangle halves cut at 0.25 (shares: 0.25 and 0.75)
  const resRect = evaluatePartition([0.25], SPEC_RECT_HALVES)
  assert.equal(resRect.status, "unequal_shares")
  if (resRect.status === "unequal_shares") {
    assert.equal(resRect.shapeType, "rectangle")
    assert.equal(resRect.targetShares, 2)
    assert.equal(resRect.actualShares, 2)
    assert.equal(resRect.largestShareRatio, 0.75)
    assert.equal(resRect.smallestShareRatio, 0.25)
    assert.equal(
      resRect.feedback,
      "These pieces aren't equal yet! Slide the cutter to make each share the same size.",
    )
  }

  // Circle halves cut at [0, 90] (shares: 90/360 = 0.25 and 270/360 = 0.75)
  const resCirc = evaluatePartition([0, 90], SPEC_CIRC_HALVES)
  assert.equal(resCirc.status, "unequal_shares")
  if (resCirc.status === "unequal_shares") {
    assert.equal(resCirc.shapeType, "circle")
    assert.equal(resCirc.targetShares, 2)
    assert.equal(resCirc.actualShares, 2)
    assert.equal(resCirc.largestShareRatio, 0.75)
    assert.equal(resCirc.smallestShareRatio, 0.25)
    assert.equal(
      resCirc.feedback,
      "These pieces aren't equal yet! Slide the cutter to make each share the same size.",
    )
  }
})

test("NC.2.G.3 Invariant 5: Wrong share count must FAIL as wrong_share_count", () => {
  // Rectangle targetShares = 3, but only 1 cut provided (actualShares = 2)
  const resUnder = evaluatePartition([0.5], SPEC_RECT_THIRDS)
  assert.equal(resUnder.status, "wrong_share_count")
  if (resUnder.status === "wrong_share_count") {
    assert.equal(resUnder.shapeType, "rectangle")
    assert.equal(resUnder.actualShares, 2)
    assert.equal(resUnder.targetShares, 3)
    assert.equal(resUnder.feedback, "We need 3 equal shares! Select the [3 thirds] cutter.")
  }

  // Rectangle targetShares = 2, but 3 cuts provided (actualShares = 4)
  const resOver = evaluatePartition([0.25, 0.5, 0.75], SPEC_RECT_HALVES)
  assert.equal(resOver.status, "wrong_share_count")
  if (resOver.status === "wrong_share_count") {
    assert.equal(resOver.actualShares, 4)
    assert.equal(resOver.targetShares, 2)
    assert.equal(resOver.feedback, "We need 2 equal shares! Select the [2 halves] cutter.")
  }

  // Circle targetShares = 4, but only 2 cuts provided (actualShares = 2)
  const resCircUnder = evaluatePartition([0, 180], SPEC_CIRC_FOURTHS)
  assert.equal(resCircUnder.status, "wrong_share_count")
  if (resCircUnder.status === "wrong_share_count") {
    assert.equal(resCircUnder.shapeType, "circle")
    assert.equal(resCircUnder.actualShares, 2)
    assert.equal(resCircUnder.targetShares, 4)
    assert.equal(resCircUnder.feedback, "We need 4 equal shares! Select the [4 fourths] cutter.")
  }

  // Circle targetShares = 2, but 3 cuts provided (actualShares = 3)
  const resCircOver = evaluatePartition([0, 120, 240], SPEC_CIRC_HALVES)
  assert.equal(resCircOver.status, "wrong_share_count")
  if (resCircOver.status === "wrong_share_count") {
    assert.equal(resCircOver.actualShares, 3)
    assert.equal(resCircOver.targetShares, 2)
    assert.equal(resCircOver.feedback, "We need 2 equal shares! Select the [2 halves] cutter.")
  }
})

test("NC.2.G.3 Invariant 6: Empty/unpartitioned cuts must FAIL as unpartitioned", () => {
  // Rectangle halves with empty cuts
  const resRectHalves = evaluatePartition([], SPEC_RECT_HALVES)
  assert.equal(resRectHalves.status, "unpartitioned")
  assert.equal(
    resRectHalves.feedback,
    "Use the cutter to partition the brownies into 2 equal halves!",
  )

  // Circle thirds with empty cuts
  const resCircThirds = evaluatePartition([], SPEC_CIRC_THIRDS)
  assert.equal(resCircThirds.status, "unpartitioned")
  assert.equal(
    resCircThirds.feedback,
    "Use the cutter to partition the fruit tart into 3 equal thirds!",
  )

  // Fourths with empty cuts
  const resRectFourths = evaluatePartition([], SPEC_RECT_FOURTHS)
  assert.equal(resRectFourths.status, "unpartitioned")
  assert.equal(
    resRectFourths.feedback,
    "Use the cutter to partition the brownies into 4 equal fourths!",
  )
})

test("NC.2.G.3 Invariant 7: Adversarial Cut Fuzzing Matrix (200 Seeds) verifying zero NaN, crashes, or unhandled errors", () => {
  const specs = [
    SPEC_RECT_HALVES,
    SPEC_RECT_THIRDS,
    SPEC_RECT_FOURTHS,
    SPEC_CIRC_HALVES,
    SPEC_CIRC_THIRDS,
    SPEC_CIRC_FOURTHS,
  ]

  for (let seed = 1; seed <= 200; seed++) {
    const spec = specs[seed % specs.length]
    const cutCount = (seed * 7) % 9 // 0..8 cuts

    const cuts: number[] = []
    for (let c = 0; c < cutCount; c++) {
      // Deterministic pseudorandom generator introducing diverse adversarial inputs:
      // normal fractions, negative numbers, > 1, > 360, zeros, duplicates, NaN, Infinity
      const mode = (seed * 13 + c * 17) % 10
      if (mode === 0) {
        cuts.push(NaN)
      } else if (mode === 1) {
        cuts.push(Infinity)
      } else if (mode === 2) {
        cuts.push(-0.5)
      } else if (mode === 3) {
        cuts.push(0)
      } else if (mode === 4) {
        cuts.push(1.5)
      } else if (mode === 5) {
        cuts.push(720)
      } else {
        const val = ((seed * 31 + c * 43) % 1000) / 1000
        cuts.push(spec.shapeType === "circle" ? val * 360 : val)
      }
    }

    // Must execute cleanly without throwing
    const diag = evaluatePartition(cuts, spec)

    assert.ok(diag, `Seed ${seed}: Diagnostic must be defined`)
    assert.ok(
      ["correct", "unequal_shares", "wrong_share_count", "unpartitioned"].includes(diag.status),
      `Seed ${seed}: Status must be valid, got ${diag.status}`,
    )
    assert.ok(
      typeof diag.feedback === "string" && diag.feedback.length > 0,
      `Seed ${seed}: Feedback must be a non-empty string`,
    )
    assert.ok(!diag.feedback.includes("NaN"), `Seed ${seed}: Feedback must never contain NaN`)
    assert.ok(
      !diag.feedback.includes("undefined"),
      `Seed ${seed}: Feedback must never contain undefined`,
    )

    if (diag.status === "correct") {
      assert.equal(diag.shares, spec.targetShares, `Seed ${seed}: Correct shares must match target`)
      assert.equal(
        diag.shareFractions.length,
        spec.targetShares,
        `Seed ${seed}: Share fractions count must match target`,
      )
      assert.ok(
        diag.shareFractions.every(
          (f) => typeof f === "number" && Number.isFinite(f) && !Number.isNaN(f),
        ),
        `Seed ${seed}: Share fractions must all be finite numbers without NaN`,
      )
      const sum = diag.shareFractions.reduce((acc, v) => acc + v, 0)
      assert.ok(
        Math.abs(sum - 1.0) < 1e-4,
        `Seed ${seed}: Share fractions must sum to 1.0 (got ${sum})`,
      )
    } else if (diag.status === "unequal_shares") {
      assert.ok(
        typeof diag.largestShareRatio === "number" &&
          Number.isFinite(diag.largestShareRatio) &&
          !Number.isNaN(diag.largestShareRatio),
        `Seed ${seed}: largestShareRatio must be a valid finite number`,
      )
      assert.ok(
        typeof diag.smallestShareRatio === "number" &&
          Number.isFinite(diag.smallestShareRatio) &&
          !Number.isNaN(diag.smallestShareRatio),
        `Seed ${seed}: smallestShareRatio must be a valid finite number`,
      )
      assert.ok(
        diag.largestShareRatio >= diag.smallestShareRatio,
        `Seed ${seed}: largestShareRatio (${diag.largestShareRatio}) must be >= smallestShareRatio (${diag.smallestShareRatio})`,
      )
    } else if (diag.status === "wrong_share_count") {
      assert.ok(
        typeof diag.actualShares === "number" && Number.isInteger(diag.actualShares),
        `Seed ${seed}: actualShares must be an integer`,
      )
      assert.notEqual(
        diag.actualShares,
        spec.targetShares,
        `Seed ${seed}: actualShares must differ from targetShares`,
      )
    }
  }
})

test("NC.2.G.3 Invariant 8: demonstrateGeometryStep produces canonical partition cuts for all 8 NC2_G_SEEDS and evaluates as correct", () => {
  assert.equal(NC2_G_SEEDS.length, 8)
  for (const seed of NC2_G_SEEDS) {
    const demoCuts = demonstrateGeometryStep(seed)
    assert.ok(Array.isArray(demoCuts), `Seed ${seed.id}: demoCuts must be an array`)

    const expectedCutCount =
      seed.shapeType === "rectangle" ? seed.targetShares - 1 : seed.targetShares
    assert.equal(
      demoCuts.length,
      expectedCutCount,
      `Seed ${seed.id}: expected ${expectedCutCount} cuts, got ${demoCuts.length}`,
    )

    if (seed.shapeType === "rectangle") {
      if (seed.targetShares === 2) {
        assert.deepEqual(demoCuts, [0.5])
      } else if (seed.targetShares === 3) {
        assert.deepEqual(demoCuts, [1 / 3, 2 / 3])
      } else if (seed.targetShares === 4) {
        assert.deepEqual(demoCuts, [0.25, 0.5, 0.75])
      }
    } else {
      if (seed.targetShares === 2) {
        assert.deepEqual(demoCuts, [0, 180])
      } else if (seed.targetShares === 3) {
        assert.deepEqual(demoCuts, [0, 120, 240])
      } else if (seed.targetShares === 4) {
        assert.deepEqual(demoCuts, [0, 90, 180, 270])
      }
    }

    const res = evaluatePartition(demoCuts, seed)
    assert.equal(
      res.status,
      "correct",
      `Seed ${seed.id} demonstration failed evaluation: ${res.feedback}`,
    )
    if (res.status === "correct") {
      assert.equal(res.shares, seed.targetShares)
      assert.equal(res.shapeType, seed.shapeType)
    }
  }
})

test("NC.2.G.3 Invariant 9: getIsomorphicGeometrySpec preserves targetShares across all seeds and prefers alternate shapeType", () => {
  assert.equal(NC2_G_SEEDS.length, 8)
  for (const seed of NC2_G_SEEDS) {
    const iso = getIsomorphicGeometrySpec(seed, NC2_G_SEEDS)
    assert.ok(iso, `Seed ${seed.id}: isomorphic spec must be defined`)
    assert.notEqual(iso.id, seed.id, `Seed ${seed.id}: isomorphic must have different id`)
    assert.equal(
      iso.targetShares,
      seed.targetShares,
      `Seed ${seed.id}: targetShares must be preserved (expected ${seed.targetShares}, got ${iso.targetShares})`,
    )
    assert.equal(iso.standard, "NC.2.G.3")

    // Verify alternate shapeType preference
    const expectedAlternateShape = seed.shapeType === "rectangle" ? "circle" : "rectangle"
    assert.equal(
      iso.shapeType,
      expectedAlternateShape,
      `Seed ${seed.id}: expected isomorphic shapeType to be ${expectedAlternateShape}, got ${iso.shapeType}`,
    )
  }

  // Also verify fallback when pool contains only same shapeType or single item
  const rectPool = NC2_G_SEEDS.filter((s) => s.shapeType === "rectangle")
  const brownies = NC2_G_SEEDS.find((s) => s.id === "nc2-g-halves-brownies")!
  const isoFallback = getIsomorphicGeometrySpec(brownies, rectPool)
  assert.equal(isoFallback.targetShares, 2)
  assert.equal(isoFallback.id, "nc2-g-halves-cornbread")

  const singlePool = [brownies]
  const isoSingle = getIsomorphicGeometrySpec(brownies, singlePool)
  assert.equal(isoSingle.id, brownies.id)
})

test("NC.2.G.3 Invariant 10: 3-Tier Progressive Scaffolding Ladder Progression Logic", () => {
  const spec = NC2_G_SEEDS[0] // brownies: rectangle, 2 halves
  assert.equal(spec.targetShares, 2)
  assert.equal(spec.shapeType, "rectangle")

  let failureCount = 0
  let tier: 0 | 1 | 2 | 3 = 0
  let isGhostVisible = false
  let wasDemonstrated = false
  let masteryEligible = true
  let status: string = "constructing"

  // Attempt 1: student checks unequal cut (0.25) -> fail
  const diag1 = evaluatePartition([0.25], spec)
  assert.equal(diag1.status, "unequal_shares")

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
  assert.match(diag1.feedback, /not equal yet|Slide the cutter/i)

  // State Mutation Guard: student moves cutter -> returns to constructing
  status = "constructing"
  assert.equal(status, "constructing")

  // Attempt 2: second unequal cut (0.35) -> fail
  const diag2 = evaluatePartition([0.35], spec)
  assert.equal(diag2.status, "unequal_shares")

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

  // State Mutation Guard in Tier 2: student adjusts cutter, ghost remains visible
  status = "constructing"
  assert.equal(status, "constructing")
  assert.equal(isGhostVisible, true)

  // Attempt 3: third failure or ask for help -> escalates to Tier 3 demonstration
  failureCount++
  let demonstratedCuts: number[] = []
  if (failureCount >= 3) {
    tier = 3
    status = "tier3_demonstrate"
    wasDemonstrated = true
    masteryEligible = false
    demonstratedCuts = demonstrateGeometryStep(spec)
  }

  assert.equal(failureCount, 3)
  assert.equal(tier, 3)
  assert.equal(status, "tier3_demonstrate")
  assert.equal(wasDemonstrated, true)
  assert.equal(masteryEligible, false)
  assert.deepEqual(demonstratedCuts, [0.5])

  const demoDiag = evaluatePartition(demonstratedCuts, spec)
  assert.equal(demoDiag.status, "correct")

  // Isomorphic retry: resets ladder and provides isomorphic problem
  const nextSpec = getIsomorphicGeometrySpec(spec, NC2_G_SEEDS)
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
  assert.equal(nextSpec.targetShares, spec.targetShares)
  assert.notEqual(nextSpec.id, spec.id)
  assert.equal(nextSpec.shapeType, "circle")
})
