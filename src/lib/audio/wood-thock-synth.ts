/**
 * Procedural Hollow Wood Block Synthesizer.
 *
 * Implements Section 6 of docs/designs/zen-garden-landing.md:
 * Client-side Web Audio API resonant hollow wood block 'THOCK' synthesizer.
 * Pure procedural math, zero external audio assets, 100% offline COPPA-compliant.
 */

import { getAudioContext } from "./audio-bus.ts"

/**
 * Procedural Hollow Wood Block Synthesizer.
 * Synthesizes physical impact + internal cavity air resonance of dense maple/cedar joinery.
 *
 * @param ctx Optional AudioContext instance (retrieved via getAudioContext() if omitted)
 * @param pitchMultiplier Semitone or harmonic multiplier (default 1.0 = 480Hz fundamental)
 */
export function playWoodThock(ctx?: AudioContext | null, pitchMultiplier: number = 1.0): void {
  try {
    const audioCtx = ctx ?? getAudioContext()
    if (!audioCtx) return

    if (audioCtx.state === "suspended") {
      audioCtx.resume().catch(() => {
        // User gesture may still be pending
      })
    }

    const safeMultiplier =
      Number.isFinite(pitchMultiplier) && pitchMultiplier > 0 ? pitchMultiplier : 1.0
    const now = audioCtx.currentTime

    // 1. Rapid Pitch Decay: Simulates sudden wood deformation and release (480Hz -> 140Hz in 65ms)
    const baseFreq = 480 * safeMultiplier
    const osc = audioCtx.createOscillator()
    const bandpass = audioCtx.createBiquadFilter()
    const gain = audioCtx.createGain()

    osc.type = "sine"
    osc.frequency.setValueAtTime(baseFreq, now)
    osc.frequency.exponentialRampToValueAtTime(Math.max(20, baseFreq * 0.29), now + 0.065)

    // 2. High-Q Bandpass Filter: Models resonant chamber acoustics of hollow cedar/hinoki
    bandpass.type = "bandpass"
    bandpass.frequency.setValueAtTime(580 * safeMultiplier, now)
    bandpass.Q.setValueAtTime(7.5, now)

    // 3. Fast Exponential Envelope: Crisp attack with immediate decay
    gain.gain.setValueAtTime(0.85, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.11)

    // 4. Subtle Acoustic Strike Transient (Wood fiber contact click)
    try {
      const bufferSize = Math.max(1, Math.floor(audioCtx.sampleRate * 0.008)) // 8ms
      const noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate)
      const data = noiseBuffer.getChannelData(0)
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.3))
      }
      const clickNode = audioCtx.createBufferSource()
      clickNode.buffer = noiseBuffer

      const clickFilter = audioCtx.createBiquadFilter()
      clickFilter.type = "bandpass"
      clickFilter.frequency.setValueAtTime(2200, now)
      clickFilter.Q.setValueAtTime(3.0, now)

      const clickGain = audioCtx.createGain()
      clickGain.gain.setValueAtTime(0.25, now)
      clickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.008)

      clickNode.connect(clickFilter)
      clickFilter.connect(clickGain)
      clickGain.connect(audioCtx.destination)

      clickNode.start(now)
      clickNode.stop(now + 0.01)
    } catch {
      // Audio buffer creation fallback
    }

    osc.connect(bandpass)
    bandpass.connect(gain)
    gain.connect(audioCtx.destination)

    osc.start(now)
    osc.stop(now + 0.12)
  } catch {
    // Non-audio environment / Node runner fallback
  }
}

/**
 * Procedural Hollow Wood Lift Sound.
 * Gentle acoustic click when a dovetail piece is picked up / dislodged from its rest.
 */
export function playWoodLift(ctx?: AudioContext | null): void {
  try {
    const audioCtx = ctx ?? getAudioContext()
    if (!audioCtx) return

    if (audioCtx.state === "suspended") {
      audioCtx.resume().catch(() => {})
    }

    const now = audioCtx.currentTime
    const osc = audioCtx.createOscillator()
    const filter = audioCtx.createBiquadFilter()
    const gain = audioCtx.createGain()

    osc.type = "triangle"
    osc.frequency.setValueAtTime(620, now)
    osc.frequency.exponentialRampToValueAtTime(840, now + 0.035)

    filter.type = "bandpass"
    filter.frequency.setValueAtTime(750, now)
    filter.Q.setValueAtTime(4.0, now)

    gain.gain.setValueAtTime(0.2, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.045)

    osc.connect(filter)
    filter.connect(gain)
    gain.connect(audioCtx.destination)

    osc.start(now)
    osc.stop(now + 0.05)
  } catch {
    // Graceful no-op in non-audio environments
  }
}

/**
 * Procedural Wood Settle Sound.
 * Soft thud when a block is placed back onto the tray without snapping.
 */
export function playWoodSettle(ctx?: AudioContext | null): void {
  try {
    const audioCtx = ctx ?? getAudioContext()
    if (!audioCtx) return

    if (audioCtx.state === "suspended") {
      audioCtx.resume().catch(() => {})
    }

    const now = audioCtx.currentTime
    const osc = audioCtx.createOscillator()
    const gain = audioCtx.createGain()

    osc.type = "sine"
    osc.frequency.setValueAtTime(210, now)
    osc.frequency.exponentialRampToValueAtTime(90, now + 0.06)

    gain.gain.setValueAtTime(0.25, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06)

    osc.connect(gain)
    gain.connect(audioCtx.destination)

    osc.start(now)
    osc.stop(now + 0.07)
  } catch {
    // Graceful no-op
  }
}

/**
 * Celebratory Pentatonic Cascade Chime.
 * Plays a warm 5-note ascending wood chime cascade when all 5 joinery pieces are locked in place.
 */
export function playPentatonicHarmony(ctx?: AudioContext | null): void {
  try {
    const audioCtx = ctx ?? getAudioContext()
    if (!audioCtx) return

    // Pentatonic scale multipliers based on E4, F#4, G#4, B4, C#5
    const multipliers = [0.85, 0.95, 1.1, 1.25, 1.45]

    multipliers.forEach((mult, index) => {
      setTimeout(() => {
        playWoodThock(audioCtx, mult)
      }, index * 85)
    })
  } catch {
    // Graceful fallback
  }
}
