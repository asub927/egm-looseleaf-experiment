import test from "node:test"
import assert from "node:assert/strict"
import { evaluatePairingMat, type PairingSlot } from "../../src/lib/math/evaluator.ts"

function emptySlots(count = 10): PairingSlot[] {
  return Array(count)
    .fill(null)
    .map(() => ({ left: false, right: false }))
}

test("NC.2.OA.3 Invariant 1: Even number with complete pairs must PASS as correct_even", () => {
  const slots = emptySlots(10)
  // 12 counters = 6 pairs
  for (let i = 0; i < 6; i++) {
    slots[i].left = true
    slots[i].right = true
  }

  const result = evaluatePairingMat(slots, { totalTokens: 12, strategy: "pairing" })
  assert.equal(result.status, "correct_even")
  if (result.status === "correct_even") {
    assert.equal(result.pairs, 6)
    assert.equal(result.equation, "6 + 6 = 12")
  }
})

test("NC.2.OA.3 Invariant 2: Odd number with 1 leftover must PASS as correct_odd", () => {
  const slots = emptySlots(10)
  // 11 counters = 5 pairs + 1 leftover on row 5
  for (let i = 0; i < 5; i++) {
    slots[i].left = true
    slots[i].right = true
  }
  slots[5].left = true // 1 unpaired leftover

  const result = evaluatePairingMat(slots, { totalTokens: 11, strategy: "pairing" })
  assert.equal(result.status, "correct_odd")
  if (result.status === "correct_odd") {
    assert.equal(result.pairs, 5)
    assert.equal(result.leftover, 1)
    assert.equal(result.equation, "5 + 5 + 1 = 11")
  }
})

test("NC.2.OA.3 Invariant 3: Unpaired slots in an even number must FAIL as unequal_groups", () => {
  const slots = emptySlots(10)
  // 10 counters: 4 pairs, but remaining 2 placed in left column on separate rows (no buddy)
  for (let i = 0; i < 4; i++) {
    slots[i].left = true
    slots[i].right = true
  }
  slots[4].left = true
  slots[5].left = true // 2 leftovers instead of forming a pair!

  const result = evaluatePairingMat(slots, { totalTokens: 10, strategy: "pairing" })
  assert.equal(result.status, "unequal_groups")
  assert.match(result.feedback, /buddy/i)
})

test("NC.2.OA.3 Invariant 4: Gap in pairing slots must FAIL as unpaired_gap", () => {
  const slots = emptySlots(10)
  // Row 0 paired, row 1 empty, row 2 paired
  slots[0].left = true
  slots[0].right = true
  slots[2].left = true
  slots[2].right = true

  const result = evaluatePairingMat(slots, { totalTokens: 4, strategy: "pairing" })
  assert.equal(result.status, "unpaired_gap")
})

test("NC.2.OA.3 Invariant 5: Empty Mat Must FAIL as empty", () => {
  const slots = emptySlots(10)
  const result = evaluatePairingMat(slots, { totalTokens: 8, strategy: "pairing" })
  assert.equal(result.status, "empty")
})

test("NC.2.OA.3 Invariant 6: Incomplete Inventory (< totalTokens) Must FAIL", () => {
  const slots = emptySlots(10)
  slots[0].left = true
  slots[0].right = true
  // Placed 2, but target is 6
  const result = evaluatePairingMat(slots, { totalTokens: 6, strategy: "pairing" })
  assert.equal(result.status, "incomplete_inventory")
  if (result.status === "incomplete_inventory") {
    assert.equal(result.placed, 2)
    assert.equal(result.target, 6)
  }
})

test("NC.2.OA.3 Invariant 7: Odd number with leftover on right column must PASS as correct_odd", () => {
  const slots = emptySlots(10)
  // 7 counters = 3 pairs + 1 leftover in right slot of row 3
  for (let i = 0; i < 3; i++) {
    slots[i].left = true
    slots[i].right = true
  }
  slots[3].right = true // right slot leftover

  const result = evaluatePairingMat(slots, { totalTokens: 7, strategy: "pairing" })
  assert.equal(result.status, "correct_odd")
  if (result.status === "correct_odd") {
    assert.equal(result.pairs, 3)
    assert.equal(result.leftover, 1)
    assert.equal(result.equation, "3 + 3 + 1 = 7")
  }
})

test("NC.2.OA.3 Invariant 8: Adversarial Parity Fuzzing Matrix (200 Seeds)", () => {
  for (let seed = 1; seed <= 200; seed++) {
    const totalTokens = (seed % 20) + 1 // 1..20
    const slots = emptySlots(10)
    let placed = 0

    // Random placement based on seed
    for (let r = 0; r < 10 && placed < totalTokens; r++) {
      if ((seed * 7 + r * 13) % 3 !== 0) {
        slots[r].left = true
        placed++
      }
      if (placed < totalTokens && (seed * 11 + r * 17) % 3 !== 0) {
        slots[r].right = true
        placed++
      }
    }

    const diag = evaluatePairingMat(slots, { totalTokens, strategy: "pairing" })

    // If marked correct, verify invariant properties
    if (diag.status === "correct_even") {
      assert.equal(totalTokens % 2, 0)
      assert.equal(diag.totalPlaced, totalTokens)
      assert.equal(diag.pairs, totalTokens / 2)
    } else if (diag.status === "correct_odd") {
      assert.equal(totalTokens % 2, 1)
      assert.equal(diag.totalPlaced, totalTokens)
      assert.equal(diag.pairs, Math.floor(totalTokens / 2))
      assert.equal(diag.leftover, 1)
    }
  }
})
