import test from "node:test"
import assert from "node:assert/strict"
import {
  validateNC2OA3Item,
  validateNC2OA4Item,
  validateNC2GItem,
  assertValidNC2GItem,
  validateCurriculumBatch,
} from "../../src/curriculum/invariants.ts"
import { NC2_OA3_SEEDS } from "../../src/curriculum/items/nc2-oa3.ts"
import { NC2_OA4_SEEDS } from "../../src/curriculum/items/nc2-oa4.ts"
import { NC2_G_SEEDS } from "../../src/curriculum/items/nc2-g.ts"
import {
  evaluateArrayGrid,
  evaluatePairingMat,
  type PairingSlot,
} from "../../src/lib/math/evaluator.ts"
import { evaluatePartition } from "../../src/lib/math/geometry-evaluator.ts"

test("Curriculum Invariant 1: All NC.2.OA.3 problem seeds strictly pass standard validation", () => {
  assert.equal(NC2_OA3_SEEDS.length, 8)

  const expectedTotals = [7, 8, 11, 12, 15, 16, 19, 20]
  const expectedContexts = [
    "acorns",
    "carrots",
    "blueberries",
    "shells",
    "buttons",
    "seeds",
    "beads",
    "gems",
  ]

  NC2_OA3_SEEDS.forEach((seed, idx) => {
    assert.equal(seed.totalTokens, expectedTotals[idx])
    assert.equal(seed.context, expectedContexts[idx])

    const res = validateNC2OA3Item(seed)
    assert.equal(res.valid, true, `Seed ${seed.id} failed validation: ${res.errors.join(", ")}`)
    assert.equal(res.errors.length, 0)

    // Mathematical Invariants
    assert.equal(seed.expectedPairs, Math.floor(seed.totalTokens / 2))
    assert.equal(seed.leftover, seed.totalTokens % 2)
    assert.equal(seed.isEven, seed.totalTokens % 2 === 0)
    assert.ok(seed.narrative.length > 10)
  })

  const batch = validateCurriculumBatch([...NC2_OA3_SEEDS], validateNC2OA3Item)
  assert.equal(batch.valid, true)
  assert.equal(batch.failures.length, 0)
  assert.equal(batch.total, 8)
})

test("Curriculum Invariant 2: All NC.2.OA.4 problem seeds strictly pass standard validation", () => {
  assert.equal(NC2_OA4_SEEDS.length, 7)

  const expectedConfigs = [
    { rows: 3, cols: 4, total: 12, context: "cookies" },
    { rows: 2, cols: 5, total: 10, context: "muffins" },
    { rows: 3, cols: 5, total: 15, context: "tiles" },
    { rows: 2, cols: 4, total: 8, context: "stamps" },
    { rows: 3, cols: 3, total: 9, context: "biscuits" },
    { rows: 4, cols: 3, total: 12, context: "brownies" },
    { rows: 4, cols: 2, total: 8, context: "crackers" },
  ]

  NC2_OA4_SEEDS.forEach((seed, idx) => {
    const exp = expectedConfigs[idx]
    assert.equal(seed.targetRows, exp.rows)
    assert.equal(seed.targetCols, exp.cols)
    assert.equal(seed.totalTokens, exp.total)
    assert.equal(seed.context, exp.context)

    const res = validateNC2OA4Item(seed)
    assert.equal(res.valid, true, `Seed ${seed.id} failed validation: ${res.errors.join(", ")}`)
    assert.equal(res.errors.length, 0)

    // Standard Bounds Invariants (up to 5x5)
    assert.ok(seed.targetRows >= 1 && seed.targetRows <= 5)
    assert.ok(seed.targetCols >= 1 && seed.targetCols <= 5)
    assert.equal(seed.totalTokens, seed.targetRows * seed.targetCols)
    assert.ok(seed.narrative.length > 10)
  })

  const batch = validateCurriculumBatch([...NC2_OA4_SEEDS], validateNC2OA4Item)
  assert.equal(batch.valid, true)
  assert.equal(batch.failures.length, 0)
  assert.equal(batch.total, 7)
})

