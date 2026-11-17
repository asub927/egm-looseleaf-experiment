import * as React from "react"
import { BED_REGISTRY, bedIndex } from "./beds/registry"
import { GardenMap } from "./components/GardenMap"
import { LessonShell } from "./components/LessonShell"
import { RestScreen } from "./components/RestScreen"
import { loadGardenProgress, problemKey, saveGardenProgress } from "./progress/storage"
import type { BedId, GardenProgress, GardenScreen } from "./types"
import "./theme/garden.css"

function doneRecord(progress: GardenProgress): Record<BedId, boolean> {
  const out = {} as Record<BedId, boolean>
  for (const b of BED_REGISTRY) {
    out[b.id] = progress.solvedBedIds.includes(b.id)
  }
  return out
}

export default function GardenApp() {
  const [progress, setProgress] = React.useState<GardenProgress>(() => loadGardenProgress())
  const [screen, setScreen] = React.useState<GardenScreen>("map")
  const [activeBed, setActiveBed] = React.useState<BedId | null>(null)
  const [problemIndex, setProblemIndex] = React.useState<0 | 1>(0)
  const reducedMotion = React.useMemo(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    [],
  )

  React.useEffect(() => {
    saveGardenProgress(progress)
  }, [progress])

  React.useEffect(() => {
    if (screen === "map" && progress.sessionBedsFinished >= 3 && !progress.restedThisSession) {
      setScreen("rest")
    }
  }, [screen, progress.sessionBedsFinished, progress.restedThisSession])

  const persist = React.useCallback((patch: Partial<GardenProgress>) => {
    setProgress((prev) => ({ ...prev, ...patch }))
  }, [])

  const pickBed = (index: number) => {
    const bed = BED_REGISTRY[index]
    if (!bed) return
    setActiveBed(bed.id)
    setProblemIndex(0)
    persist({ owlBedIndex: index })
    window.setTimeout(() => setScreen("lesson"), reducedMotion ? 40 : 400)
  }

  const finishBed = () => {
    if (!activeBed) return
    const already = progress.solvedBedIds.includes(activeBed)
    const solvedBedIds = already ? progress.solvedBedIds : [...progress.solvedBedIds, activeBed]
    const sessionBedsFinished = already
      ? progress.sessionBedsFinished
      : progress.sessionBedsFinished + 1
    persist({ solvedBedIds, sessionBedsFinished })
    setActiveBed(null)
    setScreen("map")
    if (sessionBedsFinished >= 3 && !progress.restedThisSession) {
      setScreen("rest")
    }
  }

  const onMossGrow = (fresh: boolean) => {
    if (!activeBed || !fresh) return
    const pk = problemKey(activeBed, BED_REGISTRY[bedIndex(activeBed)].problemIds[problemIndex])
    setProgress((prev) => ({
      ...prev,
      mossLeaves: prev.mossLeaves + 1,
      solvedProblemKeys: [...new Set([...prev.solvedProblemKeys, pk])],
    }))
  }

  return (
    <div
      className={`garden-root${reducedMotion ? " nomove" : ""}${progress.calmMode ? " calm" : ""}`}
      data-testid="garden-app"
    >
      <i className="sr-only" data-testid="ready">
        ready
      </i>
      {screen === "map" && (
        <GardenMap
          doneBeds={doneRecord(progress)}
          mossLeaves={progress.mossLeaves}
          calmMode={progress.calmMode}
          owlBedIndex={progress.owlBedIndex}
          onPickBed={pickBed}
          onDoneForToday={() => setScreen("rest")}
          onToggleCalm={() => persist({ calmMode: !progress.calmMode })}
        />
      )}
      {screen === "lesson" && activeBed && (
        <LessonShell
          bedId={activeBed}
          initialProblemIndex={problemIndex}
          solvedProblemKeys={progress.solvedProblemKeys}
          calmMode={progress.calmMode}
          mossLeaves={progress.mossLeaves}
          reducedMotion={reducedMotion}
          onFinishBed={finishBed}
          onLeave={() => {
            setActiveBed(null)
            setScreen("map")
          }}
          onMossGrow={onMossGrow}
        />
      )}
      {screen === "rest" && (
        <RestScreen
          bedsFinished={progress.sessionBedsFinished}
          mossLeaves={progress.mossLeaves}
          onAllDone={() => {
            persist({ restedThisSession: true })
            setScreen("map")
          }}
        />
      )}
    </div>
  )
}
