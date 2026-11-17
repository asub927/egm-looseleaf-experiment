import * as React from "react"

function speechText(t: string): string {
  return t
    .replace(/=\?/g, " equals? ")
    .replace(/−/g, " minus ")
    .replace(/\+/g, " plus ")
    .replace(/=/g, " equals ")
    .replace(/\s+/g, " ")
    .trim()
}

export function useReadAloud() {
  const canSpeak = React.useMemo(() => {
    try {
      return (
        typeof window !== "undefined" &&
        !!window.speechSynthesis &&
        typeof window.SpeechSynthesisUtterance === "function"
      )
    } catch {
      return false
    }
  }, [])

  const speak = React.useCallback(
    (text: string) => {
      if (!canSpeak) return false
      try {
        window.speechSynthesis.cancel()
        const u = new SpeechSynthesisUtterance(speechText(text))
        u.rate = 0.85
        u.pitch = 1.05
        window.speechSynthesis.speak(u)
        return true
      } catch {
        return false
      }
    },
    [canSpeak],
  )

  return { speak, canSpeak }
}
