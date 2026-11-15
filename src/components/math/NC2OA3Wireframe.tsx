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
import { PairingMat } from "@/components/math/PairingMat"
import { SupplyTray } from "@/components/math/SupplyTray"
import { MascotCompanion } from "@/components/math/MascotCompanion"
import { useParityScaffolding } from "@/hooks/use-socratic-scaffolding"
import { useAudioNarration } from "@/hooks/use-audio-narration"
import type { PairingSlot } from "@/lib/math/evaluator"
import {
  playStampThud,
  playPickupChirp,
  playNudgeTone,
  playVictoryFanfare,
} from "@/lib/audio/sfx"
import {
  loadStudentProfile,
  addStars,
  markStandardMastered,
} from "@/lib/storage/profile"
import type { DeskTheme } from "@/App"

const MAX_PAIRS = 10 // Up to 20 counters max

export interface ProblemOption {
  label: string
  total: number
}

export const PRESET_PROBLEMS: ProblemOption[] = [
  { label: "7 Acorns", total: 7 },
  { label: "8 Acorns", total: 8 },
  { label: "9 Acorns", total: 9 },
  { label: "10 Acorns", total: 10 },
  { label: "11 Acorns", total: 11 },
  { label: "12 Acorns", total: 12 },
  { label: "15 Acorns", total: 15 },
  { label: "16 Acorns", total: 16 },
]

