"use client"

import * as React from "react"
import { audioBus, cleanSpeechText, type VoiceOptions } from "../lib/audio/audio-bus.ts"
import type { MascotPose } from "../lib/ink/art/mascots/index.ts"
import {
  audioNarrationReducer,
  createInitialAudioState,
  type AudioNarrationState,
  type AudioNarrationEvent,
  type AudioNarrationPhase,
} from "../lib/state/audio-narration-machine.ts"

export type { AudioNarrationState, AudioNarrationEvent, AudioNarrationPhase }

export interface WordToken {
  word: string
  startIndex: number
  endIndex: number
}

export interface UseAudioNarrationOptions {
  /** Whether voice narration is enabled (defaults to true) */
  enabled?: boolean
  /** Speech rate (defaults to 0.95 for primary students) */
  rate?: number
  /** Speech pitch (defaults to 1.15 warm companion tone) */
  pitch?: number
  /** Default mascot pose when speech is idle */
  defaultIdlePose?: MascotPose
  /** Reset mascot pose to default idle pose when speech finishes (default: false) */
  resetPoseOnEnd?: boolean
  /** Callback fired when speech synthesis starts */
  onStart?: () => void
  /** Callback fired when speech synthesis finishes naturally */
  onEnd?: () => void
  /** Callback fired on speech synthesis error */
  onError?: (err: unknown) => void
}

export interface SpeakOptions {
  /** Desired mascot pose during this narration */
  pose?: MascotPose
  /** Temporary speech rate override */
  rate?: number
  /** Temporary speech pitch override */
  pitch?: number
  /** Override global voice enabled flag for this utterance */
  enabled?: boolean
  /** Callback fired when this specific speech completes */
  onEnd?: () => void
}

export interface UseAudioNarrationReturn {
  /** Whether speech synthesis is actively playing */
  isSpeaking: boolean
  /** Raw text of current speech (including emojis/formatting) */
  currentText: string
  /** Cleaned text delivered to the speech engine */
  cleanedText: string
  /** Array of tokenized words from the current speech */
  words: string[]
  /** Tokenized word objects with character offset ranges */
  tokens: WordToken[]
  /** Currently active spoken word (synchronized via speech word boundaries) */
  currentWord: string | null
  /** 0-based index of the currently active word in `words`, or -1 if idle */
  currentWordIndex: number
  /** Synchronized mascot pose */
  mascotPose: MascotPose
  /** Manually update mascot pose */
  setMascotPose: (pose: MascotPose) => void
  /** Narrate text aloud with synchronized mascot pose and subtitle words */
  speak: (text: string, options?: SpeakOptions) => void
  /** Stop any ongoing speech narration */
  stop: () => void
  /** Helper returning true if word at index is currently being spoken */
  isWordActive: (wordIndex: number) => boolean
  /** Audio voice narration enabled state */
  enabled: boolean
  /** Toggle audio voice narration on or off */
  setEnabled: (enabled: boolean) => void
  /** Explicit State Machine snapshot for Agent (AX) and Developer (DX) introspection */
  machineState: AudioNarrationState
  /** Dispatch explicit audio narration event */
  dispatch: (event: AudioNarrationEvent) => void
}

/**
 * Tokenizes text into individual words along with character start and end offsets.
 */
export function tokenizeWords(text: string): WordToken[] {
  const tokens: WordToken[] = []
  const regex = /\S+/g
  let match: RegExpExecArray | null
  while ((match = regex.exec(text)) !== null) {
    tokens.push({
      word: match[0],
      startIndex: match.index,
      endIndex: match.index + match[0].length,
    })
  }
  return tokens
}

/**
 * React hook synchronizing mascot speech state with speech synthesis playback,
 * supporting word-by-word subtitle highlighting and active speaking state.
 */
