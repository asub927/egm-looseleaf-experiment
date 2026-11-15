import test from "node:test"
import assert from "node:assert/strict"
import {
  CANONICAL_VINE_SEEDS,
  VINE_SEEDS,
  getVineSeedById,
  validateVineProblemSeed,
  evaluateVineSubmission,
  type VineProblemSeed,
  type VineSubmission,
} from "../../src/lib/math/vine-evaluator.ts"
import {
  playPluck,
  playCelebrationChimes,
  CHIME_FREQUENCIES,
} from "../../src/lib/audio/garden-chimes.ts"

// ============================================================================
// Test Suite: Whispering Vine Evaluator & Seeds (NC.2.OA.2)
// ============================================================================

test("Whispering Vine Invariant 1: Canonical Seed Integrity & NC.2.OA.2 Standard Alignment", () => {
  assert.equal(CANONICAL_VINE_SEEDS.length, 6, "Must define 6 canonical problem seeds")
  assert.equal(VINE_SEEDS, CANONICAL_VINE_SEEDS, "VINE_SEEDS alias must equal CANONICAL_VINE_SEEDS")

  const expectedIds = ["vine-10-6", "vine-10-3", "vine-10-8", "vine-10-4", "vine-10-7", "vine-10-5"]

  for (let i = 0; i < CANONICAL_VINE_SEEDS.length; i++) {
    const seed = CANONICAL_VINE_SEEDS[i]
    assert.equal(seed.id, expectedIds[i], `Seed id must match ${expectedIds[i]}`)
    assert.equal(seed.whole, 10, "All Grade 2 canonical seeds must have whole = 10")
    assert.ok(seed.known >= 1 && seed.known <= 9, "Known starting blossoms must be within 1..9")
    assert.ok(seed.prompt.length > 5, "Prompt must be non-empty")
    assert.ok(seed.story.length > 10, "Story narrative must be engaging and non-empty")
    assert.ok(seed.coplayPrompt.length > 10, "Grown-up co-play prompt must be non-empty")

    // Validation helper
    const validated = validateVineProblemSeed(seed)
    assert.notEqual(validated, null, `Seed ${seed.id} must pass validation`)
    assert.equal(validated?.id, seed.id)

    // Lookup helper
    const retrieved = getVineSeedById(seed.id)
    assert.deepEqual(retrieved, seed, `getVineSeedById must find seed ${seed.id}`)
  }
})

test('Whispering Vine Invariant 2: Exact Submissions Must Pass as "correct" across all canonical seeds', () => {
  for (const seed of CANONICAL_VINE_SEEDS) {
    const expectedDifference = seed.whole - seed.known
    const submission: VineSubmission = {
      problemId: seed.id,
      guess: null,
      dragged: expectedDifference,
      via: "drag",
    }

    const result = evaluateVineSubmission(seed, submission)

    assert.equal(result.verdict, "correct", `Seed ${seed.id} exact drag must be correct`)
    assert.equal(result.diff, 0, "diff must be exactly 0 for correct submission")
    assert.equal(result.expected, expectedDifference, "expected must match whole - known")
    assert.equal(result.mismatchReflectionNeeded, false, "No reflection needed when guess is null")
    assert.match(
      result.hint,
      new RegExp(`${seed.known} blossoms \\+ ${expectedDifference} new flowers = ${seed.whole}`),
    )
    assert.match(result.hint, new RegExp(`${seed.whole} − ${seed.known} = ${expectedDifference}`))
    assert.equal(result.strategyName, "Think Addition (10 − ?)")
  }
})

test("Whispering Vine Invariant 3: Underfilled Submissions Diagnostics", () => {
  const seed = CANONICAL_VINE_SEEDS[0] // 10 - 6 = 4
  const expectedDifference = 4

  // Underfilled by 4 (dragged = 0)
  const zeroResult = evaluateVineSubmission(seed, {
    problemId: seed.id,
    guess: null,
    dragged: 0,
    via: "drag",
  })
  assert.equal(zeroResult.verdict, "underfilled")
  assert.equal(zeroResult.diff, -4)
  assert.equal(zeroResult.expected, expectedDifference)
  assert.equal(zeroResult.mismatchReflectionNeeded, false)
  assert.match(zeroResult.hint, /4 sleeping buds glowing in the gap/i)

  // Underfilled by 1 (dragged = 3)
  const nearResult = evaluateVineSubmission(seed, {
    problemId: seed.id,
    guess: null,
    dragged: 3,
    via: "tap",
  })
  assert.equal(nearResult.verdict, "underfilled")
  assert.equal(nearResult.diff, -1)
  assert.equal(nearResult.expected, 4)
  assert.match(nearResult.hint, /1 sleeping bud glowing in the gap/i)
})

