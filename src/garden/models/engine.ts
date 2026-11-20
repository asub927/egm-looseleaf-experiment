import type { BedId, PictureRow, WrongBubble } from "../types"
import { GARDEN_PALETTE, SEESAW_CROSS_MAX } from "../types"
import { answerForProblem, type ProblemSpec } from "./problems"

import type {
  BeadState,
  CutState,
  FactState,
  HopState,
  ModelState,
  SeesawState,
  TrainState,
} from "./state"

export type {
  BeadState,
  CutState,
  FactState,
  HopState,
  ModelState,
  SeesawState,
  TrainState,
} from "./state"

export function initialModelState(bedId: BedId, p: ProblemSpec): ModelState {
  switch (bedId) {
    case "making-ten":
      return { moved: 0 }
    case "counting-on":
      return { at: p.kind === "add" ? p.a : 0 }
    case "decomposing":
      return { position: p.kind === "sub" ? p.n : 0, phase: "toTen" }
    case "equivalent-sums":
      return { crossed: [], steps: 0 }
    case "relationship":
      return { tile: null }
    case "number-line":
      return { land: p.kind === "add" ? p.a : 5 }
    default: {
      const _exhaustive: never = bedId
      return _exhaustive
    }
  }
}

export function modelReady(bedId: BedId, p: ProblemSpec, s: ModelState): boolean {
  switch (bedId) {
    case "making-ten": {
      const st = s as BeadState
      return st.moved > 0 && p.kind === "add"
    }
    case "counting-on": {
      const st = s as TrainState
      return p.kind === "add" && st.at > p.a
    }
    case "decomposing": {
      const st = s as CutState
      return p.kind === "sub" && st.phase === "rest" && st.position < 10
    }
    case "equivalent-sums": {
      const st = s as SeesawState
      if (p.kind !== "add") return false
      const [left, right] = seesawSides(p, st.crossed)
      return st.steps >= 2 && left === right
    }
    case "relationship": {
      const st = s as FactState
      return st.tile !== null
    }
    case "number-line": {
      const st = s as HopState
      return p.kind === "add" && st.land !== p.a
    }
    default: {
      const _exhaustive: never = bedId
      return _exhaustive
    }
  }
}

export function modelCorrect(bedId: BedId, p: ProblemSpec, s: ModelState): boolean {
  const ans = answerForProblem(p)
  switch (bedId) {
    case "making-ten": {
      const st = s as BeadState
      if (p.kind !== "add") return false
      return p.a + st.moved === 10 && p.a + st.moved + (p.b - st.moved) === ans
    }
    case "counting-on": {
      const st = s as TrainState
      return st.at === ans
    }
    case "decomposing": {
      const st = s as CutState
      return p.kind === "sub" && st.position === ans
    }
    case "equivalent-sums": {
      const st = s as SeesawState
      if (p.kind !== "add") return false
      const [left, right] = seesawSides(p, st.crossed)
      return left === right
    }
    case "relationship": {
      const st = s as FactState
      return st.tile === ans
    }
    case "number-line": {
      const st = s as HopState
      return st.land === ans
    }
    default: {
      const _exhaustive: never = bedId
      return _exhaustive
    }
  }
}

export function beadMaxMove(p: ProblemSpec, _moved: number): number {
  if (p.kind !== "add") return 0
  return Math.min(p.b, 10 - p.a)
}

export function stepModel(
  bedId: BedId,
  p: ProblemSpec,
  s: ModelState,
  delta: number,
): ModelState | null {
  switch (bedId) {
    case "making-ten": {
      const st = s as BeadState
      const max = beadMaxMove(p, st.moved)
      const next = Math.max(0, Math.min(max, st.moved + delta))
      return next === st.moved ? null : { moved: next }
    }
    case "counting-on": {
      const st = s as TrainState
      if (p.kind !== "add") return null
      const next = Math.max(p.a, Math.min(20, st.at + delta))
      return next === st.at ? null : { at: next }
    }
    case "decomposing": {
      const st = s as CutState
      if (p.kind !== "sub") return null
      const range = st.phase === "toTen" ? ([10, p.n] as const) : ([1, 10] as const)
      const next = clamp(st.position - delta, range[0], range[1])
      if (next === st.position) return null
      if (st.phase === "toTen" && next === 10) {
        return { position: 10, phase: "rest" }
      }
      return { position: next, phase: st.phase === "toTen" ? "toTen" : "rest" }
    }
    case "equivalent-sums": {
      const st = s as SeesawState
      if (p.kind !== "add") return null
      if (delta > 0) {
        if (st.crossed.length >= SEESAW_CROSS_MAX) return null
        for (let j = p.a - 1; j >= 0; j--) {
          if (!st.crossed.includes(j)) {
            return { crossed: [...st.crossed, j], steps: st.steps + 1 }
          }
        }
        return null
      }
      if (st.crossed.length === 0) return null
      return { crossed: st.crossed.slice(0, -1), steps: st.steps + 1 }
    }
    case "relationship": {
      const st = s as FactState
      if (p.kind !== "fact") return null
      const miss = p.whole - p.part
      const tiles = [miss - 2, miss - 1, miss, miss + 1, miss + 2]
      const idx = st.tile === null ? -1 : tiles.indexOf(st.tile)
      const j = clamp(idx + delta, -1, tiles.length - 1)
      const tile = j < 0 ? null : tiles[j]
      if (tile === st.tile) return null
      return { tile }
    }
    case "number-line": {
      const st = s as HopState
      const next = Math.max(5, Math.min(20, st.land + delta))
      return next === st.land ? null : { land: next }
    }
    default: {
      const _exhaustive: never = bedId
      return _exhaustive
    }
  }
}