export function useAudioNarration(
  initialOptions: UseAudioNarrationOptions = {},
): UseAudioNarrationReturn {
  const {
    enabled: initialEnabled = true,
    rate: defaultRate = 0.95,
    pitch: defaultPitch = 1.15,
    defaultIdlePose = "idle",
    resetPoseOnEnd = false,
    onStart: globalOnStart,
    onEnd: globalOnEnd,
    onError: globalOnError,
  } = initialOptions

  const [state, dispatch] = React.useReducer(audioNarrationReducer, initialEnabled, (en) =>
    createInitialAudioState(en, defaultIdlePose),
  )

  // Track cancel function for active utterance
  const cancelRef = React.useRef<(() => void) | null>(null)
  const tokensRef = React.useRef<readonly WordToken[]>([])
  tokensRef.current = state.tokens

  const setEnabled = React.useCallback((nextEnabled: boolean) => {
    dispatch({ type: "SET_ENABLED", enabled: nextEnabled })
    audioBus.voice.setEnabled(nextEnabled)
  }, [])

  const setMascotPose = React.useCallback((pose: MascotPose) => {
    dispatch({ type: "SET_POSE", pose })
  }, [])

  const stop = React.useCallback(() => {
    if (cancelRef.current) {
      cancelRef.current()
      cancelRef.current = null
    } else {
      audioBus.voice.cancel()
    }
    dispatch({ type: "STOP" })
  }, [])

  const speak = React.useCallback(
    (text: string, options?: SpeakOptions) => {
      // Preempt any active speech
      stop()

      const cleaned = cleanSpeechText(text)
      const parsedTokens = tokenizeWords(cleaned)

      dispatch({
        type: "PREPARE",
        text,
        cleanedText: cleaned,
        tokens: parsedTokens,
        pose: options?.pose,
      })
      tokensRef.current = parsedTokens

      const voiceActive = options?.enabled ?? state.enabled
      if (!voiceActive || !cleaned) {
        // In silent mode, skip audio engine playback
        return
      }

      const voiceOptions: VoiceOptions = {
        enabled: true,
        rate: options?.rate ?? defaultRate,
        pitch: options?.pitch ?? defaultPitch,
        onStart: () => {
          dispatch({ type: "START" })
          globalOnStart?.()
        },
        onWord: (_word: string, charIndex: number) => {
          const currentTokens = tokensRef.current
          if (!currentTokens.length) return

          // Find token matching charIndex
          const idx = currentTokens.findIndex(
            (t) => charIndex >= t.startIndex && charIndex <= t.endIndex,
          )

          if (idx !== -1) {
            dispatch({
              type: "WORD_BOUNDARY",
              wordIndex: idx,
              word: currentTokens[idx].word,
            })
          } else {
            // Find closest token ahead of charIndex
            const nextIdx = currentTokens.findIndex((t) => t.startIndex >= charIndex)
            if (nextIdx !== -1) {
              dispatch({
                type: "WORD_BOUNDARY",
                wordIndex: nextIdx,
                word: currentTokens[nextIdx].word,
              })
            }
          }
        },
        onEnd: () => {
          cancelRef.current = null
          dispatch({
            type: "END",
            defaultIdlePose,
            resetPoseOnEnd,
          })
          options?.onEnd?.()
          globalOnEnd?.()
        },
        onError: (err) => {
          cancelRef.current = null
          dispatch({ type: "ERROR", error: err })
          globalOnError?.(err)
        },
      }

      cancelRef.current = audioBus.voice.speak(cleaned, voiceOptions)
    },
    [
      defaultIdlePose,
      defaultPitch,
      defaultRate,
      state.enabled,
      globalOnEnd,
      globalOnError,
      globalOnStart,
      resetPoseOnEnd,
      stop,
    ],
  )

  const isWordActive = React.useCallback(
    (wordIndex: number) => {
      return state.phase === "speaking" && state.currentWordIndex === wordIndex
    },
    [state.phase, state.currentWordIndex],
  )

  // Cleanup speech synthesis on unmount
  React.useEffect(() => {
    return () => {
      if (cancelRef.current) {
        cancelRef.current()
      }
      audioBus.voice.cancel()
    }
  }, [])

  const words = React.useMemo(() => state.tokens.map((t) => t.word), [state.tokens])

  return {
    isSpeaking: state.phase === "speaking",
    currentText: state.currentText,
    cleanedText: state.cleanedText,
    words,
    tokens: state.tokens as WordToken[],
    currentWord: state.currentWord,
    currentWordIndex: state.currentWordIndex,
    mascotPose: state.mascotPose,
    setMascotPose,
    speak,
    stop,
    isWordActive,
    enabled: state.enabled,
    setEnabled,
    machineState: state,
    dispatch,
  }
}
