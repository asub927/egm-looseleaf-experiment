"use client"

import * as React from "react"
import { Desk } from "@/components/ui/desk"
import { Paper } from "@/components/ui/paper"
import { Tape } from "@/components/ui/tape"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Seal } from "@/components/ui/seal"
import { Handwritten } from "@/components/ui/handwritten"
import { confetti } from "@/components/ui/confetti"
import { BakingPan } from "@/components/math/BakingPan"
import { TartPlate } from "@/components/math/TartPlate"
import { WhisperingVine } from "@/components/math/WhisperingVine"
import { PartitionToolBar } from "@/components/math/PartitionToolBar"
import { MascotCompanion } from "@/components/math/MascotCompanion"
import { useGeometryScaffolding } from "@/hooks/use-geometry-scaffolding"
import { useAudioNarration } from "@/hooks/use-audio-narration"
import { NC2_G_SEEDS } from "@/curriculum/items/nc2-g"
import type { NC2GItem } from "@/curriculum/invariants"
import { playSliceThud, playNudgeTone, playVictoryFanfare } from "@/lib/audio/sfx"
import {
  loadStudentProfile,
  addStars,
  markStandardMastered,
  type StudentTheme,
} from "@/lib/storage/profile"
import { cn } from "@/lib/utils"

export type DeskTheme = StudentTheme
export type ManipulativeType = "artisan-pan" | "tart-plate" | "whispering-vine"

export interface NC2GWireframeProps {
  theme?: DeskTheme
  onSetTheme?: (t: DeskTheme) => void
  onSwitchToArrays?: () => void
  onSwitchToParity?: () => void
}