test("Curriculum Invariant 3: NC.2.OA.3 bounds validator catches out-of-range, invalid parity, and structural errors", () => {
  // Exceeds 20 tokens
  const over20 = validateNC2OA3Item({
    id: "invalid-over-20",
    standard: "NC.2.OA.3",
    label: "21 Acorns",
    totalTokens: 21,
    context: "acorns",
    narrative: "21 acorns is over standard bounds.",
    strategy: "pairing",
    expectedPairs: 10,
    leftover: 1,
    isEven: false,
    equation: "10 + 10 + 1 = 21",
  })
  assert.equal(over20.valid, false)
  assert.ok(over20.errors.some((e) => e.includes("between 1 and 20")))

  // 0 tokens
  const zeroTokens = validateNC2OA3Item({
    id: "invalid-0",
    standard: "NC.2.OA.3",
    label: "0 Acorns",
    totalTokens: 0,
    context: "acorns",
    narrative: "0 acorns.",
    strategy: "pairing",
    expectedPairs: 0,
    leftover: 0,
    isEven: true,
    equation: "0 + 0 = 0",
  })
  assert.equal(zeroTokens.valid, false)
  assert.ok(zeroTokens.errors.some((e) => e.includes("between 1 and 20")))

  // Wrong parity calculation
  const wrongParity = validateNC2OA3Item({
    id: "wrong-math",
    standard: "NC.2.OA.3",
    label: "7 Acorns",
    totalTokens: 7,
    context: "acorns",
    narrative: "Testing wrong math.",
    strategy: "pairing",
    expectedPairs: 4, // Wrong! Should be 3
    leftover: 0, // Wrong! Should be 1
    isEven: true, // Wrong! Should be false
    equation: "4 + 4 = 7", // Wrong equation!
  })
  assert.equal(wrongParity.valid, false)
  assert.ok(wrongParity.errors.length >= 3)

  // Non-object or missing standard
  assert.equal(validateNC2OA3Item(null).valid, false)
  assert.equal(validateNC2OA3Item(undefined).valid, false)
  assert.equal(validateNC2OA3Item({ standard: "NC.2.OA.4" } as unknown).valid, false)
})

test("Curriculum Invariant 4: NC.2.OA.4 bounds validator catches dimensions > 5, token mismatches, and equation errors", () => {
  // Exceeds 5 rows
  const over5Rows = validateNC2OA4Item({
    id: "invalid-6x4",
    standard: "NC.2.OA.4",
    label: "6x4 Array",
    targetRows: 6,
    targetCols: 4,
    totalTokens: 24,
    context: "cookies",
    narrative: "6 rows is out of bounds.",
    repeatedAdditionEquation: "4 + 4 + 4 + 4 + 4 + 4 = 24",
    equationRow: "4 + 4 + 4 + 4 + 4 + 4 = 24",
    equationCol: "6 + 6 + 6 + 6 = 24",
  })
  assert.equal(over5Rows.valid, false)
  assert.ok(over5Rows.errors.some((e) => e.includes("targetRows must be between 1 and 5")))

  // Exceeds 5 cols
  const over5Cols = validateNC2OA4Item({
    id: "invalid-3x6",
    standard: "NC.2.OA.4",
    label: "3x6 Array",
    targetRows: 3,
    targetCols: 6,
    totalTokens: 18,
    context: "cookies",
    narrative: "6 cols is out of bounds.",
    repeatedAdditionEquation: "6 + 6 + 6 = 18",
    equationRow: "6 + 6 + 6 = 18",
    equationCol: "3 + 3 + 3 + 3 + 3 + 3 = 18",
  })
  assert.equal(over5Cols.valid, false)
  assert.ok(over5Cols.errors.some((e) => e.includes("targetCols must be between 1 and 5")))

  // Total tokens mismatch
  const mismatchTotal = validateNC2OA4Item({
    id: "invalid-mismatch",
    standard: "NC.2.OA.4",
    label: "3x4 Array",
    targetRows: 3,
    targetCols: 4,
    totalTokens: 15, // Wrong! 3 * 4 = 12
    context: "cookies",
    narrative: "Wrong total tokens.",
    repeatedAdditionEquation: "4 + 4 + 4 = 12",
    equationRow: "4 + 4 + 4 = 12",
    equationCol: "3 + 3 + 3 + 3 = 12",
  })
  assert.equal(mismatchTotal.valid, false)
  assert.ok(
    mismatchTotal.errors.some((e) => e.includes("totalTokens must equal targetRows * targetCols")),
  )
})

