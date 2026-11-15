"use client"

import * as React from "react"
import { audioBus, cleanSpeechText, type VoiceOptions } from "../lib/audio/audio-bus.ts"
import type { MascotPose } from "../lib/ink/art/mascots/index.ts"

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

  const [enabled, setEnabledState] = React.useState<boolean>(initialEnabled)
  const [isSpeaking, setIsSpeaking] = React.useState<boolean>(false)
  const [currentText, setCurrentText] = React.useState<string>("")
  const [cleanedText, setCleanedText] = React.useState<string>("")
  const [tokens, setTokens] = React.useState<WordToken[]>([])
  const [currentWordIndex, setCurrentWordIndex] = React.useState<number>(-1)
  const [currentWord, setCurrentWord] = React.useState<string | null>(null)
  const [mascotPose, setMascotPose] = React.useState<MascotPose>(defaultIdlePose)

  // Track cancel function for active utterance
  const cancelRef = React.useRef<(() => void) | null>(null)
  const tokensRef = React.useRef<WordToken[]>([])
  tokensRef.current = tokens

  const setEnabled = React.useCallback((nextEnabled: boolean) => {
    setEnabledState(nextEnabled)
    audioBus.voice.setEnabled(nextEnabled)
  }, [])

  const stop = React.useCallback(() => {
    if (cancelRef.current) {
      cancelRef.current()
      cancelRef.current = null
    } else {
      audioBus.voice.cancel()
    }
    setIsSpeaking(false)
    setCurrentWordIndex(-1)
    setCurrentWord(null)
  }, [])

  const speak = React.useCallback(
    (text: string, options?: SpeakOptions) => {
      // Preempt any active speech
      stop()

      const cleaned = cleanSpeechText(text)
      const parsedTokens = tokenizeWords(cleaned)

      setCurrentText(text)
      setCleanedText(cleaned)
      setTokens(parsedTokens)
      tokensRef.current = parsedTokens
      setCurrentWordIndex(-1)
      setCurrentWord(null)

      if (options?.pose) {
        setMascotPose(options.pose)
      }

      const voiceActive = options?.enabled ?? enabled
      if (!voiceActive || !cleaned) {
        // In silent mode, skip audio engine playback
        return
      }

      const voiceOptions: VoiceOptions = {
        enabled: true,
        rate: options?.rate ?? defaultRate,
        pitch: options?.pitch ?? defaultPitch,
        onStart: () => {
          setIsSpeaking(true)
          if (parsedTokens.length > 0) {
            setCurrentWordIndex(0)
            setCurrentWord(parsedTokens[0].word)
          }
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
            setCurrentWordIndex(idx)
            setCurrentWord(currentTokens[idx].word)
          } else {
            // Find closest token ahead of charIndex
            const nextIdx = currentTokens.findIndex((t) => t.startIndex >= charIndex)
            if (nextIdx !== -1) {
              setCurrentWordIndex(nextIdx)
              setCurrentWord(currentTokens[nextIdx].word)
            }
          }
        },
        onEnd: () => {
          setIsSpeaking(false)
          setCurrentWordIndex(-1)
          setCurrentWord(null)
          cancelRef.current = null
          if (resetPoseOnEnd) {
            setMascotPose(defaultIdlePose)
          }
          options?.onEnd?.()
          globalOnEnd?.()
        },
        onError: (err) => {
          setIsSpeaking(false)
          setCurrentWordIndex(-1)
          setCurrentWord(null)
          cancelRef.current = null
          globalOnError?.(err)
        },
      }

      cancelRef.current = audioBus.voice.speak(cleaned, voiceOptions)
    },
    [
      defaultIdlePose,
      defaultPitch,
      defaultRate,
      enabled,
      globalOnEnd,
      globalOnError,
      globalOnStart,
      resetPoseOnEnd,
      stop,
    ],
  )

  const isWordActive = React.useCallback(
    (wordIndex: number) => {
      return isSpeaking && currentWordIndex === wordIndex
    },
    [isSpeaking, currentWordIndex],
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

  const words = React.useMemo(() => tokens.map((t) => t.word), [tokens])

  return {
    isSpeaking,
    currentText,
    cleanedText,
    words,
    tokens,
    currentWord,
    currentWordIndex,
    mascotPose,
    setMascotPose,
    speak,
    stop,
    isWordActive,
    enabled,
    setEnabled,
  }
}
