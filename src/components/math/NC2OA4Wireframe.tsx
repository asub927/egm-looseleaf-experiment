"use client"

import * as React from "react"
import { Desk } from "@/components/ui/desk"
import { Paper } from "@/components/ui/paper"
import { Tape } from "@/components/ui/tape"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Seal } from "@/components/ui/seal"
import { Highlight } from "@/components/ui/highlight"
import { Handwritten } from "@/components/ui/handwritten"
import { confetti } from "@/components/ui/confetti"
import { ArrayBoard } from "@/components/math/ArrayBoard"
import { SupplyTray } from "@/components/math/SupplyTray"
import { MascotCompanion } from "@/components/math/MascotCompanion"
import { useArrayScaffolding } from "@/hooks/use-socratic-scaffolding"
import { useAudioNarration } from "@/hooks/use-audio-narration"
import { playStampThud, playPickupChirp, playNudgeTone, playVictoryFanfare } from "@/lib/audio/sfx"
import { loadStudentProfile, addStars, markStandardMastered } from "@/lib/storage/profile"
import type { DeskTheme } from "@/App"

const ROWS = 5
const COLS = 5

export interface ArrayChallenge {
  id: string
  label: string
  totalCookies: number
  targetRows: number
  targetCols: number
}

export const ARRAY_CHALLENGES: ArrayChallenge[] = [
  { id: "3x4", label: "12 cookies (3 rows of 4)", totalCookies: 12, targetRows: 3, targetCols: 4 },
  { id: "4x3", label: "12 cookies (4 rows of 3)", totalCookies: 12, targetRows: 4, targetCols: 3 },
  { id: "2x5", label: "10 cookies (2 rows of 5)", totalCookies: 10, targetRows: 2, targetCols: 5 },
  { id: "5x2", label: "10 cookies (5 rows of 2)", totalCookies: 10, targetRows: 5, targetCols: 2 },
  { id: "3x5", label: "15 cookies (3 rows of 5)", totalCookies: 15, targetRows: 3, targetCols: 5 },
  { id: "2x4", label: "8 cookies (2 rows of 4)", totalCookies: 8, targetRows: 2, targetCols: 4 },
  { id: "4x2", label: "8 cookies (4 rows of 2)", totalCookies: 8, targetRows: 4, targetCols: 2 },
  { id: "3x3", label: "9 cookies (3 rows of 3)", totalCookies: 9, targetRows: 3, targetCols: 3 },
]

