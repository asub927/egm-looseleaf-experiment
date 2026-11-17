import { GARDEN_DEMO, GARDEN_PALETTE } from "../types"
import { MossPet } from "./MossPet"
import { PipOwl } from "./PipOwl"
import { ReadAloudButton } from "./ReadAloudButton"

export function RestScreen({
  bedsFinished,
  mossLeaves,
  reducedMotion,
  onAllDone,
}: {
  bedsFinished: number
  mossLeaves: number
  reducedMotion?: boolean
  onAllDone: () => void
}) {
  const title = "That's enough for today! Your brain keeps growing while you rest."
  const sub = `You finished ${bedsFinished} ${bedsFinished === 1 ? "bed" : "beds"} today. Moss has ${mossLeaves} ${mossLeaves === 1 ? "leaf." : "leaves."}`
  const breathe = reducedMotion ? "" : " breathe"

  return (
    <section id="rest" data-testid="rest" aria-labelledby="rest-h">
      <svg
        className="rest-scene"
        viewBox="0 0 1200 800"
        preserveAspectRatio="xMidYMax slice"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="rest-sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={GARDEN_DEMO.restSkyTop} />
            <stop offset="1" stopColor={GARDEN_DEMO.restSkyBottom} />
          </linearGradient>
        </defs>
        <rect width="1200" height="800" fill="url(#rest-sky)" />
        <ellipse cx="980" cy="140" rx="70" ry="70" fill={GARDEN_PALETTE.butter} opacity="0.55" />
        <path
          d="M0 430 C 220 360, 420 470, 640 400 C 860 330, 1040 430, 1200 390 L 1200 800 L 0 800 Z"
          fill={GARDEN_PALETTE.lavender}
          opacity="0.45"
        />
        <path
          d="M0 520 C 260 460, 520 580, 820 500 C 1000 450, 1120 540, 1200 520 L 1200 800 L 0 800 Z"
          fill={GARDEN_PALETTE.mint}
          opacity="0.8"
        />
        <path
          d="M0 620 C 300 580, 600 680, 900 610 L 1200 640 L 1200 800 L 0 800 Z"
          fill={GARDEN_DEMO.restHill}
        />
      </svg>
      <div className="restcard">
        <div className="sleepers">
          <div className={`pip${breathe}`} id="rest-pip" data-testid="rest-pip">
            <PipOwl sleep />
          </div>
          <span className="zz" aria-hidden="true">
            z z
          </span>
          <span className={`pet${breathe}`} id="rest-pet">
            <MossPet leaves={mossLeaves} />
          </span>
        </div>
        <div className="restrow">
          <ReadAloudButton
            className="read"
            getText={() => `${title} ${sub}`}
            testId="read-rest"
            label="Read rest screen aloud"
          />
          <h2 className="resttext" id="rest-h" tabIndex={-1} data-testid="rest-text">
            {title}
          </h2>
        </div>
        <p className="restsub" id="rest-sub" data-testid="rest-sub">
          {sub}
        </p>
        <button type="button" className="alldone" data-testid="all-done" onClick={onAllDone}>
          All done
        </button>
      </div>
    </section>
  )
}
