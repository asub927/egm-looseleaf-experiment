import * as React from "react"
import { NC2OA4Wireframe } from "@/components/math/NC2OA4Wireframe"
import { NC2OA3Wireframe } from "@/components/math/NC2OA3Wireframe"
import { NC2GWireframe } from "@/components/math/NC2GWireframe"
import { useDeskViewTransition } from "@/lib/dom/view-transitions"
import { loadStudentProfile, setThemePreference, type StudentTheme } from "@/lib/storage/profile"

export type DeskTheme = StudentTheme
export type ActiveStandard = "arrays" | "parity" | "geometry"

export default function App() {
  const { startDeskTransition } = useDeskViewTransition()

  const [activeStandard, setActiveStandard] = React.useState<ActiveStandard>(() => {
    try {
      const stored = localStorage.getItem("egm_active_standard")
      if (stored === "arrays" || stored === "parity" || stored === "geometry") {
        return stored
      }
    } catch {
      // Storage access may be blocked
    }
    return "geometry"
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
    <div className="desk-stage w-full h-full min-h-screen">
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
  )
}
