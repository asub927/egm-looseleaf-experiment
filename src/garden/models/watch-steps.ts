import type { BedId } from "../types"
import type { ModelState } from "./state"
import type { ProblemSpec } from "./problems"

export type WatchBeat = "step" | "zoom" | "reveal" | "reset"

export type WatchStep = {
  text: string
  state: ModelState | null
  beat: WatchBeat
  revealCounters?: boolean
}

export function watchStepsForBed(bedId: BedId, p: ProblemSpec): WatchStep[] | null {
  if (p.kind !== "add") return null
  if (bedId === "counting-on") {
    const steps: WatchStep[] = [
      { text: `Put ${p.a} in your head.`, state: { at: p.a }, beat: "step" },
    ]
    for (let i = 1; i <= p.b; i++) {
      steps.push({
        text: `Count on ${i}: ${p.a + i}.`,
        state: { at: p.a + i },
        beat: "step",
      })
    }
    steps.push({
      text: "Look at the whole train.",
      state: { at: p.a + p.b },
      beat: "zoom",
    })
    steps.push({
      text: `You said ${p.b} numbers. ${p.a} + ${p.b} = ${p.a + p.b}.`,
      state: { at: p.a + p.b },
      beat: "reveal",
      revealCounters: true,
    })
    steps.push({
      text: "Your turn. Drag the engine and lock it in.",
      state: null,
      beat: "reset",
    })
    return steps
  }
  if (bedId === "number-line") {
    const steps: WatchStep[] = [{ text: `Start at ${p.a}.`, state: { land: p.a }, beat: "step" }]
    for (let i = 1; i <= p.b; i++) {
      steps.push({
        text: `Hop ${i}: land on ${p.a + i}.`,
        state: { land: p.a + i },
        beat: "step",
      })
    }
    steps.push({
      text: "Look at all the hops together.",
      state: { land: p.a + p.b },
      beat: "zoom",
    })
    steps.push({
      text: `${p.a} + ${p.b} = ${p.a + p.b}.`,
      state: { land: p.a + p.b },
      beat: "reveal",
      revealCounters: true,
    })
    steps.push({ text: "Your turn. Move the flag and lock it in.", state: null, beat: "reset" })
    return steps
  }
  return null
}
