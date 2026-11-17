import * as React from "react"
import { NC2OA4Wireframe } from "@/components/math/NC2OA4Wireframe"
import { NC2OA3Wireframe } from "@/components/math/NC2OA3Wireframe"
import { NC2GWireframe } from "@/components/math/NC2GWireframe"
import { ZenGardenLanding } from "@/components/landing/ZenGardenLanding"
import GardenApp from "@/garden/GardenApp"
import { useDeskViewTransition } from "@/lib/dom/view-transitions"
import { loadStudentProfile, setThemePreference, type StudentTheme } from "@/lib/storage/profile"

export type DeskTheme = StudentTheme
export type ActiveStandard = "landing" | "arrays" | "parity" | "geometry"
export type ActiveBoard = "zen-garden" | "pips-garden" | "looseleaf-desk" | "kinetic-studio"

export default function App() {
  const { startDeskTransition } = useDeskViewTransition()

  const [activeBoard, setActiveBoard] = React.useState<ActiveBoard>(() => {
    try {
      const stored = localStorage.getItem("egm_active_board")
      if (
        stored === "zen-garden" ||
        stored === "pips-garden" ||
        stored === "looseleaf-desk" ||
        stored === "kinetic-studio"
      ) {
        return stored
      }
    } catch {
      // Storage access may be blocked
    }
    return "zen-garden"
  })

  const [activeStandard, setActiveStandard] = React.useState<ActiveStandard>(() => {
    try {
      const stored = localStorage.getItem("egm_active_standard")
      if (
        stored === "landing" ||
        stored === "arrays" ||
        stored === "parity" ||
        stored === "geometry"
      ) {
        return stored
      }
    } catch {
      // Storage access may be blocked
    }
    return "landing"
  })

  const switchToStandard = React.useCallback(
    (target: ActiveStandard) => {
      startDeskTransition(() => {
        setActiveStandard(target)
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
    try {
      localStorage.setItem("egm_active_board", activeBoard)
    } catch {
      // Ignore
    }
  }, [activeBoard])

  React.useEffect(() => {
    document.documentElement.setAttribute("data-active-standard", activeStandard)
    try {
      localStorage.setItem("egm_active_standard", activeStandard)
    } catch {
      // Ignore
    }
  }, [activeStandard])

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
    <div className="desk-stage w-full h-full min-h-screen relative flex flex-col">
      {/* Top Design Board Comparison Switcher */}
      <header className="sticky top-0 z-50 w-full bg-[#2c2724]/92 backdrop-blur-md border-b border-[#4a3e35]/50 text-[#f7f3ea] px-3.5 py-2 flex flex-wrap items-center justify-between gap-2 shadow-md">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono tracking-wider uppercase text-[#ffa502] font-black bg-[#ffa502]/15 px-2 py-0.5 rounded border border-[#ffa502]/30">
            Design Studio
          </span>
          <span className="text-xs font-medium text-[#d4c9b9] hidden sm:inline">
            Compare Active Paradigms
          </span>
        </div>

        <nav
          className="flex items-center gap-1.5 overflow-x-auto text-xs font-semibold py-0.5"
          aria-label="Design Boards"
        >
          <button
            type="button"
            onClick={() => setActiveBoard("zen-garden")}
            className={`px-3 py-1 rounded-full transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeBoard === "zen-garden"
                ? "bg-[#ffa502] text-[#2c2724] font-extrabold shadow-sm scale-102"
                : "bg-white/10 text-[#f7f3ea] hover:bg-white/20"
            }`}
            title="Board 1: Zen Garden Sanctuary with Montessori Dovetail Joinery Toy"
          >
            <span>⛩️</span>
            <span>Board 1: Zen Garden</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveBoard("pips-garden")}
            className={`px-3 py-1 rounded-full transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeBoard === "pips-garden"
                ? "bg-[#10ac84] text-white font-extrabold shadow-sm scale-102"
                : "bg-white/10 text-[#f7f3ea] hover:bg-white/20"
            }`}
            title="Board 2: Pip's Math Garden (from feat/pips-math-garden)"
          >
            <span>🦉</span>
            <span>Board 2: Pip's Garden</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveBoard("looseleaf-desk")}
            className={`px-3 py-1 rounded-full transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeBoard === "looseleaf-desk"
                ? "bg-[#1e90ff] text-white font-extrabold shadow-sm scale-102"
                : "bg-white/10 text-[#f7f3ea] hover:bg-white/20"
            }`}
            title="Board 3: Classic Looseleaf Classroom Desk (NC.2.OA.3, NC.2.OA.4, NC.2.G.3)"
          >
            <span>📐</span>
            <span>Board 3: Looseleaf Desk</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveBoard("kinetic-studio")}
            className={`px-3 py-1 rounded-full transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeBoard === "kinetic-studio"
                ? "bg-[#ee5253] text-white font-extrabold shadow-sm scale-102"
                : "bg-white/10 text-[#f7f3ea] hover:bg-white/20"
            }`}
            title="Board 4: Kinetic Toy Studio (Wood Joinery vs Ripple Pond vs Brass Ratchet)"
          >
            <span>🪵</span>
            <span>Board 4: Kinetic Studio</span>
          </button>
        </nav>
      </header>

      {/* Board 1: Zen Garden Sanctuary & Dovetail Joinery */}
      {activeBoard === "zen-garden" && (
        <div className="w-full flex-1">
          {activeStandard === "landing" ? (
            <ZenGardenLanding
              onSelectStandard={switchToStandard}
              theme={theme}
              onSetTheme={setTheme}
            />
          ) : activeStandard === "parity" ? (
            <NC2OA3Wireframe
              theme={theme}
              onSetTheme={setTheme}
              onSwitchToArrays={() => switchToStandard("arrays")}
              onSwitchToGeometry={() => switchToStandard("geometry")}
            />
          ) : activeStandard === "geometry" ? (
            <NC2GWireframe
              theme={theme}
              onSetTheme={setTheme}
              onSwitchToArrays={() => switchToStandard("arrays")}
              onSwitchToParity={() => switchToStandard("parity")}
            />
          ) : (
            <NC2OA4Wireframe
              theme={theme}
              onSetTheme={setTheme}
              onSwitchToParity={() => switchToStandard("parity")}
              onSwitchToGeometry={() => switchToStandard("geometry")}
            />
          )}

          {activeStandard !== "landing" && (
            <button
              type="button"
              onClick={() => switchToStandard("landing")}
              className="fixed bottom-4 left-4 z-50 flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/95 border border-[#bc6c25]/30 text-[#4a3e35] text-xs font-extrabold shadow-lg hover:bg-[#ede7dc] hover:scale-105 active:scale-95 transition-all cursor-pointer backdrop-blur-md"
              title="Return to Zen Garden of Learning"
              aria-label="Return to Zen Garden of Learning"
            >
              <span className="text-[#bc6c25]">⛩️</span>
              <span>Zen Garden</span>
            </button>
          )}
        </div>
      )}

      {/* Board 2: Pip's Math Garden (from feat/pips-math-garden) */}
      {activeBoard === "pips-garden" && (
        <div className="w-full flex-1 bg-[#fbf7ee]">
          <GardenApp />
        </div>
      )}

      {/* Board 3: Classic Looseleaf Classroom Desk */}
      {activeBoard === "looseleaf-desk" && (
        <div className="w-full flex-1">
          <div className="bg-white/80 border-b border-[#e5e0d8] px-4 py-2 flex items-center justify-between text-xs font-semibold backdrop-blur-sm">
            <span className="text-[#6b5e51]">Looseleaf NC Grade 2 Standard:</span>
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={() => switchToStandard("geometry")}
                className={`px-2.5 py-1 rounded border transition-all ${
                  activeStandard === "geometry"
                    ? "bg-[#10ac84] text-white border-[#10ac84]"
                    : "bg-white text-[#4a3e35] border-[#d8d0c5] hover:bg-[#f6f2eb]"
                }`}
              >
                NC.2.G.3 (Geometry)
              </button>
              <button
                type="button"
                onClick={() => switchToStandard("arrays")}
                className={`px-2.5 py-1 rounded border transition-all ${
                  activeStandard === "arrays"
                    ? "bg-[#ffa502] text-[#2c2724] border-[#ffa502]"
                    : "bg-white text-[#4a3e35] border-[#d8d0c5] hover:bg-[#f6f2eb]"
                }`}
              >
                NC.2.OA.4 (Arrays)
              </button>
              <button
                type="button"
                onClick={() => switchToStandard("parity")}
                className={`px-2.5 py-1 rounded border transition-all ${
                  activeStandard === "parity"
                    ? "bg-[#1e90ff] text-white border-[#1e90ff]"
                    : "bg-white text-[#4a3e35] border-[#d8d0c5] hover:bg-[#f6f2eb]"
                }`}
              >
                NC.2.OA.3 (Parity)
              </button>
            </div>
          </div>
          {activeStandard === "parity" ? (
            <NC2OA3Wireframe
              theme={theme}
              onSetTheme={setTheme}
              onSwitchToArrays={() => switchToStandard("arrays")}
              onSwitchToGeometry={() => switchToStandard("geometry")}
            />
          ) : activeStandard === "geometry" ? (
            <NC2GWireframe
              theme={theme}
              onSetTheme={setTheme}
              onSwitchToArrays={() => switchToStandard("arrays")}
              onSwitchToParity={() => switchToStandard("parity")}
            />
          ) : (
            <NC2OA4Wireframe
              theme={theme}
              onSetTheme={setTheme}
              onSwitchToParity={() => switchToStandard("parity")}
              onSwitchToGeometry={() => switchToStandard("geometry")}
            />
          )}
        </div>
      )}

      {/* Board 4: Kinetic Toy Studio (Wood Joinery vs Ripple Pond vs Brass Ratchet) */}
      {activeBoard === "kinetic-studio" && (
        <div className="w-full flex-1 h-[calc(100vh-45px)]">
          <iframe
            src="/tactile-toy-studio.html"
            className="w-full h-full border-0"
            title="Tactile Toy Studio: Kinetic Physics Comparison"
          />
        </div>
      )}
    </div>
  )
}
