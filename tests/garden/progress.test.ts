import { describe, expect, it, beforeEach, afterEach, vi } from "vitest"
import {
  DEFAULT_GARDEN_PROGRESS,
  GARDEN_PROGRESS_KEY,
  loadGardenProgress,
  parseGardenProgress,
  saveGardenProgress,
} from "../../src/garden/progress/storage"

describe("Garden progress persistence", () => {
  const memory = new Map<string, string>()

  beforeEach(() => {
    memory.clear()
    const stub: Storage = {
      get length() {
        return memory.size
      },
      clear() {
        memory.clear()
      },
      getItem(key: string) {
        return memory.get(key) ?? null
      },
      key() {
        return null
      },
      removeItem(key: string) {
        memory.delete(key)
      },
      setItem(key: string, value: string) {
        memory.set(key, value)
      },
    }
    vi.stubGlobal("window", { localStorage: stub })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it("parses and sanitizes unknown shapes at the boundary", () => {
    const p = parseGardenProgress({
      schemaVersion: 99,
      solvedBedIds: ["making-ten", "not-a-bed"],
      mossLeaves: 3.7,
    })
    expect(p.schemaVersion).toBe(1)
    expect(p.solvedBedIds).toEqual(["making-ten"])
    expect(p.mossLeaves).toBe(3)
  })

  it("round-trips through localStorage", () => {
    saveGardenProgress({
      ...DEFAULT_GARDEN_PROGRESS,
      solvedBedIds: ["counting-on", "number-line"],
      mossLeaves: 2,
      sessionBedsFinished: 1,
    })
    const loaded = loadGardenProgress()
    expect(loaded.solvedBedIds).toEqual(["counting-on", "number-line"])
    expect(loaded.mossLeaves).toBe(2)
    expect(memory.get(GARDEN_PROGRESS_KEY)).toBeTruthy()
  })
})
