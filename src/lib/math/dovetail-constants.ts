/**
 * Pure Mathematical Constants and Palette Definitions for Montessori Dovetail Joinery.
 * Synchronous, zero-dependency, and strictly compliant with Node 26 type stripping.
 */

export interface DovetailPieceConfig {
  id: string
  slotId: string
  name: string
  mathStandard: string
  pedagogicalRole: string
  baseColor: string
  highlightColor: string
  deepColor: string
  pitchMultiplier: number
  originX: number
  originY: number
  targetX: number
  targetY: number
  dots: number
  shapeType: "single" | "double" | "keystone" | "split" | "crown"
}

/**
 * Grimm's Dyed Wood Palette & Piece Configurations
 * Invariant 1:
 *  - Strawberry Coral: #ee5253
 *  - Sage Emerald Mint: #10ac84
 *  - Sunshine Honey: #ffa502
 *  - Blueberry Azure: #1e90ff
 *  - Royal Lavender: #8854d0
 */
export const DOVETAIL_PIECES: readonly DovetailPieceConfig[] = [
  {
    id: "block-coral",
    slotId: "slot-coral",
    name: "Strawberry Coral",
    mathStandard: "NC.2.OA.2 Making Ten",
    pedagogicalRole: "First Addend Ten-Frame",
    baseColor: "#ee5253",
    highlightColor: "#ff6b81",
    deepColor: "#d63031",
    pitchMultiplier: 0.85,
    originX: 130,
    originY: 110,
    targetX: 130,
    targetY: 345,
    dots: 2,
    shapeType: "single",
  },
  {
    id: "block-mint",
    slotId: "slot-mint",
    name: "Sage Emerald Mint",
    mathStandard: "NC.2.OA.3 Odd & Even",
    pedagogicalRole: "Complementary Solution Tenon",
    baseColor: "#10ac84",
    highlightColor: "#2ed573",
    deepColor: "#006266",
    pitchMultiplier: 1.0,
    originX: 265,
    originY: 105,
    targetX: 265,
    targetY: 345,
    dots: 4,
    shapeType: "double",
  },
  {
    id: "block-honey",
    slotId: "slot-honey",
    name: "Sunshine Honey",
    mathStandard: "NC.2.OA.4 Rectangular Arrays",
    pedagogicalRole: "Equal Grouping Matrix",
    baseColor: "#ffa502",
    highlightColor: "#ffc048",
    deepColor: "#e67e22",
    pitchMultiplier: 1.15,
    originX: 400,
    originY: 115,
    targetX: 400,
    targetY: 345,
    dots: 6,
    shapeType: "keystone",
  },
  {
    id: "block-azure",
    slotId: "slot-azure",
    name: "Blueberry Azure",
    mathStandard: "NC.2.G.3 Partition Halves",
    pedagogicalRole: "Symmetric Split Partner",
    baseColor: "#1e90ff",
    highlightColor: "#70a1ff",
    deepColor: "#0984e3",
    pitchMultiplier: 1.3,
    originX: 535,
    originY: 105,
    targetX: 535,
    targetY: 345,
    dots: 8,
    shapeType: "split",
  },
  {
    id: "block-lavender",
    slotId: "slot-lavender",
    name: "Royal Lavender",
    mathStandard: "NC.2.G.3 Equal Thirds & Fourths",
    pedagogicalRole: "Master Keystone Dovetail",
    baseColor: "#8854d0",
    highlightColor: "#a55eea",
    deepColor: "#6c5ce7",
    pitchMultiplier: 1.45,
    originX: 670,
    originY: 110,
    targetX: 670,
    targetY: 345,
    dots: 10,
    shapeType: "crown",
  },
] as const

/** Capture radius threshold: Invariant 3 (±50px) */
export const SNAP_CAPTURE_RADIUS = 50

/** 3D Tactile Elevation Invariants: Invariant 2 */
export const ELEVATION_OFFSET_Y = -14
export const ELEVATION_SCALE = 1.06