export function NC2OA4Wireframe({
  onSwitchToParity,
  onSwitchToGeometry,
  theme = "honey",
  onSetTheme,
}: {
  onSwitchToParity?: () => void
  onSwitchToGeometry?: () => void
  theme?: DeskTheme
  onSetTheme?: (t: DeskTheme) => void
}) {
  const [challengeIdx, setChallengeIdx] = React.useState<number>(0)
  const challenge = ARRAY_CHALLENGES[challengeIdx]

  const [grid, setGrid] = React.useState<boolean[][]>(() =>
    Array(ROWS)
      .fill(null)
      .map(() => Array(COLS).fill(false)),
  )
  const [supplyCount, setSupplyCount] = React.useState<number>(challenge.totalCookies)
  const [activeLens, setActiveLens] = React.useState<"none" | "row" | "col">("none")
  const [speech, setSpeech] = React.useState<string>(
    `Hi Kit! Can you bake ${challenge.totalCookies} cookies into ${challenge.targetRows} equal rows? Tap a cookie to place it!`,
  )
  const [isCorrectArray, setIsCorrectArray] = React.useState<boolean>(false)
  const [discoveredCommutative, setDiscoveredCommutative] = React.useState<boolean>(false)

  // Audio & Profile
  const [soundEnabled, setSoundEnabled] = React.useState<boolean>(true)
  const [starCount, setStarCount] = React.useState<number>(() => {
    return loadStudentProfile().stars
  })

  // Headless Audio Narration Bus
  const narration = useAudioNarration({
    enabled: soundEnabled,
    defaultIdlePose: "idle",
    resetPoseOnEnd: false,
  })

  // Socratic Progressive Hint Ladder (Tier 1 Prompt -> Tier 2 Ghost -> Tier 3 Demonstration)
  const scaffolding = useArrayScaffolding({
    spec: {
      targetRows: challenge.targetRows,
      targetCols: challenge.targetCols,
      totalTokens: challenge.totalCookies,
    },
    grid,
    onGridChange: (newGrid) => {
      setGrid(newGrid)
      const placed = newGrid.flat().filter(Boolean).length
      setSupplyCount(Math.max(0, challenge.totalCookies - placed))
      if (soundEnabled) playStampThud()
    },
    onIsomorphicRetry: (newSpec) => {
      const matchIdx = ARRAY_CHALLENGES.findIndex(
        (c) =>
          c.targetRows === newSpec.targetRows &&
          c.targetCols === newSpec.targetCols &&
          c.totalCookies === newSpec.totalTokens,
      )
      const targetIdx = matchIdx !== -1 ? matchIdx : 0
      setChallengeIdx(targetIdx)
      const nextChal = ARRAY_CHALLENGES[targetIdx]
      setGrid(
        Array(ROWS)
          .fill(null)
          .map(() => Array(COLS).fill(false)),
      )
      setSupplyCount(nextChal.totalCookies)
      setActiveLens("none")
      setIsCorrectArray(false)
      setDiscoveredCommutative(false)
      const intro = `New isomorphic challenge! Can you bake all ${nextChal.totalCookies} cookies into ${nextChal.targetRows} equal rows?`
      setSpeech(intro)
      narration.speak(intro, { pose: "wave" })
    },
  })

  // Toggle sound enabled state
  const toggleSound = () => {
    const nextSound = !soundEnabled
    setSoundEnabled(nextSound)
    narration.setEnabled(nextSound)
  }

  // Switch challenge seed
  const switchChallenge = (idx: number) => {
    const nextChal = ARRAY_CHALLENGES[idx]
    setChallengeIdx(idx)
    setGrid(
      Array(ROWS)
        .fill(null)
        .map(() => Array(COLS).fill(false)),
    )
    setSupplyCount(nextChal.totalCookies)
    setActiveLens("none")
    setIsCorrectArray(false)
    setDiscoveredCommutative(false)
    scaffolding.resetScaffolding()
    const intro = `New bakery challenge! Can you arrange all ${nextChal.totalCookies} cookies into ${nextChal.targetRows} equal rows?`
    setSpeech(intro)
    narration.speak(intro, { pose: "wave" })
  }

  // Direct Tap-to-Place / Pickup on Cell
  const handleCellClick = (r: number, c: number) => {
    scaffolding.onTokenMutated()
    const isOccupied = grid[r][c]
    if (isOccupied) {
      if (soundEnabled) playPickupChirp()
      const newGrid = grid.map((row, ri) =>
        row.map((cell, ci) => (ri === r && ci === c ? false : cell)),
      )
      setGrid(newGrid)
      setSupplyCount((prev) => Math.min(challenge.totalCookies, prev + 1))
      setIsCorrectArray(false)
      setDiscoveredCommutative(false)
      setActiveLens("none")
      const text = `Picked up cookie from Row ${r + 1}. ${supplyCount + 1} cookies in tray.`
      setSpeech(text)
      narration.speak(text, { pose: "idle" })
    } else {
      if (supplyCount <= 0) {
        const text = `All ${challenge.totalCookies} cookies are placed! Tap any cookie to pick it up or tap Check below.`
        setSpeech(text)
        narration.speak(text, { pose: "oops" })
        return
      }
      if (soundEnabled) playStampThud()
      const newGrid = grid.map((row, ri) =>
        row.map((cell, ci) => (ri === r && ci === c ? true : cell)),
      )
      setGrid(newGrid)
      setSupplyCount((prev) => Math.max(0, prev - 1))
      setIsCorrectArray(false)
      setDiscoveredCommutative(false)
      setActiveLens("none")
      const text = `Cookie placed in Row ${r + 1}!`
      setSpeech(text)
      narration.speak(text, { pose: "wave" })
    }
  }

  // Auto-stamp next slot from cookie jar
  const handleStampFromJar = () => {
    if (supplyCount <= 0) {
      const text = "All cookies are placed! Tap any cookie on the tray to pick it up."
      setSpeech(text)
      narration.speak(text, { pose: "oops" })
      return
    }

    // Find first empty cell (row by row)
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (!grid[r][c]) {
          handleCellClick(r, c)
          return
        }
      }
    }
  }

  // Row counts analysis
  const rowCounts = React.useMemo(() => grid.map((row) => row.filter(Boolean).length), [grid])

  // Column counts analysis
  const colCounts = React.useMemo(() => {
    const counts: number[] = []
    for (let c = 0; c < COLS; c++) {
      let count = 0
      for (let r = 0; r < ROWS; r++) {
        if (grid[r][c]) count++
      }
      counts.push(count)
    }
    return counts
  }, [grid])

  const totalPlaced = React.useMemo(() => rowCounts.reduce((a, b) => a + b, 0), [rowCounts])

  // Diagnostic Socratic Answer Checker (Escalates Progressive Hint Ladder)
  const checkAnswer = () => {
    const diagnostic = scaffolding.checkAnswer(grid)

    if (diagnostic.status === "correct") {
      if (soundEnabled) playVictoryFanfare()
      setIsCorrectArray(true)
      setActiveLens("row")
      setSpeech(diagnostic.feedback)
      narration.speak(diagnostic.feedback, { pose: "celebrate" })
      return
    }

    // Failure detected: play nudge tone and coordinate audio feedback with ladder tier
    if (soundEnabled) playNudgeTone()
    setIsCorrectArray(false)

    if (
      diagnostic.status === "orientation_error" ||
      diagnostic.status === "wrong_row_count" ||
      diagnostic.status === "unequal_rows"
    ) {
      setActiveLens("row")
    }

    // Determine pedagogical speech based on scaffolding escalation
    let speechToDeliver = diagnostic.feedback
    let poseToAdopt = scaffolding.mascotPose

    if (scaffolding.failureCount === 1) {
      // Escalating to Tier 2 on 2nd error
      speechToDeliver = `Pencil Pal drew dotted ghost boxes for ${challenge.targetRows} rows of ${challenge.targetCols}! Can you fill the ghost boxes?`
      poseToAdopt = "sketch"
    } else if (scaffolding.failureCount >= 2) {
      // Escalating to Tier 3 on 3rd error
      speechToDeliver = `Pencil Pal placed Row 1 with ${challenge.targetCols} cookies! Now can you finish Rows 2 and ${challenge.targetRows}?`
      poseToAdopt = "sketch"
    }

    setSpeech(speechToDeliver)
    narration.speak(speechToDeliver, { pose: poseToAdopt })
  }

  // Student clicks "Ask Pencil Pal for a Hint" (Triggers Tier 3 Demonstration or Isomorphic Retry)
  const handleAskHint = () => {
    if (scaffolding.wasDemonstrated) {
      scaffolding.triggerIsomorphicRetry()
    } else {
      scaffolding.requestDemonstration()
      const hintText = `Pencil Pal placed Row 1 with ${challenge.targetCols} cookies! Now can you finish Rows 2 and ${challenge.targetRows}?`
      setSpeech(hintText)
      narration.speak(hintText, { pose: "sketch" })
    }
  }

  // Activate Column Eyes for Commutative Discovery
  const handleActivateColumnEyes = () => {
    setActiveLens("col")
    setDiscoveredCommutative(true)
    if (scaffolding.masteryEligible) {
      setStarCount((s) => s + 1)
      addStars(1)
      markStandardMastered("NC.2.OA.4")
    }
    confetti({ count: 90, spread: 85 })
    if (soundEnabled) playVictoryFanfare()
    const text = `Aha! Look at the columns going down: ${challenge.targetCols} columns of ${challenge.targetRows} cookies! ${challenge.targetRows} rows of ${challenge.targetCols} and ${challenge.targetCols} columns of ${challenge.targetRows} both equal ${challenge.totalCookies}!`
    setSpeech(text)
    narration.speak(text, { pose: "celebrate" })
  }

  const resetAll = () => {
    setGrid(
      Array(ROWS)
        .fill(null)
        .map(() => Array(COLS).fill(false)),
    )
    setSupplyCount(challenge.totalCookies)
    setIsCorrectArray(false)
    setDiscoveredCommutative(false)
    setActiveLens("none")
    scaffolding.resetScaffolding()
    const text = `Hi Kit! Can you bake ${challenge.totalCookies} cookies into ${challenge.targetRows} equal rows? Tap a cookie to start!`
    setSpeech(text)
    narration.speak(text, { pose: "idle" })
  }

  const readPromptAloud = () => {
    narration.speak(
      `Can you arrange ${challenge.totalCookies} cookies into ${challenge.targetRows} equal rows?`,
      { pose: "point" },
    )
  }

  // Visual Assist: Ghost cell indicator (Tier 2 outline)
  const isGhostCell = React.useCallback(
    (r: number, c: number) => {
      return scaffolding.isGhostVisible && scaffolding.isGhostCell(r, c) && !grid[r][c]
    },
    [scaffolding, grid],
  )

  const arrayPhase = isCorrectArray
    ? discoveredCommutative
      ? "commutative_discovered"
      : "array_verified"
    : "building"

  return (
    <Desk
      data-theme={theme}
      data-state-machine="nc2-oa4-array-wireframe"
      data-array-phase={arrayPhase}
      data-active-lens={activeLens}
      data-scaffolding-phase={scaffolding.status}
      data-scaffolding-tier={scaffolding.tier}
      data-total-cookies={challenge.totalCookies}
      data-supply-count={supplyCount}
      data-star-count={starCount}
      objects={["pencil", "ruler"]}
      lamp={true}
      className="h-screen max-h-screen w-screen overflow-hidden p-2 sm:p-3 flex flex-col font-hand text-ink select-none"
    >
      {/* 1. Slim Top Navigation Bar (~40px) */}
      <header className="desk-toolbar h-10 shrink-0 w-full flex items-center justify-between px-3 bg-paper/90 backdrop-blur-xs rounded-lg border border-stone-300 shadow-xs mb-2">
        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className="h-7 text-xs px-2 flex items-center gap-1.5 bg-amber-100/60 border-amber-300"
          >
            <span>🦊</span>
            <span className="font-bold">Kit</span>
            <span className="text-[10px] text-ink-soft hidden sm:inline">Grade 2</span>
          </Badge>

          {/* Standard Navigation Switcher */}
          <div className="flex items-center bg-stone-200/70 p-0.5 rounded-md border border-stone-300 text-xs">
            <button
              type="button"
              className="px-2 py-0.5 rounded bg-amber-500 text-stone-900 font-bold shadow-xs cursor-default"
            >
              🍪 NC.2.OA.4 Arrays
            </button>
            <button
              type="button"
              onClick={onSwitchToParity}
              className="px-2 py-0.5 rounded text-stone-700 hover:text-stone-900 cursor-pointer font-bold transition-colors"
            >
              🌰 NC.2.OA.3 Odd & Even
            </button>
            <button
              type="button"
              onClick={onSwitchToGeometry}
              className="px-2 py-0.5 rounded text-stone-700 hover:text-stone-900 cursor-pointer font-bold transition-colors"
            >
              📐 NC.2.G Geometry
            </button>
          </div>

          {/* Theme Switcher Pill */}
          <div className="hidden md:flex items-center gap-1 bg-stone-200/80 p-0.5 rounded-md border border-stone-300 text-xs">
            <span className="text-[10px] uppercase font-bold text-ink-soft px-1 hidden lg:inline">
              Desk:
            </span>
            <button
              type="button"
              title="Honey Birch Desk"
              onClick={() => onSetTheme?.("honey")}
              className={`px-1.5 py-0.5 rounded font-bold transition-all text-[11px] cursor-pointer ${
                theme === "honey"
                  ? "bg-amber-300 text-amber-950 shadow-2xs border border-amber-400"
                  : "text-stone-600 hover:text-stone-900"
              }`}
            >
              🍯 Honey
            </button>
            <button
              type="button"
              title="Sky Blue Desk"
              onClick={() => onSetTheme?.("sky")}
              className={`px-1.5 py-0.5 rounded font-bold transition-all text-[11px] cursor-pointer ${
                theme === "sky"
                  ? "bg-sky-200 text-sky-950 shadow-2xs border border-sky-400"
                  : "text-stone-600 hover:text-stone-900"
              }`}
            >
              ⛅ Sky
            </button>
            <button
              type="button"
              title="Warm Corkboard Desk"
              onClick={() => onSetTheme?.("cork")}
              className={`px-1.5 py-0.5 rounded font-bold transition-all text-[11px] cursor-pointer ${
                theme === "cork"
                  ? "bg-amber-200 text-amber-950 shadow-2xs border border-amber-400"
                  : "text-stone-600 hover:text-stone-900"
              }`}
            >
              📌 Cork
            </button>
            <button
              type="button"
              title="Soft Meadow Desk"
              onClick={() => onSetTheme?.("meadow")}
              className={`px-1.5 py-0.5 rounded font-bold transition-all text-[11px] cursor-pointer ${
                theme === "meadow"
                  ? "bg-emerald-200 text-emerald-950 shadow-2xs border border-emerald-400"
                  : "text-stone-600 hover:text-stone-900"
              }`}
            >
              🌿 Meadow
            </button>
            <button
              type="button"
              title="Creative Studio Desk"
              onClick={() => onSetTheme?.("studio")}
              className={`px-1.5 py-0.5 rounded font-bold transition-all text-[11px] cursor-pointer ${
                theme === "studio"
                  ? "bg-purple-200 text-purple-950 shadow-2xs border border-purple-400"
                  : "text-stone-600 hover:text-stone-900"
              }`}
            >
              🎨 Studio
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge
            variant="default"
            className="h-7 text-xs px-2 bg-amber-500 text-stone-900 border-amber-600 font-bold"
          >
            ⭐ {starCount}
          </Badge>

          <Button
            variant="outline"
            size="xs"
            onClick={toggleSound}
            className="h-7 text-xs px-2 flex items-center gap-1 cursor-pointer"
          >
            {soundEnabled ? "🔊 Sound ON" : "🔇 Sound OFF"}
          </Button>

          <Button
            variant="ghost"
            size="xs"
            onClick={resetAll}
            className="h-7 text-xs px-2 cursor-pointer"
          >
            🔄 Reset
          </Button>
        </div>
      </header>

      {/* 2. Main Viewport Grid (Zero-Scroll 100dvh) */}
      <main className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-[1fr_280px] lg:grid-cols-[1fr_300px] gap-2.5 items-stretch overflow-hidden">
        {/* Left Column: Clean Baking Sheet Workspace (Zero Perimeter Row/Col (0) Clutter) */}
        <div className="h-full min-h-0 flex flex-col relative overflow-hidden">
          <Paper
            stock="card"
            rules="none"
            shadow="card"
            className="h-full w-full p-3 sm:p-4 flex flex-col justify-between border-2 border-stone-300 relative overflow-hidden bg-amber-50/30"
          >
            {/* Washi Tape Fasteners */}
            <Tape
              kind="washi-dots"
              color="lemon"
              length={56}
              height={18}
              className="absolute -top-2 left-6"
            />
            <Tape
              kind="masking"
              color="tangerine"
              length={56}
              height={18}
              className="absolute -top-2 right-6"
            />

            {/* A. Compact Socratic Prompt Strip with Read-Aloud Voice */}
            <div className="w-full shrink-0 px-3 py-2 bg-amber-100/90 border border-amber-300 rounded-lg shadow-xs flex items-center justify-between gap-2 mb-1.5">
              <div className="text-sm sm:text-base font-script leading-tight text-amber-950 font-bold flex items-center gap-1.5 flex-wrap text-balance">
                <span>Can you arrange</span>
                <Highlight tone="yellow" weight="heavy">
                  {challenge.totalCookies} cookies
                </Highlight>
                <span>into</span>
                <Highlight tone="yellow" weight="heavy">
                  {challenge.targetRows} equal rows
                </Highlight>
                ?
              </div>
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={readPromptAloud}
                className="shrink-0 bg-amber-200/80 hover:bg-amber-300 rounded-full size-7 cursor-pointer"
                title="Hear prompt aloud"
              >
                🗣️
              </Button>
            </div>

            {/* B. Challenge Seed Switcher */}
            <div className="w-full shrink-0 flex items-center justify-between gap-1 py-1 px-2.5 bg-stone-100/80 rounded-md border border-stone-200 mb-1.5">
              <span className="text-[11px] uppercase tracking-wider font-bold text-ink-soft">
                Challenge Target:
              </span>
              <div className="flex items-center gap-1">
                {ARRAY_CHALLENGES.map((ch, idx) => (
                  <Button
                    key={ch.id}
                    variant={idx === challengeIdx ? "default" : "outline"}
                    size="xs"
                    onClick={() => switchChallenge(idx)}
                    className={`h-6 text-[11px] px-1.5 cursor-pointer ${
                      idx === challengeIdx
                        ? "bg-amber-400 text-stone-900 font-bold border-amber-500 shadow-2xs"
                        : ""
                    }`}
                  >
                    {ch.targetRows} × {ch.targetCols}
                  </Button>
                ))}
              </div>
            </div>

            {/* C. In-Place Commutative Discovery Strip (Visible on active sheet, NO full-screen modal) */}
            {discoveredCommutative ? (
              <div className="w-full shrink-0 px-3 py-1.5 bg-emerald-100 border-2 border-emerald-400 rounded-lg shadow-xs flex items-center justify-between gap-2 mb-1.5 animate-in fade-in duration-200">
                <div className="flex items-center gap-2">
                  <Seal variant="scallop" text="EXCELLENT!" mark="star" tone="red" size={32} />
                  <div className="text-xs text-emerald-950 font-bold">
                    <span>
                      🎉{" "}
                      <strong>
                        {challenge.targetRows} rows of {challenge.targetCols}
                      </strong>{" "}
                      ({challenge.targetRows} × {challenge.targetCols}) and{" "}
                      <strong>
                        {challenge.targetCols} columns of {challenge.targetRows}
                      </strong>{" "}
                      ({challenge.targetCols} × {challenge.targetRows}) both make{" "}
                      <strong>{challenge.totalCookies} cookies</strong>!
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <Button
                    size="xs"
                    variant="outline"
                    onClick={resetAll}
                    className="h-7 text-xs px-2.5 bg-white hover:bg-stone-100 cursor-pointer"
                  >
                    Try Again
                  </Button>
                  {scaffolding.wasDemonstrated ? (
                    <Button
                      size="xs"
                      onClick={() => scaffolding.triggerIsomorphicRetry()}
                      className="h-7 text-xs px-3 bg-amber-600 hover:bg-amber-700 text-white font-bold cursor-pointer"
                    >
                      🔄 Try Similar Challenge (Earn ⭐)
                    </Button>
                  ) : (
                    <Button
                      size="xs"
                      onClick={() => switchChallenge((challengeIdx + 1) % ARRAY_CHALLENGES.length)}
                      className="h-7 text-xs px-3 bg-emerald-700 hover:bg-emerald-800 text-white font-bold cursor-pointer"
                    >
                      Next Challenge ➔
                    </Button>
                  )}
                </div>
              </div>
            ) : isCorrectArray ? (
              <div className="w-full shrink-0 px-3 py-1.5 bg-sky-100 border-2 border-sky-300 rounded-lg shadow-xs flex items-center justify-between gap-2 mb-1.5 animate-pulse">
                <span className="text-xs font-bold text-sky-900">
                  🌟 You made {challenge.targetRows} rows of {challenge.targetCols}! Ready to
                  discover what happens when you look up and down?
                </span>
                <Button
                  size="xs"
                  onClick={handleActivateColumnEyes}
                  className="bg-sky-600 hover:bg-sky-700 text-white font-bold h-7 px-3 text-xs shadow-xs cursor-pointer"
                >
                  👓 Turn on Column Eyes!
                </Button>
              </div>
            ) : null}

            {/* D. Modular Clean 5x5 Cookie Baking Board (Zero perimeter row/col (0) clutter) */}
            <ArrayBoard
              grid={grid}
              onCellClick={handleCellClick}
              activeLens={activeLens}
              isGhostCell={isGhostCell}
              discoveredCommutative={discoveredCommutative}
              rowCounts={rowCounts}
              colCounts={colCounts}
              totalPlaced={totalPlaced}
              totalCookies={challenge.totalCookies}
            />

            {/* E. Bottom Action & Mathematical Equation Bar */}
            <div className="w-full shrink-0 py-2 px-3 rounded-lg bg-stone-100/90 border border-stone-300 flex items-center justify-between gap-3 mt-1">
              <div className="text-sm font-bold flex items-center gap-2 flex-wrap">
                {discoveredCommutative ? (
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1.5 text-xs text-amber-900 font-bold bg-amber-100 px-2 py-0.5 rounded border border-amber-300">
                      Rows: {Array(challenge.targetRows).fill(challenge.targetCols).join(" + ")} ={" "}
                      {challenge.totalCookies}
                    </span>
                    <span className="text-stone-400 font-bold">⇄</span>
                    <span className="flex items-center gap-1.5 text-xs text-sky-900 font-bold bg-sky-100 px-2 py-0.5 rounded border border-sky-300">
                      Cols: {Array(challenge.targetCols).fill(challenge.targetRows).join(" + ")} ={" "}
                      {challenge.totalCookies}
                    </span>
                  </div>
                ) : activeLens === "row" ? (
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] uppercase text-ink-soft hidden sm:inline">
                      Row Addition:
                    </span>
                    <Handwritten className="text-lg text-amber-900 font-bold">
                      {rowCounts.filter((c) => c > 0).join(" + ") || "0"} = {totalPlaced} cookies
                    </Handwritten>
                    {isCorrectArray && (
                      <Badge
                        variant="outline"
                        className="text-[10px] h-5 bg-emerald-100 text-emerald-800 border-emerald-300 font-bold"
                      >
                        {challenge.targetRows} rows of {challenge.targetCols} ✔
                      </Badge>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] uppercase text-ink-soft">Cookies Placed:</span>
                    <Handwritten className="text-lg font-bold text-amber-900">
                      {totalPlaced} / {challenge.totalCookies}
                    </Handwritten>
                    {scaffolding.tier > 0 && (
                      <span className="text-xs text-amber-800 font-bold hidden sm:inline">
                        ({scaffolding.tierBadge})
                      </span>
                    )}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                {scaffolding.wasDemonstrated && !discoveredCommutative && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => scaffolding.triggerIsomorphicRetry()}
                    className="font-bold text-xs h-8 px-3 bg-amber-50 hover:bg-amber-100 border-amber-300 text-amber-950 cursor-pointer"
                  >
                    🔄 Isomorphic Retry
                  </Button>
                )}
                <Button
                  size="sm"
                  onClick={checkAnswer}
                  className={`font-bold text-xs sm:text-sm px-5 h-8 shadow-xs cursor-pointer ${
                    isCorrectArray
                      ? "bg-stone-300 text-stone-700 hover:bg-stone-400"
                      : "bg-emerald-600 hover:bg-emerald-700 text-white"
                  }`}
                >
                  {isCorrectArray ? "Check Again ✔" : "Check My Rows ✔"}
                </Button>
              </div>
            </div>
          </Paper>
        </div>

        {/* Right Column: Modular Cookie Supply Tray & Mascot Companion with Real-Time Audio Narration */}
        <div className="h-full min-h-0 flex flex-col justify-between gap-2.5 overflow-hidden">
          <SupplyTray
            title="Cookie Tray"
            icon="🏺"
            stickerName="cookie-bitten"
            totalCount={challenge.totalCookies}
            supplyCount={supplyCount}
            onStampItem={handleStampFromJar}
            helperText={
              supplyCount > 0
                ? "👆 Tap a cookie to place it on the sheet!"
                : "All cookies placed! Tap 'Check My Rows' below."
            }
          />

          <MascotCompanion
            pose={
              narration.isSpeaking
                ? narration.mascotPose
                : scaffolding.mascotPose !== "idle"
                  ? scaffolding.mascotPose
                  : narration.mascotPose
            }
            speech={narration.currentText || speech}
            tierBadge={scaffolding.tierBadge}
            words={narration.words}
            currentWordIndex={narration.currentWordIndex}
            isSpeaking={narration.isSpeaking}
            hintButtonLabel={
              scaffolding.wasDemonstrated
                ? "🔄 Try Similar Challenge (Earn ⭐)"
                : scaffolding.tier === 2
                  ? "💡 Show Me Step 1 (Demonstrate)"
                  : "💡 Ask Pencil Pal for a Hint"
            }
            onAskHint={handleAskHint}
          />
        </div>
      </main>
    </Desk>
  )
}
