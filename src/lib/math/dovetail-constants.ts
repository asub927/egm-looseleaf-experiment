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

export type CurriculumStationId = "making-ten" | "arrays" | "parity" | "geometry" | "dovetail"

export interface CurriculumStationConfig {
  id: CurriculumStationId
  number: number
  name: string
  standard: string
  badge: string
  icon: string
  title: string
  normalEquation: string
  solvedEquation: string
}

export const CURRICULUM_STATIONS: readonly CurriculumStationConfig[] = [
  {
    id: "making-ten",
    number: 1,
    name: "Making Ten",
    standard: "NC.2.OA.2",
    badge: "NC.2.OA.2",
    icon: "🍓",
    title: "Station 1: Ten-Frame Inset (6 Coral + 4 Mint = 10)",
    normalEquation: "6 (Coral) + 4 (Mint) = 10 · Flush Dovetail Joint",
    solvedEquation: "10 − 6 = 4 · Inset Completed ✓",
  },
  {
    id: "arrays",
    number: 2,
    name: "Arrays",
    standard: "NC.2.OA.4",
    badge: "NC.2.OA.4",
    icon: "🍯",
    title: "Station 2: Interlocking Arrays (3 Rows × 4 Cols = 12)",
    normalEquation: "Honey (4) + Blue (4) + Coral (4) = 12",
    solvedEquation: "3 Rows × 4 Cols = 12 · Solid Array Locked ✓",
  },
  {
    id: "parity",
    number: 3,
    name: "Odd & Even",
    standard: "NC.2.OA.3",
    badge: "NC.2.OA.3",
    icon: "🫐",
    title: "Station 3: Odd & Even Parity (8 = 4 Lavender + 4 Honey)",
    normalEquation: "4 Lavender + 4 Honey = 8 Symmetrical Pairs",
    solvedEquation: "8 is EVEN · Perfect Partner Teams ✓",
  },
  {
    id: "geometry",
    number: 4,
    name: "Geometry Shares",
    standard: "NC.2.G.3",
    badge: "NC.2.G.3",
    icon: "🥧",
    title: "Station 4: Geometry Fruit Tart (3 Equal Thirds)",
    normalEquation: "Coral (1/3) + Blue (1/3) + Mint (1/3) = 1 Whole",
    solvedEquation: "3 Thirds = 1 Whole Fruit Tart ✓",
  },
  {
    id: "dovetail",
    number: 5,
    name: "Dovetail Studio",
    standard: "NC.2.OA.2-G.3",
    badge: "Studio",
    icon: "榫",
    title: "Station 5: Master Dovetail Joinery (5 Dyed Lime Wood Tenons)",
    normalEquation: "Assemble 5 Handcrafted Dovetail Tenons into Mortise Bench",
    solvedEquation: "5 / 5 Harmonized · Master Joinery Achieved ✓",
  },
] as const
