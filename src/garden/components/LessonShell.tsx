import * as React from "react"
import { bedById } from "../beds/registry"
import { lessonReducer, canLockIn, INITIAL_LESSON_STATE } from "../lesson/reducer"
import {
  initialModelState,
  modelCorrect,
  modelReady,
  modelFlowCounters,
  modelPills,
  stepModel,
  wrongBubble,
} from "../models/engine"
import {
  eqLine,
  exampleLine,
  guessQuestion,
  hint1Line,
  hint2Line,
  promptLine,
  stepperLabels,
  storyLine,
  tryLine,
} from "../models/copy"
import { answerForProblem, guessChips, problemsForBed } from "../models/problems"
import { problemKey } from "../progress/storage"
import { watchStepsForBed } from "../models/watch-steps"
import type { BedId, GardenScreen } from "../types"
import { ModelStage } from "./ModelStage"
import { MossPetWrap } from "./MossPet"
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
  const [wsWatchIndex, setWsWatchIndex] = React.useState(0)
  const [plusOn, setPlusOn] = React.useState(false)

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
    resetWorksheet()
  }, [bedId, initialProblemIndex])

  function resetWorksheet() {
    setFlowReveal(false)
    setWsStep(0)
    setWsWatchIndex(0)
  }

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

  const inCheck =
    state.bar === "check" ||
    state.phase === "wrongBubble" ||
    state.phase === "hint1" ||
    state.phase === "hint2" ||
    state.phase === "hint3"
  const showCue = inCheck && ctx.hintRung >= 2 && state.phase !== "solved"
  const watchSteps = watchStepsForBed(bedId, problem)
  const onWorksheet = inCheck && ctx.hintRung >= 3 && !!watchSteps
  const watchStep = onWorksheet ? (watchSteps?.[wsWatchIndex] ?? null) : null
  const watchState = watchStep?.state ?? null
  const watchReveal = watchStep?.beat === "reveal" || watchStep?.revealCounters === true
  const flowOut = !reducedMotion && (watchStep?.beat === "zoom" || watchStep?.beat === "reveal")
  const interactive = live && watchState === null
  const revealCounters = state.phase === "solved" || flowReveal || watchReveal

  const curBar = BAR_STEPS.indexOf(state.bar)
  const [stepMinus, stepPlus] = stepperLabels(bedId)

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
      if (fresh) {
        setPlusOn(true)
        window.setTimeout(() => setPlusOn(false), 1800)
      }
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
    !inCheck || ctx.hintRung >= 3
      ? ""
      : ctx.hintRung === 1
        ? hint1Line(bedId, problem)
        : hint2Line(bedId)

  return (
    <>
      <h2 className="sr-only" id="lesson-h" tabIndex={-1}>
        Lesson
      </h2>
      <div className="bar">
        <button
          type="button"
          className="ghostbtn"
          data-testid="to-map"
          aria-label="Back to the garden map"
          onClick={onLeave}
        >
          ‹ <span className="wide-only">Garden map</span>
          <span className="narrow-only">Map</span>
        </button>
        <span className="chip" data-testid="strategy-chip">
          Strategy · {bed.ncdpiName}
        </span>
        <span className="sp" />
        <span className="count" id="round-chip" data-testid="round-chip">
          <span className="wide-only">Problem </span>
          {ctx.problemIndex + 1} of {problems.length}
        </span>
        <MossPetWrap
          leaves={mossLeaves}
          plusOn={plusOn || (state.phase === "solved" && !ctx.wasAlreadySolved)}
        />
        <button
          type="button"
          className="ghostbtn calmbtn"
          data-testid="calm"
          aria-pressed={calmMode}
        >
          Calm<span className="wide-only"> mode</span>
        </button>
      </div>
      <div className="lmain" id="lmain">
        <ol className="lbar" id="lbar" data-testid="lesson-bar" aria-label="Lesson steps">
          {BAR_STEPS.map((s, j) => (
            <li
              key={s}
              data-step={s}
              aria-current={state.bar === s ? "step" : undefined}
              className={curBar > j ? "past" : state.bar === s ? "cur" : ""}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </li>
          ))}
        </ol>
        <section className="talk">
          <div className="linerow">
            <ReadAloudButton
              className="read"
              getText={() => `${line}. ${sub}`}
              testId="read-line"
              label="Read instruction aloud"
            />
            <div className="line" id="line" data-testid="instruction-line">
              {line}
            </div>
          </div>
          <div className="sub" id="sub" data-testid="sub">
            {sub}
          </div>
          <button
            type="button"
            className={`trybtn${state.phase !== "story" ? " hide" : ""}`}
            id="start-try"
            data-testid="start-try"
            onClick={() => {
              dispatch({ type: "START_PREDICT" })
              setLine(guessQuestion(bedId))
              setSub("Tap a guess. There is no wrong guess.")
            }}
          >
            Let&apos;s try
          </button>
          <div
            className={`chips${state.phase !== "predict" ? " hide" : ""}`}
            id="chips"
            role="group"
            aria-label="Pick a guess"
          >
            {guessChips(ans).map((v) => (
              <button
                key={v}
                type="button"
                className={ctx.guess === v ? "pick" : ""}
                data-testid={`chip-${v}`}
                onClick={() => {
                  dispatch({ type: "SET_GUESS", guess: v })
                  dispatch({ type: "ENTER_MODEL" })
                  setLine(tryLine(bedId, problem))
                  setSub(`Your guess: ${v}. Drag, tap, or use the buttons.`)
                }}
              >
                {v}
              </button>
            ))}
          </div>
          <LessonCounter
            bedId={bedId}
            problem={problem}
            modelState={watchState ?? ctx.modelState}
            phase={state.phase}
            solved={state.phase === "solved"}
            revealCounters={revealCounters}
            pacing={bed.pacing}
          />
        </section>
        <section className="stagewrap">
          <div className="stagecard" id="stagecard" data-testid="stagecard">
            <div
              id="stage"
              data-testid="stage"
              data-cue={showCue ? "1" : undefined}
              data-keyboard={ctx.via === "keyboard" ? "1" : "0"}
              data-via={ctx.via ?? "none"}
              aria-label={stageLabel(bedId, problem)}
              tabIndex={0}
              role="group"
              onKeyDown={(e: React.KeyboardEvent) => {
                if (!interactive) return
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
                watchState={watchState}
                snapMotion={ctx.via === "keyboard"}
                equationsRevealed={state.phase === "solved"}
                live={live}
                showCue={showCue}
                revealTotal={revealCounters}
                reducedMotion={reducedMotion}
                flowOut={flowOut}
                onChange={(n, via) => dispatch({ type: "SET_MODEL_STATE", modelState: n, via })}
              />
            </div>
          </div>
          <div className="stepper" id="stepper">
            <button
              type="button"
              id="step-minus"
              data-testid="step-minus"
              disabled={!interactive || !stepModel(bedId, problem, ctx.modelState, -1)}
              onClick={() => {
                const n = stepModel(bedId, problem, ctx.modelState, -1)
                if (n) dispatch({ type: "SET_MODEL_STATE", modelState: n, via: "tap" })
              }}
            >
              {stepMinus}
            </button>
            <button
              type="button"
              id="step-plus"
              data-testid="step-plus"
              disabled={!interactive || !stepModel(bedId, problem, ctx.modelState, 1)}
              onClick={() => {
                const n = stepModel(bedId, problem, ctx.modelState, 1)
                if (n) dispatch({ type: "SET_MODEL_STATE", modelState: n, via: "tap" })
              }}
            >
              {stepPlus}
            </button>
          </div>
        </section>
        <section className="panel" id="panel" data-testid="panel">
          {ctx.bubble && (state.phase === "wrongBubble" || state.phase.startsWith("hint")) && (
            <PeachBubble
              guess={ctx.guess}
              bubble={ctx.bubble}
              settle={reducedMotion || onWorksheet}
            />
          )}
          {onWorksheet && watchStep ? (
            <div className="worksheet rung" data-testid="worksheet">
              <div className="wshead">
                STEP {wsWatchIndex + 1} OF {watchSteps.length}
              </div>
              <div className="wsrow">
                <ReadAloudButton
                  className="read"
                  getText={() => watchStep.text}
                  testId="read-ws"
                  label="Read worksheet step aloud"
                />
                <div className="step" data-testid="ws-step">
                  {watchStep.text}
                </div>
              </div>
              {watchStep.beat !== "reset" && (
                <button
                  type="button"
                  className="wsnext"
                  data-testid="ws-next"
                  onClick={() => {
                    setWsWatchIndex((k) => {
                      const next = Math.min(k + 1, watchSteps.length - 1)
                      if (watchSteps[next]?.beat === "reset") setFlowReveal(false)
                      return next
                    })
                  }}
                >
                  Next
                </button>
              )}
            </div>
          ) : (
            hintText && (
              <div className="card hintcard rung" data-testid={`hint-${ctx.hintRung}`}>
                <div>{hintText}</div>
                {state.phase === "hint3" && (
                  <button
                    type="button"
                    className="wsnext"
                    data-testid="ws-next"
                    onClick={() => {
                      if (wsStep < WORKSHEET_STEPS.length - 1) setWsStep((k) => k + 1)
                      else setFlowReveal(true)
                    }}
                  >
                    Next
                  </button>
                )}
              </div>
            )
          )}
          {state.phase === "solved" && (
            <div className="card win" data-testid="win">
              <div className="top">
                <ReadExample
                  getText={() => `Strategy: ${bed.ncdpiName}. ${exampleLine(bedId, problem)}`}
                  testId="read-win"
                />
                <div>
                  <span className="chip" data-testid="strategy-win">
                    Strategy · {bed.ncdpiName}
                  </span>
                  <div data-testid="example">{exampleLine(bedId, problem)}</div>
                </div>
              </div>
              <div className="petnote" data-testid="pet-note">
                {ctx.wasAlreadySolved
                  ? "You solved this one before. Moss keeps its leaves."
                  : "Moss grew a new leaf."}
              </div>
            </div>
          )}
        </section>
      </div>
      <div className="foot">
        <button
          type="button"
          className="lock"
          id="lock"
          data-testid="lock"
          disabled={!interactive || !modelReady(bedId, problem, ctx.modelState)}
          onClick={lockIn}
        >
          Lock it in
        </button>
        <button
          type="button"
          className="ghostbtn"
          id="reset"
          data-testid="reset"
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
          className="ghostbtn"
          id="help"
          data-testid="help"
          disabled={!live}
          onClick={() => {
            dispatch({ type: "HELP" })
            setWsWatchIndex(0)
          }}
        >
          Help me
        </button>
        <span className="sp" />
        <button
          type="button"
          className={`next${state.phase !== "solved" ? " hide" : ""}`}
          id="next"
          data-testid="next"
          onClick={() => {
            if (ctx.problemIndex === 0) {
              dispatch({
                type: "NEXT_PROBLEM",
                modelState: initialModelState(bedId, problems[1]),
              })
              setLine(storyLine(bedId, problems[1]))
              setSub(promptLine(problems[1]))
              resetWorksheet()
            } else onFinishBed()
          }}
        >
          {ctx.problemIndex === 0 ? "Next problem ›" : "Back to the garden ›"}
        </button>
      </div>
      <div
        className="sr-only"
        aria-live="polite"
        aria-atomic="true"
        id="aria"
        data-testid="aria-live"
      >
        {state.phase === "solved" ? eqLine(problem) : live ? "Try the model." : line}
      </div>
    </>
  )
}

function LessonCounter({
  bedId,
  problem,
  modelState,
  phase,
  solved,
  revealCounters,
  pacing,
}: {
  bedId: BedId
  problem: ReturnType<typeof problemsForBed>[0]
  modelState: import("../models/state").ModelState
  phase: string
  solved: boolean
  revealCounters: boolean
  pacing: boolean
}) {
  if (phase === "story" || phase === "predict") {
    return <div className="counter" id="counter" data-testid="counter" />
  }
  const flow = pacing ? modelFlowCounters(bedId, problem, modelState, revealCounters) : null
  if (flow) {
    return (
      <div className="counter" id="counter" data-testid="counter">
        <div className="flowcounts" data-testid="flow-counts">
          {flow.map((row, i) => (
            <div
              key={row.label}
              className={`flowcount ${i ? "total" : "step"}${i && revealCounters ? " revealed" : ""}`}
              data-testid={`pill-${i}`}
            >
              <span className="flowlabel">{row.label}</span>
              <span
                className={`flownum${row.value === "—" ? " pending" : ""}`}
                data-testid={i ? "flow-total" : "flow-step"}
              >
                {row.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    )
  }
  const pills = modelPills(bedId, problem, modelState, solved)
  return (
    <div className="counter" id="counter" data-testid="counter">
      {pills.map((text, i) => (
        <span
          key={text}
          className={`pill ${solved ? "ok" : i ? "p2" : "p1"}`}
          data-testid={`pill-${i}`}
        >
          {text}
        </span>
      ))}
    </div>
  )
}

function ReadExample({ getText, testId }: { getText: () => string; testId: string }) {
  return (
    <ReadAloudButton
      className="read"
      getText={getText}
      testId={testId}
      label="Read example aloud"
    />
  )
}

function stageLabel(bedId: BedId, p: ReturnType<typeof problemsForBed>[0]): string {
  if (bedId === "counting-on" && p.kind === "add") {
    return `Number train. Cars 1 to 20. The engine starts at car ${p.a}.`
  }
  return `${bedById(bedId).ncdpiName} model. No answer spoken until you lock it in.`
}

const WORKSHEET_STEPS = ["Walk through the steps.", "Your turn. Lock it in."]

export type { GardenScreen }
