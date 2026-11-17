import test from "node:test"
import assert from "node:assert/strict"
import {
  createInitialScaffoldingState,
  scaffoldingReducer,
  type ScaffoldingState,
} from "../../src/lib/state/scaffolding-machine.ts"

test("Scaffolding State Machine: Initial state invariants", () => {
  const initial = createInitialScaffoldingState("Step 1: Build 3 Rows")
  assert.equal(initial.phase, "constructing")
  assert.equal(initial.tier, 0)
  assert.equal(initial.failureCount, 0)
  assert.equal(initial.isGhostVisible, false)
  assert.equal(initial.feedback, null)
  assert.equal(initial.wasDemonstrated, false)
  assert.equal(initial.masteryEligible, true)
  assert.equal(initial.isValidated, false)
  assert.equal(initial.mascotPose, "idle")
  assert.equal(initial.tierBadge, "Step 1: Build 3 Rows")
})

test("Scaffolding State Machine: 3-Tier Progressive Escalation on Failures", () => {
  const badge = "Step 1: Build 3 Rows"
  let state = createInitialScaffoldingState(badge)

  // 1st failure -> Tier 1
  state = scaffoldingReducer(
    state,
    {
      type: "EVALUATION_FAILURE",
      feedback: "Check your rows",
      tierBadge: "Step 1: Check Your Rows",
      tier1Pose: "think",
    },
    badge,
  )
  assert.equal(state.phase, "tier1_prompt")
  assert.equal(state.tier, 1)
  assert.equal(state.failureCount, 1)
  assert.equal(state.isGhostVisible, false)
  assert.equal(state.feedback, "Check your rows")
  assert.equal(state.tierBadge, "Step 1: Check Your Rows")
  assert.equal(state.mascotPose, "think")
  assert.equal(state.masteryEligible, true)

  // State Mutation Guard in Tier 1 -> returns to constructing, clears feedback
  state = scaffoldingReducer(state, { type: "TOKEN_MUTATED" }, badge)
  assert.equal(state.phase, "constructing")
  assert.equal(state.feedback, null)
  assert.equal(state.isGhostVisible, false)
  assert.equal(state.tier, 1) // failure count preserved
  assert.equal(state.failureCount, 1)

  // 2nd failure -> Tier 2 Visual Ghost Assist
  state = scaffoldingReducer(
    state,
    {
      type: "EVALUATION_FAILURE",
      feedback: "Pencil Pal drew dotted ghost boxes",
      tierBadge: "Step 2: Ghost Assist",
    },
    badge,
  )
  assert.equal(state.phase, "tier2_ghost")
  assert.equal(state.tier, 2)
  assert.equal(state.failureCount, 2)
  assert.equal(state.isGhostVisible, true)
  assert.equal(state.mascotPose, "sketch")

  // State Mutation Guard in Tier 2 -> returns to constructing, but keeps isGhostVisible true!
  state = scaffoldingReducer(state, { type: "TOKEN_MUTATED" }, badge)
  assert.equal(state.phase, "constructing")
  assert.equal(state.isGhostVisible, true) // Crucial pedagogical invariant: ghost guide persists

  // 3rd failure -> Tier 3 Step Demonstration
  state = scaffoldingReducer(
    state,
    {
      type: "EVALUATION_FAILURE",
      feedback: "Pencil Pal placed Row 1",
      tierBadge: "Step 3: Step Demonstration",
    },
    badge,
  )
  assert.equal(state.phase, "tier3_demonstrate")
  assert.equal(state.tier, 3)
  assert.equal(state.failureCount, 3)
  assert.equal(state.wasDemonstrated, true)
  assert.equal(state.masteryEligible, false) // Mastery credit revoked on Tier 3 demonstration

  // Isomorphic retry resets ladder for fresh mastery qualification
  state = scaffoldingReducer(
    state,
    { type: "TRIGGER_ISOMORPHIC_RETRY", initialBadge: "Step 1: Build 4 Rows" },
    "Step 1: Build 4 Rows",
  )
  assert.equal(state.phase, "constructing")
  assert.equal(state.tier, 0)
  assert.equal(state.failureCount, 0)
  assert.equal(state.isGhostVisible, false)
  assert.equal(state.wasDemonstrated, false)
  assert.equal(state.masteryEligible, true)
  assert.equal(state.tierBadge, "Step 1: Build 4 Rows")
  assert.equal(state.mascotPose, "wave")
})

test("Scaffolding State Machine: Student requests demonstration directly", () => {
  const badge = "Step 1: Pair Up"
  let state = createInitialScaffoldingState(badge)

  state = scaffoldingReducer(
    state,
    {
      type: "REQUEST_DEMONSTRATION",
      feedback: "Pencil Pal paired up the first 2 counters!",
    },
    badge,
  )
  assert.equal(state.phase, "tier3_demonstrate")
  assert.equal(state.tier, 3)
  assert.equal(state.wasDemonstrated, true)
  assert.equal(state.masteryEligible, false)
  assert.equal(state.isGhostVisible, true)
  assert.equal(state.tierBadge, "Step 3: Step Demonstration")
})

test("Scaffolding State Machine: Evaluation success transitions to validated celebration", () => {
  const badge = "Step 1: Pair Up"
  let state = createInitialScaffoldingState(badge)

  state = scaffoldingReducer(
    state,
    {
      type: "EVALUATION_SUCCESS",
      feedback: "Perfect buddy pairs!",
      badge: "Buddy Pairs Verified! 🌟",
    },
    badge,
  )
  assert.equal(state.phase, "validated")
  assert.equal(state.tier, 0)
  assert.equal(state.isValidated, true)
  assert.equal(state.mascotPose, "celebrate")
  assert.equal(state.tierBadge, "Buddy Pairs Verified! 🌟")

  // State Mutation Guard when validated: dismisses validation
  state = scaffoldingReducer(state, { type: "TOKEN_MUTATED" }, badge)
  assert.equal(state.phase, "constructing")
  assert.equal(state.isValidated, false)
  assert.equal(state.mascotPose, "idle")
  assert.equal(state.tierBadge, badge)
})
