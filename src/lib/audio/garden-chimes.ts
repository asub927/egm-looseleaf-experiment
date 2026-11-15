/**
 * Whimsical Web Audio Synthesizer: Kalimba & Garden Chimes.
 *
 * Provides organic wood marimba / kalimba tones for the Whispering Vine (NC.2.OA.2)
 * using dual-oscillator synthesis (sine fundamental + triangle overtone).
 *
 * Mapped to a 10-node pentatonic scale spanning C4 (261.63Hz) to C6 (1046.50Hz).
 * Includes graceful no-op fallbacks for Node.js test runners and non-audio environments.
 */

import { getAudioContext } from './audio-bus.ts'

// Pentatonic Garden Chime frequencies for growth nodes 1 through 10 (C4 to C6)
export const CHIME_FREQUENCIES: readonly number[] = [
  261.63, // Node 1:  C4
  293.66, // Node 2:  D4
  329.63, // Node 3:  E4
  392.00, // Node 4:  G4
  440.00, // Node 5:  A4
  523.25, // Node 6:  C5
  587.33, // Node 7:  D5
  659.25, // Node 8:  E5
  783.99, // Node 9:  G5
  1046.50, // Node 10: C6 (Top Blossom)
]

/**
 * Plays a warm wooden kalimba/marimba pluck for a growth node.
 *
 * @param nodeIndex 0-based node index (0 to 9), clamped to valid bounds
 * @param pitchOffset Optional semitone pitch shift (e.g. +2, -4)
 */
export function playPluck(nodeIndex: number, pitchOffset: number = 0): void {
  try {
    const ctx = getAudioContext()
    if (!ctx) return

    // Safe bounds clamping for node index
    const safeIndex = Number.isFinite(nodeIndex)
      ? Math.max(0, Math.min(CHIME_FREQUENCIES.length - 1, Math.round(nodeIndex)))
      : 0

    const baseFreq = CHIME_FREQUENCIES[safeIndex]
    const safeOffset = Number.isFinite(pitchOffset) ? pitchOffset : 0
    const freq = baseFreq * Math.pow(2, safeOffset / 12)

    if (!Number.isFinite(freq) || freq <= 0) return

    const now = ctx.currentTime

    // Dual-oscillator synthesis for warm wooden kalimba timbre:
    // osc1: Pure sine wave fundamental
    // osc2: Triangle wave 2nd harmonic (tuned to 2.01x for acoustic chorus warmth)
    const osc1 = ctx.createOscillator()
    const osc2 = ctx.createOscillator()
    const gain = ctx.createGain()

    osc1.type = 'sine'
    osc2.type = 'triangle'

    osc1.frequency.setValueAtTime(freq, now)
    osc2.frequency.setValueAtTime(freq * 2.01, now)

    // Percussive envelope: rapid attack + 350ms exponential decay
    gain.gain.setValueAtTime(0.3, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35)

    osc1.connect(gain)
    osc2.connect(gain)
    gain.connect(ctx.destination)

    osc1.start(now)
    osc2.start(now)
    osc1.stop(now + 0.36)
    osc2.stop(now + 0.36)
  } catch {
    // Graceful no-op fallback in test environments or if Web Audio is suspended
  }
}

/**
 * Plays an ascending celebratory pentatonic wind chime arpeggio upon full vine bloom.
 * Arpeggiates [C5, E5, G5, C6] across 440ms with shimmering 600ms ring-out.
 */
export function playCelebrationChimes(): void {
  try {
    const ctx = getAudioContext()
    if (!ctx) return

    // Celebratory pentatonic chord: C5, E5, G5, C6
    const chord = [523.25, 659.25, 783.99, 1046.50]

    chord.forEach((freq, idx) => {
      setTimeout(() => {
        try {
          const currentCtx = getAudioContext()
          if (!currentCtx) return

          const now = currentCtx.currentTime
          const osc = currentCtx.createOscillator()
          const gain = currentCtx.createGain()

          osc.type = 'sine'
          osc.frequency.setValueAtTime(freq, now)

          gain.gain.setValueAtTime(0.2, now)
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6)

          osc.connect(gain)
          gain.connect(currentCtx.destination)

          osc.start(now)
          osc.stop(now + 0.6)
        } catch {
          // Graceful fallback
        }
      }, idx * 110)
    })
  } catch {
    // Graceful fallback
  }
}
