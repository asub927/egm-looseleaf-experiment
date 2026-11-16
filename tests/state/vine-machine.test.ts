import test from "node:test"
import assert from "node:assert/strict"
import {
  createInitialVineState,
  vineReducer,
  type VineState,
} from "../../src/lib/state/vine-machine.ts"
import { CANONICAL_VINE_SEEDS } from "../../src/lib/math/vine-evaluator.ts"

const SEED = CANONICAL_VINE_SEEDS[0] // 10 - 6 = 4

test("Vine State Machine: Lifecycle Progression (predicting -> exploring -> evaluating -> reflecting -> solved)", () => {
  let state = createInitialVineState(SEED)
  assert.equal(state.phase, "predicting")
  assert.equal(state.predictedGuess, null)
  assert.equal(state.added, 0)
  assert.equal(state.isDragging, false)
  assert.equal(state.hasReflected, false)

  // 1. Select Prediction
  state = vineReducer(state, { type: "SELECT_PREDICTION", guess: 3 })
  assert.equal(state.phase, "exploring")
  assert.equal(state.predictedGuess, 3)

  // 2. Drag / Update Added blossoms
  state = vineReducer(state, { type: "START_DRAG" })
  assert.equal(state.isDragging, true)
  state = vineReducer(state, { type: "UPDATE_ADDED", added: 4, via: "drag" })
  assert.equal(state.added, 4)
  state = vineReducer(state, { type: "STOP_DRAG" })
  assert.equal(state.isDragging, false)

  // 3. Lock In Answer (Evaluation triggers reflection because predicted 3 != actual 4)
  state = vineReducer(state, {
    type: "LOCK_IN",
    evaluation: {
      problemId: SEED.id,
      verdict: "correct",
      whole: 10,
      known: 6,
      guess: 3,
      actual: 4,
      delta: 0,
      feedback: "Sweet blooming blossoms!",
      mismatchReflectionNeeded: true,
      sensoryMode: "standard",
    },
  })
  assert.equal(state.phase, "reflecting")
  assert.equal(state.hasReflected, false)

  // 4. Complete Metacognitive Reflection
  state = vineReducer(state, { type: "COMPLETE_REFLECTION" })
  assert.equal(state.phase, "solved")
  assert.equal(state.hasReflected, true)

  // 5. Switching problem seed resets lifecycle
  const nextSeed = CANONICAL_VINE_SEEDS[1]
  state = vineReducer(state, { type: "SELECT_SEED", seed: nextSeed })
  assert.equal(state.phase, "predicting")
  assert.equal(state.currentSeed.id, nextSeed.id)
  assert.equal(state.predictedGuess, null)
  assert.equal(state.added, 0)
  assert.equal(state.hasReflected, false)
})

test("Vine State Machine: Autonomous demonstration running locks out drag and steps correctly", () => {
  let state = createInitialVineState(SEED)

  // Start demo
  state = vineReducer(state, { type: "START_DEMO" })
  assert.equal(state.phase, "demonstrating")
  assert.equal(state.added, 0)

  // Drag attempts are ignored while demonstrating
  state = vineReducer(state, { type: "START_DRAG" })
  assert.equal(state.isDragging, false)

  // Step demo
  state = vineReducer(state, { type: "STEP_DEMO", currentStep: 2 })
  assert.equal(state.phase, "demonstrating")
  assert.equal(state.added, 2)

  state = vineReducer(state, { type: "STEP_DEMO", currentStep: 4 })
  assert.equal(state.phase, "demonstrating")
  assert.equal(state.added, 4)

  // Finish demo
  state = vineReducer(state, { type: "FINISH_DEMO" })
  assert.equal(state.phase, "predicting") // returns to predicting since no guess was selected
})
