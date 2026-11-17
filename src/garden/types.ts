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

/** Derived accents (palette-only); see PR Tradeoffs. */
export const GARDEN_ACCENT = {
  /** Peach line on map paths (slightly deeper than fill peach for contrast). */
  pathWood: "#E8C4B8",
  /** Moss leaf highlight (mint family, legible on cream). */
  leaf: "#9BD4B5",
} as const

export const GARDEN_ALLOWED_HEX = new Set(
  [
    GARDEN_INK,
    ...Object.values(GARDEN_PALETTE),
    ...Object.values(GARDEN_ACCENT),
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
