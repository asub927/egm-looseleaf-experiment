import { useReadAloud } from "../hooks/use-read-aloud"

export function ReadAloudButton({
  getText,
  label = "Read aloud",
  testId,
}: {
  getText: () => string
  label?: string
  testId?: string
}) {
  const { speak, canSpeak } = useReadAloud()
  return (
    <button
      type="button"
      className="garden-tap"
      style={{ minWidth: 56, minHeight: 56, padding: "0 12px" }}
      aria-label={label}
      data-testid={testId}
      aria-disabled={!canSpeak}
      title={canSpeak ? label : "Read-aloud is not available"}
      onClick={() => speak(getText())}
    >
      🔊
    </button>
  )
}
