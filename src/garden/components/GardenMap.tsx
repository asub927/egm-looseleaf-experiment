import * as React from "react"
import { BED_REGISTRY } from "../beds/registry"
import { GARDEN_ACCENT, GARDEN_INK, GARDEN_PALETTE, type BedId } from "../types"
import { MossPet } from "./MossPet"
import { PipOwl } from "./PipOwl"
import { ReadAloudButton } from "./ReadAloudButton"

const HINT: Record<BedId, string> = {
  "making-ten": "Fill to ten",
  "counting-on": "Start and add on",
  decomposing: "Break apart to ten",
  "equivalent-sums": "A friendlier sum",
  relationship: "Facts that belong",
  "number-line": "Hop along",
}

function doneCount(done: Record<BedId, boolean>): number {
  return BED_REGISTRY.filter((b) => done[b.id]).length
}

export function GardenMap({
  doneBeds,
  mossLeaves,
  calmMode,
  owlBedIndex,
  onPickBed,
  onDoneForToday,
  onToggleCalm,
}: {
  doneBeds: Record<BedId, boolean>
  mossLeaves: number
  calmMode: boolean
  owlBedIndex: number
  onPickBed: (index: number) => void
  onDoneForToday: () => void
  onToggleCalm: () => void
}) {
  const n = doneCount(doneBeds)
  const line =
    n === 6
      ? "Every bed is finished. Pick any bed to play again."
      : "Pick a garden bed. Pip will walk you there."

  const [narrowMap, setNarrowMap] = React.useState(() =>
    typeof window !== "undefined" ? window.innerWidth < 820 : true,
  )

  React.useEffect(() => {
    const mq = window.matchMedia("(max-width: 819px)")
    const onChange = () => setNarrowMap(mq.matches)
    onChange()
    mq.addEventListener("change", onChange)
    return () => mq.removeEventListener("change", onChange)
  }, [])

  const wideSpots = [
    { x: "16%", y: "56%" },
    { x: "34%", y: "28%" },
    { x: "52%", y: "50%" },
    { x: "68%", y: "24%" },
    { x: "84%", y: "46%" },
    { x: "70%", y: "78%" },
  ]

  return (
    <section
      className={`garden-map${narrowMap ? " garden-map-narrow" : ""}`}
      aria-label="Pip's Math Garden map"
      style={{ minHeight: "100dvh", display: "flex", flexDirection: "column" }}
    >
      <header
        className="garden-bar"
        style={{
          padding: "12px 16px",
          display: "flex",
          flexWrap: "wrap",
          gap: 12,
          alignItems: "center",
          background: `linear-gradient(180deg, ${GARDEN_PALETTE.sky} 0%, ${GARDEN_PALETTE.paper} 100%)`,
        }}
      >
        <h1 style={{ margin: 0, fontSize: "1.35rem", flex: "1 1 200px" }}>
          Pip&apos;s Math Garden
        </h1>
        <span
          data-testid="done-count"
          style={{
            background: GARDEN_PALETTE.butter,
            padding: "8px 14px",
            borderRadius: 999,
            fontWeight: 800,
          }}
        >
          {n} of 6
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <MossPet leaves={mossLeaves} />
          <span className="pet-label">Moss · {mossLeaves <= 0 ? "seed" : "leafy"}</span>
        </span>
        <button
          type="button"
          className="garden-tap calmbtn"
          aria-pressed={calmMode}
          data-testid="calm-mode"
          onClick={onToggleCalm}
        >
          Calm mode
        </button>
        <button
          type="button"
          className="garden-tap"
          data-testid="done-today"
          onClick={onDoneForToday}
        >
          Done for today
        </button>
      </header>
      <div
        className="maptalk"
        style={{ padding: "8px 16px", display: "flex", gap: 8, alignItems: "center" }}
      >
        <ReadAloudButton getText={() => line} testId="read-map" />
        <p id="mapline" style={{ margin: 0 }}>
          {line}
        </p>
      </div>
      <div
        className="garden-canvas"
        data-testid="garden-canvas"
        style={{
          position: "relative",
          flex: 1,
          minHeight: narrowMap ? 280 : 420,
          margin: "0 8px 12px",
          borderRadius: 24,
          overflow: narrowMap ? "auto" : "hidden",
          background: `linear-gradient(180deg, ${GARDEN_PALETTE.sky} 0%, ${GARDEN_PALETTE.mint} 55%, ${GARDEN_PALETTE.mint} 100%)`,
        }}
      >
        <svg
          data-testid="path"
          viewBox="0 0 100 100"
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            pointerEvents: "none",
          }}
          preserveAspectRatio="none"
        >
          <path
            d="M 4 88 Q 28 68, 52 48 T 96 14"
            fill="none"
            stroke={GARDEN_PALETTE.butter}
            strokeWidth="6"
            strokeLinecap="round"
          />
          <path
            d="M 4 88 Q 28 68, 52 48 T 96 14"
            fill="none"
            stroke={GARDEN_PALETTE.cream}
            strokeWidth="2"
            strokeDasharray="3 5"
            strokeLinecap="round"
            opacity={0.7}
          />
        </svg>
        <section
          data-testid="gate"
          aria-hidden="true"
          style={{
            position: "absolute",
            left: "2%",
            bottom: "6%",
            width: 72,
            height: 88,
            minWidth: 56,
            minHeight: 56,
          }}
        >
          <svg viewBox="0 0 60 80" width="100%" height="100%">
            <rect
              x="8"
              y="20"
              width="18"
              height="55"
              fill={GARDEN_PALETTE.cream}
              stroke={GARDEN_INK}
              strokeWidth="1.5"
            />
            <rect
              x="34"
              y="20"
              width="18"
              height="55"
              fill={GARDEN_PALETTE.cream}
              stroke={GARDEN_INK}
              strokeWidth="1.5"
            />
            <path d="M4 75 H56" stroke={GARDEN_ACCENT.pathWood} strokeWidth="4" />
          </svg>
        </section>
        <section
          data-testid="arbor"
          aria-hidden="true"
          style={{ position: "absolute", right: "2%", top: "4%", width: 80, height: 72 }}
        >
          <svg viewBox="0 0 80 72" width="100%" height="100%">
            <path
              d="M8 70 V30 A32 14 0 0 1 72 30 V70"
              fill="none"
              stroke={GARDEN_INK}
              strokeWidth="6"
            />
            <circle cx="40" cy="24" r="8" fill={GARDEN_PALETTE.rose} stroke={GARDEN_INK} />
          </svg>
        </section>
        <div
          id="garden"
          className={narrowMap ? "garden-beds-grid" : undefined}
          style={narrowMap ? undefined : { position: "absolute", inset: 0 }}
        >
          {narrowMap && (
            <div className="garden-owl-row" data-testid="owl">
              <PipOwl />
            </div>
          )}
          {BED_REGISTRY.map((bed, i) => (
            <button
              key={bed.id}
              type="button"
              className="bed garden-tap"
              data-testid={`bed-${bed.id}`}
              aria-label={`Bed ${i + 1}: ${bed.ncdpiName}${doneBeds[bed.id] ? ". Finished." : ""}`}
              style={
                narrowMap
                  ? {
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: 6,
                      padding: 6,
                      minHeight: 56,
                      width: "100%",
                      background: "transparent",
                      border: "none",
                      ["--bed" as string]: bed.color,
                    }
                  : {
                      position: "absolute",
                      left: wideSpots[i].x,
                      top: wideSpots[i].y,
                      transform: "translate(-50%, -50%)",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: 6,
                      padding: 8,
                      minWidth: 120,
                      minHeight: 56,
                      background: "transparent",
                      border: "none",
                      ["--bed" as string]: bed.color,
                    }
              }
              onClick={() => onPickBed(i)}
            >
              <span
                className="plot"
                data-testid={`bed-plot-${bed.id}`}
                style={{
                  width: narrowMap ? 72 : 88,
                  height: narrowMap ? 56 : 70,
                  borderRadius: 20,
                  background: bed.color,
                  border: `3px solid ${GARDEN_INK}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 900,
                  fontSize: narrowMap ? "1.25rem" : "1.5rem",
                  flexShrink: 0,
                }}
              >
                {doneBeds[bed.id] ? "✓" : i + 1}
              </span>
              <span
                className="plaque"
                data-testid={`bed-plaque-${bed.id}`}
                style={{
                  background: GARDEN_PALETTE.cream,
                  border: `2px solid ${GARDEN_INK}`,
                  borderRadius: 12,
                  padding: narrowMap ? "4px 6px" : "6px 10px",
                  maxWidth: narrowMap ? "100%" : 200,
                  width: "100%",
                  boxSizing: "border-box",
                  textAlign: "center",
                }}
              >
                <span
                  data-testid={`bed-name-${bed.id}`}
                  className="name"
                  style={{
                    fontWeight: 800,
                    display: "block",
                    fontSize: narrowMap ? "0.68rem" : undefined,
                    lineHeight: narrowMap ? 1.2 : undefined,
                  }}
                >
                  {bed.ncdpiName}
                </span>
                <span
                  className="hint"
                  style={{ fontSize: narrowMap ? "0.72rem" : "0.85rem", opacity: 0.85 }}
                >
                  {HINT[bed.id]}
                </span>
              </span>
            </button>
          ))}
          {!narrowMap && (
            <div
              id="owl"
              data-testid="owl"
              className="motion-move"
              style={{
                position: "absolute",
                left: wideSpots[owlBedIndex].x,
                top: `calc(${wideSpots[owlBedIndex].y} - 72px)`,
                transform: "translate(-50%, 0)",
                transition: calmMode ? "transform 480ms ease" : "transform 400ms ease",
                pointerEvents: "none",
              }}
            >
              <PipOwl />
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
