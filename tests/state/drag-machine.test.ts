import test from "node:test"
import assert from "node:assert/strict"
import {
  createInitialDragState,
  dragReducer,
  type DragState,
} from "../../src/lib/state/drag-machine.ts"
import type { SnapTarget } from "../../src/lib/drag/declarative-drag.ts"

const TARGET_HALF: SnapTarget = {
  id: "equal-2",
  value: 0.5,
  shares: 2,
  label: "2 Halves",
}

test("Drag State Machine: Pointer Drag Lifecycle (idle -> free -> snapped -> committed)", () => {
  let state = createInitialDragState(0)
  assert.equal(state.phase, "idle")
  assert.equal(state.isDragging, false)
  assert.equal(state.snappedTarget, null)

  // 1. Pointer Down
  state = dragReducer(state, { type: "POINTER_DOWN", initialValue: 0.1 })
  assert.equal(state.phase, "dragging_free")
  assert.equal(state.isDragging, true)

  // 2. Free movement
  state = dragReducer(state, { type: "MOVE_FREE", value: 0.3 })
  assert.equal(state.phase, "dragging_free")
  assert.equal(state.activeValue, 0.3)

  // 3. Snap captured
  state = dragReducer(state, { type: "SNAP", target: TARGET_HALF, value: 0.5 })
  assert.equal(state.phase, "dragging_snapped")
  assert.equal(state.snappedTarget?.id, "equal-2")
  assert.equal(state.activeValue, 0.5)

  // 4. Pointer Up / Commit
  state = dragReducer(state, { type: "POINTER_UP", finalValue: 0.5, target: TARGET_HALF })
  assert.equal(state.phase, "committed")
  assert.equal(state.isDragging, false)
  assert.equal(state.snappedTarget?.id, "equal-2")
})

test("Drag State Machine: Programmatic snap from button/badge tap", () => {
  let state = createInitialDragState(0)

  state = dragReducer(state, { type: "PROGRAMMATIC_SNAP", target: TARGET_HALF })
  assert.equal(state.phase, "idle")
  assert.equal(state.isDragging, false)
  assert.equal(state.activeValue, 0.5)
  assert.equal(state.snappedTarget?.id, "equal-2")
})
