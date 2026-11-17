import { GARDEN_PALETTE, type BedId, type BedRow } from "../types"

export const BED_REGISTRY: readonly BedRow[] = [
  {
    id: "making-ten",
    ncdpiName: "Making ten",
    subtitle: "Fill to ten",
    modelKind: "bead-rack",
    color: GARDEN_PALETTE.mint,
    pacing: false,
    problemIds: ["8+5", "9+4"],
  },
  {
    id: "counting-on",
    ncdpiName: "Counting on",
    subtitle: "Start and add on",
    modelKind: "train",
    color: GARDEN_PALETTE.sky,
    pacing: true,
    problemIds: ["9+3", "12+2"],
  },
  {
    id: "decomposing",
    ncdpiName: "Decomposing a number leading to a ten",
    subtitle: "Break apart to ten",
    modelKind: "cut",
    color: GARDEN_PALETTE.peach,
    pacing: false,
    problemIds: ["13-5", "14-6"],
  },
  {
    id: "equivalent-sums",
    ncdpiName: "Creating equivalent but simpler or known sums",
    subtitle: "A friendlier sum",
    modelKind: "seesaw",
    color: GARDEN_PALETTE.butter,
    pacing: false,
    problemIds: ["7+5", "9+7"],
  },
  {
    id: "relationship",
    ncdpiName: "Using the relationship between addition and subtraction",
    subtitle: "Facts that belong",
    modelKind: "fact-house",
    color: GARDEN_PALETTE.rose,
    pacing: false,
    problemIds: ["13-8", "15-9"],
  },
  {
    id: "number-line",
    ncdpiName: "Using a number line",
    subtitle: "Hop along",
    modelKind: "hop-line",
    color: GARDEN_PALETTE.lavender,
    pacing: true,
    problemIds: ["8+7", "9+5"],
  },
] as const

export function bedById(id: BedId): BedRow {
  const row = BED_REGISTRY.find((b) => b.id === id)
  if (!row) throw new Error(`Unknown bed: ${id}`)
  return row
}

export function bedIndex(id: BedId): number {
  return BED_REGISTRY.findIndex((b) => b.id === id)
}
