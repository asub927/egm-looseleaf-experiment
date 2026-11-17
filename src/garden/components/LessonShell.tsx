import * as React from "react"
import { bedById } from "../beds/registry"
import { lessonReducer, canLockIn, INITIAL_LESSON_STATE } from "../lesson/reducer"
import {
  initialModelState,
  modelCorrect,
  modelReady,
  stepModel,
  wrongBubble,
} from "../models/engine"
import { answerForProblem, guessChips, problemsForBed } from "../models/problems"
import { problemKey } from "../progress/storage"
import type { BedId, GardenScreen } from "../types"
import { ModelStage } from "./ModelStage"
import { MossPet } from "./MossPet"
import { PeachBubble } from "./PeachBubble"
import { ReadAloudButton } from "./ReadAloudButton"

const BAR_STEPS = ["story", "try", "check", "grow"] as const

export function LessonShell({
  bedId,
  initialProblemIndex,
  solvedProblemKeys,
  calmMode,
  mossLeaves,
  reducedMotion,
  onFinishBed,
  onLeave,
  onMossGrow,
}: {
  bedId: BedId
  initialProblemIndex: 0 | 1
  solvedProblemKeys: string[]
  calmMode: boolean
  mossLeaves: number
  reducedMotion: boolean
  onFinishBed: () => void
  onLeave: () => void
  onMossGrow: (fresh: boolean) => void
}) {
  const bed = bedById(bedId)
  const problems = React.useMemo(() => problemsForBed(bedId), [bedId])
  const [state, dispatch] = React.useReducer(lessonReducer, INITIAL_LESSON_STATE)
  const [line, setLine] = React.useState("")
  const [sub, setSub] = React.useState("")
  const [flowReveal, setFlowReveal] = React.useState(false)
  const [wsStep, setWsStep] = React.useState(0)

  React.useEffect(() => {
    const p = problems[initialProblemIndex]
    dispatch({
      type: "OPEN_LESSON",
      bedId,
      problemIndex: initialProblemIndex,
      modelState: initialModelState(bedId, p),
    })
    setLine(storyLine(bedId, p))
    setSub(promptLine(p))
    setFlowReveal(false)
    setWsStep(0)
  }, [bedId, initialProblemIndex])

  const ctx = state.context
  if (!ctx) return null
  const problem = problems[ctx.problemIndex]
  const ans = answerForProblem(problem)
  const pk = problemKey(bedId, problem.id)
  const wasSolved = solvedProblemKeys.includes(pk)

  const live =
    state.phase === "model" ||
    state.phase === "wrongBubble" ||
    state.phase === "hint1" ||
    state.phase === "hint2" ||
    state.phase === "hint3"

  const showCue = state.phase === "hint2" || state.phase === "hint3"
  const revealCounters = state.phase === "solved" || flowReveal

  function lockIn() {
    if (!ctx || !canLockIn(state)) return
    const ok = modelCorrect(bedId, problem, ctx.modelState)
    const bubble = ok ? undefined : wrongBubble(bedId, problem, ctx.modelState)
    const fresh = !wasSolved && !solvedProblemKeys.includes(pk)
    dispatch({
      type: "LOCK_IN",
      correct: ok,
      bubble,
      wasAlreadySolved: wasSolved,
    })
    if (ok) {
      onMossGrow(fresh)
      setLine(eqLine(problem))
      setSub(
        ctx.guess === ans
          ? `Your guess was ${ctx.guess}. Spot on!`
          : `Your guess was ${ctx.guess}. Now you know: ${ans}.`,
      )
    } else {
      setLine("Not yet, and that's okay.")
      setSub("Look at the picture, then try again.")
    }
  }

  const hintText =
    state.phase === "hint1"
      ? hint1(bedId, problem)
      : state.phase === "hint2"
        ? hint2(bedId)
        : state.phase === "hint3"
          ? worksheetStep(bedId, problem, wsStep)
          : ""

  return (
    <section
      className="lesson"
      style={{ minHeight: "100dvh", display: "flex", flexDirection: "column" }}
    >
      <header
        style={{
          padding: "12px 16px",
          display: "flex",
          flexWrap: "wrap",
          gap: 8,
          alignItems: "center",
        }}
      >
        <button type="button" className="garden-tap" data-testid="to-map" onClick={onLeave}>
          Map
        </button>
        <span data-testid="strategy-chip">Strategy · {bed.ncdpiName}</span>
        <span data-testid="round-chip">
          Problem {ctx.problemIndex + 1} of {problems.length}
        </span>
        <MossPet leaves={mossLeaves} />
        <span aria-pressed={calmMode}>Calm</span>
      </header>
      <ol
        id="lbar"
        style={{ display: "flex", gap: 8, listStyle: "none", padding: "0 16px", margin: 0 }}
      >
        {BAR_STEPS.map((s, j) => (
          <li
            key={s}
            aria-current={state.bar === s ? "step" : undefined}
            className={BAR_STEPS.indexOf(state.bar) > j ? "past" : state.bar === s ? "cur" : ""}
            style={{
              padding: "4px 10px",
              borderRadius: 8,
              background: state.bar === s ? "#D9CCFF" : "#fff",
            }}
          >
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </li>
        ))}
      </ol>
      <div style={{ padding: 16, flex: 1, display: "flex", flexDirection: "column", gap: 16 }}>
        <div>
          <ReadAloudButton getText={() => `${line}. ${sub}`} testId="read-line" />
          <p id="line" data-testid="instruction-line">
            {line}
          </p>
          <p id="sub">{sub}</p>
        </div>
        {state.phase === "story" && (
          <button
            type="button"
            className="garden-tap primary"
            data-testid="start-try"
            onClick={() => dispatch({ type: "START_PREDICT" })}
          >
            Start try
          </button>
        )}
        {state.phase === "predict" && (
          <div id="chips" style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {guessChips(ans).map((v) => (
              <button
                key={v}
                type="button"
                className="garden-tap"
                data-testid={`chip-${v}`}
                onClick={() => {
                  dispatch({ type: "SET_GUESS", guess: v })
                  dispatch({ type: "ENTER_MODEL" })
                  setSub(`Your guess: ${v}. Drag, tap, or use the buttons.`)
                }}
              >
                {v}
              </button>
            ))}
          </div>
        )}
        <MotionPanel data-testid="stagecard">
          {ctx.bubble && (state.phase === "wrongBubble" || state.phase.startsWith("hint")) && (
            <PeachBubble guess={ctx.guess} bubble={ctx.bubble} />
          )}
          {hintText && (
            <div className="hintcard rung" data-testid={`hint-${ctx.hintRung}`}>
              {hintText}
              {state.phase === "hint3" && (
                <button
                  type="button"
                  className="garden-tap wsnext"
                  data-testid="ws-next"
                  onClick={() => {
                    const steps = worksheetSteps(bedId, problem)
                    if (wsStep < steps.length - 1) setWsStep((k) => k + 1)
                    else setFlowReveal(true)
                  }}
                >
                  Next
                </button>
              )}
            </div>
          )}
          <MotionStage
            id="stage"
            data-cue={showCue ? "1" : undefined}
            aria-label={stageLabel(bedId, problem)}
            tabIndex={0}
            onKeyDown={(e: React.KeyboardEvent) => {
              if (!live || state.phase === "solved") return
              if (e.key === "Enter") {
                e.preventDefault()
                lockIn()
                return
              }
              const d =
                e.key === "ArrowRight" || e.key === "ArrowUp"
                  ? 1
                  : e.key === "ArrowLeft" || e.key === "ArrowDown"
                    ? -1
                    : 0
              if (!d) return
              e.preventDefault()
              const n = stepModel(bedId, problem, ctx.modelState, d)
              if (n) dispatch({ type: "SET_MODEL_STATE", modelState: n, via: "keyboard" })
            }}
          >
            <ModelStage
              bedId={bedId}
              problem={problem}
              modelState={ctx.modelState}
              live={live && state.phase !== "solved"}
              showCue={showCue}
              revealTotal={revealCounters}
              reducedMotion={reducedMotion}
              onChange={(n, via) => dispatch({ type: "SET_MODEL_STATE", modelState: n, via })}
            />
          </MotionStage>
        </MotionPanel>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          <button
            type="button"
            id="lock"
            className="garden-tap primary"
            data-testid="lock"
            disabled={!live || !modelReady(bedId, problem, ctx.modelState)}
            onClick={lockIn}
          >
            Lock it in
          </button>
          <button
            type="button"
            id="reset"
            className="garden-tap"
            disabled={!live}
            onClick={() =>
              dispatch({
                type: "RESET_MODEL",
                modelState: initialModelState(bedId, problem),
              })
            }
          >
            Start over
          </button>
          <button
            type="button"
            id="help"
            className="garden-tap"
            disabled={!live}
            onClick={() => dispatch({ type: "HELP" })}
          >
            Help me
          </button>
          <button
            type="button"
            id="step-minus"
            className="garden-tap"
            disabled={!live || !stepModel(bedId, problem, ctx.modelState, -1)}
            onClick={() => {
              const n = stepModel(bedId, problem, ctx.modelState, -1)
              if (n) dispatch({ type: "SET_MODEL_STATE", modelState: n, via: "tap" })
            }}
          >
            Step back
          </button>
          <button
            type="button"
            id="step-plus"
            className="garden-tap"
            disabled={!live || !stepModel(bedId, problem, ctx.modelState, 1)}
            onClick={() => {
              const n = stepModel(bedId, problem, ctx.modelState, 1)
              if (n) dispatch({ type: "SET_MODEL_STATE", modelState: n, via: "tap" })
            }}
          >
            Step forward
          </button>
          {state.phase === "solved" && (
            <button
              type="button"
              id="next"
              className="garden-tap"
              data-testid="next"
              onClick={() => {
                if (ctx.problemIndex === 0) {
                  dispatch({
                    type: "NEXT_PROBLEM",
                    modelState: initialModelState(bedId, problems[1]),
                  })
                  setLine(storyLine(bedId, problems[1]))
                  setSub(promptLine(problems[1]))
                } else onFinishBed()
              }}
            >
              {ctx.problemIndex === 0 ? "Next problem ›" : "Back to the garden ›"}
            </button>
          )}
        </div>
        {state.phase === "solved" && (
          <div data-testid="win">
            <span data-testid="strategy-win">Strategy · {bed.ncdpiName}</span>
            <p data-testid="example">{exampleLine(bedId, problem)}</p>
            <p data-testid="pet-note">
              {ctx.wasAlreadySolved
                ? "You solved this one before. Moss keeps its leaves."
                : "Moss grew a new leaf."}
            </p>
          </div>
        )}
      </div>
      <div
        className="sr-only"
        aria-live="polite"
        aria-atomic="true"
        id="aria"
        data-testid="aria-live"
      >
        {/* Never announce numeric answers before lock-in */}
        {state.phase === "solved" ? eqLine(problem) : live ? "Try the model." : line}
      </div>
    </section>
  )
}

