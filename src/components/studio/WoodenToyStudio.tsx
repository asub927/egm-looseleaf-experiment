"use client"

import * as React from "react"
import {
  DovetailZenToy,
  CURRICULUM_STATIONS,
  type CurriculumStationId,
  type DovetailSnapDetail,
} from "@/components/landing/DovetailZenToy"
import { playWoodThock, playWoodSettle, playPentatonicHarmony } from "@/lib/audio/wood-thock-synth"
import { playPluck } from "@/lib/audio/garden-chimes"
import { useDeskViewTransition } from "@/lib/dom/view-transitions"
import { cn } from "@/lib/utils"

export interface WoodenToyStudioProps {
  /** Callback to switch to Board 2 (Pip's Math Garden) */
  onSelectGarden?: () => void
  /** Initial active curriculum station tab */
  initialStation?: CurriculumStationId
  /** Optional custom CSS class */
  className?: string
}

export function WoodenToyStudio({
  onSelectGarden: _onSelectGarden,
  initialStation = "making-ten",
  className,
}: WoodenToyStudioProps) {
  const { startDeskTransition } = useDeskViewTransition()

  // Master Sound Flag
  const [soundEnabled, setSoundEnabled] = React.useState<boolean>(() => {
    try {
      const stored = localStorage.getItem("egm_sound_enabled")
      if (stored !== null) return stored === "true"
    } catch {
      // Storage access may be blocked
    }
    return true
  })

  // Active Curriculum Station
  const [activeStation, setActiveStation] = React.useState<CurriculumStationId>(initialStation)

  // Solved state per station to power live brass equation feedback
  const [stationSolved, setStationSolved] = React.useState<Record<CurriculumStationId, boolean>>({
    "making-ten": false,
    arrays: false,
    parity: false,
    geometry: false,
    dovetail: false,
  })

  // Workbench key for instant spring-reset
  const [workbenchKey, setWorkbenchKey] = React.useState(0)

  // Current station configuration
  const currentStationConfig =
    CURRICULUM_STATIONS.find((s) => s.id === activeStation) ?? CURRICULUM_STATIONS[0]

  // Toggle procedural sound
  const handleToggleSound = React.useCallback(() => {
    setSoundEnabled((prev) => {
      const next = !prev
      try {
        localStorage.setItem("egm_sound_enabled", String(next))
      } catch {
        // Ignore
      }
      if (next) {
        playPluck(5)
      }
      return next
    })
  }, [])

  // Switch station with view transition & wood thock
  const handleSwitchStation = React.useCallback(
    (stationId: CurriculumStationId) => {
      if (stationId === activeStation) return
      startDeskTransition(() => {
        setActiveStation(stationId)
      })
      if (soundEnabled) {
        playWoodThock(null, 0.95)
      }
    },
    [activeStation, soundEnabled, startDeskTransition],
  )

  // Reset current station pieces
  const handleResetBench = React.useCallback(() => {
    setWorkbenchKey((k) => k + 1)
    setStationSolved((prev) => ({ ...prev, [activeStation]: false }))
    if (soundEnabled) {
      playWoodSettle()
    }
  }, [activeStation, soundEnabled])

  // Snap handler
  const handleSnap = React.useCallback((detail: DovetailSnapDetail) => {
    if (detail.stationId) {
      setStationSolved((prev) => ({ ...prev, [detail.stationId as CurriculumStationId]: true }))
    }
  }, [])

  // Complete handler
  const handleComplete = React.useCallback(() => {
    setStationSolved((prev) => ({ ...prev, [activeStation]: true }))
    if (soundEnabled) {
      playPentatonicHarmony()
    }
  }, [activeStation, soundEnabled])

  const isCurrentSolved = stationSolved[activeStation]

  return (
    <div
      className={cn(
        "h-screen w-screen overflow-hidden select-none flex flex-col relative font-sans text-[#2b2118] bg-[#fbf9f4]",
        className,
      )}
    >
      {/* ==============================================================
          HOMEFELLOW LIVING WORLD ATMOSPHERE: WARM WORKSHOP LAMP GLOW
          ============================================================== */}
      <style>{`
        @keyframes lampBreathe {
          0%, 100% {
            opacity: 0.85;
            transform: scale(1);
          }
          50% {
            opacity: 1.0;
            transform: scale(1.04);
          }
        }
        .animate-lamp-breathe {
          animation: lampBreathe 8s ease-in-out infinite;
        }
        .font-editorial-serif {
          font-family: "Georgia", "Gloock", "Baskerville", "Playfair Display", serif;
        }
      `}</style>

      {/* Ambient Sunlit Sky & Cedar Grain Gradient */}
      <div
        className="absolute inset-0 pointer-events-none z-0"
        style={{
          background: "radial-gradient(ellipse at 50% 12%, #fffdfa 0%, #f7f2e7 55%, #eae1cf 100%)",
        }}
      />

      {/* Breathing Warm Golden Hour Lamp Glow (Overhead Workshop Light) */}
      <div
        className="absolute -top-32 inset-x-0 h-96 pointer-events-none z-0 animate-lamp-breathe flex justify-center"
        style={{
          background:
            "radial-gradient(ellipse 65% 100% at 50% 0%, rgba(254, 211, 48, 0.18) 0%, rgba(247, 183, 49, 0.08) 45%, transparent 75%)",
        }}
      />

      {/* Subtle Micro-Grain Texture Veil */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.035] z-0"
        style={{
          backgroundImage: `radial-gradient(#2b2118 0.75px, transparent 0.75px)`,
          backgroundSize: "16px 16px",
        }}
      />

      {/* ==============================================================
          SLIM INSTRUMENT HEADER BAR (HOMEFELLOW EDITORIAL ERGONOMICS)
          ============================================================== */}
      <header className="relative z-40 h-14 sm:h-16 px-3 sm:px-6 flex items-center justify-between border-b border-[#d4a373]/25 bg-white/75 backdrop-blur-md shadow-xs shrink-0">
        {/* Left: Studio Brand with Warm Editorial Typography */}
        <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
          <span className="text-xl sm:text-2xl filter drop-shadow-xs">🪵</span>
          <div className="flex flex-col">
            <h1 className="font-editorial-serif text-sm sm:text-base font-black tracking-tight text-[#2b2118] [text-wrap:nowrap]">
              The Dovetail Atelier
            </h1>
            <span className="text-[10px] sm:text-[11px] font-medium text-[#7a6452] tracking-wide hidden md:block">
              Handcrafted Physical Math Studio · NC Grade 2
            </span>
          </div>
        </div>

        {/* Center: Tactile Station Navigation Switcher (Baltic Birch & Brass Pills) */}
        <nav
          aria-label="Curriculum station switcher"
          className="flex items-center gap-1 sm:gap-1.5 bg-[#eae2d3]/60 p-1 rounded-full border border-[#bc6c25]/20 shadow-inner overflow-x-auto max-w-[50vw] sm:max-w-none scrollbar-none"
        >
          {CURRICULUM_STATIONS.map((station) => {
            const isActive = activeStation === station.id
            const isSolved = stationSolved[station.id]

            return (
              <button
                key={station.id}
                type="button"
                onClick={() => handleSwitchStation(station.id)}
                className={cn(
                  "px-2.5 sm:px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 [text-wrap:nowrap]",
                  isActive
                    ? "bg-[#2b2d42] text-white shadow-sm scale-[1.02]"
                    : "text-[#5c4a3b] hover:text-[#2b2d42] hover:bg-black/5",
                )}
                aria-pressed={isActive}
                title={station.title}
              >
                <span className="text-xs">{station.icon}</span>
                <span className="hidden sm:inline">{station.name}</span>
                <span
                  className={cn(
                    "text-[9px] font-mono px-1.5 py-0.2 rounded-full",
                    isActive
                      ? "bg-white/20 text-white"
                      : isSolved
                        ? "bg-[#10ac84]/20 text-[#10ac84]"
                        : "bg-black/5 text-[#7a6452]",
                  )}
                >
                  {isSolved ? "✓" : station.badge}
                </span>
              </button>
            )
          })}
        </nav>

        {/* Right: Controls & Space for Floating Board Switcher */}
        <div className="flex items-center gap-2 shrink-0 mr-56 sm:mr-64">
          {/* Spring-Return Reset Button */}
          <button
            type="button"
            onClick={handleResetBench}
            className="cursor-pointer p-1.5 sm:px-2.5 sm:py-1 rounded-full text-xs font-bold text-[#6b5544] hover:text-[#2b2118] bg-[#f0e8dc] hover:bg-[#e7dcce] border border-[#d4a373]/30 transition-all flex items-center gap-1"
            title="Return pieces to resting origin"
            aria-label="Reset bench pieces"
          >
            <span className="text-sm">↺</span>
            <span className="hidden lg:inline text-[11px]">Reset</span>
          </button>

          {/* Procedural Sound Toggle */}
          <button
            type="button"
            onClick={handleToggleSound}
            className={cn(
              "cursor-pointer p-1.5 sm:px-2.5 sm:py-1 rounded-full text-xs font-bold border transition-all flex items-center gap-1",
              soundEnabled
                ? "bg-[#10ac84]/15 border-[#10ac84]/30 text-[#0d7d60]"
                : "bg-stone-200/60 border-stone-300 text-stone-500",
            )}
            title={soundEnabled ? "Procedural Wood Sound: On" : "Sound Muted"}
            aria-label={soundEnabled ? "Procedural Wood Sound: On" : "Sound Muted"}
          >
            <span>{soundEnabled ? "🔔" : "🔕"}</span>
            <span className="hidden lg:inline text-[11px] font-mono">
              {soundEnabled ? "Audio" : "Mute"}
            </span>
          </button>
        </div>
      </header>

      {/* ==============================================================
          LIVE INLAID BRASS EQUATION PLAQUE (HOMEFELLOW TACTILE HARMONY)
          ============================================================== */}
      <div className="relative z-30 w-full flex justify-center pt-2.5 sm:pt-3.5 px-4 pointer-events-none">
        <div
          className={cn(
            "pointer-events-auto max-w-2xl px-4 sm:px-6 py-1.5 sm:py-2 rounded-2xl border flex items-center justify-between gap-3 shadow-md transition-all duration-300",
            isCurrentSolved
              ? "bg-gradient-to-r from-[#10ac84]/15 via-[#fff8ec] to-[#10ac84]/15 border-[#10ac84]/50 shadow-[#10ac84]/10"
              : "bg-gradient-to-r from-[#f5ebd9] via-[#fffbf3] to-[#f5ebd9] border-[#d4a373]/40 shadow-stone-900/5",
          )}
          style={{
            boxShadow:
              "inset 0 1px 2px rgba(255, 255, 255, 0.8), inset 0 -1px 2px rgba(60, 48, 36, 0.1), 0 4px 12px rgba(43, 33, 24, 0.06)",
          }}
        >
          {/* Left: Decorative Brass Screw Rivet */}
          <div className="w-2 h-2 rounded-full bg-[#cda274] border border-[#9b581b]/50 shadow-inner shrink-0 hidden sm:block" />

          {/* Center: Live Mathematical Relationship with Editorial Typography */}
          <div className="flex items-center gap-2 text-center grow justify-center">
            <span
              className={cn(
                "text-xs sm:text-sm font-black tracking-wide [text-wrap:balance]",
                isCurrentSolved ? "text-[#0d7d60]" : "text-[#543d2b]",
              )}
            >
              {isCurrentSolved
                ? currentStationConfig.solvedEquation
                : currentStationConfig.normalEquation}
            </span>
          </div>

          {/* Right: Decorative Brass Screw Rivet */}
          <div className="w-2 h-2 rounded-full bg-[#cda274] border border-[#9b581b]/50 shadow-inner shrink-0 hidden sm:block" />
        </div>
      </div>

      {/* ==============================================================
          PRIMARY MANIPULATIVE STAGE: FULL-BLEED CEDAR WORKBENCH
          ============================================================== */}
      <main className="relative z-10 flex-1 w-full flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-hidden">
        <div className="w-full max-w-5xl h-full max-h-[820px] rounded-3xl bg-gradient-to-b from-[#fdfbf7] to-[#f4eedf] border-4 border-[#cda274] shadow-[0_20px_50px_rgba(43,33,24,0.12),0_4px_12px_rgba(43,33,24,0.06)] flex flex-col relative overflow-hidden">
          {/* Top Hinoki Wood Grain Accent Strip */}
          <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-[#d4a373] via-[#bc6c25] to-[#d4a373]" />

          {/* Active Dovetail Manipulative Host */}
          <div className="w-full h-full flex-1 flex items-center justify-center overflow-auto scrollbar-none p-2 sm:p-4">
            <DovetailZenToy
              key={`workbench-station-${activeStation}-${workbenchKey}`}
              activeStation={activeStation}
              onStationChange={handleSwitchStation}
              soundEnabled={soundEnabled}
              hideTabs={true}
              onSnap={handleSnap}
              onComplete={handleComplete}
              className="w-full max-w-4xl"
            />
          </div>
        </div>
      </main>
    </div>
  )
}
