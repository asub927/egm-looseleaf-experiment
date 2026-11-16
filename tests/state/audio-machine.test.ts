import test from "node:test"
import assert from "node:assert/strict"
import {
  createInitialAudioState,
  audioNarrationReducer,
  type AudioNarrationState,
} from "../../src/lib/state/audio-narration-machine.ts"

test("Audio Narration State Machine: Full Utterance Lifecycle", () => {
  let state = createInitialAudioState(true, "idle")
  assert.equal(state.phase, "idle")
  assert.equal(state.enabled, true)
  assert.equal(state.currentWordIndex, -1)
  assert.equal(state.currentWord, null)

  // 1. Prepare speech
  state = audioNarrationReducer(state, {
    type: "PREPARE",
    text: "Can you pair up 7 acorns?",
    cleanedText: "Can you pair up 7 acorns?",
    tokens: [
      { word: "Can", startIndex: 0, endIndex: 3 },
      { word: "you", startIndex: 4, endIndex: 7 },
      { word: "pair", startIndex: 8, endIndex: 12 },
    ],
    pose: "wave",
  })
  assert.equal(state.phase, "idle")
  assert.equal(state.mascotPose, "wave")
  assert.equal(state.tokens.length, 3)

  // 2. Start speech
  state = audioNarrationReducer(state, { type: "START" })
  assert.equal(state.phase, "speaking")
  assert.equal(state.currentWordIndex, 0)
  assert.equal(state.currentWord, "Can")

  // 3. Word boundary progression
  state = audioNarrationReducer(state, {
    type: "WORD_BOUNDARY",
    wordIndex: 1,
    word: "you",
  })
  assert.equal(state.currentWordIndex, 1)
  assert.equal(state.currentWord, "you")

  state = audioNarrationReducer(state, {
    type: "WORD_BOUNDARY",
    wordIndex: 2,
    word: "pair",
  })
  assert.equal(state.currentWordIndex, 2)
  assert.equal(state.currentWord, "pair")

  // 4. End speech
  state = audioNarrationReducer(state, {
    type: "END",
    defaultIdlePose: "idle",
    resetPoseOnEnd: true,
  })
  assert.equal(state.phase, "idle")
  assert.equal(state.currentWordIndex, -1)
  assert.equal(state.currentWord, null)
  assert.equal(state.mascotPose, "idle")
})

test("Audio Narration State Machine: Stop and Error transitions", () => {
  let state = createInitialAudioState(true, "idle")

  state = audioNarrationReducer(state, {
    type: "PREPARE",
    text: "Hello",
    cleanedText: "Hello",
    tokens: [{ word: "Hello", startIndex: 0, endIndex: 5 }],
  })
  state = audioNarrationReducer(state, { type: "START" })
  assert.equal(state.phase, "speaking")

  // Stop immediately cancels speaking
  state = audioNarrationReducer(state, { type: "STOP" })
  assert.equal(state.phase, "idle")
  assert.equal(state.currentWordIndex, -1)

  // Error handling
  state = audioNarrationReducer(state, {
    type: "ERROR",
    error: new Error("Speech synthesis failed"),
  })
  assert.equal(state.phase, "error")
  assert.equal(state.currentWordIndex, -1)
  assert.ok(state.lastError)
})