export function NC2OA3Wireframe({
  onSwitchToArrays,
  onSwitchToGeometry,
  theme = "honey",
  onSetTheme,
}: {
  onSwitchToArrays?: () => void
  onSwitchToGeometry?: () => void
  theme?: DeskTheme
  onSetTheme?: (t: DeskTheme) => void
}) {
  // Problem State
  const [totalTokens, setTotalTokens] = React.useState<number>(7)
  const [slots, setSlots] = React.useState<PairingSlot[]>(() =>
    Array(MAX_PAIRS)
      .fill(null)
      .map(() => ({ left: false, right: false }))
  )
  const [supplyCount, setSupplyCount] = React.useState<number>(7)

  // Socratic & Inquiry State
  const [speech, setSpeech] = React.useState<string>(
    "Hi Kit! Can all 7 acorns find a buddy? Pair them up side-by-side to find out!"
  )
  const [solvedParity, setSolvedParity] = React.useState<"even" | "odd" | null>(null)
  const [inquiryPrompt, setInquiryPrompt] = React.useState<boolean>(false)

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

  // Toggle sound enabled state
  const toggleSound = () => {
    const nextSound = !soundEnabled
    setSoundEnabled(nextSound)
    narration.setEnabled(nextSound)
  }

  // Socratic Progressive Hint Ladder (Tier 1 Prompt -> Tier 2 Ghost -> Tier 3 Demonstration)
  const scaffolding = useParityScaffolding({
    spec: {
      totalTokens,
      strategy: "pairing",
    },
    slots,
    onSlotsChange: (newSlots) => {
      setSlots(newSlots)
      const placed = newSlots.reduce(
        (acc, s) => acc + (s.left ? 1 : 0) + (s.right ? 1 : 0),
        0
      )
      setSupplyCount(Math.max(0, totalTokens - placed))
      if (soundEnabled) playStampThud()
    },
    onIsomorphicRetry: (newSpec) => {
      handleSelectProblem(newSpec.totalTokens)
    },
  })

  // Placed count
  const placedCount = React.useMemo(() => {
    let c = 0
    for (const s of slots) {
      if (s.left) c++
      if (s.right) c++
    }
    return c
  }, [slots])

  // Required pairs count for active seed: Math.ceil(totalTokens / 2)
  const numPairs = React.useMemo(() => Math.ceil(totalTokens / 2), [totalTokens])

  // Count complete pairs and leftover
  const pairedRowsCount = React.useMemo(() => {
    return slots.slice(0, numPairs).filter((s) => s.left && s.right).length
  }, [slots, numPairs])

  const leftoverCount = React.useMemo(() => {
    return slots.slice(0, numPairs).filter((s) => (s.left && !s.right) || (!s.left && s.right)).length
  }, [slots, numPairs])

  // Handle slot click (Dual-mode: tap-to-stamp & remove)
  const handleSlotClick = (rowIdx: number, side: "left" | "right") => {
    scaffolding.onTokenMutated()
    const isOccupied = slots[rowIdx][side]

    if (isOccupied) {
      if (soundEnabled) playPickupChirp()
      const newSlots = slots.map((s, idx) =>
        idx === rowIdx ? { ...s, [side]: false } : { ...s }
      )
      setSlots(newSlots)
      setSupplyCount((prev) => Math.min(totalTokens, prev + 1))
      setSolvedParity(null)
      setInquiryPrompt(false)
      const text = `Picked up acorn from Pair ${rowIdx + 1}. ${supplyCount + 1} acorns in basket.`
      setSpeech(text)
      narration.speak(text, { pose: "idle" })
    } else {
      if (supplyCount <= 0) {
        const text = `All ${totalTokens} acorns are placed! Tap any acorn to move it or tap Check Pairs below.`
        setSpeech(text)
        narration.speak(text, { pose: "oops" })
        return
      }
      if (soundEnabled) playStampThud()
      const newSlots = slots.map((s, idx) =>
        idx === rowIdx ? { ...s, [side]: true } : { ...s }
      )
      setSlots(newSlots)
      setSupplyCount((prev) => Math.max(0, prev - 1))
      setSolvedParity(null)
      setInquiryPrompt(false)
      const text = `Acorn placed on Pair ${rowIdx + 1}!`
      setSpeech(text)
      narration.speak(text, { pose: "wave" })
    }
  }

  // Auto-stamp next slot from basket
  const handleStampFromBasket = () => {
    if (supplyCount <= 0) {
      const text = `All ${totalTokens} acorns are placed! Tap any acorn on the mat to move it.`
      setSpeech(text)
      narration.speak(text, { pose: "oops" })
      return
    }

    for (let r = 0; r < numPairs; r++) {
      if (!slots[r].left) {
        handleSlotClick(r, "left")
        return
      }
      if (!slots[r].right) {
        handleSlotClick(r, "right")
        return
      }
    }
  }

  // Socratic Answer Checker (Escalates Progressive Hint Ladder)
  const checkAnswer = () => {
    const diag = scaffolding.checkAnswer(slots)

    if (diag.status === "correct_even") {
      if (soundEnabled) playVictoryFanfare()
      setSolvedParity("even")
      setInquiryPrompt(false)
      confetti({ count: 90, spread: 85 })
      if (scaffolding.masteryEligible) {
        setStarCount((s) => s + 1)
        addStars(1)
        markStandardMastered("NC.2.OA.3")
      }
      setSpeech(diag.feedback)
      narration.speak(diag.feedback, { pose: "celebrate" })
      return
    }

    if (diag.status === "correct_odd") {
      if (soundEnabled) playNudgeTone()
      setInquiryPrompt(true)
      setSolvedParity(null)
      const promptText = `Look closely at the bottom pair: one acorn has no buddy! Does ${totalTokens} have an extra leftover?`
      setSpeech(promptText)
      narration.speak(promptText, { pose: "peek" })
      return
    }

    // Diagnostic error feedback: play nudge tone and coordinate audio feedback with ladder tier
    if (soundEnabled) playNudgeTone()
    setSolvedParity(null)
    setInquiryPrompt(false)

    let speechToDeliver = diag.feedback
    let poseToAdopt = scaffolding.mascotPose

    if (scaffolding.failureCount === 1) {
      speechToDeliver = "Pencil Pal drew dotted ghost boxes for your pairs! Can you place your counters into the buddy boxes?"
      poseToAdopt = "sketch"
    } else if (scaffolding.failureCount >= 2) {
      speechToDeliver = "Pencil Pal paired up the first 2 counters! Can you pair up the rest?"
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
      const hintText = "Pencil Pal paired up the first 2 counters! Can you pair up the rest?"
      setSpeech(hintText)
      narration.speak(hintText, { pose: "sketch" })
    }
  }

  // Handle student answering the odd/even inquiry
  const handleStudentInquiryChoice = (choice: "even" | "odd") => {
    const isActuallyEven = totalTokens % 2 === 0
    if (choice === "odd" && !isActuallyEven) {
      if (soundEnabled) playVictoryFanfare()
      setSolvedParity("odd")
      setInquiryPrompt(false)
      confetti({ count: 90, spread: 85 })
      if (scaffolding.masteryEligible) {
        setStarCount((s) => s + 1)
        addStars(1)
        markStandardMastered("NC.2.OA.3")
      }
      const pairs = Math.floor(totalTokens / 2)
      const text = `YES! Because one acorn is left over without a buddy, ${totalTokens} is an ODD number! (${pairs} + ${pairs} + 1 = ${totalTokens})`
      setSpeech(text)
      narration.speak(text, { pose: "celebrate" })
    } else if (choice === "even" && isActuallyEven) {
      if (soundEnabled) playVictoryFanfare()
      setSolvedParity("even")
      setInquiryPrompt(false)
      confetti({ count: 90, spread: 85 })
      if (scaffolding.masteryEligible) {
        setStarCount((s) => s + 1)
        addStars(1)
        markStandardMastered("NC.2.OA.3")
      }
      const pairs = totalTokens / 2
      const text = `YES! Every acorn found a buddy, so ${totalTokens} is an EVEN number! (${pairs} + ${pairs} = ${totalTokens})`
      setSpeech(text)
      narration.speak(text, { pose: "celebrate" })
    } else {
      if (soundEnabled) playNudgeTone()
      const text =
        choice === "even"
          ? `Count the bottom acorn: it has no buddy to pair with! If there is an extra, is it even or odd?`
          : `Every acorn has a buddy with no one left over! If no one is left alone, is it even or odd?`
      setSpeech(text)
      narration.speak(text, { pose: "think" })
    }
  }

  // Reset current challenge
  const resetAll = () => {
    setSlots(
      Array(MAX_PAIRS)
        .fill(null)
        .map(() => ({ left: false, right: false }))
    )
    setSupplyCount(totalTokens)
    setSolvedParity(null)
    setInquiryPrompt(false)
    scaffolding.resetScaffolding()
    const text = `Hi Kit! Can all ${totalTokens} acorns find a buddy? Pair them up side-by-side!`
    setSpeech(text)
    narration.speak(text, { pose: "idle" })
  }

  // Switch problem target
  const handleSelectProblem = (total: number) => {
    setTotalTokens(total)
    setSlots(
      Array(MAX_PAIRS)
        .fill(null)
        .map(() => ({ left: false, right: false }))
    )
    setSupplyCount(total)
    setSolvedParity(null)
    setInquiryPrompt(false)
    scaffolding.resetScaffolding()
    const text = `New challenge! Can you pair up all ${total} acorns? Tap an acorn to start.`
    setSpeech(text)
    narration.speak(text, { pose: "wave" })
  }

  const readPromptAloud = () => {
    narration.speak(
      `Can you pair up ${totalTokens} acorns to see if ${totalTokens} is Even or Odd?`,
      { pose: "point" }
    )
  }

  // Visual Assist: Ghost cell indicator (Tier 2 outline for pairing mat)
  const isGhostCell = React.useCallback(
    (rowIdx: number, side: "left" | "right") => {
      if (!scaffolding.isGhostVisible) return false
      const col = side === "left" ? 0 : 1
      return scaffolding.isGhostCell(rowIdx, col)
    },
    [scaffolding]
  )

  return (
    <Desk
      data-theme={theme}
      objects={["pencil", "ruler"]}
      lamp={true}
      className="h-screen max-h-screen w-screen overflow-hidden p-2 sm:p-3 flex flex-col font-hand text-ink select-none"
    >
      {/* 1. Header Bar (~40px) */}
      <header className="h-10 shrink-0 w-full flex items-center justify-between px-3 bg-paper/90 backdrop-blur-xs rounded-lg border border-stone-300 shadow-xs mb-2">
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
              onClick={onSwitchToArrays}
              className="px-2 py-0.5 rounded text-stone-700 hover:text-stone-900 cursor-pointer font-bold transition-colors"
            >
              🍪 NC.2.OA.4 Arrays
            </button>
            <button
              type="button"
              className="px-2 py-0.5 rounded bg-amber-500 text-stone-900 font-bold shadow-xs cursor-default"
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
            <span className="text-[10px] uppercase font-bold text-ink-soft px-1 hidden lg:inline">Desk:</span>
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

          <Button variant="ghost" size="xs" onClick={resetAll} className="h-7 text-xs px-2 cursor-pointer">
            🔄 Reset
          </Button>
        </div>
      </header>

      {/* 2. Main Viewport Grid (Zero-Scroll 100dvh) */}
      <main className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-[1fr_280px] lg:grid-cols-[1fr_300px] gap-2.5 items-stretch overflow-hidden">
        {/* Left Column: Single Centered Buddy Pairing Mat */}
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

            {/* A. Sleek Socratic Prompt Strip (Zero vertical bloat) */}
            <div className="w-full shrink-0 px-3 py-2 bg-amber-100/90 border border-amber-300 rounded-lg shadow-xs flex items-center justify-between gap-2 mb-1.5">
              <div className="text-sm sm:text-base font-script leading-tight text-amber-950 font-bold flex items-center gap-1.5 flex-wrap">
                <span>Can you pair up</span>
                <Highlight tone="yellow" weight="heavy">{totalTokens} acorns</Highlight>
                <span>to see if {totalTokens} is</span>
                <Highlight tone="blue" weight="heavy">Even or Odd</Highlight>?
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

            {/* B. Challenge Seed Switcher Bar */}
            <div className="w-full shrink-0 flex items-center justify-between gap-1 py-1 px-2.5 bg-stone-100/80 rounded-md border border-stone-200 mb-1.5">
              <span className="text-[11px] uppercase tracking-wider font-bold text-ink-soft">
                Challenge Seed:
              </span>
              <div className="flex items-center gap-1">
                {PRESET_PROBLEMS.map((prob) => (
                  <Button
                    key={prob.total}
                    variant={prob.total === totalTokens ? "default" : "outline"}
                    size="xs"
                    onClick={() => handleSelectProblem(prob.total)}
                    className={`h-6 text-[11px] px-2 cursor-pointer ${
                      prob.total === totalTokens
                        ? "bg-amber-400 text-stone-900 font-bold border-amber-500 shadow-2xs"
                        : ""
                    }`}
                  >
                    {prob.total}
                  </Button>
                ))}
              </div>
            </div>

            {/* In-Place Socratic Inquiry Prompt or Victory Banner (Visible on the active mat, NO modal) */}
            {inquiryPrompt ? (
              <div className="w-full shrink-0 px-3 py-2 bg-purple-100 border-2 border-purple-400 rounded-lg shadow-xs flex items-center justify-between gap-2 mb-1.5 animate-pulse">
                <div className="flex items-center gap-1.5 text-xs text-purple-950 font-bold">
                  <span>🌰 <strong>{pairedRowsCount} pairs matched</strong>, but 1 acorn has no partner! Is {totalTokens} Even or Odd?</span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="xs"
                    variant="outline"
                    onClick={() => handleStudentInquiryChoice("even")}
                    className="h-7 text-xs px-3 font-bold border-emerald-400 text-emerald-900 bg-white hover:bg-emerald-50 cursor-pointer"
                  >
                    It is EVEN
                  </Button>
                  <Button
                    size="xs"
                    onClick={() => handleStudentInquiryChoice("odd")}
                    className="h-7 text-xs px-3.5 font-bold bg-purple-700 hover:bg-purple-800 text-white shadow-2xs cursor-pointer"
                  >
                    It is ODD! 🌟
                  </Button>
                </div>
              </div>
            ) : solvedParity ? (
              <div className="w-full shrink-0 px-3 py-1.5 bg-emerald-100 border-2 border-emerald-400 rounded-lg shadow-xs flex items-center justify-between gap-2 mb-1.5 animate-in fade-in duration-200">
                <div className="flex items-center gap-2">
                  <Seal
                    variant="scallop"
                    text={solvedParity === "even" ? "EVEN!" : "ODD!"}
                    mark="star"
                    tone={solvedParity === "even" ? "tomato" : "sky"}
                    size={32}
                  />
                  <div className="text-xs text-emerald-950 font-bold">
                    {solvedParity === "even" ? (
                      <span>🎉 All {totalTokens} acorns have a buddy! <strong>{totalTokens} is EVEN</strong> ({totalTokens / 2} + {totalTokens / 2} = {totalTokens})!</span>
                    ) : (
                      <span>🎉 One acorn is left over! <strong>{totalTokens} is ODD</strong> ({Math.floor(totalTokens / 2)} + {Math.floor(totalTokens / 2)} + 1 = {totalTokens})!</span>
                    )}
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
                      onClick={() => {
                        const nextIdx =
                          (PRESET_PROBLEMS.findIndex((p) => p.total === totalTokens) + 1) %
                          PRESET_PROBLEMS.length
                        handleSelectProblem(PRESET_PROBLEMS[nextIdx].total)
                      }}
                      className="h-7 text-xs px-3 bg-emerald-700 hover:bg-emerald-800 text-white font-bold cursor-pointer"
                    >
                      Next Challenge ➔
                    </Button>
                  )}
                </div>
              </div>
            ) : null}

            {/* C. Modular Dynamic Buddy Pairing Mat (Tier 2 Ghost Outline Support) */}
            <PairingMat
              slots={slots}
              numPairs={numPairs}
              totalTokens={totalTokens}
              placedCount={placedCount}
              onSlotClick={handleSlotClick}
              isGhostCell={isGhostCell}
            />

            {/* D. Status Equation & Action Footer */}
            <div className="w-full shrink-0 py-2 px-3 rounded-lg bg-stone-100/90 border border-stone-300 flex items-center justify-between gap-3 mt-1">
              <div className="text-sm font-bold flex items-center gap-2">
                {solvedParity ? (
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] uppercase text-ink-soft hidden sm:inline">Equation:</span>
                    <Handwritten className="text-lg text-amber-900 font-bold">
                      {solvedParity === "even"
                        ? `${totalTokens / 2} + ${totalTokens / 2} = ${totalTokens} (EVEN)`
                        : `${Math.floor(totalTokens / 2)} + ${Math.floor(totalTokens / 2)} + 1 = ${totalTokens} (ODD)`}
                    </Handwritten>
                    <Badge
                      variant="outline"
                      className={`text-[10px] h-5 font-bold ${
                        solvedParity === "even"
                          ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                          : "bg-purple-100 text-purple-800 border-purple-300"
                      }`}
                    >
                      {solvedParity.toUpperCase()} ✔
                    </Badge>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] uppercase text-ink-soft">Counters:</span>
                    <Handwritten className="text-lg font-bold text-amber-900">
                      {placedCount} / {totalTokens}
                    </Handwritten>
                    {pairedRowsCount > 0 && (
                      <span className="text-xs text-stone-600 font-mono hidden sm:inline">
                        ({pairedRowsCount} {pairedRowsCount === 1 ? "pair" : "pairs"}{leftoverCount > 0 ? `, ${leftoverCount} leftover` : ""})
                      </span>
                    )}
                    {scaffolding.tier > 0 && (
                      <span className="text-xs text-amber-800 font-bold hidden sm:inline">
                        ({scaffolding.tierBadge})
                      </span>
                    )}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                {scaffolding.wasDemonstrated && !solvedParity && (
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
                  className={`font-bold text-xs sm:text-sm px-4 h-8 shadow-xs cursor-pointer ${
                    solvedParity
                      ? "bg-stone-300 text-stone-700 hover:bg-stone-400"
                      : "bg-emerald-600 hover:bg-emerald-700 text-white"
                  }`}
                >
                  {solvedParity ? "Check Again ✔" : "Check Pairs ✔"}
                </Button>
              </div>
            </div>
          </Paper>
        </div>

        {/* Right Column: Modular Acorn Supply Basket & Mascot Companion with Real-Time Audio Narration */}
        <div className="h-full min-h-0 flex flex-col justify-between gap-2.5 overflow-hidden">
          <SupplyTray
            title="Acorn Basket"
            icon="🧺"
            stickerName="acorn-pair"
            totalCount={totalTokens}
            supplyCount={supplyCount}
            onStampItem={handleStampFromBasket}
            helperText={
              supplyCount > 0
                ? "👆 Tap an acorn to place it on the mat!"
                : "All acorns are placed! Tap 'Check Pairs' below."
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
                ? "💡 Show Me Pair 1 (Demonstrate)"
                : "💡 Ask Pencil Pal for a Hint"
            }
            onAskHint={handleAskHint}
          />
        </div>
      </main>
    </Desk>
  )
}