function clamp(v: number, a: number, b: number): number {
  return Math.max(a, Math.min(b, v))
}

function seesawSides(p: Extract<ProblemSpec, { kind: "add" }>, crossed: number[]) {
  const m = crossed.length
  return [p.a - m, p.b + m] as const
}

export function seesawNextCrossed(
  p: Extract<ProblemSpec, { kind: "add" }>,
  st: SeesawState,
  dir: 1 | -1,
): SeesawState | null {
  if (dir > 0) {
    if (st.crossed.length >= SEESAW_CROSS_MAX) return null
    for (let j = p.a - 1; j >= 0; j--) {
      if (!st.crossed.includes(j)) {
        return { crossed: [...st.crossed, j], steps: st.steps + 1 }
      }
    }
    return null
  }
  if (st.crossed.length === 0) return null
  return { crossed: st.crossed.slice(0, -1), steps: st.steps + 1 }
}

export function wrongBubble(bedId: BedId, p: ProblemSpec, s: ModelState): WrongBubble {
  const rows = observationPicture(bedId, p, s)
  const obs = observationCopy(bedId, p, s)
  return { title: obs.title, body: obs.body, pictureRows: rows }
}

function observationCopy(
  bedId: BedId,
  p: ProblemSpec,
  s: ModelState,
): { title: string; body: string } {
  switch (bedId) {
    case "making-ten": {
      const st = s as BeadState
      if (p.kind !== "add")
        return { title: "Look at the wires.", body: "Move beads to fill the top wire." }
      const top = p.a + st.moved
      return {
        title: `The top wire has ${top} beads.`,
        body: "A full ten has 10 beads.",
      }
    }
    case "counting-on": {
      const st = s as TrainState
      if (p.kind !== "add") return { title: "Look at the train.", body: "" }
      const c = st.at - p.a
      return {
        title: `The engine counted on ${c} ${c === 1 ? "car" : "cars"}.`,
        body: `We add ${p.b}.`,
      }
    }
    case "decomposing": {
      const st = s as CutState
      if (p.kind !== "sub") return { title: "", body: "" }
      const taken = p.n - st.position
      const need = p.take
      const diff = taken - need
      if (st.position === 10)
        return {
          title: "You reached a full ten.",
          body: `Nice start. We still take the rest of the ${need}.`,
        }
      if (diff > 0)
        return {
          title: `That is ${diff} more than we need.`,
          body: `You took away ${taken}. We need ${need}.`,
        }
      return {
        title: `That is ${-diff} fewer than we need.`,
        body: `You took away ${taken}. We need ${need}.`,
      }
    }
    case "equivalent-sums": {
      const st = s as SeesawState
      if (p.kind !== "add") return { title: "", body: "" }
      const [left, right] = seesawSides(p, st.crossed)
      return {
        title: `The left side has ${left}. The right side has ${right}.`,
        body: left > right ? "The left side is still down." : "Now the right side is down.",
      }
    }
    case "relationship": {
      const st = s as FactState
      if (p.kind !== "fact" || st.tile === null)
        return { title: "Pick a tile for the empty corner.", body: "" }
      const sum = p.part + st.tile
      return {
        title: `${p.part} and ${st.tile} make ${sum}.`,
        body: `The roof says ${p.whole}.`,
      }
    }
    case "number-line": {
      const st = s as HopState
      if (p.kind !== "add") return { title: "", body: "" }
      const hops = st.land - p.a
      return {
        title: `The flag is ${Math.abs(hops)} ${Math.abs(hops) === 1 ? "hop" : "hops"} forward from ${p.a}.`,
        body: `Pip hops ${p.b}.`,
      }
    }
    default: {
      const _exhaustive: never = bedId
      return _exhaustive
    }
  }
}

