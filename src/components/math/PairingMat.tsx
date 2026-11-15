"use client"

import { Sticker } from "@/components/ui/sticker"
import type { PairingSlot } from "@/lib/math/evaluator"

export interface PairingMatProps {
  slots: PairingSlot[]
  numPairs: number
  totalTokens: number
  placedCount: number
  onSlotClick: (rowIdx: number, side: "left" | "right") => void
  isGhostCell?: (rowIdx: number, side: "left" | "right") => boolean
}

export function PairingMat({
  slots,
  numPairs,
  totalTokens,
  placedCount,
  onSlotClick,
  isGhostCell,
}: PairingMatProps) {
  return (
    <div className="flex-1 min-h-0 flex items-center justify-center py-1 overflow-hidden select-none">
      <div className="w-full max-w-md bg-stone-200/90 p-3 sm:p-4 rounded-2xl border-4 border-stone-400 shadow-md flex flex-col items-center">
        
        {/* Mat Header */}
        <div className="w-full flex items-center justify-between pb-1.5 mb-2 border-b border-stone-300 text-xs font-bold text-stone-800">
          <span className="flex items-center gap-1.5">
            <span>🌰</span>
            <span>Buddy Pairing Mat</span>
            <span className="text-[10px] text-stone-500 font-normal">({totalTokens} acorns to pair)</span>
          </span>
          <span className="text-stone-600 font-mono text-[11px] bg-stone-300/80 px-2 py-0.5 rounded">
            {placedCount} / {totalTokens} Placed
          </span>
        </div>

        {/* Column Headers */}
        <div className="w-full grid grid-cols-[60px_1fr_1fr] text-center text-[11px] font-bold text-stone-600 mb-1.5 px-1">
          <span>Pair</span>
          <span className="text-amber-900 bg-amber-200/70 py-0.5 rounded mx-1">Buddy 1</span>
          <span className="text-amber-900 bg-amber-200/70 py-0.5 rounded mx-1">Buddy 2</span>
        </div>

        {/* Dynamic List of Rows based on Math.ceil(totalTokens / 2) */}
        <div className="w-full flex flex-col gap-1.5 overflow-y-auto max-h-[300px] pr-1">
          {Array.from({ length: numPairs }).map((_, r) => {
            const slot = slots[r] || { left: false, right: false }
            const isPaired = slot.left && slot.right
            const hasLeftover = (slot.left && !slot.right) || (!slot.left && slot.right)
            const isLeftGhost = !slot.left && !!isGhostCell?.(r, "left")
            const isRightGhost = !slot.right && !!isGhostCell?.(r, "right")

            return (
              <div
                key={r}
                className={`grid grid-cols-[60px_1fr_1fr] items-center gap-2 px-2 py-1 rounded-xl transition-all border-2 ${
                  isPaired
                    ? "bg-emerald-50/90 border-emerald-400 shadow-2xs"
                    : hasLeftover
                    ? "bg-amber-100/90 border-amber-500 shadow-xs ring-1 ring-amber-400"
                    : "bg-stone-100/80 border-dashed border-stone-300"
                }`}
              >
                <div className="flex flex-col items-center justify-center">
                  <span className="text-xs font-bold text-stone-700">Pair {r + 1}</span>
                  {isPaired && <span className="text-[9px] text-emerald-700 font-bold">Matched!</span>}
                  {hasLeftover && <span className="text-[9px] text-amber-800 font-bold">Alone!</span>}
                </div>

                {/* Buddy 1 Slot */}
                <button
                  type="button"
                  onClick={() => onSlotClick(r, "left")}
                  aria-label={`Pair ${r + 1}, Buddy 1: ${slot.left ? "Acorn placed" : isLeftGhost ? "Ghost acorn hint" : "Empty slot"}`}
                  className={`h-11 rounded-xl flex items-center justify-center transition-all cursor-pointer border-2 ${
                    slot.left
                      ? "border-amber-600 bg-amber-100 shadow-xs"
                      : isLeftGhost
                      ? "border-amber-500 bg-amber-100/60 animate-pulse border-dashed shadow-xs ring-1 ring-amber-400"
                      : "border-2 border-dashed border-amber-400/90 bg-amber-50/90 shadow-2xs hover:border-amber-600 hover:bg-amber-100/90 hover:scale-102"
                  }`}
                >
                  {slot.left ? (
                    <div className="transition-transform active:scale-90">
                      <Sticker name="acorn-pair" size={32} rotate="auto" />
                    </div>
                  ) : isLeftGhost ? (
                    <span className="text-amber-800 font-bold text-xs animate-bounce" title="Hint: Place acorn here">
                      🌰
                    </span>
                  ) : (
                    <span className="size-5 rounded-full border-2 border-dotted border-amber-400 text-amber-500 flex items-center justify-center text-xs font-bold">
                      +
                    </span>
                  )}
                </button>

                {/* Buddy 2 Slot */}
                <button
                  type="button"
                  onClick={() => onSlotClick(r, "right")}
                  aria-label={`Pair ${r + 1}, Buddy 2: ${slot.right ? "Acorn placed" : isRightGhost ? "Ghost acorn hint" : "Empty slot"}`}
                  className={`h-11 rounded-xl flex items-center justify-center transition-all cursor-pointer border-2 ${
                    slot.right
                      ? "border-amber-600 bg-amber-100 shadow-xs"
                      : isRightGhost
                      ? "border-amber-500 bg-amber-100/60 animate-pulse border-dashed shadow-xs ring-1 ring-amber-400"
                      : "border-2 border-dashed border-amber-400/90 bg-amber-50/90 shadow-2xs hover:border-amber-600 hover:bg-amber-100/90 hover:scale-102"
                  }`}
                >
                  {slot.right ? (
                    <div className="transition-transform active:scale-90">
                      <Sticker name="acorn-pair" size={32} rotate="auto" />
                    </div>
                  ) : isRightGhost ? (
                    <span className="text-amber-800 font-bold text-xs animate-bounce" title="Hint: Place acorn here">
                      🌰
                    </span>
                  ) : (
                    <span className="size-5 rounded-full border-2 border-dotted border-amber-400 text-amber-500 flex items-center justify-center text-xs font-bold">
                      +
                    </span>
                  )}
                </button>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
