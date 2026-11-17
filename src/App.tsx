import * as React from "react"
import GardenApp from "@/garden/GardenApp"
import { NC2OA4Wireframe } from "@/components/math/NC2OA4Wireframe"
import { NC2OA3Wireframe } from "@/components/math/NC2OA3Wireframe"
import { NC2GWireframe } from "@/components/math/NC2GWireframe"
import { loadStudentProfile, setThemePreference, type StudentTheme } from "@/lib/storage/profile"

export type DeskTheme = StudentTheme
export type ActiveStandard = "arrays" | "parity" | "geometry" | "garden"

export default function App() {
  const [activeStandard, setActiveStandard] = React.useState<ActiveStandard>(() => {
    try {
      const stored = localStorage.getItem("egm_active_standard")
      if (
        stored === "arrays" ||
        stored === "parity" ||
        stored === "geometry" ||
        stored === "garden"
      ) {
        return stored
      }
    } catch {
      // Storage access may be blocked
    }
    return "garden"
  })

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

  if (activeStandard === "garden") {
    return <GardenApp />
  }

  if (activeStandard === "parity") {
    return (
      <NC2OA3Wireframe
        theme={theme}
        onSetTheme={setTheme}
        onSwitchToArrays={() => setActiveStandard("arrays")}
        onSwitchToGeometry={() => setActiveStandard("geometry")}
      />
    )
  }

  if (activeStandard === "geometry") {
    return (
      <NC2GWireframe
        theme={theme}
        onSetTheme={setTheme}
        onSwitchToArrays={() => setActiveStandard("arrays")}
        onSwitchToParity={() => setActiveStandard("parity")}
      />
    )
  }

  return (
    <NC2OA4Wireframe
      theme={theme}
      onSetTheme={setTheme}
      onSwitchToParity={() => setActiveStandard("parity")}
      onSwitchToGeometry={() => setActiveStandard("geometry")}
    />
  )
}