export function NC2GWireframe({
  theme = "honey",
  onSetTheme,
  onSwitchToArrays,
  onSwitchToParity,
}: NC2GWireframeProps) {
  // Challenge Seed State
  const [seedIdx, setSeedIdx] = React.useState<number>(0)
  const currentSeed: NC2GItem = NC2_G_SEEDS[seedIdx] ?? NC2_G_SEEDS[0]

  // Top Tool Selector State: Artisan Pan, Tart Plate, Whispering Vine
  const [activeManipulative, setActiveManipulative] =
    React.useState<ManipulativeType>("artisan-pan")

  // Partition divider cuts or radial angles
  const [cuts, setCuts] = React.useState<number[]>([])
  const [activeShares, setActiveShares] = React.useState<2 | 3 | 4>(currentSeed.targetShares)
  const [isSolved, setIsSolved] = React.useState<boolean>(false)

  // Speech and Mascot state
  const [speech, setSpeech] = React.useState<string>(currentSeed.narrative)

  // Audio & Profile persistence
  const [soundEnabled, setSoundEnabled] = React.useState<boolean>(true)
  const [starCount, setStarCount] = React.useState<number>(() => {
    return loadStudentProfile().stars
  })

  // Shared SVG Ref for coordinate tracking and declarative snapping
  const svgRef = React.useRef<SVGSVGElement | null>(null)

  // Headless Audio Narration Bus
  const narration = useAudioNarration({
    enabled: soundEnabled,
    defaultIdlePose: "idle",
    resetPoseOnEnd: false,
  })

  // Socratic Progressive Hint Ladder (Tier 1 Prompt -> Tier 2 Ghost -> Tier 3 Demonstration)
  const scaffolding = useGeometryScaffolding({
    spec: currentSeed,
    cuts,
    onCutsChange: (newCuts) => {
      setCuts(newCuts)
    },
    onIsomorphicRetry: (newSpec) => {
      const matchIdx = NC2_G_SEEDS.findIndex((s) => s.id === newSpec.id)
      if (matchIdx !== -1) {
        setSeedIdx(matchIdx)
      }
      setCuts([])
      setActiveShares(newSpec.targetShares)
      setIsSolved(false)
      const intro = `New isomorphic challenge! ${newSpec.narrative}`
      setSpeech(intro)
      narration.speak(intro, { pose: "wave" })
    },
  })

  // Sound toggle handler
  const toggleSound = () => {
    const nextSound = !soundEnabled
    setSoundEnabled(nextSound)
    narration.setEnabled(nextSound)
  }

  // Switch challenge seed
  const switchSeed = (idx: number) => {
    const nextSeed = NC2_G_SEEDS[idx]
    if (!nextSeed) return
    setSeedIdx(idx)
    setActiveManipulative(nextSeed.shapeType === "rectangle" ? "artisan-pan" : "tart-plate")
    setCuts([])
    setActiveShares(nextSeed.targetShares)
    setIsSolved(false)
    scaffolding.resetScaffolding()
    setSpeech(nextSeed.narrative)
    narration.speak(nextSeed.narrative, { pose: "wave" })
  }

  // Reset current challenge
  const resetAll = () => {
    setCuts([])
    setActiveShares(currentSeed.targetShares)
    setIsSolved(false)
    scaffolding.resetScaffolding()
    setSpeech(currentSeed.narrative)
    narration.speak(currentSeed.narrative, { pose: "idle" })
  }

  // Read narrative prompt aloud
  const readPromptAloud = () => {
    narration.speak(currentSeed.narrative, { pose: "wave" })
  }

  // Single-Tap Cutter Tool Selection ([2 Halves], [3 Thirds], [4 Fourths])
  const handleSelectShares = (shares: 2 | 3 | 4) => {
    setActiveShares(shares)
    if (soundEnabled) playSliceThud()
    if (isSolved) setIsSolved(false)

    // Snap to canonical equal cuts for the selected share count
    if (currentSeed.shapeType === "rectangle") {
      if (shares === 2) setCuts([0.5])
      else if (shares === 3) setCuts([1 / 3, 2 / 3])
      else if (shares === 4) setCuts([0.25, 0.5, 0.75])
    } else {
      if (shares === 2) setCuts([0, 180])
      else if (shares === 3) setCuts([0, 120, 240])
      else if (shares === 4) setCuts([0, 90, 180, 270])
    }
  }

  // Answer validation
  const handleCheckAnswer = () => {
    const diagnostic = scaffolding.checkAnswer(cuts)

    if (diagnostic.status === "correct") {
      if (soundEnabled) playVictoryFanfare()
      setIsSolved(true)
      confetti({ count: 90, spread: 85 })

      if (scaffolding.masteryEligible) {
        setStarCount((s) => s + 1)
        addStars(1)
        markStandardMastered("NC.2.G.3")
      }

      setSpeech(diagnostic.feedback)
      narration.speak(diagnostic.feedback, { pose: "celebrate" })
      return
    }

    // Failure detected: play nudge tone and escalate scaffolding hint ladder
    if (soundEnabled) playNudgeTone()
    setIsSolved(false)

    let speechToDeliver = diagnostic.feedback
    let poseToAdopt = scaffolding.mascotPose

    if (scaffolding.failureCount === 1) {
      speechToDeliver = `Pencil Pal drew dotted guide lines for ${currentSeed.targetShares} equal ${currentSeed.verbalShareName}! Can you snap the cutter to the dotted lines?`
      poseToAdopt = "sketch"
    } else if (scaffolding.failureCount >= 2) {
      speechToDeliver = `Pencil Pal demonstrated the cut for ${currentSeed.targetShares} equal ${currentSeed.verbalShareName}! Try a similar challenge to earn your star.`
      poseToAdopt = "sketch"
    }

    setSpeech(speechToDeliver)
    narration.speak(speechToDeliver, { pose: poseToAdopt })
  }

  // Socratic Hint Ladder interaction
  const handleAskHint = () => {
    if (scaffolding.wasDemonstrated) {
      scaffolding.triggerIsomorphicRetry()
    } else if (scaffolding.tier === 2) {
      scaffolding.requestDemonstration()
      const hintText = `Pencil Pal demonstrated the cut for ${currentSeed.targetShares} equal ${currentSeed.verbalShareName}! Try a similar challenge to earn your star.`
      setSpeech(hintText)
      narration.speak(hintText, { pose: "sketch" })
    } else {
      // Tier 0 or Tier 1: Check partition to trigger ladder escalation
      const diagnostic = scaffolding.checkAnswer(cuts)
      if (diagnostic.status === "correct") {
        handleCheckAnswer()
        return
      }
      if (soundEnabled) playNudgeTone()
      let hintText = diagnostic.feedback
      let poseToAdopt = scaffolding.mascotPose
      if (scaffolding.failureCount === 1) {
        hintText = `Pencil Pal drew dotted guide lines for ${currentSeed.targetShares} equal ${currentSeed.verbalShareName}! Can you snap the cutter to the dotted lines?`
        poseToAdopt = "sketch"
      }
      setSpeech(hintText)
      narration.speak(hintText, { pose: poseToAdopt })
    }
  }

  // Derive human-readable whole name for mathematical equation banner
  const contextWholeName = React.useMemo(() => {
    const ctx = currentSeed.context.toLowerCase()
    if (ctx.includes("tart")) return "tart"
    if (ctx.includes("brownies")) return "pan of brownies"
    if (ctx.includes("cake")) return "sheet cake"
    if (ctx.includes("cornbread")) return "pan of cornbread"
    if (ctx.includes("pizza")) return "pizza"
    if (ctx.includes("pie")) return "pie"
    if (ctx.includes("cookie")) return "cookie"
    return currentSeed.context
  }, [currentSeed.context])

  return (
    <Desk
      data-theme={theme}
      data-state-machine="nc2-g-geometry-wireframe"
      data-active-manipulative={activeManipulative}
      data-active-shares={activeShares}
      data-target-shares={currentSeed.targetShares}
      data-is-solved={isSolved ? "true" : "false"}
      data-scaffolding-phase={scaffolding.status}
      data-scaffolding-tier={scaffolding.tier}
      data-star-count={starCount}
      objects={["pencil", "ruler"]}
      lamp={true}
      className="h-screen max-h-screen w-screen overflow-hidden p-2 sm:p-3 flex flex-col font-hand text-ink select-none"
    >
      {/* 1. Slim Top Navigation Bar (~40px) */}
      <header className="desk-toolbar h-10 shrink-0 w-full flex items-center justify-between px-3 bg-paper/90 backdrop-blur-xs rounded-lg border border-stone-300 shadow-xs mb-2">
        <div className="flex items-center gap-2">
          {/* Kit Profile Badge */}
          <Badge
            variant="outline"
            className="h-7 text-xs px-2 flex items-center gap-1.5 bg-amber-100/60 border-amber-300"
          >
            <span>🦊</span>
            <span className="font-bold">Kit</span>
            <span className="text-[10px] text-ink-soft hidden sm:inline">Grade 2</span>
          </Badge>

          {/* 3-Way Standard Navigation Switcher */}
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
              onClick={onSwitchToParity}
              className="px-2 py-0.5 rounded text-stone-700 hover:text-stone-900 cursor-pointer font-bold transition-colors"
            >
              🌰 NC.2.OA.3 Odd & Even
            </button>
            <button
              type="button"
              className="px-2 py-0.5 rounded bg-amber-500 text-stone-900 font-bold shadow-xs cursor-default"
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

        {/* Right Header Badges & Actions */}
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

      {/* Top Tool Selector: 1. Artisan Pan, 2. Tart Plate, 3. Whispering Vine */}
      <div className="shrink-0 mb-1.5 flex items-center justify-between px-3 py-1 bg-paper/95 backdrop-blur-xs rounded-lg border border-stone-300 shadow-xs">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <span className="text-[11px] font-bold text-ink-soft uppercase tracking-wide hidden sm:inline">
            Tool:
          </span>
          <div className="flex items-center gap-1 bg-stone-200/80 p-0.5 rounded-lg border border-stone-300 text-xs">
            <button
              type="button"
              onClick={() => {
                setActiveManipulative("artisan-pan")
                if (currentSeed.shapeType !== "rectangle") {
                  const firstRectIdx = NC2_G_SEEDS.findIndex((s) => s.shapeType === "rectangle")
                  if (firstRectIdx !== -1) switchSeed(firstRectIdx)
                }
              }}
              className={cn(
                "px-2.5 py-1 rounded-md font-bold transition-all cursor-pointer flex items-center gap-1 text-xs",
                activeManipulative === "artisan-pan"
                  ? "bg-amber-400 text-stone-900 shadow-2xs border border-amber-500"
                  : "text-stone-700 hover:text-stone-900 hover:bg-stone-100",
              )}
            >
              <span>🥖</span>
              <span>Artisan Pan</span>
              <span className="text-[10px] text-stone-600 font-normal hidden lg:inline">
                (Rectangular 1/2, 1/3, 1/4)
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveManipulative("tart-plate")
                if (currentSeed.shapeType !== "circle") {
                  const firstCircIdx = NC2_G_SEEDS.findIndex((s) => s.shapeType === "circle")
                  if (firstCircIdx !== -1) switchSeed(firstCircIdx)
                }
              }}
              className={cn(
                "px-2.5 py-1 rounded-md font-bold transition-all cursor-pointer flex items-center gap-1 text-xs",
                activeManipulative === "tart-plate"
                  ? "bg-amber-400 text-stone-900 shadow-2xs border border-amber-500"
                  : "text-stone-700 hover:text-stone-900 hover:bg-stone-100",
              )}
            >
              <span>🥧</span>
              <span>Tart Plate</span>
              <span className="text-[10px] text-stone-600 font-normal hidden lg:inline">
                (Circular 1/2, 1/3, 1/4)
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveManipulative("whispering-vine")}
              className={cn(
                "px-2.5 py-1 rounded-md font-bold transition-all cursor-pointer flex items-center gap-1 text-xs",
                activeManipulative === "whispering-vine"
                  ? "bg-emerald-400 text-stone-900 shadow-2xs border border-emerald-500"
                  : "text-stone-700 hover:text-stone-900 hover:bg-stone-100",
              )}
            >
              <span>🌿</span>
              <span>Whispering Vine</span>
              <span className="text-[10px] text-stone-600 font-normal hidden lg:inline">
                (10 − ? Tactile Subtraction)
              </span>
            </button>
          </div>
        </div>

        <Badge
          variant="outline"
          className="text-[10px] h-5 bg-amber-50 border-amber-300 font-bold hidden sm:flex"
        >
          {activeManipulative === "whispering-vine" ? "NC.2.OA.2 Subtraction" : "NC.2.G.3 Geometry"}
        </Badge>
      </div>

      {/* 2. Main Viewport Area (Zero-Scroll 100dvh) */}
      {activeManipulative === "whispering-vine" ? (
        <main className="flex-1 min-h-0 w-full overflow-hidden flex flex-col">
          <WhisperingVine
            onSolved={() => {
              setStarCount((s) => s + 1)
              addStars(1)
              markStandardMastered("NC.2.OA.2")
            }}
          />
        </main>
      ) : (
        <main className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-[1fr_280px] lg:grid-cols-[1fr_320px] gap-2.5 items-stretch overflow-hidden">
          {/* Left Column (~70%): Manipulative Workspace */}
          <div className="h-full min-h-0 flex flex-col relative overflow-hidden">
            <Paper
              stock="card"
              rules="graph"
              shadow="card"
              className="h-full w-full p-2.5 sm:p-3 flex flex-col justify-between border-2 border-stone-300 relative overflow-hidden bg-amber-50/20"
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

              {/* A. Socratic Challenge Banner with Read-Aloud Voice Button */}
              <div className="w-full shrink-0 px-3 py-1.5 bg-amber-100/90 border border-amber-300 rounded-lg shadow-xs flex items-center justify-between gap-2 mb-1.5">
                <div className="text-sm sm:text-base font-script leading-tight text-amber-950 font-bold flex items-center gap-1.5 flex-wrap text-balance">
                  <span>{currentSeed.icon}</span>
                  <span>{currentSeed.narrative}</span>
                </div>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  onClick={readPromptAloud}
                  className="shrink-0 bg-amber-200/80 hover:bg-amber-300 rounded-full size-7 cursor-pointer"
                  title="Hear prompt aloud"
                  aria-label="Hear prompt aloud"
                >
                  🗣️
                </Button>
              </div>

              {/* In-Place Celebratory Success Banner (No full-screen modal) */}
              {isSolved && (
                <div className="w-full shrink-0 px-3 py-1.5 bg-emerald-100 border-2 border-emerald-400 rounded-lg shadow-xs flex items-center justify-between gap-2 mb-1.5 animate-in fade-in duration-200">
                  <div className="flex items-center gap-2">
                    <Seal variant="scallop" text="PERFECT!" mark="star" tone="red" size={32} />
                    <div className="text-xs text-emerald-950 font-bold">
                      <span>
                        🎉 Great job! You partitioned the {currentSeed.context} into{" "}
                        {currentSeed.targetShares} equal {currentSeed.verbalShareName}!
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Button
                      size="xs"
                      variant="outline"
                      onClick={resetAll}
                      className="h-7 text-xs px-2.5 bg-white hover:bg-stone-100 cursor-pointer font-bold"
                    >
                      Try Again
                    </Button>
                    {scaffolding.wasDemonstrated && (
                      <Button
                        size="xs"
                        onClick={() => scaffolding.triggerIsomorphicRetry()}
                        className="h-7 text-xs px-3 bg-amber-600 hover:bg-amber-700 text-white font-bold cursor-pointer"
                      >
                        🔄 Similar Challenge (Earn ⭐)
                      </Button>
                    )}
                  </div>
                </div>
              )}

              {/* B. Tactile Geometry Manipulative Canvas */}
              <div className="@container flex-1 min-h-0 w-full flex items-center justify-center relative overflow-hidden py-1">
                {currentSeed.shapeType === "rectangle" ? (
                  <BakingPan
                    cuts={cuts}
                    targetShares={activeShares}
                    isGhostVisible={scaffolding.isGhostVisible}
                    onCutsChange={(newCuts) => {
                      setCuts(newCuts)
                      if (isSolved) setIsSolved(false)
                    }}
                    svgRef={svgRef}
                    context={currentSeed.context}
                    icon={currentSeed.icon}
                    className="w-full h-full max-h-[380px] object-contain drop-shadow-sm"
                  />
                ) : (
                  <TartPlate
                    radialAngles={cuts}
                    targetShares={activeShares}
                    isGhostVisible={scaffolding.isGhostVisible}
                    onAnglesChange={(newAngles) => {
                      setCuts(newAngles)
                      if (isSolved) setIsSolved(false)
                    }}
                    svgRef={svgRef}
                    context={currentSeed.context}
                    icon={currentSeed.icon}
                    className="w-full h-full max-h-[380px] object-contain drop-shadow-sm"
                  />
                )}
              </div>

              {/* C. Partition Toolbar with Single-Tap Cutters & Answer Check */}
              <div className="w-full shrink-0 mt-1">
                <PartitionToolBar
                  activeShares={activeShares}
                  targetShares={currentSeed.targetShares}
                  onSelectShares={handleSelectShares}
                  onCheckAnswer={handleCheckAnswer}
                  isSolved={isSolved}
                />
              </div>

              {/* D. Bottom Mathematical Equation Banner */}
              <div className="w-full shrink-0 py-2 px-3 rounded-lg bg-stone-100/90 border border-stone-300 flex items-center justify-between gap-3 mt-1.5">
                <div className="text-sm font-bold flex items-center gap-2 flex-wrap">
                  <span className="text-[11px] uppercase text-ink-soft hidden sm:inline">
                    Fraction Concept:
                  </span>
                  <Handwritten className="text-lg text-amber-900 font-bold">
                    {currentSeed.targetShares} {currentSeed.verbalShareName} = 1 whole{" "}
                    {contextWholeName}
                  </Handwritten>
                  {isSolved && (
                    <Badge
                      variant="outline"
                      className="text-[10px] h-5 bg-emerald-100 text-emerald-800 border-emerald-300 font-bold"
                    >
                      {currentSeed.targetShares} equal {currentSeed.verbalShareName} ✔
                    </Badge>
                  )}
                  {scaffolding.tier > 0 && !isSolved && (
                    <span className="text-xs text-amber-800 font-bold hidden sm:inline">
                      ({scaffolding.tierBadge})
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {scaffolding.wasDemonstrated && !isSolved && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => scaffolding.triggerIsomorphicRetry()}
                      className="font-bold text-xs h-8 px-3 bg-amber-50 hover:bg-amber-100 border-amber-300 text-amber-950 cursor-pointer"
                    >
                      🔄 Isomorphic Retry
                    </Button>
                  )}
                </div>
              </div>
            </Paper>
          </div>

          {/* Right Column (~30%): Challenge Seed Selector Tray & Mascot Companion */}
          <div className="h-full min-h-0 flex flex-col justify-between gap-2.5 overflow-hidden">
            {/* Challenge Seed Selector Tray */}
            <Card className="shrink-0 bg-paper/90 border-2 border-stone-300 shadow-xs p-2 sm:p-2.5 flex flex-col gap-1.5 select-none">
              <div className="flex items-center justify-between pb-1 border-b border-stone-200">
                <span className="text-xs font-bold flex items-center gap-1.5 text-stone-800">
                  <span>🍱</span>
                  <span>Bakery Challenges</span>
                </span>
                <Badge
                  variant="outline"
                  className="text-[10px] h-4.5 px-1.5 bg-amber-100/60 border-amber-300 font-bold"
                >
                  NC.2.G.3
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-1 sm:gap-1.5">
                {NC2_G_SEEDS.map((seed, idx) => {
                  const isCurrent = idx === seedIdx
                  return (
                    <Button
                      key={seed.id}
                      type="button"
                      variant={isCurrent ? "default" : "outline"}
                      size="xs"
                      onClick={() => switchSeed(idx)}
                      className={cn(
                        "h-7 sm:h-8 px-1.5 sm:px-2 justify-start text-left font-bold truncate flex items-center gap-1.5 cursor-pointer border text-[11px]",
                        isCurrent
                          ? "bg-amber-400 hover:bg-amber-500 text-stone-900 border-amber-600 shadow-2xs ring-1 ring-amber-500/50"
                          : "bg-white/80 hover:bg-amber-50 text-stone-700 border-stone-300 hover:border-amber-400",
                      )}
                      title={seed.label}
                    >
                      <span className="text-sm shrink-0">{seed.icon}</span>
                      <span className="truncate">{seed.label}</span>
                    </Button>
                  )
                })}
              </div>
            </Card>

            {/* Mascot Companion (Pencil Pal) with Real-Time Synchronized Subtitles */}
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
                    ? "💡 Show Me (Demonstrate)"
                    : "💡 Ask Pencil Pal for a Hint"
              }
              onAskHint={handleAskHint}
            />
          </div>
        </main>
      )}
    </Desk>
  )
}