function observationPicture(bedId: BedId, p: ProblemSpec, s: ModelState): PictureRow[] {
  switch (bedId) {
    case "making-ten": {
      const st = s as BeadState
      if (p.kind !== "add") return []
      const top = p.a + st.moved
      return [
        { label: "Top", n: top, of: 10, fill: GARDEN_PALETTE.rose },
        { label: "Ten", n: 10, of: 10, fill: GARDEN_PALETTE.lavender },
      ]
    }
    case "counting-on": {
      const st = s as TrainState
      if (p.kind !== "add") return []
      const c = st.at - p.a
      const m = Math.max(c, p.b)
      return [
        { label: "Counted", n: c, of: m, fill: GARDEN_PALETTE.sky },
        { label: "Add", n: p.b, of: m, fill: GARDEN_PALETTE.lavender },
      ]
    }
    case "decomposing": {
      const st = s as CutState
      if (p.kind !== "sub") return []
      const taken = p.n - st.position
      const m = Math.max(taken, p.take)
      return [
        { label: "Away", n: taken, of: m, fill: GARDEN_PALETTE.peach },
        { label: "Need", n: p.take, of: m, fill: GARDEN_PALETTE.lavender },
      ]
    }
    case "equivalent-sums": {
      const st = s as SeesawState
      if (p.kind !== "add") return []
      const [left, right] = seesawSides(p, st.crossed)
      const m = Math.max(left, right)
      return [
        { label: "Left", n: left, of: m, fill: GARDEN_PALETTE.peach },
        { label: "Right", n: right, of: m, fill: GARDEN_PALETTE.sky },
      ]
    }
    case "relationship": {
      const st = s as FactState
      if (p.kind !== "fact" || st.tile === null) return []
      const sum = p.part + st.tile
      const m = Math.max(sum, p.whole)
      return [
        { label: `${p.part} + ${st.tile}`, n: sum, of: m, fill: GARDEN_PALETTE.peach },
        { label: "Roof", n: p.whole, of: m, fill: GARDEN_PALETTE.lavender },
      ]
    }
    case "number-line": {
      const st = s as HopState
      if (p.kind !== "add") return []
      const hops = Math.abs(st.land - p.a)
      const m = Math.max(hops, p.b)
      return [
        { label: "Hops", n: hops, of: m, fill: GARDEN_PALETTE.lavender },
        { label: "Pip hops", n: p.b, of: m, fill: GARDEN_PALETTE.peach },
      ]
    }
    default: {
      const _exhaustive: never = bedId
      return _exhaustive
    }
  }
}

export type CounterRow = { label: string; value: string }

export function modelFlowCounters(
  bedId: BedId,
  p: ProblemSpec,
  s: ModelState,
  reveal: boolean,
): CounterRow[] | null {
  switch (bedId) {
    case "counting-on": {
      const st = s as TrainState
      if (p.kind !== "add") return null
      return [
        { label: "Step", value: String(Math.max(0, st.at - p.a)) },
        { label: "Total", value: reveal ? String(st.at) : "—" },
      ]
    }
    case "number-line": {
      const st = s as HopState
      if (p.kind !== "add") return null
      return [
        { label: "Hop", value: String(Math.max(0, st.land - p.a)) },
        { label: "Land", value: reveal ? String(st.land) : "—" },
      ]
    }
    default:
      return null
  }
}

export function modelPills(bedId: BedId, p: ProblemSpec, s: ModelState, solved: boolean): string[] {
  switch (bedId) {
    case "making-ten": {
      const st = s as BeadState
      if (p.kind !== "add") return []
      return [`Top ${p.a + st.moved}`, `Bottom ${p.b - st.moved}`]
    }
    case "counting-on": {
      const st = s as TrainState
      if (p.kind !== "add") return []
      return [`${p.a} in my head`, `Counted on ${st.at - p.a}`]
    }
    case "decomposing": {
      const st = s as CutState
      if (p.kind !== "sub") return []
      const out = [`${p.n - Math.max(st.position, 10)} to get down to ten`]
      if (st.phase === "rest") out.push(`${10 - st.position} more`)
      return out
    }
    case "equivalent-sums":
      return solved ? ["Balanced"] : ["Match the sides"]
    case "relationship": {
      const st = s as FactState
      if (p.kind !== "fact") return []
      return st.tile === null ? ["Pick a tile"] : [`Tile ${st.tile}`]
    }
    case "number-line": {
      const st = s as HopState
      if (p.kind !== "add") return []
      return [`Start ${p.a}`, `Landed on ${st.land}`]
    }
    default: {
      const _exhaustive: never = bedId
      return _exhaustive
    }
  }
}
