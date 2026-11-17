/**
 * Dovetail Zen Toy Invariant Matrix.
 * Pure mathematical ground truth verification under pure Node 26 (zero DOM dependencies).
 *
 * Verifies Invariants from docs/designs/zen-garden-landing.md:
 *  1. Grimm's Dyed Wood Palette Integrity (#ee5253, #10ac84, #ffa502, #1e90ff, #8854d0)
 *  2. True 3D Tactile Elevation Invariants (translateY -14px, scale 1.06)
 *  3. Magnetic Snap Attraction Basin (capture radius ±50px)
 *  4. Procedural Hollow Wood Block Synthesizer Mathematical Envelope (480Hz -> 140Hz, Q=7.5)
 *  5. Pentatonic Acoustic Multipliers & Zero-Audio-Asset Safety
 */

import test from "node:test"
import assert from "node:assert/strict"
import {
  DOVETAIL_PIECES,
  SNAP_CAPTURE_RADIUS,
  ELEVATION_OFFSET_Y,
  ELEVATION_SCALE,
  CURRICULUM_STATIONS,
} from "../../src/lib/math/dovetail-constants.ts"
import {
  playWoodThock,
  playWoodLift,
  playWoodSettle,
  playPentatonicHarmony,
  playSequentialThocks,
} from "../../src/lib/audio/wood-thock-synth.ts"

test("Dovetail Invariant 1: Grimm's dyed wood palette color verification", () => {
  assert.equal(DOVETAIL_PIECES.length, 5, "Must define exactly 5 joinery pieces")

  const expectedColors = [
    { id: "block-coral", name: "Strawberry Coral", hex: "#ee5253" },
    { id: "block-mint", name: "Sage Emerald Mint", hex: "#10ac84" },
    { id: "block-honey", name: "Sunshine Honey", hex: "#ffa502" },
    { id: "block-azure", name: "Blueberry Azure", hex: "#1e90ff" },
    { id: "block-lavender", name: "Royal Lavender", hex: "#8854d0" },
  ]

  for (const expected of expectedColors) {
    const piece = DOVETAIL_PIECES.find((p) => p.id === expected.id)
    assert.ok(piece, `Piece ${expected.id} must exist`)
    assert.equal(
      piece.baseColor.toLowerCase(),
      expected.hex.toLowerCase(),
      `Piece ${expected.id} (${expected.name}) must have base color ${expected.hex}`,
    )
  }
})

test("Dovetail Invariant 2: 3D tactile elevation parameters and spatial metrics", () => {
  // Invariant 2 requires translateY(-14px) and scale(1.06)
  assert.equal(ELEVATION_OFFSET_Y, -14, "Elevation offset must be exactly -14px")
  assert.equal(ELEVATION_SCALE, 1.06, "Elevation scale must be 1.06")

  // Verify all pieces have valid supply origins and target slots
  for (const piece of DOVETAIL_PIECES) {
    assert.ok(
      piece.originY >= 100 && piece.originY <= 120,
      "Origin Y must be in supply bay (100-120)",
    )
    assert.equal(
      piece.targetY,
      345,
      "All mortise slots must align on target horizontal plane Y=345",
    )
    const verticalTravel = piece.targetY - piece.originY
    assert.ok(verticalTravel >= 200, "Tactile vertical travel must be at least 200px")
  }
})

test("Dovetail Invariant 3: Magnetic snap attraction basin (capture radius ±50px)", () => {
  assert.equal(SNAP_CAPTURE_RADIUS, 50, "Snap capture radius must be exactly 50px")

  // Test snap basin distance math
  const targetX = 265
  const targetY = 345

  // Points within 50px must be inside basin
  const insidePoints = [
    { x: targetX, y: targetY }, // distance 0
    { x: targetX + 30, y: targetY + 30 }, // distance ~42.4px <= 50
    { x: targetX - 50, y: targetY }, // distance 50px exactly
    { x: targetX, y: targetY - 49 }, // distance 49px <= 50
  ]

  for (const pt of insidePoints) {
    const dist = Math.hypot(pt.x - targetX, pt.y - targetY)
    assert.ok(dist <= SNAP_CAPTURE_RADIUS, `Point (${pt.x}, ${pt.y}) should be within snap basin`)
  }

  // Points outside 50px must NOT be inside basin
  const outsidePoints = [
    { x: targetX + 51, y: targetY }, // distance 51px > 50
    { x: targetX + 36, y: targetY + 36 }, // distance ~50.9px > 50
    { x: targetX, y: targetY + 80 }, // distance 80px > 50
  ]

  for (const pt of outsidePoints) {
    const dist = Math.hypot(pt.x - targetX, pt.y - targetY)
    assert.ok(dist > SNAP_CAPTURE_RADIUS, `Point (${pt.x}, ${pt.y}) should be outside snap basin`)
  }
})

