"use client"

import * as React from "react"
import {
  type VineProblemSeed,
  type VineSubmission,
  type VineSubmissionVia,
  type VineEvaluationResult,
  CANONICAL_VINE_SEEDS,
  getVineSeedById,
  evaluateVineSubmission,
} from "@/lib/math/vine-evaluator"
import {
  playPluck,
  playCelebrationChimes,
} from "@/lib/audio/garden-chimes"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Paper } from "@/components/ui/paper"
import { Tape } from "@/components/ui/tape"
import { Handwritten } from "@/components/ui/handwritten"
import { Seal } from "@/components/ui/seal"
import { confetti } from "@/components/ui/confetti"
import { cn } from "@/lib/utils"

export interface WhisperingVineProps {
  /** Optional seed ID to initialize with (e.g. 'vine-10-6') */
  initialSeedId?: string
  /** Callback fired when the student reaches a correct solution */
  onSolved?: (submission: VineSubmission) => void
  /** Optional additional class names */
  className?: string
}

// 10 Growth Node Coordinates along the bamboo vine (Node 1 at bottom, Node 10 at top)
// Canvas dimensions: 440 wide x 640 high
const NODE_COORDINATES = [
  { node: 1, x: 220, y: 512 },
  { node: 2, x: 238, y: 462 },
  { node: 3, x: 244, y: 412 },
  { node: 4, x: 232, y: 362 },
  { node: 5, x: 210, y: 312 },
  { node: 6, x: 196, y: 262 },
  { node: 7, x: 202, y: 212 },
  { node: 8, x: 222, y: 162 },
  { node: 9, x: 240, y: 112 },
  { node: 10, x: 236, y: 64 },
] as const

