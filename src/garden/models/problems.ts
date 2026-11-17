import type { BedId } from "../types"

export type ProblemSpec =
  | { kind: "add"; id: string; a: number; b: number }
  | { kind: "sub"; id: string; n: number; take: number }
  | { kind: "fact"; id: string; whole: number; part: number; missingSide: "left" | "right" }

export function problemsForBed(bedId: BedId): [ProblemSpec, ProblemSpec] {
  switch (bedId) {
    case "making-ten":
      return [
        { kind: "add", id: "8+5", a: 8, b: 5 },
        { kind: "add", id: "9+4", a: 9, b: 4 },
      ]
    case "counting-on":
      return [
        { kind: "add", id: "9+3", a: 9, b: 3 },
        { kind: "add", id: "12+2", a: 12, b: 2 },
      ]
    case "decomposing":
      return [
        { kind: "sub", id: "13-5", n: 13, take: 5 },
        { kind: "sub", id: "14-6", n: 14, take: 6 },
      ]
    case "equivalent-sums":
      return [
        { kind: "add", id: "7+5", a: 7, b: 5 },
        { kind: "add", id: "9+7", a: 9, b: 7 },
      ]
    case "relationship":
      return [
        { kind: "fact", id: "13-8", whole: 13, part: 8, missingSide: "right" },
        { kind: "fact", id: "15-9", whole: 15, part: 9, missingSide: "left" },
      ]
    case "number-line":
      return [
        { kind: "add", id: "8+7", a: 8, b: 7 },
        { kind: "add", id: "9+5", a: 9, b: 5 },
      ]
    default: {
      const _exhaustive: never = bedId
      return _exhaustive
    }
  }
}

export function answerForProblem(p: ProblemSpec): number {
  switch (p.kind) {
    case "add":
      return p.a + p.b
    case "sub":
      return p.n - p.take
    case "fact":
      return p.whole - p.part
    default: {
      const _exhaustive: never = p
      return _exhaustive
    }
  }
}

export function guessChips(ans: number): number[] {
  return [ans - 1, ans, ans + 1]
}