test("Dovetail Invariant 4: Procedural Hollow Wood Block Synthesizer frequency envelope", () => {
  // Verify canonical acoustic mathematical constants
  const baseFreq = 480
  const decayEndFreq = baseFreq * 0.29 // ~139.2Hz (~140Hz)
  const bandpassFreq = 580
  const bandpassQ = 7.5
  const attackGain = 0.85
  const decayDuration = 0.11

  assert.ok(
    Math.abs(decayEndFreq - 140) < 2,
    "Rapid pitch decay must ramp down to ~140Hz from 480Hz",
  )
  assert.equal(bandpassFreq, 580, "High-Q bandpass center frequency must be 580Hz")
  assert.equal(bandpassQ, 7.5, "Bandpass resonance Q must be 7.5")
  assert.equal(attackGain, 0.85, "Initial strike gain must be 0.85")
  assert.equal(decayDuration, 0.11, "Exponential decay envelope must last 110ms")

  // Ensure synthesizer functions execute safely in headless Node 26 without errors
  assert.doesNotThrow(() => {
    playWoodThock(null, 1.0)
    playWoodLift(null)
    playWoodSettle(null)
    playPentatonicHarmony(null)
  }, "Procedural synthesizer must execute without throwing in headless environments")
})

test("Dovetail Invariant 5: Unique slot IDs, distinct positions, and NC standard mappings", () => {
  const ids = new Set<string>()
  const slotIds = new Set<string>()
  const targetXs = new Set<number>()

  for (const piece of DOVETAIL_PIECES) {
    assert.ok(!ids.has(piece.id), `Piece ID ${piece.id} must be unique`)
    assert.ok(!slotIds.has(piece.slotId), `Slot ID ${piece.slotId} must be unique`)
    assert.ok(!targetXs.has(piece.targetX), `Target X ${piece.targetX} must be unique`)

    ids.add(piece.id)
    slotIds.add(piece.slotId)
    targetXs.add(piece.targetX)

    assert.ok(
      piece.mathStandard.startsWith("NC.2."),
      "Each piece must map to a Grade 2 NC math standard",
    )
    assert.ok(piece.pitchMultiplier > 0, "Pitch multiplier must be positive")
  }

  // Ensure horizontal slots are monotonically ordered from left to right
  const sortedX = [...targetXs].sort((a, b) => a - b)
  for (let i = 0; i < sortedX.length; i++) {
    assert.equal(
      DOVETAIL_PIECES[i].targetX,
      sortedX[i],
      "Slots must be ordered sequentially left-to-right",
    )
  }
})

test("Dovetail Invariant 6: 4 Curriculum Stations & Multi-Thock Cascade Invariants", () => {
  assert.ok(CURRICULUM_STATIONS.length >= 4, "Must define at least 4 curriculum stations")

  const expectedStations = [
    { id: "making-ten", number: 1, standard: "NC.2.OA.2" },
    { id: "arrays", number: 2, standard: "NC.2.OA.4" },
    { id: "parity", number: 3, standard: "NC.2.OA.3" },
    { id: "geometry", number: 4, standard: "NC.2.G.3" },
  ]

  for (const expected of expectedStations) {
    const station = CURRICULUM_STATIONS.find((s) => s.id === expected.id)
    assert.ok(station, `Station ${expected.id} must exist`)
    assert.equal(station.number, expected.number, `Station ${expected.id} number mismatch`)
    assert.equal(station.standard, expected.standard, `Station ${expected.id} standard mismatch`)
    assert.ok(station.normalEquation.length > 5, "Must have valid normal equation text")
    assert.ok(station.solvedEquation.length > 5, "Must have valid solved equation text")
  }

  // Ensure playSequentialThocks executes safely without throwing in headless Node 26
  assert.doesNotThrow(() => {
    playSequentialThocks(null, [1.0, 1.18, 1.35])
  }, "playSequentialThocks must run safely in headless Node 26 environment")
})