export function WhisperingVine({
  initialSeedId,
  onSolved,
  className,
}: WhisperingVineProps) {
  // 1. Problem Seed State (default to CANONICAL_VINE_SEEDS[0]: 10 - 6)
  const [currentSeed, setCurrentSeed] = React.useState<VineProblemSeed>(() => {
    if (initialSeedId) {
      const match = getVineSeedById(initialSeedId)
      if (match) return match
    }
    return CANONICAL_VINE_SEEDS[0]
  })

  // 2. Interactive Learner State
  const [predictedGuess, setPredictedGuess] = React.useState<number | null>(null)
  const [added, setAdded] = React.useState<number>(0)
  const [isDragging, setIsDragging] = React.useState<boolean>(false)
  const [hasReflected, setHasReflected] = React.useState<boolean>(false)
  const [calmMode, setCalmMode] = React.useState<boolean>(false)
  const [isWatching, setIsWatching] = React.useState<boolean>(false)
  const [solved, setSolved] = React.useState<boolean>(false)

  // 3. Evaluation and Input Modality Tracking
  const [evaluation, setEvaluation] = React.useState<VineEvaluationResult | null>(null)
  const [submissionVia, setSubmissionVia] = React.useState<VineSubmissionVia>("drag")

  // Refs for SVG coordinate projection and demo cleanup
  const svgRef = React.useRef<SVGSVGElement | null>(null)
  const containerRef = React.useRef<HTMLDivElement | null>(null)
  const demoTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)

  // Maximum added flowers for current seed (whole - known)
  const maxAdded = Math.max(0, currentSeed.whole - currentSeed.known)

  // Sync with initialSeedId prop if provided
  React.useEffect(() => {
    if (initialSeedId) {
      const match = getVineSeedById(initialSeedId)
      if (match && match.id !== currentSeed.id) {
        handleSelectSeed(match)
      }
    }
  }, [initialSeedId])

  // Cleanup autonomous demo timer on unmount or seed change
  React.useEffect(() => {
    return () => {
      if (demoTimerRef.current) {
        clearTimeout(demoTimerRef.current)
      }
    }
  }, [])

  // Prediction Distractor Chips (Deterministic per seed)
  const predictionChips = React.useMemo(() => {
    const expected = currentSeed.whole - currentSeed.known
    const chipsSet = new Set<number>([expected])
    const deltas = [-1, 1, -2, 2, -3, 3, 4]
    for (const d of deltas) {
      const val = expected + d
      if (val >= 1 && val <= 9 && chipsSet.size < 5) {
        chipsSet.add(val)
      }
    }
    return Array.from(chipsSet).sort((a, b) => a - b)
  }, [currentSeed.id, currentSeed.whole, currentSeed.known])

  // Switch to a new problem seed
  const handleSelectSeed = (seed: VineProblemSeed) => {
    if (demoTimerRef.current) clearTimeout(demoTimerRef.current)
    setCurrentSeed(seed)
    setPredictedGuess(null)
    setAdded(0)
    setIsDragging(false)
    setHasReflected(false)
    setIsWatching(false)
    setSolved(false)
    setEvaluation(null)
    setSubmissionVia("drag")
  }

  // Update added count safely with chime audio
  const updateAdded = React.useCallback(
    (newAdded: number, via: VineSubmissionVia) => {
      const clamped = Math.max(0, Math.min(maxAdded, Math.round(newAdded)))
      setAdded(clamped)
      setSubmissionVia(via)
      if (solved) setSolved(false)
      if (evaluation) setEvaluation(null)

      if (!calmMode && clamped > 0) {
        const targetNodeIndex = currentSeed.known + clamped - 1
        playPluck(targetNodeIndex)
      }
    },
    [maxAdded, calmMode, currentSeed.known, solved, evaluation]
  )

  // Pointer Drag Handling with Integer Snapping along Y-axis
  const handlePointerDown = (e: React.PointerEvent) => {
    if (isWatching) return
    e.preventDefault()
    setIsDragging(true)
    setSubmissionVia("drag")
    ;(e.currentTarget as Element).setPointerCapture(e.pointerId)
  }

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || isWatching || !svgRef.current) return
    const rect = svgRef.current.getBoundingClientRect()
    const relY = ((e.clientY - rect.top) / rect.height) * 640

    // Find nearest growth node between known and 10 based on Y coordinate
    let closestNode = currentSeed.known
    let minDistance = Infinity

    for (let i = currentSeed.known; i <= 10; i++) {
      const coord = NODE_COORDINATES[i - 1]
      if (!coord) continue
      const dist = Math.abs(coord.y - relY)
      if (dist < minDistance) {
        minDistance = dist
        closestNode = i
      }
    }

    const calculatedAdded = Math.max(0, Math.min(maxAdded, closestNode - currentSeed.known))
    if (calculatedAdded !== added) {
      updateAdded(calculatedAdded, "drag")
    }
  }

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isDragging) return
    setIsDragging(false)
    try {
      ;(e.currentTarget as Element).releasePointerCapture(e.pointerId)
    } catch {
      // Ignore if pointer capture was already released
    }
  }

  // Direct Click/Tap on Node
  const handleNodeClick = (nodeNum: number) => {
    if (isWatching) return
    if (nodeNum <= currentSeed.known) {
      // Tap on known node resets added to 0
      updateAdded(0, "tap")
      if (!calmMode) playPluck(nodeNum - 1)
    } else {
      // Tap on sleeping or added node sets added
      const targetAdded = nodeNum - currentSeed.known
      updateAdded(targetAdded, "tap")
    }
  }

  // Keyboard Accessibility: Up/Down arrow keys increment/decrement, Enter locks in
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (isWatching) return

    if (e.key === "ArrowUp") {
      e.preventDefault()
      if (added < maxAdded) {
        updateAdded(added + 1, "keyboard")
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault()
      if (added > 0) {
        updateAdded(added - 1, "keyboard")
      }
    } else if (e.key === "Enter") {
      e.preventDefault()
      handleLockItIn()
    }
  }

  // Lock It In Submission Evaluation
  const handleLockItIn = () => {
    if (isWatching) return

    const submission: VineSubmission = {
      problemId: currentSeed.id,
      guess: predictedGuess,
      dragged: added,
      via: submissionVia,
    }

    const result = evaluateVineSubmission(currentSeed, submission)
    setEvaluation(result)

    if (result.verdict === "correct") {
      setSolved(true)
      if (!calmMode) {
        playCelebrationChimes()
      }
      confetti({ count: 70, spread: 80 })
      onSolved?.(submission)
    } else {
      setSolved(false)
      if (!calmMode) {
        // Nudge pluck at lower pitch offset
        playPluck(currentSeed.known + added - 1, -4)
      }
    }
  }

  // Autonomous Demonstration ("Watch Snail")
  const handleWatchSnail = () => {
    if (isWatching) return
    if (demoTimerRef.current) clearTimeout(demoTimerRef.current)

    setIsWatching(true)
    setSolved(false)
    setEvaluation(null)
    setSubmissionVia("tap")

    const target = maxAdded
    let currentStep = 0
    setAdded(0)

    const stepInterval = () => {
      if (currentStep < target) {
        currentStep += 1
        const stepVal = currentStep
        setAdded(stepVal)
        if (!calmMode) {
          playPluck(currentSeed.known + stepVal - 1)
        }
        demoTimerRef.current = setTimeout(stepInterval, 380)
      } else {
        setIsWatching(false)
      }
    }

    demoTimerRef.current = setTimeout(stepInterval, 300)
  }

  // Snail position on vine (at node: known + added)
  const snailNodeIndex = Math.max(
    1,
    Math.min(10, currentSeed.known + added)
  )
  const snailCoord = NODE_COORDINATES[snailNodeIndex - 1] ?? NODE_COORDINATES[0]
  const isGapUnfilled = added < maxAdded

  // Check if reflection is actively requested
  const isMismatchTriggered =
    solved &&
    evaluation?.mismatchReflectionNeeded === true &&
    !hasReflected

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      role="region"
      aria-label="Whispering Vine 10 minus ? Math Manipulative"
      className={cn(
        "w-full h-full flex flex-col justify-between p-2 sm:p-3 select-none outline-none focus:ring-2 focus:ring-amber-400/50 rounded-xl",
        calmMode ? "bg-amber-50/20" : "bg-transparent",
        className
      )}
    >
      {/* 1. Header Bar: Problem Selector Pills & Sensory Calm Mode Toggle */}
      <div className="shrink-0 w-full flex items-center justify-between gap-2 mb-1.5 flex-wrap">
        {/* Problem Seed Pills */}
        <div className="flex items-center gap-1 overflow-x-auto py-0.5">
          <span className="text-[11px] font-bold text-ink-soft uppercase tracking-wider hidden lg:inline mr-1">
            Vine:
          </span>
          {CANONICAL_VINE_SEEDS.map((seed) => {
            const isSelected = seed.id === currentSeed.id
            const subtrahend = seed.known
            return (
              <button
                key={seed.id}
                type="button"
                onClick={() => handleSelectSeed(seed)}
                className={cn(
                  "px-2.5 py-1 rounded-full text-xs font-bold transition-all cursor-pointer border shadow-2xs",
                  isSelected
                    ? "bg-amber-400 text-stone-900 border-amber-600 scale-105"
                    : "bg-white/90 text-stone-700 border-stone-300 hover:bg-amber-50 hover:border-amber-400"
                )}
                aria-pressed={isSelected}
              >
                10 − {subtrahend}
              </button>
            )
          })}
        </div>

        {/* Calm Sensory Toggle & Watch Demo */}
        <div className="flex items-center gap-1.5">
          <Button
            type="button"
            variant="outline"
            size="xs"
            onClick={handleWatchSnail}
            disabled={isWatching}
            className="h-7 text-xs px-2.5 bg-white/90 hover:bg-stone-50 border-stone-300 cursor-pointer font-bold flex items-center gap-1"
            title="Watch Barnaby snail crawl step by step"
          >
            <span>🐌</span>
            <span>{isWatching ? "Watching..." : "Watch Snail"}</span>
          </Button>

          <Button
            type="button"
            variant="outline"
            size="xs"
            onClick={() => setCalmMode((c) => !c)}
            className={cn(
              "h-7 text-xs px-2.5 transition-all cursor-pointer font-bold flex items-center gap-1",
              calmMode
                ? "bg-emerald-100 text-emerald-900 border-emerald-400 shadow-2xs"
                : "bg-white/90 text-stone-700 border-stone-300 hover:bg-emerald-50"
            )}
            title="Toggle gentle sensory mode"
            aria-pressed={calmMode}
          >
            <span>🌿</span>
            <span>{calmMode ? "🌿 Calm ON" : "🌿 Calm"}</span>
          </Button>
        </div>
      </div>

      {/* 2. Main Workspace: Interactive SVG Vine Canvas + Right Socratic Flow Panel */}
      <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-[1fr_260px] lg:grid-cols-[1fr_290px] gap-2.5 items-stretch overflow-hidden">
        {/* Left Column: Interactive Whispering Vine SVG Paper */}
        <Paper
          stock="card"
          rules="none"
          shadow="card"
          className="h-full w-full p-2 flex flex-col justify-between items-center relative overflow-hidden border-2 border-stone-300 bg-[#FCFBF7]"
        >
          {/* Washi Tape Fasteners */}
          <Tape kind="washi-dots" color="grass" length={50} height={16} className="absolute -top-2 left-6 z-10" />
          <Tape kind="masking" color="lemon" length={50} height={16} className="absolute -top-2 right-6 z-10" />

          {/* Socratic Story Narrative Banner */}
          <div className="w-full shrink-0 px-3 py-1.5 bg-amber-50/90 border border-amber-200/90 rounded-lg shadow-2xs flex items-center justify-between gap-2 z-10 mb-1">
            <div className="text-xs sm:text-sm font-script leading-tight text-amber-950 font-bold flex items-center gap-1.5">
              <span>🌱</span>
              <span>{currentSeed.story}</span>
            </div>
            <Badge
              variant="outline"
              className="text-[10px] h-5 bg-amber-100/70 text-amber-900 border-amber-300 font-bold shrink-0"
            >
              10 − {currentSeed.known} = ?
            </Badge>
          </div>

          {/* SVG Interactive Vine Drawing */}
          <div className="flex-1 min-h-0 w-full flex items-center justify-center relative py-0.5">
            <svg
              ref={svgRef}
              viewBox="0 0 440 640"
              className="h-full w-full max-h-[460px] object-contain drop-shadow-sm touch-none"
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              aria-hidden="true"
            >
              <defs>
                {/* Terracotta Pot Gradients */}
                <linearGradient id="potGrad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#C46244" />
                  <stop offset="50%" stopColor="#D97757" />
                  <stop offset="100%" stopColor="#AF4E32" />
                </linearGradient>

                {/* Bamboo Stalk Segment Gradient */}
                <linearGradient id="bambooGrad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#5E8C31" />
                  <stop offset="40%" stopColor="#7CB342" />
                  <stop offset="100%" stopColor="#4E7020" />
                </linearGradient>

                {/* Firefly Lantern Glow Filter */}
                <filter id="lanternGlow" x="-30%" y="-30%" width="160%" height="160%">
                  <feGaussianBlur stdDeviation="5" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>

              {/* Garden Trellis at Top */}
              <g id="trellis" opacity={0.85}>
                <line x1="160" y1="45" x2="310" y2="45" stroke="#DDB892" strokeWidth="6" strokeLinecap="round" />
                <line x1="180" y1="75" x2="290" y2="75" stroke="#DDB892" strokeWidth="5" strokeLinecap="round" />
                <line x1="190" y1="35" x2="190" y2="85" stroke="#C89F77" strokeWidth="4" />
                <line x1="235" y1="35" x2="235" y2="85" stroke="#C89F77" strokeWidth="4" />
                <line x1="280" y1="35" x2="280" y2="85" stroke="#C89F77" strokeWidth="4" />
                {/* Trellis top banner text */}
                <rect x="175" y="24" width="120" height="18" rx="9" fill="#FFF9E6" stroke="#DDB892" strokeWidth="1" />
                <text x="235" y="37" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#8C5C2E">
                  🌿 10 BLOSSOMS GOAL
                </text>
              </g>

              {/* Bamboo Vine Segments */}
              <g id="vine-stalk">
                {NODE_COORDINATES.map((coord, idx) => {
                  if (idx === NODE_COORDINATES.length - 1) return null
                  const next = NODE_COORDINATES[idx + 1]
                  const midX = (coord.x + next.x) / 2 + (idx % 2 === 0 ? 5 : -5)
                  const midY = (coord.y + next.y) / 2
                  return (
                    <path
                      key={`stalk-${idx}`}
                      d={`M ${coord.x} ${coord.y} Q ${midX} ${midY} ${next.x} ${next.y}`}
                      fill="none"
                      stroke="url(#bambooGrad)"
                      strokeWidth="7"
                      strokeLinecap="round"
                    />
                  )
                })}

                {/* Bamboo Joint Rings at Nodes */}
                {NODE_COORDINATES.map((c) => (
                  <ellipse
                    key={`joint-${c.node}`}
                    cx={c.x}
                    cy={c.y}
                    rx="8"
                    ry="3.5"
                    fill="#4E7020"
                    stroke="#334D14"
                    strokeWidth="1"
                  />
                ))}
              </g>

              {/* Terracotta Planter Pot at Bottom */}
              <g id="pot">
                {/* Pot Rim */}
                <rect x="165" y="552" width="110" height="16" rx="6" fill="url(#potGrad)" stroke="#8C381E" strokeWidth="1.5" />
                {/* Pot Soil */}
                <ellipse cx="220" cy="554" rx="46" ry="6" fill="#42281D" />
                {/* Pot Body */}
                <path
                  d="M 175 568 L 186 626 Q 220 634 254 626 L 265 568 Z"
                  fill="url(#potGrad)"
                  stroke="#8C381E"
                  strokeWidth="1.5"
                />
                {/* Pot Highlights and Texture */}
                <path d="M 190 575 Q 196 615 200 622" stroke="#E58D70" strokeWidth="2" strokeLinecap="round" fill="none" opacity={0.6} />
                <text x="220" y="604" textAnchor="middle" fontSize="11" fontWeight="bold" fill="#6A220E" opacity={0.75}>
                  GARDEN POT
                </text>
              </g>

              {/* 10 Growth Nodes (Node 1 bottom to Node 10 top) */}
              <g id="growth-nodes">
                {NODE_COORDINATES.map((c) => {
                  const nodeNum = c.node
                  const isKnown = nodeNum <= currentSeed.known
                  const isAdded = !isKnown && nodeNum <= currentSeed.known + added

                  // 1. Known Nodes: Peach Petals (#FFD3C4) with green leaf sprigs
                  if (isKnown) {
                    return (
                      <g
                        key={`node-${nodeNum}`}
                        className="cursor-pointer transition-transform hover:scale-110"
                        onClick={() => handleNodeClick(nodeNum)}
                      >
                        {/* Leaf Sprig */}
                        <path
                          d={`M ${c.x - 14} ${c.y - 4} Q ${c.x - 22} ${c.y - 12} ${c.x - 24} ${c.y - 2} Q ${c.x - 20} ${c.y + 6} ${c.x - 14} ${c.y - 4}`}
                          fill="#88B77B"
                          stroke="#5F8D53"
                          strokeWidth="1"
                        />
                        {/* Peach 5-Petal Blossom */}
                        <g transform={`translate(${c.x - 18}, ${c.y})`}>
                          {[0, 72, 144, 216, 288].map((angle, pi) => (
                            <ellipse
                              key={pi}
                              cx="0"
                              cy="-10"
                              rx="6.5"
                              ry="9"
                              transform={`rotate(${angle})`}
                              fill="#FFD3C4"
                              stroke="#EAA592"
                              strokeWidth="1"
                            />
                          ))}
                          <circle cx="0" cy="0" r="5" fill="#F4A261" stroke="#E76F51" strokeWidth="1" />
                        </g>
                        {/* Node Number Badge */}
                        <circle cx={c.x + 16} cy={c.y} r="8.5" fill="#FFF2EC" stroke="#EAA592" strokeWidth="1" />
                        <text x={c.x + 16} y={c.y + 3.5} textAnchor="middle" fontSize="9" fontWeight="bold" fill="#A85743">
                          {nodeNum}
                        </text>
                      </g>
                    )
                  }

                  // 2. Added Nodes: Mint Petals (#C5EED9) with spring green center
                  if (isAdded) {
                    return (
                      <g
                        key={`node-${nodeNum}`}
                        className="cursor-pointer transition-transform hover:scale-110"
                        onClick={() => handleNodeClick(nodeNum)}
                      >
                        {/* Leaf Sprig */}
                        <path
                          d={`M ${c.x - 14} ${c.y - 4} Q ${c.x - 22} ${c.y - 12} ${c.x - 24} ${c.y - 2} Q ${c.x - 20} ${c.y + 6} ${c.x - 14} ${c.y - 4}`}
                          fill="#70C1B3"
                          stroke="#48988B"
                          strokeWidth="1"
                        />
                        {/* Mint 5-Petal Blossom */}
                        <g transform={`translate(${c.x - 18}, ${c.y})`}>
                          {[0, 72, 144, 216, 288].map((angle, pi) => (
                            <ellipse
                              key={pi}
                              cx="0"
                              cy="-10"
                              rx="6.5"
                              ry="9"
                              transform={`rotate(${angle})`}
                              fill="#C5EED9"
                              stroke="#8ED1B2"
                              strokeWidth="1"
                            />
                          ))}
                          <circle cx="0" cy="0" r="5" fill="#52B788" stroke="#2D6A4F" strokeWidth="1" />
                        </g>
                        {/* Node Number Badge */}
                        <circle cx={c.x + 16} cy={c.y} r="8.5" fill="#E8F8F0" stroke="#70C1B3" strokeWidth="1" />
                        <text x={c.x + 16} y={c.y + 3.5} textAnchor="middle" fontSize="9" fontWeight="bold" fill="#2D6A4F">
                          {nodeNum}
                        </text>
                      </g>
                    )
                  }

                  // 3. Sleeping Nodes: Glowing Translucent Firefly Lantern Pods
                  return (
                    <g
                      key={`node-${nodeNum}`}
                      className="cursor-pointer group"
                      onClick={() => handleNodeClick(nodeNum)}
                    >
                      {/* Pulsing Golden Halo when gap is unfilled */}
                      {isGapUnfilled && (
                        <circle
                          cx={c.x - 18}
                          cy={c.y}
                          r="20"
                          fill="#FFEAA7"
                          opacity={calmMode ? 0.25 : 0.45}
                          className={calmMode ? "" : "animate-pulse"}
                        />
                      )}

                      {/* Lantern Pod Body */}
                      <g transform={`translate(${c.x - 18}, ${c.y})`}>
                        <rect
                          x="-10"
                          y="-14"
                          width="20"
                          height="28"
                          rx="10"
                          fill="#FFF9D2"
                          fillOpacity={0.85}
                          stroke="#E0A96D"
                          strokeWidth="1.5"
                          strokeDasharray="3 3"
                          className="group-hover:stroke-amber-600 transition-colors"
                        />
                        {/* Cute Sleeping Eyelashes ˘ ˘ */}
                        <path
                          d="M -5 -2 Q -3 1 0 -2 M 0 -2 Q 3 1 5 -2"
                          fill="none"
                          stroke="#B87D4B"
                          strokeWidth="1.2"
                          strokeLinecap="round"
                        />
                        {/* Lantern Top Ring */}
                        <circle cx="0" cy="-14" r="2.5" fill="#E0A96D" />
                      </g>

                      {/* Node Number Badge */}
                      <circle cx={c.x + 16} cy={c.y} r="8.5" fill="#FFFDEB" stroke="#E0A96D" strokeWidth="1" />
                      <text x={c.x + 16} y={c.y + 3.5} textAnchor="middle" fontSize="9" fontWeight="bold" fill="#8C5C2E">
                        {nodeNum}
                      </text>

                      {/* Large Transparent Tap Target (56px) */}
                      <circle cx={c.x - 18} cy={c.y} r="28" fill="transparent" />
                    </g>
                  )
                })}
              </g>

              {/* Draggable Dewdrop Snail (Barnaby) */}
              <g
                id="dewdrop-snail"
                transform={`translate(${snailCoord.x + 24}, ${snailCoord.y - 12})`}
                onPointerDown={handlePointerDown}
                className={cn(
                  "cursor-grab active:cursor-grabbing transition-transform",
                  isDragging && "scale-105"
                )}
              >
                {/* Snail Slime Shimmer Trail */}
                <ellipse cx="-16" cy="18" rx="14" ry="4" fill="#C5EED9" opacity={0.6} />

                {/* Snail Soft Foot Body */}
                <path
                  d="M -24 16 C -20 12, -4 14, 12 16 C 18 16, 22 13, 20 8 C 19 4, 14 3, 8 6 C 2 8, -12 8, -24 16 Z"
                  fill="#FFF0F5"
                  stroke="#E8A598"
                  strokeWidth="1.4"
                />

                {/* Eye Stalk 1 */}
                <path d="M 12 6 Q 16 -4 14 -12" fill="none" stroke="#E8A598" strokeWidth="1.6" strokeLinecap="round" />
                <circle cx="14" cy="-12" r="3" fill="#4A3E3D" />
                <circle cx="13" cy="-13" r="1" fill="#FFFFFF" />

                {/* Eye Stalk 2 */}
                <path d="M 6 5 Q 7 -5 5 -13" fill="none" stroke="#E8A598" strokeWidth="1.6" strokeLinecap="round" />
                <circle cx="5" cy="-13" r="3" fill="#4A3E3D" />
                <circle cx="4" cy="-14" r="1" fill="#FFFFFF" />

                {/* Rosy Cheek & Smile */}
                <circle cx="16" cy="10" r="2.2" fill="#FF8BA7" opacity={0.7} />
                <path d="M 14 12 Q 17 14 19 11" fill="none" stroke="#B85D6C" strokeWidth="1.2" strokeLinecap="round" />

                {/* Translucent Glass Shell (#F4ACB7) */}
                <circle
                  cx="-6"
                  cy="4"
                  r="16"
                  fill="#F4ACB7"
                  fillOpacity={0.88}
                  stroke="#E28292"
                  strokeWidth="1.5"
                  filter="drop-shadow(0 2px 4px rgba(0,0,0,0.12))"
                />
                {/* Shell Spiral Swirl */}
                <path
                  d="M -6 4 C -4 1, -1 3, -1 6 C -1 10, -7 11, -10 9 C -13 7, -13 1, -8 -2 C -3 -5, 4 -4, 5 3"
                  fill="none"
                  stroke="#D96B7D"
                  strokeWidth="1.4"
                  strokeLinecap="round"
                />
                {/* Glass Gloss Shine */}
                <ellipse cx="-11" cy="-2" rx="4" ry="2" transform="rotate(-30 -11 -2)" fill="#FFFFFF" opacity={0.7} />

                {/* Draggable Question Pill Handle */}
                <g transform="translate(18, -26)">
                  <rect
                    x="0"
                    y="0"
                    width="42"
                    height="20"
                    rx="10"
                    fill="#FFF9E6"
                    stroke="#E0A96D"
                    strokeWidth="1.4"
                    filter="drop-shadow(0 1px 2px rgba(0,0,0,0.1))"
                  />
                  <text x="21" y="14" textAnchor="middle" fontSize="11" fontWeight="bold" fill="#8C5C2E">
                    ? ↕
                  </text>
                </g>

                {/* Attached Floating Counter Pill Badge displaying live total (k + added) */}
                <g transform="translate(18, 0)">
                  <rect
                    x="0"
                    y="0"
                    width="46"
                    height="22"
                    rx="11"
                    fill={added === maxAdded ? "#2D6A4F" : "#3D5A80"}
                    stroke="#FFFFFF"
                    strokeWidth="1.5"
                    filter="drop-shadow(0 2px 4px rgba(0,0,0,0.18))"
                  />
                  <text x="23" y="15" textAnchor="middle" fontSize="12" fontWeight="bold" fill="#FFFFFF">
                    {currentSeed.known + added}
                  </text>
                </g>
              </g>

              {/* Autonomous Demo Ghost Cursor (when isWatching is true) */}
              {isWatching && (
                <g
                  transform={`translate(${snailCoord.x + 65}, ${snailCoord.y - 4})`}
                  className="transition-all duration-300 ease-out"
                >
                  <circle cx="0" cy="0" r="16" fill="#FFD166" opacity={0.4} className="animate-ping" />
                  <text x="-10" y="8" fontSize="22">
                    👆
                  </text>
                </g>
              )}
            </svg>
          </div>

          {/* Socratic Mathematical Summary at Bottom of Canvas */}
          <div className="w-full shrink-0 py-1.5 px-3 rounded-lg bg-stone-100/90 border border-stone-300 flex items-center justify-between gap-2 mt-1 z-10">
            <div className="text-xs sm:text-sm font-bold flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] uppercase text-ink-soft hidden sm:inline">Equation:</span>
              <Handwritten className="text-base text-amber-950 font-bold">
                {currentSeed.known} + {added} = {currentSeed.known + added}
              </Handwritten>
              <span className="text-xs text-stone-500 font-bold">
                (Need: {currentSeed.whole})
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              {solved && (
                <Badge variant="outline" className="text-[10px] h-5 bg-emerald-100 text-emerald-800 border-emerald-300 font-bold">
                  Full 10 Reached! ✔
                </Badge>
              )}
              {isGapUnfilled && (
                <span className="text-[11px] text-amber-800 font-bold hidden sm:inline">
                  {maxAdded - added} more bud{maxAdded - added === 1 ? "" : "s"}
                </span>
              )}
            </div>
          </div>
        </Paper>

        {/* Right Column: Socratic Pedagogical Controls & Co-Play Panel */}
        <div className="h-full min-h-0 flex flex-col justify-between gap-2 overflow-hidden">
          {/* Card 1: Metacognitive Prediction Chips ("First, what do you think?") */}
          <Card className="shrink-0 bg-paper/90 border-2 border-stone-300 shadow-xs p-2 sm:p-2.5 flex flex-col gap-1.5">
            <div className="flex items-center justify-between pb-1 border-b border-stone-200">
              <span className="text-xs font-bold text-stone-800 flex items-center gap-1">
                <span>💭</span>
                <span>First, what do you think?</span>
              </span>
              <span className="text-[10px] text-ink-soft">Predict ?</span>
            </div>

            {/* Pebble Chips */}
            <div className="flex items-center justify-center gap-1.5 py-0.5">
              {predictionChips.map((chipVal) => {
                const isSelected = predictedGuess === chipVal
                return (
                  <button
                    key={chipVal}
                    type="button"
                    onClick={() => setPredictedGuess(isSelected ? null : chipVal)}
                    className={cn(
                      "size-8 rounded-full font-bold text-sm transition-all cursor-pointer border flex items-center justify-center shadow-2xs",
                      isSelected
                        ? "bg-amber-400 text-stone-900 border-amber-600 scale-110 ring-2 ring-amber-400/50"
                        : "bg-amber-50/80 text-stone-700 border-stone-300 hover:bg-amber-100 hover:border-amber-400"
                    )}
                    aria-pressed={isSelected}
                    title={`Guess ${chipVal}`}
                  >
                    {chipVal}
                  </button>
                )
              })}
            </div>

            <div className="text-[11px] text-stone-500 text-center">
              {predictedGuess !== null ? (
                <span>
                  Your prediction: <strong className="text-amber-900">{predictedGuess}</strong>
                </span>
              ) : (
                <span>Tap a pebble to make a guess!</span>
              )}
            </div>
          </Card>

          {/* Card 2: Metacognitive Mismatch Reflection Card (When triggered) */}
          {isMismatchTriggered && (
            <Card className="shrink-0 bg-amber-50 border-2 border-amber-400 shadow-xs p-2.5 flex flex-col gap-1.5 animate-in fade-in duration-200">
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-950">
                <Seal variant="scallop" text="AHA!" mark="star" tone="tangerine" size={24} />
                <span>Metacognitive Reflection</span>
              </div>
              <p className="text-xs text-amber-900 font-bold leading-snug">
                You guessed <span className="underline">{predictedGuess}</span> and slid the snail to{" "}
                <span className="underline">{added}</span>. What did you notice?
              </p>
              <div className="flex flex-col gap-1 mt-1">
                <Button
                  size="xs"
                  variant="outline"
                  onClick={() => setHasReflected(true)}
                  className="h-6 text-[11px] justify-start bg-white/90 hover:bg-amber-100 border-amber-300 text-amber-950 font-bold cursor-pointer"
                >
                  💡 The gap was {added} sleeping buds!
                </Button>
                <Button
                  size="xs"
                  variant="outline"
                  onClick={() => setHasReflected(true)}
                  className="h-6 text-[11px] justify-start bg-white/90 hover:bg-amber-100 border-amber-300 text-amber-950 font-bold cursor-pointer"
                >
                  ✨ Now I see: {currentSeed.known} + {added} = 10!
                </Button>
              </div>
            </Card>
          )}

          {/* Card 3: Evaluator Hint & Feedback Result */}
          {evaluation && !isMismatchTriggered && (
            <Card
              className={cn(
                "shrink-0 border-2 shadow-xs p-2 flex flex-col gap-1 animate-in fade-in duration-200",
                evaluation.verdict === "correct"
                  ? "bg-emerald-50 border-emerald-400 text-emerald-950"
                  : "bg-amber-50 border-amber-300 text-amber-950"
              )}
            >
              <div className="flex items-center gap-1 text-xs font-bold">
                <span>{evaluation.verdict === "correct" ? "🎉" : "🌱"}</span>
                <span>{evaluation.verdict === "correct" ? "Full Bloom!" : "Keep Going!"}</span>
              </div>
              <p className="text-xs font-bold leading-tight">{evaluation.hint}</p>
            </Card>
          )}

          {/* Card 4: "Lock it In" Action Button & Tactile Counter */}
          <Card className="shrink-0 bg-paper/90 border-2 border-stone-300 shadow-xs p-2.5 flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-stone-700">Slid by Snail:</span>
              <Badge variant="outline" className="text-xs font-bold bg-amber-100 border-amber-300 text-amber-950">
                +{added} buds
              </Badge>
            </div>

            <Button
              type="button"
              onClick={handleLockItIn}
              disabled={isWatching}
              className={cn(
                "w-full h-9 font-bold text-sm shadow-xs cursor-pointer transition-all",
                solved
                  ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                  : "bg-amber-500 hover:bg-amber-600 text-stone-900"
              )}
            >
              {solved ? "✨ Locked In & Solved!" : "🔒 Lock it In"}
            </Button>
          </Card>

          {/* Card 5: Grown-Up Co-Play Prompt Card at the Bottom */}
          <Card className="shrink-0 bg-stone-50/90 border border-stone-300 p-2 flex flex-col gap-1">
            <div className="flex items-center gap-1 text-[11px] font-bold text-stone-700">
              <span>🌱</span>
              <span className="uppercase tracking-wider">Grown-Up Co-Play Tip</span>
            </div>
            <p className="text-[11px] text-stone-600 italic leading-snug">
              {currentSeed.coplayPrompt}
            </p>
          </Card>
        </div>
      </div>
    </div>
  )
}
