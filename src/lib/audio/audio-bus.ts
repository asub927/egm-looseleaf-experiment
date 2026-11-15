/**
 * Dual-Bus Audio Controller for Tactile Math Foundations.
 *
 * Implements Phase 4 of design_draft.md:
 *  - Voice Bus: Preemptible speech synthesis controller with Chromium GC defense,
 *    audio unlock on first user gesture, and cancel-on-interrupt.
 *  - SFX Bus: Polyphonic Web Audio oscillator synthesizer for stamp thuds,
 *    pickup chirps, nudge tones, and victory fanfare.
 *
 * Re-exports standalone functions for backward compatibility with existing code.
 */

export interface VoiceOptions {
  /** Override global voice enabled flag for this utterance */
  enabled?: boolean
  /** Speech rate (defaults to 0.95 for elementary students) */
  rate?: number
  /** Speech pitch (defaults to 1.15 for warm companion tone) */
  pitch?: number
  /** BCP 47 language tag (defaults to 'en-US') */
  lang?: string
  /** Callback fired when speech starts */
  onStart?: () => void
  /** Callback fired on speech word boundary (for subtitle synchronization) */
  onWord?: (word: string, charIndex: number, charLength: number) => void
  /** Callback fired when speech finishes playing */
  onEnd?: () => void
  /** Callback fired on speech error */
  onError?: (error: unknown) => void
}

let audioCtx: AudioContext | null = null
let isUnlocked = false

/**
 * Returns the global Web Audio AudioContext instance, creating it if needed.
 * Resumes context if suspended.
 */
export function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null
  if (!audioCtx) {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (AudioContextClass) {
      audioCtx = new AudioContextClass()
    }
  }
  if (audioCtx && audioCtx.state === "suspended") {
    audioCtx.resume().catch(() => {
      // Browsers may reject resume until a user gesture occurs
    })
  }
  return audioCtx
}

/**
 * Returns whether the audio context has already been unlocked by user gesture.
 */
export function isAudioUnlocked(): boolean {
  return isUnlocked
}

/**
 * Unlocks the Web Audio context and primes SpeechSynthesis on the first user gesture.
 */
export async function unlockAudioContext(): Promise<boolean> {
  if (isUnlocked) return true
  if (typeof window === "undefined") return false
  const ctx = getAudioContext()
  if (!ctx) return false

  if (ctx.state === "running") {
    isUnlocked = true
    return true
  }

  try {
    await ctx.resume()
    isUnlocked = true
    return true
  } catch {
    return false
  }
}

/**
 * Strip decorative emojis and symbols from text before passing to speech synthesis.
 */
export function cleanSpeechText(text: string): string {
  return text
    .replace(/[👓🌟👉✔🦊⭐✏️💡🎉]/gu, "")
    .replace(/\s+/g, " ")
    .trim()
}

/**
 * Preemptible Voice Bus with Chromium GC defense and cancel-on-interrupt.
 */
export class VoiceBus {
  private activeUtterances = new Set<SpeechSynthesisUtterance>()
  private enabled = true
  private currentUtterance: SpeechSynthesisUtterance | null = null

  /**
   * Set global voice narration enabled flag.
   * Cancels active speech when disabled.
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled
    if (!enabled) {
      this.cancel()
    }
  }

  isEnabled(): boolean {
    return this.enabled
  }

  /**
   * Check whether speech synthesis is actively speaking.
   */
  isSpeaking(): boolean {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return false
    return window.speechSynthesis.speaking
  }

  /**
   * Cancel and preempt any ongoing speech synthesis, clearing GC references.
   */
  cancel(): void {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return
    try {
      window.speechSynthesis.cancel()
    } catch (err) {
      console.warn("SpeechSynthesis cancel warning:", err)
    }
    this.activeUtterances.clear()
    this.currentUtterance = null
  }