test("Curriculum Invariant 5: Seamless integration with Mathematical Evaluator for all NC.2.OA.4 seeds", () => {
  for (const item of NC2_OA4_SEEDS) {
    // Construct 5x5 grid containing exactly targetRows x targetCols placed items
    const grid: boolean[][] = Array(5)
      .fill(null)
      .map(() => Array(5).fill(false))

    for (let r = 0; r < item.targetRows; r++) {
      for (let c = 0; c < item.targetCols; c++) {
        grid[r][c] = true
      }
    }

    const diag = evaluateArrayGrid(grid, {
      targetRows: item.targetRows,
      targetCols: item.targetCols,
      totalTokens: item.totalTokens,
    })

    assert.equal(
      diag.status,
      "correct",
      `Expected seed ${item.id} (${item.targetRows}x${item.targetCols}) to evaluate as correct`,
    )
    if (diag.status === "correct") {
      assert.equal(diag.equationRow, item.equationRow)
      assert.equal(diag.equationCol, item.equationCol)
      assert.equal(diag.totalPlaced, item.totalTokens)
    }
  }
})

test("Curriculum Invariant 6: Seamless integration with Mathematical Evaluator for all NC.2.OA.3 seeds", () => {
  for (const item of NC2_OA3_SEEDS) {
    // Construct 10 PairingSlots
    const slots: PairingSlot[] = Array(10)
      .fill(null)
      .map(() => ({ left: false, right: false }))

    let placed = 0
    for (let r = 0; r < 10 && placed < item.totalTokens; r++) {
      slots[r].left = true
      placed++
      if (placed < item.totalTokens) {
        slots[r].right = true
        placed++
      }
    }

    const diag = evaluatePairingMat(slots, {
      totalTokens: item.totalTokens,
      strategy: item.strategy,
    })

    if (item.isEven) {
      assert.equal(
        diag.status,
        "correct_even",
        `Expected ${item.id} (${item.totalTokens}) to evaluate as correct_even`,
      )
      if (diag.status === "correct_even") {
        assert.equal(diag.pairs, item.expectedPairs)
        assert.equal(diag.equation, item.equation)
      }
    } else {
      assert.equal(
        diag.status,
        "correct_odd",
        `Expected ${item.id} (${item.totalTokens}) to evaluate as correct_odd`,
      )
      if (diag.status === "correct_odd") {
        assert.equal(diag.pairs, item.expectedPairs)
        assert.equal(diag.leftover, item.leftover)
        assert.equal(diag.equation, item.equation)
      }
    }
  }
})

