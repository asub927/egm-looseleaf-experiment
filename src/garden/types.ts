/** Pip's Math Garden — shared domain types (ink #2B2A3A, pastel beds). */

export const GARDEN_INK = "#2B2A3A" as const

export const GARDEN_PALETTE = {
  peach: "#FFD6C9",
  lavender: "#D9CCFF",
  mint: "#C9F2DD",
  sky: "#CDE8FF",
  butter: "#FFF1B8",
  rose: "#FFD1E3",
  cream: "#FFFDF8",
  paper: "#F6F1E4",
} as const

/** Demo-aligned accents (garden-map-demo). */
export const GARDEN_DEMO = {
  cream: "#FFF8F0",
  soil: "#E8D9C4",
  leaf: "#7BC47F",
  ear: "#B8A6FF",
  feet: "#E8A24A",
  bloomPetal: "#F4A6C1",
  restSkyTop: "#C9D6F0",
  restSkyBottom: "#E4DFF5",
  restHill: "#D7E8B8",
  skyWash: "#EAF6FF",
  sandWash: "#F3E8D4",
} as const

/** Map scenery (layout-map / garden.css); palette-adjacent tints only. */
export const GARDEN_MAP_SURFACE = {
  pathTan: "#D9C9A8",
  pathCream: "#F3E6C8",
  pathEdge: "#E9DAB9",
  skyTop: "#BFDFF5",
  skyMid: "#DDEFFF",
  hillPasture: "#E8F4D8",
  hillGrass: "#D8EBC4",
  plotInset: "#F6EEDD",
  plaqueBorder: "#E3CFAE",
  plaqueBottom: "#D4B98F",
  stake: "#C9A36B",
  treeA: "#BFE6C9",
  treeB: "#B2DDBE",
  sunRing: "#F3D98A",
  bee: "#FFE38A",
} as const

/** Derived accents (palette-only); see PR Tradeoffs. */
export const GARDEN_ACCENT = {
  /** Peach line on map paths (slightly deeper than fill peach for contrast). */
  pathWood: "#E8C4B8",
  /** Moss leaf (demo drawPet). */
  leaf: GARDEN_DEMO.leaf,
} as const

export const GARDEN_ALLOWED_HEX = new Set(
  [
    GARDEN_INK,
    ...Object.values(GARDEN_PALETTE),
    ...Object.values(GARDEN_ACCENT),
    ...Object.values(GARDEN_DEMO),
    ...Object.values(GARDEN_MAP_SURFACE),
    "#FFFFFF",
    "#ffffff",
    "#fff",
  ].map((h) => h.toLowerCase()),
)

export const SEESAW_CROSS_MAX = 3

export type BedId =
  "making-ten" | "counting-on" | "decomposing" | "equivalent-sums" | "relationship" | "number-line"

export type ModelKind = "bead-rack" | "train" | "cut" | "seesaw" | "fact-house" | "hop-line"

export interface BedRow {
  id: BedId
  /** Exact NCDPI strategy name */
  ncdpiName: string
  subtitle: string
  modelKind: ModelKind
  color: string
  pacing: boolean
  problemIds: [string, string]
}

export type LessonBar = "story" | "try" | "check" | "grow"

export type LessonPhase =
  "story" | "predict" | "model" | "locked" | "wrongBubble" | "hint1" | "hint2" | "hint3" | "solved"

export interface WrongBubble {
  title: string
  body: string
  pictureRows: PictureRow[]
}

export interface PictureRow {
  label: string
  n: number
  of: number
  fill?: string
}

import type { ModelState } from "./models/state"

export interface LessonContext {
  bedId: BedId
  problemIndex: 0 | 1
  guess: number | null
  modelState: ModelState
  wrongAttempts: number
  hintRung: 0 | 1 | 2 | 3
  bubble: WrongBubble | null
  wasAlreadySolved: boolean
  via: "tap" | "keyboard" | "drag" | null
}

export interface LessonState {
  phase: LessonPhase
  bar: LessonBar
  context: LessonContext | null
}

export type GardenScreen = "map" | "lesson" | "rest"

export interface GardenProgress {
  schemaVersion: 1
  solvedBedIds: BedId[]
  solvedProblemKeys: string[]
  mossLeaves: number
  sessionBedsFinished: number
  restedThisSession: boolean
  calmMode: boolean
  owlBedIndex: number
}