function MotionPanel(props: React.HTMLAttributes<HTMLDivElement>) {
  return <div {...props} className={`motion-fade ${props.className ?? ""}`} />
}
function MotionStage(props: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      {...props}
      className={`motion-fade ${props.className ?? ""}`}
      style={{ outline: "none", ...props.style }}
    />
  )
}

function storyLine(_bedId: BedId, p: ReturnType<typeof problemsForBed>[0]): string {
  if (p.kind === "add") return `${p.a} and ${p.b}. How many in all?`
  if (p.kind === "sub") return `${p.n} seeds. The bunny eats ${p.take}. How many are left?`
  return `${p.whole} carrots. ${p.part} are in the basket. How many in the ground?`
}

function promptLine(p: ReturnType<typeof problemsForBed>[0]): string {
  if (p.kind === "add") return `${p.a} + ${p.b} = ?`
  if (p.kind === "sub") return `${p.n} − ${p.take} = ?`
  return `${p.whole} − ${p.part} = ?`
}

function eqLine(p: ReturnType<typeof problemsForBed>[0]): string {
  const a = answerForProblem(p)
  if (p.kind === "add") return `${p.a} + ${p.b} = ${a}`
  if (p.kind === "sub") return `${p.n} − ${p.take} = ${a}`
  return `${p.whole} − ${p.part} = ${a}`
}

