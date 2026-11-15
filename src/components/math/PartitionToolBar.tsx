"use client"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export interface PartitionToolBarProps {
  activeShares: 2 | 3 | 4
  targetShares: 2 | 3 | 4
  onSelectShares: (shares: 2 | 3 | 4) => void
  onCheckAnswer: () => void
  isSolved?: boolean
  className?: string
}

interface ShareButtonConfig {
  shares: 2 | 3 | 4
  label: string
  symbol: string
}

const SHARE_BUTTONS: readonly ShareButtonConfig[] = [
  { shares: 2, label: "2 Halves", symbol: "◫" },
  { shares: 3, label: "3 Thirds", symbol: "▥" },
  { shares: 4, label: "4 Fourths", symbol: "⊞" },
]

export function PartitionToolBar({
  activeShares,
  targetShares,
  onSelectShares,
  onCheckAnswer,
  isSolved = false,
  className,
}: PartitionToolBarProps) {
  return (
    <div
      className={cn(
        "w-full shrink-0 flex items-center justify-between gap-3 flex-wrap py-2 px-3 bg-stone-100/90 rounded-xl border border-stone-300 shadow-2xs select-none",
        className,
      )}
      role="toolbar"
      aria-label="Geometry Partition Tools"
    >
      {/* 1. Single-Tap Cutter Tool Badges [2 Halves ◫] [3 Thirds ▥] [4 Fourths ⊞] */}
      <div className="flex items-center gap-2 flex-wrap" role="group" aria-label="Share Cutters">
        <span className="text-xs uppercase tracking-wider font-bold text-stone-500 mr-1 hidden sm:inline">
          Cutter:
        </span>
        {SHARE_BUTTONS.map(({ shares, label, symbol }) => {
          const isActive = activeShares === shares
          const isTarget = targetShares === shares

          return (
            <Button
              key={shares}
              type="button"
              variant={isActive ? "default" : "outline"}
              onClick={() => onSelectShares(shares)}
              className={cn(
                "h-12 min-h-[48px] px-3.5 sm:px-4 rounded-xl text-sm sm:text-base font-bold transition-all cursor-pointer flex items-center gap-2 border-2",
                isActive
                  ? "bg-amber-400 hover:bg-amber-500 text-stone-900 border-amber-600 shadow-md ring-2 ring-amber-400/80 active:scale-95"
                  : "bg-stone-50 hover:bg-amber-50 text-stone-700 border-stone-300 hover:border-amber-400 active:scale-95",
              )}
              aria-pressed={isActive}
              aria-label={`Select ${label} cutter`}
            >
              <span className="text-lg leading-none" aria-hidden="true">
                {symbol}
              </span>
              <span>{label}</span>
              {isTarget && (
                <span
                  className={cn(
                    "text-[10px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider",
                    isActive ? "bg-amber-900/20 text-stone-900" : "bg-amber-200/80 text-amber-900",
                  )}
                  title="Challenge Target Shares"
                >
                  Goal
                </span>
              )}
            </Button>
          )
        })}
      </div>

      {/* 2. Check Answer Trigger Button */}
      <div className="flex items-center gap-2">
        <Button
          type="button"
          onClick={onCheckAnswer}
          className={cn(
            "h-12 min-h-[48px] px-5 sm:px-6 rounded-xl font-bold text-sm sm:text-base shadow-md transition-all cursor-pointer flex items-center gap-2 active:scale-95",
            isSolved
              ? "bg-amber-600 hover:bg-amber-700 text-white border-2 border-amber-700"
              : "bg-emerald-600 hover:bg-emerald-700 text-white border-2 border-emerald-700",
          )}
          aria-label={isSolved ? "Check slices again" : "Check my slices"}
        >
          <span>{isSolved ? "Check Again ✔" : "Check My Slices ✔"}</span>
        </Button>
      </div>
    </div>
  )
}