test("Whispering Vine Invariant 4: Overfilled Submissions Diagnostics", () => {
  const seed = CANONICAL_VINE_SEEDS[0] // 10 - 6 = 4

  // Overfilled by 1 (dragged = 5, total = 11)
  const overOne = evaluateVineSubmission(seed, {
    problemId: seed.id,
    guess: null,
    dragged: 5,
    via: "drag",
  })
  assert.equal(overOne.verdict, "overfilled")
  assert.equal(overOne.diff, 1)
  assert.equal(overOne.expected, 4)
  assert.equal(overOne.mismatchReflectionNeeded, false)
  assert.match(overOne.hint, /vine went 1 bud past 10/i)

  // Overfilled by 3 (dragged = 7, total = 13)
  const overThree = evaluateVineSubmission(seed, {
    problemId: seed.id,
    guess: null,
    dragged: 7,
    via: "keyboard",
  })
  assert.equal(overThree.verdict, "overfilled")
  assert.equal(overThree.diff, 3)
  assert.equal(overThree.expected, 4)
  assert.match(overThree.hint, /vine went past 10/i)
})

test("Whispering Vine Invariant 5: Metacognitive Mismatch Reflection Trigger Invariants", () => {
  const seed = CANONICAL_VINE_SEEDS[0] // 10 - 6 = 4

  // Case 1: Student guessed 3 (misconception/estimate), then dragged 4 (correct).
  // Reflection MUST trigger to calibrate metacognition.
  const reflected = evaluateVineSubmission(seed, {
    problemId: seed.id,
    guess: 3,
    dragged: 4,
    via: "drag",
  })
  assert.equal(reflected.verdict, "correct")
  assert.equal(reflected.mismatchReflectionNeeded, true, "Mismatch reflection must be triggered")

  // Case 2: Student guessed 4 (accurate prediction) and dragged 4 (correct).
  // Reflection should NOT trigger because prediction matched reality.
  const matching = evaluateVineSubmission(seed, {
    problemId: seed.id,
    guess: 4,
    dragged: 4,
    via: "drag",
  })
  assert.equal(matching.verdict, "correct")
  assert.equal(
    matching.mismatchReflectionNeeded,
    false,
    "No reflection when prediction matches answer",
  )

  // Case 3: Student did not guess (guess = null), dragged 4 (correct).
  // No reflection.
  const noGuess = evaluateVineSubmission(seed, {
    problemId: seed.id,
    guess: null,
    dragged: 4,
    via: "tap",
  })
  assert.equal(noGuess.verdict, "correct")
  assert.equal(noGuess.mismatchReflectionNeeded, false)

  // Case 4: Student guessed 3 and dragged 2 (underfilled / incomplete).
  // Reflection should NOT trigger prematurely when not yet correct.
  const incomplete = evaluateVineSubmission(seed, {
    problemId: seed.id,
    guess: 3,
    dragged: 2,
    via: "drag",
  })
  assert.equal(incomplete.verdict, "underfilled")
  assert.equal(
    incomplete.mismatchReflectionNeeded,
    false,
    "No reflection when solution is incomplete",
  )
})

test("Whispering Vine Invariant 6: Input Robustness & Zero NaN Defense", () => {
  const seed = CANONICAL_VINE_SEEDS[0] // 10 - 6 = 4

  // Negative dragged input must clamp to 0 without NaN or crash
  const negResult = evaluateVineSubmission(seed, {
    problemId: seed.id,
    guess: -2,
    dragged: -5,
    via: "drag",
  })
  assert.equal(negResult.verdict, "underfilled")
  assert.equal(negResult.diff, -4)
  assert.equal(negResult.expected, 4)
  assert.equal(Number.isNaN(negResult.diff), false)

  // Non-finite dragged (NaN) defaults safely to 0
  const nanResult = evaluateVineSubmission(seed, {
    problemId: seed.id,
    guess: Number.NaN,
    dragged: Number.NaN,
    via: "tap",
  })
  assert.equal(nanResult.verdict, "underfilled")
  assert.equal(nanResult.diff, -4)
  assert.equal(Number.isNaN(nanResult.diff), false)

  // Float numbers (e.g. 3.9 from pointer drag) are cleanly rounded
  const floatResult = evaluateVineSubmission(seed, {
    problemId: seed.id,
    guess: 4,
    dragged: 3.9,
    via: "drag",
  })
  assert.equal(floatResult.verdict, "correct")
  assert.equal(floatResult.diff, 0)

  // Incomplete / invalid seed bounds testing with validateVineProblemSeed
  assert.equal(validateVineProblemSeed(null), null)
  assert.equal(validateVineProblemSeed({}), null)
  assert.equal(validateVineProblemSeed({ id: "", whole: 10, known: 5 }), null)
  assert.equal(
    validateVineProblemSeed({
      id: "bad",
      whole: -10,
      known: 5,
      prompt: "x",
      story: "y",
      coplayPrompt: "z",
    }),
    null,
  )
  assert.equal(
    validateVineProblemSeed({
      id: "bad",
      whole: 10,
      known: 15,
      prompt: "x",
      story: "y",
      coplayPrompt: "z",
    }),
    null,
  )
})

