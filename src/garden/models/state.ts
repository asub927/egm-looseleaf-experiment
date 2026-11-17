export type BeadState = { moved: number }
export type TrainState = { at: number }
export type CutState = { position: number; phase: "toTen" | "rest" }
export type SeesawState = { crossed: number[]; steps: number }
export type FactState = { tile: number | null }
export type HopState = { land: number }

export type ModelState = BeadState | TrainState | CutState | SeesawState | FactState | HopState