test("Curriculum Invariant 7: All NC.2.G.3 problem seeds strictly pass standard validation", () => {
  assert.equal(NC2_G_SEEDS.length, 8)

  const rectangles = NC2_G_SEEDS.filter((s) => s.shapeType === "rectangle")
  const circles = NC2_G_SEEDS.filter((s) => s.shapeType === "circle")
  assert.equal(rectangles.length, 4)
  assert.equal(circles.length, 4)

  const expectedSeeds = [
    {
      id: "nc2-g-halves-brownies",
      shapeType: "rectangle",
      shares: 2,
      verbal: "halves",
      context: "brownies",
      icon: "🍫",
    },
    {
      id: "nc2-g-thirds-cake",
      shapeType: "rectangle",
      shares: 3,
      verbal: "thirds",
      context: "sheet cake",
      icon: "🍰",
    },
    {
      id: "nc2-g-fourths-sheet",
      shapeType: "rectangle",
      shares: 4,
      verbal: "fourths",
      context: "brownies",
      icon: "🍫",
    },
    {
      id: "nc2-g-halves-cornbread",
      shapeType: "rectangle",
      shares: 2,
      verbal: "halves",
      context: "cornbread",
      icon: "🍞",
    },
    {
      id: "nc2-g-halves-pizza",
      shapeType: "circle",
      shares: 2,
      verbal: "halves",
      context: "pizza",
      icon: "🍕",
    },
    {
      id: "nc2-g-thirds-tart",
      shapeType: "circle",
      shares: 3,
      verbal: "thirds",
      context: "fruit tart",
      icon: "🥧",
    },
    {
      id: "nc2-g-fourths-pie",
      shapeType: "circle",
      shares: 4,
      verbal: "fourths",
      context: "berry pie",
      icon: "🫐",
    },
    {
      id: "nc2-g-fourths-cookie",
      shapeType: "circle",
      shares: 4,
      verbal: "fourths",
      context: "giant cookie",
      icon: "🍪",
    },
  ]

  NC2_G_SEEDS.forEach((seed, idx) => {
    const exp = expectedSeeds[idx]
    assert.equal(seed.id, exp.id)
    assert.equal(seed.standard, "NC.2.G.3")
    assert.equal(seed.shapeType, exp.shapeType)
    assert.equal(seed.targetShares, exp.shares)
    assert.equal(seed.verbalShareName, exp.verbal)
    assert.equal(seed.context, exp.context)
    assert.equal(seed.icon, exp.icon)
    assert.equal(seed.equation, `${exp.shares} ${exp.verbal} = 1 whole`)
    assert.ok(seed.narrative.length >= 10)

    const res = validateNC2GItem(seed)
    assert.equal(res.valid, true, `Seed ${seed.id} failed validation: ${res.errors.join(", ")}`)
    assert.equal(res.errors.length, 0)

    assert.doesNotThrow(() => assertValidNC2GItem(seed))
  })

  const batch = validateCurriculumBatch([...NC2_G_SEEDS], validateNC2GItem)
  assert.equal(batch.valid, true)
  assert.equal(batch.failures.length, 0)
  assert.equal(batch.total, 8)
})

