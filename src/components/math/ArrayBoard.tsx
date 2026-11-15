"use client"

import { Sticker } from "@/components/ui/sticker"

export interface ArrayBoardProps {
  grid: boolean[][]
  onCellClick: (r: number, c: number) => void
  activeLens: "none" | "row" | "col"
  isGhostCell: (r: number, c: number) => boolean
  discoveredCommutative: boolean
  rowCounts?: number[]
  colCounts?: number[]
  totalPlaced: number
  totalCookies: number
}

export function ArrayBoard({
  grid,
  onCellClick,
  activeLens,
  isGhostCell,
  discoveredCommutative,
  totalPlaced,
  totalCookies,
}: ArrayBoardProps) {
  return (
    <div className="flex-1 min-h-0 flex items-center justify-center py-1 select-none">
      <div className="relative bg-amber-100/80 dark:bg-stone-800 p-3.5 sm:p-4 rounded-2xl border-4 border-amber-400/80 shadow-md flex flex-col items-center">
        
        {/* Baking Sheet Tray Header Label */}
        <div className="w-full flex items-center justify-between pb-1.5 mb-1.5 border-b border-amber-300/80 text-[11px] font-bold text-amber-950">
          <span className="flex items-center gap-1.5 font-bold">
            <span className="text-sm">🍪</span> Cookie Baking Sheet
          </span>
          <span className="text-amber-800 font-mono text-[10px] bg-amber-200/80 px-2 py-0.5 rounded font-bold">
            {totalPlaced} / {totalCookies} Cookies Placed
          </span>
        </div>

        {/* The 5x5 Cookie Baking Grid */}
        <div className="grid grid-cols-5 gap-2.5 p-3 bg-amber-200/50 rounded-xl border-2 border-amber-300/80 shadow-inner">
            {grid.map((row, r) =>
              row.map((cell, c) => {
                const isGhost = isGhostCell(r, c)
                const isRowHighlight = (activeLens === "row" || discoveredCommutative) && cell
                const isColHighlight = (activeLens === "col" || discoveredCommutative) && cell

                return (
                  <button
                    key={`${r}-${c}`}
                    type="button"
                    onClick={() => onCellClick(r, c)}
                    aria-label={`Row ${r + 1}, Column ${c + 1}, ${cell ? "Cookie placed" : "Empty slot"}`}
                    className={`size-12 sm:size-14 rounded-2xl flex items-center justify-center transition-all cursor-pointer relative select-none border-2 ${
                      isGhost
                        ? "border-amber-500 bg-amber-100/60 animate-pulse border-dashed shadow-xs"
                        : cell
                        ? isColHighlight && isRowHighlight
                          ? "border-emerald-500 bg-emerald-50 shadow-md ring-2 ring-emerald-400"
                          : isRowHighlight
                          ? "border-amber-500 bg-amber-100 shadow-md ring-2 ring-amber-400"
                          : isColHighlight
                          ? "border-sky-500 bg-sky-100 shadow-md ring-2 ring-sky-400"
                          : "border-amber-600/70 bg-amber-50/90 shadow-xs hover:scale-105"
                        : "border-2 border-dashed border-amber-400/90 bg-amber-50/90 shadow-2xs hover:border-amber-600 hover:bg-amber-100 hover:scale-105"
                    }`}
                  >
                    {cell ? (
                      <div className="transition-transform active:scale-90">
                        <Sticker name="cookie-bitten" size={42} rotate="auto" />
                      </div>
                    ) : isGhost ? (
                      <span className="text-amber-800 font-bold text-xs animate-bounce" title="Hint: Place cookie here">🍪</span>
                    ) : (
                      <span className="size-5 rounded-full border-2 border-dotted border-amber-400 text-amber-500 flex items-center justify-center text-xs font-bold">
                        +
                      </span>
                    )}
                  </button>
                )
              })
            )}
          </div>

        {/* Helpful touch hint when board is empty */}
        {totalPlaced === 0 && (
          <p className="text-[11px] text-amber-900 font-bold mt-2 animate-bounce">
            👉 Tap a spot on the baking sheet or tap a cookie in the tray!
          </p>
        )}
      </div>
    </div>
  )
}