  /**
   * Speaks the provided text using the Web Speech API.
   * Immediately preempts any ongoing utterance (cancel-on-interrupt).
   * Retains utterance in `activeUtterances` until playback ends (Chromium GC defense).
   *
   * @returns Cancel function for this specific speech request.
   */
  speak(text: string, options?: VoiceOptions): () => void {
    const isVoiceActive = options?.enabled ?? this.enabled
    if (!isVoiceActive || typeof window === "undefined" || !("speechSynthesis" in window)) {
      return () => {}
    }

    // Cancel-on-interrupt: preempt existing speech
    this.cancel()

    const cleanText = cleanSpeechText(text)
    if (!cleanText) return () => {}

    try {
      // Resume if speech engine is in paused state
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume()
      }

      const utterance = new SpeechSynthesisUtterance(cleanText)
      utterance.rate = options?.rate ?? 0.95 // slightly slower for 2nd graders
      utterance.pitch = options?.pitch ?? 1.15 // warm companion tone
      if (options?.lang) utterance.lang = options.lang

      // Chromium GC defense: maintain strong reference until playback completes
      this.activeUtterances.add(utterance)
      this.currentUtterance = utterance

      utterance.onstart = () => {
        options?.onStart?.()
      }

      utterance.onboundary = (event: SpeechSynthesisEvent) => {
        if (event.name === "word") {
          const charIndex = event.charIndex
          const charLength = event.charLength || 1
          const rawWord =
            cleanText.substring(charIndex, charIndex + (event.charLength || 15)).split(/\s+/)[0] ||
            ""
          options?.onWord?.(rawWord, charIndex, charLength)
        }
      }

      const cleanup = () => {
        this.activeUtterances.delete(utterance)
        if (this.currentUtterance === utterance) {
          this.currentUtterance = null
        }
      }

      utterance.onend = () => {
        cleanup()
        options?.onEnd?.()
      }

      utterance.onerror = (event: SpeechSynthesisErrorEvent) => {
        cleanup()
        // Silently swallow intentional cancellations and interruptions
        if (event.error !== "interrupted" && event.error !== "canceled") {
          options?.onError?.(event)
        }
      }

      window.speechSynthesis.speak(utterance)

      return () => {
        if (this.currentUtterance === utterance) {
          this.cancel()
        }
      }
    } catch (err) {
      console.warn("Speech synthesis error:", err)
      options?.onError?.(err)
      return () => {}
    }
  }
}

/**
 * Polyphonic Web Audio oscillator sound effects synthesizer.
 */
export class SfxBus {
  private enabled = true

  setEnabled(enabled: boolean): void {
    this.enabled = enabled
  }

  isEnabled(): boolean {
    return this.enabled
  }

  /**
   * Procedural rubber stamp thud (140Hz -> 32Hz, 80ms).
   */
  playStampThud(): void {
    if (!this.enabled) return
    const ctx = getAudioContext()
    if (!ctx) return
    try {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.frequency.setValueAtTime(140, ctx.currentTime)
      osc.frequency.exponentialRampToValueAtTime(32, ctx.currentTime + 0.08)
      gain.gain.setValueAtTime(0.35, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start()
      osc.stop(ctx.currentTime + 0.08)
    } catch {
      // AudioContext state error
    }
  }

  /**
   * Procedural slice thud / snapping feedback.
   * Filtered 160Hz -> 35Hz exponential pitch drop with 120ms decay (currentTime + 0.12).
   */
  playSliceThud(): void {
    if (!this.enabled) return
    const ctx = getAudioContext()
    if (!ctx) return
    try {
      const osc = ctx.createOscillator()
      const filter = ctx.createBiquadFilter()
      const gain = ctx.createGain()

      osc.type = "sine"
      osc.frequency.setValueAtTime(160, ctx.currentTime)
      osc.frequency.exponentialRampToValueAtTime(35, ctx.currentTime + 0.12)

      filter.type = "lowpass"
      filter.frequency.setValueAtTime(350, ctx.currentTime)
      filter.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.12)

      gain.gain.setValueAtTime(0.35, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.12)

      osc.connect(filter)
      filter.connect(gain)
      gain.connect(ctx.destination)

      osc.start()
      osc.stop(ctx.currentTime + 0.12)
    } catch {
      // AudioContext state error
    }
  }

