/**
 * Elephant-Goldfish: Tactile Elementary Math
 * Explicit Finite State Machine for Speech & Subtitle Narration.
 *
 * Manages synchronous state and speech synthesis lifecycle:
 *  - idle: Audio bus ready; not speaking.
 *  - speaking: Utterance active; word boundaries synchronized with subtitles.
 *  - paused: Utterance paused.
 *  - error: Error encountered; fallback handled cleanly.
 */

import type { MascotPose } from "../ink/art/mascots/index.ts"

export interface WordToken {
  word: string
  startIndex: number
  endIndex: number
}

export type AudioNarrationPhase = "idle" | "speaking" | "paused" | "error"

export interface AudioNarrationState {
  readonly phase: AudioNarrationPhase
  readonly enabled: boolean
  readonly currentText: string
  readonly cleanedText: string
  readonly tokens: readonly WordToken[]
  readonly currentWordIndex: number
  readonly currentWord: string | null
  readonly mascotPose: MascotPose
  readonly lastError: unknown | null
}

export type AudioNarrationEvent =
  | {
      type: "PREPARE"
      text: string
      cleanedText: string
      tokens: WordToken[]
      pose?: MascotPose
    }
  | { type: "START" }
  | { type: "WORD_BOUNDARY"; wordIndex: number; word: string }
  | { type: "END"; defaultIdlePose?: MascotPose; resetPoseOnEnd?: boolean }
  | { type: "STOP" }
  | { type: "ERROR"; error: unknown }
  | { type: "SET_ENABLED"; enabled: boolean }
  | { type: "SET_POSE"; pose: MascotPose }

export function createInitialAudioState(
  enabled: boolean = true,
  defaultPose: MascotPose = "idle",
): AudioNarrationState {
  return {
    phase: "idle",
    enabled,
    currentText: "",
    cleanedText: "",
    tokens: [],
    currentWordIndex: -1,
    currentWord: null,
    mascotPose: defaultPose,
    lastError: null,
  }
}

export function audioNarrationReducer(
  state: AudioNarrationState,
  event: AudioNarrationEvent,
): AudioNarrationState {
  switch (event.type) {
    case "PREPARE": {
      return {
        ...state,
        phase: "idle",
        currentText: event.text,
        cleanedText: event.cleanedText,
        tokens: event.tokens,
        currentWordIndex: -1,
        currentWord: null,
        mascotPose: event.pose ?? state.mascotPose,
        lastError: null,
      }
    }

    case "START": {
      const firstToken = state.tokens[0]
      return {
        ...state,
        phase: "speaking",
        currentWordIndex: firstToken ? 0 : -1,
        currentWord: firstToken ? firstToken.word : null,
        lastError: null,
      }
    }

    case "WORD_BOUNDARY": {
      if (state.phase !== "speaking") return state
      return {
        ...state,
        currentWordIndex: event.wordIndex,
        currentWord: event.word,
      }
    }

    case "END": {
      return {
        ...state,
        phase: "idle",
        currentWordIndex: -1,
        currentWord: null,
        mascotPose:
          event.resetPoseOnEnd && event.defaultIdlePose ? event.defaultIdlePose : state.mascotPose,
      }
    }

    case "STOP": {
      return {
        ...state,
        phase: "idle",
        currentWordIndex: -1,
        currentWord: null,
      }
    }

    case "ERROR": {
      return {
        ...state,
        phase: "error",
        currentWordIndex: -1,
        currentWord: null,
        lastError: event.error,
      }
    }

    case "SET_ENABLED": {
      return {
        ...state,
        enabled: event.enabled,
        phase: !event.enabled && state.phase === "speaking" ? "idle" : state.phase,
        currentWordIndex: !event.enabled ? -1 : state.currentWordIndex,
        currentWord: !event.enabled ? null : state.currentWord,
      }
    }

    case "SET_POSE": {
      return {
        ...state,
        mascotPose: event.pose,
      }
    }

    default:
      return state
  }
}