test("Whispering Vine Invariant 7: Adversarial Fuzzing Matrix (200 Seeds)", () => {
  for (let s = 1; s <= 200; s++) {
    const whole = (s % 15) + 5 // 5..19
    const known = (s * 3) % (whole + 1) // 0..whole
    const expected = whole - known

    // Generate random dragged and guess values including negatives, floats, NaNs, and bounds
    let rawDragged: number
    if (s % 17 === 0) {
      rawDragged = Number.NaN
    } else if (s % 13 === 0) {
      rawDragged = -((s % 10) + 1)
    } else {
      rawDragged = (s * 7) % (whole + 6)
    }

    const rawGuess = s % 5 === 0 ? null : s % 3 === 0 ? expected : (s * 11) % whole

    const dynamicSeed: VineProblemSeed = {
      id: `fuzz-${s}`,
      whole,
      known,
      prompt: "Fuzz prompt",
      story: "Fuzz story narrative",
      coplayPrompt: "Fuzz coplay prompt",
    }

    const submission: VineSubmission = {
      problemId: dynamicSeed.id,
      guess: rawGuess,
      dragged: rawDragged,
      via: s % 2 === 0 ? "drag" : "tap",
    }

    const res = evaluateVineSubmission(dynamicSeed, submission)

    // Strict Invariant Checks:
    assert.equal(Number.isNaN(res.diff), false, `Seed ${s}: diff must not be NaN`)
    assert.equal(Number.isNaN(res.expected), false, `Seed ${s}: expected must not be NaN`)
    assert.ok(Number.isFinite(res.diff), `Seed ${s}: diff must be finite`)
    assert.ok(Number.isFinite(res.expected), `Seed ${s}: expected must be finite`)
    assert.equal(res.expected, expected, `Seed ${s}: expected must equal whole - known`)

    if (res.diff === 0) {
      assert.equal(res.verdict, "correct", `Seed ${s}: diff === 0 must be verdict correct`)
      if (rawGuess !== null && rawGuess !== res.expected) {
        assert.equal(
          res.mismatchReflectionNeeded,
          true,
          `Seed ${s}: mismatch reflection must trigger`,
        )
      } else {
        assert.equal(
          res.mismatchReflectionNeeded,
          false,
          `Seed ${s}: mismatch reflection must not trigger`,
        )
      }
    } else if (res.diff < 0) {
      assert.equal(res.verdict, "underfilled", `Seed ${s}: diff < 0 must be verdict underfilled`)
      assert.equal(res.mismatchReflectionNeeded, false)
    } else {
      assert.equal(res.verdict, "overfilled", `Seed ${s}: diff > 0 must be verdict overfilled`)
      assert.equal(res.mismatchReflectionNeeded, false)
    }
  }
})

test("Whispering Vine Invariant 8: Garden Chimes Synthesizer Resiliency & Frequencies", () => {
  // Validate the 10 pentatonic growth node frequencies strictly match specs (C4 to C6)
  assert.equal(CHIME_FREQUENCIES.length, 10, "Scale must have 10 nodes")
  assert.equal(CHIME_FREQUENCIES[0], 261.63, "Node 1 must be C4 (261.63Hz)")
  assert.equal(CHIME_FREQUENCIES[9], 1046.5, "Node 10 must be C6 (1046.50Hz)")

  // Verify scale is strictly monotonically ascending
  for (let i = 1; i < CHIME_FREQUENCIES.length; i++) {
    assert.ok(
      CHIME_FREQUENCIES[i] > CHIME_FREQUENCIES[i - 1],
      `Frequency at node ${i + 1} must be higher than node ${i}`,
    )
  }

  // Graceful execution in headless Node.js environment (Web Audio context is null or absent)
  assert.doesNotThrow(() => {
    playPluck(0)
    playPluck(5, 2)
    playPluck(9, -4)
    playPluck(-3) // boundary clamping
    playPluck(25) // boundary clamping
    playPluck(Number.NaN) // NaN resilience
  }, "playPluck must never throw in non-browser environments")

  assert.doesNotThrow(() => {
    playCelebrationChimes()
  }, "playCelebrationChimes must never throw in non-browser environments")
})