function stageLabel(bedId: BedId, _p: ReturnType<typeof problemsForBed>[0]): string {
  return `${bedById(bedId).ncdpiName} model. No answer spoken until you lock it in.`
}

function hint1(bedId: BedId, p: ReturnType<typeof problemsForBed>[0]): string {
  if (bedId === "making-ten") return "Is the top wire a full ten yet? How many more beads fit?"
  if (bedId === "counting-on" && p.kind === "add")
    return `How many cars did the engine count on? Is that ${p.b}?`
  return "What do you see on the model?"
}

function hint2(_bedId: BedId): string {
  return "Look at the dashed cues on the model."
}

function worksheetSteps(bedId: BedId, p: ReturnType<typeof problemsForBed>[0]): string[] {
  if (p.kind === "add" && bedId === "counting-on") {
    const list = Array.from({ length: p.b }, (_, i) => p.a + i + 1).join(", ")
    return [
      `Put ${p.a} in your head.`,
      `Count on: ${list}.`,
      `You said ${p.b} numbers.`,
      "Your turn. Lock it in.",
    ]
  }
  if (p.kind === "add" && bedId === "number-line") {
    return [`Start at ${p.a}.`, `Hop ${p.b} times.`, "Look at the flag.", "Your turn. Lock it in."]
  }
  return ["Walk through the steps.", "Your turn. Lock it in."]
}

function worksheetStep(bedId: BedId, p: ReturnType<typeof problemsForBed>[0], k: number): string {
  return worksheetSteps(bedId, p)[k] ?? ""
}

function exampleLine(_bedId: BedId, p: ReturnType<typeof problemsForBed>[0]): string {
  const a = answerForProblem(p)
  if (p.kind === "add") return `I worked it out. My answer is ${a}.`
  if (p.kind === "sub") return `I took away and got ${a}.`
  return `I used facts that belong. The answer is ${a}.`
}

export type { GardenScreen }
