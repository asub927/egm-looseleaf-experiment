import * as React from "react"
import GardenApp from "@/garden/GardenApp"
import { ZenGardenLanding } from "@/components/landing/ZenGardenLanding"
import { useDeskViewTransition } from "@/lib/dom/view-transitions"
import { loadStudentProfile, setThemePreference, type StudentTheme } from "@/lib/storage/profile"
import { cn } from "@/lib/utils"

export type DeskTheme = StudentTheme
export type ActiveBoard = "toy" | "garden"
export type ActiveStandard = ActiveBoard | "landing" | "arrays" | "parity" | "geometry"

export default function App() {
  const { startDeskTransition } = useDeskViewTransition()

  // Strictly 2 Boards: Board 1 (Wooden Math Toy Studio) & Board 2 (Pip's Math Garden)
  const [activeBoard, setActiveBoard] = React.useState<ActiveBoard>(() => {
    try {
      const stored =
        localStorage.getItem("egm_active_board") || localStorage.getItem("egm_active_standard")
      if (stored === "garden") return "garden"
      if (stored === "toy" || stored === "landing") return "toy"
    } catch {
      // Storage access may be blocked
    }
    return "toy"
  })

  const switchToBoard = React.useCallback(
    (target: ActiveBoard) => {
      startDeskTransition(() => {
        setActiveBoard(target)
      })
    },
    [startDeskTransition],
  )

  const [theme, setTheme] = React.useState<DeskTheme>(() => {
    try {
      const storedTheme = localStorage.getItem("egm_desk_theme") as DeskTheme | null
      if (storedTheme) return storedTheme
    } catch {
      // Ignore
    }
    return loadStudentProfile().theme
  })

  React.useEffect(() => {
    document.documentElement.setAttribute("data-active-board", activeBoard)
    try {
      localStorage.setItem("egm_active_board", activeBoard)
      localStorage.setItem("egm_active_standard", activeBoard)
    } catch {
      // Ignore
    }
  }, [activeBoard])

  React.useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme)
    setThemePreference(theme)
    try {
      localStorage.setItem("egm_desk_theme", theme)
    } catch {
      // Ignore
    }
  }, [theme])

  return (
    <div className="desk-stage w-full h-full min-h-screen relative font-sans">
      {/* Universal 2-Board Navigation Switcher Bar (Modern Web Guidance View Transition) */}
      <nav
        aria-label="Board switcher navigation"
        className="fixed top-3.5 right-4 z-50 flex items-center gap-1.5 bg-white/95 backdrop-blur-md border border-[#bc6c25]/30 p-1 rounded-full shadow-lg"
      >
        <button
          type="button"
          onClick={() => switchToBoard("toy")}
          className={cn(
            "px-3.5 py-1.5 rounded-full text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 [text-wrap:nowrap]",
            activeBoard === "toy"
              ? "bg-[#2b2d42] text-white shadow-xs"
              : "text-[#5c4a3b] hover:text-[#2b2d42] hover:bg-[#ede7dc]",
          )}
          aria-pressed={activeBoard === "toy"}
        >
          <span>🪵</span>
          <span>Board 1: Wooden Toy</span>
        </button>

        <button
          type="button"
          onClick={() => switchToBoard("garden")}
          className={cn(
            "px-3.5 py-1.5 rounded-full text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 [text-wrap:nowrap]",
            activeBoard === "garden"
              ? "bg-[#10ac84] text-white shadow-xs"
              : "text-[#5c4a3b] hover:text-[#2b2d42] hover:bg-[#ede7dc]",
          )}
          aria-pressed={activeBoard === "garden"}
        >
          <span>🦉</span>
          <span>Board 2: Math Garden</span>
        </button>
      </nav>

      {/* Render Strictly the 2 Boards */}
      {activeBoard === "garden" ? (
        <GardenApp />
      ) : (
        <ZenGardenLanding
          onSelectGarden={() => switchToBoard("garden")}
          onSelectStandard={() => {
            const cedar = document.querySelector(".cedar-workbench")
            cedar?.scrollIntoView({ behavior: "smooth", block: "center" })
          }}
          theme={theme}
          onSetTheme={setTheme}
        />
      )}
    </div>
  )
}
