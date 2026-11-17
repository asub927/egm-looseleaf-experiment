import type { BedId, GardenProgress } from "../types"

export const GARDEN_PROGRESS_KEY = "pips_math_garden_progress_v1" as const

export const DEFAULT_GARDEN_PROGRESS: GardenProgress = {
  schemaVersion: 1,
  solvedBedIds: [],
  solvedProblemKeys: [],
  mossLeaves: 0,
  sessionBedsFinished: 0,
  restedThisSession: false,
  calmMode: false,
  owlBedIndex: 0,
}

const VALID_BEDS: readonly BedId[] = [
  "making-ten",
  "counting-on",
  "decomposing",
  "equivalent-sums",
  "relationship",
  "number-line",
]

function isBedId(v: unknown): v is BedId {
  return typeof v === "string" && (VALID_BEDS as readonly string[]).includes(v)
}

function getStorage(): Storage | null {
  try {
    if (typeof window !== "undefined" && window.localStorage) return window.localStorage
  } catch {
    /* blocked */
  }
  return null
}

export function parseGardenProgress(raw: unknown): GardenProgress {
  if (!raw || typeof raw !== "object") {
    return { ...DEFAULT_GARDEN_PROGRESS, solvedBedIds: [], solvedProblemKeys: [] }
  }
  const c = raw as Partial<GardenProgress>
  const solvedBedIds = Array.isArray(c.solvedBedIds) ? c.solvedBedIds.filter(isBedId) : []
  const solvedProblemKeys = Array.isArray(c.solvedProblemKeys)
    ? c.solvedProblemKeys.filter((k): k is string => typeof k === "string")
    : []
  const mossLeaves =
    typeof c.mossLeaves === "number" && c.mossLeaves >= 0
      ? Math.floor(c.mossLeaves)
      : DEFAULT_GARDEN_PROGRESS.mossLeaves
  const sessionBedsFinished =
    typeof c.sessionBedsFinished === "number" && c.sessionBedsFinished >= 0
      ? Math.floor(c.sessionBedsFinished)
      : 0
  const owlBedIndex =
    typeof c.owlBedIndex === "number" && c.owlBedIndex >= 0 && c.owlBedIndex < 6
      ? Math.floor(c.owlBedIndex)
      : 0
  return {
    schemaVersion: 1,
    solvedBedIds: [...new Set(solvedBedIds)],
    solvedProblemKeys: [...new Set(solvedProblemKeys)],
    mossLeaves,
    sessionBedsFinished,
    restedThisSession: c.restedThisSession === true,
    calmMode: c.calmMode === true,
    owlBedIndex,
  }
}

export function loadGardenProgress(): GardenProgress {
  const storage = getStorage()
  if (!storage) return { ...DEFAULT_GARDEN_PROGRESS, solvedBedIds: [], solvedProblemKeys: [] }
  try {
    const raw = storage.getItem(GARDEN_PROGRESS_KEY)
    if (!raw) return { ...DEFAULT_GARDEN_PROGRESS, solvedBedIds: [], solvedProblemKeys: [] }
    return parseGardenProgress(JSON.parse(raw) as unknown)
  } catch {
    return { ...DEFAULT_GARDEN_PROGRESS, solvedBedIds: [], solvedProblemKeys: [] }
  }
}

export function saveGardenProgress(progress: GardenProgress): void {
  const storage = getStorage()
  if (!storage) return
  try {
    storage.setItem(GARDEN_PROGRESS_KEY, JSON.stringify(progress))
  } catch {
    /* quota / blocked */
  }
}

export function problemKey(bedId: BedId, problemId: string): string {
  return `${bedId}:${problemId}`
}
