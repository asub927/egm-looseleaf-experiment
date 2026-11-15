"use client"

import * as React from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Mascot } from "@/components/ui/mascot"
import { Bubble, BubbleContent } from "@/components/ui/bubble"
import type { MascotPose } from "@/lib/ink/art/mascots"
import type { WordToken } from "@/hooks/use-audio-narration"

export interface MascotCompanionProps {
  pose: MascotPose
  speech: string
  tierBadge: string
  onAskHint: () => void
  hintButtonLabel?: string
  currentWordIndex?: number
  words?: string[]
  tokens?: WordToken[]
  isSpeaking?: boolean
}

export function MascotCompanion({
  pose,
  speech,
  tierBadge,
  onAskHint,
  hintButtonLabel = "💡 Ask Pencil Pal for a Hint",
  currentWordIndex = -1,
  words,
  isSpeaking = false,
}: MascotCompanionProps) {
  // If words array is provided, use it; otherwise split speech text into word tokens
  const wordTokens = React.useMemo(() => {
    if (words && words.length > 0) return words
    if (!speech) return []
    return speech.split(/\s+/).filter(Boolean)
  }, [words, speech])

  const hasActiveWord = currentWordIndex >= 0 && currentWordIndex < wordTokens.length

  return (
    <Card className="flex-1 min-h-0 bg-paper/90 border-2 border-stone-300 shadow-xs p-2.5 flex flex-col justify-between overflow-hidden select-none">
      <div className="flex items-center justify-between pb-1 border-b border-stone-200 shrink-0">
        <span className="text-xs font-bold flex items-center gap-1">
          <span>✏️</span> Pencil Pal
        </span>
        <Badge
          variant="outline"
          className="text-[10px] h-5 bg-amber-100/60 border-amber-300 font-bold"
        >
          {tierBadge}
        </Badge>
      </div>

      {/* Mascot SVG representation */}
      <div className="flex-1 min-h-0 flex items-center justify-center py-0.5">
        <Mascot pose={pose} size={76} />
      </div>

      {/* Reactive Speech Bubble with Real-Time Subtitle Highlighting */}
      <Bubble
        variant="secondary"
        shape="cloud"
        className="mt-1 w-full max-h-[96px] overflow-hidden shrink-0"
      >
        <BubbleContent className="text-xs sm:text-sm font-hand leading-tight p-2 text-ink">
          {isSpeaking && (
            <span
              className="inline-flex items-center text-[10px] text-amber-700 mr-1 animate-pulse select-none"
              title="Speaking aloud"
              aria-label="Speaking aloud"
            >
              🔊
            </span>
          )}
          {hasActiveWord ? (
            <span>
              {wordTokens.map((word, idx) => {
                const isCurrent = idx === currentWordIndex
                const isPast = idx < currentWordIndex
                return (
                  <span
                    key={idx}
                    className={
                      isCurrent
                        ? "bg-amber-300 text-stone-900 font-bold px-1 py-0.5 rounded shadow-2xs inline-block scale-105 transition-all"
                        : isPast
                          ? "text-stone-700"
                          : "text-stone-900"
                    }
                  >
                    {word}
                    {idx < wordTokens.length - 1 ? " " : ""}
                  </span>
                )
              })}
            </span>
          ) : (
            speech
          )}
        </BubbleContent>
      </Bubble>

      <div className="shrink-0 pt-1.5">
        <Button
          variant="outline"
          size="xs"
          className="w-full text-[11px] h-7 bg-amber-50 hover:bg-amber-100 border-amber-300 font-bold cursor-pointer"
          onClick={onAskHint}
        >
          {hintButtonLabel}
        </Button>
      </div>
    </Card>
  )
}
