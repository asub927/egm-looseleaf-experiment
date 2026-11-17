import * as React from "react"
import { BED_REGISTRY } from "../beds/registry"
import { useGardenMapLayout } from "../hooks/use-garden-map-layout"
import { BED_HINT, BLOOM_ART, SEED_ART } from "../map/bed-art"
import type { GardenLayoutRefs } from "../map/layout-map"
import type { BedId } from "../types"
import { MossPet, mossStage } from "./MossPet"
import { PipOwlMap } from "./PipOwl"
import { ReadAloudButton } from "./ReadAloudButton"

function doneCount(done: Record<BedId, boolean>): number {
  return BED_REGISTRY.filter((b) => done[b.id]).length
}

export function GardenMap({
  doneBeds,
  mossLeaves,
  calmMode,
  owlBedIndex,
  reducedMotion,
  onPickBed,
  onDoneForToday,
  onToggleCalm,
}: {
  doneBeds: Record<BedId, boolean>
  mossLeaves: number
  calmMode: boolean
  owlBedIndex: number
  reducedMotion: boolean
  onPickBed: (index: number) => void
  onDoneForToday: () => void
  onToggleCalm: () => void
}) {
  const n = doneCount(doneBeds)
  const line =
    n === 6
      ? "Every bed is finished. Pick any bed to play again."
      : "Pick a garden bed. Pip will walk you there."

  const mapRef = React.useRef<HTMLElement>(null)
  const gardenRef = React.useRef<HTMLDivElement>(null)
  const barRef = React.useRef<HTMLDivElement>(null)
  const maptalkRef = React.useRef<HTMLDivElement>(null)
  const sceneryRef = React.useRef<SVGSVGElement>(null)
  const pathsvgRef = React.useRef<SVGSVGElement>(null)
  const crittersRef = React.useRef<HTMLDivElement>(null)
  const owlRef = React.useRef<HTMLDivElement>(null)
  const bedRefs = React.useRef<(HTMLButtonElement | null)[]>([])

  const layoutRefs = React.useRef<GardenLayoutRefs | null>(null)

  React.useLayoutEffect(() => {
    if (
      !mapRef.current ||
      !gardenRef.current ||
      !barRef.current ||
      !maptalkRef.current ||
      !sceneryRef.current ||
      !pathsvgRef.current ||
      !crittersRef.current ||
      !owlRef.current
    ) {
      return
    }
    layoutRefs.current = {
      mapRoot: mapRef.current,
      garden: gardenRef.current,
      bar: barRef.current,
      maptalk: maptalkRef.current,
      scenery: sceneryRef.current,
      pathsvg: pathsvgRef.current,
      critters: crittersRef.current,
      owl: owlRef.current,
      beds: bedRefs.current.filter(Boolean) as HTMLButtonElement[],
    }
  })

  React.useLayoutEffect(() => {
    if (layoutRefs.current) {
      layoutRefs.current.beds = bedRefs.current.filter(Boolean) as HTMLButtonElement[]
    }
  })

  const doneKey = BED_REGISTRY.map((b) => (doneBeds[b.id] ? "1" : "0")).join("")
  useGardenMapLayout(layoutRefs, owlBedIndex, doneKey, calmMode, reducedMotion)

  return (
    <section
      ref={mapRef}
      id="map"
      className="garden-map-screen"
      data-testid="map"
      aria-labelledby="map-h"
    >
      <div ref={barRef} className="garden-bar bar">
        <h1 id="map-h" tabIndex={-1}>
          Pip&apos;s Math Garden
        </h1>
        <span className="count" data-testid="done-count">
          {n} of 6
        </span>
        <div className="pet-wrap" data-testid="pet">
          <MossPet leaves={mossLeaves} />
          <span className="pet-label">Moss · {mossStage(mossLeaves)}</span>
        </div>
        <span className="sp" />
        <div className="map-actions">
          <button
            type="button"
            className="garden-tap ghostbtn calmbtn"
            aria-pressed={calmMode}
            data-testid="calm-mode"
            onClick={onToggleCalm}
          >
            Calm mode
          </button>
          <button
            type="button"
            className="garden-tap ghostbtn"
            data-testid="done-today"
            onClick={onDoneForToday}
          >
            Done for today
          </button>
        </div>
      </div>
      <div ref={maptalkRef} className="maptalk">
        <ReadAloudButton getText={() => line} testId="read-map" />
        <p id="mapline" data-testid="mapline">
          {line}
        </p>
      </div>
      <div className="garden-canvas" data-testid="garden-canvas">
        <div ref={gardenRef} className="garden" id="garden" data-testid="garden">
          <svg ref={sceneryRef} className="scenery" aria-hidden="true" />
          <svg ref={pathsvgRef} className="pathsvg" aria-hidden="true" />
          <div ref={crittersRef} className="critters" aria-hidden="true" />
          {BED_REGISTRY.map((bed, i) => (
            <button
              key={bed.id}
              ref={(el) => {
                bedRefs.current[i] = el
              }}
              type="button"
              className={`bed garden-tap${doneBeds[bed.id] ? " done" : ""}`}
              style={{ ["--bed" as string]: bed.color }}
              data-testid={`bed-${bed.id}`}
              aria-label={`Bed ${i + 1}: ${bed.ncdpiName}${doneBeds[bed.id] ? ". Finished." : ""}`}
              onClick={() => onPickBed(i)}
            >
              <span className="plot" data-testid={`bed-plot-${bed.id}`}>
                <span dangerouslySetInnerHTML={{ __html: SEED_ART[bed.id] }} />
                <span
                  className="done-badge"
                  data-testid={`bed-tile-${bed.id}`}
                  aria-hidden="true"
                  dangerouslySetInnerHTML={{ __html: BLOOM_ART[bed.id] }}
                />
                <span className="num" aria-hidden="true">
                  {i + 1}
                </span>
              </span>
              <span className="plaque" data-testid={`bed-plaque-${bed.id}`}>
                <span className="name" data-testid={`bed-name-${bed.id}`}>
                  {bed.ncdpiName}
                </span>
                <span className="hint">{BED_HINT[bed.id]}</span>
              </span>
            </button>
          ))}
          <div ref={owlRef} id="owl" className="owl" data-testid="pip-owl-map" aria-hidden="true">
            <PipOwlMap />
          </div>
        </div>
      </div>
    </section>
  )
}
