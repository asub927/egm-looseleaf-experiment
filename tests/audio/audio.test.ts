import test from "node:test"
import assert from "node:assert/strict"
import {
  audioBus,
  AudioBusController,
  VoiceBus,
  SfxBus,
  cleanSpeechText,
  playStampThud,
  playPickupChirp,
  playNudgeTone,
  playVictoryFanfare,
  speakSpeech,
  cancelSpeech,
} from "../../src/lib/audio/audio-bus.ts"
import { tokenizeWords } from "../../src/hooks/use-audio-narration.ts"

test("cleanSpeechText: Strips decorative emojis and extra whitespace", () => {
  const raw = "Hi Kit! 🦊 Can you bake 12 cookies 🍪 into 3 equal rows? 🌟 Click ✔️ below! ✏️💡"
  const cleaned = cleanSpeechText(raw)
  assert.equal(cleaned.includes("🦊"), false)
  assert.equal(cleaned.includes("🌟"), false)
  assert.equal(cleaned.includes("✏️"), false)
  assert.equal(cleaned.includes("💡"), false)
  assert.equal(cleaned.includes("✔️"), false)
  assert.match(cleaned, /Hi Kit! Can you bake 12 cookies/)
})

test("tokenizeWords: Accurately parses word tokens with start and end offsets", () => {
  const text = "Three equal rows of four"
  const tokens = tokenizeWords(text)
  assert.equal(tokens.length, 5)

  assert.equal(tokens[0].word, "Three")
  assert.equal(tokens[0].startIndex, 0)
  assert.equal(tokens[0].endIndex, 5)

  assert.equal(tokens[1].word, "equal")
  assert.equal(tokens[1].startIndex, 6)
  assert.equal(tokens[1].endIndex, 11)

  assert.equal(tokens[4].word, "four")
  assert.equal(tokens[4].startIndex, 20)
  assert.equal(tokens[4].endIndex, 24)
})

test("VoiceBus: Preemptible cancel and enable/disable state", () => {
  const voice = new VoiceBus()
  assert.equal(voice.isEnabled(), true)

  voice.setEnabled(false)
  assert.equal(voice.isEnabled(), false)

  // In headless Node, speak returns safe no-op cleanup
  const cancel = voice.speak("Hello world")
  assert.equal(typeof cancel, "function")
  cancel()

  voice.setEnabled(true)
  assert.equal(voice.isEnabled(), true)
})

test("SfxBus: Polyphonic synthesizer handles headless calls gracefully", () => {
  const sfx = new SfxBus()
  assert.equal(sfx.isEnabled(), true)

  // Should not throw in headless environment
  assert.doesNotThrow(() => {
    sfx.playStampThud()
    sfx.playPickupChirp()
    sfx.playNudgeTone()
    sfx.playVictoryFanfare()
  })

  sfx.setEnabled(false)
  assert.equal(sfx.isEnabled(), false)
  assert.doesNotThrow(() => {
    sfx.playStampThud()
  })
})

test("AudioBusController: Dual-bus singleton coordinates voice and SFX", () => {
  assert.ok(audioBus.voice instanceof VoiceBus)
  assert.ok(audioBus.sfx instanceof SfxBus)

  audioBus.setMuted(true)
  assert.equal(audioBus.isMuted(), true)
  assert.equal(audioBus.voice.isEnabled(), false)
  assert.equal(audioBus.sfx.isEnabled(), false)

  audioBus.setMuted(false)
  assert.equal(audioBus.isMuted(), false)
  assert.equal(audioBus.voice.isEnabled(), true)
  assert.equal(audioBus.sfx.isEnabled(), true)
})

test("Backward Compatibility: Re-exported standalone functions execute cleanly", () => {
  assert.doesNotThrow(() => {
    playStampThud()
    playPickupChirp()
    playNudgeTone()
    playVictoryFanfare()
    speakSpeech("Test speech", false)
    cancelSpeech()
  })
})
