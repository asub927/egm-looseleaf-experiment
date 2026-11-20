import type { BedId } from "../types"
import type { ProblemSpec } from "./problems"

function seq(a: number, b: number): number[] {
  const out: number[] = []
  for (let i = a; i <= b; i++) out.push(i)
  return out
}

export function storyLine(bedId: BedId, p: ProblemSpec): string {
  switch (bedId) {
    case "making-ten":
      if (p.kind !== "add") break
      return `${p.a} beads on the top wire. ${p.b} beads on the bottom. How many beads in all?`
    case "counting-on":
      if (p.kind !== "add") break
      return `${p.a} cars on the track. ${p.b} more cars join. How many cars now?`
    case "decomposing":
      if (p.kind !== "sub") break
      return `${p.n} seeds. The bunny eats ${p.take}. How many are left?`
    case "equivalent-sums":
      if (p.kind !== "add") break
      return `${p.a} apples on one side. ${p.b} apples on the other. How many apples in all?`
    case "relationship":
      if (p.kind !== "fact") break
      return `${p.whole} carrots in the garden. ${p.part} are in the basket. How many are still in the ground?`
    case "number-line":
      if (p.kind !== "add") break
      return `Pip is on ${p.a}. Pip hops ${p.b} more. Where does Pip land?`
    default: {
      const _exhaustive: never = bedId
      return String(_exhaustive)
    }
  }
  return ""
}

export function promptLine(p: ProblemSpec): string {
  if (p.kind === "add") return `${p.a} + ${p.b} = ?`
  if (p.kind === "sub") return `${p.n} − ${p.take} = ?`
  if (p.kind === "fact") return `${p.whole} − ${p.part} = ?`
  const _exhaustive: never = p
  return String(_exhaustive)
}

export function eqLine(p: ProblemSpec): string {
  if (p.kind === "add") return `${p.a} + ${p.b} = ${p.a + p.b}`
  if (p.kind === "sub") return `${p.n} − ${p.take} = ${p.n - p.take}`
  if (p.kind === "fact") return `${p.whole} − ${p.part} = ${p.whole - p.part}`
  const _exhaustive: never = p
  return String(_exhaustive)
}

export function guessQuestion(bedId: BedId): string {
  switch (bedId) {
    case "counting-on":
      return "How many cars now? Guess first."
    case "making-ten":
      return "How many beads in all? Guess first."
    case "decomposing":
      return "How many seeds are left? Guess first."
    case "equivalent-sums":
      return "How many apples in all? Guess first."
    case "relationship":
      return "How many carrots in the ground? Guess first."
    case "number-line":
      return "Where does Pip land? Guess first."
    default: {
      const _exhaustive: never = bedId
      return String(_exhaustive)
    }
  }
}

export function tryLine(bedId: BedId, p: ProblemSpec): string {
  switch (bedId) {
    case "counting-on":
      if (p.kind === "add") return `Put ${p.a} in your head. Drag the engine to count on ${p.b}.`
      break
    case "making-ten":
      if (p.kind === "add")
        return `Put ${p.a} beads in your head. Drag to make a full ten, then count the rest.`
      break
    case "number-line":
      if (p.kind === "add") return `Start at ${p.a}. Drag Pip to hop ${p.b} more.`
      break
    default:
      break
  }
  return "Drag, tap, or use the buttons."
}

export function hint1Line(bedId: BedId, p: ProblemSpec): string {
  switch (bedId) {
    case "making-ten":
      return "Is the top wire a full ten yet? How many more beads fit?"
    case "counting-on":
      if (p.kind === "add") return `How many cars did the engine count on? Is that ${p.b}?`
      break
    case "decomposing":
      return "Did you take away in two steps? What is left after the first step?"
    case "equivalent-sums":
      return "Do both sides balance? What sum do you see?"
    case "relationship":
      return "What addition fact belongs with this subtraction?"
    case "number-line":
      return "Did you land on the tick that matches the sum?"
    default:
      break
  }
  return "What do you see on the model?"
}

export function hint2Line(bedId: BedId): string {
  if (bedId === "counting-on") return "Look at the dashed rings. Count on one car for each ring."
  if (bedId === "number-line") return "Look at the hop cues on the number line."
  return "Look at the dashed cues on the model."
}

export function exampleLine(bedId: BedId, p: ProblemSpec): string {
  switch (bedId) {
    case "making-ten": {
      if (p.kind !== "add") break
      const r = 10 - p.a
      const rest = p.b - r
      return `I broke up ${p.b} into ${r} and ${rest} since ${p.a} is ${r} away from 10. I then added ${p.a} + ${r} + ${rest}. My answer is ${p.a + p.b}.`
    }
    case "counting-on": {
      if (p.kind !== "add") break
      const list = seq(p.a + 1, p.a + p.b).join(", ")
      return `I put ${p.a} in my head and counted on ${p.b} more: ${list}. I said ${p.b} numbers, so ${p.a} + ${p.b} is ${p.a + p.b}.`
    }
    case "decomposing": {
      if (p.kind !== "sub") break
      const p1 = p.n - 10
      const p2 = p.take - p1
      return `I broke the ${p.take} up into a ${p1} and a ${p2}. ${p.n} minus ${p1} is 10. Then I took away ${p2} more to get ${p.n - p.take}.`
    }
    case "equivalent-sums": {
      if (p.kind !== "add") break
      const d = (p.a + p.b) / 2
      return `I know ${d} and ${d} makes ${2 * d}, so ${p.a} and ${p.b} makes ${p.a + p.b} too.`
    }
    case "relationship": {
      if (p.kind !== "fact") break
      const missing = p.whole - p.part
      return `Instead of thinking about this as ${p.whole} minus ${p.part}, I thought about this as ${p.part} plus something equals ${p.whole}. I knew that ${p.part} and ${missing} makes ${p.whole} so the answer is ${missing}.`
    }
    case "number-line": {
      if (p.kind !== "add") break
      const r = 10 - p.a
      return `I used a number line. I started at ${p.a}. I broke up ${p.b} into ${r} and ${p.b - r} so I could jump ${r} to make 10. Then I jumped ${p.b - r} more and got ${p.a + p.b}.`
    }
    default: {
      const _exhaustive: never = bedId
      return String(_exhaustive)
    }
  }
  return ""
}

export function stepperLabels(bedId: BedId): [string, string] {
  switch (bedId) {
    case "counting-on":
    case "number-line":
      return ["Back one", "Forward one"]
    case "making-ten":
      return ["Slide back", "Slide forward"]
    case "decomposing":
      return ["Back", "Forward"]
    case "equivalent-sums":
      return ["Tip left", "Tip right"]
    case "relationship":
      return ["Back", "Forward"]
    default: {
      const _exhaustive: never = bedId
      return [String(_exhaustive), ""]
    }
  }
}