test("Curriculum Invariant 8: NC.2.G.3 bounds validator catches invalid shares (< 2, > 4), wrong standard, short narrative, non-matching verbal names, non-object", () => {
  // Invalid shares < 2 (e.g. 1)
  const underShares = validateNC2GItem({
    id: "invalid-under-shares",
    standard: "NC.2.G.3",
    label: "1 Whole",
    shapeType: "rectangle",
    targetShares: 1,
    context: "brownies",
    narrative: "Cut the pan into 1 whole piece.",
    verbalShareName: "halves",
    equation: "1 halves = 1 whole",
  })
  assert.equal(underShares.valid, false)
  assert.ok(underShares.errors.some((e) => e.includes("targetShares must be 2, 3, or 4")))

  // Invalid shares > 4 (e.g. 5)
  const overShares = validateNC2GItem({
    id: "invalid-over-shares",
    standard: "NC.2.G.3",
    label: "5 Fifths",
    shapeType: "circle",
    targetShares: 5,
    context: "pizza",
    narrative: "Cut the pizza into 5 equal fifths.",
    verbalShareName: "fourths",
    equation: "5 fourths = 1 whole",
  })
  assert.equal(overShares.valid, false)
  assert.ok(overShares.errors.some((e) => e.includes("targetShares must be 2, 3, or 4")))

  // Wrong standard (not NC.2.G.3)
  const wrongStandard = validateNC2GItem({
    id: "wrong-standard",
    standard: "NC.2.OA.4",
    label: "Wrong Standard",
    shapeType: "rectangle",
    targetShares: 2,
    context: "brownies",
    narrative: "This item has the wrong standard string.",
    verbalShareName: "halves",
    equation: "2 halves = 1 whole",
  })
  assert.equal(wrongStandard.valid, false)
  assert.ok(wrongStandard.errors.some((e) => e.includes("Standard must be 'NC.2.G.3'")))

  // Short narrative (< 10 chars)
  const shortNarrative = validateNC2GItem({
    id: "short-narrative",
    standard: "NC.2.G.3",
    label: "Short Narrative",
    shapeType: "rectangle",
    targetShares: 2,
    context: "brownies",
    narrative: "Short",
    verbalShareName: "halves",
    equation: "2 halves = 1 whole",
  })
  assert.equal(shortNarrative.valid, false)
  assert.ok(shortNarrative.errors.some((e) => e.includes("narrative") && e.includes("10")))

  // Non-matching verbal names (targetShares 3 with verbalShareName 'halves')
  const mismatchVerbal = validateNC2GItem({
    id: "mismatch-verbal",
    standard: "NC.2.G.3",
    label: "Mismatch Verbal",
    shapeType: "circle",
    targetShares: 3,
    context: "fruit tart",
    narrative: "Divide the fruit tart into 3 equal thirds.",
    verbalShareName: "halves", // Should be thirds
    equation: "3 halves = 1 whole",
  })
  assert.equal(mismatchVerbal.valid, false)
  assert.ok(mismatchVerbal.errors.some((e) => e.includes("verbalShareName must be 'thirds'")))

  // Non-matching equation
  const mismatchEquation = validateNC2GItem({
    id: "mismatch-equation",
    standard: "NC.2.G.3",
    label: "Mismatch Equation",
    shapeType: "rectangle",
    targetShares: 2,
    context: "brownies",
    narrative: "Cut the brownies into 2 equal halves.",
    verbalShareName: "halves",
    equation: "2 halves = 2 wholes", // Wrong!
  })
  assert.equal(mismatchEquation.valid, false)
  assert.ok(
    mismatchEquation.errors.some((e) => e.includes("equation must be '2 halves = 1 whole'")),
  )

  // Invalid shapeType
  const invalidShape = validateNC2GItem({
    id: "invalid-shape",
    standard: "NC.2.G.3",
    label: "Triangle",
    shapeType: "triangle" as any,
    targetShares: 2,
    context: "brownies",
    narrative: "Cut triangle into 2 equal halves.",
    verbalShareName: "halves",
    equation: "2 halves = 1 whole",
  })
  assert.equal(invalidShape.valid, false)
  assert.ok(
    invalidShape.errors.some((e) => e.includes("shapeType must be 'rectangle' or 'circle'")),
  )

  // Non-object / null / undefined / primitive
  assert.equal(validateNC2GItem(null).valid, false)
  assert.equal(validateNC2GItem(undefined).valid, false)
  assert.equal(validateNC2GItem("string").valid, false)
  assert.equal(validateNC2GItem(123).valid, false)
  assert.throws(() => assertValidNC2GItem(null), /NC2GItem Validation Error/)
})

test("Curriculum Invariant 9: Functional compatibility with Mathematical Evaluator for all NC.2.G.3 seeds", () => {
  for (const item of NC2_G_SEEDS) {
    const k = item.targetShares
    let cuts: number[]

    if (item.shapeType === "rectangle") {
      // k shares require k - 1 internal dividers: [1/k, ..., (k-1)/k]
      cuts = Array.from({ length: k - 1 }, (_, i) => (i + 1) / k)
    } else {
      // k circular shares require k radial spokes: [0, 360/k, ..., 360*(k-1)/k]
      cuts = Array.from({ length: k }, (_, i) => (360 / k) * i)
    }

    const diag = evaluatePartition(cuts, item)

    assert.equal(
      diag.status,
      "correct",
      `Expected seed ${item.id} (${item.shapeType}, ${item.targetShares} shares) to evaluate as correct`,
    )
    if (diag.status === "correct") {
      assert.equal(diag.shares, item.targetShares)
      assert.equal(diag.shapeType, item.shapeType)
      assert.equal(diag.verbalEquation, item.equation)
      assert.equal(diag.shareFractions.length, item.targetShares)
      for (const fraction of diag.shareFractions) {
        assert.ok(
          Math.abs(fraction - 1 / k) <= 0.05,
          `Share fraction ${fraction} should match 1/${k}`,
        )
      }
    }
  }
})
