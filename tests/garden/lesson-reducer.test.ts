import { describe, expect, it } from "vitest"
import {
  INITIAL_LESSON_STATE,
  canLockIn,
  isGradingAction,
  lessonReducer,
} from "../../src/garden/lesson/reducer"
import type { WrongBubble } from "../../src/garden/types"

const bubble: WrongBubble = {
  title: "On screen",
  body: "Look again.",
  pictureRows: [{ label: "A", n: 2, of: 5 }],
}

describe("lessonReducer", () => {
  it("only LOCK_IN is a grading action", () => {
    expect(isGradingAction({ type: "LOCK_IN", correct: true, wasAlreadySolved: false })).toBe(true)
    expect(isGradingAction({ type: "SET_GUESS", guess: 3 })).toBe(false)
    expect(isGradingAction({ type: "ENTER_MODEL" })).toBe(false)
  })

  it("lock-in is the only path from model to solved or wrong", () => {
    let s = lessonReducer(INITIAL_LESSON_STATE, {
      type: "OPEN_LESSON",
      bedId: "making-ten",
      problemIndex: 0,
      modelState: { moved: 1 },
    })
    s = lessonReducer(s, { type: "START_PREDICT" })
    s = lessonReducer(s, { type: "SET_GUESS", guess: 13 })
    s = lessonReducer(s, { type: "ENTER_MODEL" })
    expect(s.phase).toBe("model")
    expect(canLockIn(s)).toBe(true)
    s = lessonReducer(s, {
      type: "LOCK_IN",
      correct: false,
      bubble,
      wasAlreadySolved: false,
    })
    expect(s.phase).toBe("wrongBubble")
    expect(s.context?.bubble?.title).toBe("On screen")
  })

  it("wrong answer keeps descriptive bubble, hints in order", () => {
    let s = lessonReducer(INITIAL_LESSON_STATE, {
      type: "OPEN_LESSON",
      bedId: "counting-on",
      problemIndex: 0,
      modelState: { at: 10 },
    })
    s = lessonReducer(s, { type: "START_PREDICT" })
    s = lessonReducer(s, { type: "SET_GUESS", guess: 11 })
    s = lessonReducer(s, { type: "ENTER_MODEL" })
    s = lessonReducer(s, {
      type: "LOCK_IN",
      correct: false,
      bubble,
      wasAlreadySolved: false,
    })
    expect(s.context?.hintRung).toBe(1)
    s = lessonReducer(s, { type: "HELP" })
    expect(s.phase).toBe("hint2")
    expect(s.context?.hintRung).toBe(2)
    s = lessonReducer(s, { type: "HELP" })
    expect(s.phase).toBe("hint3")
    expect(s.context?.hintRung).toBe(3)
  })

  it("moss growth is decided outside reducer (wasAlreadySolved flag on correct lock)", () => {
    let s = lessonReducer(INITIAL_LESSON_STATE, {
      type: "OPEN_LESSON",
      bedId: "making-ten",
      problemIndex: 0,
      modelState: { moved: 2 },
    })
    s = lessonReducer(s, { type: "START_PREDICT" })
    s = lessonReducer(s, { type: "SET_GUESS", guess: 13 })
    s = lessonReducer(s, { type: "ENTER_MODEL" })
    s = lessonReducer(s, {
      type: "LOCK_IN",
      correct: true,
      wasAlreadySolved: false,
    })
    expect(s.phase).toBe("solved")
    expect(s.context?.wasAlreadySolved).toBe(false)
  })
})
