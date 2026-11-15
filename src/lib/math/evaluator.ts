/**
 * Headless Mathematical & Pedagogical Diagnostic Evaluator for NC.2.OA Standards.
 * Pure functions: decoupled from React DOM to allow fast, deterministic invariant testing.
 */

// ============================================================================
// NC.2.OA.4: Rectangular Arrays (up to 5x5)
// ============================================================================

export interface ArrayProblemSpec {
  targetRows: number
  targetCols: number
  totalTokens: number
}

export type ArrayDiagnostic =
  | {
      status: "correct"
      equationRow: string
      equationCol: string
      activeRowCounts: number[]
      activeColCounts: number[]
      totalPlaced: number
      feedback: string
    }
  | {
      status: "orientation_error"
      actualRows: number
      actualCols: number
      activeRowCounts: number[]
      totalPlaced: number
      feedback: string
    }
  | {
      status: "unequal_rows"
      rowCounts: number[]
      totalPlaced: number
      feedback: string
    }
  | {
      status: "wrong_row_count"
      actualRows: number
      targetRows: number
      totalPlaced: number
      feedback: string
    }
  | {
      status: "gap_error"
      feedback: string
    }
  | {
      status: "incomplete_inventory"
      placedCount: number
      targetCount: number
      feedback: string
    }
  | {
      status: "empty"
      feedback: string
    }

export function evaluateArrayGrid(grid: boolean[][], spec: ArrayProblemSpec): ArrayDiagnostic {
  // 1. Calculate total placed tokens
  const totalPlaced = grid.flat().filter(Boolean).length

  if (totalPlaced === 0) {
    return {
      status: "empty",
      feedback: "Tap a cookie from the tray to place it on the graph paper!",
    }
  }

  if (totalPlaced !== spec.totalTokens) {
    return {
      status: "incomplete_inventory",
      placedCount: totalPlaced,
      targetCount: spec.totalTokens,
      feedback: `You've placed ${totalPlaced} cookies on the paper. We need all ${spec.totalTokens} cookies to make ${spec.targetRows} equal rows! Check your tray.`,
    }
  }

  const rowCounts = grid.map((r) => r.filter(Boolean).length)
  const populatedRowIndices = rowCounts
    .map((count, idx) => (count > 0 ? idx : -1))
    .filter((idx) => idx !== -1)
  const activeRowCounts = populatedRowIndices.map((idx) => rowCounts[idx])

  // 2. Spatial Contiguity Check
  // A. Vertical contiguity: populated rows must start at row 0 and be contiguous without skipped rows
  for (let i = 0; i < populatedRowIndices.length; i++) {
    if (populatedRowIndices[i] !== i) {
      return {
        status: "gap_error",
        feedback:
          "Keep your rows together starting from the top row without empty rows in between!",
      }
    }
  }

  // B. Horizontal contiguity: cookies in each row must be packed from column 0 without gaps
  for (let r = 0; r < populatedRowIndices.length; r++) {
    const row = grid[r]
    const lastPlacedCol = row.lastIndexOf(true)
    for (let c = 0; c <= lastPlacedCol; c++) {
      if (!row[c]) {
        return {
          status: "gap_error",
          feedback: `Row ${r + 1} has a gap! Push your cookies together from left to right without empty spaces.`,
        }
      }
    }
  }

  const actualRows = populatedRowIndices.length
  const actualCols = Math.max(...activeRowCounts)

  // 4. Misconception 1: Orientation Error (Transposed: e.g. 4 rows of 3 when 3 rows of 4 are requested)
  // Crucial Guard: spec.targetRows !== spec.targetCols ensures square arrays (e.g. 3x3) never trigger orientation error
  if (
    spec.targetRows !== spec.targetCols &&
    actualRows === spec.targetCols &&
    actualCols === spec.targetRows
  ) {
    return {
      status: "orientation_error",
      actualRows,
      actualCols,
      activeRowCounts,
      totalPlaced,
      feedback: `Look closely: you made ${actualRows} rows with ${actualCols} cookies each (${actualRows} rows of ${actualCols})! But Pencil Pal asked for ${spec.targetRows} equal rows. Can you put ${spec.targetCols} in each row so there are only ${spec.targetRows} rows?`,
    }
  }

  // 5. Misconception 2: Wrong number of rows entirely
  if (actualRows !== spec.targetRows) {
    return {
      status: "wrong_row_count",
      actualRows,
      targetRows: spec.targetRows,
      totalPlaced,
      feedback: `You made ${actualRows} rows, but the challenge asks for exactly ${spec.targetRows} equal rows. Count your rows going down!`,
    }
  }

  // 6. Misconception 3: Unequal rows
  if (actualCols !== spec.targetCols || !activeRowCounts.every((c) => c === spec.targetCols)) {
    const rowBreakdown = activeRowCounts
      .map((count, idx) => `Row ${idx + 1} has ${count}`)
      .join(", ")
    return {
      status: "unequal_rows",
      rowCounts: activeRowCounts,
      totalPlaced,
      feedback: `Your rows are not equal: ${rowBreakdown}. Equal rows must have the exact same count!`,
    }
  }

  // 7. SUCCESS: Exactly targetRows with targetCols in each row
  if (actualRows === spec.targetRows && actualCols === spec.targetCols) {
    const colCounts: number[] = []
    const cols = grid[0]?.length ?? 5
    for (let c = 0; c < cols; c++) {
      let count = 0
      for (let r = 0; r < grid.length; r++) {
        if (grid[r][c]) count++
      }
      colCounts.push(count)
    }

    return {
      status: "correct",
      equationRow: `${Array(spec.targetRows).fill(spec.targetCols).join(" + ")} = ${spec.totalTokens}`,
      equationCol: `${Array(spec.targetCols).fill(spec.targetRows).join(" + ")} = ${spec.totalTokens}`,
      activeRowCounts,
      activeColCounts: colCounts.filter((c) => c > 0),
      totalPlaced,
      feedback: `YES! You made ${spec.targetRows} equal rows with ${spec.targetCols} cookies in each row! Now click '👓 Column Eyes' to see what happens when you look up and down!`,
    }
  }

  return {
    status: "unequal_rows",
    rowCounts: activeRowCounts,
    totalPlaced,
    feedback: `We need exactly ${spec.targetRows} equal rows of ${spec.targetCols}!`,
  }
}

