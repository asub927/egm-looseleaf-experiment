import { useReadAloud } from "../hooks/use-read-aloud"

const READ_ALOUD_ICON = (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor" />
    <path
      d="M16 8.5c1.4 1 1.4 6 0 7M18.5 6c2.8 2.2 2.8 9.8 0 12"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
)

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
      {className === "read" ? READ_ALOUD_ICON : "🔊"}
    </button>
  )
}
