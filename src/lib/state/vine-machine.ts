/**
 * Elephant-Goldfish: Tactile Elementary Math
 * Explicit Finite State Machine for Whispering Vine Manipulative.
 *
 * Implements NC.2.OA.2 "Making 10" pedagogical learning loop:
 *  - predicting: Prompting learner to estimate needed blossoms to reach 10.
 *  - exploring: Direct manipulation (drag/tap/keyboard) along the bamboo vine.
 *  - evaluating: Diagnostic analysis after pressing "Lock It In!".
 *  - reflecting: Metacognitive pause if prediction differed from actual.
 *  - demonstrating: Autonomous step-by-step snail crawling demonstration.
 *  - solved: Target 10 reached, celebration active.
 */

import type {
  VineProblemSeed,
  VineSubmissionVia,
  VineEvaluationResult,
} from "../math/vine-evaluator.ts"

export type VinePhase =
  "predicting" | "exploring" | "evaluating" | "reflecting" | "demonstrating" | "solved"

export interface VineState {
  readonly phase: VinePhase
  readonly currentSeed: VineProblemSeed
  readonly predictedGuess: number | null
  readonly added: number
  readonly isDragging: boolean
  readonly hasReflected: boolean
  readonly calmMode: boolean
  readonly evaluation: VineEvaluationResult | null
  readonly submissionVia: VineSubmissionVia
}

export type VineEvent =
  | { type: "SELECT_SEED"; seed: VineProblemSeed }
  | { type: "SELECT_PREDICTION"; guess: number }
  | { type: "UPDATE_ADDED"; added: number; via: VineSubmissionVia }
  | { type: "START_DRAG" }
  | { type: "STOP_DRAG" }
  | { type: "LOCK_IN"; evaluation: VineEvaluationResult }
  | { type: "START_DEMO" }
  | { type: "STEP_DEMO"; currentStep: number }
  | { type: "FINISH_DEMO" }
  | { type: "COMPLETE_REFLECTION" }
  | { type: "TOGGLE_CALM"; calmMode?: boolean }

export function createInitialVineState(seed: VineProblemSeed): VineState {
  return {
    phase: "predicting",
    currentSeed: seed,
    predictedGuess: null,
    added: 0,
    isDragging: false,
    hasReflected: false,
    calmMode: false,
    evaluation: null,
    submissionVia: "drag",
  }
}

export function vineReducer(state: VineState, event: VineEvent): VineState {
  switch (event.type) {
    case "SELECT_SEED": {
      return {
        ...createInitialVineState(event.seed),
        calmMode: state.calmMode, // preserve user's calm preference
      }
    }

    case "SELECT_PREDICTION": {
      const nextGuess = event.guess === state.predictedGuess ? null : event.guess
      return {
        ...state,
        predictedGuess: nextGuess,
        phase:
          nextGuess === null
            ? "predicting"
            : state.phase === "predicting"
              ? "exploring"
              : state.phase,
      }
    }

    case "UPDATE_ADDED": {
      const maxAdded = Math.max(0, state.currentSeed.whole - state.currentSeed.known)
      const clamped = Math.max(0, Math.min(maxAdded, Math.round(event.added)))

      return {
        ...state,
        added: clamped,
        submissionVia: event.via,
        evaluation: null,
        phase:
          state.phase === "solved" || state.phase === "evaluating" || state.phase === "reflecting"
            ? state.predictedGuess === null
              ? "predicting"
              : "exploring"
            : state.phase,
      }
    }

    case "START_DRAG": {
      if (state.phase === "demonstrating") return state
      return {
        ...state,
        isDragging: true,
        submissionVia: "drag",
      }
    }

    case "STOP_DRAG": {
      return {
        ...state,
        isDragging: false,
      }
    }

    case "LOCK_IN": {
      if (state.phase === "demonstrating") return state

      const isCorrect = event.evaluation.verdict === "correct"
      const needsReflection =
        isCorrect && event.evaluation.mismatchReflectionNeeded && !state.hasReflected

      let nextPhase: VinePhase = "evaluating"
      if (isCorrect) {
        nextPhase = needsReflection ? "reflecting" : "solved"
      }

      return {
        ...state,
        phase: nextPhase,
        evaluation: event.evaluation,
        isDragging: false,
      }
    }

    case "START_DEMO": {
      return {
        ...state,
        phase: "demonstrating",
        evaluation: null,
        added: 0,
        submissionVia: "tap",
      }
    }

    case "STEP_DEMO": {
      return {
        ...state,
        phase: "demonstrating",
        added: event.currentStep,
      }
    }

    case "FINISH_DEMO": {
      return {
        ...state,
        phase: state.predictedGuess === null ? "predicting" : "exploring",
      }
    }

    case "COMPLETE_REFLECTION": {
      return {
        ...state,
        hasReflected: true,
        phase: "solved",
      }
    }

    case "TOGGLE_CALM": {
      return {
        ...state,
        calmMode: event.calmMode !== undefined ? event.calmMode : !state.calmMode,
      }
    }

    default:
      return state
  }
}