  /**
   * Procedural token pickup chirp (220Hz -> 360Hz, 50ms).
   */
  playPickupChirp(): void {
    if (!this.enabled) return
    const ctx = getAudioContext()
    if (!ctx) return
    try {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.frequency.setValueAtTime(220, ctx.currentTime)
      osc.frequency.exponentialRampToValueAtTime(360, ctx.currentTime + 0.05)
      gain.gain.setValueAtTime(0.2, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start()
      osc.stop(ctx.currentTime + 0.05)
    } catch {
      // AudioContext state error
    }
  }

  /**
   * Procedural nudge / misconception tone (140Hz -> 90Hz, 120ms).
   */
  playNudgeTone(): void {
    if (!this.enabled) return
    const ctx = getAudioContext()
    if (!ctx) return
    try {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.frequency.setValueAtTime(140, ctx.currentTime)
      osc.frequency.exponentialRampToValueAtTime(90, ctx.currentTime + 0.12)
      gain.gain.setValueAtTime(0.2, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.12)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start()
      osc.stop(ctx.currentTime + 0.12)
    } catch {
      // AudioContext state error
    }
  }

  /**
   * Procedural victory fanfare: C5, E5, G5, C6 arpeggio.
   */
  playVictoryFanfare(): void {
    if (!this.enabled) return
    const ctx = getAudioContext()
    if (!ctx) return
    try {
      const notes = [523.25, 659.25, 783.99, 1046.5] // C5, E5, G5, C6
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        const startTime = ctx.currentTime + i * 0.1
        osc.frequency.setValueAtTime(freq, startTime)
        gain.gain.setValueAtTime(0.25, startTime)
        gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.28)
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.start(startTime)
        osc.stop(startTime + 0.28)
      })
    } catch {
      // AudioContext state error
    }
  }
}

/**
 * Dual-bus audio controller coordinating Voice Bus and SFX Bus.
 */
export class AudioBusController {
  readonly voice: VoiceBus = new VoiceBus()
  readonly sfx: SfxBus = new SfxBus()

  /**
   * Unlock Web Audio context and prime speech synthesis.
   */
  unlock(): Promise<boolean> {
    return unlockAudioContext()
  }

  /**
   * Set global mute status across both Voice and SFX buses.
   */
  setMuted(muted: boolean): void {
    this.voice.setEnabled(!muted)
    this.sfx.setEnabled(!muted)
  }

  /**
   * Check whether both buses are muted.
   */
  isMuted(): boolean {
    return !this.voice.isEnabled() && !this.sfx.isEnabled()
  }
}

/**
 * Singleton AudioBus controller instance.
 */
export const audioBus = new AudioBusController()

// Automatic unlock on first user gesture (touch, click, keydown)
if (typeof window !== "undefined") {
  const handleFirstGesture = () => {
    audioBus.unlock()
    window.removeEventListener("pointerdown", handleFirstGesture)
    window.removeEventListener("touchstart", handleFirstGesture)
    window.removeEventListener("keydown", handleFirstGesture)
  }
  window.addEventListener("pointerdown", handleFirstGesture, { passive: true, once: true })
  window.addEventListener("touchstart", handleFirstGesture, { passive: true, once: true })
  window.addEventListener("keydown", handleFirstGesture, { passive: true, once: true })
}

// ============================================================================
// Backward-compatible Standalone Exports (delegated to audioBus)
// ============================================================================

export function playStampThud(): void {
  audioBus.sfx.playStampThud()
}

export function playSliceThud(): void {
  audioBus.sfx.playSliceThud()
}

export function playPickupChirp(): void {
  audioBus.sfx.playPickupChirp()
}

export function playNudgeTone(): void {
  audioBus.sfx.playNudgeTone()
}

export function playVictoryFanfare(): void {
  audioBus.sfx.playVictoryFanfare()
}

export function speakSpeech(text: string, enabled: boolean = true): void {
  audioBus.voice.speak(text, { enabled })
}

export function cancelSpeech(): void {
  audioBus.voice.cancel()
}