// ============================================================================
// NC.2.OA.3: Determining Odd and Even Parity (up to 20)
// ============================================================================

export interface ParityProblemSpec {
  totalTokens: number // 1..20
  strategy: "pairing" | "two_equal_groups"
}

export interface PairingSlot {
  left: boolean
  right: boolean
}

export type ParityDiagnostic =
  | {
      status: "correct_even"
      pairs: number
      equation: string
      totalPlaced: number
      feedback: string
    }
  | {
      status: "correct_odd"
      pairs: number
      leftover: number
      equation: string
      totalPlaced: number
      feedback: string
    }
  | {
      status: "unpaired_gap"
      feedback: string
    }
  | {
      status: "unequal_groups"
      groupA: number
      groupB: number
      feedback: string
    }
  | {
      status: "incomplete_inventory"
      placed: number
      target: number
      feedback: string
    }
  | {
      status: "empty"
      feedback: string
    }

export function evaluatePairingMat(
  slots: PairingSlot[],
  spec: ParityProblemSpec,
): ParityDiagnostic {
  let placed = 0
  let pairs = 0
  let unpairedSlots = 0

  for (let i = 0; i < slots.length; i++) {
    const slot = slots[i]
    if (slot.left) placed++
    if (slot.right) placed++

    if (slot.left && slot.right) {
      pairs++
    } else if (slot.left || slot.right) {
      unpairedSlots++
    }
  }

  if (placed === 0) {
    return {
      status: "empty",
      feedback: "Tap a counter from the tray to place it on the pairing mat!",
    }
  }

  if (placed !== spec.totalTokens) {
    return {
      status: "incomplete_inventory",
      placed,
      target: spec.totalTokens,
      feedback: `You placed ${placed} counters. We need all ${spec.totalTokens} counters on the mat!`,
    }
  }

  // Contiguity check: pairing must happen two-by-two from top to bottom
  let encounteredEmpty = false
  for (let i = 0; i < slots.length; i++) {
    const hasTokens = slots[i].left || slots[i].right
    if (!hasTokens && !encounteredEmpty) {
      // Check if subsequent slots have tokens
      const remainingTokens = slots.slice(i + 1).some((s) => s.left || s.right)
      if (remainingTokens) {
        return {
          status: "unpaired_gap",
          feedback: "Keep your pairs lined up from top to bottom without empty rows!",
        }
      }
      encounteredEmpty = true
    }
  }

  const isEven = spec.totalTokens % 2 === 0
  const expectedPairs = Math.floor(spec.totalTokens / 2)

  if (isEven) {
    if (pairs === expectedPairs && unpairedSlots === 0) {
      return {
        status: "correct_even",
        pairs,
        equation: `${expectedPairs} + ${expectedPairs} = ${spec.totalTokens}`,
        totalPlaced: placed,
        feedback: `All ${spec.totalTokens} counters have a buddy! ${spec.totalTokens} is an EVEN number (${expectedPairs} + ${expectedPairs} = ${spec.totalTokens})!`,
      }
    }
    return {
      status: "unequal_groups",
      groupA: pairs + unpairedSlots,
      groupB: pairs,
      feedback: "Every counter should have a buddy! Pair them up side-by-side.",
    }
  } else {
    // Odd
    if (pairs === expectedPairs && unpairedSlots === 1) {
      return {
        status: "correct_odd",
        pairs,
        leftover: 1,
        equation: `${expectedPairs} + ${expectedPairs} + 1 = ${spec.totalTokens}`,
        totalPlaced: placed,
        feedback: `One counter is left over without a buddy! That means ${spec.totalTokens} is an ODD number (${expectedPairs} + ${expectedPairs} + 1 = ${spec.totalTokens})!`,
      }
    }
    return {
      status: "unequal_groups",
      groupA: pairs + unpairedSlots,
      groupB: pairs,
      feedback: "Make as many pairs as possible to see if one is left over!",
    }
  }
}
