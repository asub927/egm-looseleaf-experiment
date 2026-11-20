import type { ModelState } from "../models/state"
import type { BedId, LessonBar, LessonPhase, LessonState, WrongBubble } from "../types"

export type LessonAction =
  | { type: "OPEN_LESSON"; bedId: BedId; problemIndex: 0 | 1; modelState: ModelState }
  | { type: "START_PREDICT" }
  | { type: "SET_GUESS"; guess: number }
  | { type: "ENTER_MODEL" }
  | { type: "SET_MODEL_STATE"; modelState: ModelState; via?: "tap" | "keyboard" | "drag" }
  | { type: "LOCK_IN"; correct: boolean; bubble?: WrongBubble; wasAlreadySolved: boolean }
  | { type: "HELP" }
  | { type: "NEXT_PROBLEM"; modelState: ModelState }
  | { type: "LEAVE_LESSON" }
  | { type: "RESET_MODEL"; modelState: ModelState }

function barForPhase(phase: LessonPhase): LessonBar {
  switch (phase) {
    case "story":
      return "story"
    case "predict":
    case "model":
      return "try"
    case "wrongBubble":
    case "hint1":
    case "hint2":
    case "hint3":
      return "check"
    case "locked":
    case "solved":
      return "grow"
    default: {
      const _exhaustive: never = phase
      return _exhaustive
    }
  }
}

export const INITIAL_LESSON_STATE: LessonState = {
  phase: "story",
  bar: "story",
  context: null,
}

/** Only LOCK_IN may grade (correct flag on action). */
export function lessonReducer(state: LessonState, action: LessonAction): LessonState {
  switch (action.type) {
    case "OPEN_LESSON":
      return {
        phase: "story",
        bar: "story",
        context: {
          bedId: action.bedId,
          problemIndex: action.problemIndex,
          guess: null,
          modelState: action.modelState,
          wrongAttempts: 0,
          hintRung: 0,
          bubble: null,
          wasAlreadySolved: false,
          via: null,
        },
      }
    case "START_PREDICT":
      if (!state.context || state.phase !== "story") return state
      return { ...state, phase: "predict", bar: "try" }
    case "SET_GUESS":
      if (!state.context || state.phase !== "predict") return state
      return {
        ...state,
        context: { ...state.context, guess: action.guess },
      }
    case "ENTER_MODEL":
      if (!state.context || state.phase !== "predict" || state.context.guess === null) return state
      return { ...state, phase: "model", bar: "try" }
    case "SET_MODEL_STATE":
      if (!state.context) return state
      if (
        state.phase !== "model" &&
        state.phase !== "wrongBubble" &&
        state.phase !== "hint1" &&
        state.phase !== "hint2" &&
        state.phase !== "hint3"
      ) {
        return state
      }
      return {
        ...state,
        phase: state.phase === "wrongBubble" ? "model" : state.phase,
        context: {
          ...state.context,
          modelState: action.modelState,
          via: action.via ?? state.context.via,
        },
      }
    case "LOCK_IN": {
      if (
        !state.context ||
        (state.phase !== "model" &&
          state.phase !== "wrongBubble" &&
          state.phase !== "hint1" &&
          state.phase !== "hint2" &&
          state.phase !== "hint3")
      ) {
        return state
      }
      if (action.correct) {
        return {
          phase: "solved",
          bar: "grow",
          context: {
            ...state.context,
            bubble: null,
            wasAlreadySolved: action.wasAlreadySolved,
          },
        }
      }
      const hintRung = Math.min(3, state.context.hintRung + 1) as 1 | 2 | 3
      const phase: LessonPhase = hintRung === 1 ? "hint1" : hintRung === 2 ? "hint2" : "hint3"
      return {
        phase: action.bubble && hintRung < 3 ? "wrongBubble" : phase,
        bar: "check",
        context: {
          ...state.context,
          wrongAttempts: state.context.wrongAttempts + 1,
          hintRung,
          bubble: action.bubble ?? null,
        },
      }
    }
    case "HELP": {
      if (!state.context || state.phase === "story" || state.phase === "predict") return state
      const next = Math.min(3, state.context.hintRung + 1) as 0 | 1 | 2 | 3
      const phase: LessonPhase =
        next === 0 ? state.phase : next === 1 ? "hint1" : next === 2 ? "hint2" : "hint3"
      return {
        ...state,
        phase,
        bar: "check",
        context: { ...state.context, hintRung: next },
      }
    }
    case "NEXT_PROBLEM":
      if (!state.context || state.phase !== "solved") return state
      return {
        phase: "story",
        bar: "story",
        context: {
          ...state.context,
          problemIndex: state.context.problemIndex === 0 ? 1 : 0,
          guess: null,
          modelState: action.modelState,
          wrongAttempts: 0,
          hintRung: 0,
          bubble: null,
          wasAlreadySolved: false,
          via: null,
        },
      }
    case "RESET_MODEL":
      if (!state.context || state.phase !== "model") return state
      return {
        ...state,
        context: { ...state.context, modelState: action.modelState, via: null },
      }
    case "LEAVE_LESSON":
      return INITIAL_LESSON_STATE
    default: {
      const _exhaustive: never = action
      return _exhaustive
    }
  }
}

const MODELISH: LessonPhase[] = ["model", "wrongBubble", "hint1", "hint2", "hint3"]

export function canLockIn(state: LessonState): boolean {
  return state.context !== null && MODELISH.includes(state.phase)
}

export function isGradingAction(action: LessonAction): boolean {
  return action.type === "LOCK_IN"
}

export function phaseBar(phase: LessonPhase): LessonBar {
  return barForPhase(phase)
}
