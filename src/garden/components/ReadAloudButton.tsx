import { useReadAloud } from "../hooks/use-read-aloud"

export function ReadAloudButton({
  getText,
  label = "Read aloud",
  testId,
  className,
}: {
  getText: () => string
  label?: string
  testId?: string
  className?: string
}) {
  const { speak, canSpeak } = useReadAloud()
  const btnClass = className === "read" ? "read" : `garden-tap${className ? ` ${className}` : ""}`
  return (
    <button
      type="button"
      className={btnClass}
      style={className === "read" ? undefined : { minWidth: 56, minHeight: 56, padding: "0 12px" }}
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
