import { GARDEN_PALETTE } from "../types"
import { PipOwl } from "./PipOwl"
import { ReadAloudButton } from "./ReadAloudButton"

export function RestScreen({
  bedsFinished,
  mossLeaves,
  onAllDone,
}: {
  bedsFinished: number
  mossLeaves: number
  onAllDone: () => void
}) {
  const title = "That's enough for today! Your brain keeps growing while you rest."
  const sub = `You finished ${bedsFinished} ${bedsFinished === 1 ? "bed" : "beds"} today. Moss has ${mossLeaves} ${mossLeaves === 1 ? "leaf." : "leaves."}`

  return (
    <section
      aria-labelledby="rest-h"
      style={{
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        textAlign: "center",
        background: `linear-gradient(180deg, ${GARDEN_PALETTE.sky}, ${GARDEN_PALETTE.paper})`,
      }}
    >
      <div id="rest-pip" data-testid="rest-pip">
        <PipOwl sleep />
      </div>
      <h2 id="rest-h" style={{ fontSize: "1.4rem", maxWidth: 420 }}>
        {title}
      </h2>
      <p id="rest-sub" data-testid="rest-sub" style={{ maxWidth: 400 }}>
        {sub}
      </p>
      <ReadAloudButton getText={() => `${title} ${sub}`} testId="read-rest" />
      <button
        type="button"
        className="garden-tap primary"
        data-testid="all-done"
        style={{ marginTop: 24 }}
        onClick={onAllDone}
      >
        All done
      </button>
    </section>
  )
}
