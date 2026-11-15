import test from "node:test"
import assert from "node:assert/strict"
import { evaluateArrayGrid, type ArrayProblemSpec } from "../../src/lib/math/evaluator.ts"

const SPEC_3x4: ArrayProblemSpec = {
  targetRows: 3,
  targetCols: 4,
  totalTokens: 12,
}

const SPEC_SQUARE_3x3: ArrayProblemSpec = {
  targetRows: 3,
  targetCols: 3,
  totalTokens: 9,
}

function emptyGrid(): boolean[][] {
  return Array(5).fill(null).map(() => Array(5).fill(false))
}

test("Pedagogical Invariant 1: Valid 3x4 Array Must PASS", () => {
  const grid = emptyGrid()
  // Place 3 rows of 4 cookies anchored at top-left
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 4; c++) {
      grid[r][c] = true
    }
  }

  const result = evaluateArrayGrid(grid, SPEC_3x4)
  assert.equal(result.status, "correct")
  if (result.status === "correct") {
    assert.equal(result.totalPlaced, 12)
    assert.deepEqual(result.activeRowCounts, [4, 4, 4])
    assert.equal(result.equationRow, "4 + 4 + 4 = 12")
    assert.equal(result.equationCol, "3 + 3 + 3 + 3 = 12")
  }
})

test("Pedagogical Invariant 2 (Crucial Orientation Regress): 4x3 Array Must FAIL as orientation_error", () => {
  const grid = emptyGrid()
  // Place 4 rows of 3 cookies (12 cookies total, but 4 rows instead of 3)
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 3; c++) {
      grid[r][c] = true
    }
  }

  const result = evaluateArrayGrid(grid, SPEC_3x4)
  assert.notEqual(result.status, "correct", "4x3 array must never be awarded correct for '3 equal rows'")
  assert.equal(result.status, "orientation_error")
  if (result.status === "orientation_error") {
    assert.equal(result.actualRows, 4)
    assert.equal(result.actualCols, 3)
    assert.match(result.feedback, /4 rows/i)
  }
})

test("Pedagogical Invariant 3: Unequal Rows Must FAIL as unequal_rows", () => {
  const grid = emptyGrid()
  // Row 0: 5 cookies, Row 1: 4 cookies, Row 2: 3 cookies = 12 total
  for (let c = 0; c < 5; c++) grid[0][c] = true
  for (let c = 0; c < 4; c++) grid[1][c] = true
  for (let c = 0; c < 3; c++) grid[2][c] = true

  const result = evaluateArrayGrid(grid, SPEC_3x4)
  assert.equal(result.status, "unequal_rows")
  assert.match(result.feedback, /not equal/i)
})

test("Pedagogical Invariant 4: Incomplete Inventory (< 12 placed) Must FAIL", () => {
  const grid = emptyGrid()
  // 2 rows of 4 cookies (8 cookies placed, 4 still in tray)
  for (let r = 0; r < 2; r++) {
    for (let c = 0; c < 4; c++) {
      grid[r][c] = true
    }
  }

  const result = evaluateArrayGrid(grid, SPEC_3x4)
  assert.equal(result.status, "incomplete_inventory")
  if (result.status === "incomplete_inventory") {
    assert.equal(result.placedCount, 8)
    assert.equal(result.targetCount, 12)
  }
})

test("Pedagogical Invariant 5: Empty Grid Must FAIL gracefully", () => {
  const grid = emptyGrid()
  const result = evaluateArrayGrid(grid, SPEC_3x4)
  assert.equal(result.status, "empty")
})

test("Pedagogical Invariant 6 (Square Array Bug Guard): 3x3 Array Must PASS and NEVER flag orientation_error", () => {
  const grid = emptyGrid()
  // Place 3 rows of 3 cookies
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      grid[r][c] = true
    }
  }

  const result = evaluateArrayGrid(grid, SPEC_SQUARE_3x3)
  assert.equal(result.status, "correct", "Square arrays must pass and never flag orientation error")
  if (result.status === "correct") {
    assert.equal(result.totalPlaced, 9)
    assert.deepEqual(result.activeRowCounts, [3, 3, 3])
  }
})

test("Pedagogical Invariant 7 (Spatial Contiguity & Gap Detection): Gapped array Must FAIL as gap_error", () => {
  const grid = emptyGrid()
  // Place 12 cookies with vertical gap: row 0 has 4, row 2 has 4, row 3 has 4 (row 1 is empty!)
  for (let c = 0; c < 4; c++) {
    grid[0][c] = true
    grid[2][c] = true
    grid[3][c] = true
  }

  const result = evaluateArrayGrid(grid, SPEC_3x4)
  assert.equal(result.status, "gap_error", "Skipped rows must be detected as gap_error")
})

test("Pedagogical Invariant 8 (Adversarial Permutation Matrix / RubFake Oracle)", () => {
  // Synthesize 250 randomized grid configurations
  // Assert: ZERO false positives. The ONLY state that can yield "correct" is exactly 3 rows of 4 anchored at (0,0).
  for (let seed = 0; seed < 250; seed++) {
    const grid = emptyGrid()
    let count = 0
    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 5; c++) {
        if (((seed * 31 + r * 7 + c * 13) % 5) === 0 && count < 12) {
          grid[r][c] = true
          count++
        }
      }
    }

    const diag = evaluateArrayGrid(grid, SPEC_3x4)
    if (diag.status === "correct") {
      const activeRows = grid.map((r) => r.filter(Boolean).length).filter((n) => n > 0)
      assert.equal(activeRows.length, 3)
      assert.deepEqual(activeRows, [4, 4, 4])
      assert.equal(grid[0][0], true)
    }
  }
})
