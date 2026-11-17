import { readdir, readFile } from "node:fs/promises"
import path from "node:path"
import { describe, expect, it } from "vitest"
import { GARDEN_ALLOWED_HEX } from "../../src/garden/types"

const HEX_RE = /#[0-9a-fA-F]{3,8}\b/g
const ROOT = path.join(import.meta.dirname, "..", "..")

async function filesUnder(rel: string) {
  const dir = path.join(ROOT, rel)
  const out: string[] = []
  for (const entry of await readdir(dir, { withFileTypes: true, recursive: true })) {
    if (!entry.isFile()) continue
    const p = path.join(entry.parentPath ?? entry.path, entry.name)
    if (p.endsWith(".ts") || p.endsWith(".tsx") || p.endsWith(".css")) out.push(p)
  }
  return out
}

describe("garden palette", () => {
  it("allows only palette hex in src/garden and theme", async () => {
    const files = [
      ...(await filesUnder("src/garden")),
      path.join(ROOT, "src/garden/theme/garden.css"),
    ]
    const bad: string[] = []
    for (const file of files) {
      const text = await readFile(file, "utf8")
      for (const m of text.match(HEX_RE) ?? []) {
        if (!GARDEN_ALLOWED_HEX.has(m.toLowerCase())) {
          bad.push(`${path.relative(ROOT, file)}: ${m}`)
        }
      }
    }
    expect(bad).toEqual([])
  })
})
