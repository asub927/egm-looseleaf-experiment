/**
 * Tactile Web Audio Synthesizer and Speech Narration Engine.
 * Re-exports from the unified Dual-Bus Audio Controller (src/lib/audio/audio-bus.ts).
 */

export {
  getAudioContext,
  unlockAudioContext,
  cleanSpeechText,
  playStampThud,
  playSliceThud,
  playPickupChirp,
  playNudgeTone,
  playVictoryFanfare,
  speakSpeech,
  cancelSpeech,
  audioBus,
  AudioBusController,
  VoiceBus,
  SfxBus,
  type VoiceOptions,
} from "./audio-bus.ts"

export {
  playWoodThock,
  playWoodLift,
  playWoodSettle,
  playPentatonicHarmony,
} from "./wood-thock-synth.ts"
