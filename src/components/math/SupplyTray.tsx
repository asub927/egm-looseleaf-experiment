"use client"

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Sticker } from "@/components/ui/sticker"

export interface SupplyTrayProps {
  title: string
  icon: string
  stickerName: "cookie-bitten" | "acorn-pair"
  totalCount: number
  supplyCount: number
  onStampItem: () => void
  helperText?: string
}

export function SupplyTray({
  title,
  icon,
  stickerName,
  totalCount,
  supplyCount,
  onStampItem,
  helperText,
}: SupplyTrayProps) {
  return (
    <Card className="shrink-0 bg-paper/90 border-2 border-stone-300 shadow-xs p-2.5 select-none">
      <CardHeader className="p-0 pb-1.5 flex flex-row items-center justify-between">
        <CardTitle className="text-xs font-bold uppercase tracking-wider text-ink-soft flex items-center gap-1.5">
          <span>{icon}</span> {title}
        </CardTitle>
        <Badge
          variant={supplyCount > 0 ? "secondary" : "outline"}
          className="text-xs font-mono h-5 px-1.5 bg-amber-100 text-amber-900 border-amber-300 font-bold"
        >
          {supplyCount} Left
        </Badge>
      </CardHeader>
      <CardContent className="p-0">
        <div className="grid grid-cols-5 gap-1.5 bg-amber-50/80 p-2 rounded-xl border border-stone-300">
          {Array.from({ length: totalCount }).map((_, i) => {
            const isAvailable = i < supplyCount
            return (
              <button
                key={i}
                type="button"
                disabled={!isAvailable}
                onClick={onStampItem}
                aria-label={`Item ${i + 1} of ${totalCount}, tap to place on workspace`}
                className={`size-9 rounded-xl flex items-center justify-center transition-all border-2 ${
                  isAvailable
                    ? "border-amber-400 bg-amber-100/90 shadow-2xs hover:scale-110 active:scale-95 cursor-pointer hover:border-amber-500"
                    : "border-dashed border-stone-300 bg-transparent opacity-25 cursor-default"
                }`}
              >
                {isAvailable && (
                  <div className="transition-transform">
                    <Sticker name={stickerName} size={28} rotate="auto" />
                  </div>
                )}
              </button>
            )
          })}
        </div>
        <p className="text-[10px] text-amber-900 font-bold mt-1.5 text-center font-hand">
          {helperText ||
            (supplyCount > 0
              ? "👆 Tap an item to place it on the board!"
              : "All items placed! Tap Check below.")}
        </p>
      </CardContent>
    </Card>
  )
}
